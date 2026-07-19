// src/routes/feeRoutes.js
import express from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import {
  createFeeType,
  getAllFeeTypes,
  getFeeTypeById,
  updateFeeType,
  deleteFeeType,
  updateFeeTypeStatus,
} from "../../controllers/fees/feesTypeController.service.js";
import {
  assignFeeToStudent,
  getStudentFees,
  getAllStudentFees,
  getStudentFeeById,
  getFeesAssignBySection,
} from "../../controllers/fees/studentFeesController.service.js";
import {
  makePayment,
  getPaymentById,
  getPaymentsReceptsByStudentFee,
  getAllPayments,
} from "../../controllers/fees/feesPaymentsController.service.js";
import {
  calculatePenalties,
  applyPenalty,
  getPenaltiesByStudentFee,
  getAllPenalties,
  getPenaltyById,
  waivePenalty,
  bulkCalculatePenalties,
} from "../../controllers/fees/feesPenltiesController.service.js";

const feesRouter = express.Router();

// ==================== FEE TYPE ROUTES ====================
feesRouter.post("/fee-types", authMiddleware, createFeeType);
feesRouter.get("/fee-types", authMiddleware, getAllFeeTypes);
feesRouter.get("/fee-types/:id", authMiddleware, getFeeTypeById);
feesRouter.put("/fee-types/:id", authMiddleware, updateFeeType);
feesRouter.delete("/fee-types/:id", authMiddleware, deleteFeeType);
feesRouter.patch("/fee-types/:id/status", authMiddleware, updateFeeTypeStatus);

// ==================== STUDENT FEE ROUTES ====================
feesRouter.post("/student-fees", authMiddleware, assignFeeToStudent);
feesRouter.post("/student-fees/class/section", authMiddleware, getFeesAssignBySection);
feesRouter.get("/student-fees/all", authMiddleware, getAllStudentFees);
feesRouter.get("/student-fees/:studentId", authMiddleware, getStudentFeeById);
feesRouter.get("/student-fees/fees/:studentId", authMiddleware, getStudentFees);

// ==================== PAYMENT ROUTES ====================
feesRouter.post("/payments", authMiddleware, makePayment);
feesRouter.get("/payments", authMiddleware, getAllPayments);
feesRouter.get("/payments/:id", authMiddleware, getPaymentById);
feesRouter.get(
  "/student-fees/recipts/:id",
  authMiddleware,
  getPaymentsReceptsByStudentFee,
);

// ==================== PENALTY ROUTES ====================
feesRouter.post("/penalties/bulk", authMiddleware, bulkCalculatePenalties);
feesRouter.get("/penalties", authMiddleware, getAllPenalties);
feesRouter.get("/penalties/:id", authMiddleware, getPenaltyById);
feesRouter.delete("/penalties/:id/waive", authMiddleware, waivePenalty);
feesRouter.get("/student-fees/:studentFeeId/penalties", authMiddleware, getPenaltiesByStudentFee);
feesRouter.post("/student-fees/:studentFeeId/calculate-penalty", authMiddleware, calculatePenalties);
feesRouter.post("/student-fees/:studentFeeId/apply-penalty", authMiddleware, applyPenalty);

export default feesRouter;