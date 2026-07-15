// src/routes/classesRoutes.service.js
import { Router } from "express";
import {
  createClass,
  getAllClassesWithSections,
  getClassWithSections,
  updateClass,
  deleteClass,
  getAllClasses,
} from "../controllers/classesController.service.js"; // Fixed import path
import {
  createSection,
  getAllSections,
  getSectionById,
  getSectionsByClass,
  updateSection,
  deleteSection,
  bulkCreateSections,
} from "../controllers/sectionController.service.js"; // Fixed import path
import {
  authMiddleware,
  roleMiddleware,
} from "../middleware/authMiddleware.js";

const classRouter = Router();

// ==================== CLASS ROUTES ====================

// Public/Protected routes
classRouter.get(
  "/classes-section",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getAllClassesWithSections,
);
classRouter.get(
  "/all",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getAllClasses,
);
classRouter.get(
  "classess/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getSectionById,
);


// Admin only routes
classRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  createClass,
);
classRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  updateClass,
);
classRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  deleteClass,
);

// ==================== SECTION ROUTES ====================

// Public/Protected routes
classRouter.get(
  "/sections",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getAllSections,
);
classRouter.get(
  "/sections/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getClassWithSections,
);

classRouter.get(
  "/sectionsByClass",
  authMiddleware,
  roleMiddleware(["super_admin", "admin", "teacher"]),
  getSectionsByClass,
);

// Admin only routes
classRouter.post(
  "/sections",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  createSection,
);
classRouter.post(
  "/sections/bulk",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  bulkCreateSections,
);
classRouter.put(
  "/sections/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  updateSection,
);
classRouter.delete(
  "/sections/:id",
  authMiddleware,
  roleMiddleware(["super_admin", "admin"]),
  deleteSection,
);

export default classRouter;
