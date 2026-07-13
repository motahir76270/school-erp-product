import express, { Router } from 'express'
import  {userLoging ,userCreate ,userUpdate ,userDelete ,updateUserRole ,updateUserProfile, logoutUser}  from '../controllers/userController.service.js'
import upload from '../config/uploadFile.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const userRouter = Router();

userRouter.post('/login', userLoging)
userRouter.post('/register', userCreate);
userRouter.put('/user-update',authMiddleware, userUpdate);
userRouter.delete('/user-delete',authMiddleware, userDelete);
userRouter.put('/user-role',authMiddleware, updateUserRole);
userRouter.put('/user-profile',authMiddleware,upload.single(['profileImage']),  updateUserProfile);
userRouter.post('/logout', authMiddleware, logoutUser);
export default userRouter