import React, { useState, useEffect } from 'react';
import { 
  Package, 
  RefreshCw, 
  MapPin,
  Weight,
  Edit,
  Check,
  X,
  Scan,
  List,
  Save,
  Building,
  FileText,
  CreditCard,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type OrderSource = 'addressForm' | 'tracking' | 'customerBooking';

interface TrackingAddressData {
  useCurrentAddress?: boolean;
  mobileNumber?: string;
  name?: string;
  email?: string;
  companyName?: string;
  flatBuilding?: string;
  locality?: string;
  landmark?: string;
  pincode?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  gstNumber?: string;
  alternateNumbers?: string[];
  addressType?: string;
  birthday?: string;
  anniversary?: string;
  website?: string;
  otherAlternateNumber?: string;
  showOtherAlternateNumber?: boolean;
}

interface TrackingDimension {
  length?: string;
  breadth?: string;
  height?: string;
  unit?: string;
}

interface TrackingShipmentData {
  natureOfConsignment?: string;
  services?: string;
  mode?: string;
  insurance?: string;
  riskCoverage?: string;
  packagesCount?: string;
  packageType?: string;
  others?: string;
  contentDescription?: string;
  declaredValue?: string;
  dimensions?: TrackingDimension[];
  actualWeight?: string;
  volumetricWeight?: number;
  chargeableWeight?: number;
  totalPackages?: string;
  materials?: string;
  packageImages?: any[];
  uploadedFiles?: any[];
  description?: string;
  specialInstructions?: string;
  perKgWeight?: string;
}

interface TrackingCorporateInfo {
  corporateId?: string;
  companyName?: string;
  email?: string;
  contactNumber?: string;
}

interface TrackingInvoiceData {
  billingAddress?: string;
  paymentMethod?: string;
  terms?: string;
  calculatedPrice?: number;
  gst?: number;
  finalPrice?: number;
  serviceType?: string;
  location?: string;
  transportMode?: string;
  chargeableWeight?: number;
}

interface TrackingPaymentData {
  paymentType?: string;
  modeOfPayment?: string;
  amount?: number;
  currentStatus?: string;
}

interface TrackingBookingData {
  corporateId?: string;
  corporateInfo?: TrackingCorporateInfo;
  originData?: TrackingAddressData;
  destinationData?: TrackingAddressData;
  shipmentData?: TrackingShipmentData;
  invoiceData?: TrackingInvoiceData;
  paymentData?: TrackingPaymentData;
  consignmentNumber?: number;
  bookingReference?: string;
  bookingDate?: string;
  status?: string;
  paymentStatus?: string;
}

interface TrackingReceivedEvent {
  adminId?: string;
  adminName?: string;
  adminEmail?: string;
  scannedAt?: string;
}

interface TrackingRecord {
  _id: string;
  consignmentNumber: number | string;
  currentStatus: string;
  booked?: TrackingBookingData[];
  pickup?: TrackingBookingData[];
  received?: TrackingReceivedEvent[];
  createdAt: string;
  updatedAt: string;
}

interface CustomerBookingData {
  _id: string;
  consignmentNumber: number | string;
  currentStatus: string;
  origin: {
    name: string;
    mobileNumber: string;
    email: string;
    companyName: string;
    flatBuilding: string;
    locality: string;
    landmark: string;
    pincode: string;
    area: string;
    city: string;
    district: string;
    state: string;
    gstNumber: string;
    alternateNumbers: string[];
    addressType: string;
    birthday: string;
    anniversary: string;
    website: string;
    otherAlternateNumber: string;
  };
  destination: {
    name: string;
    mobileNumber: string;
    email: string;
    companyName: string;
    flatBuilding: string;
    locality: string;
    landmark: string;
    pincode: string;
    area: string;
    city: string;
    district: string;
    state: string;
    gstNumber: string;
    alternateNumbers: string[];
    addressType: string;
    birthday: string;
    anniversary: string;
    website: string;
    otherAlternateNumber: string;
  };
  shipment: {
    natureOfConsignment: string;
    insurance: string;
    riskCoverage: string;
    packagesCount: string;
    materials: string;
    others: string;
    description: string;
    declaredValue: string;
    weight: string;
    length: string;
    width: string;
    height: string;
    insuranceCompanyName: string;
    insurancePolicyNumber: string;
    insurancePolicyDate: string;
    insuranceValidUpto: string;
    insurancePremiumAmount: string;
    insuranceDocumentName: string;
    insuranceDocument: string;
    declarationDocumentName: string;
    declarationDocument: string;
  };
  packageImages: string[];
  shippingMode: string;
  serviceType: string;
  calculatedPrice: number;
  basePrice: number;
  gstAmount: number;
  pickupCharge: number;
  totalAmount: number;
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  originServiceable: boolean;
  destinationServiceable: boolean;
  originAddressInfo: string;
  destinationAddressInfo: string;
  status: string;
  BookedAt: string;
  paymentStatus: string;
  paymentMethod: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paidAt: string;
  bookingReference: string;
  ReceivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AddressFormData {
  _id: string;
  consignmentNumber?: number | string;
  bookingReference?: string;
  originData?: {
    useCurrentAddress?: boolean;
    mobileNumber?: string;
    name: string;
    email?: string;
    companyName?: string;
    flatBuilding?: string;
    locality?: string;
    landmark?: string;
    pincode: string;
    area?: string;
    city: string;
    district?: string;
    state: string;
    gstNumber?: string;
    alternateNumbers?: string[];
    addressType?: string;
    birthday?: string;
    anniversary?: string;
    website?: string;
    otherAlternateNumber?: string;
    showOtherAlternateNumber?: boolean;
  };
  destinationData?: {
    mobileNumber?: string;
    name: string;
    email?: string;
    companyName?: string;
    flatBuilding?: string;
    locality?: string;
    landmark?: string;
    pincode: string;
    area?: string;
    city: string;
    district?: string;
    state: string;
    gstNumber?: string;
    alternateNumbers?: string[];
    addressType?: string;
    birthday?: string;
    anniversary?: string;
    website?: string;
    otherAlternateNumber?: string;
  };
  shipmentData?: {
    natureOfConsignment?: string;
    services?: string;
    mode?: string;
    insurance?: string;
    riskCoverage?: string;
    packagesCount?: string;
    packageType?: string;
    others?: string;
    contentDescription?: string;
    declaredValue?: string;
    dimensions?: Array<{
      length?: string;
      breadth?: string;
      height?: string;
      unit?: string;
    }>;
    actualWeight?: string | number;
    volumetricWeight?: number;
    chargeableWeight?: number;
    totalPackages?: string;
    materials?: string;
    packageImages?: string[] | any[];
    uploadedFiles?: any[];
    description?: string;
    specialInstructions?: string;
    perKgWeight?: string;
    weight?: string;
    length?: string;
    width?: string;
    height?: string;
    insuranceCompanyName?: string;
    insurancePolicyNumber?: string;
    insurancePolicyDate?: string;
    insuranceValidUpto?: string;
    insurancePremiumAmount?: string;
    insuranceDocumentName?: string;
    insuranceDocument?: string;
    declarationDocumentName?: string;
    declarationDocument?: string;
  };
  corporateInfo?: {
    corporateId?: string;
    companyName?: string;
    email?: string;
    contactNumber?: string;
  };
  invoiceData?: {
    billingAddress?: string;
    paymentMethod?: string;
    terms?: string;
    calculatedPrice?: number;
    gst?: number;
    finalPrice?: number;
    serviceType?: string;
    location?: string;
    transportMode?: string;
    chargeableWeight?: number;
  };
  paymentData?: {
    paymentType?: string;
    modeOfPayment?: string;
    amount?: number;
    currentStatus?: string;
  };
  bookingDate?: string;
  status?: string;
  paymentStatus?: string;
  senderName?: string;
  senderCity?: string;
  senderState?: string;
  senderPincode?: string;
  senderAddressLine1?: string;
  senderAddressLine2?: string;
  senderLandmark?: string;
  senderArea?: string;
  senderDistrict?: string;
  receiverName?: string;
  receiverCity?: string;
  receiverState?: string;
  receiverPincode?: string;
  receiverAddressLine1?: string;
  receiverAddressLine2?: string;
  receiverLandmark?: string;
  receiverArea?: string;
  receiverDistrict?: string;
  formCompleted: boolean;
  createdAt: string;
  assignmentData?: {
    assignedColoader?: string;
    assignedColoaderName?: string;
    assignedAt?: string;
    totalLegs?: number;
    legAssignments?: Array<{
      legNumber: number;
      coloaderId: string;
      coloaderName: string;
      assignedAt: string;
      assignedBy: string;
    }>;
    status?: 'booked' | 'assigned' | 'partially_assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'received';
  };
  source?: OrderSource;
  trackingRecord?: TrackingRecord;
}

const getLatestTrackingBooking = (tracking?: TrackingRecord): TrackingBookingData | undefined => {
  if (!tracking?.booked || tracking.booked.length === 0) return undefined;
  return tracking.booked[tracking.booked.length - 1];
};

const getTrackingTimestamp = (tracking: TrackingRecord) => {
  const latestReceived = tracking.received && tracking.received.length > 0
    ? tracking.received[tracking.received.length - 1]?.scannedAt
    : null;
  return latestReceived || tracking.updatedAt || tracking.createdAt;
};

const convertTrackingToAddressFormData = (tracking: TrackingRecord): AddressFormData => {
  const bookingData = getLatestTrackingBooking(tracking);
  const numericConsignment = typeof tracking.consignmentNumber === 'number'
    ? tracking.consignmentNumber
    : Number(tracking.consignmentNumber);

  return {
    _id: tracking._id,
    consignmentNumber: Number.isNaN(numericConsignment) ? tracking.consignmentNumber : numericConsignment,
    bookingReference: bookingData?.bookingReference || String(tracking.consignmentNumber),
    originData: bookingData?.originData ? {
      useCurrentAddress: bookingData.originData.useCurrentAddress,
      mobileNumber: bookingData.originData.mobileNumber,
      name: bookingData.originData.name || '',
      email: bookingData.originData.email,
      companyName: bookingData.originData.companyName,
      flatBuilding: bookingData.originData.flatBuilding,
      locality: bookingData.originData.locality,
      landmark: bookingData.originData.landmark,
      pincode: bookingData.originData.pincode || '',
      area: bookingData.originData.area,
      city: bookingData.originData.city || '',
      district: bookingData.originData.district,
      state: bookingData.originData.state || '',
      gstNumber: bookingData.originData.gstNumber,
      alternateNumbers: bookingData.originData.alternateNumbers,
      addressType: bookingData.originData.addressType,
      birthday: bookingData.originData.birthday,
      anniversary: bookingData.originData.anniversary,
      website: bookingData.originData.website,
      otherAlternateNumber: bookingData.originData.otherAlternateNumber,
      showOtherAlternateNumber: bookingData.originData.showOtherAlternateNumber
    } : undefined,
    destinationData: bookingData?.destinationData ? {
      mobileNumber: bookingData.destinationData.mobileNumber,
      name: bookingData.destinationData.name || '',
      email: bookingData.destinationData.email,
      companyName: bookingData.destinationData.companyName,
      flatBuilding: bookingData.destinationData.flatBuilding,
      locality: bookingData.destinationData.locality,
      landmark: bookingData.destinationData.landmark,
      pincode: bookingData.destinationData.pincode || '',
      area: bookingData.destinationData.area,
      city: bookingData.destinationData.city || '',
      district: bookingData.destinationData.district,
      state: bookingData.destinationData.state || '',
      gstNumber: bookingData.destinationData.gstNumber,
      alternateNumbers: bookingData.destinationData.alternateNumbers,
      addressType: bookingData.destinationData.addressType,
      birthday: bookingData.destinationData.birthday,
      anniversary: bookingData.destinationData.anniversary,
      website: bookingData.destinationData.website
    } : undefined,
    shipmentData: bookingData?.shipmentData ? {
      natureOfConsignment: bookingData.shipmentData.natureOfConsignment,
      services: bookingData.shipmentData.services,
      mode: bookingData.shipmentData.mode,
      insurance: bookingData.shipmentData.insurance,
      riskCoverage: bookingData.shipmentData.riskCoverage,
      packagesCount: bookingData.shipmentData.packagesCount,
      packageType: bookingData.shipmentData.packageType,
      others: bookingData.shipmentData.others,
      contentDescription: bookingData.shipmentData.contentDescription,
      declaredValue: bookingData.shipmentData.declaredValue,
      dimensions: bookingData.shipmentData.dimensions,
      actualWeight: bookingData.shipmentData.actualWeight,
      volumetricWeight: bookingData.shipmentData.volumetricWeight,
      chargeableWeight: bookingData.shipmentData.chargeableWeight,
      totalPackages: bookingData.shipmentData.totalPackages,
      materials: bookingData.shipmentData.materials,
      packageImages: bookingData.shipmentData.packageImages,
      uploadedFiles: bookingData.shipmentData.uploadedFiles,
      description: bookingData.shipmentData.description,
      specialInstructions: bookingData.shipmentData.specialInstructions,
      perKgWeight: bookingData.shipmentData.perKgWeight
    } : undefined,
    corporateInfo: bookingData?.corporateInfo ? {
      corporateId: bookingData.corporateInfo.corporateId,
      companyName: bookingData.corporateInfo.companyName,
      email: bookingData.corporateInfo.email,
      contactNumber: bookingData.corporateInfo.contactNumber
    } : undefined,
    invoiceData: bookingData?.invoiceData ? {
      billingAddress: bookingData.invoiceData.billingAddress,
      paymentMethod: bookingData.invoiceData.paymentMethod,
      terms: bookingData.invoiceData.terms,
      calculatedPrice: bookingData.invoiceData.calculatedPrice,
      gst: bookingData.invoiceData.gst,
      finalPrice: bookingData.invoiceData.finalPrice,
      serviceType: bookingData.invoiceData.serviceType,
      location: bookingData.invoiceData.location,
      transportMode: bookingData.invoiceData.transportMode,
      chargeableWeight: bookingData.invoiceData.chargeableWeight
    } : undefined,
    paymentData: bookingData?.paymentData ? {
      paymentType: bookingData.paymentData.paymentType,
      modeOfPayment: bookingData.paymentData.modeOfPayment,
      amount: bookingData.paymentData.amount,
      currentStatus: bookingData.paymentData.currentStatus
    } : undefined,
    bookingDate: bookingData?.bookingDate,
    status: bookingData?.status,
    paymentStatus: bookingData?.paymentStatus,
    formCompleted: true,
    createdAt: getTrackingTimestamp(tracking),
    assignmentData: {
      status: tracking.currentStatus === 'received' ? 'received' : undefined
    },
    source: 'tracking',
    trackingRecord: tracking
  };
};

const convertCustomerBookingToAddressFormData = (booking: CustomerBookingData): AddressFormData => {
  const numericConsignment = typeof booking.consignmentNumber === 'number'
    ? booking.consignmentNumber
    : Number(booking.consignmentNumber);

  return {
    _id: booking._id,
    consignmentNumber: Number.isNaN(numericConsignment) ? booking.consignmentNumber : numericConsignment,
    bookingReference: booking.bookingReference || String(booking.consignmentNumber),
    originData: {
      mobileNumber: booking.origin.mobileNumber,
      name: booking.origin.name,
      email: booking.origin.email,
      companyName: booking.origin.companyName,
      flatBuilding: booking.origin.flatBuilding,
      locality: booking.origin.locality,
      landmark: booking.origin.landmark,
      pincode: booking.origin.pincode,
      area: booking.origin.area,
      city: booking.origin.city,
      district: booking.origin.district,
      state: booking.origin.state,
      gstNumber: booking.origin.gstNumber,
      alternateNumbers: booking.origin.alternateNumbers,
      addressType: booking.origin.addressType,
      birthday: booking.origin.birthday,
      anniversary: booking.origin.anniversary,
      website: booking.origin.website,
      otherAlternateNumber: booking.origin.otherAlternateNumber
    },
    destinationData: {
      mobileNumber: booking.destination.mobileNumber,
      name: booking.destination.name,
      email: booking.destination.email,
      companyName: booking.destination.companyName,
      flatBuilding: booking.destination.flatBuilding,
      locality: booking.destination.locality,
      landmark: booking.destination.landmark,
      pincode: booking.destination.pincode,
      area: booking.destination.area,
      city: booking.destination.city,
      district: booking.destination.district,
      state: booking.destination.state,
      gstNumber: booking.destination.gstNumber,
      alternateNumbers: booking.destination.alternateNumbers,
      addressType: booking.destination.addressType,
      birthday: booking.destination.birthday,
      anniversary: booking.destination.anniversary,
      website: booking.destination.website,
      otherAlternateNumber: booking.destination.otherAlternateNumber
    },
    shipmentData: {
      natureOfConsignment: booking.shipment.natureOfConsignment,
      insurance: booking.shipment.insurance,
      riskCoverage: booking.shipment.riskCoverage,
      packagesCount: booking.shipment.packagesCount,
      materials: booking.shipment.materials,
      others: booking.shipment.others,
      description: booking.shipment.description,
      declaredValue: booking.shipment.declaredValue,
      weight: booking.shipment.weight,
      length: booking.shipment.length,
      width: booking.shipment.width,
      height: booking.shipment.height,
      insuranceCompanyName: booking.shipment.insuranceCompanyName,
      insurancePolicyNumber: booking.shipment.insurancePolicyNumber,
      insurancePolicyDate: booking.shipment.insurancePolicyDate,
      insuranceValidUpto: booking.shipment.insuranceValidUpto,
      insurancePremiumAmount: booking.shipment.insurancePremiumAmount,
      insuranceDocumentName: booking.shipment.insuranceDocumentName,
      insuranceDocument: booking.shipment.insuranceDocument,
      declarationDocumentName: booking.shipment.declarationDocumentName,
      declarationDocument: booking.shipment.declarationDocument,
      actualWeight: booking.actualWeight,
      volumetricWeight: booking.volumetricWeight,
      chargeableWeight: booking.chargeableWeight,
      totalPackages: booking.shipment.packagesCount,
      packageImages: booking.packageImages
    },
    formCompleted: true,
    createdAt: booking.ReceivedAt || booking.updatedAt || booking.createdAt,
    assignmentData: {
      status: booking.currentStatus === 'received' ? 'received' : undefined
    },
    source: 'customerBooking',
    status: booking.status,
    paymentStatus: booking.paymentStatus
  };
};

const ReceivedConsignment = () => {
  const [activeTab, setActiveTab] = useState<'newReceived' | 'receivedList'>('newReceived');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedOrders, setScannedOrders] = useState<AddressFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [receivedOrders, setReceivedOrders] = useState<AddressFormData[]>([]);
  const [editingWeight, setEditingWeight] = useState<string | null>(null);
  const [newWeight, setNewWeight] = useState('');
  const [showAlreadyScannedPopup, setShowAlreadyScannedPopup] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AddressFormData | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<AddressFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Fetch received consignments
  const fetchReceivedOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      let trackingOrders: AddressFormData[] = [];
      try {
        const trackingResponse = await fetch('/api/admin/tracking?status=received', { headers });
        if (trackingResponse.ok) {
          const trackingResult = await trackingResponse.json();
          trackingOrders = (trackingResult.data || []).map((record: TrackingRecord) =>
            convertTrackingToAddressFormData(record)
          );
        } else if (trackingResponse.status !== 404) {
          console.error('Tracking fetch failed with status:', trackingResponse.status);
        }
      } catch (trackingError) {
        console.error('Error fetching received tracking consignments:', trackingError);
      }

      let formOrders: AddressFormData[] = [];
      try {
        const formsResponse = await fetch('/api/admin/addressforms?status=received', { headers });
        if (formsResponse.ok) {
          const formsResult = await formsResponse.json();
          formOrders = (formsResult.data || []).map((form: AddressFormData) => ({
            ...form,
            source: 'addressForm'
          }));
        } else if (formsResponse.status !== 404) {
          console.error('Address forms fetch failed with status:', formsResponse.status);
        }
      } catch (formError) {
        console.error('Error fetching received address form consignments:', formError);
      }

      let customerBookingOrders: AddressFormData[] = [];
      try {
        const customerBookingResponse = await fetch('/api/admin/customerbookings?status=received', { headers });
        if (customerBookingResponse.ok) {
          const customerBookingResult = await customerBookingResponse.json();
          customerBookingOrders = (customerBookingResult.data || []).map((booking: CustomerBookingData) =>
            convertCustomerBookingToAddressFormData(booking)
          );
        } else if (customerBookingResponse.status !== 404) {
          console.error('Customer bookings fetch failed with status:', customerBookingResponse.status);
        }
      } catch (customerBookingError) {
        console.error('Error fetching received customer booking consignments:', customerBookingError);
      }

      const combinedOrders = [...trackingOrders, ...formOrders, ...customerBookingOrders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReceivedOrders(combinedOrders);
    } catch (error) {
      console.error('Error fetching received consignments:', error);
      toast({
        title: "Error",
        description: "Failed to load received consignments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processTrackingScan = async (consignmentNumber: string) => {
    const token = localStorage.getItem('adminToken');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      const trackingResponse = await fetch(`/api/admin/tracking/consignment/${consignmentNumber}`, { headers });

      if (trackingResponse.status === 404) {
        return false; // Allow fallback to address forms
      }

      if (!trackingResponse.ok) {
        throw new Error('Failed to fetch tracking record');
      }

      const trackingResult = await trackingResponse.json();
      const trackingData: TrackingRecord = trackingResult.data;

      if (trackingData.currentStatus === 'received') {
        setShowAlreadyScannedPopup(true);
        setTimeout(() => {
          setShowAlreadyScannedPopup(false);
        }, 2000);
        setBarcodeInput('');
        return true;
      }

      if (trackingData.currentStatus !== 'pickup') {
        toast({
          title: "Invalid Status",
          description: `Consignment must be in pickup status before receiving (current: ${trackingData.currentStatus || 'unknown'})`,
          variant: "destructive"
        });
        setBarcodeInput('');
        return true;
      }

      const scanResponse = await fetch('/api/admin/tracking/scan', {
        method: 'POST',
        headers,
        body: JSON.stringify({ consignmentNumber })
      });

      if (!scanResponse.ok) {
        const errorData = await scanResponse.json().catch(() => null);
        toast({
          title: "Tracking Error",
          description: errorData?.error || 'Failed to update tracking status',
          variant: "destructive"
        });
        setBarcodeInput('');
        return true;
      }

      const scanResult = await scanResponse.json();
      const updatedTracking: TrackingRecord = scanResult.data;
      const normalizedOrder = convertTrackingToAddressFormData(updatedTracking);

      setScannedOrders(prev => [normalizedOrder, ...prev]);
      setBarcodeInput('');
      fetchReceivedOrders();

      toast({
        title: "Tracking Received",
        description: `Consignment ${consignmentNumber} marked as received`,
      });

      return true;
    } catch (error) {
      console.error('Error processing tracking scan:', error);
      toast({
        title: "Tracking Error",
        description: "Failed to process tracking record",
        variant: "destructive"
      });
      setBarcodeInput('');
      return true;
    }
  };

  const processAddressFormScan = async (consignmentNumber: string) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/admin/addressforms/consignment/${consignmentNumber}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.data) {
        if (result.data.assignmentData?.status === 'received') {
          setShowAlreadyScannedPopup(true);
          setTimeout(() => {
            setShowAlreadyScannedPopup(false);
          }, 2000);
          setBarcodeInput('');
          return true;
        }

        await markOrderAsReceived(result.data);
        toast({
          title: "Order Received",
          description: `Consignment ${consignmentNumber} marked as received`,
        });
        return true;
      } else {
        toast({
          title: "No order found",
          description: `No order found with consignment number ${consignmentNumber}`
        });
        setBarcodeInput('');
        return true;
      }
    } else if (response.status === 404) {
      return false; // Allow fallback to CustomerBooking
    } else {
      throw new Error('Failed to fetch order');
    }
  };

  const processCustomerBookingScan = async (consignmentNumber: string) => {
    const token = localStorage.getItem('adminToken');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      const bookingResponse = await fetch(`/api/admin/customerbookings/consignment/${consignmentNumber}`, { headers });

      if (bookingResponse.status === 404) {
        return false; // Not found in CustomerBooking
      }

      if (!bookingResponse.ok) {
        throw new Error('Failed to fetch customer booking record');
      }

      const bookingResult = await bookingResponse.json();
      const bookingData: CustomerBookingData = bookingResult.data;

      if (bookingData.currentStatus === 'received') {
        setShowAlreadyScannedPopup(true);
        setTimeout(() => {
          setShowAlreadyScannedPopup(false);
        }, 2000);
        setBarcodeInput('');
        return true;
      }

      if (bookingData.currentStatus !== 'picked') {
        toast({
          title: "Invalid Status",
          description: `Customer booking must be in picked status before receiving (current: ${bookingData.currentStatus || 'unknown'})`,
          variant: "destructive"
        });
        setBarcodeInput('');
        return true;
      }

      const scanResponse = await fetch('/api/admin/customerbookings/scan', {
        method: 'POST',
        headers,
        body: JSON.stringify({ consignmentNumber })
      });

      if (!scanResponse.ok) {
        const errorData = await scanResponse.json().catch(() => null);
        toast({
          title: "Customer Booking Error",
          description: errorData?.error || 'Failed to update customer booking status',
          variant: "destructive"
        });
        setBarcodeInput('');
        return true;
      }

      const scanResult = await scanResponse.json();
      const updatedBooking: CustomerBookingData = scanResult.data;
      const normalizedOrder = convertCustomerBookingToAddressFormData(updatedBooking);

      setScannedOrders(prev => [normalizedOrder, ...prev]);
      setBarcodeInput('');
      fetchReceivedOrders();

      toast({
        title: "Customer Booking Received",
        description: `Consignment ${consignmentNumber} marked as received`,
      });

      return true;
    } catch (error) {
      console.error('Error processing customer booking scan:', error);
      toast({
        title: "Customer Booking Error",
        description: "Failed to process customer booking record",
        variant: "destructive"
      });
      setBarcodeInput('');
      return true;
    }
  };

  // Handle barcode scan and auto-mark as received
  const handleBarcodeScan = async (consignmentNumber: string) => {
    if (!consignmentNumber.trim()) return;

    try {
      setLoading(true);
      const handledByTracking = await processTrackingScan(consignmentNumber);
      if (!handledByTracking) {
        const handledByAddressForm = await processAddressFormScan(consignmentNumber);
        if (!handledByAddressForm) {
          const handledByCustomerBooking = await processCustomerBookingScan(consignmentNumber);
          if (!handledByCustomerBooking) {
            // Not found in any collection
            toast({
              title: "No order found",
              description: `No order found with consignment number ${consignmentNumber} in any collection`,
              variant: "destructive"
            });
            setBarcodeInput('');
          }
        }
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      toast({
        title: "Error",
        description: "Failed to scan order",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle barcode input change
  const handleBarcodeInputChange = (value: string) => {
    setBarcodeInput(value);
    // Auto-trigger scan when barcode is entered (simulating barcode scanner)
    if (value.length >= 6) {
      handleBarcodeScan(value);
    }
  };

  // Mark order as received and add to scanned orders list
  const markOrderAsReceived = async (order: AddressFormData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/mark-order-received', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order._id,
          newWeight: order.shipmentData?.actualWeight
        })
      });

      if (response.ok) {
        const normalizedOrder = { ...order, source: 'addressForm' as OrderSource };
        // Add to scanned orders list
        setScannedOrders(prev => [normalizedOrder, ...prev]);
        setBarcodeInput('');
        // Refresh received orders list
        fetchReceivedOrders();
        
        // Dispatch custom event to notify other components
        const statusChangeEvent = new CustomEvent('orderStatusChanged', {
          detail: {
            orderId: order._id,
            consignmentNumber: order.consignmentNumber,
            newStatus: 'received',
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(statusChangeEvent);
      } else {
        throw new Error('Failed to mark order as received');
      }
    } catch (error) {
      console.error('Error marking order as received:', error);
      toast({
        title: "Error",
        description: "Failed to mark order as received",
        variant: "destructive"
      });
    }
  };

  // Handle weight update for scanned orders
  const handleWeightUpdate = async (order: AddressFormData, newWeight: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (order.source === 'tracking') {
        const trackingIdentifier = order.trackingRecord?.consignmentNumber ?? order.consignmentNumber;
        if (!trackingIdentifier) {
          throw new Error('Missing consignment number for tracking record');
        }
        const response = await fetch('/api/admin/tracking/update-weight', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            consignmentNumber: trackingIdentifier,
            newWeight
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update tracking weight');
        }

        const result = await response.json();
        const updatedOrder = convertTrackingToAddressFormData(result.data);

        setScannedOrders(prev =>
          prev.map(item => (item._id === updatedOrder._id ? updatedOrder : item))
        );
        setReceivedOrders(prev =>
          prev.map(item => (item._id === updatedOrder._id ? updatedOrder : item))
        );
      } else {
        const response = await fetch('/api/admin/mark-order-received', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            orderId: order._id,
            newWeight
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update weight');
        }

        setScannedOrders(prev =>
          prev.map(item =>
            item._id === order._id
              ? { ...item, shipmentData: { ...(item.shipmentData || {}), actualWeight: newWeight } }
              : item
          )
        );
        setReceivedOrders(prev =>
          prev.map(item =>
            item._id === order._id
              ? { ...item, shipmentData: { ...(item.shipmentData || {}), actualWeight: newWeight } }
              : item
          )
        );

        const weightUpdateEvent = new CustomEvent('orderWeightUpdated', {
          detail: {
            orderId: order._id,
            newWeight,
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(weightUpdateEvent);
      }

      setEditingWeight(null);
      setNewWeight('');
      toast({
        title: "Success",
        description: "Weight updated successfully",
      });
    } catch (error) {
      console.error('Error updating weight:', error);
      toast({
        title: "Error",
        description: "Failed to update weight",
        variant: "destructive"
      });
    }
  };

  // Get location string
  const getLocationString = (form: AddressFormData, isOrigin: boolean) => {
    if (isOrigin) {
      if (form.originData) {
        return `${form.originData.city}, ${form.originData.state}`;
      }
      return `${form.senderCity || 'N/A'}, ${form.senderState || 'N/A'}`;
    } else {
      if (form.destinationData) {
        return `${form.destinationData.city}, ${form.destinationData.state}`;
      }
      return `${form.receiverCity || 'N/A'}, ${form.receiverState || 'N/A'}`;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle opening details modal
  const handleOpenDetails = (order: AddressFormData) => {
    setSelectedOrder(order);
    setEditingOrder({
      ...order,
      originData: order.originData ? { ...order.originData } : undefined,
      destinationData: order.destinationData ? { ...order.destinationData } : undefined,
      shipmentData: order.shipmentData ? { ...order.shipmentData } : undefined,
      corporateInfo: order.corporateInfo ? { ...order.corporateInfo } : undefined,
      invoiceData: order.invoiceData ? { ...order.invoiceData } : undefined,
      paymentData: order.paymentData ? { ...order.paymentData } : undefined
    });
    setIsDetailsModalOpen(true);
  };

  // Handle updating order details
  const handleUpdateOrderDetails = async () => {
    if (!editingOrder) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (editingOrder.source === 'tracking') {
        // Update tracking record
        const trackingIdentifier = editingOrder.trackingRecord?.consignmentNumber ?? editingOrder.consignmentNumber;
        const response = await fetch('/api/admin/tracking/update-details', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            consignmentNumber: trackingIdentifier,
            originData: editingOrder.originData,
            destinationData: editingOrder.destinationData,
            shipmentData: editingOrder.shipmentData,
            corporateInfo: editingOrder.corporateInfo,
            invoiceData: editingOrder.invoiceData,
            paymentData: editingOrder.paymentData
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Failed to update tracking details');
        }

        const result = await response.json();
        const updatedOrder = convertTrackingToAddressFormData(result.data);
        
        setScannedOrders(prev =>
          prev.map(item => (item._id === updatedOrder._id ? updatedOrder : item))
        );
        setReceivedOrders(prev =>
          prev.map(item => (item._id === updatedOrder._id ? updatedOrder : item))
        );
      } else if (editingOrder.source === 'customerBooking') {
        // Update customer booking
        const response = await fetch('/api/admin/customerbookings/update-details', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            consignmentNumber: editingOrder.consignmentNumber,
            origin: editingOrder.originData ? {
              name: editingOrder.originData.name,
              mobileNumber: editingOrder.originData.mobileNumber,
              email: editingOrder.originData.email,
              companyName: editingOrder.originData.companyName,
              flatBuilding: editingOrder.originData.flatBuilding,
              locality: editingOrder.originData.locality,
              landmark: editingOrder.originData.landmark,
              pincode: editingOrder.originData.pincode,
              area: editingOrder.originData.area,
              city: editingOrder.originData.city,
              district: editingOrder.originData.district,
              state: editingOrder.originData.state,
              gstNumber: editingOrder.originData.gstNumber,
              alternateNumbers: editingOrder.originData.alternateNumbers,
              addressType: editingOrder.originData.addressType,
              birthday: editingOrder.originData.birthday,
              anniversary: editingOrder.originData.anniversary,
              website: editingOrder.originData.website,
              otherAlternateNumber: editingOrder.originData.otherAlternateNumber
            } : undefined,
            destination: editingOrder.destinationData ? {
              name: editingOrder.destinationData.name,
              mobileNumber: editingOrder.destinationData.mobileNumber,
              email: editingOrder.destinationData.email,
              companyName: editingOrder.destinationData.companyName,
              flatBuilding: editingOrder.destinationData.flatBuilding,
              locality: editingOrder.destinationData.locality,
              landmark: editingOrder.destinationData.landmark,
              pincode: editingOrder.destinationData.pincode,
              area: editingOrder.destinationData.area,
              city: editingOrder.destinationData.city,
              district: editingOrder.destinationData.district,
              state: editingOrder.destinationData.state,
              gstNumber: editingOrder.destinationData.gstNumber,
              alternateNumbers: editingOrder.destinationData.alternateNumbers,
              addressType: editingOrder.destinationData.addressType,
              birthday: editingOrder.destinationData.birthday,
              anniversary: editingOrder.destinationData.anniversary,
              website: editingOrder.destinationData.website,
              otherAlternateNumber: editingOrder.destinationData.otherAlternateNumber
            } : undefined,
            shipment: editingOrder.shipmentData ? {
              natureOfConsignment: editingOrder.shipmentData.natureOfConsignment,
              insurance: editingOrder.shipmentData.insurance,
              riskCoverage: editingOrder.shipmentData.riskCoverage,
              packagesCount: editingOrder.shipmentData.packagesCount || editingOrder.shipmentData.totalPackages,
              materials: editingOrder.shipmentData.materials,
              others: editingOrder.shipmentData.others,
              description: editingOrder.shipmentData.description || editingOrder.shipmentData.contentDescription,
              declaredValue: editingOrder.shipmentData.declaredValue,
              weight: editingOrder.shipmentData.weight || editingOrder.shipmentData.actualWeight?.toString(),
              length: editingOrder.shipmentData.length || editingOrder.shipmentData.dimensions?.[0]?.length,
              width: editingOrder.shipmentData.width || editingOrder.shipmentData.dimensions?.[0]?.breadth,
              height: editingOrder.shipmentData.height || editingOrder.shipmentData.dimensions?.[0]?.height,
              insuranceCompanyName: editingOrder.shipmentData.insuranceCompanyName,
              insurancePolicyNumber: editingOrder.shipmentData.insurancePolicyNumber,
              insurancePolicyDate: editingOrder.shipmentData.insurancePolicyDate,
              insuranceValidUpto: editingOrder.shipmentData.insuranceValidUpto,
              insurancePremiumAmount: editingOrder.shipmentData.insurancePremiumAmount,
              insuranceDocumentName: editingOrder.shipmentData.insuranceDocumentName,
              insuranceDocument: editingOrder.shipmentData.insuranceDocument,
              declarationDocumentName: editingOrder.shipmentData.declarationDocumentName,
              declarationDocument: editingOrder.shipmentData.declarationDocument
            } : undefined,
            actualWeight: editingOrder.shipmentData?.actualWeight || (editingOrder.shipmentData?.weight ? parseFloat(editingOrder.shipmentData.weight) : undefined),
            volumetricWeight: editingOrder.shipmentData?.volumetricWeight,
            chargeableWeight: editingOrder.shipmentData?.chargeableWeight,
            packageImages: editingOrder.shipmentData?.packageImages
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Failed to update customer booking details');
        }

        const result = await response.json();
        const updatedOrder = convertCustomerBookingToAddressFormData(result.data);
        
        setScannedOrders(prev =>
          prev.map(item => (item._id === updatedOrder._id ? updatedOrder : item))
        );
        setReceivedOrders(prev =>
          prev.map(item => (item._id === updatedOrder._id ? updatedOrder : item))
        );
      } else {
        // Update address form
        const response = await fetch('/api/admin/addressforms/update-details', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            orderId: editingOrder._id,
            originData: editingOrder.originData,
            destinationData: editingOrder.destinationData,
            shipmentData: editingOrder.shipmentData
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Failed to update address form details');
        }

        const result = await response.json();
        const updatedOrder = { ...result.data, source: 'addressForm' as OrderSource };
        
        setScannedOrders(prev =>
          prev.map(item => (item._id === updatedOrder._id ? updatedOrder : item))
        );
        setReceivedOrders(prev =>
          prev.map(item => (item._id === updatedOrder._id ? updatedOrder : item))
        );
      }

      setSelectedOrder(editingOrder);
      setIsDetailsModalOpen(false);
      toast({
        title: "Success",
        description: "Consignment details updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating order details:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update consignment details",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'receivedList') {
      fetchReceivedOrders();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Received Consignments</h1>
                <p className="text-sm text-gray-600">Manage received consignments and barcode scanning</p>
              </div>
            </div>
            <Button
              onClick={() => {
                if (activeTab === 'receivedList') {
                  fetchReceivedOrders();
                }
              }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('newReceived')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${
                activeTab === 'newReceived'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Scan className="h-4 w-4" />
              <span className="font-medium">New Received</span>
            </button>
            <button
              onClick={() => setActiveTab('receivedList')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${
                activeTab === 'receivedList'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="font-medium">Received List</span>
            </button>
          </div>
        </div>


        {/* New Received Tab */}
        {activeTab === 'newReceived' && (
          <div className="space-y-4">
            {/* Barcode Scanner Input */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-start">
                <div className="w-80">
                  <Input
                    type="text"
                    placeholder="Scan barcode or enter consignment number"
                    value={barcodeInput}
                    onChange={(e) => handleBarcodeInputChange(e.target.value)}
                    className="text-center text-lg border-2 border-blue-300 focus:border-blue-500 h-10"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Already Scanned Order Popup */}
            {showAlreadyScannedPopup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm mx-4">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                      <Package className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Already Scanned Order</h3>
                    <p className="text-gray-600">This order has already been received</p>
                  </div>
                </div>
              </div>
            )}

            {/* Scanned Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Recently Scanned Orders ({scannedOrders.length})</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                {scannedOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Scanned Orders</h3>
                    <p className="text-gray-600">Start scanning consignments to see them here.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="font-medium text-gray-700 py-3 px-4">Consignment</TableHead>
                        <TableHead className="font-medium text-gray-700 py-3 px-4">Route</TableHead>
                        <TableHead className="font-medium text-gray-700 py-3 px-4">Weight</TableHead>
                        <TableHead className="font-medium text-gray-700 py-3 px-4">Status</TableHead>
                        <TableHead className="font-medium text-gray-700 py-3 px-4">Received At</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scannedOrders.map((order) => (
                        <TableRow key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-blue-500" />
                              <button
                                onClick={() => handleOpenDetails(order)}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                {order.consignmentNumber}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-700">
                                {getLocationString(order, true)} → {getLocationString(order, false)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {editingWeight === order._id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={newWeight}
                                  onChange={(e) => setNewWeight(e.target.value)}
                                  className="w-20 h-8 text-sm"
                                  step="0.1"
                                  autoFocus
                                />
                                <span className="text-xs text-gray-500">kg</span>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (newWeight) {
                                      handleWeightUpdate(order, parseFloat(newWeight));
                                    }
                                  }}
                                  className="h-7 w-7 p-0 hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                                  title="Save"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setEditingWeight(null);
                                    setNewWeight('');
                                  }}
                                  variant="outline"
                                  className="h-7 w-7 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                                  title="Cancel"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Weight className="h-4 w-4 text-orange-500" />
                                <span className="text-sm">{order.shipmentData?.actualWeight || 'N/A'} kg</span>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setEditingWeight(order._id);
                                    setNewWeight(order.shipmentData?.actualWeight?.toString() || '');
                                  }}
                                  variant="outline"
                                  className="h-7 w-7 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                                  title="Edit Weight"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                              Received
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="text-sm text-gray-600">
                              {formatDate(order.createdAt)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Received List Tab */}
        {activeTab === 'receivedList' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Received Consignments ({receivedOrders.length})</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading received consignments...</span>
                  </div>
                </div>
              ) : receivedOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-6 w-6 text-gray-400" />
                    <span className="text-gray-500">No received consignments found</span>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Consignment</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Route</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Weight</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Status</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Received At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivedOrders.map((order) => (
                      <TableRow key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <button
                              onClick={() => handleOpenDetails(order)}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              {order.consignmentNumber}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-700">
                              {getLocationString(order, true)} → {getLocationString(order, false)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Weight className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">{order.shipmentData?.actualWeight || 'N/A'} kg</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                            Received
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}

        {/* Consignment Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-4">
            <DialogHeader className="pb-2">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-blue-600" />
                Consignment {editingOrder?.consignmentNumber}
              </DialogTitle>
            </DialogHeader>

            {editingOrder && (
              <div className="space-y-3 py-2">
                {/* Origin Details */}
                <Card className="border">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-sm flex items-center gap-1.5 font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-green-600" />
                      Origin
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Mobile Number</label>
                        <Input
                          value={editingOrder.originData?.mobileNumber || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Name</label>
                        <Input
                          value={editingOrder.originData?.name || editingOrder.senderName || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), name: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Email</label>
                        <Input
                          type="email"
                          value={editingOrder.originData?.email || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), email: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Company Name</label>
                        <Input
                          value={editingOrder.originData?.companyName || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), companyName: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">City</label>
                        <Input
                          value={editingOrder.originData?.city || editingOrder.senderCity || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), city: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">State</label>
                        <Input
                          value={editingOrder.originData?.state || editingOrder.senderState || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), state: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Pincode</label>
                        <Input
                          value={editingOrder.originData?.pincode || editingOrder.senderPincode || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), pincode: e.target.value.replace(/\D/g, '').slice(0, 6) } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                          maxLength={6}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Flat/Building</label>
                        <Input
                          value={editingOrder.originData?.flatBuilding || editingOrder.senderAddressLine1 || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), flatBuilding: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Locality</label>
                        <Input
                          value={editingOrder.originData?.locality || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), locality: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Landmark</label>
                        <Input
                          value={editingOrder.originData?.landmark || editingOrder.senderLandmark || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), landmark: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Area</label>
                        <Input
                          value={editingOrder.originData?.area || editingOrder.senderArea || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), area: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">District</label>
                        <Input
                          value={editingOrder.originData?.district || editingOrder.senderDistrict || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), district: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">GST Number</label>
                        <Input
                          value={editingOrder.originData?.gstNumber || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), gstNumber: e.target.value.toUpperCase() } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                          maxLength={15}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Address Type</label>
                        <Select
                          value={editingOrder.originData?.addressType || ''}
                          onValueChange={(value) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), addressType: value } as AddressFormData['originData']
                          })}
                        >
                          <SelectTrigger className="mt-0.5 h-8 text-xs">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Office">Office</SelectItem>
                            <SelectItem value="Corporate">Corporate</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Website</label>
                        <Input
                          type="url"
                          value={editingOrder.originData?.website || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), website: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Birthday</label>
                        <Input
                          type="date"
                          value={editingOrder.originData?.birthday || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), birthday: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Anniversary</label>
                        <Input
                          type="date"
                          value={editingOrder.originData?.anniversary || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            originData: { ...(editingOrder.originData || {}), anniversary: e.target.value } as AddressFormData['originData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      {editingOrder.originData?.alternateNumbers && editingOrder.originData.alternateNumbers.length > 0 && (
                        <div className="col-span-3">
                          <label className="text-xs font-medium text-gray-600">Alternate Numbers</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {editingOrder.originData.alternateNumbers.map((num, idx) => (
                              <Input
                                key={idx}
                                value={num}
                                onChange={(e) => {
                                  const newNums = [...(editingOrder.originData?.alternateNumbers || [])];
                                  newNums[idx] = e.target.value.replace(/\D/g, '').slice(0, 10);
                                  setEditingOrder({
                                    ...editingOrder,
                                    originData: { ...(editingOrder.originData || {}), alternateNumbers: newNums } as AddressFormData['originData']
                                  });
                                }}
                                className="h-8 text-xs w-32"
                                maxLength={10}
                                placeholder="Alt number"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Destination Details */}
                <Card className="border">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-sm flex items-center gap-1.5 font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-red-600" />
                      Destination
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Mobile Number</label>
                        <Input
                          value={editingOrder.destinationData?.mobileNumber || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Name</label>
                        <Input
                          value={editingOrder.destinationData?.name || editingOrder.receiverName || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), name: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Email</label>
                        <Input
                          type="email"
                          value={editingOrder.destinationData?.email || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), email: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Company Name</label>
                        <Input
                          value={editingOrder.destinationData?.companyName || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), companyName: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">City</label>
                        <Input
                          value={editingOrder.destinationData?.city || editingOrder.receiverCity || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), city: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">State</label>
                        <Input
                          value={editingOrder.destinationData?.state || editingOrder.receiverState || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), state: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Pincode</label>
                        <Input
                          value={editingOrder.destinationData?.pincode || editingOrder.receiverPincode || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), pincode: e.target.value.replace(/\D/g, '').slice(0, 6) } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                          maxLength={6}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Flat/Building</label>
                        <Input
                          value={editingOrder.destinationData?.flatBuilding || editingOrder.receiverAddressLine1 || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), flatBuilding: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Locality</label>
                        <Input
                          value={editingOrder.destinationData?.locality || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), locality: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Landmark</label>
                        <Input
                          value={editingOrder.destinationData?.landmark || editingOrder.receiverLandmark || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), landmark: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Area</label>
                        <Input
                          value={editingOrder.destinationData?.area || editingOrder.receiverArea || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), area: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">District</label>
                        <Input
                          value={editingOrder.destinationData?.district || editingOrder.receiverDistrict || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), district: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">GST Number</label>
                        <Input
                          value={editingOrder.destinationData?.gstNumber || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), gstNumber: e.target.value.toUpperCase() } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                          maxLength={15}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Address Type</label>
                        <Select
                          value={editingOrder.destinationData?.addressType || ''}
                          onValueChange={(value) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), addressType: value } as AddressFormData['destinationData']
                          })}
                        >
                          <SelectTrigger className="mt-0.5 h-8 text-xs">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Office">Office</SelectItem>
                            <SelectItem value="Corporate">Corporate</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Website</label>
                        <Input
                          type="url"
                          value={editingOrder.destinationData?.website || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), website: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Birthday</label>
                        <Input
                          type="date"
                          value={editingOrder.destinationData?.birthday || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), birthday: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Anniversary</label>
                        <Input
                          type="date"
                          value={editingOrder.destinationData?.anniversary || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            destinationData: { ...(editingOrder.destinationData || {}), anniversary: e.target.value } as AddressFormData['destinationData']
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      {editingOrder.destinationData?.alternateNumbers && editingOrder.destinationData.alternateNumbers.length > 0 && (
                        <div className="col-span-3">
                          <label className="text-xs font-medium text-gray-600">Alternate Numbers</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {editingOrder.destinationData.alternateNumbers.map((num, idx) => (
                              <Input
                                key={idx}
                                value={num}
                                onChange={(e) => {
                                  const newNums = [...(editingOrder.destinationData?.alternateNumbers || [])];
                                  newNums[idx] = e.target.value.replace(/\D/g, '').slice(0, 10);
                                  setEditingOrder({
                                    ...editingOrder,
                                    destinationData: { ...(editingOrder.destinationData || {}), alternateNumbers: newNums } as AddressFormData['destinationData']
                                  });
                                }}
                                className="h-8 text-xs w-32"
                                maxLength={10}
                                placeholder="Alt number"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Shipment Details */}
                <Card className="border">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-sm flex items-center gap-1.5 font-semibold">
                      <Weight className="h-3.5 w-3.5 text-orange-600" />
                      Shipment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Nature of Consignment</label>
                        <Select
                          value={editingOrder.shipmentData?.natureOfConsignment || ''}
                          onValueChange={(value) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), natureOfConsignment: value }
                          })}
                        >
                          <SelectTrigger className="mt-0.5 h-8 text-xs">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DOX">DOX</SelectItem>
                            <SelectItem value="NON-DOX">NON-DOX</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Services</label>
                        <Select
                          value={editingOrder.shipmentData?.services || ''}
                          onValueChange={(value) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), services: value }
                          })}
                        >
                          <SelectTrigger className="mt-0.5 h-8 text-xs">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Standard">Standard</SelectItem>
                            <SelectItem value="Priority">Priority</SelectItem>
                            <SelectItem value="Express">Express</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Mode</label>
                        <Select
                          value={editingOrder.shipmentData?.mode || ''}
                          onValueChange={(value) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), mode: value }
                          })}
                        >
                          <SelectTrigger className="mt-0.5 h-8 text-xs">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Road">Road</SelectItem>
                            <SelectItem value="Air">Air</SelectItem>
                            <SelectItem value="Rail">Rail</SelectItem>
                            <SelectItem value="Sea">Sea</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Insurance</label>
                        <Select
                          value={editingOrder.shipmentData?.insurance || ''}
                          onValueChange={(value) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), insurance: value }
                          })}
                        >
                          <SelectTrigger className="mt-0.5 h-8 text-xs">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="With insurance">With insurance</SelectItem>
                            <SelectItem value="Without insurance">Without insurance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Risk Coverage</label>
                        <Select
                          value={editingOrder.shipmentData?.riskCoverage || ''}
                          onValueChange={(value) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), riskCoverage: value }
                          })}
                        >
                          <SelectTrigger className="mt-0.5 h-8 text-xs">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Owner">Owner</SelectItem>
                            <SelectItem value="Carrier">Carrier</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Package Type</label>
                        <Input
                          value={editingOrder.shipmentData?.packageType || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), packageType: e.target.value }
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Packages Count</label>
                        <Input
                          value={editingOrder.shipmentData?.packagesCount || editingOrder.shipmentData?.totalPackages || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), packagesCount: e.target.value, totalPackages: e.target.value }
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Materials</label>
                        <Input
                          value={editingOrder.shipmentData?.materials || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), materials: e.target.value }
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Declared Value</label>
                        <Input
                          type="number"
                          value={editingOrder.shipmentData?.declaredValue || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), declaredValue: e.target.value }
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Actual Weight (kg)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={editingOrder.shipmentData?.actualWeight || editingOrder.shipmentData?.weight || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: {
                              ...(editingOrder.shipmentData || {}),
                              actualWeight: e.target.value ? (typeof e.target.value === 'string' ? parseFloat(e.target.value) : e.target.value) : undefined,
                              weight: e.target.value
                            }
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Volumetric Weight</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editingOrder.shipmentData?.volumetricWeight || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), volumetricWeight: e.target.value ? parseFloat(e.target.value) : undefined }
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Chargeable Weight</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editingOrder.shipmentData?.chargeableWeight || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), chargeableWeight: e.target.value ? parseFloat(e.target.value) : undefined }
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Length (cm)</label>
                        <Input
                          type="number"
                          value={editingOrder.shipmentData?.length || editingOrder.shipmentData?.dimensions?.[0]?.length || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: {
                              ...(editingOrder.shipmentData || {}),
                              length: e.target.value,
                              dimensions: editingOrder.shipmentData?.dimensions ? [{
                                ...editingOrder.shipmentData.dimensions[0],
                                length: e.target.value
                              }] : [{ length: e.target.value, breadth: '', height: '', unit: 'cm' }]
                            }
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Width (cm)</label>
                        <Input
                          type="number"
                          value={editingOrder.shipmentData?.width || editingOrder.shipmentData?.dimensions?.[0]?.breadth || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: {
                              ...(editingOrder.shipmentData || {}),
                              width: e.target.value,
                              dimensions: editingOrder.shipmentData?.dimensions ? [{
                                ...editingOrder.shipmentData.dimensions[0],
                                breadth: e.target.value
                              }] : [{ length: '', breadth: e.target.value, height: '', unit: 'cm' }]
                            }
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Height (cm)</label>
                        <Input
                          type="number"
                          value={editingOrder.shipmentData?.height || editingOrder.shipmentData?.dimensions?.[0]?.height || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: {
                              ...(editingOrder.shipmentData || {}),
                              height: e.target.value,
                              dimensions: editingOrder.shipmentData?.dimensions ? [{
                                ...editingOrder.shipmentData.dimensions[0],
                                height: e.target.value
                              }] : [{ length: '', breadth: '', height: e.target.value, unit: 'cm' }]
                            }
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-xs font-medium text-gray-600">Content Description</label>
                        <Input
                          value={editingOrder.shipmentData?.contentDescription || editingOrder.shipmentData?.description || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), contentDescription: e.target.value, description: e.target.value }
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-xs font-medium text-gray-600">Special Instructions</label>
                        <Input
                          value={editingOrder.shipmentData?.specialInstructions || ''}
                          onChange={(e) => setEditingOrder({
                            ...editingOrder,
                            shipmentData: { ...(editingOrder.shipmentData || {}), specialInstructions: e.target.value }
                          })}
                          className="mt-0.5 h-8 text-xs"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Package Images */}
                {(editingOrder.shipmentData?.packageImages && editingOrder.shipmentData.packageImages.length > 0) && (
                  <Card className="border">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-sm flex items-center gap-1.5 font-semibold">
                        <ImageIcon className="h-3.5 w-3.5 text-purple-600" />
                        Package Images
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="grid grid-cols-3 gap-2">
                        {editingOrder.shipmentData.packageImages.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={typeof img === 'string' ? img : img.url || img}
                              alt={`Package ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Corporate Info (for trackings) */}
                {editingOrder.corporateInfo && (
                  <Card className="border">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-sm flex items-center gap-1.5 font-semibold">
                        <Building className="h-3.5 w-3.5 text-blue-600" />
                        Corporate Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs font-medium text-gray-600">Corporate ID</label>
                          <Input
                            value={editingOrder.corporateInfo.corporateId || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              corporateInfo: { ...(editingOrder.corporateInfo || {}), corporateId: e.target.value }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Company Name</label>
                          <Input
                            value={editingOrder.corporateInfo.companyName || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              corporateInfo: { ...(editingOrder.corporateInfo || {}), companyName: e.target.value }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Email</label>
                          <Input
                            type="email"
                            value={editingOrder.corporateInfo.email || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              corporateInfo: { ...(editingOrder.corporateInfo || {}), email: e.target.value }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Contact Number</label>
                          <Input
                            value={editingOrder.corporateInfo.contactNumber || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              corporateInfo: { ...(editingOrder.corporateInfo || {}), contactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }
                            })}
                            className="mt-0.5 h-8 text-xs"
                            maxLength={10}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Invoice Data (for trackings) */}
                {editingOrder.invoiceData && (
                  <Card className="border">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-sm flex items-center gap-1.5 font-semibold">
                        <FileText className="h-3.5 w-3.5 text-green-600" />
                        Invoice Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs font-medium text-gray-600">Payment Method</label>
                          <Input
                            value={editingOrder.invoiceData.paymentMethod || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              invoiceData: { ...(editingOrder.invoiceData || {}), paymentMethod: e.target.value }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Calculated Price</label>
                          <Input
                            type="number"
                            value={editingOrder.invoiceData.calculatedPrice || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              invoiceData: { ...(editingOrder.invoiceData || {}), calculatedPrice: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">GST</label>
                          <Input
                            type="number"
                            value={editingOrder.invoiceData.gst || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              invoiceData: { ...(editingOrder.invoiceData || {}), gst: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Final Price</label>
                          <Input
                            type="number"
                            value={editingOrder.invoiceData.finalPrice || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              invoiceData: { ...(editingOrder.invoiceData || {}), finalPrice: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Service Type</label>
                          <Input
                            value={editingOrder.invoiceData.serviceType || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              invoiceData: { ...(editingOrder.invoiceData || {}), serviceType: e.target.value }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Location</label>
                          <Input
                            value={editingOrder.invoiceData.location || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              invoiceData: { ...(editingOrder.invoiceData || {}), location: e.target.value }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Transport Mode</label>
                          <Input
                            value={editingOrder.invoiceData.transportMode || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              invoiceData: { ...(editingOrder.invoiceData || {}), transportMode: e.target.value }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Chargeable Weight</label>
                          <Input
                            type="number"
                            value={editingOrder.invoiceData.chargeableWeight || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              invoiceData: { ...(editingOrder.invoiceData || {}), chargeableWeight: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="text-xs font-medium text-gray-600">Billing Address</label>
                          <Input
                            value={editingOrder.invoiceData.billingAddress || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              invoiceData: { ...(editingOrder.invoiceData || {}), billingAddress: e.target.value }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="text-xs font-medium text-gray-600">Terms</label>
                          <Input
                            value={editingOrder.invoiceData.terms || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              invoiceData: { ...(editingOrder.invoiceData || {}), terms: e.target.value }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Data (for trackings) */}
                {editingOrder.paymentData && (
                  <Card className="border">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-sm flex items-center gap-1.5 font-semibold">
                        <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                        Payment Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs font-medium text-gray-600">Payment Type</label>
                          <Select
                            value={editingOrder.paymentData.paymentType || ''}
                            onValueChange={(value) => setEditingOrder({
                              ...editingOrder,
                              paymentData: { ...(editingOrder.paymentData || {}), paymentType: value }
                            })}
                          >
                            <SelectTrigger className="mt-0.5 h-8 text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TP">To Pay</SelectItem>
                              <SelectItem value="FP">Fully Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Mode of Payment</label>
                          <Select
                            value={editingOrder.paymentData.modeOfPayment || ''}
                            onValueChange={(value) => setEditingOrder({
                              ...editingOrder,
                              paymentData: { ...(editingOrder.paymentData || {}), modeOfPayment: value }
                            })}
                          >
                            <SelectTrigger className="mt-0.5 h-8 text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="To Pay">To Pay</SelectItem>
                              <SelectItem value="Corporate Credit">Corporate Credit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Amount</label>
                          <Input
                            type="number"
                            value={editingOrder.paymentData.amount || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              paymentData: { ...(editingOrder.paymentData || {}), amount: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Status</label>
                          <Input
                            value={editingOrder.paymentData.currentStatus || ''}
                            onChange={(e) => setEditingOrder({
                              ...editingOrder,
                              paymentData: { ...(editingOrder.paymentData || {}), currentStatus: e.target.value }
                            })}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Info */}
                <div className="flex items-center gap-4 text-xs px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-600">Source:</span>
                    <Badge variant="outline" className="text-xs py-0 px-1.5">{editingOrder.source || 'N/A'}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-600">Status:</span>
                    <Badge className="bg-green-100 text-green-800 text-xs py-0 px-1.5">Received</Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-600">At:</span>
                    <span className="text-gray-600">{formatDate(editingOrder.createdAt)}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2 pb-0">
              <Button
                variant="outline"
                onClick={() => setIsDetailsModalOpen(false)}
                disabled={saving}
                size="sm"
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateOrderDetails}
                disabled={saving}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1.5" />
                    Save
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ReceivedConsignment;
