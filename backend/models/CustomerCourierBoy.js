import mongoose from "mongoose";

const customerCourierBoySchema = new mongoose.Schema({
  // Customer Booking Reference
  customerBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerBooking',
    required: true,
    index: true
  },
  
  // Consignment Number
  consignmentNumber: {
    type: Number,
    required: true,
    index: true
  },
  
  // Booking Reference
  bookingReference: {
    type: String,
    required: true,
    index: true
  },

  // Courier Boy Details
  courierBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourierBoy',
    required: true,
    index: true
  },
  courierBoyName: {
    type: String,
    required: true,
    trim: true
  },
  courierBoyEmail: {
    type: String,
    trim: true,
    default: ''
  },
  courierBoyPhone: {
    type: String,
    required: true,
    trim: true
  },
  courierBoyArea: {
    type: String,
    trim: true,
    default: ''
  },

  // Order/Booking Details
  orderDetails: {
    origin: {
      name: String,
      mobileNumber: String,
      email: String,
      companyName: String,
      flatBuilding: String,
      locality: String,
      landmark: String,
      pincode: String,
      area: String,
      city: String,
      district: String,
      state: String,
      gstNumber: String
    },
    destination: {
      name: String,
      mobileNumber: String,
      email: String,
      companyName: String,
      flatBuilding: String,
      locality: String,
      landmark: String,
      pincode: String,
      area: String,
      city: String,
      district: String,
      state: String,
      gstNumber: String
    },
    shipment: {
      natureOfConsignment: String,
      insurance: String,
      riskCoverage: String,
      packagesCount: String,
      materials: String,
      others: String,
      description: String,
      declaredValue: String,
      weight: String,
      length: String,
      width: String,
      height: String
    },
    shippingMode: String,
    serviceType: String,
    calculatedPrice: Number,
    totalAmount: Number,
    actualWeight: Number,
    volumetricWeight: Number,
    chargeableWeight: Number,
    paymentStatus: String,
    paymentMethod: String
  },

  // Assignment Details
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  adminName: {
    type: String,
    required: true,
    trim: true
  },
  adminEmail: {
    type: String,
    trim: true,
    default: ''
  },

  // Timestamp
  AssignedCourierBoyAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  // Status
  status: {
    type: String,
    enum: ['assigned', 'picked', 'completed', 'cancelled'],
    default: 'assigned',
    index: true
  },

  // Work Type
  workType: {
    type: String,
    enum: ['pickup'],
    default: 'pickup',
    required: true
  }
}, {
  timestamps: true,
  collection: 'customercourierboys'
});

// Indexes for better query performance
customerCourierBoySchema.index({ courierBoyId: 1, status: 1 });
customerCourierBoySchema.index({ consignmentNumber: 1 });
customerCourierBoySchema.index({ bookingReference: 1 });
customerCourierBoySchema.index({ AssignedCourierBoyAt: -1 });
customerCourierBoySchema.index({ 'orderDetails.origin.city': 1 });
customerCourierBoySchema.index({ 'orderDetails.destination.city': 1 });

// Static method to find by consignment number
customerCourierBoySchema.statics.findByConsignmentNumber = function(consignmentNumber) {
  return this.findOne({ consignmentNumber: consignmentNumber });
};

// Static method to find by booking reference
customerCourierBoySchema.statics.findByBookingReference = function(bookingReference) {
  return this.findOne({ bookingReference: bookingReference });
};

export default mongoose.model("CustomerCourierBoy", customerCourierBoySchema);

