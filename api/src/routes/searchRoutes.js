import express from 'express';
import * as searchController from '../controllers/searchController.js';
import { validate } from '../middlewares/validate.js';
import { searchQuerySchema } from '../validations/searchValidation.js';

const router = express.Router();

router.get('/', validate(searchQuerySchema, 'query'), searchController.searchWeb);

export default router;
