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
  userResetPasswordToken
} from "../controllers/userController.service.js";
import upload from '../config/uploadFile.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const userRouter = Router();

userRouter.post("/login", userLogin);
userRouter.get('/me', authMiddleware, getUserProfile);
userRouter.post('/register', userCreate);
userRouter.put('/user-update',authMiddleware, userUpdate);

userRouter.post("/forgot-password", userRestPassword);
userRouter.put("/reset-password", userResetPasswordToken);

userRouter.put("/change-password", authMiddleware, userPasswordChange);
userRouter.delete('/user-delete',authMiddleware, userDelete);
userRouter.put('/user-role',authMiddleware, updateUserRole);
userRouter.put('/user-profile',authMiddleware,upload.single(['profileImage']),  updateUserProfile);
userRouter.post('/logout', authMiddleware, logoutUser);
export default userRouter