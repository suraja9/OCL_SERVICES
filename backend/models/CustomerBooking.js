import mongoose from "mongoose";

const customerBookingSchema = new mongoose.Schema({
  // Origin/Sender Details
  origin: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      default: ''
    },
    companyName: {
      type: String,
      trim: true,
      default: ''
    },
    flatBuilding: {
      type: String,
      trim: true,
      default: ''
    },
    locality: {
      type: String,
      required: true,
      trim: true
    },
    landmark: {
      type: String,
      trim: true,
      default: ''
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    area: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    gstNumber: {
      type: String,
      trim: true,
      default: ''
    },
    alternateNumbers: [{
      type: String,
      trim: true
    }],
    addressType: {
      type: String,
      enum: ['HOME', 'OFFICE', 'OTHERS', 'Home', 'Office'], // Accept both uppercase and capitalized for backward compatibility
      default: 'HOME'
    },
    birthday: {
      type: String,
      trim: true,
      default: ''
    },
    anniversary: {
      type: String,
      trim: true,
      default: ''
    },
    website: {
      type: String,
      trim: true,
      default: ''
    },
    otherAlternateNumber: {
      type: String,
      trim: true,
      default: ''
    }
  },

  // Destination/Receiver Details
  destination: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      default: ''
    },
    companyName: {
      type: String,
      trim: true,
      default: ''
    },
    flatBuilding: {
      type: String,
      trim: true,
      default: ''
    },
    locality: {
      type: String,
      required: true,
      trim: true
    },
    landmark: {
      type: String,
      trim: true,
      default: ''
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    area: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    gstNumber: {
      type: String,
      trim: true,
      default: ''
    },
    alternateNumbers: [{
      type: String,
      trim: true
    }],
    addressType: {
      type: String,
      enum: ['HOME', 'OFFICE', 'OTHERS', 'Home', 'Office'], // Accept both uppercase and capitalized for backward compatibility
      default: 'HOME'
    },
    birthday: {
      type: String,
      trim: true,
      default: ''
    },
    anniversary: {
      type: String,
      trim: true,
      default: ''
    },
    website: {
      type: String,
      trim: true,
      default: ''
    },
    otherAlternateNumber: {
      type: String,
      trim: true,
      default: ''
    }
  },

  // Shipment Details
  shipment: {
    natureOfConsignment: {
      type: String,
      required: true,
      trim: true
    },
    insurance: {
      type: String,
      required: true,
      trim: true
    },
    riskCoverage: {
      type: String,
      required: true,
      trim: true
    },
    packagesCount: {
      type: String,
      required: true,
      trim: true
    },
    materials: {
      type: String,
      trim: true,
      default: ''
    },
    others: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    declaredValue: {
      type: String,
      trim: true,
      default: ''
    },
    weight: {
      type: String,
      trim: true,
      default: ''
    },
    length: {
      type: String,
      trim: true,
      default: ''
    },
    width: {
      type: String,
      trim: true,
      default: ''
    },
    height: {
      type: String,
      trim: true,
      default: ''
    },
    // Insurance details (if insurance is selected)
    insuranceCompanyName: {
      type: String,
      trim: true,
      default: ''
    },
    insurancePolicyNumber: {
      type: String,
      trim: true,
      default: ''
    },
    insurancePolicyDate: {
      type: String,
      trim: true,
      default: ''
    },
    insuranceValidUpto: {
      type: String,
      trim: true,
      default: ''
    },
    insurancePremiumAmount: {
      type: String,
      trim: true,
      default: ''
    },
    insuranceDocumentName: {
      type: String,
      trim: true,
      default: ''
    },
    insuranceDocument: {
      type: String, // S3 URL
      trim: true,
      default: ''
    },
    declarationDocumentName: {
      type: String,
      trim: true,
      default: ''
    },
    declarationDocument: {
      type: String, // S3 URL
      trim: true,
      default: ''
    }
  },

  // Package Images (S3 URLs)
  packageImages: [{
    type: String, // S3 URL
    trim: true
  }],

  // Shipping Mode & Service Type
  shippingMode: {
    type: String,
    enum: ['byAir', 'byTrain', 'byRoad', ''],
    default: ''
  },
  serviceType: {
    type: String,
    enum: ['standard', 'priority', ''],
    default: ''
  },

  // Pricing Information
  calculatedPrice: {
    type: Number,
    default: null
  },
  // Price Breakdown
  basePrice: {
    type: Number,
    default: null
  },
  gstAmount: {
    type: Number,
    default: null
  },
  pickupCharge: {
    type: Number,
    default: 100 // Door pickup charge
  },
  totalAmount: {
    type: Number,
    default: null
  },
  actualWeight: {
    type: Number,
    default: null
  },
  volumetricWeight: {
    type: Number,
    default: null
  },
  chargeableWeight: {
    type: Number,
    default: null
  },

  // Serviceability Information
  originServiceable: {
    type: Boolean,
    default: null
  },
  destinationServiceable: {
    type: Boolean,
    default: null
  },
  originAddressInfo: {
    type: String,
    trim: true,
    default: ''
  },
  destinationAddressInfo: {
    type: String,
    trim: true,
    default: ''
  },

  // Booking Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },

  // Current Tracking Status (for detailed shipment tracking)
  currentStatus: {
    type: String,
    enum: [
      'booked',
      'pickup',
      'picked',
      'received',
      'assigned',
      'courierboy',
      'intransit',
      'in_transit',
      'reached-hub',
      'out_for_delivery',
      'OFP',
      'delivered',
      'cancelled',
      'returned'
    ],
    default: 'booked',
    index: true
  },

  // Booking timestamp
  BookedAt: {
    type: Date,
    default: Date.now
  },

  // Consignment Number (unique AWB/Docket)
  consignmentNumber: {
    type: Number,
    index: true,
    default: null
  },

  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod', 'pay_later', ''],
    default: ''
  },
  razorpayOrderId: {
    type: String,
    trim: true,
    default: ''
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    default: ''
  },
  razorpaySignature: {
    type: String,
    trim: true,
    default: ''
  },
  paidAt: {
    type: Date,
    default: null
  },

  // Booking Reference Number
  bookingReference: {
    type: String,
    unique: true,
    sparse: true
  },

  // Online Customer Reference (if logged in)
  onlineCustomerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OnlineCustomer',
    default: null
  },

  // Assigned Courier Boy (for pickup)
  assignedCourierBoy: {
    courierBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourierBoy',
      default: null
    },
    fullName: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    _id: false // Prevent Mongoose from creating _id for subdocument
  },
  assignedCourierBoyAt: {
    type: Date,
    default: null
  },

  // Timestamp for when consignment was received
  ReceivedAt: {
    type: Date,
    default: null
  },

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

  // Courier boy assignment events (for coloader assignments)
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

  // Intransit status data (for delivery assignments)
  intransit: [{
    courierBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourierBoy'
    },
    courierBoyName: {
      type: String,
      trim: true
    },
    courierBoyPhone: {
      type: String,
      trim: true
    },
    courierBoyEmail: {
      type: String,
      trim: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    assignedByName: {
      type: String,
      trim: true
    },
    assignedByEmail: {
      type: String,
      trim: true
    },
    consignmentNumber: {
      type: Number
    },
    receiverName: {
      type: String,
      trim: true
    },
    destination: {
      type: mongoose.Schema.Types.Mixed
    },
    paymentStatus: {
      type: String
    },
    finalPrice: {
      type: Number
    },
    paymentType: {
      type: String
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  }],

  // Out For Delivery status data (for delivery assignments)
  OutForDelivery: [{
    courierBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourierBoy'
    },
    courierBoyName: {
      type: String,
      trim: true
    },
    courierBoyPhone: {
      type: String,
      trim: true
    },
    courierBoyEmail: {
      type: String,
      trim: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    assignedByName: {
      type: String,
      trim: true
    },
    assignedByEmail: {
      type: String,
      trim: true
    },
    consignmentNumber: {
      type: Number
    },
    receiverName: {
      type: String,
      trim: true
    },
    destination: {
      type: mongoose.Schema.Types.Mixed
    },
    paymentStatus: {
      type: String
    },
    finalPrice: {
      type: Number
    },
    paymentType: {
      type: String
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  }],

  // Status history for tracking status changes
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
  collection: 'customerbookings'
});

// Indexes for better query performance
customerBookingSchema.index({ 'origin.mobileNumber': 1 });
customerBookingSchema.index({ 'destination.mobileNumber': 1 });
customerBookingSchema.index({ status: 1 });
customerBookingSchema.index({ currentStatus: 1 });
customerBookingSchema.index({ BookedAt: -1 });
// bookingReference and consignmentNumber already have indexes (unique: true and index: true respectively)
customerBookingSchema.index({ createdAt: -1 });
customerBookingSchema.index({ onlineCustomerId: 1 });

// Static method to find by booking reference
customerBookingSchema.statics.findByReference = function(reference) {
  return this.findOne({ bookingReference: reference });
};

// Static method to find by status
customerBookingSchema.statics.findByStatus = function(status) {
  return this.find({ status: status }).sort({ createdAt: -1 });
};

// Instance method to update status
customerBookingSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

export default mongoose.model("CustomerBooking", customerBookingSchema);

