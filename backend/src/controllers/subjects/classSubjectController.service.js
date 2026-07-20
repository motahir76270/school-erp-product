// controllers/subjects/classSubjectController.service.js
import { eq, and, count, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/db.js";
import { subjects, classSubjects, classes, sections } from "../../db/schema/users.js";
import { successResponse, errorResponse } from "../../lib/response.js";

// ==================== GET ALL CLASS SUBJECTS ====================
export const getAllClassSubjects = async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const allClassSubjects = await db
      .select()
      .from(classSubjects)
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const [{ total }] = await db
      .select({ total: count() })
      .from(classSubjects);

    // Get subject and class details for each assignment
    const classSubjectsWithDetails = await Promise.all(
      allClassSubjects.map(async (assignment) => {
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
      })
    );

    return successResponse(
      res,
      {
        subjects: classSubjectsWithDetails,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total,
          hasMore: offset + limit < total,
        },
      },
      "Class subjects fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get all class subjects error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get class subjects",
      500
    );
  }
};

// ==================== ASSIGN SUBJECT TO CLASS ====================
export const assignSubjectToClass = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subjectId, classId, teacherId } = req.body;

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

    if (subject.status !== "active") {
      return errorResponse(res, "Subject is not active", 400);
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

    // Check if assignment already exists
    const [existingAssignment] = await db
      .select()
      .from(classSubjects)
      .where(
        and(
          eq(classSubjects.subjectId, subjectId),
          eq(classSubjects.classId, classId)
        )
      )
      .limit(1);

    if (existingAssignment) {
      return errorResponse(res, "Subject already assigned to this class", 409);
    }

    const assignmentId = uuidv4();

    // Insert assignment
    await db.insert(classSubjects).values({
      id: assignmentId,
      subjectId: subjectId,
      classId: classId,
      userId: teacherId || userId,
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
      201
    );
  } catch (error) {
    console.error("Assign subject to class error:", error);
    return errorResponse(res, error.message || "Failed to assign subject", 500);
  }
};

// ==================== BULK ASSIGN SUBJECTS TO CLASS ====================
export const bulkAssignSubjectsToClass = async (req, res) => {
  try {
    const userId = req.user.id;
    const { classId, subjects: subjectList } = req.body;

    if (!classId || !subjectList || !Array.isArray(subjectList) || subjectList.length === 0) {
      return errorResponse(
        res,
        "classId and subjects array are required",
        400
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

    const results = [];
    const errors = [];

    for (const item of subjectList) {
      const { subjectId, teacherId } = item;

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

        if (subject.status !== "active") {
          errors.push({ subjectId, error: "Subject is not active" });
          continue;
        }

        // Check if assignment already exists
        const [existingAssignment] = await db
          .select()
          .from(classSubjects)
          .where(
            and(
              eq(classSubjects.subjectId, subjectId),
              eq(classSubjects.classId, classId)
            )
          )
          .limit(1);

        if (existingAssignment) {
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
          userId: teacherId || userId,
        });

        // Get subject details for response
        const [subjectDetails] = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, subjectId))
          .limit(1);

        results.push({
          id: assignmentId,
          subjectId: subjectId,
          classId: classId,
          userId: teacherId || userId,
          subject: subjectDetails,
        });
      } catch (error) {
        errors.push({ subjectId, error: error.message });
      }
    }

    return successResponse(
      res,
      {
        data: {
          totalAssigned: results.length,
          totalErrors: errors.length,
          assigned: results,
          errors: errors,
        },
      },
      `${results.length} subjects assigned successfully`,
      200
    );
  } catch (error) {
    console.error("Bulk assign subjects to class error:", error);
    return errorResponse(
      res,
      error.message || "Failed to bulk assign subjects",
      500
    );
  }
};

// ==================== BULK ASSIGN SUBJECTS TO SECTION ====================
export const bulkAssignSubjectsToSection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sectionId, subjects: subjectList } = req.body;

    if (!sectionId || !subjectList || !Array.isArray(subjectList) || subjectList.length === 0) {
      return errorResponse(
        res,
        "sectionId and subjects array are required",
        400
      );
    }

    // Check if section exists
    const [sectionData] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, sectionId))
      .limit(1);

    if (!sectionData) {
      return errorResponse(res, "Section not found", 404);
    }

    const results = [];
    const errors = [];

    // Get the class ID from section
    const classId = sectionData.classId;

    for (const item of subjectList) {
      const { subjectId, teacherId } = item;

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

        if (subject.status !== "active") {
          errors.push({ subjectId, error: "Subject is not active" });
          continue;
        }

        // Check if assignment already exists for this class
        const [existingAssignment] = await db
          .select()
          .from(classSubjects)
          .where(
            and(
              eq(classSubjects.subjectId, subjectId),
              eq(classSubjects.classId, classId)
            )
          )
          .limit(1);

        if (existingAssignment) {
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
          userId: teacherId || userId,
        });

        // Get subject details for response
        const [subjectDetails] = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, subjectId))
          .limit(1);

        results.push({
          id: assignmentId,
          subjectId: subjectId,
          classId: classId,
          sectionId: sectionId,
          userId: teacherId || userId,
          subject: subjectDetails,
          section: sectionData,
        });
      } catch (error) {
        errors.push({ subjectId, error: error.message });
      }
    }

    return successResponse(
      res,
      {
        data: {
          totalAssigned: results.length,
          totalErrors: errors.length,
          assigned: results,
          errors: errors,
        },
      },
      `${results.length} subjects assigned to section successfully`,
      200
    );
  } catch (error) {
    console.error("Bulk assign subjects to section error:", error);
    return errorResponse(
      res,
      error.message || "Failed to bulk assign subjects to section",
      500
    );
  }
};

// ==================== GET SUBJECTS BY CLASS ====================
export const getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId) {
      return errorResponse(res, "Class ID is required", 400);
    }

    // Get all assignments for this class
    const classSubjectAssignments = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.classId, classId));

    // Get subject details for each assignment
    const subjectsWithDetails = await Promise.all(
      classSubjectAssignments.map(async (assignment) => {
        const [subject] = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, assignment.subjectId))
          .limit(1);

        return {
          id: assignment.id,
          classId: assignment.classId,
          subjectId: assignment.subjectId,
          userId: assignment.userId,
          createdAt: assignment.createdAt,
          subject: subject || null,
        };
      })
    );

    return successResponse(
      res,
      {
        data: {
          classId: classId,
          subjects: subjectsWithDetails,
          total: subjectsWithDetails.length,
        },
      },
      "Class subjects fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get subjects by class error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get class subjects",
      500
    );
  }
};

// ==================== GET SUBJECTS BY SECTION ====================
export const getSubjectsBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    if (!sectionId) {
      return errorResponse(res, "Section ID is required", 400);
    }

    // Check if section exists
    const [sectionData] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, sectionId))
      .limit(1);

    if (!sectionData) {
      return errorResponse(res, "Section not found", 404);
    }

    // Get all subjects assigned to the class of this section
    const classSubjectAssignments = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.classId, sectionData.classId));

    // Get subject details for each assignment
    const subjectsWithDetails = await Promise.all(
      classSubjectAssignments.map(async (assignment) => {
        const [subject] = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, assignment.subjectId))
          .limit(1);

        return {
          id: assignment.id,
          classId: assignment.classId,
          subjectId: assignment.subjectId,
          userId: assignment.userId,
          createdAt: assignment.createdAt,
          subject: subject || null,
        };
      })
    );

    return successResponse(
      res,
      {
        data: {
          sectionId: sectionId,
          classId: sectionData.classId,
          sectionName: sectionData.name,
          subjects: subjectsWithDetails,
          total: subjectsWithDetails.length,
        },
      },
      "Section subjects fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get subjects by section error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get section subjects",
      500
    );
  }
};

// ==================== GET CLASSES BY SUBJECT ====================
export const getClassesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!subjectId) {
      return errorResponse(res, "Subject ID is required", 400);
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

    // Get all assignments for this subject
    const assignments = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.subjectId, subjectId));

    // Get class details
    const classDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const [classData] = await db
          .select()
          .from(classes)
          .where(eq(classes.id, assignment.classId))
          .limit(1);

        return {
          assignmentId: assignment.id,
          classId: assignment.classId,
          className: classData?.name || null,
          teacherId: assignment.userId,
        };
      })
    );

    return successResponse(
      res,
      {
        data: {
          subjectId: subjectId,
          subjectName: subject.name,
          classes: classDetails,
          total: classDetails.length,
        },
      },
      "Classes by subject fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get classes by subject error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get classes by subject",
      500
    );
  }
};

// ==================== UPDATE CLASS SUBJECT ====================
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
    if (teacherId !== undefined) updateData.userId = teacherId;

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, "No data provided for update", 400);
    }

    await db
      .update(classSubjects)
      .set(updateData)
      .where(eq(classSubjects.id, id));

    // Fetch updated assignment
    const [updatedAssignment] = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.id, id))
      .limit(1);

    return successResponse(
      res,
      updatedAssignment,
      "Assignment updated successfully",
      200
    );
  } catch (error) {
    console.error("Update class subject error:", error);
    return errorResponse(
      res,
      error.message || "Failed to update assignment",
      500
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

    // Hard delete (or you can soft delete if you have a status column)
    await db.delete(classSubjects).where(eq(classSubjects.id, id));

    return successResponse(
      res,
      null,
      "Subject removed from class successfully",
      200
    );
  } catch (error) {
    console.error("Remove subject from class error:", error);
    return errorResponse(
      res,
      error.message || "Failed to remove subject",
      500
    );
  }
};