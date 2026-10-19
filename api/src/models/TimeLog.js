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
  /**
   * Unit `amount` is recorded in - inherited from the rate that produced it
   * (group.hourlyRateCurrency, or the user's personalRateCurrency).
   * Deliberately has no default: legacy logs predate this field, and a
   * default would silently label IRR amounts as USD. Reads resolve a missing
   * value from the related group/user instead.
   */
  currency: {
    type: String,
    enum: ['usd', 'irr']
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('TimeLog', timeLogSchema);
