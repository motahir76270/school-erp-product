// src/controllers/teacherAttendanceController.js
import { eq, and, between, desc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/db.js";
import {
  teacherAttendance,
  teacherAttendanceLogs,
  teachers,
  users,
} from "../../db/schema/users.js";
import { successResponse, errorResponse } from "../../lib/response.js";

// ==================== MARK TEACHER ATTENDANCE ====================
export const markTeacherAttendance = async (req, res) => {
  try {
    const { date, markingMethod = "manual", teachers: teacherList } = req.body;

    const markedBy = req.user?.id;

    // Validate required fields
    if (
      !date ||
      !teacherList ||
      !Array.isArray(teacherList) ||
      teacherList.length === 0
    ) {
      return errorResponse(
        res,
        "Required fields missing: date, teachers array",
        400,
      );
    }

    if (!markedBy) {
      return errorResponse(res, "User not authenticated", 401);
    }

    // Check if attendance already marked for this date
    const existingAttendance = await db
      .select()
      .from(teacherAttendance)
      .where(eq(teacherAttendance.date, date))
      .limit(1);

    if (existingAttendance.length > 0) {
      return errorResponse(
        res,
        "Teacher attendance already marked for this date",
        409,
      );
    }

    const attendanceId = uuidv4();

    // Create attendance record
    const [newAttendance] = await db
      .insert(teacherAttendance)
      .values({
        id: attendanceId,
        date: date,
        markedBy: markedBy,
        markingMethod: markingMethod,
      })
      .returning();

    if (!newAttendance) {
      return errorResponse(res, "Failed to create attendance record", 500);
    }

    // Insert attendance logs for each teacher
    const attendanceLogsData = teacherList.map((teacher) => ({
      id: uuidv4(),
      attendanceId: attendanceId,
      teacherId: teacher.teacherId,
      status: teacher.status || "present",
    }));

    const insertedLogs = await db
      .insert(teacherAttendanceLogs)
      .values(attendanceLogsData)
      .returning();

    // Get teacher details for response
    const logsWithTeachers = await Promise.all(
      insertedLogs.map(async (log) => {
        const [teacher] = await db
          .select({
            id: teachers.id,
            name: teachers.name,
            employeeId: teachers.employeeId,
            email: teachers.email,
            profileImage: teachers.profileImage,
          })
          .from(teachers)
          .where(eq(teachers.id, log.teacherId))
          .limit(1);
        return {
          ...log,
          teacher: teacher || null,
        };
      }),
    );

    return successResponse(
      res,
      {
        attendance: newAttendance,
        logs: logsWithTeachers,
        totalTeachers: logsWithTeachers.length,
      },
      "Teacher attendance marked successfully",
      201,
    );
  } catch (error) {
    console.error("Mark teacher attendance error:", error);
    return errorResponse(
      res,
      error.message || "Failed to mark teacher attendance",
      500,
    );
  }
};

// ==================== MARK TEACHER ATTENDANCE VIA QR ====================
export const markTeacherAttendanceViaQR = async (req, res) => {
  try {
    const { teacherId, date } = req.body;
    const markedBy = req.user?.id;

    // Validate required fields
    if (!teacherId || !date) {
      return errorResponse(
        res,
        "Required fields missing: teacherId, date",
        400,
      );
    }

    if (!markedBy) {
      return errorResponse(res, "User not authenticated", 401);
    }

    // Check if teacher exists
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!teacher) {
      return errorResponse(res, "Teacher not found", 404);
    }

    // Check if attendance already exists for this date
    let existingAttendance = await db
      .select()
      .from(teacherAttendance)
      .where(eq(teacherAttendance.date, date))
      .limit(1);

    let attendanceId;

    if (existingAttendance.length === 0) {
      // Create new attendance record
      const [newAttendance] = await db
        .insert(teacherAttendance)
        .values({
          id: uuidv4(),
          date: date,
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

    // Check if teacher already marked attendance for this date
    const existingLog = await db
      .select()
      .from(teacherAttendanceLogs)
      .where(
        and(
          eq(teacherAttendanceLogs.attendanceId, attendanceId),
          eq(teacherAttendanceLogs.teacherId, teacherId),
        ),
      )
      .limit(1);

    if (existingLog.length > 0) {
      // Update existing log
      const [updatedLog] = await db
        .update(teacherAttendanceLogs)
        .set({
          status: "present",
          markedAt: new Date(),
        })
        .where(eq(teacherAttendanceLogs.id, existingLog[0].id))
        .returning();

      return successResponse(
        res,
        {
          log: updatedLog,
          teacher: {
            id: teacher.id,
            name: teacher.name,
            employeeId: teacher.employeeId,
          },
          message: "Teacher attendance updated via QR scan",
        },
        "Attendance updated successfully",
        200,
      );
    }

    // Create new attendance log via QR
    const [newLog] = await db
      .insert(teacherAttendanceLogs)
      .values({
        id: uuidv4(),
        attendanceId: attendanceId,
        teacherId: teacherId,
        status: "present",
      })
      .returning();

    if (!newLog) {
      return errorResponse(
        res,
        "Failed to mark teacher attendance via QR",
        500,
      );
    }

    // Get updated attendance
    const [updatedAttendance] = await db
      .select()
      .from(teacherAttendance)
      .where(eq(teacherAttendance.id, attendanceId))
      .limit(1);

    return successResponse(
      res,
      {
        attendance: updatedAttendance,
        log: newLog,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          employeeId: teacher.employeeId,
        },
      },
      "Teacher attendance marked via QR successfully",
      201,
    );
  } catch (error) {
    console.error("Mark teacher attendance via QR error:", error);
    return errorResponse(
      res,
      error.message || "Failed to mark teacher attendance via QR",
      500,
    );
  }
};

// ==================== GET TEACHER ATTENDANCE BY DATE ====================
export const getTeacherAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return errorResponse(res, "Date is required", 400);
    }

    const attendanceRecords = await db
      .select()
      .from(teacherAttendance)
      .where(eq(teacherAttendance.date, date));

    if (attendanceRecords.length === 0) {
      return successResponse(
        res,
        {
          attendance: null,
          logs: [],
          message: "No teacher attendance found for this date",
        },
        "No attendance found",
        200,
      );
    }

    const attendanceId = attendanceRecords[0].id;

    // Get attendance logs with teacher details
    const logs = await db
      .select({
        id: teacherAttendanceLogs.id,
        teacherId: teacherAttendanceLogs.teacherId,
        status: teacherAttendanceLogs.status,
        markedAt: teacherAttendanceLogs.markedAt,
        teacherName: teachers.name,
        teacherEmployeeId: teachers.employeeId,
        teacherEmail: teachers.email,
        teacherProfileImage: teachers.profileImage,
        teacherQualification: teachers.qualification,
        teacherSpecialization: teachers.specialization,
      })
      .from(teacherAttendanceLogs)
      .leftJoin(teachers, eq(teachers.id, teacherAttendanceLogs.teacherId))
      .where(eq(teacherAttendanceLogs.attendanceId, attendanceId));

    // Get marked by user details
    const [markedByUser] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, attendanceRecords[0].markedBy))
      .limit(1);

    return successResponse(
      res,
      {
        attendance: {
          ...attendanceRecords[0],
          markedByUser: markedByUser || null,
        },
        logs: logs,
        totalTeachers: logs.length,
      },
      "Teacher attendance fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get teacher attendance by date error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get teacher attendance",
      500,
    );
  }
};

// ==================== GET TEACHER ATTENDANCE BY TEACHER ====================
export const getTeacherAttendanceByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { startDate, endDate, limit = 100, offset = 0 } = req.query;

    if (!teacherId) {
      return errorResponse(res, "Teacher ID is required", 400);
    }

    // Build where conditions
    let conditions = eq(teacherAttendanceLogs.teacherId, teacherId);

    if (startDate && endDate) {
      conditions = and(
        conditions,
        between(teacherAttendance.date, startDate, endDate),
      );
    }

    const logs = await db
      .select({
        id: teacherAttendanceLogs.id,
        attendanceId: teacherAttendanceLogs.attendanceId,
        teacherId: teacherAttendanceLogs.teacherId,
        status: teacherAttendanceLogs.status,
        markedAt: teacherAttendanceLogs.markedAt,
        date: teacherAttendance.date,
        markedBy: teacherAttendance.markedBy,
        markingMethod: teacherAttendance.markingMethod,
        createdAt: teacherAttendance.createdAt,
      })
      .from(teacherAttendanceLogs)
      .innerJoin(
        teacherAttendance,
        eq(teacherAttendance.id, teacherAttendanceLogs.attendanceId),
      )
      .where(conditions)
      .orderBy(desc(teacherAttendance.date))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Get total count
    const [countResult] = await db
      .select({
        total: sql`COUNT(*)`.as("total"),
      })
      .from(teacherAttendanceLogs)
      .innerJoin(
        teacherAttendance,
        eq(teacherAttendance.id, teacherAttendanceLogs.attendanceId),
      )
      .where(conditions);

    const total = parseInt(countResult?.total || 0);

    // Get teacher details
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    return successResponse(
      res,
      {
        teacher: teacher || null,
        logs: logs,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total,
          hasMore: offset + logs.length < total,
        },
      },
      "Teacher attendance fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get teacher attendance by teacher error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get teacher attendance",
      500,
    );
  }
};

// ==================== UPDATE TEACHER ATTENDANCE STATUS ====================
export const updateTeacherAttendanceStatus = async (req, res) => {
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
      .from(teacherAttendanceLogs)
      .where(eq(teacherAttendanceLogs.id, logId))
      .limit(1);

    if (!existingLog) {
      return errorResponse(res, "Teacher attendance log not found", 404);
    }

    const [updatedLog] = await db
      .update(teacherAttendanceLogs)
      .set({
        status: status,
        markedAt: new Date(),
      })
      .where(eq(teacherAttendanceLogs.id, logId))
      .returning();

    if (!updatedLog) {
      return errorResponse(
        res,
        "Failed to update teacher attendance status",
        500,
      );
    }

    return successResponse(
      res,
      updatedLog,
      "Teacher attendance status updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update teacher attendance status error:", error);
    return errorResponse(
      res,
      error.message || "Failed to update teacher attendance status",
      500,
    );
  }
};

// ==================== GET TEACHER ATTENDANCE SUMMARY ====================
export const getTeacherAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return errorResponse(res, "startDate and endDate are required", 400);
    }

    // Get all active teachers
    const allTeachers = await db
      .select()
      .from(teachers)
      .where(eq(teachers.isActive, true));

    // Get attendance records for the date range
    const attendanceRecords = await db
      .select()
      .from(teacherAttendance)
      .where(between(teacherAttendance.date, startDate, endDate));

    // Generate summary for each teacher
    const summary = await Promise.all(
      allTeachers.map(async (teacher) => {
        let present = 0,
          absent = 0,
          late = 0,
          leave = 0;

        for (const record of attendanceRecords) {
          const [log] = await db
            .select()
            .from(teacherAttendanceLogs)
            .where(
              and(
                eq(teacherAttendanceLogs.attendanceId, record.id),
                eq(teacherAttendanceLogs.teacherId, teacher.id),
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
          teacher: {
            id: teacher.id,
            name: teacher.name,
            employeeId: teacher.employeeId,
            email: teacher.email,
            qualification: teacher.qualification,
            specialization: teacher.specialization,
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

    // Calculate overall statistics
    const totalTeachers = summary.length;
    const totalAttendanceDays = attendanceRecords.length;
    const totalPresent = summary.reduce(
      (sum, s) => sum + s.attendance.present,
      0,
    );
    const totalAbsent = summary.reduce(
      (sum, s) => sum + s.attendance.absent,
      0,
    );
    const totalLate = summary.reduce((sum, s) => sum + s.attendance.late, 0);
    const totalLeave = summary.reduce((sum, s) => sum + s.attendance.leave, 0);
    const overallAttendancePercentage =
      totalTeachers > 0 && totalAttendanceDays > 0
        ? ((totalPresent + totalLate) / (totalTeachers * totalAttendanceDays)) *
          100
        : 0;

    return successResponse(
      res,
      {
        summary,
        statistics: {
          totalTeachers,
          totalAttendanceDays,
          totalPresent,
          totalAbsent,
          totalLate,
          totalLeave,
          overallAttendancePercentage:
            Math.round(overallAttendancePercentage * 100) / 100,
        },
        dateRange: { startDate, endDate },
      },
      "Teacher attendance summary fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get teacher attendance summary error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get teacher attendance summary",
      500,
    );
  }
};

// ==================== DELETE TEACHER ATTENDANCE RECORD ====================
export const deleteTeacherAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Attendance ID is required", 400);
    }

    const [existingAttendance] = await db
      .select()
      .from(teacherAttendance)
      .where(eq(teacherAttendance.id, id))
      .limit(1);

    if (!existingAttendance) {
      return errorResponse(res, "Teacher attendance record not found", 404);
    }

    // Delete all logs first
    await db
      .delete(teacherAttendanceLogs)
      .where(eq(teacherAttendanceLogs.attendanceId, id));

    // Delete attendance record
    await db.delete(teacherAttendance).where(eq(teacherAttendance.id, id));

    return successResponse(
      res,
      null,
      "Teacher attendance record deleted successfully",
      200,
    );
  } catch (error) {
    console.error("Delete teacher attendance error:", error);
    return errorResponse(
      res,
      error.message || "Failed to delete teacher attendance",
      500,
    );
  }
};

// ==================== GET TODAY'S TEACHER ATTENDANCE ====================
export const getTodayTeacherAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const attendanceRecords = await db
      .select()
      .from(teacherAttendance)
      .where(eq(teacherAttendance.date, today));

    if (attendanceRecords.length === 0) {
      // Get all active teachers for status display
      const allTeachers = await db
        .select()
        .from(teachers)
        .where(eq(teachers.isActive, true));

      return successResponse(
        res,
        {
          attendance: null,
          logs: [],
          allTeachers: allTeachers.map((t) => ({
            id: t.id,
            name: t.name,
            employeeId: t.employeeId,
          })),
          totalMarked: 0,
          totalTeachers: allTeachers.length,
          totalUnmarked: allTeachers.length,
          message: "No teacher attendance marked for today",
        },
        "No teacher attendance for today",
        200,
      );
    }

    const attendanceId = attendanceRecords[0].id;

    // Get attendance logs with teacher details
    const logs = await db
      .select({
        id: teacherAttendanceLogs.id,
        teacherId: teacherAttendanceLogs.teacherId,
        status: teacherAttendanceLogs.status,
        markedAt: teacherAttendanceLogs.markedAt,
        teacherName: teachers.name,
        teacherEmployeeId: teachers.employeeId,
        teacherEmail: teachers.email,
        teacherProfileImage: teachers.profileImage,
        teacherQualification: teachers.qualification,
        teacherSpecialization: teachers.specialization,
      })
      .from(teacherAttendanceLogs)
      .leftJoin(teachers, eq(teachers.id, teacherAttendanceLogs.teacherId))
      .where(eq(teacherAttendanceLogs.attendanceId, attendanceId));

    // Get all active teachers to check who hasn't been marked
    const allTeachers = await db
      .select()
      .from(teachers)
      .where(eq(teachers.isActive, true));

    const markedTeacherIds = logs.map((log) => log.teacherId);
    const unmarkedTeachers = allTeachers.filter(
      (teacher) => !markedTeacherIds.includes(teacher.id),
    );

    // Get marked by user details
    const [markedByUser] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, attendanceRecords[0].markedBy))
      .limit(1);

    return successResponse(
      res,
      {
        attendance: {
          ...attendanceRecords[0],
          markedByUser: markedByUser || null,
        },
        logs: logs,
        unmarkedTeachers: unmarkedTeachers.map((t) => ({
          id: t.id,
          name: t.name,
          employeeId: t.employeeId,
        })),
        totalMarked: logs.length,
        totalTeachers: allTeachers.length,
        totalUnmarked: unmarkedTeachers.length,
      },
      "Today's teacher attendance fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get today's teacher attendance error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get today's teacher attendance",
      500,
    );
  }
};

// ==================== GET TEACHER ATTENDANCE STATISTICS ====================
export const getTeacherAttendanceStatistics = async (req, res) => {
  try {
    const { teacherId, year, month } = req.query;

    if (!teacherId) {
      return errorResponse(res, "Teacher ID is required", 400);
    }

    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    // Get start and end date of the month
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // Get attendance records for the month
    const attendanceRecords = await db
      .select()
      .from(teacherAttendance)
      .where(between(teacherAttendance.date, startDate, endDate));

    // Get logs for the specific teacher
    let present = 0,
      absent = 0,
      late = 0,
      leave = 0;

    for (const record of attendanceRecords) {
      const [log] = await db
        .select()
        .from(teacherAttendanceLogs)
        .where(
          and(
            eq(teacherAttendanceLogs.attendanceId, record.id),
            eq(teacherAttendanceLogs.teacherId, teacherId),
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
        absent++;
      }
    }

    const totalDays = attendanceRecords.length;
    const attendedDays = present + late;
    const percentage = totalDays > 0 ? (attendedDays / totalDays) * 100 : 0;

    // Get teacher details
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    return successResponse(
      res,
      {
        teacher: teacher || null,
        month: currentMonth,
        year: currentYear,
        statistics: {
          present,
          absent,
          late,
          leave,
          totalDays,
          attendedDays,
          percentage: Math.round(percentage * 100) / 100,
        },
        dateRange: { startDate, endDate },
      },
      "Teacher attendance statistics fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get teacher attendance statistics error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get teacher attendance statistics",
      500,
    );
  }
};
