import React, { useState, useEffect } from 'react';
import MedicineSidebar from '@/components/medicine/MedicineSidebar';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Search, 
  RefreshCw, 
  Loader2,
  Scan,
  CheckCircle,
  AlertCircle,
  User,
  PackageX
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface MedicineBooking {
  _id: string;
  bookingReference: string;
  consignmentNumber?: number;
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled' | 'Booked' | 'Arrived at Hub';
  origin: {
    name: string;
    mobileNumber: string;
    email: string;
    city: string;
    state: string;
  };
  destination: {
    name: string;
    mobileNumber: string;
    email: string;
    city: string;
    state: string;
  };
  shipment?: {
    chargeableWeight?: number;
    actualWeight?: string;
  };
  package?: {
    totalPackages?: string;
  };
  invoice?: {
    invoiceNumber?: string;
  };
  createdAt: string;
  arrivedAtHubScanAt?: string;
}

const MedicineReceivedScan: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [receivedData, setReceivedData] = useState<MedicineBooking[]>([]);
  const [showAlreadyReceivedPopup, setShowAlreadyReceivedPopup] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('medicineToken');
    const info = localStorage.getItem('medicineInfo');
    if (!token || !info) {
      navigate('/medicine');
      return;
    }
    try {
      setUser(JSON.parse(info));
    } catch {
      navigate('/medicine');
      return;
    }
    
    // Load received data from localStorage
    loadReceivedData();
  }, [navigate]);

  // Load received data from localStorage
  const loadReceivedData = () => {
    const storedReceived = localStorage.getItem('medicineReceived');
    if (storedReceived) {
      try {
        setReceivedData(JSON.parse(storedReceived));
      } catch (error) {
        console.error('Error parsing received data:', error);
        setReceivedData([]);
      }
    }
  };

  // Handle barcode scan and directly add to received
  const handleBarcodeScan = async (consignmentNumber: string) => {
    if (!consignmentNumber.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('medicineToken');
      const response = await fetch(`/api/medicine/bookings/consignment/${consignmentNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          // Check if booking is already received
          if (result.data.status === 'delivered' || result.data.status === 'Arrived at Hub') {
            // Show "Already Received" popup for 2 seconds
            setShowAlreadyReceivedPopup(true);
            setTimeout(() => {
              setShowAlreadyReceivedPopup(false);
            }, 2000);
            
            // Clear the input
            setBarcodeInput('');
            return;
          }

          // Check if booking is in "Booked" status
          if (result.data.status !== 'Booked') {
            toast({
              title: "Invalid Status",
              description: `Consignment ${consignmentNumber} is not in Booked status`,
              variant: "destructive"
            });
            setBarcodeInput('');
            return;
          }
          
          // Check if consignment already exists in received
          const existsInReceived = receivedData.some(booking => booking.consignmentNumber === result.data.consignmentNumber);
          if (existsInReceived) {
            toast({
              title: "Already in Received",
              description: `Consignment ${consignmentNumber} is already marked as received`,
              variant: "destructive"
            });
            setBarcodeInput('');
            return;
          }
          
          // Update booking status to "Arrived at Hub"
          const updateResponse = await fetch(`/api/medicine/bookings/${result.data._id}/status`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'Arrived at Hub' })
          });

          if (!updateResponse.ok) {
            throw new Error('Failed to update booking status');
          }

          // Get the updated booking data with scan timestamp
          const updateResult = await updateResponse.json();
          
          // Add to received data with "Arrived at Hub" status and scan timestamp
          const booking = { 
            ...result.data, 
            status: 'Arrived at Hub',
            arrivedAtHubScanAt: updateResult.booking?.arrivedAtHubScanAt || new Date().toISOString()
          };
          
          // Save to localStorage
          const existingReceived = localStorage.getItem('medicineReceived');
          let receivedArray = existingReceived ? JSON.parse(existingReceived) : [];
          
          // Check if consignment already exists in localStorage
          const existsInStorage = receivedArray.some((b: MedicineBooking) => b.consignmentNumber === result.data.consignmentNumber);
          if (existsInStorage) {
            toast({
              title: "Already in Received",
              description: `Consignment ${consignmentNumber} is already marked as received`,
              variant: "destructive"
            });
            setBarcodeInput('');
            return;
          }
          
          receivedArray = [booking, ...receivedArray];
          localStorage.setItem('medicineReceived', JSON.stringify(receivedArray));
          
          // Update received data state
          setReceivedData(receivedArray);
          
          // Show success message
          toast({
            title: "Arrived at Hub",
            description: `Consignment ${consignmentNumber} marked as Arrived at Hub`,
          });
          
          // Clear the input
          setBarcodeInput('');
        } else {
          toast({
            title: "No booking found",
            description: `No booking found with consignment number ${consignmentNumber}`,
            variant: "destructive"
          });
          setBarcodeInput('');
        }
      } else if (response.status === 404) {
        toast({
          title: "No booking found",
          description: `No booking found with consignment number ${consignmentNumber}`,
          variant: "destructive"
        });
        setBarcodeInput('');
      } else {
        throw new Error('Failed to fetch booking');
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      toast({
        title: "Error",
        description: "Failed to scan consignment",
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

  // Calculate totals for received
  const calculateTotals = () => {
    return receivedData.reduce(
      (totals, booking) => {
        const weight = (booking?.shipment?.chargeableWeight as number) || parseFloat(booking?.shipment?.actualWeight || '0') || 0;
        const units = parseInt(booking?.package?.totalPackages || '0', 10) || 0;
        
        return {
          totalWeight: totals.totalWeight + weight,
          totalUnits: totals.totalUnits + units
        };
      },
      { totalWeight: 0, totalUnits: 0 }
    );
  };

  const totals = calculateTotals();

  // Clear all received data
  const handleClearAll = () => {
    setReceivedData([]);
    localStorage.removeItem('medicineReceived');
    toast({
      title: "Cleared",
      description: "All received data has been cleared",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('medicineToken');
    localStorage.removeItem('medicineInfo');
    localStorage.removeItem('medicineReceived');
    navigate('/medicine');
  };

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MedicineSidebar 
        user={user} 
        isSidebarCollapsed={isSidebarCollapsed} 
        setIsSidebarCollapsed={setIsSidebarCollapsed} 
        onLogout={handleLogout} 
      />
      
      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-80'}`}>
        <main className="p-4">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <Scan className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Arrived at Hub Scan</h1>
                    <p className="text-sm text-gray-600">Scan and manage consignments marked as Arrived at Hub</p>
                  </div>
                </div>
                <Button
                  onClick={loadReceivedData}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Scanner Section */}
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Scan className="h-4 w-4 text-gray-600" />
                  <CardTitle className="font-semibold text-gray-800">Scan Consignment</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Scan barcode or enter consignment number"
                      value={barcodeInput}
                      onChange={(e) => handleBarcodeInputChange(e.target.value)}
                      className="pl-10 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md text-base"
                      autoFocus
                      disabled={loading}
                    />
                    {loading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Scan consignment numbers to mark them as Arrived at Hub. Only consignments in "Booked" status can be marked as Arrived at Hub.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Already Received Popup */}
            {showAlreadyReceivedPopup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg max-w-sm mx-4 p-6 border border-gray-200">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Already Marked</h3>
                    <p className="text-sm text-gray-600">This consignment has already been marked as Arrived at Hub</p>
                  </div>
                </div>
              </div>
            )}

            {/* Received Section */}
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Arrived at Hub Consignments ({receivedData.length})</h3>
                  </div>
                  {receivedData.length > 0 && (
                    <Button 
                      onClick={handleClearAll}
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-xs border-gray-300 hover:bg-gray-50"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                {receivedData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="font-medium text-gray-700 py-3 px-4">Sr. No</TableHead>
                        <TableHead className="font-medium text-gray-700 py-3 px-4">AWB / Docket No</TableHead>
                        <TableHead className="font-medium text-gray-700 py-3 px-4">Origin</TableHead>
                        <TableHead className="font-medium text-gray-700 py-3 px-4">Destination</TableHead>
                        <TableHead className="font-medium text-gray-700 py-3 px-4">Units</TableHead>
                        <TableHead className="font-medium text-gray-700 py-3 px-4">Weight (Kg)</TableHead>
                        <TableHead className="font-medium text-gray-700 py-3 px-4">Scanned At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receivedData.map((booking, idx) => {
                        const weight = (booking?.shipment?.chargeableWeight as number) || parseFloat(booking?.shipment?.actualWeight || '0') || 0;
                        const units = parseInt(booking?.package?.totalPackages || '0', 10) || 0;
                        return (
                          <TableRow key={booking._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <TableCell className="py-3 px-4 text-gray-700">{idx + 1}</TableCell>
                            <TableCell className="py-3 px-4 font-medium text-gray-900">{booking.consignmentNumber}</TableCell>
                            <TableCell className="py-3 px-4 text-gray-700">{booking.origin.city}, {booking.origin.state}</TableCell>
                            <TableCell className="py-3 px-4 text-gray-700">{booking.destination.city}, {booking.destination.state}</TableCell>
                            <TableCell className="py-3 px-4 text-gray-700">{units || '-'}</TableCell>
                            <TableCell className="py-3 px-4 text-gray-700">{weight ? weight.toFixed(2) : '-'}</TableCell>
                            <TableCell className="py-3 px-4 text-gray-700">
                              {booking.arrivedAtHubScanAt 
                                ? formatDate(booking.arrivedAtHubScanAt) 
                                : formatDate(booking.createdAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-gray-100">
                        <TableCell className="py-3 px-4 font-semibold text-gray-900" colSpan={4}>Total</TableCell>
                        <TableCell className="py-3 px-4 font-semibold text-gray-900">{totals.totalUnits}</TableCell>
                        <TableCell className="py-3 px-4 font-semibold text-gray-900">{totals.totalWeight.toFixed(2)}</TableCell>
                        <TableCell className="py-3 px-4"></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <PackageX className="h-8 w-8 text-gray-400" />
                      </div>
                      <span className="text-gray-500">No consignments found</span>
                      <p className="text-sm text-gray-400 max-w-md">
                        No consignments have been marked as Arrived at Hub yet. Scan consignment numbers above to mark them as Arrived at Hub.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MedicineReceivedScan;