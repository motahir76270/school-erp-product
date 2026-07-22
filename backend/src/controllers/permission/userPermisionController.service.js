// src/controllers/userPermissionController.js
import { and, eq, inArray, like, or, sql} from "drizzle-orm";
import { db } from "../../db/db.js";
import { userPermission, users } from "../../db/schema/users.js";
import { errorResponse, successResponse } from "../../lib/response.js";
import { v4 as uuidv4 } from 'uuid';



// ==================== GET all user permissions ====================
export const getAllUserPermissions = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    // Step 1: Get all unique user IDs that have permissions
    const permissionUsers = await db
      .selectDistinct({
        userId: userPermission.userId,
      })
      .from(userPermission);

    const userIds = permissionUsers.map((item) => item.userId);

    // If no permissions assigned
    if (userIds.length === 0) {
      return successResponse(
        res,
        {
          users: [],
          pagination: {
            currentPage: pageNum,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limitNum,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
        "Users fetched successfully",
        200,
      );
    }

    const whereConditions = [
      inArray(users.id, userIds), // Only users having permissions
    ];

    if (search) {
      whereConditions.push(
        or(
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(users.email, `%${search}%`),
        ),
      );
    }

    const whereClause = and(...whereConditions);

    // Total users count
    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(whereClause);

    const totalCount = Number(totalResult[0]?.count ?? 0);

    // Fetch users with permissions
    const userData = await db.query.users.findMany({
      where: whereClause,
      with: {
        userPermissions: true,
      },
      limit: limitNum,
      offset,
    });

    return successResponse(
      res,
      {
        users: userData,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalItems: totalCount,
          itemsPerPage: limitNum,
          hasNextPage: pageNum * limitNum < totalCount,
          hasPrevPage: pageNum > 1,
        },
      },
      "Users fetched successfully",
      200,
    );
  } catch (error) {
    console.error(error);

    return errorResponse(res, error.message || "Failed to fetch users", 500);
  }
};


// ==================== POST create user permission ====================
export const createUserPermission = async (req, res) => {
  try {
    const { 
      userId, 
      attendance, 
      subject, 
      classes, 
      exam, 
      fee, 
      users, 
      students, 
      teachers 
    } = req.body;

    // Validate required fields
    if (!userId) {
      return errorResponse(res, "userId is required", 400);
    }

    // Check if permission already exists
    const existing = await db
      .select()
      .from(userPermission)
      .where(eq(userPermission.userId, userId));

    if (existing && existing.length > 0) {
      return errorResponse(
        res,
        "Permission already exists for this user",
        409
      );
    }

    const id = uuidv4();
    const newPermission = {
      id,
      userId,
      attendance: attendance !== undefined ? attendance : false,
      subject: subject !== undefined ? subject : false,
      classes: classes !== undefined ? classes : false,
      exam: exam !== undefined ? exam : false,
      fee: fee !== undefined ? fee : false,
      users: users !== undefined ? users : false,
      students: students !== undefined ? students : false,
      teachers: teachers !== undefined ? teachers : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(userPermission).values(newPermission);

    return successResponse(
      res,
      newPermission,
      "User permission created successfully",
      201
    );
  } catch (error) {
    console.error("Error creating user permission:", error);
    return errorResponse(
      res,
      error.message || "Failed to create user permission",
      500
    );
  }
};

// ==================== PUT update user permission ====================
export const updateUserPermission = async (req, res) => {
  try {
    const  id  = req.params;
    const { 
      attendance, 
      subject, 
      classes, 
      exam, 
      fee, 
      users, 
      students, 
      teachers 
    } = req.body;

    // Check if permission exists
    const existing = await db
      .select()
      .from(userPermission)
      .where(eq(userPermission.id, id));

    if (!existing || existing.length === 0) {
      return errorResponse(res, "User permission not found", 404);
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
    if (users !== undefined) updateData.users = users;
    if (students !== undefined) updateData.students = students;
    if (teachers !== undefined) updateData.teachers = teachers;

    // Update permission
    await db
      .update(userPermission)
      .set(updateData)
      .where(eq(userPermission.id, id));

    // Fetch updated record
    const updated = await db
      .select()
      .from(userPermission)
      .where(eq(userPermission.id, id));

    return successResponse(
      res,
      updated[0],
      "User permission updated successfully",
      200
    );
  } catch (error) {
    console.error("Error updating user permission:", error);
    return errorResponse(
      res,
      error.message || "Failed to update user permission",
      500
    );
  }
};

// ==================== PATCH update user permission status ====================
export const updateUserPermissionStatus = async (req, res) => {
  try {
    const  {id}  = req.params ;
    console.log('====================================');
    console.log(id);
    console.log('====================================');
    const { permission, value } = req.body;

    const validPermissions = [
      'attendance', 'subject', 'classes', 'exam', 
      'fee', 'users', 'students', 'teachers'
    ];
    
    if (!permission || !validPermissions.includes(permission)) {
      return errorResponse(
        res,
        `Valid permission field is required: ${validPermissions.join(', ')}`,
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
    const [existing] = await db
      .select()
      .from(userPermission)
      .where(eq(userPermission.id, id));

    if (!existing) {
      return errorResponse(res, "User permission not found", 404);
    }



    await db
      .update(userPermission)
      .set({[permission]:value})
      .where(eq(userPermission.id, id));

    // Fetch updated record
    const [updated] = await db
      .select()
      .from(userPermission)
      .where(eq(userPermission.id, id));

    return successResponse(
      res,
      updated,
      `User ${permission} permission ${value ? 'enabled' : 'disabled'} successfully`,
      200
    );
  } catch (error) {
    console.error("Error updating user permission status:", error);
    return errorResponse(
      res,
      error.message || "Failed to update user permission status",
      500
    );
  }
};

// ==================== DELETE user permission ====================
export const deleteUserPermission = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if permission exists
    const existing = await db
      .select()
      .from(userPermission)
      .where(eq(userPermission.id, id));

    if (!existing || existing.length === 0) {
      return errorResponse(res, "User permission not found", 404);
    }

    // Delete permission
    await db
      .delete(userPermission)
      .where(eq(userPermission.id, id));

    return successResponse(
      res,
      null,
      "User permission deleted successfully",
      200
    );
  } catch (error) {
    console.error("Error deleting user permission:", error);
    return errorResponse(
      res,
      error.message || "Failed to delete user permission",
      500
    );
  }
};

// ==================== Bulk create user permissions ====================
export const bulkCreateUserPermissions = async (req, res) => {
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
        const { userId, attendance, subject, classes, exam, fee, users, students, teachers } = perm;

        if (!userId) {
          errors.push({ data: perm, error: "userId is required" });
          continue;
        }

        // Check if permission already exists
        const existing = await db
          .select()
          .from(userPermission)
          .where(eq(userPermission.userId, userId));

        if (existing && existing.length > 0) {
          errors.push({ data: perm, error: "Permission already exists for this user" });
          continue;
        }

        const id = uuidv4();
        const newPermission = {
          id,
          userId,
          attendance: attendance !== undefined ? attendance : false,
          subject: subject !== undefined ? subject : false,
          classes: classes !== undefined ? classes : false,
          exam: exam !== undefined ? exam : false,
          fee: fee !== undefined ? fee : false,
          users: users !== undefined ? users : false,
          students: students !== undefined ? students : false,
          teachers: teachers !== undefined ? teachers : false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(userPermission).values(newPermission);
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
      `Created ${createdPermissions.length} user permissions`,
      201
    );
  } catch (error) {
    console.error("Error bulk creating user permissions:", error);
    return errorResponse(
      res,
      error.message || "Failed to create user permissions",
      500
    );
  }
};