import mongoose from "mongoose";

const onlineCustomerSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'onlinecustomers'
});

// Indexes for better query performance
// phoneNumber already has an index (index: true and unique: true)
onlineCustomerSchema.index({ createdAt: -1 });

// Static method to find by phone number
onlineCustomerSchema.statics.findByPhone = function(phoneNumber) {
  // Clean phone number (remove non-digits)
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  return this.findOne({ phoneNumber: cleanPhone });
};

// Instance method to update profile
onlineCustomerSchema.methods.updateProfile = function(data) {
  if (data.name !== undefined) this.name = data.name;
  if (data.email !== undefined) this.email = data.email;
  return this.save();
};

export default mongoose.model("OnlineCustomer", onlineCustomerSchema);

