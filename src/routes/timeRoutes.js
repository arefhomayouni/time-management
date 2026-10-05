import express from 'express';
import * as timeController from '../controllers/timeController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/logs', protect, timeController.addTimeLog);
router.get('/logs', protect, timeController.getMyLogs);
router.get('/earnings', protect, timeController.getMonthlyEarnings);

export default router;
