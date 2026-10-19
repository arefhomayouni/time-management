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
  /**
   * Unit `amount` is recorded in. Group payouts inherit the group's rate
   * currency, personal payouts the user's personalRateCurrency. No default:
   * legacy payments are resolved from their group/user on read.
   */
  currency: {
    type: String,
    enum: ['usd', 'irr']
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
