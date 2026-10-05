import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/pay', protect, paymentController.makePayment);
router.get('/my-payments', protect, paymentController.getMyPayments);
router.get('/group/:groupId', protect, paymentController.getGroupPayments);

export default router;
