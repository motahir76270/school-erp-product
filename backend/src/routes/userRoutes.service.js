import express, { Router } from 'express'
import {
  userLogin,
  getUserProfile,
  userCreate,
  userUpdate,
  userDelete,
  updateUserRole,
  updateUserProfile,
  logoutUser,
  userPasswordChange,
  userRestPassword,
  userResetPasswordToken,
  getAllUsers,
  getUserById,
  updateUserById,
  updateUserRoleById,
  deleteUserById,
  userCreateByadmin
} from "../controllers/userController.service.js";
import upload from '../config/uploadFile.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const userRouter = Router();

userRouter.post("/login", userLogin);
userRouter.get('/me', authMiddleware, getUserProfile);
userRouter.post('/register', userCreate);
userRouter.put('/user-update',authMiddleware, userUpdate);

userRouter.post("/forgot-password", userRestPassword);
userRouter.put("/reset-password", userResetPasswordToken);


//super admin routes
userRouter.post('/users/create',authMiddleware, roleMiddleware(["super_admin"]),upload.single(['profileImage']),userCreateByadmin);
userRouter.get('/users', authMiddleware ,roleMiddleware(["super_admin"]), getAllUsers);
userRouter.get('/users/:id', authMiddleware,roleMiddleware(["super_admin"]), getUserById);
userRouter.put('/users/:id', authMiddleware,roleMiddleware(["super_admin"]),upload.single(['profileImage']), updateUserById);
userRouter.put('/users/role/:id', authMiddleware,roleMiddleware(["super_admin"]), updateUserRoleById);
userRouter.delete('/users/:id', authMiddleware,roleMiddleware(["super_admin"]), deleteUserById);


userRouter.put("/change-password", authMiddleware, userPasswordChange);
userRouter.delete('/user-delete',authMiddleware, userDelete);
userRouter.put('/user-role',authMiddleware, updateUserRole);
userRouter.put('/user-profile',authMiddleware,upload.single(['profileImage']),  updateUserProfile);
userRouter.post('/logout', authMiddleware, logoutUser);
export default userRouter