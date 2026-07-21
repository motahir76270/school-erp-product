  // src/routes/attendanceRoutes.js
  import { Router } from "express";
  import {
    markAttendance,
    markAttendanceViaQR,
    getAttendanceByDate,
    getStudentAttendance,
    updateAttendanceStatus,
    getAttendanceSummary,
    deleteAttendance,
  } from "../../controllers/attendance/studentAttendanceController.service.js";
  import {
    authMiddleware,
    roleMiddleware,
  } from "../../middleware/authMiddleware.js";

  const attendanceRouter = Router();

  // ==================== MARK ATTENDANCE ====================
  attendanceRouter.post(
    "/student/mark",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    markAttendance,
  );

  // ==================== MARK ATTENDANCE VIA QR ====================
  attendanceRouter.post(
    "/student/mark-qr",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    markAttendanceViaQR,
  );

  // ==================== GET ATTENDANCE BY DATE ====================
  attendanceRouter.get(
    "/student/date",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    getAttendanceByDate,
  );

  // ==================== GET STUDENT ATTENDANCE ====================
  attendanceRouter.get(
    "/student/attendance/:studentId",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    getStudentAttendance,
  );

  // ==================== GET ATTENDANCE SUMMARY ====================
  attendanceRouter.get(
    "/student/summary",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    getAttendanceSummary,
  );

  // ==================== UPDATE ATTENDANCE STATUS ====================
  attendanceRouter.put(
    "/student/log/:logId",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    updateAttendanceStatus,
  );

  // ==================== DELETE ATTENDANCE ====================
  attendanceRouter.delete(
    "/student/:id",
    authMiddleware,
    roleMiddleware(["super_admin", "admin"]),
    deleteAttendance,
  );

  export default attendanceRouter;
