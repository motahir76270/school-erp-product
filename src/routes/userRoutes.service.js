import express, { Router } from 'express'
import  {userLoging ,userCreate ,userUpdate ,userDelete ,updateUserRole ,updateUserProfile}  from '../controllers/userController.service.js'
import upload from '../config/uploadFile.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const userRouter = Router();

userRouter.get('/login', userLoging)
userRouter.post('/register', userCreate);
userRouter.put('/user-update',authMiddleware, userUpdate);
userRouter.delete('/user-delete',authMiddleware, userDelete);
userRouter.put('/user-role',authMiddleware, updateUserRole);
userRouter.put('/user-profile',authMiddleware,upload.single(['profileImage']),  updateUserProfile);

export default userRouter