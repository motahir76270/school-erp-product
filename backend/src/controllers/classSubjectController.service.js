// src/controllers/classSubjectController.js
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/db.js";
import { classSubjects, subjects, classes } from "../db/schema/users.js";
import { successResponse, errorResponse } from "../lib/response.js";

// ==================== ASSIGN SUBJECT TO CLASS ====================
export const assignSubjectToClass = async (req, res) => {
  try {
    const { classId, subjectId, teacherId } = req.body;

    // Validate required fields
    if (!classId || !subjectId) {
      return errorResponse(
        res,
        "Required fields missing: classId, subjectId",
        400,
      );
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

    // Check if class exists
    const [classData] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!classData) {
      return errorResponse(res, "Class not found", 404);
    }

    // Check if subject is already assigned to this class
    const existingAssignment = await db
      .select()
      .from(classSubjects)
      .where(
        and(
          eq(classSubjects.classId, classId),
          eq(classSubjects.subjectId, subjectId),
        ),
      )
      .limit(1);

    if (existingAssignment.length > 0) {
      return errorResponse(
        res,
        "Subject is already assigned to this class",
        409,
      );
    }

    const assignmentId = uuidv4();

    const [newAssignment] = await db
      .insert(classSubjects)
      .values({
        id: assignmentId,
        classId: classId,
        subjectId: subjectId,
        teacherId: teacherId || null,
      })
      .returning();

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

// ==================== GET SUBJECTS BY CLASS ====================
export const getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId) {
      return errorResponse(res, "Class ID is required", 400);
    }

    // Get class subject assignments
    const assignments = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.classId, classId));

    if (assignments.length === 0) {
      return successResponse(
        res,
        {
          classId: classId,
          subjects: [],
          totalSubjects: 0,
        },
        "No subjects assigned to this class",
        200,
      );
    }

    // Get subject details for each assignment
    const subjectsWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
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
        subjects: subjectsWithDetails,
        totalSubjects: subjectsWithDetails.length,
      },
      "Subjects fetched by class successfully",
      200,
    );
  } catch (error) {
    console.error("Get subjects by class error:", error);
    return errorResponse(res, error.message || "Failed to get subjects", 500);
  }
};

// ==================== GET CLASSES BY SUBJECT ====================
export const getClassesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!subjectId) {
      return errorResponse(res, "Subject ID is required", 400);
    }

    // Get class subject assignments
    const assignments = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.subjectId, subjectId));

    if (assignments.length === 0) {
      return successResponse(
        res,
        {
          subjectId: subjectId,
          classes: [],
          totalClasses: 0,
        },
        "Subject not assigned to any class",
        200,
      );
    }

    // Get class details for each assignment
    const classesWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const [classData] = await db
          .select()
          .from(classes)
          .where(eq(classes.id, assignment.classId))
          .limit(1);

        return {
          assignment: assignment,
          class: classData || null,
        };
      }),
    );

    return successResponse(
      res,
      {
        subjectId: subjectId,
        classes: classesWithDetails,
        totalClasses: classesWithDetails.length,
      },
      "Classes fetched by subject successfully",
      200,
    );
  } catch (error) {
    console.error("Get classes by subject error:", error);
    return errorResponse(res, error.message || "Failed to get classes", 500);
  }
};

// ==================== UPDATE CLASS SUBJECT ASSIGNMENT ====================
export const updateClassSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;

    if (!id) {
      return errorResponse(res, "Assignment ID is required", 400);
    }

    const [existingAssignment] = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.id, id))
      .limit(1);

    if (!existingAssignment) {
      return errorResponse(res, "Assignment not found", 404);
    }

    const updateData = {};
    if (teacherId !== undefined) updateData.teacherId = teacherId;

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, "No data provided for update", 400);
    }

    const [updatedAssignment] = await db
      .update(classSubjects)
      .set(updateData)
      .where(eq(classSubjects.id, id))
      .returning();

    if (!updatedAssignment) {
      return errorResponse(res, "Failed to update assignment", 500);
    }

    return successResponse(
      res,
      updatedAssignment,
      "Class subject assignment updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update class subject error:", error);
    return errorResponse(
      res,
      error.message || "Failed to update assignment",
      500,
    );
  }
};

// ==================== REMOVE SUBJECT FROM CLASS ====================
export const removeSubjectFromClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Assignment ID is required", 400);
    }

    const [existingAssignment] = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.id, id))
      .limit(1);

    if (!existingAssignment) {
      return errorResponse(res, "Assignment not found", 404);
    }

    await db.delete(classSubjects).where(eq(classSubjects.id, id));

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

// ==================== GET ALL CLASS SUBJECTS ====================
export const getAllClassSubjects = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const allAssignments = await db
      .select()
      .from(classSubjects)
      .limit(limit)
      .offset(offset);

    const total = allAssignments.length;

    // Get details for each assignment
    const assignmentsWithDetails = await Promise.all(
      allAssignments.map(async (assignment) => {
        const [subject] = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, assignment.subjectId))
          .limit(1);

        const [classData] = await db
          .select()
          .from(classes)
          .where(eq(classes.id, assignment.classId))
          .limit(1);

        return {
          ...assignment,
          subject: subject || null,
          class: classData || null,
        };
      }),
    );

    return successResponse(
      res,
      {
        assignments: assignmentsWithDetails,
        pagination: {
          limit,
          offset,
          total,
          hasMore: total === limit,
        },
      },
      "Class subjects fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get all class subjects error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get class subjects",
      500,
    );
  }
};

// ==================== BULK ASSIGN SUBJECTS TO CLASS ====================
export const bulkAssignSubjectsToClass = async (req, res) => {
  try {
    const { classId, subjects: subjectList } = req.body;

    if (
      !classId ||
      !subjectList ||
      !Array.isArray(subjectList) ||
      subjectList.length === 0
    ) {
      return errorResponse(
        res,
        "Required fields missing: classId, subjects array",
        400,
      );
    }

    // Check if class exists
    const [classData] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!classData) {
      return errorResponse(res, "Class not found", 404);
    }

    const assignments = [];

    for (const item of subjectList) {
      const { subjectId, teacherId } = item;

      // Check if subject exists
      const [subject] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, subjectId))
        .limit(1);

      if (!subject) {
        continue; // Skip if subject not found
      }

      // Check if already assigned
      const existingAssignment = await db
        .select()
        .from(classSubjects)
        .where(
          and(
            eq(classSubjects.classId, classId),
            eq(classSubjects.subjectId, subjectId),
          ),
        )
        .limit(1);

      if (existingAssignment.length > 0) {
        continue; // Skip if already assigned
      }

      const [newAssignment] = await db
        .insert(classSubjects)
        .values({
          id: uuidv4(),
          classId: classId,
          subjectId: subjectId,
          teacherId: teacherId || null,
        })
        .returning();

      if (newAssignment) {
        assignments.push(newAssignment);
      }
    }

    return successResponse(
      res,
      {
        classId: classId,
        assigned: assignments,
        totalAssigned: assignments.length,
      },
      "Bulk subjects assigned to class successfully",
      201,
    );
  } catch (error) {
    console.error("Bulk assign subjects error:", error);
    return errorResponse(
      res,
      error.message || "Failed to assign subjects",
      500,
    );
  }
};
