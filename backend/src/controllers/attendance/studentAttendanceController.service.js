// src/controllers/attendanceController.js
import { eq, and, desc, between, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/db.js";
import {
  studentAttendance,
  studentAttendanceLogs,
  students,
} from "../../db/schema/users.js";
import { successResponse, errorResponse } from "../../lib/response.js";

// ==================== MARK ATTENDANCE ====================
export const markAttendance = async (req, res) => {
  try {
    const {
      date,
      classId,
      sectionId,
      markingMethod = "manual",
      students: studentList,
    } = req.body;

    const markedBy = req.user?.id;

    // Validate required fields
    if (
      !date ||
      !classId ||
      !studentList ||
      !Array.isArray(studentList) ||
      studentList.length === 0
    ) {
      return errorResponse(
        res,
        "Required fields missing: date, classId, students array",
        400,
      );
    }

    if (!markedBy) {
      return errorResponse(res, "User not authenticated", 401);
    }

    // Check if attendance already marked for this date
    const existingAttendance = await db
      .select()
      .from(studentAttendance)
      .where(
        and(
          eq(studentAttendance.date, date),
          eq(studentAttendance.classId, classId),
          sectionId
            ? eq(studentAttendance.sectionId, sectionId)
            : eq(studentAttendance.sectionId, null),
        ),
      )
      .limit(1);

    if (existingAttendance.length > 0) {
      return errorResponse(
        res,
        "Attendance already marked for this date and class",
        409,
      );
    }

    const attendanceId = uuidv4();

    // Create attendance record
    const [newAttendance] = await db
      .insert(studentAttendance)
      .values({
        id: attendanceId,
        date: date,
        classId: classId,
        sectionId: sectionId || null,
        markedBy: markedBy,
        markingMethod: markingMethod,
      })
      .returning();

    if (!newAttendance) {
      return errorResponse(res, "Failed to create attendance record", 500);
    }

    // Insert attendance logs for each student
    const attendanceLogsData = studentList.map((student) => ({
      id: uuidv4(),
      attendanceId: attendanceId,
      studentId: student.studentId,
      status: student.status || "present",
    }));

    const insertedLogs = await db
      .insert(studentAttendanceLogs)
      .values(attendanceLogsData)
      .returning();

    // Get student details for response
    const logsWithStudents = await Promise.all(
      insertedLogs.map(async (log) => {
        const [student] = await db
          .select({
            id: students.id,
            name: students.name,
            rollNumber: students.rollNumber,
          })
          .from(students)
          .where(eq(students.id, log.studentId))
          .limit(1);
        return {
          ...log,
          student: student || null,
        };
      }),
    );

    return successResponse(
      res,
      {
        attendance: newAttendance,
        logs: logsWithStudents,
        totalStudents: logsWithStudents.length,
      },
      "Attendance marked successfully",
      201,
    );
  } catch (error) {
    console.error("Mark attendance error:", error);
    return errorResponse(
      res,
      error.message || "Failed to mark attendance",
      500,
    );
  }
};

// ==================== MARK ATTENDANCE VIA QR CODE ====================
export const markAttendanceViaQR = async (req, res) => {
  try {
    const { studentId, date, classId, sectionId } = req.body;
    const markedBy = req.user?.id;

    // Validate required fields
    if (!studentId || !date || !classId) {
      return errorResponse(
        res,
        "Required fields missing: studentId, date, classId",
        400,
      );
    }

    if (!markedBy) {
      return errorResponse(res, "User not authenticated", 401);
    }

    // Check if student exists
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student) {
      return errorResponse(res, "Student not found", 404);
    }

    // Check if attendance already exists for this date
    let existingAttendance = await db
      .select()
      .from(studentAttendance)
      .where(
        and(
          eq(studentAttendance.date, date),
          eq(studentAttendance.classId, classId),
          sectionId
            ? eq(studentAttendance.sectionId, sectionId)
            : eq(studentAttendance.sectionId, null),
        ),
      )
      .limit(1);

    let attendanceId;

    if (existingAttendance.length === 0) {
      // Create new attendance record
      const [newAttendance] = await db
        .insert(studentAttendance)
        .values({
          id: uuidv4(),
          date: date,
          classId: classId,
          sectionId: sectionId || null,
          markedBy: markedBy,
          markingMethod: "qrcode",
        })
        .returning();

      if (!newAttendance) {
        return errorResponse(res, "Failed to create attendance record", 500);
      }
      attendanceId = newAttendance.id;
    } else {
      attendanceId = existingAttendance[0].id;
    }

    // Check if student already marked attendance for this date
    const existingLog = await db
      .select()
      .from(studentAttendanceLogs)
      .where(
        and(
          eq(studentAttendanceLogs.attendanceId, attendanceId),
          eq(studentAttendanceLogs.studentId, studentId),
        ),
      )
      .limit(1);

    if (existingLog.length > 0) {
      // Update existing log
      const [updatedLog] = await db
        .update(studentAttendanceLogs)
        .set({
          status: "present",
          markedAt: new Date(),
        })
        .where(eq(studentAttendanceLogs.id, existingLog[0].id))
        .returning();

      return successResponse(
        res,
        {
          log: updatedLog,
          student: {
            id: student.id,
            name: student.name,
            rollNumber: student.rollNumber,
          },
          message: "Attendance updated via QR scan",
        },
        "Attendance updated successfully",
        200,
      );
    }

    // Create new attendance log via QR
    const [newLog] = await db
      .insert(studentAttendanceLogs)
      .values({
        id: uuidv4(),
        attendanceId: attendanceId,
        studentId: studentId,
        status: "present",
      })
      .returning();

    if (!newLog) {
      return errorResponse(res, "Failed to mark attendance via QR", 500);
    }

    // Get updated attendance
    const [updatedAttendance] = await db
      .select()
      .from(studentAttendance)
      .where(eq(studentAttendance.id, attendanceId))
      .limit(1);

    return successResponse(
      res,
      {
        attendance: updatedAttendance,
        log: newLog,
        student: {
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
        },
      },
      "Attendance marked via QR successfully",
      201,
    );
  } catch (error) {
    console.error("Mark attendance via QR error:", error);
    return errorResponse(
      res,
      error.message || "Failed to mark attendance via QR",
      500,
    );
  }
};

// ==================== GET ATTENDANCE BY DATE ====================
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date, classId, sectionId } = req.query;

    if (!date || !classId) {
      return errorResponse(res, "Date and classId are required", 400);
    }

    let attendanceRecords = await db
      .select()
      .from(studentAttendance)
      .where(
        and(
          eq(studentAttendance.date, date),
          eq(studentAttendance.classId, classId),
          sectionId
            ? eq(studentAttendance.sectionId, sectionId)
            : eq(studentAttendance.sectionId, null),
        ),
      );

    if (attendanceRecords.length === 0) {
      return successResponse(
        res,
        {
          attendance: null,
          logs: [],
          message: "No attendance found for this date",
        },
        "No attendance found",
        200,
      );
    }

    const attendanceId = attendanceRecords[0].id;

    // Get attendance logs with student details
    const logs = await db
      .select({
        id: studentAttendanceLogs.id,
        studentId: studentAttendanceLogs.studentId,
        status: studentAttendanceLogs.status,
        markedAt: studentAttendanceLogs.markedAt,
        studentName: students.name,
        studentRollNumber: students.rollNumber,
        studentEmail: students.email,
        studentProfileImage: students.profileImage,
      })
      .from(studentAttendanceLogs)
      .leftJoin(students, eq(students.id, studentAttendanceLogs.studentId))
      .where(eq(studentAttendanceLogs.attendanceId, attendanceId));

    return successResponse(
      res,
      {
        attendance: attendanceRecords[0],
        logs: logs,
        totalStudents: logs.length,
      },
      "Attendance fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get attendance by date error:", error);
    return errorResponse(res, error.message || "Failed to get attendance", 500);
  }
};

// ==================== GET ATTENDANCE BY STUDENT ====================
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, limit = 100, offset = 0 } = req.query;

    if (!studentId) {
      return errorResponse(res, "Student ID is required", 400);
    }

    // Build where conditions
    let conditions = eq(studentAttendanceLogs.studentId, studentId);

    if (startDate && endDate) {
      conditions = and(
        conditions,
        between(studentAttendance.date, startDate, endDate),
      );
    }

    const logs = await db
      .select({
        id: studentAttendanceLogs.id,
        attendanceId: studentAttendanceLogs.attendanceId,
        studentId: studentAttendanceLogs.studentId,
        status: studentAttendanceLogs.status,
        markedAt: studentAttendanceLogs.markedAt,
        date: studentAttendance.date,
        classId: studentAttendance.classId,
        sectionId: studentAttendance.sectionId,
        markedBy: studentAttendance.markedBy,
        markingMethod: studentAttendance.markingMethod,
      })
      .from(studentAttendanceLogs)
      .innerJoin(
        studentAttendance,
        eq(studentAttendance.id, studentAttendanceLogs.attendanceId),
      )
      .where(conditions)
      .orderBy(desc(studentAttendance.date))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Get total count
    const [countResult] = await db
      .select({
        total: sql`COUNT(*)`.as("total"),
      })
      .from(studentAttendanceLogs)
      .innerJoin(
        studentAttendance,
        eq(studentAttendance.id, studentAttendanceLogs.attendanceId),
      )
      .where(conditions);

    const total = parseInt(countResult?.total || 0);

    return successResponse(
      res,
      {
        logs: logs,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total,
          hasMore: offset + logs.length < total,
        },
      },
      "Student attendance fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get student attendance error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get student attendance",
      500,
    );
  }
};

// ==================== UPDATE ATTENDANCE STATUS ====================
export const updateAttendanceStatus = async (req, res) => {
  try {
    const { logId } = req.params;
    const { status } = req.body;

    if (!logId) {
      return errorResponse(res, "Attendance log ID is required", 400);
    }

    if (!status) {
      return errorResponse(res, "Status is required", 400);
    }

    if (!["present", "absent", "late", "leave"].includes(status)) {
      return errorResponse(
        res,
        "Invalid status. Must be: present, absent, late, leave",
        400,
      );
    }

    const [existingLog] = await db
      .select()
      .from(studentAttendanceLogs)
      .where(eq(studentAttendanceLogs.id, logId))
      .limit(1);

    if (!existingLog) {
      return errorResponse(res, "Attendance log not found", 404);
    }

    const [updatedLog] = await db
      .update(studentAttendanceLogs)
      .set({
        status: status,
        markedAt: new Date(),
      })
      .where(eq(studentAttendanceLogs.id, logId))
      .returning();

    if (!updatedLog) {
      return errorResponse(res, "Failed to update attendance status", 500);
    }

    return successResponse(
      res,
      updatedLog,
      "Attendance status updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update attendance status error:", error);
    return errorResponse(
      res,
      error.message || "Failed to update attendance status",
      500,
    );
  }
};

// ==================== GET ATTENDANCE SUMMARY ====================
export const getAttendanceSummary = async (req, res) => {
  try {
    const { classId, sectionId, startDate, endDate } = req.query;

    if (!classId || !startDate || !endDate) {
      return errorResponse(
        res,
        "classId, startDate, and endDate are required",
        400,
      );
    }

    // Get all students in the class
    let classStudents = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.classId, classId),
          sectionId ? eq(students.sectionId, sectionId) : sql`1=1`,
        ),
      );

    // Get attendance records for the date range
    const attendanceRecords = await db
      .select()
      .from(studentAttendance)
      .where(
        and(
          eq(studentAttendance.classId, classId),
          between(studentAttendance.date, startDate, endDate),
          sectionId ? eq(studentAttendance.sectionId, sectionId) : sql`1=1`,
        ),
      );

    // Generate summary for each student
    const summary = await Promise.all(
      classStudents.map(async (student) => {
        let present = 0,
          absent = 0,
          late = 0,
          leave = 0;

        for (const record of attendanceRecords) {
          const [log] = await db
            .select()
            .from(studentAttendanceLogs)
            .where(
              and(
                eq(studentAttendanceLogs.attendanceId, record.id),
                eq(studentAttendanceLogs.studentId, student.id),
              ),
            )
            .limit(1);

          if (log) {
            switch (log.status) {
              case "present":
                present++;
                break;
              case "absent":
                absent++;
                break;
              case "late":
                late++;
                break;
              case "leave":
                leave++;
                break;
            }
          } else {
            absent++; // Count as absent if no log found
          }
        }

        const totalDays = attendanceRecords.length;
        const attendedDays = present + late;
        const percentage = totalDays > 0 ? (attendedDays / totalDays) * 100 : 0;

        return {
          student: {
            id: student.id,
            name: student.name,
            rollNumber: student.rollNumber,
            email: student.email,
          },
          attendance: {
            present,
            absent,
            late,
            leave,
            totalDays,
            attendedDays,
            percentage: Math.round(percentage * 100) / 100,
          },
        };
      }),
    );

    return successResponse(
      res,
      {
        summary,
        classId,
        sectionId: sectionId || null,
        dateRange: { startDate, endDate },
        totalStudents: summary.length,
        totalDays: attendanceRecords.length,
      },
      "Attendance summary fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get attendance summary error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get attendance summary",
      500,
    );
  }
};

// ==================== DELETE ATTENDANCE RECORD ====================
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Attendance ID is required", 400);
    }

    const [existingAttendance] = await db
      .select()
      .from(studentAttendance)
      .where(eq(studentAttendance.id, id))
      .limit(1);

    if (!existingAttendance) {
      return errorResponse(res, "Attendance record not found", 404);
    }

    // Delete all logs first
    await db
      .delete(studentAttendanceLogs)
      .where(eq(studentAttendanceLogs.attendanceId, id));

    // Delete attendance record
    await db.delete(studentAttendance).where(eq(studentAttendance.id, id));

    return successResponse(
      res,
      null,
      "Attendance record deleted successfully",
      200,
    );
  } catch (error) {
    console.error("Delete attendance error:", error);
    return errorResponse(
      res,
      error.message || "Failed to delete attendance",
      500,
    );
  }
};

// ==================== GET TODAY'S ATTENDANCE ====================
export const getTodayAttendance = async (req, res) => {
  try {
    const { classId, sectionId } = req.query;
    const today = new Date().toISOString().split("T")[0];

    if (!classId) {
      return errorResponse(res, "Class ID is required", 400);
    }

    const attendanceRecords = await db
      .select()
      .from(studentAttendance)
      .where(
        and(
          eq(studentAttendance.date, today),
          eq(studentAttendance.classId, classId),
          sectionId
            ? eq(studentAttendance.sectionId, sectionId)
            : eq(studentAttendance.sectionId, null),
        ),
      );

    if (attendanceRecords.length === 0) {
      return successResponse(
        res,
        {
          attendance: null,
          logs: [],
          message: "No attendance marked for today",
        },
        "No attendance for today",
        200,
      );
    }

    const attendanceId = attendanceRecords[0].id;

    const logs = await db
      .select({
        id: studentAttendanceLogs.id,
        studentId: studentAttendanceLogs.studentId,
        status: studentAttendanceLogs.status,
        markedAt: studentAttendanceLogs.markedAt,
        studentName: students.name,
        studentRollNumber: students.rollNumber,
        studentEmail: students.email,
        studentProfileImage: students.profileImage,
      })
      .from(studentAttendanceLogs)
      .leftJoin(students, eq(students.id, studentAttendanceLogs.studentId))
      .where(eq(studentAttendanceLogs.attendanceId, attendanceId));

    // Get all students in class to check who hasn't been marked
    const allStudents = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.classId, classId),
          sectionId ? eq(students.sectionId, sectionId) : sql`1=1`,
        ),
      );

    const markedStudentIds = logs.map((log) => log.studentId);
    const unmarkedStudents = allStudents.filter(
      (student) => !markedStudentIds.includes(student.id),
    );

    return successResponse(
      res,
      {
        attendance: attendanceRecords[0],
        logs: logs,
        unmarkedStudents: unmarkedStudents.map((s) => ({
          id: s.id,
          name: s.name,
          rollNumber: s.rollNumber,
        })),
        totalMarked: logs.length,
        totalStudents: allStudents.length,
        totalUnmarked: unmarkedStudents.length,
      },
      "Today's attendance fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get today's attendance error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get today's attendance",
      500,
    );
  }
};
