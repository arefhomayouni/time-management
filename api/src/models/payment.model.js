import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false,
    index: true,
  },
  period: {
    type: String,
    required: true,
    index: true,
  },
  totalHours: {
    type: Number,
    required: true,
    min: [0, 'ساعات کار نمی‌تواند منفی باشد'],
    default: 0,
  },
  rate: {
    type: Number,
    required: true,
    min: [0, 'نرخ پرداخت نمی‌تواند منفی باشد'],
  },
  basePayment: {
    type: Number,
    required: true,
    min: [0, 'مبلغ پایه نمی‌تواند منفی باشد'],
  },
  deductions: {
    type: Number,
    min: [0, 'کسورات نمی‌تواند منفی باشد'],
    default: 0,
  },
  finalPayment: {
    type: Number,
    required: true,
    min: [0, 'مبلغ نهایی نمی‌تواند منفی باشد'],
  },
  currency: {
    type: String,
    default: 'IRR',
  },
  paymentDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'processing', 'failed'],
    default: 'pending',
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for period formatted
const periodVirtual = paymentSchema.virtual('periodFormatted');
periodVirtual.get(function () {
  return this.period || '';
});

// Indexes for efficient queries
const paymentIndexes = [
  { user: 1, period: 1 },
  { group: 1, period: 1 },
  { period: 1 },
  { status: 1 },
];

export default mongoose.model('Payment', paymentSchema);