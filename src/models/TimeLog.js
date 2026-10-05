import mongoose from 'mongoose';

const timeLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null // null means it's a personal log
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  hours: {
    type: Number,
    required: [true, 'Hours worked are required'],
    min: [0, 'Hours cannot be negative']
  },
  amount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('TimeLog', timeLogSchema);
