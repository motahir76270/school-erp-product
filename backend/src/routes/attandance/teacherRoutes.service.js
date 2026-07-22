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
} from "../../controllers/attendance/teacherAttendanceController.service.js";

import { authMiddleware } from "../../middleware/authMiddleware.js";

const teacherAttendanceRouter = express.Router();
// Mark attendance
teacherAttendanceRouter.post("/teacher/mark",authMiddleware, markTeacherAttendance);
teacherAttendanceRouter.post("/teacher/mark-qr",authMiddleware, markTeacherAttendanceViaQR);

// Get attendance
teacherAttendanceRouter.get("/teacher/date",authMiddleware, getTeacherAttendanceByDate);
teacherAttendanceRouter.get("/teacher/today",authMiddleware, getTodayTeacherAttendance);
teacherAttendanceRouter.get("/teacher/summary",authMiddleware, getTeacherAttendanceSummary);
teacherAttendanceRouter.get("/teacher/statistics",authMiddleware, getTeacherAttendanceStatistics);
teacherAttendanceRouter.get("/teacher/:teacherId",authMiddleware, getTeacherAttendanceByTeacher);

// Update attendance
teacherAttendanceRouter.put("/teacher/log/:logId", updateTeacherAttendanceStatus);

// Delete attendance
teacherAttendanceRouter.delete("/teacher/:id", deleteTeacherAttendance);

export default teacherAttendanceRouter;


