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
import { authMiddleware } from '../../middleware/authMiddleware.js';



const permissionRouter = express.Router();

// ==================== TEACHER PERMISSION ROUTES ====================
permissionRouter.get('/teacher',authMiddleware, getAllTeacherPermissions);
permissionRouter.post('/teacher',authMiddleware, createTeacherPermission);
permissionRouter.post('/teacher/bulk',authMiddleware, bulkCreateTeacherPermissions);
permissionRouter.put('/teacher/:id',authMiddleware, updateTeacherPermission);
permissionRouter.patch('/teacher/:id/status',authMiddleware, updateTeacherPermissionStatus);
permissionRouter.delete('/teacher/:id',authMiddleware, deleteTeacherPermission);

// ==================== USER PERMISSION ROUTES ====================
permissionRouter.get('/user',authMiddleware, getAllUserPermissions);
permissionRouter.post('/user',authMiddleware, createUserPermission);
permissionRouter.post('/user/bulk',authMiddleware, bulkCreateUserPermissions);
permissionRouter.put('/user/:id',authMiddleware, updateUserPermission);
permissionRouter.patch('/user/:id/status',authMiddleware, updateUserPermissionStatus);
permissionRouter.delete('/user/:id',authMiddleware, deleteUserPermission);

export default permissionRouter;