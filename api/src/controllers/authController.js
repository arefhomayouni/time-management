import User from '../models/user.model.js';
import { generateToken } from '../config/middleware/auth.js';
import logger from '../config/logger.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'این کاربر از قبل وجود دارد',
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'user',
    });

    // Generate token
    const token = generateToken({
      id: user._id,
      username: user.username,
      role: user.role,
    });

    // Remove password from output
    user.password = undefined;

    logger.info('User registered successfully', { userId: user._id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'کاربر با موفقیت ایجاد شد',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Error in user registration', { error: error.message });
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Check if username and password provided
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'لطفاً نام کاربری و رمز عبور خود را وارد کنید',
      });
    }

    // Find user by username (include password)
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      logger.warn('Failed login attempt', { username });
      return res.status(401).json({
        success: false,
        message: 'نام کاربری یا رمز عبور اشتباه است',
      });
    }

    // Check if password matches
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      logger.warn('Failed login attempt', { username });
      return res.status(401).json({
        success: false,
        message: 'نام کاربری یا رمز عبور اشتباه است',
      });
    }

    // Generate token
    const token = generateToken({
      id: user._id,
      username: user.username,
      role: user.role,
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Remove password from output
    user.password = undefined;

    logger.info('User logged in successfully', { userId: user._id });

    res.json({
      success: true,
      message: 'ورود موفقیت‌آمیز',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    logger.error('Error in user login', { error: error.message });
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    logger.error('Error getting user profile', { error: error.message });
    next(error);
  }
};