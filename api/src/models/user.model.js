import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'لطفاً نام کاربری را وارد کنید'],
    unique: true,
    trim: true,
    minlength: [3, 'نام کاربری باید حداقل ۳ کاراکتر باشد'],
    maxlength: [30, 'نام کاربری نمی‌تواند بیشتر از ۳۰ کاراکتر باشد'],
  },
  email: {
    type: String,
    required: [true, 'لطفاً ایمیل خود را وارد کنید'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'لطفاً یک ایمیل معتبر وارد کنید'],
  },
  password: {
    type: String,
    required: [true, 'لطفاً رمز عبور خود را وارد کنید'],
    minlength: [6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'],
    select: false,
  },
  firstName: {
    type: String,
    required: [true, 'لطفاً نام خود را وارد کنید'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'لطفاً نام خانوادگی خود را وارد کنید'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'manager'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  profileImage: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      role: this.role,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    }
  );
};

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model('User', userSchema);