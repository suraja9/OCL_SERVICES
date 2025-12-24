/**
 * Type definitions for Office Booking Panel
 * Centralized types and interfaces for the office booking system
 */

// Address Data Types
export interface AddressData {
  mobileNumber: string;
  name: string;
  companyName: string;
  email: string;
  locality: string;
  flatBuilding: string;
  landmark: string;
  pincode: string;
  area: string;
  city: string;
  district: string;
  state: string;
  gstNumber: string;
  alternateNumbers: string[];
  addressType: 'Home' | 'Office' | 'Other';
  birthday?: string;
  anniversary?: string;
  website?: string;
  otherAlternateNumber?: string;
  showOtherAlternateNumber?: boolean;
}

// Shipment Data Types
export interface Dimension {
  length: string;
  breadth: string;
  height: string;
  unit: 'cm' | 'inch';
}

export interface ShipmentData {
  natureOfConsignment: string;
  services: string;
  mode: 'Air' | 'Surface' | 'Train';
  insurance: string;
  riskCoverage: string;
  dimensions: Dimension[];
  actualWeight: string;
  perKgWeight: string;
  volumetricWeight: number;
  chargeableWeight: number;
  // Insurance fields
  insuranceCompanyName?: string;
  insurancePolicyNumber?: string;
  insurancePolicyDate?: string;
  insuranceValidUpto?: string;
  insurancePremiumAmount?: string;
  insuranceDocument?: File | null;
  insuranceDocumentName?: string;
}

// Upload Data Types
export interface UploadData {
  totalPackages: string;
  materials: string;
  packageImages: File[];
  contentDescription: string;
  invoiceNumber: string;
  invoiceValue: string;
  invoiceImages: File[];
  panImages: File[];
  declarationImages: File[];
  eWaybillDigits?: string[];
  acceptTerms: boolean;
  // Package details
  others?: string;
  description?: string;
  declaredValue?: string;
  weight?: string;
  perKgWeight?: string;
  length?: string;
  width?: string;
  height?: string;
  declarationDocument?: File | null;
  declarationDocumentName?: string;
}

// Payment Data Types
export interface PaymentData {
  paymentType: 'FP' | 'TP' | 'COD' | ''; // FP = Freight Paid (Godown), TP = To Pay (Door Delivery)
  modeOfPayment?: string; // 'Cash' or 'To Pay'
  amount?: string;
  currentStatus?: 'booked' | 'picked'; // Current status selection
  courierBoyId?: string; // ID of courier boy who did the pickup (when currentStatus is 'picked')
}

// Bill Data Types
export interface OtherPartyDetails {
  concernName: string;
  companyName: string;
  phoneNumber: string;
  locality: string;
  flatBuilding: string;
  landmark: string;
  pincode: string;
  area: string;
  city: string;
  district: string;
  state: string;
  gstNumber: string;
}

export interface BillData {
  partyType: 'sender' | 'recipient' | 'other' | '';
  otherPartyDetails: OtherPartyDetails;
  billType: 'normal' | 'rcm' | '';
}

// Details/Charges Data Types
export interface DetailsData {
  freightCharge: string;
  awbCharge: string;
  pickupCharge: string;
  localCollection: string;
  doorDelivery: string;
  loadingUnloading: string;
  demurrageCharge: string;
  ddaCharge: string;
  hamaliCharge: string;
  packingCharge: string;
  otherCharge: string;
  total: string;
  fuelCharge: string;
  fuelChargeType: 'percentage' | 'custom';
  sgstAmount: string;
  cgstAmount: string;
  igstAmount: string;
  grandTotal: string;
}

// Complete Booking Data
export interface OfficeBookingData {
  originData: AddressData;
  destinationData: AddressData;
  shipmentData: ShipmentData;
  uploadData: UploadData;
  paymentData: PaymentData;
  billData: BillData;
  detailsData: DetailsData;
}

// Step Configuration
export type BookingStep = 
  | 'Origin' 
  | 'Destination' 
  | 'Shipment Details' 
  | 'Upload' 
  | 'Bill' 
  | 'Details' 
  | 'Mode of Payment' 
  | 'Successful';

// Serviceability Status
export type ServiceabilityStatus = 'available' | 'unavailable' | null;

// Flow Type
export type FlowType = 'public' | 'corporate' | 'office';

// API Response Types
export interface PincodeLookupResponse {
  area: string;
  city: string;
  district: string;
  state: string;
  serviceable?: boolean;
}

export interface BookingSubmissionResponse {
  success: boolean;
  bookingReference?: string;
  consignmentNumber?: number;
  customerId?: string;
  message?: string;
  error?: string;
}

// Validation Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface StepValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

