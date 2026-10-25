import express from 'express';
import * as searchController from '../controllers/searchController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { searchQuerySchema } from '../validations/searchValidation.js';

const router = express.Router();

// Behind auth: every call spends the server's Exa quota, so an anonymous
// visitor must not be able to run searches.
router.get('/', protect, validate(searchQuerySchema, 'query'), searchController.searchWeb);

export default router;
