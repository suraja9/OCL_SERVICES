import mongoose from 'mongoose';

const coldCallingDataSchema = new mongoose.Schema({
  // Tab name to categorize data
  tabName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Row data matching the spreadsheet structure
  concernName: {
    type: String,
    trim: true,
    default: ''
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  destination: {
    type: String,
    trim: true,
    default: ''
  },
  phone1: {
    type: String,
    trim: true,
    default: ''
  },
  phone2: {
    type: String,
    trim: true,
    default: ''
  },
  sujata: {
    type: String,
    trim: true,
    default: ''
  },
  followUpDate: {
    type: String,
    trim: true,
    default: ''
  },
  rating: {
    type: String,
    trim: true,
    default: ''
  },
  broadcast: {
    type: String,
    enum: ['YES', 'NO', ''],
    default: ''
  },
  status: {
    type: String,
    enum: ['done', 'pending', 'notWorking', ''],
    default: ''
  },
  
  // Row number for ordering (optional, can be used for sorting)
  rowNumber: {
    type: Number,
    default: 0
  },
  
  // Background color for the row (to match Excel color coding)
  backgroundColor: {
    type: String,
    trim: true,
    default: ''
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
  collection: 'cold_calling_data'
});

// Indexes for better query performance
coldCallingDataSchema.index({ tabName: 1, rowNumber: 1 });
coldCallingDataSchema.index({ tabName: 1, createdAt: -1 });

export default mongoose.model('ColdCallingData', coldCallingDataSchema);

