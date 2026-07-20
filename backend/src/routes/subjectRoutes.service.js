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
} from "../controllers/subjects/subjectController.service.js";
import {
  assignSubjectToClass,
  getSubjectsByClass,
  getSubjectsBySection,
  getClassesBySubject,
  updateClassSubject,
  removeSubjectFromClass,
  getAllClassSubjects,
  bulkAssignSubjectsToClass,
  bulkAssignSubjectsToSection,
} from "../controllers/subjects/classSubjectController.service.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../middleware/authMiddleware.js";

const subjectRouter = Router();

// ==================== SUBJECT ROUTES ====================
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
subjectRouter.get(
  "/assignments",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getAllClassSubjects,
);

subjectRouter.post(
  "/assign",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  assignSubjectToClass,
);

subjectRouter.post(
  "/assign/bulk/class",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  bulkAssignSubjectsToClass,
);

subjectRouter.post(
  "/assign/bulk/section",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  bulkAssignSubjectsToSection,
);

subjectRouter.get(
  "/class/:classId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getSubjectsByClass,
);

subjectRouter.get(
  "/section/:sectionId",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getSubjectsBySection,
);

subjectRouter.get(
  "/subject/:subjectId/classes",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getClassesBySubject,
);

subjectRouter.put(
  "/assign/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  updateClassSubject,
);

subjectRouter.delete(
  "/assign/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  removeSubjectFromClass,
);

export default subjectRouter;