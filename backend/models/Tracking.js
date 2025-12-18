import mongoose from "mongoose";

const trackingSchema = new mongoose.Schema({
  // Consignment number (unique identifier)
  consignmentNumber: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },

  // Booking reference
  bookingReference: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Assignment type: 'corporate', 'office_user', 'courier_boy', 'medicine', 'online_customer'
  assignmentType: {
    type: String,
    enum: ['corporate', 'office_user', 'courier_boy', 'medicine', 'online_customer'],
    required: true,
    default: 'corporate'
  },

  // Entity ID (corporate, office user, etc.)
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  // Legacy field for backward compatibility (corporate)
  corporateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CorporateData',
    default: null,
    index: true
  },

  // Current status of the shipment
  currentStatus: {
    type: String,
    enum: [
      'booked',
      'picked',
      'received',
      'assigned',
      'courierboy',
      'in_transit',
      'reached-hub',
      'out_for_delivery',
      'OFP',
      'delivered',
      'cancelled',
      'returned',
      'undelivered',
      'rto',
      'reserve'
    ],
    default: 'booked',
    required: true,
    index: true
  },

  // OFD status data (Out For Delivery/Pickup)
  OFD: [{
    type: mongoose.Schema.Types.Mixed,
    required: false
  }],

  // Booked status data - array of booking data objects
  booked: [{
    type: mongoose.Schema.Types.Mixed,
    required: false
  }],

  // Pickup status data
  pickup: [{
    type: mongoose.Schema.Types.Mixed,
    required: false
  }],

  // Received status events
  received: [{
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    adminName: {
      type: String,
      trim: true
    },
    adminEmail: {
      type: String,
      trim: true
    },
    scannedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  }],

  // Reached Hub status events
  reachedHub: [{
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    adminName: {
      type: String,
      trim: true
    },
    adminEmail: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  }],

  // Assigned status events (when coloader is assigned)
  assigned: [{
    coloaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coloader'
    },
    coloaderName: {
      type: String,
      trim: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    adminName: {
      type: String,
      trim: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    legNumber: {
      type: Number,
      default: 1
    },
    totalLegs: {
      type: Number,
      default: 1
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    currentAssignment: {
      type: String,
      enum: ['AssignedPath', 'Completed'],
      default: 'AssignedPath'
    }
  }],

  // Courier boy assignment events
  courierboy: [{
    courierBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourierBoy'
    },
    courierBoyName: {
      type: String,
      trim: true
    },
    courierBoyEmail: {
      type: String,
      trim: true
    },
    courierBoyPhone: {
      type: String,
      trim: true
    },
    coloaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coloader'
    },
    coloaderName: {
      type: String,
      trim: true
    },
    coloaderPhone: {
      type: String,
      trim: true
    },
    coloaderAddressType: {
      type: String,
      enum: ['company', 'from', 'to'],
      default: 'company'
    },
    coloaderAddressLabel: {
      type: String,
      trim: true
    },
    coloaderAddressDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    coloaderAddressIndex: {
      type: Number,
      default: null
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    adminName: {
      type: String,
      trim: true
    },
    adminEmail: {
      type: String,
      trim: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  }],

  // Future status arrays (can be added later)
  // inTransit: [{
  //   type: mongoose.Schema.Types.Mixed
  // }],
  // outForDelivery: [{
  //   type: mongoose.Schema.Types.Mixed
  // }],
  // delivered: [{
  //   type: mongoose.Schema.Types.Mixed
  // }],
  // cancelled: [{
  //   type: mongoose.Schema.Types.Mixed
  // }],
  // returned: [{
  //   type: mongoose.Schema.Types.Mixed
  // }],

  // Force delivery fields
  forceDelivery: {
    type: Boolean,
    default: false,
    index: true
  },
  force: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },

  // Timestamps for status changes
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  }]
}, {
  timestamps: true,
  collection: 'trackings'
});

// Create indexes for better query performance
trackingSchema.index({ consignmentNumber: 1 });
trackingSchema.index({ bookingReference: 1 });
trackingSchema.index({ assignmentType: 1, entityId: 1 });
trackingSchema.index({ corporateId: 1 });
trackingSchema.index({ createdAt: -1 });
trackingSchema.index({ 'statusHistory.timestamp': -1 });

// Static method to find by consignment number
trackingSchema.statics.findByConsignmentNumber = function (consignmentNumber) {
  return this.findOne({ consignmentNumber: consignmentNumber });
};

// Static method to find by booking reference
trackingSchema.statics.findByBookingReference = function (bookingReference) {
  return this.findOne({ bookingReference: bookingReference });
};

// Instance method to update status
trackingSchema.methods.updateStatus = function (newStatus, notes = '') {
  this.currentStatus = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    notes: notes
  });
  return this.save();
};

// Instance method to add data to a status array
trackingSchema.methods.addStatusData = function (status, data) {
  if (!this[status]) {
    this[status] = [];
  }
  this[status].push(data);
  return this.save();
};

export default mongoose.model("Tracking", trackingSchema);

