import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Package,
  Truck,
  MapPin,
  DollarSign,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  ShoppingBag,
  Warehouse
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStoredToken } from '@/utils/auth';
import { cn } from '@/lib/utils';

interface CustomerBookingData {
  _id: string;
  bookingReference: string;
  consignmentNumber?: number;
  origin: {
    name: string;
    companyName?: string;
    mobileNumber: string;
    email: string;
    locality: string;
    flatBuilding: string;
    landmark: string;
    pincode: string;
    area?: string;
    city: string;
    district: string;
    state: string;
    gstNumber: string;
    addressType: string;
  };
  destination: {
    name: string;
    companyName?: string;
    mobileNumber: string;
    email: string;
    locality: string;
    flatBuilding: string;
    landmark: string;
    pincode: string;
    area?: string;
    city: string;
    district: string;
    state: string;
    gstNumber: string;
    addressType: string;
  };
  shipment: {
    natureOfConsignment: string;
    insurance?: string;
    riskCoverage?: string;
    packagesCount?: string;
    materials?: string;
    description?: string;
    declaredValue?: string;
    weight?: string;
    length?: string;
    width?: string;
    height?: string;
  };
  packageImages?: string[];
  serviceType: string;
  calculatedPrice: number;
  basePrice: number;
  gstAmount: number;
  pickupCharge: number;
  totalAmount: number;
  actualWeight?: number;
  chargeableWeight?: number;
  status: string;
  currentStatus?: string;
  paymentStatus: 'paid' | 'unpaid';
  paymentMethod: string;
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
  onlineCustomerId?: string;
}

const CustomerBookingOverview: React.FC = () => {
  const [bookings, setBookings] = useState<CustomerBookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  // Load customer bookings data
  useEffect(() => {
    const fetchCustomerBookings = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/admin/customer-bookings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch customer bookings');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch customer bookings');
        }
        
        if (!data.data || !Array.isArray(data.data)) {
          console.error('Invalid response structure:', data);
          throw new Error('Invalid response format from server');
        }
        
        console.log(`📦 Fetched ${data.data.length} customer bookings`);
        
        setBookings(data.data);
      } catch (error) {
        console.error('Error fetching customer bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load customer bookings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerBookings();
  }, [toast]);

  // Filter bookings based on search, status, payment status, and month
  const filterBookings = (bookings: CustomerBookingData[]) => {
    return bookings.filter(booking => {
      const matchesSearch = 
        booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.consignmentNumber?.toString().includes(searchTerm.toLowerCase()) ||
        booking.origin?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destination?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destination?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.origin?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destination?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const bookingStatus = booking.currentStatus || booking.status;
      const matchesStatus = statusFilter === 'all' || bookingStatus === statusFilter;
      const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
      
      // Month filtering
      let matchesMonth = true;
      if (monthFilter !== 'all') {
        const bookingDate = new Date(booking.bookingDate);
        const bookingMonth = bookingDate.getMonth() + 1;
        matchesMonth = bookingMonth.toString() === monthFilter;
      }
      
      return matchesSearch && matchesStatus && matchesPayment && matchesMonth;
    });
  };

  // Get filtered bookings
  const filteredBookings = filterBookings(bookings);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, monthFilter]);

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
    const normalizedStatus = status?.toLowerCase() || 'booked';
    
    switch (normalizedStatus) {
      case 'booked':
      case 'confirmed':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-4 w-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
      case 'picked':
      case 'picked_up':
        return {
          variant: 'default' as const,
          icon: <Truck className="h-4 w-4" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        };
      case 'received':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-100'
        };
      case 'courierboy':
        return {
          variant: 'default' as const,
          icon: <User className="h-4 w-4" />,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100'
        };
      case 'assigned':
      case 'in_transit':
        return {
          variant: 'default' as const,
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        };
      case 'reached-hub':
        return {
          variant: 'default' as const,
          icon: <Warehouse className="h-4 w-4" />,
          color: 'text-teal-600',
          bgColor: 'bg-teal-100'
        };
      case 'out_for_delivery':
      case 'ofp':
        return {
          variant: 'default' as const,
          icon: <Truck className="h-4 w-4" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        };
      case 'delivered':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'cancelled':
        return {
          variant: 'destructive' as const,
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      case 'returned':
        return {
          variant: 'destructive' as const,
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-4 w-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl animate-pulse bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20"></div>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 relative z-10" />
        </div>
        <span className="ml-3 font-medium text-gray-600">Loading customer bookings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30"></div>
      
      {/* Filters - Premium Glassmorphism */}
      <Card className="border-0 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden relative bg-white/70">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        <CardContent className="p-4 relative z-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 min-w-0">
              <Label htmlFor="search" className="text-sm font-medium mb-1.5 block text-blue-600">
                Search Bookings <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Search by reference, consignment, name, company, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 pl-3 h-9 text-sm rounded-lg focus:outline-none focus:ring-0 transition-all duration-200 relative z-10 bg-white border-blue-600 focus:border-blue-600"
                />
                <div className="absolute right-0 top-0 bottom-0 rounded-r-lg px-3 flex items-center justify-center z-10 pointer-events-none bg-black">
                  <Search className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="w-full md:w-40 flex-shrink-0">
              <Label htmlFor="status-filter" className="text-xs font-semibold mb-1.5 block text-gray-700">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-200/60 hover:shadow-md hover:border-blue-300/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl rounded-xl shadow-2xl bg-white/95 border-gray-200/60">
                  <SelectItem value="all" className="text-gray-500 text-xs">All Status</SelectItem>
                  <SelectItem value="booked" className="text-gray-500 text-xs">Booked</SelectItem>
                  <SelectItem value="confirmed" className="text-gray-500 text-xs">Confirmed</SelectItem>
                  <SelectItem value="picked" className="text-gray-500 text-xs">Picked</SelectItem>
                  <SelectItem value="received" className="text-gray-500 text-xs">Received</SelectItem>
                  <SelectItem value="assigned" className="text-gray-500 text-xs">Assigned</SelectItem>
                  <SelectItem value="courierboy" className="text-gray-500 text-xs">Courier Boy</SelectItem>
                  <SelectItem value="in_transit" className="text-gray-500 text-xs">In Transit</SelectItem>
                  <SelectItem value="reached-hub" className="text-gray-500 text-xs">Reached Hub</SelectItem>
                  <SelectItem value="out_for_delivery" className="text-gray-500 text-xs">Out for Delivery</SelectItem>
                  <SelectItem value="ofp" className="text-gray-500 text-xs">OFP</SelectItem>
                  <SelectItem value="delivered" className="text-gray-500 text-xs">Delivered</SelectItem>
                  <SelectItem value="cancelled" className="text-gray-500 text-xs">Cancelled</SelectItem>
                  <SelectItem value="returned" className="text-gray-500 text-xs">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-40 flex-shrink-0">
              <Label htmlFor="payment-filter" className="text-xs font-semibold mb-1.5 block text-gray-700">
                Payment
              </Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-200/60 hover:shadow-md hover:border-blue-300/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl rounded-xl shadow-2xl bg-white/95 border-gray-200/60">
                  <SelectItem value="all" className="text-gray-500 text-xs">All Payments</SelectItem>
                  <SelectItem value="paid" className="text-gray-500 text-xs">Paid</SelectItem>
                  <SelectItem value="unpaid" className="text-gray-500 text-xs">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-40 flex-shrink-0">
              <Label htmlFor="month-filter" className="text-xs font-semibold mb-1.5 block text-gray-700">
                Month
              </Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-200/60 hover:shadow-md hover:border-blue-300/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20">
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
        </CardContent>
      </Card>

      {/* Customer Bookings Table - Premium Glassmorphism */}
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
              <ShoppingBag className="h-5 w-5 relative z-10 text-blue-600" />
            </div>
            Customer Bookings ({filteredBookings.length} bookings) - Page {currentPage} of {totalPages || 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative z-10">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-500">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl animate-pulse bg-gradient-to-r from-blue-500/20 via-purple-500/15 to-indigo-500/20"></div>
                <div className="absolute inset-0 rounded-full blur-xl bg-white/20"></div>
                <Package className="h-10 w-10 relative z-10 text-gray-400" />
              </div>
              <span className="font-semibold text-sm text-gray-600">No bookings found</span>
            </div>
          ) : (
            <div className="overflow-x-auto relative">
              {/* Premium table shadow overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-500/5 pointer-events-none"></div>
              <Table className="relative">
                <TableHeader>
                  <TableRow className="backdrop-blur-md border-b shadow-lg relative bg-gradient-to-r from-slate-50/90 via-blue-50/50 to-indigo-50/50 border-white/30 shadow-blue-500/5">
                    {/* Premium gradient overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-blue-500/8 via-purple-500/5 to-indigo-500/8"></div>
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/40 to-transparent"></div>
                    
                    <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800 w-12">#</TableHead>
                    <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Consignment</TableHead>
                    <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Origin</TableHead>
                    <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Destination</TableHead>
                    <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Status</TableHead>
                    <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Payment</TableHead>
                    <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Amount</TableHead>
                    <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Date</TableHead>
                    <TableHead className="w-16 text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((booking) => {
                    const isExpanded = expandedRows.has(booking._id);
                    const bookingStatus = booking.currentStatus || booking.status;
                    const statusInfo = getStatusInfo(bookingStatus);
                    
                    return (
                      <React.Fragment key={booking._id}>
                        <TableRow className="h-14 backdrop-blur-md border-b transition-all duration-500 group relative bg-white/50 border-white/20 hover:bg-gradient-to-r hover:from-blue-50/40 hover:via-indigo-50/30 hover:to-purple-50/40 hover:shadow-xl hover:shadow-blue-500/15 hover:border-blue-200/30">
                          {/* Premium glow effect on hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg bg-gradient-to-r from-blue-500/0 via-blue-500/8 to-purple-500/0"></div>
                          {/* Subtle depth shadow */}
                          <div className="absolute inset-0 shadow-inner pointer-events-none shadow-gray-900/5"></div>
                          {/* Shine effect on hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-b from-white/30 to-transparent"></div>
                          
                          <TableCell className="p-2 relative z-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(booking._id)}
                              className="h-7 w-7 p-0 rounded-lg hover:bg-blue-500/20 hover:scale-110 transition-all duration-300"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-blue-600" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-bold text-sm relative z-10 py-4 px-4 text-gray-900">
                            <div className="relative">
                              <span className="relative z-10">{booking.consignmentNumber || booking.bookingReference}</span>
                              <div className="absolute -inset-1 bg-blue-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm relative z-10 py-4 px-4">
                            <div className="relative">
                              <div className="font-bold text-xs relative z-10 text-gray-900">{booking.origin?.name || 'N/A'}</div>
                              <div className="text-xs relative z-10 mt-0.5 text-gray-600">{booking.origin?.city || 'N/A'}</div>
                              <div className="absolute -inset-1 bg-blue-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm relative z-10 py-4 px-4">
                            <div className="relative">
                              <div className="font-bold text-xs relative z-10 text-gray-900">{booking.destination?.name || 'N/A'}</div>
                              <div className="text-xs relative z-10 mt-0.5 text-gray-600">{booking.destination?.city || 'N/A'}</div>
                              <div className="absolute -inset-1 bg-purple-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                          </TableCell>
                          <TableCell className="relative z-10 py-4 px-4">
                            <Badge 
                              variant={statusInfo.variant}
                              className={`${statusInfo.bgColor} ${statusInfo.color} border border-white/30 text-xs px-3 py-1.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-md bg-opacity-90 font-semibold`}
                            >
                              <span className="relative z-10 flex items-center gap-1.5">
                                <span className="relative">
                                  {statusInfo.icon}
                                  <span className="absolute inset-0 bg-white/20 rounded-full blur-sm"></span>
                                </span>
                                <span className="capitalize">
                                  {bookingStatus.replace('_', ' ').replace('-', ' ')}
                                </span>
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="relative z-10 py-4 px-4">
                            <Badge 
                              variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-md font-semibold",
                                booking.paymentStatus === 'paid'
                                  ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40"
                                  : "bg-gradient-to-br from-red-100/90 to-rose-100/90 text-red-800 border border-red-200/40"
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="relative">
                                  {booking.paymentStatus === 'paid' ? (
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5" />
                                  )}
                                  <span className="absolute inset-0 bg-white/20 rounded-full blur-sm"></span>
                                </span>
                                <span className="capitalize">{booking.paymentStatus}</span>
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-sm relative z-10 py-4 px-4 text-gray-900">
                            <div className="relative">
                              <span className="relative z-10">₹{booking.totalAmount?.toFixed(2) || '0.00'}</span>
                              <div className="absolute -inset-1 bg-green-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs relative z-10 py-4 px-4 text-gray-600">
                            <div className="relative">
                              <span className="relative z-10">{formatDate(booking.bookingDate)}</span>
                              <div className="absolute -inset-1 bg-gray-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                          </TableCell>
                          <TableCell className="relative z-10 py-4 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(booking._id)}
                              className="h-8 w-8 p-0 rounded-xl backdrop-blur-sm border hover:bg-gradient-to-br hover:to-purple-500/20 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-110 transition-all duration-300 group/btn bg-white/60 border-gray-200/40 hover:from-blue-500/20 hover:border-blue-300/60"
                            >
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl blur-md opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                                <Eye className="h-4 w-4 relative z-10 transition-colors duration-300 text-gray-700 group-hover/btn:text-blue-700" />
                              </div>
                            </Button>
                          </TableCell>
                        </TableRow>
                      
                        {/* Expanded Row - Premium Glassmorphism */}
                        {isExpanded && (
                          <TableRow className="bg-transparent">
                            <TableCell colSpan={9} className="p-0">
                              <div className="relative overflow-hidden">
                                <div className="p-4 space-y-3 relative z-10">
                                  {/* All 4 Detail Boxes in Single Row - Premium Styled */}
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
                                        <div className="text-gray-700"><strong className="text-gray-800">Name:</strong> {booking.origin?.name || 'N/A'}</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">Mobile:</strong> +91 {booking.origin?.mobileNumber || 'N/A'}</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">Address:</strong> {booking.origin?.flatBuilding || ''}, {booking.origin?.locality || ''}</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">City:</strong> {booking.origin?.city || 'N/A'}, {booking.origin?.state || 'N/A'} - {booking.origin?.pincode || 'N/A'}</div>
                                        {booking.origin?.gstNumber && (
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
                                          <Truck className="h-3.5 w-3.5 relative z-10" />
                                        </div>
                                        Destination
                                      </h4>
                                      <div className="space-y-1 text-xs relative z-10">
                                        <div className="text-gray-700"><strong className="text-gray-800">Name:</strong> {booking.destination?.name || 'N/A'}</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">Mobile:</strong> +91 {booking.destination?.mobileNumber || 'N/A'}</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">Address:</strong> {booking.destination?.flatBuilding || ''}, {booking.destination?.locality || ''}</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">City:</strong> {booking.destination?.city || 'N/A'}, {booking.destination?.state || 'N/A'} - {booking.destination?.pincode || 'N/A'}</div>
                                        {booking.destination?.gstNumber && (
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
                                          <Package className="h-3.5 w-3.5 relative z-10" />
                                        </div>
                                        Shipment
                                      </h4>
                                      <div className="space-y-1 text-xs relative z-10">
                                        <div className="text-gray-700"><strong className="text-gray-800">Nature:</strong> {booking.shipment?.natureOfConsignment || 'N/A'}</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">Service:</strong> {booking.serviceType || 'N/A'}</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">Weight:</strong> {booking.shipment?.weight || booking.actualWeight || 'N/A'} kg</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">Packages:</strong> {booking.shipment?.packagesCount || 'N/A'}</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">Materials:</strong> {booking.shipment?.materials || 'N/A'}</div>
                                        {booking.shipment?.description && (
                                          <div className="text-gray-700"><strong className="text-gray-800">Description:</strong> {booking.shipment.description}</div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Invoice Card */}
                                    <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-purple-50/80 border-purple-200/60 hover:shadow-purple-500/20">
                                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                      <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
                                      <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs relative z-10 text-purple-800">
                                        <div className="relative">
                                          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-sm"></div>
                                          <DollarSign className="h-3.5 w-3.5 relative z-10" />
                                        </div>
                                        Invoice
                                      </h4>
                                      <div className="space-y-1 text-xs relative z-10">
                                        <div className="text-gray-700"><strong className="text-gray-800">Service Type:</strong> {booking.serviceType || 'N/A'}</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">Base Price:</strong> ₹{booking.basePrice?.toFixed(2) || '0.00'}</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">GST:</strong> ₹{booking.gstAmount?.toFixed(2) || '0.00'}</div>
                                        {booking.pickupCharge > 0 && (
                                          <div className="text-gray-700"><strong className="text-gray-800">Pickup Charge:</strong> ₹{booking.pickupCharge?.toFixed(2) || '0.00'}</div>
                                        )}
                                        <div className="font-bold text-xs text-purple-700"><strong>Total:</strong> ₹{booking.totalAmount?.toFixed(2) || '0.00'}</div>
                                        <div className="text-gray-700"><strong className="text-gray-800">Payment Method:</strong> {booking.paymentMethod || 'N/A'}</div>
                                      </div>
                                    </div>
                                  </div>
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
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 p-0 rounded-lg transition-all duration-200 ${
                          currentPage === pageNum
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "hover:bg-blue-50 hover:border-blue-300"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerBookingOverview;
