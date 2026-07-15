// src/controllers/classController.js
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/db.js";
import { classes, sections } from "../db/schema/users.js";
import { successResponse, errorResponse } from "../lib/response.js";

// ==================== CREATE CLASS ====================
export const createClass = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;

    if (!name || !userId) {
      return errorResponse(res, "Required fields missing: name, userId", 400);
    }

    const existingClassByName = await db
      .select()
      .from(classes)
      .where(eq(classes.name, name))
      .limit(1);

    if (existingClassByName.length > 0) {
      return errorResponse(res, "Class with this name already exists", 409);
    }

    const classId = uuidv4();

    await db.insert(classes).values({
      id: classId,
      name: name,
      userId: userId,
    });

    
    const [newClass] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!newClass) {
      return errorResponse(res, "Failed to create class", 500);
    }

    return successResponse(res, newClass, "Class created successfully", 201);
  } catch (error) {
    console.error("Create class error:", error);
    return errorResponse(res, error.message || "Failed to create class", 500);
  }
};

// ==================== GET ALL CLASSES WITH SECTIONS ====================
export const getAllClassesWithSections = async (req, res) => {
  try {

    const allClasses = await db.query.classes.findMany({
      with: {
        sections: true,
      },
    });

    return successResponse(
      res,
       allClasses
      ,"Classes fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get all classes error:", error);

    return errorResponse(
      res,
      error.message || "Failed to get classes",
      500,
    );
  }
};

// ==================== GET CLASS BY ID WITH SECTIONS ====================
export const getClassWithSections = async (req, res) => {
  try {
    const { id } = req.params;
  
    if (!id) {
      return errorResponse(res, "Class ID is required", 400);
    }

    const [cls] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);

    if (!cls) {
      return errorResponse(res, "Class not found", 404);
    }

    return successResponse(
      res,
      cls
     , "Class fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get class error:", error);
    return errorResponse(res, error.message || "Failed to get class", 500);
  }
};

// ==================== UPDATE CLASS ====================
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) {
      return errorResponse(res, "Class ID is required", 400);
    }

    const [existingClass] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);

    if (!existingClass) {
      return errorResponse(res, "Class not found", 404);
    }

    if (name && name !== existingClass.name) {
      const existingClassByName = await db
        .select()
        .from(classes)
        .where(eq(classes.name, name))
        .limit(1);

      if (existingClassByName.length > 0) {
        return errorResponse(res, "Class with this name already exists", 409);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, "No data provided for update", 400);
    }

    await db.update(classes).set(updateData).where(eq(classes.id, id));

    const [updatedClass] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);

    if (!updatedClass) {
      return errorResponse(res, "Failed to update class", 500);
    }

    return successResponse(
      res,
      updatedClass,
      "Class updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update class error:", error);
    return errorResponse(res, error.message || "Failed to update class", 500);
  }
};

// ==================== DELETE CLASS ====================
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    
    if (!id) {
      return errorResponse(res, "Class ID is required", 400);
    }

    const [existingClass] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);

    if (!existingClass) {
      return errorResponse(res, "Class not found", 404);
    }
   
    await db.delete(sections)
    .where(eq(sections.classId , id))
    const classSections = await db
      .select()
      .from(sections)
      .where(eq(sections.classId, id));
      

    if (classSections.length > 0) {
      return errorResponse(
        res,
        "Cannot delete class with existing sections. Delete sections first.",
        400,
      );
    }
     

    const deleteclass = await db.delete(classes).where(eq(classes.id, id));

    return successResponse(res,"Class deleted successfully", 200);
  } catch (error) {
    console.error("Delete class error:", error);
    return errorResponse(res, error.message || "Failed to delete class", 500);
  }
};

// ==================== GET ALL CLASSES (SIMPLE) ====================
export const getAllClasses = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    let query = db.select().from(classes);
    query = query.limit(limit).offset(offset);

    const allClasses = await query;

    return successResponse(
      res,
      {
        classes: allClasses,
        pagination: {
          limit,
          offset,
          total: allClasses.length,
          hasMore: allClasses.length === limit,
        },
      },
      "Classes fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get all classes error:", error);
    return errorResponse(res, error.message || "Failed to get classes", 500);
  }
};

