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
    markAttendanceViaFace,
  } from "../../controllers/attendance/studentAttendanceController.service.js";
  import {
    authMiddleware,
    roleMiddleware,
  } from "../../middleware/authMiddleware.js";

  const studentAttendanceRouter = Router();

  // ==================== MARK ATTENDANCE ====================
  studentAttendanceRouter.post(
    "/student/mark",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    markAttendance,
  );

  // ==================== MARK ATTENDANCE VIA QR SCAN ====================
  studentAttendanceRouter.post(
    "/student/mark-qr",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    markAttendanceViaQR,
  );

  // ==================== MARK ATTENDANCE VIA FACe ====================
  studentAttendanceRouter.post(
    "/student/mark-face",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    markAttendanceViaFace,
  );

  // ==================== GET ATTENDANCE BY DATE ====================
  studentAttendanceRouter.get(
    "/student/date",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    getAttendanceByDate,
  );

  // ==================== GET STUDENT ATTENDANCE ====================
  studentAttendanceRouter.get(
    "/student/attendance/:studentId",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    getStudentAttendance,
  );

  // ==================== GET ATTENDANCE SUMMARY ====================
  studentAttendanceRouter.get(
    "/student/summary",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    getAttendanceSummary,
  );

  // ==================== UPDATE ATTENDANCE STATUS ====================
  studentAttendanceRouter.put(
    "/student/log/:logId",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    updateAttendanceStatus,
  );

  // ==================== DELETE ATTENDANCE ====================
  studentAttendanceRouter.delete(
    "/student/:id",
    authMiddleware,
    roleMiddleware(["super_admin", "admin"]),
    deleteAttendance,
  );

  export default studentAttendanceRouter;
