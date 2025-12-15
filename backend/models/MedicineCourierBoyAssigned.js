import mongoose from "mongoose";

const medicineCourierBoyAssignedSchema = new mongoose.Schema({
  // Medicine User who assigned the pickup
  medicineUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicineUser',
    required: true
  },

  // Courier Boy assigned for pickup
  courierBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourierBoy',
    required: true
  },

  // Courier Boy full details (stored for reference even if courier boy is deleted)
  courierBoyDetails: {
    _id: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    area: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    locality: {
      type: String,
      required: true,
      trim: true
    },
    building: {
      type: String,
      required: true,
      trim: true
    },
    vehicleType: {
      type: String,
      required: true,
      trim: true
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    profilePhotoUrl: {
      type: String,
      trim: true
    }
  },

  // Customer/Pickup Details from form
  customerDetails: {
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    bookingAddress: {
      type: String,
      required: true,
      trim: true
    },
    numberOfPackages: {
      type: String,
      required: true,
      trim: true
    },
    approxWeight: {
      type: String,
      required: true,
      trim: true
    },
    specialInstruction: {
      type: String,
      trim: true,
      default: ''
    }
  },

  // Assignment Status
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'assigned'
  },

  // Timestamps
  assignedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },

  // Additional notes or updates
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster queries
medicineCourierBoyAssignedSchema.index({ medicineUserId: 1, status: 1 });
medicineCourierBoyAssignedSchema.index({ courierBoyId: 1, status: 1 });
medicineCourierBoyAssignedSchema.index({ assignedAt: -1 });

const MedicineCourierBoyAssigned = mongoose.model('MedicineCourierBoyAssigned', medicineCourierBoyAssignedSchema);

export default MedicineCourierBoyAssigned;

