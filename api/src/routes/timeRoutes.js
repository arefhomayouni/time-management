import express from 'express';
import * as timeController from '../controllers/timeController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { addTimeLogSchema, earningsQuerySchema, summaryQuerySchema } from '../validations/timeValidation.js';

const router = express.Router();

router.post('/logs', protect, validate(addTimeLogSchema), timeController.addTimeLog);
router.get('/logs', protect, timeController.getMyLogs);
router.delete('/logs', protect, timeController.deleteMyLog);
router.get('/summary', protect, validate(summaryQuerySchema, 'query'), timeController.getTimeSummary);
router.get('/earnings', protect, validate(earningsQuerySchema, 'query'), timeController.getMonthlyEarnings);

export default router;
