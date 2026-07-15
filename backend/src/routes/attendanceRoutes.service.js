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
  } from "../controllers/attendanceController.service.js";
  import {
    authMiddleware,
    roleMiddleware,
  } from "../middleware/authMiddleware.js";

  const attendanceRouter = Router();

  // ==================== MARK ATTENDANCE ====================
  attendanceRouter.post(
    "/mark",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    markAttendance,
  );

  // ==================== MARK ATTENDANCE VIA QR ====================
  attendanceRouter.post(
    "/mark-qr",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    markAttendanceViaQR,
  );

  // ==================== GET ATTENDANCE BY DATE ====================
  attendanceRouter.get(
    "/date",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    getAttendanceByDate,
  );

  // ==================== GET STUDENT ATTENDANCE ====================
  attendanceRouter.get(
    "/student/:studentId",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    getStudentAttendance,
  );

  // ==================== GET ATTENDANCE SUMMARY ====================
  attendanceRouter.get(
    "/summary",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    getAttendanceSummary,
  );

  // ==================== UPDATE ATTENDANCE STATUS ====================
  attendanceRouter.put(
    "/log/:logId",
    authMiddleware,
    roleMiddleware(["super_admin", "admin", "teacher"]),
    updateAttendanceStatus,
  );

  // ==================== DELETE ATTENDANCE ====================
  attendanceRouter.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(["super_admin", "admin"]),
    deleteAttendance,
  );

  export default attendanceRouter;
