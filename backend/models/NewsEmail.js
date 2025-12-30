import mongoose from "mongoose";

const newsEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'newsemails'
});

// Indexes for better query performance
newsEmailSchema.index({ email: 1 }, { unique: true });
newsEmailSchema.index({ createdAt: -1 });
newsEmailSchema.index({ isActive: 1 });

// Static method to find by email
newsEmailSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// Static method to check if email exists
newsEmailSchema.statics.emailExists = async function(email) {
  const exists = await this.findOne({ email: email.toLowerCase().trim() });
  return !!exists;
};

export default mongoose.model("NewsEmail", newsEmailSchema);

