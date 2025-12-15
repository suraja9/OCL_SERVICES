import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  RefreshCw, 
  MapPin,
  Weight,
  Scan,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getStoredToken } from '@/utils/auth';

interface MedicineBooking {
  _id: string;
  bookingReference: string;
  consignmentNumber?: number;
  status: 'pending' | 'confirmed' | 'in_transit' | 'arrived' | 'delivered' | 'cancelled';
  origin: {
    name: string;
    city: string;
    state: string;
    pincode: string;
  };
  destination: {
    name: string;
    city: string;
    state: string;
    pincode: string;
  };
  shipment: {
    actualWeight: string;
    natureOfConsignment: string;
  };
  package: {
    totalPackages: string;
  };
  createdAt: string;
}

const ArrivedMedicine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'newArrived' | 'arrivedList'>('newArrived');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedOrders, setScannedOrders] = useState<MedicineBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [arrivedOrders, setArrivedOrders] = useState<MedicineBooking[]>([]);
  const [showAlreadyScannedPopup, setShowAlreadyScannedPopup] = useState(false);
  const { toast } = useToast();

  // Fetch arrived medicine bookings
  const fetchArrivedOrders = async () => {
    try {
      setLoading(true);
      const token = getStoredToken();
      const response = await fetch('/api/admin/medicine/bookings?status=arrived', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setArrivedOrders(result.bookings || []);
      } else {
        throw new Error('Failed to fetch arrived medicine bookings');
      }
    } catch (error) {
      console.error('Error fetching arrived medicine bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load arrived medicine bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle barcode scan and auto-mark as arrived
  const handleBarcodeScan = async (consignmentNumber: string) => {
    if (!consignmentNumber.trim()) return;

    try {
      setLoading(true);
      const token = getStoredToken();
      
      // Fetch all in_transit medicine bookings
      const response = await fetch('/api/admin/medicine/bookings?status=in_transit', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const bookings = result.bookings || [];
        
        // Find booking with matching consignment number
        const booking = bookings.find((b: MedicineBooking) => 
          b.consignmentNumber?.toString() === consignmentNumber.trim()
        );

        if (booking) {
          // Check if order is already arrived
          if (booking.status === 'arrived' || booking.status === 'delivered') {
            // Show "Already Scanned Order" popup for 2 seconds
            setShowAlreadyScannedPopup(true);
            setTimeout(() => {
              setShowAlreadyScannedPopup(false);
            }, 2000);
            
            // Clear the input
            setBarcodeInput('');
            return;
          }

          // Automatically mark as arrived
          await markOrderAsArrived(booking);
          toast({
            title: "Order Arrived",
            description: `Medicine booking ${consignmentNumber} marked as arrived`,
          });
        } else {
          toast({
            title: "No order found",
            description: `No medicine booking found with consignment number ${consignmentNumber} or it's not in transit`
          });
          setBarcodeInput('');
        }
      } else {
        throw new Error('Failed to fetch medicine bookings');
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

  // Mark order as arrived and add to scanned orders list
  const markOrderAsArrived = async (booking: MedicineBooking) => {
    try {
      const token = getStoredToken();
      const response = await fetch(`/api/admin/medicine/bookings/${booking._id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'arrived'
        })
      });

      if (response.ok) {
        // Add to scanned orders list
        setScannedOrders(prev => [booking, ...prev]);
        setBarcodeInput('');
        // Refresh arrived orders list
        fetchArrivedOrders();
        
        // Dispatch custom event to notify other components
        const statusChangeEvent = new CustomEvent('medicineBookingStatusChanged', {
          detail: {
            bookingId: booking._id,
            consignmentNumber: booking.consignmentNumber,
            newStatus: 'arrived',
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(statusChangeEvent);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark order as arrived');
      }
    } catch (error: any) {
      console.error('Error marking order as arrived:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark order as arrived",
        variant: "destructive"
      });
    }
  };

  // Get location string
  const getLocationString = (booking: MedicineBooking, isOrigin: boolean) => {
    if (isOrigin) {
      return `${booking.origin.city}, ${booking.origin.state}`;
    } else {
      return `${booking.destination.city}, ${booking.destination.state}`;
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
    if (activeTab === 'arrivedList') {
      fetchArrivedOrders();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-gray-100 shadow-sm">
        <CardHeader className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-50">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold" style={{ fontFamily: 'Calibr', fontSize: '32px' }}>
                Arrived Medicine
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Calibri' }}>
                Manage arrived medicine bookings and barcode scanning
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('newArrived')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${
                activeTab === 'newArrived'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Scan className="h-4 w-4" />
              <span className="font-medium">New Arrived</span>
            </button>
            <button
              onClick={() => setActiveTab('arrivedList')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${
                activeTab === 'arrivedList'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="font-medium">Arrived List</span>
            </button>
          </div>

          {/* New Arrived Tab */}
          {activeTab === 'newArrived' && (
            <div className="space-y-4">
              {/* Minimal Barcode Scanner Input - Top Left */}
              <div className="flex justify-start">
                <div className="w-80">
                  <Input
                    type="text"
                    placeholder="Scan barcode or enter consignment number"
                    value={barcodeInput}
                    onChange={(e) => handleBarcodeInputChange(e.target.value)}
                    className="text-center text-lg border-2 border-green-300 focus:border-green-500"
                    autoFocus
                  />
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
                      <p className="text-gray-600">This medicine booking has already been arrived</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scanned Orders List - One-liner format */}
              {scannedOrders.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Recently Scanned Orders</h3>
                  {scannedOrders.map((booking) => (
                    <div key={booking._id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-green-600">{booking.consignmentNumber || booking.bookingReference}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-700">
                              {getLocationString(booking, true)} → {getLocationString(booking, false)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Weight className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">{booking.shipment.actualWeight || 'N/A'} kg</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                            Arrived
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(booking.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Arrived List Tab */}
          {activeTab === 'arrivedList' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Arrived Medicine Bookings ({arrivedOrders.length})</h3>
                <Button
                  onClick={fetchArrivedOrders}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Loading arrived medicine bookings...</p>
                </div>
              ) : arrivedOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Arrived Medicine Bookings</h3>
                  <p className="text-gray-600">No medicine bookings have been marked as arrived yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {arrivedOrders.map((booking) => (
                    <Card key={booking._id} className="border-green-200 bg-green-50/30">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="font-medium">{booking.consignmentNumber || booking.bookingReference}</p>
                              <p className="text-xs text-gray-500">Consignment</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-sm">
                                {getLocationString(booking, true)} → {getLocationString(booking, false)}
                              </p>
                              <p className="text-xs text-gray-500">Route</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Weight className="h-4 w-4 text-orange-500" />
                            <div>
                              <p className="text-sm">{booking.shipment.actualWeight || 'N/A'} kg</p>
                              <p className="text-xs text-gray-500">Weight</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Arrived
                            </Badge>
                            <div>
                              <p className="text-xs text-gray-500">
                                {formatDate(booking.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArrivedMedicine;

