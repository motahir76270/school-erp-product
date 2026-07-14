// src/controllers/attendanceController.js
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/db.js";
import {
  attendance,
  attendanceLogs,
  students,
} from "../db/schema/users.js";
import { successResponse, errorResponse } from "../lib/response.js";

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
      .from(attendance)
      .where(
        and(
          eq(attendance.date, date),
          eq(attendance.classId, classId),
          sectionId
            ? eq(attendance.sectionId, sectionId)
            : eq(attendance.sectionId, null),
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
      .insert(attendance)
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
      checkInTime: student.checkInTime || null,
      checkOutTime: student.checkOutTime || null,
      remarks: student.remarks || null,
    }));

    const insertedLogs = await db
      .insert(attendanceLogs)
      .values(attendanceLogsData)
      .returning();

    return successResponse(
      res,
      {
        attendance: newAttendance,
        logs: insertedLogs,
        totalStudents: insertedLogs.length,
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
    const { studentId, date, classId, sectionId, checkInTime } = req.body;
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
      .from(attendance)
      .where(
        and(
          eq(attendance.date, date),
          eq(attendance.classId, classId),
          sectionId
            ? eq(attendance.sectionId, sectionId)
            : eq(attendance.sectionId, null),
        ),
      )
      .limit(1);

    let attendanceId;

    if (existingAttendance.length === 0) {
      // Create new attendance record
      const [newAttendance] = await db
        .insert(attendance)
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
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.attendanceId, attendanceId),
          eq(attendanceLogs.studentId, studentId),
        ),
      )
      .limit(1);

    if (existingLog.length > 0) {
      // Update existing log with check-in time
      const [updatedLog] = await db
        .update(attendanceLogs)
        .set({
          checkInTime: checkInTime || new Date().toTimeString().slice(0, 8),
          status: "present",
          markedAt: new Date(),
        })
        .where(eq(attendanceLogs.id, existingLog[0].id))
        .returning();

      return successResponse(
        res,
        {
          attendance: existingAttendance[0],
          log: updatedLog,
          message: "Attendance updated via QR scan",
        },
        "Attendance updated successfully",
        200,
      );
    }

    // Create new attendance log via QR
    const [newLog] = await db
      .insert(attendanceLogs)
      .values({
        id: uuidv4(),
        attendanceId: attendanceId,
        studentId: studentId,
        status: "present",
        checkInTime: checkInTime || new Date().toTimeString().slice(0, 8),
        remarks: "Marked via QR code scan",
      })
      .returning();

    if (!newLog) {
      return errorResponse(res, "Failed to mark attendance via QR", 500);
    }

    // Get updated attendance
    const [updatedAttendance] = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, attendanceId))
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

    let query = db
      .select()
      .from(attendance)
      .where(and(eq(attendance.date, date), eq(attendance.classId, classId)));

    if (sectionId) {
      query = query.where(eq(attendance.sectionId, sectionId));
    }

    const attendanceRecords = await query;

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
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.attendanceId, attendanceId));

    // Get student details for each log
    const logsWithStudents = await Promise.all(
      logs.map(async (log) => {
        const [student] = await db
          .select()
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
        attendance: attendanceRecords[0],
        logs: logsWithStudents,
        totalStudents: logsWithStudents.length,
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

    let query = db
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.studentId, studentId));

    // Join with attendance table to filter by date
    const logs = await db
      .select({
        log: attendanceLogs,
        attendance: attendance,
      })
      .from(attendanceLogs)
      .innerJoin(attendance, eq(attendance.id, attendanceLogs.attendanceId))
      .where(eq(attendanceLogs.studentId, studentId))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const total = logs.length;

    const formattedLogs = logs.map((item) => ({
      ...item.log,
      date: item.attendance.date,
      classId: item.attendance.classId,
      sectionId: item.attendance.sectionId,
      markedBy: item.attendance.markedBy,
      markingMethod: item.attendance.markingMethod,
    }));

    return successResponse(
      res,
      {
        logs: formattedLogs,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total,
          hasMore: total === parseInt(limit),
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
    const { status, checkInTime, checkOutTime, remarks } = req.body;

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
      .from(attendanceLogs)
      .where(eq(attendanceLogs.id, logId))
      .limit(1);

    if (!existingLog) {
      return errorResponse(res, "Attendance log not found", 404);
    }

    const updateData = {
      status: status,
      updatedAt: new Date(),
    };

    if (checkInTime !== undefined) updateData.checkInTime = checkInTime;
    if (checkOutTime !== undefined) updateData.checkOutTime = checkOutTime;
    if (remarks !== undefined) updateData.remarks = remarks;

    const [updatedLog] = await db
      .update(attendanceLogs)
      .set(updateData)
      .where(eq(attendanceLogs.id, logId))
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
    const classStudents = await db
      .select()
      .from(students)
      .where(eq(students.classId, classId));

    if (sectionId) {
      // Filter by section if provided
      const filteredStudents = classStudents.filter(
        (student) => student.sectionId === sectionId,
      );
      classStudents.length = 0;
      classStudents.push(...filteredStudents);
    }

    // Get attendance for the date range
    const attendanceRecords = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.classId, classId),
          sectionId
            ? eq(attendance.sectionId, sectionId)
            : eq(attendance.sectionId, null),
        ),
      );

    // Get logs for each attendance record
    const summary = await Promise.all(
      classStudents.map(async (student) => {
        let present = 0,
          absent = 0,
          late = 0,
          leave = 0;

        for (const record of attendanceRecords) {
          const [log] = await db
            .select()
            .from(attendanceLogs)
            .where(
              and(
                eq(attendanceLogs.attendanceId, record.id),
                eq(attendanceLogs.studentId, student.id),
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
          }
        }

        const totalDays = attendanceRecords.length;
        const percentage =
          totalDays > 0 ? ((present + late) / totalDays) * 100 : 0;

        return {
          student: {
            id: student.id,
            name: student.name,
            rollNumber: student.rollNumber,
          },
          attendance: {
            present,
            absent,
            late,
            leave,
            totalDays,
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
      .from(attendance)
      .where(eq(attendance.id, id))
      .limit(1);

    if (!existingAttendance) {
      return errorResponse(res, "Attendance record not found", 404);
    }

    // Delete all logs first
    await db.delete(attendanceLogs).where(eq(attendanceLogs.attendanceId, id));

    // Delete attendance record
    await db.delete(attendance).where(eq(attendance.id, id));

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
