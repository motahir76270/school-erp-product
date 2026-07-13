// src/routes/subjectRoutes.js
import { Router } from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  hardDeleteSubject,
  updateSubjectStatus,
} from "../controllers/subjectController.service.js";
import {
  assignSubjectToClass,
  getSubjectsByClass,
  getClassesBySubject,
  updateClassSubject,
  removeSubjectFromClass,
  getAllClassSubjects,
  bulkAssignSubjectsToClass,
} from "../controllers/classSubjectController.service.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../middleware/authMiddleware.js";

const subjectRouter = Router();

// ==================== SUBJECT ROUTES ====================

// Public/Protected routes
subjectRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getAllSubjects,
);
subjectRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getSubjectById,
);

// Admin only routes
subjectRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  createSubject,
);
subjectRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  updateSubject,
);
subjectRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  deleteSubject,
);
subjectRouter.delete(
  "/hard/:id",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  hardDeleteSubject,
);
subjectRouter.patch(
  "/status/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  updateSubjectStatus,
);

// ==================== CLASS SUBJECT ROUTES ====================

// Get all class subjects
subjectRouter.get(
  "/assignments",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getAllClassSubjects,
);

// Assign subject to class
subjectRouter.post(
  "/assign",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  assignSubjectToClass,
);

// Bulk assign subjects to class
subjectRouter.post(
  "/assign/bulk",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  bulkAssignSubjectsToClass,
);

// Get subjects by class
subjectRouter.get(
  "/class/:classId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getSubjectsByClass,
);

// Get classes by subject
subjectRouter.get(
  "/subject/:subjectId/classes",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getClassesBySubject,
);

// Update class subject assignment
subjectRouter.put(
  "/assign/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  updateClassSubject,
);

// Remove subject from class
subjectRouter.delete(
  "/assign/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  removeSubjectFromClass,
);

export default subjectRouter;
