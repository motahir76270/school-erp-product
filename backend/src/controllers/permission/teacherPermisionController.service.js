// src/controllers/teacherPermissionController.js
import { eq, and, or, sql, like, inArray } from "drizzle-orm";
import { db } from "../../db/db.js";
import { teacherPermission,teachers } from "../../db/schema/users.js";
import { errorResponse, successResponse } from "../../lib/response.js";
import { v4 as uuidv4 } from 'uuid';

// ==================== GET all teacher permissions ====================
export const getAllTeacherPermissions = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    // Step 1: Get all unique teacher IDs having permissions
    const permissionTeachers = await db
      .selectDistinct({
        teacherId: teacherPermission.teacherId,
      })
      .from(teacherPermission);

    const teacherIds = permissionTeachers.map((item) => item.teacherId);

    // No permission records
    if (teacherIds.length === 0) {
      return successResponse(
        res,
        {
          teachers: [],
          pagination: {
            currentPage: pageNum,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limitNum,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
        "Teacher permissions fetched successfully",
        200
      );
    }

    const whereConditions = [
      inArray(teachers.id, teacherIds),
    ];

    // Search
    if (search) {
      whereConditions.push(
        or(
          like(teachers.name, `%${search}%`),
          like(teachers.email, `%${search}%`)
        )
      );
    }

    const whereClause = and(...whereConditions);

    // Total count
    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(teachers)
      .where(whereClause);

    const totalCount = Number(totalResult[0]?.count ?? 0);

    // Fetch teachers with permissions
    const teacherData = await db.query.teachers.findMany({
      where: whereClause,
      with: {
        permission: true,
      },
      limit: limitNum,
      offset,
    });

    return successResponse(
      res,
      {
        teachers: teacherData,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalItems: totalCount,
          itemsPerPage: limitNum,
          hasNextPage: pageNum * limitNum < totalCount,
          hasPrevPage: pageNum > 1,
        },
      },
      "Teacher permissions fetched successfully",
      200
    );
  } catch (error) {
    console.error(error);

    return errorResponse(
      res,
      error.message || "Failed to fetch teacher permissions",
      500
    );
  }
};

// ==================== GET teacher permission by ID ====================
export const getTeacherPermissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await db
      .select()
      .from(teacherPermission)
      .where(eq(teacherPermission.id, id));

    if (!permission || permission.length === 0) {
      return errorResponse(res, "Teacher permission not found", 404);
    }

    return successResponse(
      res,
      permission[0],
      "Teacher permission fetched successfully",
      200
    );
  } catch (error) {
    console.error("Error fetching teacher permission:", error);
    return errorResponse(
      res,
      error.message || "Failed to fetch teacher permission",
      500
    );
  }
};

// ==================== POST create teacher permission ====================
export const createTeacherPermission = async (req, res) => {
  try {
    const { 
      userId, 
      teacherId, 
      attendance, 
      subject, 
      classes, 
      exam ,
      fee
    } = req.body;

    // Validate required fields
    if (!userId || !teacherId) {
      return errorResponse(
        res,
        "userId and teacherId are required",
        400
      );
    }

    // Check if permission already exists
    const existing = await db
      .select()
      .from(teacherPermission)
      .where(
        and(
          eq(teacherPermission.userId, userId),
          eq(teacherPermission.teacherId, teacherId)
        )
      );

    if (existing && existing.length > 0) {
      return errorResponse(
        res,
        "Permission already exists for this teacher",
        409
      );
    }

    const id = uuidv4();
    const newPermission = {
      id,
      userId,
      teacherId,
      attendance: attendance !== undefined ? attendance : false,
      subject: subject !== undefined ? subject : false,
      classes: classes !== undefined ? classes : false,
      exam: exam !== undefined ? exam : false,
      fee: fee !== undefined ? fee : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(teacherPermission).values(newPermission);

    return successResponse(
      res,
      newPermission,
      "Teacher permission created successfully",
      201
    );
  } catch (error) {
    console.error("Error creating teacher permission:", error);
    return errorResponse(
      res,
      error.message || "Failed to create teacher permission",
      500
    );
  }
};

// ==================== PUT update teacher permission ====================
export const updateTeacherPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance, subject, classes, exam ,fee} = req.body;

    // Check if permission exists
    const [existing] = await db
      .select()
      .from(teacherPermission)
      .where(eq(teacherPermission.id, id));

    if (!existing) {
      return errorResponse(res, "Teacher permission not found", 404);
    }

    // Build update data
    const updateData = {
      updatedAt: new Date(),
    };

    if (attendance !== undefined) updateData.attendance = attendance;
    if (subject !== undefined) updateData.subject = subject;
    if (classes !== undefined) updateData.classes = classes;
    if (exam !== undefined) updateData.exam = exam;
    if (fee !== undefined) updateData.fee = fee;


    // Update permission
    await db
      .update(teacherPermission)
      .set(updateData)
      .where(eq(teacherPermission.id, id));

    // Fetch updated record
    const [updated] = await db
      .select()
      .from(teacherPermission)
      .where(eq(teacherPermission.id, id));

    return successResponse(
      res,
      updated,
      "Teacher permission updated successfully",
      200
    );
  } catch (error) {
    console.error("Error updating teacher permission:", error);
    return errorResponse(
      res,
      error.message || "Failed to update teacher permission",
      500
    );
  }
};

// ==================== PATCH update teacher permission status ====================
export const updateTeacherPermissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission, value } = req.body;

    const validPermissions = ['attendance', 'subject', 'classes', 'exam' , 'fee'];
    
    if (!permission || !validPermissions.includes(permission)) {
      return errorResponse(
        res,
        "Valid permission field is required: attendance, subject, classes, exam",
        400
      );
    }

    if (value === undefined || typeof value !== 'boolean') {
      return errorResponse(
        res,
        "Value must be a boolean",
        400
      );
    }

    // Check if permission exists
    const existing = await db
      .select()
      .from(teacherPermission)
      .where(eq(teacherPermission.id, id));

    if (!existing || existing.length === 0) {
      return errorResponse(res, "Teacher permission not found", 404);
    }

    // Update specific permission
    const updateData = {
      [permission]: value,
      updatedAt: new Date(),
    };

    await db
      .update(teacherPermission)
      .set(updateData)
      .where(eq(teacherPermission.id, id));

    // Fetch updated record
    const updated = await db
      .select()
      .from(teacherPermission)
      .where(eq(teacherPermission.id, id));

    return successResponse(
      res,
      updated[0],
      `Teacher ${permission} permission ${value ? 'enabled' : 'disabled'} successfully`,
      200
    );
  } catch (error) {
    console.error("Error updating teacher permission status:", error);
    return errorResponse(
      res,
      error.message || "Failed to update teacher permission status",
      500
    );
  }
};

// ==================== DELETE teacher permission ====================
export const deleteTeacherPermission = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if permission exists
    const existing = await db
      .select()
      .from(teacherPermission)
      .where(eq(teacherPermission.id, id));

    if (!existing || existing.length === 0) {
      return errorResponse(res, "Teacher permission not found", 404);
    }

    // Delete permission
    await db
      .delete(teacherPermission)
      .where(eq(teacherPermission.id, id));

    return successResponse(
      res,
      null,
      "Teacher permission deleted successfully",
      200
    );
  } catch (error) {
    console.error("Error deleting teacher permission:", error);
    return errorResponse(
      res,
      error.message || "Failed to delete teacher permission",
      500
    );
  }
};

// ==================== Bulk create teacher permissions ====================
export const bulkCreateTeacherPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return errorResponse(
        res,
        "Valid permissions array is required",
        400
      );
    }

    const createdPermissions = [];
    const errors = [];

    for (const perm of permissions) {
      try {
        const { userId, teacherId, attendance, subject, classes, exam } = perm;

        if (!userId || !teacherId) {
          errors.push({ 
            data: perm, 
            error: "userId and teacherId are required" 
          });
          continue;
        }

        // Check if permission already exists
        const existing = await db
          .select()
          .from(teacherPermission)
          .where(
            and(
              eq(teacherPermission.userId, userId),
              eq(teacherPermission.teacherId, teacherId)
            )
          );

        if (existing && existing.length > 0) {
          errors.push({ 
            data: perm, 
            error: "Permission already exists for this teacher" 
          });
          continue;
        }

        const id = uuidv4();
        const newPermission = {
          id,
          userId,
          teacherId,
          attendance: attendance !== undefined ? attendance : false,
          subject: subject !== undefined ? subject : false,
          classes: classes !== undefined ? classes : false,
          exam: exam !== undefined ? exam : false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(teacherPermission).values(newPermission);
        createdPermissions.push(newPermission);
      } catch (error) {
        errors.push({ data: perm, error: error.message });
      }
    }

    return successResponse(
      res,
      {
        created: createdPermissions,
        errors: errors,
        total: permissions.length,
        successCount: createdPermissions.length,
        errorCount: errors.length,
      },
      `Created ${createdPermissions.length} teacher permissions`,
      201
    );
  } catch (error) {
    console.error("Error bulk creating teacher permissions:", error);
    return errorResponse(
      res,
      error.message || "Failed to create teacher permissions",
      500
    );
  }
};