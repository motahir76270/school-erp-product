// src/controllers/feeTypeController.js
import { eq, and, like, count, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/db.js";
import { feeTypes } from "../../db/schema/users.js";
import { successResponse, errorResponse } from "../../lib/response.js";

// ==================== CREATE FEE TYPE ====================
export const createFeeType = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const {
      name,
      code,
      amount,
      frequency,
      dueDay,
      penaltyPerDay,
      applicableClasses,
      description,
      status,
    } = req.body;

    // Validation
    if (!name || !code || !amount) {
      return errorResponse(res, "Name, code, and amount are required", 400);
    }

    // Check if code already exists
    const [existingCode] = await db
      .select()
      .from(feeTypes)
      .where(eq(feeTypes.code, code))
      .limit(1);

    if (existingCode) {
      return errorResponse(res, "Fee type code already exists", 409);
    }

    const feeTypeId = uuidv4();

    await db.insert(feeTypes).values({
      id: feeTypeId,
      name,
      code,
      amount: amount.toString(),
      frequency: frequency || "monthly",
      dueDay: dueDay || 10,
      penaltyPerDay: penaltyPerDay ? penaltyPerDay.toString() : "0",
      applicableClasses: applicableClasses || [],
      description: description || null,
      status: status || "active",
      userId,
    });

    const [newFeeType] = await db
      .select()
      .from(feeTypes)
      .where(eq(feeTypes.id, feeTypeId))
      .limit(1);

    return successResponse(res, newFeeType, "Fee type created successfully", 201);
  } catch (error) {
    console.error("Create fee type error:", error);
    return errorResponse(res, error.message || "Failed to create fee type", 500);
  }
};

// ==================== GET ALL FEE TYPES ====================
export const getAllFeeTypes = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log(
    "safjhasfjhasfjkhk"
    );
    
    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }
   const status = req.params;

    const allFeeTypes = await db
    .select()
    .from(feeTypes)
    .where(eq(feeTypes.userId, userId))

    return successResponse(
      res,
      allFeeTypes,
      "Fee types fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get all fee types error:", error);
    return errorResponse(res, error.message || "Failed to get fee types", 500);
  }
};

// ==================== GET FEE TYPE BY ID ====================
export const getFeeTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!id) {
      return errorResponse(res, "Fee type ID is required", 400);
    }

    const [feeType] = await db
      .select()
      .from(feeTypes)
      .where(and(eq(feeTypes.id, id), eq(feeTypes.userId, userId)))
      .limit(1);

    if (!feeType) {
      return errorResponse(res, "Fee type not found", 404);
    }

    return successResponse(res, feeType, "Fee type fetched successfully", 200);
  } catch (error) {
    console.error("Get fee type error:", error);
    return errorResponse(res, error.message || "Failed to get fee type", 500);
  }
};

// ==================== UPDATE FEE TYPE ====================
export const updateFeeType = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const {
      name,
      code,
      amount,
      frequency,
      dueDay,
      penaltyPerDay,
      applicableClasses,
      description,
      status,
    } = req.body;

    if (!id) {
      return errorResponse(res, "Fee type ID is required", 400);
    }

    // Check if fee type exists
    const [existingFeeType] = await db
      .select()
      .from(feeTypes)
      .where(and(eq(feeTypes.id, id), eq(feeTypes.userId, userId)))
      .limit(1);

    if (!existingFeeType) {
      return errorResponse(res, "Fee type not found", 404);
    }

    // Check if code already exists for another fee type
    if (code && code !== existingFeeType.code) {
      const [existingCode] = await db
        .select()
        .from(feeTypes)
        .where(and(eq(feeTypes.code, code), eq(feeTypes.userId, userId)))
        .limit(1);

      if (existingCode) {
        return errorResponse(res, "Fee type code already exists", 409);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (amount !== undefined) updateData.amount = amount.toString();
    if (frequency !== undefined) updateData.frequency = frequency;
    if (dueDay !== undefined) updateData.dueDay = dueDay;
    if (penaltyPerDay !== undefined) updateData.penaltyPerDay = penaltyPerDay.toString();
    if (applicableClasses !== undefined) updateData.applicableClasses = applicableClasses;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    updateData.updatedAt = new Date();

    await db
      .update(feeTypes)
      .set(updateData)
      .where(and(eq(feeTypes.id, id), eq(feeTypes.userId, userId)));

    const [updatedFeeType] = await db
      .select()
      .from(feeTypes)
      .where(eq(feeTypes.id, id))
      .limit(1);

    return successResponse(res, updatedFeeType, "Fee type updated successfully", 200);
  } catch (error) {
    console.error("Update fee type error:", error);
    return errorResponse(res, error.message || "Failed to update fee type", 500);
  }
};

// ==================== DELETE FEE TYPE ====================
export const deleteFeeType = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!id) {
      return errorResponse(res, "Fee type ID is required", 400);
    }

    const [existingFeeType] = await db
      .select()
      .from(feeTypes)
      .where(and(eq(feeTypes.id, id), eq(feeTypes.userId, userId)))
      .limit(1);

    if (!existingFeeType) {
      return errorResponse(res, "Fee type not found", 404);
    }

    await db.delete(feeTypes).where(and(eq(feeTypes.id, id), eq(feeTypes.userId, userId)));

    return successResponse(res, null, "Fee type deleted successfully", 200);
  } catch (error) {
    console.error("Delete fee type error:", error);
    return errorResponse(res, error.message || "Failed to delete fee type", 500);
  }
};

// ==================== UPDATE FEE TYPE STATUS ====================
export const updateFeeTypeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { status } = req.body;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!id || !status) {
      return errorResponse(res, "Fee type ID and status are required", 400);
    }

    if (!["active", "inactive"].includes(status)) {
      return errorResponse(res, "Invalid status. Must be active or inactive", 400);
    }

    const [existingFeeType] = await db
      .select()
      .from(feeTypes)
      .where(and(eq(feeTypes.id, id), eq(feeTypes.userId, userId)))
      .limit(1);

    if (!existingFeeType) {
      return errorResponse(res, "Fee type not found", 404);
    }

    await db
      .update(feeTypes)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(feeTypes.id, id), eq(feeTypes.userId, userId)));

    const [updatedFeeType] = await db
      .select()
      .from(feeTypes)
      .where(eq(feeTypes.id, id))
      .limit(1);

    return successResponse(
      res,
      { status: updatedFeeType.status },
      "Fee type status updated successfully",
      200
    );
  } catch (error) {
    console.error("Update fee type status error:", error);
    return errorResponse(res, error.message || "Failed to update fee type status", 500);
  }
};