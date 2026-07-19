// src/controllers/paymentGatewayController.js
import { eq, and, like, or, sql, inArray } from "drizzle-orm";
import { db } from "../../db/db.js";
import { paymentGateway, users } from "../../db/schema/users.js";
import { errorResponse, successResponse } from "../../lib/response.js";
import { v4 as uuidv4 } from "uuid";

// ==================== GET all payment gateways ====================
export const getAllPaymentGateways = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Find matching users
    let userIds = [];

    if (search?.trim()) {
      const matchedUsers = await db.query.users.findMany({
        where: (user, { or, like }) =>
          or(
            like(user.firstName, `%${search.trim()}%`),
            like(user.lastName, `%${search.trim()}%`),
            like(user.email, `%${search.trim()}%`),
          ),
        columns: {
          id: true,
        },
      });

      userIds = matchedUsers.map((user) => user.id);
    }

    const whereClause = search?.trim()
      ? inArray(paymentGateway.userId, userIds)
      : undefined;

    // Total count
    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(paymentGateway)
      .where(whereClause);

    const totalCount = Number(totalResult[0]?.count || 0);

    // Fetch gateways
    const gateways = await db.query.paymentGateway.findMany({
      where: whereClause,
      with: {
        user: true,
      },
      orderBy: (gateway, { asc }) => [asc(gateway.createdAt)],
      limit: limitNum,
      offset,
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    return successResponse(
      res,
      {
        gateways,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
      "Payment gateways fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Error fetching payment gateways:", error);

    return errorResponse(
      res,
      error.message || "Failed to fetch payment gateways",
      500,
    );
  }
};

// ==================== GET payment gateway by ID ====================
export const getPaymentGatewayById = async (req, res) => {
  try {
    const { id } = req.params;

    const [gateway] = await db
      .select()
      .from(paymentGateway)
      .where(eq(paymentGateway.userId, id));

    if (!gateway || gateway.length === 0) {
      return errorResponse(res, "Payment gateway not found", 404);
    }

    return successResponse(
      res,
      gateway,
      "Payment gateway fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Error fetching payment gateway:", error);
    return errorResponse(
      res,
      error.message || "Failed to fetch payment gateway",
      500,
    );
  }
};

// ==================== POST create payment gateway ====================
export const createPaymentGateway = async (req, res) => {
  try {
    const { userId, key, secretKey, name, callBackUrl, isActive } = req.body;

    // Validate required fields
    if (!userId || !key || !secretKey || !name) {
      return errorResponse(
        res,
        "Missing required fields: userId, key, secretKey, name are required",
        400,
      );
    }

    // Check if payment gateway with same key already exists for this user
    const [existing] = await db
      .select()
      .from(paymentGateway)
      .where(eq(paymentGateway.userId, userId),
      );

    if (existing) {
      return errorResponse(
        res,
        "Payment gateway already assign for this user",
        409,
      );
    }

    const id = uuidv4();
    const newGateway = {
      id,
      userId,
      key,
      secretKey,
      name,
      callBackUrl: callBackUrl || null,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(paymentGateway).values(newGateway);

    return successResponse(
      res,
      newGateway,
      "Payment gateway created successfully",
      201,
    );
  } catch (error) {
    console.error("Error creating payment gateway:", error);
    return errorResponse(
      res,
      error.message || "Failed to create payment gateway",
      500,
    );
  }
};

// ==================== PUT update payment gateway ====================
export const updatePaymentGateway = async (req, res) => {
  try {
    const { id } = req.params;
    const { key, secretKey, name, callBackUrl, isActive } = req.body;

    // Check if payment gateway exists
    const existing = await db
      .select()
      .from(paymentGateway)
      .where(eq(paymentGateway.id, id));

    if (!existing || existing.length === 0) {
      return errorResponse(res, "Payment gateway not found", 404);
    }

    // Build update data
    const updateData = {
      updatedAt: new Date(),
    };

    if (key !== undefined) updateData.key = key;
    if (secretKey !== undefined) updateData.secretKey = secretKey;
    if (name !== undefined) updateData.name = name;
    if (callBackUrl !== undefined) updateData.callBackUrl = callBackUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update payment gateway
    await db
      .update(paymentGateway)
      .set(updateData)
      .where(eq(paymentGateway.id, id));

    // Fetch updated record
    const updated = await db
      .select()
      .from(paymentGateway)
      .where(eq(paymentGateway.id, id));

    return successResponse(
      res,
      updated[0],
      "Payment gateway updated successfully",
      200,
    );
  } catch (error) {
    console.error("Error updating payment gateway:", error);
    return errorResponse(
      res,
      error.message || "Failed to update payment gateway",
      500,
    );
  }
};

// ==================== PATCH update gateway status ====================
export const updateGatewayStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return errorResponse(res, "isActive field is required", 400);
    }

    // Check if payment gateway exists
    const existing = await db
      .select()
      .from(paymentGateway)
      .where(eq(paymentGateway.id, id));

    if (!existing || existing.length === 0) {
      return errorResponse(res, "Payment gateway not found", 404);
    }

    // Update status
    await db
      .update(paymentGateway)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(paymentGateway.id, id));

    // Fetch updated record
    const updated = await db
      .select()
      .from(paymentGateway)
      .where(eq(paymentGateway.id, id));

    return successResponse(
      res,
      updated[0],
      `Payment gateway ${isActive ? "activated" : "deactivated"} successfully`,
      200,
    );
  } catch (error) {
    console.error("Error updating gateway status:", error);
    return errorResponse(
      res,
      error.message || "Failed to update gateway status",
      500,
    );
  }
};

// ==================== DELETE payment gateway ====================
export const deletePaymentGateway = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if payment gateway exists
    const [existing] = await db
      .select()
      .from(paymentGateway)
      .where(eq(paymentGateway.id, id));

    if (!existing) {
      return errorResponse(res, "Payment gateway not found", 404);
    }

    // Delete payment gateway
    await db.delete(paymentGateway).where(eq(paymentGateway.id, id));

    return successResponse(
      res,
      null,
      "Payment gateway deleted successfully",
      200,
    );
  } catch (error) {
    console.error("Error deleting payment gateway:", error);
    return errorResponse(
      res,
      error.message || "Failed to delete payment gateway",
      500,
    );
  }
};

