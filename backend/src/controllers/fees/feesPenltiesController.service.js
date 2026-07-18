// src/controllers/feePenaltyController.js
import { eq, and, sql, count, between } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/db.js";
import { studentFees, feePenalties, feePayments } from "../../db/schema/users.js";
import { successResponse, errorResponse } from "../../lib/response.js";

// ==================== CALCULATE PENALTIES ====================
export const calculatePenalties = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const { studentFeeId } = req.params;

    if (!studentFeeId) {
      return errorResponse(res, "Student fee ID is required", 400);
    }

    // Check if student fee exists
    const [studentFee] = await db
      .select()
      .from(studentFees)
      .where(and(eq(studentFees.id, studentFeeId), eq(studentFees.userId, userId)))
      .limit(1);

    if (!studentFee) {
      return errorResponse(res, "Student fee not found", 404);
    }

    // Check if fee is already paid
    if (studentFee.status === "paid") {
      return errorResponse(res, "Fee is already paid", 400);
    }

    const today = new Date();
    const dueDate = new Date(studentFee.dueDate);
    
    // Calculate days late
    const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    
    if (daysLate <= 0) {
      return successResponse(
        res,
        {
          daysLate: 0,
          penaltyAmount: 0,
          message: "Fee is not overdue",
        },
        "No penalty applied",
        200
      );
    }

    // Get penalty per day from fee type
    // Since we don't have direct relation, we need to get it from fee type
    // Or we can calculate based on a percentage of fee amount
    const penaltyPerDay = parseFloat(studentFee.penaltyAmount || 0) / daysLate;
    
    // If no penalty is set, calculate based on 1% of fee amount per day
    let penaltyPerDayValue = penaltyPerDay || (parseFloat(studentFee.amount) * 0.01);
    
    const totalPenalty = penaltyPerDayValue * daysLate;

    return successResponse(
      res,
      {
        daysLate,
        penaltyPerDay: penaltyPerDayValue,
        totalPenalty: Math.round(totalPenalty * 100) / 100,
        dueDate: studentFee.dueDate,
        today: today.toISOString().split('T')[0],
      },
      "Penalty calculated successfully",
      200
    );
  } catch (error) {
    console.error("Calculate penalties error:", error);
    return errorResponse(res, error.message || "Failed to calculate penalties", 500);
  }
};

// ==================== APPLY PENALTY TO STUDENT FEE ====================
export const applyPenalty = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const { studentFeeId } = req.params;
    const { penaltyAmount, daysLate, penaltyPerDay } = req.body;

    if (!studentFeeId) {
      return errorResponse(res, "Student fee ID is required", 400);
    }

    // Check if student fee exists
    const [studentFee] = await db
      .select()
      .from(studentFees)
      .where(and(eq(studentFees.id, studentFeeId), eq(studentFees.userId, userId)))
      .limit(1);

    if (!studentFee) {
      return errorResponse(res, "Student fee not found", 404);
    }

    // Check if fee is already paid
    if (studentFee.status === "paid") {
      return errorResponse(res, "Fee is already paid", 400);
    }

    // Check if penalty already applied
    const [existingPenalty] = await db
      .select()
      .from(feePenalties)
      .where(eq(feePenalties.studentFeeId, studentFeeId))
      .limit(1);

    if (existingPenalty) {
      return errorResponse(res, "Penalty already applied to this fee", 400);
    }

    const penaltyId = uuidv4();
    const finalPenaltyAmount = penaltyAmount || 0;
    const finalDaysLate = daysLate || 0;
    const finalPenaltyPerDay = penaltyPerDay || 0;

    // Insert penalty
    await db.insert(feePenalties).values({
      id: penaltyId,
      studentFeeId,
      amount: finalPenaltyAmount.toString(),
      daysLate: finalDaysLate,
      penaltyPerDay: finalPenaltyPerDay.toString(),
      userId,
    });

    // Update student fee with penalty amount
    const currentPenalty = parseFloat(studentFee.penaltyAmount || 0);
    const totalPenalty = currentPenalty + finalPenaltyAmount;

    await db
      .update(studentFees)
      .set({
        penaltyAmount: totalPenalty.toString(),
        status: studentFee.status === "pending" ? "overdue" : studentFee.status,
        updatedAt: new Date(),
      })
      .where(eq(studentFees.id, studentFeeId));

    const [penalty] = await db
      .select()
      .from(feePenalties)
      .where(eq(feePenalties.id, penaltyId))
      .limit(1);

    const [updatedStudentFee] = await db
      .select()
      .from(studentFees)
      .where(eq(studentFees.id, studentFeeId))
      .limit(1);

    return successResponse(
      res,
      {
        penalty,
        studentFee: updatedStudentFee,
      },
      "Penalty applied successfully",
      201
    );
  } catch (error) {
    console.error("Apply penalty error:", error);
    return errorResponse(res, error.message || "Failed to apply penalty", 500);
  }
};

// ==================== GET PENALTIES BY STUDENT FEE ====================
export const getPenaltiesByStudentFee = async (req, res) => {
  try {
    const { studentFeeId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!studentFeeId) {
      return errorResponse(res, "Student fee ID is required", 400);
    }

    const penalties = await db
      .select()
      .from(feePenalties)
      .where(and(eq(feePenalties.studentFeeId, studentFeeId), eq(feePenalties.userId, userId)))
      .orderBy(feePenalties.createdAt, "desc");

    return successResponse(res, penalties, "Penalties fetched successfully", 200);
  } catch (error) {
    console.error("Get penalties error:", error);
    return errorResponse(res, error.message || "Failed to get penalties", 500);
  }
};

// ==================== GET ALL PENALTIES ====================
export const getAllPenalties = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = db.select().from(feePenalties).where(eq(feePenalties.userId, userId));

    if (startDate && endDate) {
      query = query.where(
        sql`${feePenalties.createdAt} BETWEEN ${startDate} AND ${endDate}`
      );
    }

    const [totalResult] = await db
      .select({ total: count() })
      .from(feePenalties)
      .where(eq(feePenalties.userId, userId));

    const total = totalResult?.total || 0;

    const penalties = await query
      .limit(limit)
      .offset(offset)
      .orderBy(feePenalties.createdAt, "desc");

    // Get details for each penalty
    const penaltiesWithDetails = await Promise.all(
      penalties.map(async (penalty) => {
        const [studentFee] = await db
          .select()
          .from(studentFees)
          .where(eq(studentFees.id, penalty.studentFeeId))
          .limit(1);

        return {
          ...penalty,
          studentFee: studentFee || null,
        };
      })
    );

    return successResponse(
      res,
      {
        penalties: penaltiesWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Penalties fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get all penalties error:", error);
    return errorResponse(res, error.message || "Failed to get penalties", 500);
  }
};

// ==================== GET PENALTY BY ID ====================
export const getPenaltyById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!id) {
      return errorResponse(res, "Penalty ID is required", 400);
    }

    const [penalty] = await db
      .select()
      .from(feePenalties)
      .where(and(eq(feePenalties.id, id), eq(feePenalties.userId, userId)))
      .limit(1);

    if (!penalty) {
      return errorResponse(res, "Penalty not found", 404);
    }

    const [studentFee] = await db
      .select()
      .from(studentFees)
      .where(eq(studentFees.id, penalty.studentFeeId))
      .limit(1);

    return successResponse(
      res,
      {
        penalty,
        studentFee: studentFee || null,
      },
      "Penalty fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get penalty error:", error);
    return errorResponse(res, error.message || "Failed to get penalty", 500);
  }
};

// ==================== WAIVE PENALTY ====================
export const waivePenalty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!id) {
      return errorResponse(res, "Penalty ID is required", 400);
    }

    const [penalty] = await db
      .select()
      .from(feePenalties)
      .where(and(eq(feePenalties.id, id), eq(feePenalties.userId, userId)))
      .limit(1);

    if (!penalty) {
      return errorResponse(res, "Penalty not found", 404);
    }

    // Delete penalty
    await db.delete(feePenalties).where(eq(feePenalties.id, id));

    // Update student fee - remove penalty amount
    const [studentFee] = await db
      .select()
      .from(studentFees)
      .where(eq(studentFees.id, penalty.studentFeeId))
      .limit(1);

    if (studentFee) {
      const currentPenalty = parseFloat(studentFee.penaltyAmount || 0);
      const penaltyAmount = parseFloat(penalty.amount);
      const newPenalty = Math.max(0, currentPenalty - penaltyAmount);

      await db
        .update(studentFees)
        .set({
          penaltyAmount: newPenalty.toString(),
          updatedAt: new Date(),
        })
        .where(eq(studentFees.id, penalty.studentFeeId));
    }

    return successResponse(res, null, "Penalty waived successfully", 200);
  } catch (error) {
    console.error("Waive penalty error:", error);
    return errorResponse(res, error.message || "Failed to waive penalty", 500);
  }
};

// ==================== BULK CALCULATE PENALTIES ====================
export const bulkCalculatePenalties = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const { academicYear } = req.body;

    if (!academicYear) {
      return errorResponse(res, "Academic year is required", 400);
    }

    // Get all overdue student fees
    const overdueFees = await db
      .select()
      .from(studentFees)
      .where(
        and(
          eq(studentFees.userId, userId),
          eq(studentFees.academicYear, academicYear),
          sql`${studentFees.status} IN ('pending', 'overdue')`,
          sql`${studentFees.dueDate} < CURDATE()`
        )
      );

    const results = [];
    
    for (const studentFee of overdueFees) {
      const today = new Date();
      const dueDate = new Date(studentFee.dueDate);
      const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      
      if (daysLate <= 0) continue;

      // Check if penalty already exists
      const [existingPenalty] = await db
        .select()
        .from(feePenalties)
        .where(eq(feePenalties.studentFeeId, studentFee.id))
        .limit(1);

      if (existingPenalty) continue;

      // Calculate penalty (1% per day)
      const penaltyPerDay = parseFloat(studentFee.amount) * 0.01;
      const totalPenalty = penaltyPerDay * daysLate;

      const penaltyId = uuidv4();

      await db.insert(feePenalties).values({
        id: penaltyId,
        studentFeeId: studentFee.id,
        amount: totalPenalty.toString(),
        daysLate: daysLate,
        penaltyPerDay: penaltyPerDay.toString(),
        userId,
      });

      // Update student fee
      const currentPenalty = parseFloat(studentFee.penaltyAmount || 0);
      await db
        .update(studentFees)
        .set({
          penaltyAmount: (currentPenalty + totalPenalty).toString(),
          status: "overdue",
          updatedAt: new Date(),
        })
        .where(eq(studentFees.id, studentFee.id));

      results.push({
        studentFeeId: studentFee.id,
        daysLate,
        penaltyAmount: totalPenalty,
        status: "overdue",
      });
    }

    return successResponse(
      res,
      {
        totalProcessed: results.length,
        results,
      },
      `Penalties calculated for ${results.length} students`,
      200
    );
  } catch (error) {
    console.error("Bulk calculate penalties error:", error);
    return errorResponse(res, error.message || "Failed to calculate penalties", 500);
  }
};