import React, { useState, useEffect } from 'react';
import { 
  History, 
  Package, 
  MapPin, 
  Truck, 
  FileText, 
  CreditCard,
  Calendar,
  Phone,
  Mail,
  Building,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Warehouse,
  Ban
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStoredToken } from '@/utils/auth';
import { cn } from '@/lib/utils';

interface BookingImage {
  url: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
}

interface Coloader {
  _id: string;
  phoneNumber: string;
  busNumber: string;
}

interface MedicineBooking {
  _id: string;
  bookingReference: string;
  consignmentNumber?: number;
  status: 'pending' | 'confirmed' | 'in_transit' | 'arrived' | 'delivered' | 'cancelled';
  coloaderId?: Coloader | string;
  origin: {
    name: string;
    mobileNumber: string;
    email: string;
    companyName?: string;
    flatBuilding: string;
    locality: string;
    landmark?: string;
    pincode: string;
    city: string;
    district: string;
    state: string;
    gstNumber?: string;
    addressType: string;
  };
  destination: {
    name: string;
    mobileNumber: string;
    email: string;
    companyName?: string;
    flatBuilding: string;
    locality: string;
    landmark?: string;
    pincode: string;
    city: string;
    district: string;
    state: string;
    gstNumber?: string;
    addressType: string;
  };
  shipment: {
    natureOfConsignment: string;
    services: string;
    mode: string;
    insurance: string;
    riskCoverage: string;
    dimensions: Array<{
      length: string;
      breadth: string;
      height: string;
      unit: string;
    }>;
    actualWeight: string;
    perKgWeight: string;
    volumetricWeight: number;
    chargeableWeight: number;
  };
  package: {
    totalPackages: string;
    materials?: string;
    packageImages: BookingImage[];
    contentDescription: string;
  };
  invoice: {
    invoiceNumber: string;
    invoiceValue: string;
    invoiceImages: BookingImage[];
    eWaybillNumber?: string;
    acceptTerms: boolean;
  };
  billing: {
    gst: string;
    partyType: string;
    billType?: string;
  };
  charges?: {
    freightCharge?: string;
    awbCharge?: string;
    localCollection?: string;
    doorDelivery?: string;
    loadingUnloading?: string;
    demurrageCharge?: string;
    ddaCharge?: string;
    hamaliCharge?: string;
    packingCharge?: string;
    otherCharge?: string;
    total?: string;
    fuelCharge?: string;
    fuelChargeType?: string;
    sgstAmount?: string;
    cgstAmount?: string;
    igstAmount?: string;
    gstAmount?: string;
    grandTotal?: string;
  };
  payment?: {
    mode?: string;
    deliveryType?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const TrackMedicine: React.FC = () => {
  const [bookings, setBookings] = useState<MedicineBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getStoredToken();
      
      const response = await fetch('/api/admin/medicine/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Unauthorized. Please login again.');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch bookings');
      }

      const data = await response.json();
      if (data.success && data.bookings) {
        setBookings(data.bookings);
        setCurrentPage(1); // Reset to first page when data changes
      } else {
        setBookings([]);
        setCurrentPage(1);
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, consignmentNumber?: number) => {
    // Check if the booking is in the manifest (ready to dispatch)
    const storedManifest = localStorage.getItem('medicineManifest');
    let isInManifest = false;
    if (storedManifest && consignmentNumber) {
      try {
        const manifestArray = JSON.parse(storedManifest);
        isInManifest = manifestArray.some((b: any) => b.consignmentNumber === consignmentNumber);
      } catch (error) {
        console.error('Error parsing manifest data:', error);
      }
    }

    // If in manifest, show "Ready to Dispatch" status
    if (isInManifest) {
      const Icon = Clock;
      return (
        <Badge className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-md bg-gradient-to-br from-yellow-100/90 to-amber-100/90 text-yellow-800 border border-yellow-200/40">
          <span className="relative">
            <Icon className="w-3.5 h-3.5" />
            <span className="absolute inset-0 bg-white/20 rounded-full blur-sm"></span>
          </span>
          Ready to Dispatch
        </Badge>
      );
    }

    const statusConfig = {
      pending: { bg: 'from-amber-100/90 to-orange-100/90', text: 'text-amber-800', border: 'border-amber-200/40', icon: Clock, label: 'Pending' },
      confirmed: { bg: 'from-blue-100/90 to-cyan-100/90', text: 'text-blue-800', border: 'border-blue-200/40', icon: CheckCircle, label: 'Confirmed' },
      in_transit: { bg: 'from-purple-100/90 to-indigo-100/90', text: 'text-purple-800', border: 'border-purple-200/40', icon: Truck, label: 'In Transit' },
      arrived: { bg: 'from-teal-100/90 to-cyan-100/90', text: 'text-teal-800', border: 'border-teal-200/40', icon: Package, label: 'Arrived' },
      delivered: { bg: 'from-green-100/90 to-emerald-100/90', text: 'text-green-800', border: 'border-green-200/40', icon: CheckCircle, label: 'Delivered' },
      cancelled: { bg: 'from-red-100/90 to-rose-100/90', text: 'text-red-800', border: 'border-red-200/40', icon: XCircle, label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-md bg-gradient-to-br border",
        config.bg,
        config.text,
        config.border
      )}>
        <span className="relative">
          <Icon className="w-3.5 h-3.5" />
          <span className="absolute inset-0 bg-white/20 rounded-full blur-sm"></span>
        </span>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleRow = (bookingId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const handleCancelBooking = async (bookingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const token = getStoredToken();
      
      const response = await fetch(`/api/admin/medicine/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel booking');
      }

      if (data.success) {
        // Update the local state to reflect the cancellation
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: 'cancelled' as const }
            : booking
        ));
        alert('Booking cancelled successfully');
      } else {
        throw new Error(data.message || 'Failed to cancel booking');
      }
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      alert(err.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = bookings.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedRows(new Set()); // Close all expanded rows when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 relative">
      {/* Ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30"></div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Track Medicine Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all medicine shipment bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchBookings}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 backdrop-blur-sm border-gray-200/60 hover:shadow-md hover:border-blue-300/60 transition-all duration-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards - Premium Glassmorphism */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          <Card className="border-0 shadow-lg backdrop-blur-xl rounded-xl overflow-hidden relative bg-white/70 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-sm"></div>
                  <div className="p-2 rounded-lg bg-blue-100 relative z-10">
                    <Package className="h-5 w-5 text-blue-600 relative z-10" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Bookings</p>
                  <p className="text-xl font-bold text-gray-900">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg backdrop-blur-xl rounded-xl overflow-hidden relative bg-white/70 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/20 rounded-lg blur-sm"></div>
                  <div className="p-2 rounded-lg bg-amber-100 relative z-10">
                    <Clock className="h-5 w-5 text-amber-600 relative z-10" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-xl font-bold text-gray-900">{bookings.filter(b => b.status === 'pending').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg backdrop-blur-xl rounded-xl overflow-hidden relative bg-white/70 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-yellow-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-lg blur-sm"></div>
                  <div className="p-2 rounded-lg bg-yellow-100 relative z-10">
                    <Clock className="h-5 w-5 text-yellow-600 relative z-10" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ready to Dispatch</p>
                  <p className="text-xl font-bold text-gray-900">
                    {(() => {
                      const storedManifest = localStorage.getItem('medicineManifest');
                      if (storedManifest) {
                        try {
                          const manifestArray = JSON.parse(storedManifest);
                          return manifestArray.length;
                        } catch (error) {
                          return 0;
                        }
                      }
                      return 0;
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg backdrop-blur-xl rounded-xl overflow-hidden relative bg-white/70 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-lg blur-sm"></div>
                  <div className="p-2 rounded-lg bg-purple-100 relative z-10">
                    <Truck className="h-5 w-5 text-purple-600 relative z-10" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">In Transit</p>
                  <p className="text-xl font-bold text-gray-900">{bookings.filter(b => b.status === 'in_transit').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg backdrop-blur-xl rounded-xl overflow-hidden relative bg-white/70 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-teal-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-teal-500/20 rounded-lg blur-sm"></div>
                  <div className="p-2 rounded-lg bg-teal-100 relative z-10">
                    <Package className="h-5 w-5 text-teal-600 relative z-10" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Arrived</p>
                  <p className="text-xl font-bold text-gray-900">{bookings.filter(b => b.status === 'arrived').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg backdrop-blur-xl rounded-xl overflow-hidden relative bg-white/70 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-lg blur-sm"></div>
                  <div className="p-2 rounded-lg bg-green-100 relative z-10">
                    <CheckCircle className="h-5 w-5 text-green-600 relative z-10" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Delivered</p>
                  <p className="text-xl font-bold text-gray-900">{bookings.filter(b => b.status === 'delivered').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg backdrop-blur-xl rounded-xl overflow-hidden relative bg-white/70 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-sm"></div>
                  <div className="p-2 rounded-lg bg-red-100 relative z-10">
                    <XCircle className="h-5 w-5 text-red-600 relative z-10" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cancelled</p>
                  <p className="text-xl font-bold text-gray-900">{bookings.filter(b => b.status === 'cancelled').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content - Premium Glassmorphism */}
      <Card className="border-0 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden relative bg-white/70">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10"></div>
        
        <CardHeader className="backdrop-blur-sm border-b py-4 relative z-10 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-white/20">
          <div className="absolute inset-0 opacity-50 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold relative z-10 text-gray-800">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-md bg-blue-500/20"></div>
              <History className="h-5 w-5 relative z-10 text-blue-600" />
            </div>
            Booking Records ({bookings.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative z-10">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl animate-pulse bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20"></div>
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 relative z-10" />
              </div>
              <span className="ml-3 text-gray-600 font-medium">Loading bookings...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl bg-red-500/20"></div>
                <AlertCircle className="h-12 w-12 text-red-500 mb-4 relative z-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Error loading bookings</h3>
              <p className="text-gray-500 text-center max-w-md mb-4">{error}</p>
              <Button
                onClick={fetchBookings}
                className="flex items-center gap-2 backdrop-blur-sm border-gray-200/60 hover:shadow-md hover:border-blue-300/60 transition-all duration-300"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl animate-pulse bg-gradient-to-r from-blue-500/20 via-purple-500/15 to-indigo-500/20"></div>
                <div className="absolute inset-0 rounded-full blur-xl bg-white/20"></div>
                <Package className="h-16 w-16 text-gray-300 mb-4 relative z-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">No medicine shipment bookings found in the system.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="overflow-x-auto relative">
                {/* Premium table shadow overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-500/5 pointer-events-none"></div>
                <table className="w-full relative">
                  <thead>
                    <tr className="backdrop-blur-md border-b shadow-lg relative bg-gradient-to-r from-slate-50/90 via-blue-50/50 to-indigo-50/50 border-white/30 shadow-blue-500/5">
                      {/* Premium gradient overlay */}
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-blue-500/8 via-purple-500/5 to-indigo-500/8"></div>
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/40 to-transparent"></div>
                      
                      <th className="text-left py-4 px-6 text-xs font-bold relative z-10 text-gray-800 uppercase tracking-wider w-12">#</th>
                      <th className="text-left py-4 px-6 text-xs font-bold relative z-10 text-gray-800 uppercase tracking-wider">Booking</th>
                      <th className="text-left py-4 px-6 text-xs font-bold relative z-10 text-gray-800 uppercase tracking-wider">Date</th>
                      <th className="text-left py-4 px-6 text-xs font-bold relative z-10 text-gray-800 uppercase tracking-wider">Route</th>
                      <th className="text-left py-4 px-6 text-xs font-bold relative z-10 text-gray-800 uppercase tracking-wider">Packages</th>
                      <th className="text-left py-4 px-6 text-xs font-bold relative z-10 text-gray-800 uppercase tracking-wider">Value</th>
                      <th className="text-left py-4 px-6 text-xs font-bold relative z-10 text-gray-800 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {paginatedBookings.map((booking) => {
                      const isExpanded = expandedRows.has(booking._id);
                      return (
                        <React.Fragment key={booking._id}>
                          <tr 
                            className="h-14 backdrop-blur-md border-b transition-all duration-500 group relative bg-white/50 border-white/20 hover:bg-gradient-to-r hover:from-blue-50/40 hover:via-indigo-50/30 hover:to-purple-50/40 hover:shadow-xl hover:shadow-blue-500/15 hover:border-blue-200/30 cursor-pointer"
                            onClick={() => toggleRow(booking._id)}
                          >
                            {/* Premium glow effect on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg bg-gradient-to-r from-blue-500/0 via-blue-500/8 to-purple-500/0"></div>
                            {/* Subtle depth shadow */}
                            <div className="absolute inset-0 shadow-inner pointer-events-none shadow-gray-900/5"></div>
                            {/* Shine effect on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-b from-white/30 to-transparent"></div>
                            
                            <td className="py-4 px-6 relative z-10">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-lg hover:bg-blue-500/20 hover:scale-110 transition-all duration-300"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-blue-600" />
                                )}
                              </Button>
                            </td>
                            <td className="py-4 px-6 relative z-10">
                              <div className="relative">
                                <div className="font-bold text-sm relative z-10 text-gray-900">#{booking.consignmentNumber || booking.bookingReference}</div>
                                <div className="text-xs text-gray-600 mt-0.5 relative z-10">{booking.shipment.services}</div>
                                <div className="absolute -inset-1 bg-blue-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              </div>
                            </td>
                            <td className="py-4 px-6 relative z-10">
                              <div className="relative">
                                <div className="text-sm font-medium relative z-10 text-gray-900">{formatShortDate(booking.createdAt)}</div>
                                <div className="text-xs text-gray-600 mt-0.5 relative z-10">{booking.shipment.mode}</div>
                                <div className="absolute -inset-1 bg-gray-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              </div>
                            </td>
                            <td className="py-4 px-6 relative z-10">
                              <div className="relative">
                                <div className="flex items-center gap-1 text-sm relative z-10">
                                  <span className="font-bold text-gray-900">{booking.origin.city}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="font-bold text-gray-900">{booking.destination.city}</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5 relative z-10">{booking.origin.state} to {booking.destination.state}</div>
                                <div className="absolute -inset-1 bg-purple-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              </div>
                            </td>
                            <td className="py-4 px-6 relative z-10">
                              <div className="relative">
                                <div className="text-sm font-bold relative z-10 text-gray-900">{booking.package.totalPackages}</div>
                                <div className="absolute -inset-1 bg-orange-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              </div>
                            </td>
                            <td className="py-4 px-6 relative z-10">
                              <div className="relative">
                                <div className="font-bold text-sm relative z-10 text-gray-900">₹{parseFloat(booking.invoice.invoiceValue).toLocaleString()}</div>
                                <div className="absolute -inset-1 bg-green-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              </div>
                            </td>
                            <td className="py-4 px-6 relative z-10">
                              {getStatusBadge(booking.status, booking.consignmentNumber)}
                            </td>
                          </tr>
                          {/* Expanded Row - Premium Glassmorphism */}
                          {isExpanded && (
                            <tr className="bg-transparent">
                              <td colSpan={7} className="p-0">
                                <div className="relative overflow-hidden">
                                  <div className="p-4 space-y-3 relative z-10">
                                    {/* All Detail Boxes in Single Row - Premium Styled */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                      {/* Origin Card */}
                                      <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/70 border-blue-200/40 hover:shadow-blue-500/20">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl"></div>
                                        <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs relative z-10 text-blue-800">
                                          <div className="relative">
                                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-sm"></div>
                                            <MapPin className="h-3.5 w-3.5 relative z-10" />
                                          </div>
                                          Origin
                                        </h4>
                                        <div className="space-y-1 text-xs relative z-10">
                                          <div className="text-gray-700"><strong className="text-gray-800">Name:</strong> {booking.origin.name}</div>
                                          <div className="text-gray-700"><strong className="text-gray-800">Mobile:</strong> +91 {booking.origin.mobileNumber}</div>
                                          <div className="text-gray-700"><strong className="text-gray-800">Address:</strong> {booking.origin.flatBuilding}, {booking.origin.locality}</div>
                                          <div className="text-gray-700"><strong className="text-gray-800">City:</strong> {booking.origin.city}, {booking.origin.state} - {booking.origin.pincode}</div>
                                          {booking.origin.gstNumber && (
                                            <div className="text-gray-700"><strong className="text-gray-800">GST:</strong> {booking.origin.gstNumber}</div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Destination Card */}
                                      <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/70 border-green-200/40 hover:shadow-green-500/20">
                                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl"></div>
                                        <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs relative z-10 text-green-800">
                                          <div className="relative">
                                            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-sm"></div>
                                            <MapPin className="h-3.5 w-3.5 relative z-10" />
                                          </div>
                                          Destination
                                        </h4>
                                        <div className="space-y-1 text-xs relative z-10">
                                          <div className="text-gray-700"><strong className="text-gray-800">Name:</strong> {booking.destination.name}</div>
                                          <div className="text-gray-700"><strong className="text-gray-800">Mobile:</strong> +91 {booking.destination.mobileNumber}</div>
                                          <div className="text-gray-700"><strong className="text-gray-800">Address:</strong> {booking.destination.flatBuilding}, {booking.destination.locality}</div>
                                          <div className="text-gray-700"><strong className="text-gray-800">City:</strong> {booking.destination.city}, {booking.destination.state} - {booking.destination.pincode}</div>
                                          {booking.destination.gstNumber && (
                                            <div className="text-gray-700"><strong className="text-gray-800">GST:</strong> {booking.destination.gstNumber}</div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Shipment Card */}
                                      <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/70 border-orange-200/40 hover:shadow-orange-500/20">
                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl"></div>
                                        <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs relative z-10 text-orange-800">
                                          <div className="relative">
                                            <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-sm"></div>
                                            <Truck className="h-3.5 w-3.5 relative z-10" />
                                          </div>
                                          Shipment
                                        </h4>
                                        <div className="space-y-1 text-xs relative z-10">
                                          <div className="text-gray-700"><strong className="text-gray-800">Nature:</strong> {booking.shipment.natureOfConsignment}</div>
                                          <div className="text-gray-700"><strong className="text-gray-800">Service:</strong> {booking.shipment.services}</div>
                                          <div className="text-gray-700"><strong className="text-gray-800">Mode:</strong> {booking.shipment.mode}</div>
                                          <div className="text-gray-700"><strong className="text-gray-800">Weight:</strong> {booking.shipment.actualWeight} kg</div>
                                          <div className="text-gray-700"><strong className="text-gray-800">Chargeable:</strong> {booking.shipment.chargeableWeight} kg</div>
                                        </div>
                                      </div>

                                      {/* Billing Card */}
                                      <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-purple-50/80 border-purple-200/60 hover:shadow-purple-500/20">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
                                        <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs relative z-10 text-purple-800">
                                          <div className="relative">
                                            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-sm"></div>
                                            <CreditCard className="h-3.5 w-3.5 relative z-10" />
                                          </div>
                                          Billing
                                        </h4>
                                        <div className="space-y-1 text-xs relative z-10">
                                          <div className="text-gray-700"><strong className="text-gray-800">Freight:</strong> ₹{booking.charges?.freightCharge ? parseFloat(booking.charges.freightCharge).toLocaleString() : 'N/A'}</div>
                                          {booking.billing?.gst === 'Yes' && booking.charges?.gstAmount && (
                                            <div className="text-gray-700"><strong className="text-gray-800">GST (18%):</strong> ₹{parseFloat(booking.charges.gstAmount).toLocaleString()}</div>
                                          )}
                                          {booking.charges && booking.charges.grandTotal && (
                                            <div className="font-bold text-xs text-purple-700"><strong>Total:</strong> ₹{parseFloat(booking.charges.grandTotal).toLocaleString()}</div>
                                          )}
                                          <div className="mt-2">{getStatusBadge(booking.status, booking.consignmentNumber)}</div>
                                        </div>
                                      </div>

                                      {/* Coloader Details - Show only if coloader is assigned */}
                                      {booking.coloaderId && (
                                        <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/70 border-indigo-200/40 hover:shadow-indigo-500/20">
                                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl"></div>
                                          <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs relative z-10 text-indigo-800">
                                            <div className="relative">
                                              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-sm"></div>
                                              <Warehouse className="h-3.5 w-3.5 relative z-10" />
                                            </div>
                                            Coloader
                                          </h4>
                                          <div className="space-y-1 text-xs relative z-10">
                                            <div className="text-gray-700"><strong className="text-gray-800">Bus Number:</strong> {typeof booking.coloaderId === 'object' ? booking.coloaderId.busNumber : 'N/A'}</div>
                                            <div className="text-gray-700 flex items-center gap-1"><strong className="text-gray-800">Phone:</strong> <Phone className="h-3 w-3 text-gray-400" /> {typeof booking.coloaderId === 'object' ? booking.coloaderId.phoneNumber : 'N/A'}</div>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Cancel Booking Button */}
                                    {booking.status !== 'cancelled' && (
                                      <div className="mt-4 flex justify-end">
                                        <Button
                                          onClick={(e) => handleCancelBooking(booking._id, e)}
                                          disabled={cancellingId === booking._id}
                                          variant="outline"
                                          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                                        >
                                          {cancellingId === booking._id ? (
                                            <>
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                              <span>Cancelling...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Ban className="h-4 w-4" />
                                              <span>Cancel Booking</span>
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls - Premium Styled */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50 backdrop-blur-md bg-gradient-to-r from-gray-50/80 via-blue-50/40 to-indigo-50/80 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5"></div>
                  <div className="text-sm text-gray-700 relative z-10 font-medium">
                    Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to{' '}
                    <span className="font-bold text-gray-900">{Math.min(endIndex, bookings.length)}</span> of{' '}
                    <span className="font-bold text-gray-900">{bookings.length}</span> bookings
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 backdrop-blur-sm border-gray-200/60 hover:shadow-md hover:border-blue-300/60 transition-all duration-300 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className={cn(
                                "min-w-[2.5rem] transition-all duration-300",
                                currentPage === page 
                                  ? "shadow-lg hover:shadow-xl" 
                                  : "backdrop-blur-sm border-gray-200/60 hover:shadow-md hover:border-blue-300/60"
                              )}
                            >
                              {page}
                            </Button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 text-gray-500 font-medium">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 backdrop-blur-sm border-gray-200/60 hover:shadow-md hover:border-blue-300/60 transition-all duration-300 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackMedicine;
