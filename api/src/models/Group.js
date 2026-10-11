import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Group manager is required']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate for the group is required']
  },
  hourlyRateCurrency: {
    type: String,
    enum: ['usd', 'irr'],
    default: 'usd'
  },
  // Total money the manager has committed to give for the current period
  budget: {
    type: Number,
    default: 0,
    min: [0, 'Budget cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Group', groupSchema);
