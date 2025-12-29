import mongoose from 'mongoose';

const salesFormSchema = new mongoose.Schema({
  // Section 1: Company & Contact Information
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  concernPersonName: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  emailAddress: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  alternatePhoneNumber: {
    type: String,
    trim: true,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    default: ''
  },
  // Address fields (structured)
  locality: {
    type: String,
    trim: true,
    default: ''
  },
  buildingFlatNo: {
    type: String,
    trim: true,
    default: ''
  },
  landmark: {
    type: String,
    trim: true,
    default: ''
  },
  pincode: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  state: {
    type: String,
    trim: true,
    default: ''
  },
  area: {
    type: String,
    trim: true,
    default: ''
  },
  // Keep fullAddress for backward compatibility (will be auto-generated if not provided)
  fullAddress: {
    type: String,
    trim: true,
    default: ''
  },

  // Section 2: Business & Shipment Details
  typeOfBusiness: {
    type: String,
    required: true,
    trim: true
  },
  typeOfShipments: {
    type: String,
    required: true,
    trim: true
  },
  averageShipmentVolume: {
    type: String,
    required: true,
    trim: true
  },
  mostFrequentRoutes: {
    type: String,
    required: true,
    trim: true
  },
  weightRange: {
    type: String,
    required: true,
    trim: true
  },
  packingRequired: {
    type: String,
    required: true,
    enum: ['yes', 'no'],
    trim: true
  },

  // Section 3: Current Logistics Setup
  existingLogisticsPartners: {
    type: String,
    required: true,
    trim: true
  },
  currentIssues: {
    type: String,
    required: true,
    trim: true
  },

  // Section 4: Vehicle Requirements
  vehiclesNeededPerMonth: {
    type: String,
    required: true,
    trim: true
  },
  typeOfVehicleRequired: {
    type: String,
    required: true,
    trim: true
  },

  // Section 5: Attachments
  uploadedImage: {
    type: String, // S3 URL or file path (legacy - for backward compatibility)
    default: ''
  },
  uploadedImageKey: {
    type: String, // S3 key for file management (legacy - for backward compatibility)
    default: ''
  },
  uploadedImageOriginalName: {
    type: String, // (legacy - for backward compatibility)
    default: ''
  },
  // Multiple images support
  uploadedImages: {
    type: [String], // Array of S3 URLs
    default: []
  },
  uploadedImageKeys: {
    type: [String], // Array of S3 keys for file management
    default: []
  },
  uploadedImageOriginalNames: {
    type: [String], // Array of original file names
    default: []
  },

  // Status tracking (optional, for admin use)
  status: {
    type: String,
    enum: ['pending', 'seen', 'contacted', 'in-progress', 'converted', 'rejected'],
    default: 'pending'
  },
  submittedByName: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
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
  timestamps: true,
  collection: 'sales_forms'
});

// Indexes for better query performance
salesFormSchema.index({ emailAddress: 1, createdAt: -1 });
salesFormSchema.index({ phoneNumber: 1 });
salesFormSchema.index({ companyName: 1 });
salesFormSchema.index({ status: 1 });
salesFormSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
salesFormSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('SalesForm', salesFormSchema);

