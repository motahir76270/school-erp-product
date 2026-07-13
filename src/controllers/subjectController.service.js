
import { eq ,and, count} from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/db.js";
import { subjects, classSubjects } from "../db/schema/users.js";
import { successResponse, errorResponse } from "../lib/response.js";

// ==================== CREATE SUBJECT ====================
export const createSubject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, code, type, maxMarks, passMarks } = req.body;

    // Validate required fields
    if (!name || !code) {
      return errorResponse(res, "Required fields missing: name, code", 400);
    }

    // Check if subject exists by name
    const existingSubjectByName = await db
      .select()
      .from(subjects)
      .where(eq(subjects.name, name))
      .limit(1);

    if (existingSubjectByName.length > 0) {
      return errorResponse(res, "Subject with this name already exists", 409);
    }

    // Check if subject exists by code
    const existingSubjectByCode = await db
      .select()
      .from(subjects)
      .where(eq(subjects.code, code))
      .limit(1);

    if (existingSubjectByCode.length > 0) {
      return errorResponse(res, "Subject with this code already exists", 409);
    }

    const subjectId = uuidv4();

    // Insert subject
    await db.insert(subjects).values({
      id: subjectId,
      userId:userId,
      name: name,
      code: code,
      type: type || "theory",
      maxMarks: maxMarks || 100,
      passMarks: passMarks || 33,
      status: "active",
    });

    // Fetch created subject
    const [newSubject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId))
      .limit(1);

    if (!newSubject) {
      return errorResponse(res, "Failed to create subject", 500);
    }

    return successResponse(
      res,
      newSubject,
      "Subject created successfully",
      201,
    );
  } catch (error) {
    console.error("Create subject error:", error);
    return errorResponse(res, error.message || "Failed to create subject", 500);
  }
};

// ==================== GET ALL SUBJECTS ====================

export const getAllSubjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const status = req.query.status;
    const type = req.query.type;

    const conditions = [];

    if (status) {
      conditions.push(eq(subjects.status, status));
    }

    if (type) {
      conditions.push(eq(subjects.type, type));
    }

    let query = db.select().from(subjects);
    let countQuery = db.select({ total: count() }).from(subjects);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    const allSubjects = await query.limit(limit).offset(offset);

    const [{ total }] = await countQuery;

    return successResponse(
      res,
      {
        subjects: allSubjects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
      },
      "Subjects fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get all subjects error:", error);
    return errorResponse(res, error.message || "Failed to get subjects", 500);
  }
};

// ==================== GET SUBJECT BY ID ====================
export const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Subject ID is required", 400);
    }

    const [subject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);

    if (!subject) {
      return errorResponse(res, "Subject not found", 404);
    }

    // Get classes where this subject is assigned
    const assignedClasses = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.subjectId, id));

    const subjectWithClasses = {
      ...subject,
      assignedClasses: assignedClasses,
      totalClasses: assignedClasses.length,
    };

    return successResponse(
      res,
      subjectWithClasses,
      "Subject fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get subject error:", error);
    return errorResponse(res, error.message || "Failed to get subject", 500);
  }
};

// ==================== UPDATE SUBJECT ====================
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, type, maxMarks, passMarks, status } = req.body;

    if (!id) {
      return errorResponse(res, "Subject ID is required", 400);
    }

    const [existingSubject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);

    if (!existingSubject) {
      return errorResponse(res, "Subject not found", 404);
    }

    // Check if name is unique (if changed)
    if (name && name !== existingSubject.name) {
      const existingSubjectByName = await db
        .select()
        .from(subjects)
        .where(eq(subjects.name, name))
        .limit(1);

      if (existingSubjectByName.length > 0) {
        return errorResponse(res, "Subject with this name already exists", 409);
      }
    }

    // Check if code is unique (if changed)
    if (code && code !== existingSubject.code) {
      const existingSubjectByCode = await db
        .select()
        .from(subjects)
        .where(eq(subjects.code, code))
        .limit(1);

      if (existingSubjectByCode.length > 0) {
        return errorResponse(res, "Subject with this code already exists", 409);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (type !== undefined) updateData.type = type;
    if (maxMarks !== undefined) updateData.maxMarks = maxMarks;
    if (passMarks !== undefined) updateData.passMarks = passMarks;
    if (status !== undefined) updateData.status = status;
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 1) {
      return errorResponse(res, "No data provided for update", 400);
    }

    // Update subject
    await db.update(subjects).set(updateData).where(eq(subjects.id, id));

    // Fetch updated subject
    const [updatedSubject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);

    if (!updatedSubject) {
      return errorResponse(res, "Failed to retrieve updated subject", 500);
    }

    return successResponse(
      res,
      updatedSubject,
      "Subject updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update subject error:", error);
    return errorResponse(res, error.message || "Failed to update subject", 500);
  }
};

// ==================== DELETE SUBJECT (SOFT) ====================
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Subject ID is required", 400);
    }

    const [existingSubject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);

    if (!existingSubject) {
      return errorResponse(res, "Subject not found", 404);
    }

    // Check if subject is assigned to any class
    const assignedClasses = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.subjectId, id));

    if (assignedClasses.length > 0) {
      return errorResponse(
        res,
        "Cannot delete subject. It is assigned to classes. Remove from classes first.",
        400,
      );
    }

    await db
      .update(subjects)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(eq(subjects.id, id));

    return successResponse(res, null, "Subject deactivated successfully", 200);
  } catch (error) {
    console.error("Delete subject error:", error);
    return errorResponse(res, error.message || "Failed to delete subject", 500);
  }
};

// ==================== HARD DELETE SUBJECT ====================
export const hardDeleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Subject ID is required", 400);
    }

    const [existingSubject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);

    if (!existingSubject) {
      return errorResponse(res, "Subject not found", 404);
    }

    // Check if subject is assigned to any class
    const assignedClasses = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.subjectId, id));

    if (assignedClasses.length > 0) {
      return errorResponse(
        res,
        "Cannot delete subject. It is assigned to classes. Remove from classes first.",
        400,
      );
    }

    await db.delete(subjects).where(eq(subjects.id, id));

    return successResponse(res, null, "Subject deleted permanently", 200);
  } catch (error) {
    console.error("Hard delete subject error:", error);
    return errorResponse(res, error.message || "Failed to delete subject", 500);
  }
};

// ==================== UPDATE SUBJECT STATUS ====================
export const updateSubjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return errorResponse(res, "Subject ID and status are required", 400);
    }

    if (!["active", "inactive"].includes(status)) {
      return errorResponse(
        res,
        "Invalid status. Must be: active, inactive",
        400,
      );
    }

    const [existingSubject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);

    if (!existingSubject) {
      return errorResponse(res, "Subject not found", 404);
    }

    await db
      .update(subjects)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(subjects.id, id));

    // Fetch updated subject
    const [updatedSubject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);

    if (!updatedSubject) {
      return errorResponse(res, "Failed to retrieve updated subject", 500);
    }

    return successResponse(
      res,
      { status: updatedSubject.status },
      "Subject status updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update subject status error:", error);
    return errorResponse(
      res,
      error.message || "Failed to update subject status",
      500,
    );
  }
};

// ==================== ASSIGN SUBJECT TO CLASS ====================
export const assignSubjectToClass = async (req, res) => {
  try {
    const { subjectId, classId, userId } = req.body;

    if (!subjectId || !classId) {
      return errorResponse(res, "subjectId and classId are required", 400);
    }

    // Check if subject exists
    const [subject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId))
      .limit(1);

    if (!subject) {
      return errorResponse(res, "Subject not found", 404);
    }

    // Check if subject is active
    if (subject.status !== "active") {
      return errorResponse(res, "Subject is not active", 400);
    }

    // Check if assignment already exists
    const existingAssignment = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.subjectId, subjectId))
      .where(eq(classSubjects.classId, classId))
      .limit(1);

    if (existingAssignment.length > 0) {
      return errorResponse(res, "Subject already assigned to this class", 409);
    }

    const assignmentId = uuidv4();

    // Insert assignment
    await db.insert(classSubjects).values({
      id: assignmentId,
      subjectId: subjectId,
      classId: classId,
      userId: userId || null,
      status: "active",
    });

    // Fetch created assignment
    const [newAssignment] = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.id, assignmentId))
      .limit(1);

    if (!newAssignment) {
      return errorResponse(res, "Failed to assign subject to class", 500);
    }

    return successResponse(
      res,
      newAssignment,
      "Subject assigned to class successfully",
      201,
    );
  } catch (error) {
    console.error("Assign subject to class error:", error);
    return errorResponse(res, error.message || "Failed to assign subject", 500);
  }
};

// ==================== REMOVE SUBJECT FROM CLASS ====================
export const removeSubjectFromClass = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!assignmentId) {
      return errorResponse(res, "Assignment ID is required", 400);
    }

    const [existingAssignment] = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.id, assignmentId))
      .limit(1);

    if (!existingAssignment) {
      return errorResponse(res, "Assignment not found", 404);
    }

    // Soft delete
    await db
      .update(classSubjects)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(eq(classSubjects.id, assignmentId));

    return successResponse(
      res,
      null,
      "Subject removed from class successfully",
      200,
    );
  } catch (error) {
    console.error("Remove subject from class error:", error);
    return errorResponse(res, error.message || "Failed to remove subject", 500);
  }
};

// ==================== GET CLASS SUBJECTS ====================
export const getClassSubjects = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId) {
      return errorResponse(res, "Class ID is required", 400);
    }

    const classSubjectAssignments = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.classId, classId))
      .where(eq(classSubjects.status, "active"));

    // Get subject details for each assignment
    const classSubjectsWithDetails = await Promise.all(
      classSubjectAssignments.map(async (assignment) => {
        const [subject] = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, assignment.subjectId))
          .limit(1);

        return {
          assignment: assignment,
          subject: subject || null,
        };
      }),
    );

    return successResponse(
      res,
      {
        classId: classId,
        subjects: classSubjectsWithDetails,
        total: classSubjectsWithDetails.length,
      },
      "Class subjects fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get class subjects error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get class subjects",
      500,
    );
  }
};

// ==================== GET SUBJECT TEACHERS ====================
export const getSubjectTeachers = async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!subjectId) {
      return errorResponse(res, "Subject ID is required", 400);
    }

    const [subject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId))
      .limit(1);

    if (!subject) {
      return errorResponse(res, "Subject not found", 404);
    }

    const assignments = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.subjectId, subjectId))
      .where(eq(classSubjects.status, "active"));

    const UsersIds = [
      ...new Set(assignments.map((a) => a.userId).filter((id) => id)),
    ];

    // You would fetch teacher details here if you have a teachers table
    // For now, just return assignment data

    return successResponse(
      res,
      {
        subjectId: subjectId,
        subjectName: subject.name,
        teacherIds: teacherIds,
        assignments: assignments,
        totalAssignments: assignments.length,
      },
      "Subject teachers fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get subject teachers error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get subject teachers",
      500,
    );
  }
};

// ==================== BULK ASSIGN SUBJECTS TO CLASS ====================
export const bulkAssignSubjectsToClass = async (req, res) => {
  try {
    const userId = req.user.id;
    const { classId, subjectIds } = req.body;

    if (
      !classId ||
      !subjectIds ||
      !Array.isArray(subjectIds) ||
      subjectIds.length === 0
    ) {
      return errorResponse(
        res,
        "classId and subjectIds array are required",
        400,
      );
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < subjectIds.length; i++) {
      const subjectId = subjectIds[i];
      const userId = teacherIds && userId[i] ? teacherIds[i] : null;

      try {
        // Check if subject exists
        const [subject] = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, subjectId))
          .limit(1);

        if (!subject) {
          errors.push({ subjectId, error: "Subject not found" });
          continue;
        }

        // Check if assignment already exists
        const existingAssignment = await db
          .select()
          .from(classSubjects)
          .where(eq(classSubjects.subjectId, subjectId))
          .where(eq(classSubjects.classId, classId))
          .limit(1);

        if (existingAssignment.length > 0) {
          errors.push({
            subjectId,
            error: "Subject already assigned to this class",
          });
          continue;
        }

        const assignmentId = uuidv4();

        await db.insert(classSubjects).values({
          id: assignmentId,
          subjectId: subjectId,
          classId: classId,
          userId: userId,
          status: "active",
        });

        // Fetch created assignment
        const [newAssignment] = await db
          .select()
          .from(classSubjects)
          .where(eq(classSubjects.id, assignmentId))
          .limit(1);

        results.push(newAssignment);
      } catch (error) {
        errors.push({ subjectId, error: error.message });
      }
    }

    return successResponse(
      res,
      {
        success: results,
        errors: errors,
        totalAttempted: subjectIds.length,
        totalSuccess: results.length,
        totalErrors: errors.length,
      },
      "Bulk assignment completed",
      200,
    );
  } catch (error) {
    console.error("Bulk assign subjects error:", error);
    return errorResponse(
      res,
      error.message || "Failed to bulk assign subjects",
      500,
    );
  }
};
