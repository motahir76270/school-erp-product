// src/controllers/studentFeeController.js
import { eq, and, like, count, sql, between, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/db.js";
import { studentFees, feeTypes, feePayments, feePenalties ,students} from "../../db/schema/users.js";
import { successResponse, errorResponse } from "../../lib/response.js";
import { uuid } from "drizzle-orm/pg-core";

// ==================== ASSIGN FEE TO STUDENT ====================
export const assignFeeToStudent = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const {
      studentId,
      feeTypeId,
      amount,
      dueDate,
      discount,
      scholarship,
      academicYear,
      month,
    } = req.body;

    if (!studentId || !feeTypeId || !dueDate || !academicYear) {
      return errorResponse(res, "Student ID, fee type ID, due date, and academic year are required", 400);
    }

    // Check if student exists
    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.userId, userId)))
      .limit(1);

    if (!student) {
      return errorResponse(res, "Student not found", 404);
    }

    // Check if fee type exists
    const [feeType] = await db
      .select()
      .from(feeTypes)
      .where(and(eq(feeTypes.id, feeTypeId), eq(feeTypes.userId, userId)))
      .limit(1);

    if (!feeType) {
      return errorResponse(res, "Fee type not found", 404);
    }

    // Check if fee already assigned for this student and academic year
    const [existingFee] = await db
      .select()
      .from(studentFees)
      .where(
        and(
          eq(studentFees.studentId, studentId),
          eq(studentFees.feeTypeId, feeTypeId),
          eq(studentFees.academicYear, academicYear),
          month ? eq(studentFees.month, month) : sql`1=1`
        )
      )
      .limit(1);

    if (existingFee) {
      return errorResponse(res, "This fee is already assigned to the student for this academic year", 409);
    }

    const studentFeeId = uuidv4();
    const finalAmount = amount || feeType.amount;
    const finalDiscount = discount || 0;
    const finalScholarship = scholarship || 0;

    await db.insert(studentFees).values({
      id: studentFeeId,
      studentId,
      feeTypeId,
      amount: finalAmount.toString(),
      dueDate,
      paidAmount: "0",
      penaltyAmount: "0",
      discount: finalDiscount.toString(),
      scholarship: finalScholarship.toString(),
      status: "pending",
      academicYear,
      month: month || null,
      userId,
    });

    const [newStudentFee] = await db
      .select()
      .from(studentFees)
      .where(eq(studentFees.id, studentFeeId))
      .limit(1);

    return successResponse(res, newStudentFee, "Fee assigned to student successfully", 201);
  } catch (error) {
    console.error("Assign fee error:", error);
    return errorResponse(res, error.message || "Failed to assign fee", 500);
  }
};

// ==================== BULK ASSIGN FEE TO STUDENTS ====================
export const getFeesAssignBySection = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }
    const {
      studentIds,
      feeTypeId,
      amount,
      dueDate,
      discount,
      scholarship,
      academicYear,
      month,
    } = req.body;

    // Validation
    if (
      !studentIds ||
      !Array.isArray(studentIds) ||
      studentIds.length === 0
    ) {
      return errorResponse(res, "Student IDs are required", 400);
    }

    if (!feeTypeId || !dueDate || !academicYear) {
      return errorResponse(
        res,
        "Fee type ID, due date, and academic year are required",
        400
      );
    }

    // Check fee type
    const [feeType] = await db
      .select()
      .from(feeTypes)
      .where(
        and(eq(feeTypes.id, feeTypeId), eq(feeTypes.userId, userId))
      )
      .limit(1);

    if (!feeType) {
      return errorResponse(res, "Fee type not found", 404);
    }

    const finalAmount = amount || feeType.amount;
    const finalDiscount = discount || 0;
    const finalScholarship = scholarship || 0;

    const assignedFees = [];
    const skippedStudents = [];

    for (const studentId of studentIds) {
      // Check student exists
      const student = await db
        .select()
        .from(students)
        .where(
          and(eq(students.id, studentId), eq(students.userId, userId))
        )

      if (!student) {
        skippedStudents.push({
          studentId,
          reason: "Student not found",
        });
        continue;
      }

      // Check existing fee assignment
      const [existingFee] = await db
        .select()
        .from(studentFees)
        .where(
          and(
            eq(studentFees.studentId, studentId),
            eq(studentFees.feeTypeId, feeTypeId),
            eq(studentFees.academicYear, academicYear),
            month ? eq(studentFees.month, month) : sql`1=1`
          )
        )
        .limit(1);

      if (existingFee) {
        skippedStudents.push({
          studentId,
          reason: "Fee already assigned",
        });
        continue;
      }

      const studentFeeId = uuidv4();

      await db.insert(studentFees).values({
        id: studentFeeId,
        userId:userId,
        studentId,
        feeTypeId,
        amount: finalAmount.toString(),
        dueDate,
        paidAmount: "0",
        penaltyAmount: "0",
        discount: finalDiscount.toString(),
        scholarship: finalScholarship.toString(),
        status: "pending",
        academicYear,
        month: month || null,
        userId,
      });

      assignedFees.push(studentFeeId);
    }

    // Fetch inserted records
    const insertedFees =
      assignedFees.length > 0
        ? await db
            .select()
            .from(studentFees)
            .where(inArray(studentFees.id, assignedFees))
        : [];

    return successResponse(
      res,
      {
        assigned: insertedFees,
        skipped: skippedStudents,
        totalAssigned: insertedFees.length,
        totalSkipped: skippedStudents.length,
      },
      "Fees assigned successfully",
      201
    );
  } catch (error) {
    console.error("Bulk assign fee error:", error);
    return errorResponse(
      res,
      error.message || "Failed to assign fees",
      500
    );
  }
};

// ==================== GET STUDENT FEES  ====================
export const getStudentFees = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const { studentId } = req.params;

    if (!studentId) {
      return errorResponse(res, "Student ID is required", 400);
    }

    let query = db
      .select()
      .from(studentFees)
      .where(and(eq(studentFees.studentId, studentId), eq(studentFees.userId, userId)));

    if (status && status !== "all") {
      query = query.where(eq(studentFees.status, status));
    }

    if (academicYear) {
      query = query.where(eq(studentFees.academicYear, academicYear));
    }

    const [totalResult] = await db
      .select({ total: count() })
      .from(studentFees)
      .where(and(eq(studentFees.studentId, studentId), eq(studentFees.userId, userId)));

    const total = totalResult?.total || 0;


    return successResponse(
      res,
      {
        fees: totalResult,
        total:total,
      },
      "Student fees fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get student fees error:", error);
    return errorResponse(res, error.message || "Failed to get student fees", 500);
  }
};

// ==================== GET ALL STUDENT FEES ====================
export const getAllStudentFees = async (req, res) => {
  try {
    const userId = req.user?.id;

    const [feesSummary] = await db
      .select({
        totalAmount: sql`COALESCE(SUM(${studentFees.amount}), 0)`,
        collectedAmount: sql`COALESCE(SUM(${studentFees.paidAmount}), 0)`,
        pendingAmount: sql`COALESCE(SUM(${studentFees.dueAmount}), 0)`,
        overdueAmount: sql`COALESCE(SUM(${studentFees.penaltyAmount}), 0)`,
        totalFees: sql`COUNT(${studentFees.id})`,
      })
      .from(studentFees)
      .where(eq(studentFees.userId, userId));

    return successResponse(
      res,
      feesSummary,
      "Student fees summary fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get student fees summary error:", error);

    return errorResponse(
      res,
      error.message || "Failed to get student fees summary",
      500,
    );
  }
};

// ==================== GET STUDENT FEE BY ID ====================
export const getStudentFeeById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    if (!studentId) {
      return errorResponse(res, "Student fee ID is required", 400);
    }

    const fees = await db.query.studentFees.findMany({
      where: (studentFees, { eq }) => eq(studentFees.studentId, studentId),
      with: {
        feeType: true,
        penalties: true,
      },
    });

    const today = new Date();

    for (const fee in fees) {
      if (
        fee.status !== "paid" &&
        today > new Date(fee.dueDate) &&
        fee.feeType.status === "active"
      ) {
        const daysLate = Math.floor(
          (today.getTime() - new Date(fee.dueDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        const penalty = daysLate * Number(fee.feeType.penaltyPerDay);

            
        await db
          .update(studentFees)
          .set({
            penaltyAmount: penalty.toString(),
            updatedAt: new Date(),
          })
          .where(eq(studentFees.feeTypeId, fee.id));

        // Check existing penalty
        const existingPenalty = await db.query.feePenalties.findFirst({
          where: (feePenalties, { eq }) =>
            eq(feePenalties.studentFeeId, fee.id),
        });

        if (existingPenalty) {
          // Update existing penalty
          await db
            .update(feePenalties)
            .set({
              amount: penalty.toString(),
              daysLate: daysLate,
              penaltyPerDay: fee.feeType.penaltyPerDay,
            })
            .where(eq(feePenalties.id, existingPenalty.id));
        } else {
          // Create new penalty
          await db.insert(feePenalties).values({
            id: uuidv4(),
            studentFeeId: fee.id,
            amount: penalty.toString(),
            daysLate: daysLate,
            penaltyPerDay: fee.feeType.penaltyPerDay,
          });
        }

      }
    }

    if (!fees) {
      return errorResponse(res, "Student fee not found", 404);
    }

    return successResponse(res, fees, "Student fee fetched successfully", 200);
  } catch (error) {
    console.error("Get student fee error:", error);
    return errorResponse(res, error.message || "Failed to get student fee", 500);
  }
};
