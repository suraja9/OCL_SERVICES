import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MedicineSidebar from '../../components/medicine/MedicineSidebar';
import { 
  Truck, 
  Package, 
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MedicineUserInfo {
  id: string;
  name: string;
  email: string;
}

interface MedicineBooking {
  _id: string;
  bookingReference: string;
  consignmentNumber?: number;
  status: 'Booked' | 'pending' | 'confirmed' | 'in_transit' | 'arrived' | 'delivered' | 'cancelled' | 'Arrived at Hub' | 'Ready to Dispatch';
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
    actualWeight: string;
    perKgWeight: string;
    volumetricWeight: number;
    chargeableWeight: number;
  };
  package: {
    totalPackages: string;
    materials?: string;
    contentDescription: string;
  };
  invoice: {
    invoiceNumber: string;
    invoiceValue: string;
    eWaybillNumber?: string;
  };
  billing: {
    gst: string;
    partyType: string;
    billType?: string;
  };
  charges?: {
    grandTotal?: string;
    total?: string;
    freightCharge?: string;
    sgstAmount?: string;
    cgstAmount?: string;
    igstAmount?: string;
  };
  payment?: {
    mode?: string;
    deliveryType?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const MedicineShipment: React.FC = () => {
  const [user, setUser] = useState<MedicineUserInfo | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [bookings, setBookings] = useState<MedicineBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('medicineToken');
      
      const response = await fetch('/api/medicine/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/medicine');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch bookings');
      }

      const data = await response.json();
      if (data.success && data.bookings) {
        setBookings(data.bookings);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to load bookings');
      toast({
        title: "Error",
        description: err.message || "Failed to load shipments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medicineToken');
    localStorage.removeItem('medicineInfo');
    navigate('/medicine');
  };

  // Filter bookings based on search, status, payment status, and month
  const filteredBookings = bookings.filter(booking => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch = 
      (booking.bookingReference || '').toLowerCase().includes(normalizedSearch) ||
      (booking.consignmentNumber?.toString() || '').includes(normalizedSearch) ||
      (booking.origin?.name || '').toLowerCase().includes(normalizedSearch) ||
      (booking.destination?.name || '').toLowerCase().includes(normalizedSearch) ||
      (booking.origin?.city || '').toLowerCase().includes(normalizedSearch) ||
      (booking.destination?.city || '').toLowerCase().includes(normalizedSearch);
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    // Payment filter based on billing.partyType
    let matchesPayment = true;
    if (paymentFilter !== 'all') {
      if (paymentFilter === 'paid') {
        matchesPayment = booking.billing?.partyType === 'sender';
      } else if (paymentFilter === 'unpaid') {
        matchesPayment = booking.billing?.partyType === 'recipient';
      }
    }
    
    // Month filtering
    let matchesMonth = true;
    if (monthFilter !== 'all') {
      const bookingDate = new Date(booking.createdAt);
      const bookingMonth = bookingDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
      matchesMonth = bookingMonth.toString() === monthFilter;
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesMonth;
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, monthFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Toggle row expansion
  const toggleRowExpansion = (bookingId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(bookingId)) {
      newExpandedRows.delete(bookingId);
    } else {
      newExpandedRows.add(bookingId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Get status badge variant and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Booked':
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-4 w-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          hoverBgColor: 'hover:!bg-gray-100'
        };
      case 'confirmed':
      case 'Arrived at Hub':
      case 'picked_up':
        return {
          variant: 'default' as const,
          icon: <Truck className="h-4 w-4" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          hoverBgColor: 'hover:!bg-blue-100'
        };
      case 'in_transit':
      case 'arrived':
        return {
          variant: 'default' as const,
          icon: <Package className="h-4 w-4" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          hoverBgColor: 'hover:!bg-orange-100'
        };
      case 'Ready to Dispatch':
      case 'out_for_delivery':
        return {
          variant: 'default' as const,
          icon: <Truck className="h-4 w-4" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          hoverBgColor: 'hover:!bg-purple-100'
        };
      case 'delivered':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          hoverBgColor: 'hover:!bg-green-100'
        };
      case 'cancelled':
        return {
          variant: 'destructive' as const,
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          hoverBgColor: 'hover:!bg-red-100'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-4 w-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          hoverBgColor: 'hover:!bg-gray-100'
        };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDetailCards = (booking: MedicineBooking) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Origin Card */}
      <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/70 border-blue-200/40 hover:shadow-blue-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-100 transition-opacity duration-300"></div>
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
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl"></div>
        <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs relative z-10 text-green-800">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-sm"></div>
            <Truck className="h-3.5 w-3.5 relative z-10" />
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
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl"></div>
        <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs relative z-10 text-orange-800">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-sm"></div>
            <Package className="h-3.5 w-3.5 relative z-10" />
          </div>
          Shipment
        </h4>
        <div className="space-y-1 text-xs relative z-10">
          <div className="text-gray-700"><strong className="text-gray-800">Nature:</strong> {booking.shipment.natureOfConsignment}</div>
          <div className="text-gray-700"><strong className="text-gray-800">Service:</strong> {booking.shipment.services}</div>
          <div className="text-gray-700"><strong className="text-gray-800">Mode:</strong> {booking.shipment.mode}</div>
          <div className="text-gray-700"><strong className="text-gray-800">Weight:</strong> {booking.shipment.actualWeight} kg</div>
          <div className="text-gray-700"><strong className="text-gray-800">Packages:</strong> {booking.package.totalPackages}</div>
          {booking.package.contentDescription && (
            <div className="text-gray-700"><strong className="text-gray-800">Description:</strong> {booking.package.contentDescription}</div>
          )}
        </div>
      </div>

      {/* Invoice Card */}
      <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-purple-50/80 border-purple-200/60 hover:shadow-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-purple-500/10 opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
        <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs relative z-10 text-purple-800">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-sm"></div>
            <DollarSign className="h-3.5 w-3.5 relative z-10" />
          </div>
          Invoice
        </h4>
        <div className="space-y-1 text-xs relative z-10">
          <div className="text-gray-700"><strong className="text-gray-800">Invoice #:</strong> {booking.invoice.invoiceNumber}</div>
          <div className="text-gray-700"><strong className="text-gray-800">Invoice Value:</strong> ₹{booking.invoice.invoiceValue}</div>
          {booking.invoice.eWaybillNumber && (
            <div className="text-gray-700"><strong className="text-gray-800">E-Waybill:</strong> {booking.invoice.eWaybillNumber}</div>
          )}
          <div className="text-gray-700"><strong className="text-gray-800">Payment Type:</strong> {booking.billing.partyType === 'sender' ? 'Paid (FP)' : 'To Pay (TP)'}</div>
          {booking.charges?.grandTotal && (
            <div className="font-bold text-xs text-purple-700"><strong>Total:</strong> ₹{booking.charges.grandTotal}</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
      <MedicineSidebar 
        user={user} 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        onLogout={handleLogout} 
      />
      <main className={`${isSidebarCollapsed ? 'ml-16 w-[calc(100vw-4rem)]' : 'ml-64 w-[calc(100vw-16rem)]'} h-screen overflow-y-auto p-6 transition-all duration-300 ease-in-out`}>
        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(16,24,40,0.08)] border border-gray-100 p-6 min-h-[calc(100vh-3rem)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              
              
            </div>
            <Button
              onClick={fetchBookings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Input
                      id="search"
                      placeholder=""
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-12 pl-3 h-9 text-sm rounded-lg border-gray-300/60 hover:border-blue-400/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 focus:shadow-sm focus:outline-none focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-blue-200/50 focus-visible:ring-offset-0 transition-all duration-200 bg-white"
                      onFocus={(e) => {
                        setIsSearchFocused(true);
                        e.currentTarget.style.boxShadow = 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px';
                      }}
                      onBlur={(e) => {
                        setIsSearchFocused(false);
                        e.currentTarget.style.boxShadow = '';
                      }}
                      onMouseEnter={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.boxShadow = 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.boxShadow = '';
                        }
                      }}
                    />
                    <Label
                      htmlFor="search"
                      className={`absolute left-3 transition-all duration-200 ease-in-out pointer-events-none z-20 ${
                        isSearchFocused || searchTerm.length > 0
                          ? 'left-3 -top-2 text-xs bg-white px-1 text-blue-600 font-medium'
                          : 'left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm'
                      }`}
                    >
                      Search by consignment, reference, name, or city
                    </Label>
                    <div className="absolute right-0 top-0 bottom-0 rounded-r-lg px-3 flex items-center justify-center z-10 pointer-events-none bg-black">
                      <Search className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-40 flex-shrink-0">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-300/60 hover:border-blue-400/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 focus:shadow-sm focus:outline-none focus:ring-offset-0">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl rounded-xl shadow-2xl bg-white/95 border-gray-200/60">
                      <SelectItem value="all" className="text-gray-500 text-xs">All Status</SelectItem>
                      <SelectItem value="Booked" className="text-gray-500 text-xs">Booked</SelectItem>
                      <SelectItem value="pending" className="text-gray-500 text-xs">Pending</SelectItem>
                      <SelectItem value="confirmed" className="text-gray-500 text-xs">Confirmed</SelectItem>
                      <SelectItem value="Arrived at Hub" className="text-gray-500 text-xs">Arrived at Hub</SelectItem>
                      <SelectItem value="Ready to Dispatch" className="text-gray-500 text-xs">Ready to Dispatch</SelectItem>
                      <SelectItem value="in_transit" className="text-gray-500 text-xs">In Transit</SelectItem>
                      <SelectItem value="delivered" className="text-gray-500 text-xs">Delivered</SelectItem>
                      <SelectItem value="cancelled" className="text-gray-500 text-xs">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-40 flex-shrink-0">
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-300/60 hover:border-blue-400/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 focus:shadow-sm focus:outline-none focus:ring-offset-0">
                      <SelectValue placeholder="All Payments" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl rounded-xl shadow-2xl bg-white/95 border-gray-200/60">
                      <SelectItem value="all" className="text-gray-500 text-xs">All Payments</SelectItem>
                      <SelectItem value="paid" className="text-gray-500 text-xs">Paid (FP)</SelectItem>
                      <SelectItem value="unpaid" className="text-gray-500 text-xs">To Pay (TP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-40 flex-shrink-0">
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-300/60 hover:border-blue-400/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 focus:shadow-sm focus:outline-none focus:ring-offset-0">
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl rounded-xl shadow-2xl bg-white/95 border-gray-200/60">
                      <SelectItem value="all" className="text-gray-500 text-xs">All Months</SelectItem>
                      <SelectItem value="1" className="text-gray-500 text-xs">January</SelectItem>
                      <SelectItem value="2" className="text-gray-500 text-xs">February</SelectItem>
                      <SelectItem value="3" className="text-gray-500 text-xs">March</SelectItem>
                      <SelectItem value="4" className="text-gray-500 text-xs">April</SelectItem>
                      <SelectItem value="5" className="text-gray-500 text-xs">May</SelectItem>
                      <SelectItem value="6" className="text-gray-500 text-xs">June</SelectItem>
                      <SelectItem value="7" className="text-gray-500 text-xs">July</SelectItem>
                      <SelectItem value="8" className="text-gray-500 text-xs">August</SelectItem>
                      <SelectItem value="9" className="text-gray-500 text-xs">September</SelectItem>
                      <SelectItem value="10" className="text-gray-500 text-xs">October</SelectItem>
                      <SelectItem value="11" className="text-gray-500 text-xs">November</SelectItem>
                      <SelectItem value="12" className="text-gray-500 text-xs">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading shipments...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <span className="ml-3 text-red-600">{error}</span>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="border-b pt-4 border-gray-200">
                <h2 className="flex items-center gap-2 text-lg font-bold pb-4 text-gray-800">
                  <Package className="h-5 w-5 text-blue-600" />
                  Shipment History - {filteredBookings.length}
                </h2>
              </div>
              
              <div className="relative z-10">
                {filteredBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-500">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full blur-2xl animate-pulse bg-gradient-to-r from-blue-200/40 via-purple-200/30 to-indigo-200/40"></div>
                      <Package className="h-10 w-10 relative z-10 text-gray-400" />
                    </div>
                    <span className="font-semibold text-sm text-gray-600">No shipments found</span>
                  </div>
                ) : isMobile ? (
                  <div className="space-y-4 p-4">
                    {paginatedBookings.map((booking) => {
                      const statusInfo = getStatusInfo(booking.status);

                      return (
                        <div
                          key={booking._id}
                          className="rounded-2xl border p-4 space-y-4 shadow-lg transition-all duration-300 bg-white/80 border-gray-100 text-gray-800"
                        >
                          <div className="flex flex-col gap-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                Consignment
                              </p>
                              <p className="text-lg font-bold">
                                {booking.consignmentNumber || booking.bookingReference}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              Booked on {formatDate(booking.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge 
                              variant={statusInfo.variant}
                              className={cn(
                                statusInfo.bgColor,
                                statusInfo.color,
                                statusInfo.hoverBgColor,
                                "border border-white/30 text-xs px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md font-semibold"
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                {statusInfo.icon}
                                <span className="capitalize">{booking.status.replace('_', ' ')}</span>
                              </span>
                            </Badge>
                            <Badge 
                              variant={booking.billing?.partyType === 'sender' ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md font-semibold",
                                booking.billing?.partyType === 'sender'
                                  ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40 hover:bg-gradient-to-br hover:from-green-100/90 hover:to-emerald-100/90"
                                  : "bg-gradient-to-br from-red-100/90 to-rose-100/90 text-red-800 border border-red-200/40 hover:bg-gradient-to-br hover:from-red-100/90 hover:to-rose-100/90"
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                {booking.billing?.partyType === 'sender' ? (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                ) : (
                                  <AlertCircle className="h-3.5 w-3.5" />
                                )}
                                <span className="capitalize">{booking.billing?.partyType === 'sender' ? 'Paid' : 'Unpaid'}</span>
                              </span>
                            </Badge>
                            <Badge 
                              variant={booking.billing?.partyType === 'sender' ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md font-semibold",
                                booking.billing?.partyType === 'sender'
                                  ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40 hover:bg-gradient-to-br hover:from-green-100/90 hover:to-emerald-100/90"
                                  : "bg-gradient-to-br from-blue-100/90 to-cyan-100/90 text-blue-800 border border-blue-200/40 hover:bg-gradient-to-br hover:from-blue-100/90 hover:to-cyan-100/90"
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                {booking.billing?.partyType === 'sender' ? (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5" />
                                )}
                                <span>{booking.billing?.partyType === 'sender' ? 'FP' : 'TP'}</span>
                              </span>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border p-3 text-sm border-blue-100 bg-blue-50/50">
                              <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-blue-700">Origin</p>
                              <p className="font-semibold">{booking.origin.name}</p>
                              <p className="text-xs text-gray-500">{booking.origin.city}, {booking.origin.state}</p>
                            </div>
                            <div className="rounded-xl border p-3 text-sm border-purple-100 bg-purple-50/50">
                              <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-purple-700">Destination</p>
                              <p className="font-semibold">{booking.destination.name}</p>
                              <p className="text-xs text-gray-500">{booking.destination.city}, {booking.destination.state}</p>
                            </div>
                          </div>

                          <Collapsible>
                            <div className="border-t pt-3 mt-1 border-slate-100">
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-between rounded-xl text-gray-700 hover:bg-blue-50"
                                >
                                  View full details
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-3">
                                {renderDetailCards(booking)}
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto relative">
                    {/* Premium table shadow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-500/5 pointer-events-none"></div>
                    <Table className="relative w-full table-fixed">
                      <TableHeader>
                        <TableRow className="bg-blue-600 border-b hover:bg-blue-600">
                          <TableHead className="text-xs font-bold py-4 px-4 tracking-wide text-white w-[12%] hover:bg-transparent">Consignment</TableHead>
                          <TableHead className="text-xs font-bold py-4 px-4 tracking-wide text-white w-[15%] hover:bg-transparent">Origin</TableHead>
                          <TableHead className="text-xs font-bold py-4 px-4 tracking-wide text-white w-[15%] hover:bg-transparent">Destination</TableHead>
                          <TableHead className="text-xs font-bold py-4 px-4 tracking-wide text-white w-[12%] hover:bg-transparent">Status</TableHead>
                          <TableHead className="text-xs font-bold py-4 px-4 tracking-wide text-white w-[12%] hover:bg-transparent">Payment</TableHead>
                          <TableHead className="text-xs font-bold py-4 px-4 tracking-wide text-white w-[10%] hover:bg-transparent">Type</TableHead>
                          <TableHead className="text-xs font-bold py-4 px-4 tracking-wide text-white w-[15%] hover:bg-transparent">Date</TableHead>
                          <TableHead className="text-xs font-bold py-4 px-4 tracking-wide text-white w-[9%] hover:bg-transparent">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedBookings.map((booking, index) => {
                          const isExpanded = expandedRows.has(booking._id);
                          const statusInfo = getStatusInfo(booking.status);
                          const isEven = index % 2 === 0;
                          const paymentStatus = booking.billing?.partyType === 'sender' ? 'paid' : 'unpaid';
                          
                          return (
                            <React.Fragment key={booking._id}>
                              <TableRow className={cn(
                                "h-14 border-b",
                                isEven
                                  ? "bg-white border-gray-200"
                                  : "bg-gray-100 border-gray-200"
                              )}>
                                <TableCell className="font-bold text-sm py-4 px-4 text-gray-900">
                                  {booking.consignmentNumber || booking.bookingReference}
                                </TableCell>
                                <TableCell className="text-sm py-4 px-4">
                                  <div>
                                    <div className="font-bold text-xs text-gray-900">{booking.origin.name}</div>
                                    <div className="text-xs mt-0.5 text-gray-600">{booking.origin.city}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm py-4 px-4">
                                  <div>
                                    <div className="font-bold text-xs text-gray-900">{booking.destination.name}</div>
                                    <div className="text-xs mt-0.5 text-gray-600">{booking.destination.city}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 px-4">
                                  <Badge 
                                    variant={statusInfo.variant}
                                    className={cn(
                                      statusInfo.bgColor,
                                      statusInfo.color,
                                      statusInfo.hoverBgColor,
                                      "border border-white/30 text-xs px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md bg-opacity-90 font-semibold"
                                    )}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      {statusInfo.icon}
                                      <span className="capitalize">
                                        {booking.status.replace('_', ' ')}
                                      </span>
                                    </span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4 px-4">
                                  <Badge 
                                    variant={paymentStatus === 'paid' ? 'default' : 'secondary'}
                                    className={cn(
                                      "text-xs px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md font-semibold",
                                      paymentStatus === 'paid'
                                        ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40 hover:!bg-gradient-to-br hover:!from-green-100/90 hover:!to-emerald-100/90"
                                        : "bg-gradient-to-br from-red-100/90 to-rose-100/90 text-red-800 border border-red-200/40 hover:!bg-gradient-to-br hover:!from-red-100/90 hover:!to-rose-100/90"
                                    )}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      {paymentStatus === 'paid' ? (
                                        <CheckCircle className="h-3.5 w-3.5" />
                                      ) : (
                                        <AlertCircle className="h-3.5 w-3.5" />
                                      )}
                                      <span className="capitalize">{paymentStatus}</span>
                                    </span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4 px-4">
                                  <Badge 
                                    variant={booking.billing?.partyType === 'sender' ? 'default' : 'secondary'}
                                    className={cn(
                                      "text-xs px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md font-semibold",
                                      booking.billing?.partyType === 'sender'
                                        ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40 hover:!bg-gradient-to-br hover:!from-green-100/90 hover:!to-emerald-100/90"
                                        : "bg-gradient-to-br from-blue-100/90 to-cyan-100/90 text-blue-800 border border-blue-200/40 hover:!bg-gradient-to-br hover:!from-blue-100/90 hover:!to-cyan-100/90"
                                    )}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      {booking.billing?.partyType === 'sender' ? (
                                        <CheckCircle className="h-3.5 w-3.5" />
                                      ) : (
                                        <Clock className="h-3.5 w-3.5" />
                                      )}
                                      <span>{booking.billing?.partyType === 'sender' ? 'FP' : 'TP'}</span>
                                    </span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs py-4 px-4 text-gray-600">
                                  {formatDate(booking.createdAt)}
                                </TableCell>
                                <TableCell className="py-4 px-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleRowExpansion(booking._id)}
                                    className="h-8 w-8 p-0 rounded-xl backdrop-blur-sm border shadow-lg bg-white/60 border-gray-200/40"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-700" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-700" />
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                              
                              {/* Expanded Row - Premium Glassmorphism */}
                              {isExpanded && (
                                <TableRow className="bg-transparent">
                                  <TableCell colSpan={8} className="p-0">
                                    <div className="relative overflow-hidden">
                                      <div className="p-4 space-y-3 relative z-10">
                                        {/* All 4 Detail Boxes in Single Row - Premium Styled */}
                                        {renderDetailCards(booking)}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              {filteredBookings.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t text-sm border-gray-200 text-gray-600">
                  <div>
                    Showing {filteredBookings.length === 0 ? 0 : startIndex + 1}-
                    {Math.min(startIndex + paginatedBookings.length, filteredBookings.length)} of {filteredBookings.length} shipments
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={safeCurrentPage === 1}
                      className="h-8 px-3 rounded-lg border-gray-200 text-gray-700 disabled:text-gray-400"
                    >
                      Previous
                    </Button>
                    <span className="font-medium text-gray-700">
                      Page {safeCurrentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={safeCurrentPage === totalPages}
                      className="h-8 px-3 rounded-lg border-gray-200 text-gray-700 disabled:text-gray-400"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MedicineShipment;
