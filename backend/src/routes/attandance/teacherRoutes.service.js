// routes/teacherAttendanceRoutes.js
import express from "express";
import {
  markTeacherAttendance,
  markTeacherAttendanceViaQR,
  getTeacherAttendanceByDate,
  getTeacherAttendanceByTeacher,
  updateTeacherAttendanceStatus,
  getTeacherAttendanceSummary,
  deleteTeacherAttendance,
  getTodayTeacherAttendance,
  getTeacherAttendanceStatistics,
} from "../../controllers/attendance/studentAttendanceController.service.js";

import attendanceRouter from "./studentRoutes.service.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";



// All routes require authentication
attendanceRouter.use(authenticate);

// Mark attendance
attendanceRouter.post("/teacher/mark",authMiddleware, markTeacherAttendance);
attendanceRouter.post("/teacher/mark-qr", markTeacherAttendanceViaQR);

// Get attendance
attendanceRouter.get("/teacher/date",authMiddleware, getTeacherAttendanceByDate);
attendanceRouter.get("/teacher/today",authMiddleware, getTodayTeacherAttendance);
attendanceRouter.get("/teacher/summary",authMiddleware, getTeacherAttendanceSummary);
attendanceRouter.get("/teacher/statistics",authMiddleware, getTeacherAttendanceStatistics);
attendanceRouter.get("/teacher/:teacherId",authMiddleware, getTeacherAttendanceByTeacher);

// Update attendance
attendanceRouter.put("/teacher/log/:logId", updateTeacherAttendanceStatus);

// Delete attendance
attendanceRouter.delete("/teacher/:id", deleteTeacherAttendance);


