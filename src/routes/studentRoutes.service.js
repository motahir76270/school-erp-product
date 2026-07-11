import express, { Router } from 'express'
import  loging  from '../controllers/userController.service.js'
import upload from '../config/uploadFile.js';
import { authMiddleware } from '../middleware/authMiddleware.js';


const studentRouter = Router();

studentRouter.get('/login', studentLoging)
studentRouter.post('/register',authMiddleware,createStudent);
studentRouter.put('/student-update',authMiddleware, studentUdate);
studentRouter.delete('/student-delete',authMiddleware, studentDelete);
studentRouter.update('/student-role',authMiddleware, studentUserRole);
studentRouter.update('/student-profile',authMiddleware, upload.single(['profileImage']),  updateStudentProfile);

export default studentRouter