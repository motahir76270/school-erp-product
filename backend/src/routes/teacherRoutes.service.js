// src/routes/teacherRoutes.js
import { Router } from "express";
import {
  createTeacher,
  teacherLogin,
  updateTeacher,
  getAllTeachers,
  updateTeacherById,
  getTeacherById,
  getTeacherProfile,
  updateTeacherProfile,
  changeTeacherPassword,
  resetTeacherPassword,
  deleteTeacher,
  hardDeleteTeacher,
  updateTeacherStatus,
  getTeacherQRCode,
  regenerateTeacherQRCode, 
  addFaceDescriptor
} from "../controllers/teacherController.service.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../middleware/authMiddleware.js";
import upload, { single } from "../config/uploadFile.js";


const teacherRouter = Router();

// ==================== PUBLIC ROUTES ====================
teacherRouter.post("/login", teacherLogin);

// ==================== QR CODE ROUTES ====================
teacherRouter.get("/qr-code", authMiddleware, getTeacherQRCode);
teacherRouter.post(
  "/qr-code/regenerate",
  authMiddleware,
  regenerateTeacherQRCode,
);

// ==================== PROTECTED TEACHER ROUTES ====================
teacherRouter.get("/profile", authMiddleware, getTeacherProfile);
teacherRouter.put("/update", authMiddleware,upload.single(['profileImage']), updateTeacher);
teacherRouter.put(
  "/profile",
  authMiddleware,
  upload.single("profileImage"),
  updateTeacherProfile,
);
teacherRouter.post("/change-password", authMiddleware, changeTeacherPassword);
teacherRouter.delete("/delete", authMiddleware, deleteTeacher);

// ==================== ADMIN ROUTES ====================
teacherRouter.post(
  "/register",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  upload.single(['profileImage']),
  createTeacher,
);

teacherRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  upload.single("profileImage"),
  updateTeacherById,
);

teacherRouter.delete(
  "/hard-delete/:teacherId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  hardDeleteTeacher,
);
teacherRouter.post(
  "/reset-password/:teacherId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  resetTeacherPassword,
);
teacherRouter.patch(
  "/status/:teacherId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  updateTeacherStatus,
);

// ==================== GET ROUTES (Admin only) ====================

teacherRouter.put(
  "/face/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  addFaceDescriptor,
);

teacherRouter.get(
  "/all",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  getAllTeachers,
);

teacherRouter.get(
  "/teacher/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  getTeacherById,
);


export default teacherRouter;
