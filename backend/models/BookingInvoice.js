import mongoose from "mongoose";

const bookingInvoiceSchema = new mongoose.Schema({
  // Invoice identification
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Booking reference
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerBooking',
    required: true,
    index: true
  },
  bookingReference: {
    type: String,
    required: true,
    index: true
  },
  consignmentNumber: {
    type: String,
    required: true,
    index: true
  },
  
  // Invoice type - to differentiate from corporate invoices
  invoiceType: {
    type: String,
    enum: ['booking', 'corporate'],
    default: 'booking'
  },
  
  // Company details (Our Courier & Logistics)
  companyDetails: {
    name: {
      type: String,
      default: "Our Courier & Logistics"
    },
    location: {
      type: String,
      default: "Rehabari, Guwahati, Assam 781008"
    },
    gstin: {
      type: String,
      default: " 18AJRPG5984B1ZV"
    },
    state: {
      type: String,
      default: "Assam"
    },
    stateCode: {
      type: String,
      default: "18"
    },
    phone: {
      type: String,
      default: "+91 0120 323 7111"
    },
    email: {
      type: String,
      default: "info@oclservices.com"
    },
    website: {
      type: String,
      default: "www.oclservices.com"
    }
  },
  
  // Origin/Sender details
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
    gstNumber: String,
    alternateNumbers: [String]
  },
  
  // Destination/Recipient details
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
    gstNumber: String,
    alternateNumbers: [String]
  },
  
  // Shipment details
  shipment: {
    natureOfConsignment: String,
    shippingMode: String, // byAir, byTrain, byRoad
    serviceType: String, // priority, standard
    weight: String,
    declaredValue: String,
    packagesCount: String,
    materials: String,
    others: String,
    description: String,
    length: String,
    width: String,
    height: String
  },
  
  // Pricing breakdown
  pricing: {
    basePrice: Number,
    pickupCharge: Number,
    pickupChargeGST: Number,
    subtotal: Number,
    fuelCharge: Number,
    fuelChargePercentage: Number,
    cgst: Number,
    sgst: Number,
    igst: Number,
    totalBeforeGST: Number,
    grandTotal: Number,
    amountInWords: String
  },
  
  // Payment details
  payment: {
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'pending'],
      default: 'unpaid'
    },
    modeOfPayment: String, // Cash, To Pay, etc.
    paymentMethod: String, // cod, pay_later, razorpay
    amount: Number
  },
  
  // Invoice metadata
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Additional info
  itemDescription: String,
  barcodeValue: String,
  billTo: {
    name: String,
    phone: String,
    address: String
  }
}, {
  timestamps: true,
  collection: 'invoices' // Use 'invoices' collection as requested
});

// Create indexes for better query performance
bookingInvoiceSchema.index({ bookingReference: 1 });
bookingInvoiceSchema.index({ consignmentNumber: 1 });
bookingInvoiceSchema.index({ invoiceNumber: 1 });
bookingInvoiceSchema.index({ 'origin.mobileNumber': 1 });
bookingInvoiceSchema.index({ 'destination.mobileNumber': 1 });
bookingInvoiceSchema.index({ invoiceDate: -1 });
bookingInvoiceSchema.index({ 'payment.status': 1 });

// Static method to find invoices by booking reference
bookingInvoiceSchema.statics.findByBookingReference = function(bookingReference) {
  return this.findOne({ bookingReference });
};

// Static method to find invoices by consignment number
bookingInvoiceSchema.statics.findByConsignmentNumber = function(consignmentNumber) {
  return this.findOne({ consignmentNumber });
};

// Static method to find invoices by booking ID
bookingInvoiceSchema.statics.findByBookingId = function(bookingId) {
  return this.findOne({ bookingId });
};

const BookingInvoice = mongoose.model('BookingInvoice', bookingInvoiceSchema);

export default BookingInvoice;

