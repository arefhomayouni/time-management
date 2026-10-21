import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  personalRate: {
    type: Number,
    default: 0
  },
  personalRateCurrency: {
    type: String,
    enum: ['usd', 'irr'],
    default: 'usd'
  },
  role: {
    type: String,
    enum: ['user', 'manager'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  forgetPasswordToken: {
  time:{
      type: Date,
      default: null
    },
    token:{
      type: String,
      default: null
    },
    code:{
      type: String,
      default: null 
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
