// src/controllers/feePaymentController.js
import { eq, and, sql, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/db.js";
import { studentFees, feePayments, feePenalties ,students} from "../../db/schema/users.js";
import { successResponse, errorResponse } from "../../lib/response.js";

// ==================== GENERATE RECEIPT NUMBER ====================
const generateReceiptNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `RCPT-${timestamp}${random}`;
};

// ==================== MAKE PAYMENT ====================
export const makePayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const { studentFeeId, amount, paymentMode, transactionId, remarks } = req.body;

    if (!studentFeeId || !amount || !paymentMode) {
      return errorResponse(res, "Student fee ID, amount, and payment mode are required", 400);
    }

    if (amount <= 0) {
      return errorResponse(res, "Payment amount must be greater than 0", 400);
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

    // Check if student fee is already paid
    if (studentFee.status === "paid") {
      return errorResponse(res, "This fee is already fully paid", 400);
    }

    // Get total paid amount
    const [totalPaidResult] = await db
      .select({ total: sql`SUM(${feePayments.amount})` })
      .from(feePayments)
      .where(eq(feePayments.studentFeeId, studentFeeId));

    const currentPaid = parseFloat(totalPaidResult?.total || 0);
    const feeAmount = parseFloat(studentFee.amount);
    const newTotalPaid = currentPaid + parseFloat(amount);

    // Check if amount exceeds fee amount
    if (newTotalPaid > feeAmount) {
      return errorResponse(res, `Payment amount exceeds remaining balance of ${feeAmount - currentPaid}`, 400);
    }

    const paymentId = uuidv4();
    const receiptNumber = generateReceiptNumber();

    // Insert payment
    await db.insert(feePayments).values({
      id: paymentId,
      studentFeeId,
      amount: amount.toString(),
      paymentMode,
      transactionId: transactionId || null,
      receiptNumber,
      paidBy: userId,
      remarks: remarks || null,
      userId,
    });

    // Update student fee status
    let status = "pending";
    if (newTotalPaid >= feeAmount) {
      status = "paid";
    } else if (newTotalPaid > 0) {
      status = "partial";
    }

    await db
      .update(studentFees)
      .set({
        paidAmount: newTotalPaid.toString(),
        status,
        updatedAt: new Date(),
      })
      .where(eq(studentFees.id, studentFeeId));

    // Get student details
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentFee.studentId))
      .limit(1);

    const [payment] = await db
      .select()
      .from(feePayments)
      .where(eq(feePayments.id, paymentId))
      .limit(1);

    return successResponse(
      res,
      {
        payment,
        studentFee: {
          ...studentFee,
          status,
          paidAmount: newTotalPaid.toString(),
          remainingAmount: (feeAmount - newTotalPaid).toString(),
        },
        student,
      },
      "Payment made successfully",
      201
    );
  } catch (error) {
    console.error("Make payment error:", error);
    return errorResponse(res, error.message || "Failed to make payment", 500);
  }
};

// ==================== GET PAYMENT BY ID ====================
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!id) {
      return errorResponse(res, "Payment ID is required", 400);
    }

    const [payment] = await db
      .select()
      .from(feePayments)
      .where(and(eq(feePayments.id, id), eq(feePayments.userId, userId)))
      .limit(1);

    if (!payment) {
      return errorResponse(res, "Payment not found", 404);
    }

    const [studentFee] = await db
      .select()
      .from(studentFees)
      .where(eq(studentFees.id, payment.studentFeeId))
      .limit(1);

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentFee?.studentId))
      .limit(1);

    return successResponse(
      res,
      {
        payment,
        studentFee: studentFee || null,
        student: student || null,
      },
      "Payment fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get payment error:", error);
    return errorResponse(res, error.message || "Failed to get payment", 500);
  }
};

// ==================== GET PAYMENTS BY STUDENT FEE ====================
export const getPaymentsByStudentFee = async (req, res) => {
  try {
    const { studentFeeId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!studentFeeId) {
      return errorResponse(res, "Student fee ID is required", 400);
    }

    const payments = await db
      .select()
      .from(feePayments)
      .where(and(eq(feePayments.studentFeeId, studentFeeId), eq(feePayments.userId, userId)))
      .orderBy(feePayments.createdAt, "desc");

    return successResponse(res, payments, "Payments fetched successfully", 200);
  } catch (error) {
    console.error("Get payments error:", error);
    return errorResponse(res, error.message || "Failed to get payments", 500);
  }
};

// ==================== GET ALL PAYMENTS ====================
export const getAllPayments = async (req, res) => {
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

    let query = db.select().from(feePayments).where(eq(feePayments.userId, userId));

    if (startDate && endDate) {
      query = query.where(
        sql`${feePayments.createdAt} BETWEEN ${startDate} AND ${endDate}`
      );
    }

    const [totalResult] = await db
      .select({ total: count() })
      .from(feePayments)
      .where(eq(feePayments.userId, userId));

    const total = totalResult?.total || 0;

    const payments = await query
      .limit(limit)
      .offset(offset)
      .orderBy(feePayments.createdAt, "desc");

    // Get details for each payment
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        const [studentFee] = await db
          .select()
          .from(studentFees)
          .where(eq(studentFees.id, payment.studentFeeId))
          .limit(1);

        const [student] = await db
          .select()
          .from(students)
          .where(eq(students.id, studentFee?.studentId))
          .limit(1);

        return {
          ...payment,
          studentFee: studentFee || null,
          student: student || null,
        };
      })
    );

    return successResponse(
      res,
      {
        payments: paymentsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Payments fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get all payments error:", error);
    return errorResponse(res, error.message || "Failed to get payments", 500);
  }
};