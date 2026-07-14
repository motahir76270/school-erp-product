// src/routes/studentRoutes.js
import { Router } from "express";
import {
  studentLogin,
  createStudent,
  updateStudent,
  deleteStudent,
  updateStudentProfile,
  getStudentById,
  getAllStudents,
  getStudentsByClass,
  getStudentsBySection,
  getStudentsByClassAndSection,
  hardDeleteStudent,
  changeStudentPassword,
  resetStudentPassword,
  getStudentProfile,
  updateStudentStatus,
  getStudentQRCode,
  regenerateStudentQRCode,
  scanStudentQRCode,
} from "../controllers/studentController.service.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../middleware/authMiddleware.js";
import { single } from "../config/uploadFile.js";

const studentRouter = Router();

// ==================== PUBLIC ROUTES ====================
studentRouter.post("/login", studentLogin);

// ==================== QR CODE ROUTES ====================
studentRouter.get("/qr-code", authMiddleware, getStudentQRCode);
studentRouter.post(
  "/qr-code/regenerate",
  authMiddleware,
  regenerateStudentQRCode,
);
studentRouter.get(
  "/qr-scan/:studentId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  scanStudentQRCode,
);

// ==================== PROTECTED STUDENT ROUTES ====================
studentRouter.get("/profile", authMiddleware, getStudentProfile);
studentRouter.put("/update", authMiddleware, updateStudent);
studentRouter.put(
  "/profile",
  authMiddleware,
  single("profileImage"),
  updateStudentProfile,
);
studentRouter.post("/change-password", authMiddleware, changeStudentPassword);
studentRouter.delete("/delete", authMiddleware, deleteStudent);

// ==================== ADMIN ROUTES ====================
studentRouter.post(
  "/register",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  createStudent,
);
studentRouter.delete(
  "/hard-delete/:studentId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  hardDeleteStudent,
);
studentRouter.post(
  "/reset-password/:studentId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  resetStudentPassword,
);
studentRouter.patch(
  "/status/:studentId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  updateStudentStatus,
);

// ==================== GET ROUTES (Admin & Teachers) ====================
studentRouter.get(
  "/all",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getAllStudents,
);

studentRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getStudentById,
);
studentRouter.get(
  "/class/:classId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getStudentsByClass,
);

studentRouter.get(
  "/section/:sectionId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getStudentsBySection,
);

studentRouter.get(
  "/class/:classId/section/:sectionId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getStudentsByClassAndSection,
);

export default studentRouter;
