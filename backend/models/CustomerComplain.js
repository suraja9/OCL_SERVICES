import mongoose from 'mongoose';

const VALID_CUSTOMER_CATEGORIES = [
  'General Inquiry',
  'Booking Issue',
  'Tracking Issue',
  'Payment Issue',
  'Complaint',
  'Feedback',
  'Other',
  // Corporate specific categories
  'Delivery Issues',
  'Billing & Payment',
  'Package Damage',
  'Service Quality',
  'Tracking Issues',
  'Others'
];

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

const customerComplainSchema = new mongoose.Schema({
  // Contact information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Complaint details
  subject: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: VALID_CUSTOMER_CATEGORIES
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: PRIORITY_OPTIONS,
    default: 'Medium'
  },
  source: {
    type: String,
    enum: ['public', 'corporate', 'customer-app'],
    default: 'public'
  },
  corporateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CorporateData',
    default: null
  },
  corporateInfo: {
    corporateId: { type: String },
    companyName: { type: String },
    email: { type: String },
    contactNumber: { type: String }
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  
  // Response from support team
  response: {
    type: String,
    trim: true
  },
  responseDate: {
    type: Date
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
customerComplainSchema.index({ email: 1, createdAt: -1 });
customerComplainSchema.index({ status: 1 });
customerComplainSchema.index({ category: 1 });
customerComplainSchema.index({ createdAt: -1 });
customerComplainSchema.index({ corporateId: 1, createdAt: -1 });

// Update the updatedAt field before saving
customerComplainSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to update status
customerComplainSchema.methods.updateStatus = function(newStatus, response, respondedBy) {
  this.status = newStatus;
  if (response) {
    this.response = response;
    this.responseDate = new Date();
    this.respondedBy = respondedBy;
  }
  this.updatedAt = new Date();
  return this.save();
};

export default mongoose.model('CustomerComplain', customerComplainSchema);

