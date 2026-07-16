// src/controllers/sectionController.js
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/db.js";
import { sections, classes } from "../../db/schema/users.js";
import { successResponse, errorResponse } from "../../lib/response.js";
import { log } from "console";

// ==================== CREATE SECTION ====================
export const createSection = async (req, res) => {
  try {
    const { name, classId, capacity } = req.body;

    const userId = req.user?.id;

    if (!name || !classId || !userId) {
      return errorResponse(
        res,
        "Required fields missing: name, classId, userId",
        400,
      );
    }

    // Check if class exists
    const [existingClass] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!existingClass) {
      return errorResponse(res, "Class not ", 404);
    }
    const sectionId = uuidv4();
    // Check if section already exists in this class
    const [existingSection] = await db
      .select()
      .from(sections)
      .where(and(eq(sections.classId, classId), eq(sections.name, name)));
    
    if (existingSection) {
        return errorResponse(
            res,
            "Class with this section name is already exists in this class",
            409,
          );
        }
      
    

    await db.insert(sections).values({
      id: sectionId,
      name: name,
      classId: classId,
      userId: userId,
      capacity: capacity || 30,
    });

    const [newSection] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, sectionId))
      .limit(1);

    if (!newSection) {
      return errorResponse(res, "Failed to create section", 500);
    }

    return successResponse(
      res,
      newSection,
      "Section created successfully",
      201,
    );
  } catch (error) {
    console.error("Create section error:", error);
    return errorResponse(res, error.message || "Failed to create section", 500);
  }
};

// ==================== GET ALL SECTIONS ====================
export const getAllSections = async (req, res) => {
  try {
    const classId = req.params.classId || req.query.classId;
   
    const [sectionsData] = await db.select()
    .from(sections)
    .where(eq(sections.classId, classId));

    return successResponse(
      res,
     sectionsData,
      "Sections fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get all sections error:", error);
    return errorResponse(res, error.message || "Failed to get sections", 500);
  }
};

// ==================== GET SECTION BY ID ====================
export const getSectionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Section ID is required", 400);
    }

    const [section] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, id))
      .limit(1);

    if (!section) {
      return errorResponse(res, "Section not found", 404);
    }

    // Get class details
    const [classData] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, section.class_id))
      .limit(1);

    return successResponse(
      res,
      {
        ...section,
        class: classData || null,
      },
      "Section fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get section error:", error);
    return errorResponse(res, error.message || "Failed to get section", 500);
  }
};

// ==================== GET SECTIONS BY CLASS ID ====================
export const getSectionsByClass = async (req, res) => {
  try {
    const  classId  = req.params.classId || req.query.classId;
    console.log(classId);
    
    if (!classId) {
      return errorResponse(res, "Class ID is required", 400);
    }

    const [existingClass] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))

    if (!existingClass) {
      return errorResponse(res, "class not found", 404);
    }

    const sectionsData = await db
      .select()
      .from(sections)
      .where(eq(sections.classId, classId));

    return successResponse(
      res,
      {
        sections: sectionsData,
        totalSections: sectionsData.length,
      },
      "Sections fetched by class successfully",
      200,
    );
  } catch (error) {
    console.error("Get sections by class error:", error);
    return errorResponse(res, error.message || "Failed to get sections", 500);
  }
};

// ==================== UPDATE SECTION ====================
export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, classId, capacity } = req.body;

    if (!id) {
      return errorResponse(res, "Section ID is required", 400);
    }

    const [existingSection] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, id))
      .limit(1);

    if (!existingSection) {
      return errorResponse(res, "Section not found", 404);
    }

    // If classId is being changed, check if new class exists
    if (classId && classId !== existingSection.classId) {
      const [newClass] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, classId))
        .limit(1);

      if (!newClass) {
        return errorResponse(res, "Class  found", 404);
      }

      // Check if section name already exists in the new class
      const existingSectionInNewClass = await db
        .select()
        .from(sections)
        .where(eq(sections.classId, classId))
        .where(eq(sections.name, name || existingSection.name))
        .limit(1);

      if (existingSectionInNewClass.length > 0) {
        return errorResponse(
          res,
          "Section with this name already exists in the target class",
          409,
        );
      }
    }

    // Check if name is unique in the same class
    if (name && name !== existingSection.name) {
      const targetClassId = classId || existingSection.class_id;
      const existingSectionByName = await db
        .select()
        .from(sections)
        .where(eq(sections.class_id, targetClassId))
        .where(eq(sections.name, name))
        .limit(1);

      if (existingSectionByName.length > 0) {
        return errorResponse(
          res,
          "Section with this name already exists in this class",
          409,
        );
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (classId !== undefined) updateData.class_id = classId;
    if (capacity !== undefined) updateData.capacity = capacity;

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, "No data provided for update", 400);
    }

    await db.update(sections).set(updateData).where(eq(sections.id, id));

    const [updatedSection] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, id))
      .limit(1);

    if (!updatedSection) {
      return errorResponse(res, "Failed to update section", 500);
    }

    return successResponse(
      res,
      updatedSection,
      "Section updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update section error:", error);
    return errorResponse(res, error.message || "Failed to update section", 500);
  }
};

// ==================== DELETE SECTION ====================
export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Section ID is required", 400);
    }

    const [existingSection] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, id))
      .limit(1);

    if (!existingSection) {
      return errorResponse(res, "Section not found", 404);
    }

    await db.delete(sections).where(eq(sections.id, id));

    return successResponse(res, null, "Section deleted successfully", 200);
  } catch (error) {
    console.error("Delete section error:", error);
    return errorResponse(res, error.message || "Failed to delete section", 500);
  }
};

// ==================== BULK CREATE SECTIONS ====================
export const bulkCreateSections = async (req, res) => {
  try {
    const { classId, sectionNames, capacity } = req.body;
    const userId = req.user?.id;

    if (
      !classId ||
      !sectionNames ||
      !Array.isArray(sectionNames) ||
      sectionNames.length === 0
    ) {
      return errorResponse(
        res,
        "classId, userId and sectionNames array are required",
        400,
      );
    }

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    // Check if class exists
    const [existingClass] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!existingClass) {
      return errorResponse(res, "Class not found", 404);
    }

    const createdSections = [];
    const skippedSections = [];

    for (const name of sectionNames) {
      const existingSection = await db
        .select()
        .from(sections)
        .where(eq(sections.class_id, classId))
        .where(eq(sections.name, name))
        .limit(1);

      if (existingSection.length === 0) {
        const sectionId = uuidv4();
        await db.insert(sections).values({
          id: sectionId,
          name: name,
          class_id: classId,
          user_id: userId,
          capacity: capacity || 30,
        });

        const [newSection] = await db
          .select()
          .from(sections)
          .where(eq(sections.id, sectionId))
          .limit(1);

        if (newSection) {
          createdSections.push(newSection);
        }
      } else {
        skippedSections.push(name);
      }
    }

    return successResponse(
      res,
      {
        created: createdSections,
        createdCount: createdSections.length,
        skipped: skippedSections,
        skippedCount: skippedSections.length,
        classId: classId,
        className: existingClass.name,
      },
      "Sections created successfully",
      201,
    );
  } catch (error) {
    console.error("Bulk create sections error:", error);
    return errorResponse(
      res,
      error.message || "Failed to create sections",
      500,
    );
  }
};
