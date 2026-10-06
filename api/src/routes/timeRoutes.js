import express from 'express';
import * as timeController from '../controllers/timeController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { addTimeLogSchema, earningsQuerySchema } from '../validations/timeValidation.js';

const router = express.Router();

router.post('/logs', protect, validate(addTimeLogSchema), timeController.addTimeLog);
router.get('/logs', protect, timeController.getMyLogs);
router.get('/earnings', protect, validate(earningsQuerySchema), timeController.getMonthlyEarnings);

export default router;
