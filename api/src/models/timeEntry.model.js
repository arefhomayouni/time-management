import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  hours: {
    type: Number,
    required: [true, 'لطفاً ساعات کار را وارد کنید'],
    min: [0, 'ساعات کار نمی‌تواند منفی باشد'],
    validate: {
      validator: function (value) {
        return value <= 24;
      },
      message: 'ساعات کار نمی‌تواند بیشتر از ۲۴ باشد',
    },
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'توضیحات نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'],
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvalDate: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for efficient queries
const timeEntryIndexes = [
  { user: 1, date: -1 },
  { group: 1, date: -1 },
  { date: 1 },
];

const uniqueTimeEntryIndex = 'unique_user_date_user';
timeEntrySchema.index({ user: 1, date: 1 }, { unique: true, name: uniqueTimeEntryIndex });

// Virtual for month and year
const dateVirtual = timeEntrySchema.virtual('month');
dateVirtual.get(function () {
  return this.date.toISOString().substring(0, 7);
});

export default mongoose.model('TimeEntry', timeEntrySchema);