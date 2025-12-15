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
  List
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
import { useToast } from '@/hooks/use-toast';

type OrderSource = 'addressForm' | 'tracking' | 'customerBooking';

interface TrackingAddressData {
  name?: string;
  city?: string;
  state?: string;
  pincode?: string;
  flatBuilding?: string;
  locality?: string;
  landmark?: string;
  area?: string;
  district?: string;
}

interface TrackingShipmentData {
  actualWeight?: number;
  totalPackages?: string;
  natureOfConsignment?: string;
}

interface TrackingBookingData {
  originData?: TrackingAddressData;
  destinationData?: TrackingAddressData;
  shipmentData?: TrackingShipmentData;
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
    city: string;
    state: string;
    pincode: string;
    flatBuilding?: string;
    locality?: string;
    landmark?: string;
    area?: string;
    district?: string;
  };
  destination: {
    name: string;
    city: string;
    state: string;
    pincode: string;
    flatBuilding?: string;
    locality?: string;
    landmark?: string;
    area?: string;
    district?: string;
  };
  shipment?: {
    weight?: string;
    packagesCount?: string;
    natureOfConsignment?: string;
  };
  actualWeight?: number;
  ReceivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AddressFormData {
  _id: string;
  consignmentNumber?: number | string;
  originData?: {
    name: string;
    city: string;
    state: string;
    pincode: string;
    flatBuilding?: string;
    locality?: string;
    landmark?: string;
    area?: string;
    district?: string;
  };
  destinationData?: {
    name: string;
    city: string;
    state: string;
    pincode: string;
    flatBuilding?: string;
    locality?: string;
    landmark?: string;
    area?: string;
    district?: string;
  };
  shipmentData?: {
    actualWeight?: number;
    totalPackages?: string;
    natureOfConsignment?: string;
  };
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
    originData: bookingData?.originData as AddressFormData['originData'],
    destinationData: bookingData?.destinationData as AddressFormData['destinationData'],
    shipmentData: bookingData?.shipmentData
      ? {
          actualWeight: bookingData.shipmentData.actualWeight,
          totalPackages: bookingData.shipmentData.totalPackages,
          natureOfConsignment: bookingData.shipmentData.natureOfConsignment
        }
      : undefined,
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
    originData: {
      name: booking.origin.name,
      city: booking.origin.city,
      state: booking.origin.state,
      pincode: booking.origin.pincode,
      flatBuilding: booking.origin.flatBuilding,
      locality: booking.origin.locality,
      landmark: booking.origin.landmark,
      area: booking.origin.area,
      district: booking.origin.district
    },
    destinationData: {
      name: booking.destination.name,
      city: booking.destination.city,
      state: booking.destination.state,
      pincode: booking.destination.pincode,
      flatBuilding: booking.destination.flatBuilding,
      locality: booking.destination.locality,
      landmark: booking.destination.landmark,
      area: booking.destination.area,
      district: booking.destination.district
    },
    shipmentData: {
      actualWeight: booking.actualWeight || (booking.shipment?.weight ? Number(booking.shipment.weight) : undefined),
      totalPackages: booking.shipment?.packagesCount,
      natureOfConsignment: booking.shipment?.natureOfConsignment
    },
    formCompleted: true,
    createdAt: booking.ReceivedAt || booking.updatedAt || booking.createdAt,
    assignmentData: {
      status: booking.currentStatus === 'received' ? 'received' : undefined
    },
    source: 'customerBooking'
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
                              <span className="font-medium text-blue-600">{order.consignmentNumber}</span>
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
                            <span className="font-medium text-blue-600">{order.consignmentNumber}</span>
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
      </div>
    </div>
  );
};

export default ReceivedConsignment;
