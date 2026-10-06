import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null // null for personal payments
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    default: 'transfer'
  },
  notes: String
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);
