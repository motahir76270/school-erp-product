import express from 'express'

import { authMiddleware } from '../../middleware/authMiddleware.js';
import { createPaymentGateway, deletePaymentGateway, getAllPaymentGateways, getPaymentGatewayById, updateGatewayStatus, updatePaymentGateway } from '../../controllers/paymentGateway/gateWayComtroller.service.js';

const paymentGatWayRouter = express.Router();


paymentGatWayRouter.post("/create", createPaymentGateway);
paymentGatWayRouter.put("/update", updatePaymentGateway);
paymentGatWayRouter.put("/update/status", updateGatewayStatus);

paymentGatWayRouter.delete("/delete/:id", deletePaymentGateway);

paymentGatWayRouter.get("/all", getAllPaymentGateways);
paymentGatWayRouter.get("/gateway/:id", getPaymentGatewayById);


export default paymentGatWayRouter;