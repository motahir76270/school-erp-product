import express from 'express'
import { getFeeReceptsOfStudent, getFeeReceptsStudentByAdmin, getPreviewStudentFeeRecipts } from "../../controllers/fees/feeReceiptContoller.service.js";
import { authMiddleware } from '../../middleware/authMiddleware.js';

const reciptsRouter = express.Router();

reciptsRouter.get("/student-fees/preview/:id", getPreviewStudentFeeRecipts);

reciptsRouter.get("/student-fees", getFeeReceptsOfStudent);

//===================Admin routes ============
reciptsRouter.get("/student-fees/:id", getFeeReceptsStudentByAdmin);



export default reciptsRouter;