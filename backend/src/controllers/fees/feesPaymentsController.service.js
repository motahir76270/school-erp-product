// src/controllers/feePaymentController.js
import { eq, and, sql, count, or } from "drizzle-orm";
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

    const {
      studentFeeId,
      amount,
      paymentMode,
      transactionId,
      remarks,
    } = req.body;


    if (!studentFeeId || !amount || !paymentMode) {
      return errorResponse(
        res,
        "Student fee ID, amount, and payment mode are required",
        400
      );
    }


    const currentPaid = Number(amount);


    if (currentPaid <= 0 || Number.isNaN(currentPaid)) {
      return errorResponse(
        res,
        "Payment amount must be greater than 0",
        400
      );
    }


    // Get student fee
    const [studentFee] = await db
      .select()
      .from(studentFees)
      .where(eq(studentFees.id, studentFeeId))
      .limit(1);


    if (!studentFee) {
      return errorResponse(
        res,
        "Student fee not found",
        404
      );
    }


    if (studentFee.status === "paid") {
      return errorResponse(
        res,
        "This fee is already fully paid",
        400
      );
    }


    const feeAmount = Number(studentFee.amount || 0);
    const alreadyPaid = Number(studentFee.paidAmount || 0);


    if (Number.isNaN(feeAmount)) {
      return errorResponse(
        res,
        "Invalid fee amount",
        400
      );
    }


    const remainingAmount = feeAmount - alreadyPaid;


    if (currentPaid > remainingAmount) {
      return errorResponse(
        res,
        `Payment amount exceeds remaining balance of ${remainingAmount}`,
        400
      );
    }


    const totalPaid = alreadyPaid + currentPaid;
    const dueAmount = feeAmount - totalPaid;


    let status = "pending";

    if (dueAmount === 0) {
      status = "paid";
    } else if (totalPaid > 0) {
      status = "partial";
    }


    const paymentId = uuidv4();
    const receiptNumber = generateReceiptNumber();
    
    const pdfUrl = `http://localhost:3030/api/receipts/student-fees/preview/${paymentId}`;
    // Insert payment transaction
    await db.insert(feePayments).values({
      id: paymentId,
      studentFeeId,
      amount: currentPaid.toString(),
      paymentMode,
      transactionId: transactionId || null,
      receiptNumber,
      paidBy: userId,
      remarks: remarks || null,
      pdf_url: pdfUrl,
    });


    // Update student fee
    await db
      .update(studentFees)
      .set({
        paidAmount: totalPaid.toString(),
        dueAmount: dueAmount.toString(),
        status,
        updatedAt: new Date(),
      })
      .where(eq(studentFees.id, studentFeeId));


    // Get updated student fee
    const [updatedStudentFee] = await db
      .select()
      .from(studentFees)
      .where(eq(studentFees.id, studentFeeId))
      .limit(1);


    // Get student details
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentFee.studentId))
      .limit(1);


    // Get latest payment details
    const [payment] = await db
      .select()
      .from(feePayments)
      .where(eq(feePayments.id, paymentId))
      .limit(1);


    return successResponse(
      res,
      {
        payment,
        studentFee: updatedStudentFee,
        student,
      },
      "Payment made successfully",
      201
    );


  } catch (error) {
    console.error("Make payment error:", error);

    return errorResponse(
      res,
      error.message || "Failed to make payment",
      500
    );
  }
};
// ==================== GET PAYMENT BY Fee ID ====================
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Payment ID is required", 400);
    }

    const [payment] = await db
      .select()
      .from(feePayments)
      .where(eq(feePayments.id, id))
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
export const getPaymentsReceptsByStudentFee = async (req, res) => {
  try {
    const { studentFeeId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!studentFeeId) {
      return errorResponse(res, "Student fee ID is required", 400);
    }

    const receiptsData = await db.query.feePayments.findMany({
      where: and(
        eq(feePayments.studentFeeId, studentFeeId),
        eq(feePayments.userId, userId),
      ),
      with: {
        studentFee: true,
      },
      orderBy: (feePayments, { desc }) => [desc(feePayments.createdAt)],
    });

    return successResponse(
      res,
      receiptsData,
      "Payments fetched successfully",
      200,
    );
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