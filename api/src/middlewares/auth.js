import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import logger from './logger.js';

export const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'نخواذری برای دسترسی وجود ندارد',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Authentication failed', { error: error.message });
    return res.status(401).json({
      success: false,
      message: 'توکن نامعتبر است',
    });
  }
};

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({\n      success: false,
      message: 'اطلاعات ارائه شده نامعتبر است',
      errors: errors.array(),
    });
  }
  next();
};

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};