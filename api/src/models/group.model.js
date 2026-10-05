import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'لطفاً نام گروه را وارد کنید'],
    trim: true,
    minlength: [2, 'نام گروه باید حداقل ۲ کاراکتر باشد'],
    maxlength: [50, 'نام گروه نمی‌تواند بیشتر از ۵۰ کاراکتر باشد'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'توضیحات نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'],
  },
  rate: {
    type: Number,
    required: [true, 'لطفاً نرخ پرداخت را وارد کنید'],
    min: [0, 'نرخ پرداخت نمی‌تواند منفی باشد'],
    default: 0,
  },
  currency: {
    type: String,
    default: 'IRR',
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for member count
const groupVirtual = groupSchema.virtual('memberCount');
groupVirtual.get(function () {
  return this.members ? this.members.length : 0;
});

export default mongoose.model('Group', groupSchema);