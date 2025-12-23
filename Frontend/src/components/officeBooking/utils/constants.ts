/**
 * Constants for Office Booking Panel
 */

export const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

// Booking Steps Configuration
export const BOOKING_STEPS = [
  'Serviceability',
  'Origin',
  'Destination',
  'Shipment Details',
  'Material Details',
  'Upload',
  'Bill',
  'Details',
  'Mode of Payment',
  'Successful'
] as const;

// Default Values
export const DEFAULT_ORIGIN_DATA = {
  mobileNumber: '',
  name: '',
  companyName: '',
  email: '',
  locality: '',
  flatBuilding: '',
  landmark: '',
  pincode: '',
  area: '',
  city: '',
  district: '',
  state: '',
  gstNumber: '',
  alternateNumbers: [''],
  addressType: 'Home' as const,
  birthday: '',
  anniversary: '',
  otherAlternateNumber: '',
  showOtherAlternateNumber: false,
  website: ''
};

export const DEFAULT_DESTINATION_DATA = {
  mobileNumber: '',
  name: '',
  companyName: '',
  email: '',
  locality: '',
  flatBuilding: '',
  landmark: '',
  pincode: '',
  area: '',
  city: '',
  district: '',
  state: '',
  gstNumber: '',
  alternateNumbers: [''],
  addressType: 'Home' as const,
  website: '',
  anniversary: '',
  birthday: ''
};

export const DEFAULT_SHIPMENT_DATA = {
  natureOfConsignment: 'NON-DOX',
  services: 'Standard',
  mode: 'Air' as const,
  insurance: 'Without insurance',
  riskCoverage: 'Owner',
  dimensions: [{ length: '', breadth: '', height: '', unit: 'cm' as const }],
  actualWeight: '',
  perKgWeight: '',
  volumetricWeight: 0,
  chargeableWeight: 0
};

export const DEFAULT_UPLOAD_DATA = {
  totalPackages: '',
  materials: '',
  packageImages: [],
  contentDescription: '',
  invoiceNumber: '',
  invoiceValue: '',
  invoiceImages: [],
  panImages: [],
  declarationImages: [],
  eWaybillDigits: Array(12).fill(''),
  acceptTerms: false
};

export const DEFAULT_PAYMENT_DATA = {
  paymentType: '' as const,
  modeOfPayment: '',
  amount: ''
};

export const DEFAULT_BILL_DATA = {
  partyType: '' as const,
  otherPartyDetails: {
    concernName: '',
    companyName: '',
    phoneNumber: '',
    locality: '',
    flatBuilding: '',
    landmark: '',
    pincode: '',
    area: '',
    city: '',
    district: '',
    state: '',
    gstNumber: ''
  },
  billType: '' as const
};

export const DEFAULT_DETAILS_DATA = {
  freightCharge: '',
  awbCharge: '',
  pickupCharge: '',
  localCollection: '',
  doorDelivery: '',
  loadingUnloading: '',
  demurrageCharge: '',
  ddaCharge: '',
  hamaliCharge: '',
  packingCharge: '',
  otherCharge: '',
  total: '',
  fuelCharge: '',
  fuelChargeType: 'percentage' as const,
  sgstAmount: '',
  cgstAmount: '',
  igstAmount: '',
  grandTotal: ''
};

// API Endpoints
export const API_ENDPOINTS = {
  PINCODE_LOOKUP: '/api/pincode/lookup',
  SERVICEABILITY_CHECK: '/api/pincode/serviceability',
  SUBMIT_BOOKING: '/api/booking/submit',
  UPLOAD_IMAGE: '/api/upload/image'
} as const;

