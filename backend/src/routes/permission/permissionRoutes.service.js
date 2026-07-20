// src/routes/permissionRoutes.js
import express from 'express';
import {
  // Teacher Permission Controllers
  getAllTeacherPermissions,
  createTeacherPermission,
  updateTeacherPermission,
  updateTeacherPermissionStatus,
  deleteTeacherPermission,
  bulkCreateTeacherPermissions,
  // User Permission Controllers
  } from '../../controllers/permission/teacherPermisionController.service.js'
  
  import {
  getAllUserPermissions,
  createUserPermission,
  updateUserPermission,
  updateUserPermissionStatus,
  deleteUserPermission,
  bulkCreateUserPermissions,
} from '../../controllers/permission/userPermisionController.service.js';
import { authMiddleware, roleMiddleware } from '../../middleware/authMiddleware.js';



const permissionRouter = express.Router();

// ==================== TEACHER PERMISSION ROUTES ====================
permissionRouter.get('/teacher',authMiddleware,roleMiddleware(['admin']), getAllTeacherPermissions);
permissionRouter.post(
  "/teacher",
  authMiddleware,
  roleMiddleware(["admin"]),
  createTeacherPermission,
);
permissionRouter.post(
  "/teacher/bulk",
  authMiddleware,
  roleMiddleware(["admin"]),
  bulkCreateTeacherPermissions,
);
permissionRouter.put(
  "/teacher/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateTeacherPermission,
);
permissionRouter.patch(
  "/teacher/status/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateTeacherPermissionStatus,
);
permissionRouter.delete(
  "/teacher/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteTeacherPermission,
);

// ==================== USER PERMISSION ROUTES ====================
permissionRouter.get('/user',authMiddleware,roleMiddleware(['super_admin']), getAllUserPermissions);
permissionRouter.post('/user',authMiddleware,roleMiddleware(['super_admin']), createUserPermission);
permissionRouter.post('/user/bulk',authMiddleware,roleMiddleware(['super_admin']), bulkCreateUserPermissions);
permissionRouter.put('/user/:id',authMiddleware,roleMiddleware(['super_admin']), updateUserPermission);
permissionRouter.patch('/user/status/:id',authMiddleware,roleMiddleware(['super_admin']), updateUserPermissionStatus);
permissionRouter.delete('/user/:id',authMiddleware,roleMiddleware(['super_admin']), deleteUserPermission);

export default permissionRouter;