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
  Warehouse,
  Pill,
  Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStoredToken } from '@/utils/auth';
import { cn } from '@/lib/utils';

// Unified booking interface
interface UnifiedBooking {
  _id: string;
  bookingReference: string;
  consignmentNumber?: number;
  source: 'customer' | 'medicine' | 'corporate';
  origin: {
    name: string;
    companyName?: string;
    mobileNumber: string;
    email?: string;
    locality?: string;
    flatBuilding?: string;
    landmark?: string;
    pincode: string;
    area?: string;
    city: string;
    district?: string;
    state: string;
    gstNumber?: string;
    addressType?: string;
  };
  destination: {
    name: string;
    companyName?: string;
    mobileNumber: string;
    email?: string;
    locality?: string;
    flatBuilding?: string;
    landmark?: string;
    pincode: string;
    area?: string;
    city: string;
    district?: string;
    state: string;
    gstNumber?: string;
    addressType?: string;
  };
  shipment: {
    natureOfConsignment?: string;
    weight?: string;
    actualWeight?: string;
    packagesCount?: string;
    totalPackages?: string;
    materials?: string;
    description?: string;
    declaredValue?: string;
  };
  serviceType?: string;
  calculatedPrice?: number;
  basePrice?: number;
  gstAmount?: number;
  pickupCharge?: number;
  totalAmount?: number;
  charges?: {
    grandTotal?: string;
    total?: string;
  };
  actualWeight?: number;
  chargeableWeight?: number;
  status: string;
  currentStatus?: string;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  paymentMethod?: string;
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
}

const AllBookings: React.FC = () => {
  const [bookings, setBookings] = useState<UnifiedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  // Load all bookings from three sources
  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch from all sources in parallel
        const [customerResponse, medicineResponse, corporateResponse] = await Promise.all([
          fetch('/api/admin/customer-bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/medicine/bookings?limit=1000', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/corporate-bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const allBookings: UnifiedBooking[] = [];

        // Process customer bookings
        if (customerResponse.ok) {
          const customerData = await customerResponse.json();
          if (customerData.success && Array.isArray(customerData.data)) {
            const transformed = customerData.data.map((booking: any) => ({
              _id: booking._id,
              bookingReference: booking.bookingReference || booking.consignmentNumber?.toString() || '',
              consignmentNumber: booking.consignmentNumber,
              source: 'customer' as const,
              origin: booking.origin || {},
              destination: booking.destination || {},
              shipment: booking.shipment || {},
              serviceType: booking.serviceType,
              calculatedPrice: booking.calculatedPrice,
              basePrice: booking.basePrice,
              gstAmount: booking.gstAmount,
              pickupCharge: booking.pickupCharge,
              totalAmount: booking.totalAmount,
              actualWeight: booking.actualWeight,
              chargeableWeight: booking.chargeableWeight,
              status: booking.status || 'booked',
              currentStatus: booking.currentStatus || booking.status,
              paymentStatus: booking.paymentStatus === 'paid' ? 'paid' : 'unpaid',
              paymentMethod: booking.paymentMethod,
              bookingDate: booking.bookingDate || booking.createdAt,
              createdAt: booking.createdAt,
              updatedAt: booking.updatedAt,
            }));
            allBookings.push(...transformed);
          }
        }

        // Process medicine bookings
        if (medicineResponse.ok) {
          const medicineData = await medicineResponse.json();
          if (medicineData.success && Array.isArray(medicineData.bookings)) {
            const transformed = medicineData.bookings.map((booking: any) => ({
              _id: booking._id,
              bookingReference: booking.bookingReference || booking.consignmentNumber?.toString() || '',
              consignmentNumber: booking.consignmentNumber,
              source: 'medicine' as const,
              origin: booking.origin || {},
              destination: booking.destination || {},
              shipment: {
                natureOfConsignment: booking.shipment?.natureOfConsignment,
                actualWeight: booking.shipment?.actualWeight,
                totalPackages: booking.package?.totalPackages,
                materials: booking.package?.materials,
                description: booking.package?.contentDescription,
              },
              serviceType: booking.shipment?.services,
              totalAmount: booking.charges?.grandTotal ? parseFloat(booking.charges.grandTotal) : undefined,
              charges: booking.charges,
              status: booking.status || 'booked',
              currentStatus: booking.status,
              paymentStatus: booking.payment?.mode ? 'paid' : 'unpaid',
              paymentMethod: booking.payment?.mode,
              bookingDate: booking.createdAt,
              createdAt: booking.createdAt,
              updatedAt: booking.updatedAt,
            }));
            allBookings.push(...transformed);
          }
        }

        // Process corporate bookings (includes tracking data)
        if (corporateResponse.ok) {
          const corporateData = await corporateResponse.json();
          if (corporateData.success && Array.isArray(corporateData.data)) {
            // Flatten grouped corporate bookings
            const transformed = corporateData.data.flatMap((group: any) => 
              group.bookings.map((booking: any) => ({
                _id: booking._id,
                bookingReference: booking.bookingReference || booking.consignmentNumber?.toString() || '',
                consignmentNumber: booking.consignmentNumber,
                source: 'corporate' as const,
                origin: booking.originData ? {
                  name: booking.originData.name || '',
                  companyName: booking.originData.companyName,
                  mobileNumber: booking.originData.mobileNumber || '',
                  email: booking.originData.email,
                  locality: booking.originData.locality,
                  flatBuilding: booking.originData.flatBuilding,
                  landmark: booking.originData.landmark,
                  pincode: booking.originData.pincode || '',
                  area: booking.originData.area,
                  city: booking.originData.city || '',
                  district: booking.originData.district,
                  state: booking.originData.state || '',
                  gstNumber: booking.originData.gstNumber,
                  addressType: booking.originData.addressType,
                } : {},
                destination: booking.destinationData ? {
                  name: booking.destinationData.name || '',
                  companyName: booking.destinationData.companyName,
                  mobileNumber: booking.destinationData.mobileNumber || '',
                  email: booking.destinationData.email,
                  locality: booking.destinationData.locality,
                  flatBuilding: booking.destinationData.flatBuilding,
                  landmark: booking.destinationData.landmark,
                  pincode: booking.destinationData.pincode || '',
                  area: booking.destinationData.area,
                  city: booking.destinationData.city || '',
                  district: booking.destinationData.district,
                  state: booking.destinationData.state || '',
                  gstNumber: booking.destinationData.gstNumber,
                  addressType: booking.destinationData.addressType,
                } : {},
                shipment: booking.shipmentData || {},
                totalAmount: booking.invoiceData?.finalPrice || 0,
                status: booking.currentStatus || booking.status || 'booked',
                currentStatus: booking.currentStatus || booking.status,
                paymentStatus: booking.paymentStatus === 'paid' ? 'paid' : 'unpaid',
                paymentMethod: booking.paymentType,
                bookingDate: booking.bookingDate,
                createdAt: booking.bookingDate,
                updatedAt: booking.bookingDate,
              }))
            );
            allBookings.push(...transformed);
          }
        }

        // Sort by date (newest first)
        allBookings.sort((a, b) => {
          const dateA = new Date(a.bookingDate || a.createdAt).getTime();
          const dateB = new Date(b.bookingDate || b.createdAt).getTime();
          return dateB - dateA;
        });

        console.log(`📦 Fetched ${allBookings.length} total bookings (Customer: ${allBookings.filter(b => b.source === 'customer').length}, Medicine: ${allBookings.filter(b => b.source === 'medicine').length}, Corporate: ${allBookings.filter(b => b.source === 'corporate').length})`);
        
        setBookings(allBookings);
      } catch (error) {
        console.error('Error fetching all bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load bookings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllBookings();
  }, [toast]);

  // Filter bookings
  const filterBookings = (bookings: UnifiedBooking[]) => {
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
      const matchesSource = sourceFilter === 'all' || booking.source === sourceFilter;
      
      // Month filtering
      let matchesMonth = true;
      if (monthFilter !== 'all') {
        const bookingDate = new Date(booking.bookingDate || booking.createdAt);
        const bookingMonth = bookingDate.getMonth() + 1;
        matchesMonth = bookingMonth.toString() === monthFilter;
      }
      
      return matchesSearch && matchesStatus && matchesPayment && matchesSource && matchesMonth;
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
  }, [searchTerm, statusFilter, paymentFilter, sourceFilter, monthFilter]);

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
      case 'arrived at hub':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-100'
        };
      case 'arrived':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'courierboy':
        return {
          variant: 'default' as const,
          icon: <User className="h-4 w-4" />,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100'
        };
      case 'assigned':
        return {
          variant: 'default' as const,
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        };
      case 'in_transit':
        return {
          variant: 'default' as const,
          icon: <Package className="h-4 w-4" />,
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
      case 'completed':
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

  // Get source badge
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'customer':
        return { label: 'Customer', color: 'bg-blue-100 text-blue-800', icon: <User className="h-3 w-3" /> };
      case 'medicine':
        return { label: 'Medicine', color: 'bg-purple-100 text-purple-800', icon: <Pill className="h-3 w-3" /> };
      case 'corporate':
        return { label: 'Corporate', color: 'bg-teal-100 text-teal-800', icon: <Building2 className="h-3 w-3" /> };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: <Package className="h-3 w-3" /> };
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
        <span className="ml-3 font-medium text-gray-600">Loading all bookings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30"></div>
      
      {/* Filters */}
      <Card className="border-0 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden relative bg-white/70">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
        
        <CardContent className="p-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2 min-w-0">
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
            <div className="w-full">
              <Label htmlFor="source-filter" className="text-xs font-semibold mb-1.5 block text-gray-700">
                Source
              </Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-200/60">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl rounded-xl shadow-2xl bg-white/95">
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Label htmlFor="status-filter" className="text-xs font-semibold mb-1.5 block text-gray-700">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-200/60">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl rounded-xl shadow-2xl bg-white/95">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="picked">Picked</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="arrived">Arrived</SelectItem>
                  <SelectItem value="arrived at hub">Arrived at Hub</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="reached-hub">Reached Hub</SelectItem>
                  <SelectItem value="courierboy">Courier Boy</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="ofp">OFP</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Label htmlFor="payment-filter" className="text-xs font-semibold mb-1.5 block text-gray-700">
                Payment
              </Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-200/60">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl rounded-xl shadow-2xl bg-white/95">
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Label htmlFor="month-filter" className="text-xs font-semibold mb-1.5 block text-gray-700">
                Month
              </Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-200/60">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl rounded-xl shadow-2xl bg-white/95">
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="border-0 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden relative bg-white/70">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
        
        <CardHeader className="backdrop-blur-sm border-b py-4 relative z-10 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-white/20">
          <CardTitle className="flex items-center gap-2 text-lg font-bold relative z-10 text-gray-800">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-md bg-blue-500/20"></div>
              <ShoppingBag className="h-5 w-5 relative z-10 text-blue-600" />
            </div>
            All Bookings ({filteredBookings.length} bookings) - Page {currentPage} of {totalPages || 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative z-10">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-500">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl animate-pulse bg-gradient-to-r from-blue-500/20 via-purple-500/15 to-indigo-500/20"></div>
                <Package className="h-10 w-10 relative z-10 text-gray-400" />
              </div>
              <span className="font-semibold text-sm text-gray-600">No bookings found</span>
            </div>
          ) : (
            <div className="overflow-x-auto relative">
              <Table className="relative">
                <TableHeader>
                  <TableRow className="backdrop-blur-md border-b shadow-lg relative bg-gradient-to-r from-slate-50/90 via-blue-50/50 to-indigo-50/50 border-white/30">
                    <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800 w-12">#</TableHead>
                    <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Source</TableHead>
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
                    const sourceBadge = getSourceBadge(booking.source);
                    
                    return (
                      <React.Fragment key={booking._id}>
                        <TableRow className="h-14 backdrop-blur-md border-b transition-all duration-500 group relative bg-white/50 border-white/20 hover:bg-gradient-to-r hover:from-blue-50/40 hover:via-indigo-50/30 hover:to-purple-50/40">
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
                          <TableCell className="relative z-10 py-4 px-4">
                            <Badge className={cn("text-xs px-2 py-1 rounded-lg flex items-center gap-1 w-fit", sourceBadge.color)}>
                              {sourceBadge.icon}
                              {sourceBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-sm relative z-10 py-4 px-4 text-gray-900">
                            {booking.consignmentNumber || booking.bookingReference}
                          </TableCell>
                          <TableCell className="text-sm relative z-10 py-4 px-4">
                            <div className="font-bold text-xs text-gray-900">{booking.origin?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-600">{booking.origin?.city || 'N/A'}</div>
                          </TableCell>
                          <TableCell className="text-sm relative z-10 py-4 px-4">
                            <div className="font-bold text-xs text-gray-900">{booking.destination?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-600">{booking.destination?.city || 'N/A'}</div>
                          </TableCell>
                          <TableCell className="relative z-10 py-4 px-4">
                            <Badge 
                              variant={statusInfo.variant}
                              className={cn(statusInfo.bgColor, statusInfo.color, "border border-white/30 text-xs px-3 py-1.5 rounded-xl shadow-lg font-semibold flex items-center gap-1.5")}
                            >
                              {statusInfo.icon}
                              <span className="capitalize">
                                {bookingStatus.replace('_', ' ').replace('-', ' ')}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="relative z-10 py-4 px-4">
                            <Badge 
                              variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded-xl shadow-lg font-semibold",
                                booking.paymentStatus === 'paid'
                                  ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40"
                                  : "bg-gradient-to-br from-red-100/90 to-rose-100/90 text-red-800 border border-red-200/40"
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                {booking.paymentStatus === 'paid' ? (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                ) : (
                                  <AlertCircle className="h-3.5 w-3.5" />
                                )}
                                <span className="capitalize">{booking.paymentStatus}</span>
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-sm relative z-10 py-4 px-4 text-gray-900">
                            ₹{booking.totalAmount?.toFixed(2) || booking.charges?.grandTotal || '0.00'}
                          </TableCell>
                          <TableCell className="text-xs relative z-10 py-4 px-4 text-gray-600">
                            {formatDate(booking.bookingDate || booking.createdAt)}
                          </TableCell>
                          <TableCell className="relative z-10 py-4 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(booking._id)}
                              className="h-8 w-8 p-0 rounded-xl backdrop-blur-sm border hover:bg-gradient-to-br hover:to-purple-500/20 hover:shadow-lg hover:scale-110 transition-all duration-300 bg-white/60 border-gray-200/40 hover:from-blue-500/20"
                            >
                              <Eye className="h-4 w-4 text-gray-700" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      
                        {/* Expanded Row */}
                        {isExpanded && (
                          <TableRow className="bg-transparent">
                            <TableCell colSpan={10} className="p-0">
                              <div className="p-4 space-y-3 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                  {/* Origin Card */}
                                  <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg bg-white/70 border-blue-200/40">
                                    <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs text-blue-800">
                                      <MapPin className="h-3.5 w-3.5" />
                                      Origin
                                    </h4>
                                    <div className="space-y-1 text-xs">
                                      <div className="text-gray-700"><strong>Name:</strong> {booking.origin?.name || 'N/A'}</div>
                                      <div className="text-gray-700"><strong>Mobile:</strong> +91 {booking.origin?.mobileNumber || 'N/A'}</div>
                                      <div className="text-gray-700"><strong>Address:</strong> {booking.origin?.flatBuilding || ''}, {booking.origin?.locality || ''}</div>
                                      <div className="text-gray-700"><strong>City:</strong> {booking.origin?.city || 'N/A'}, {booking.origin?.state || 'N/A'} - {booking.origin?.pincode || 'N/A'}</div>
                                      {booking.origin?.gstNumber && (
                                        <div className="text-gray-700"><strong>GST:</strong> {booking.origin.gstNumber}</div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Destination Card */}
                                  <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg bg-white/70 border-green-200/40">
                                    <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs text-green-800">
                                      <Truck className="h-3.5 w-3.5" />
                                      Destination
                                    </h4>
                                    <div className="space-y-1 text-xs">
                                      <div className="text-gray-700"><strong>Name:</strong> {booking.destination?.name || 'N/A'}</div>
                                      <div className="text-gray-700"><strong>Mobile:</strong> +91 {booking.destination?.mobileNumber || 'N/A'}</div>
                                      <div className="text-gray-700"><strong>Address:</strong> {booking.destination?.flatBuilding || ''}, {booking.destination?.locality || ''}</div>
                                      <div className="text-gray-700"><strong>City:</strong> {booking.destination?.city || 'N/A'}, {booking.destination?.state || 'N/A'} - {booking.destination?.pincode || 'N/A'}</div>
                                      {booking.destination?.gstNumber && (
                                        <div className="text-gray-700"><strong>GST:</strong> {booking.destination.gstNumber}</div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Shipment Card */}
                                  <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg bg-white/70 border-orange-200/40">
                                    <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs text-orange-800">
                                      <Package className="h-3.5 w-3.5" />
                                      Shipment
                                    </h4>
                                    <div className="space-y-1 text-xs">
                                      <div className="text-gray-700"><strong>Nature:</strong> {booking.shipment?.natureOfConsignment || 'N/A'}</div>
                                      <div className="text-gray-700"><strong>Service:</strong> {booking.serviceType || 'N/A'}</div>
                                      <div className="text-gray-700"><strong>Weight:</strong> {booking.shipment?.weight || booking.shipment?.actualWeight || booking.actualWeight || 'N/A'} kg</div>
                                      <div className="text-gray-700"><strong>Packages:</strong> {booking.shipment?.packagesCount || booking.shipment?.totalPackages || 'N/A'}</div>
                                      {booking.shipment?.materials && (
                                        <div className="text-gray-700"><strong>Materials:</strong> {booking.shipment.materials}</div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Invoice Card */}
                                  <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-purple-50/80 border-purple-200/60">
                                    <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs text-purple-800">
                                      <DollarSign className="h-3.5 w-3.5" />
                                      Invoice
                                    </h4>
                                    <div className="space-y-1 text-xs">
                                      <div className="text-gray-700"><strong>Service Type:</strong> {booking.serviceType || 'N/A'}</div>
                                      {booking.basePrice && (
                                        <div className="text-gray-700"><strong>Base Price:</strong> ₹{booking.basePrice.toFixed(2)}</div>
                                      )}
                                      {booking.gstAmount && (
                                        <div className="text-gray-700"><strong>GST:</strong> ₹{booking.gstAmount.toFixed(2)}</div>
                                      )}
                                      {booking.pickupCharge && booking.pickupCharge > 0 && (
                                        <div className="text-gray-700"><strong>Pickup Charge:</strong> ₹{booking.pickupCharge.toFixed(2)}</div>
                                      )}
                                      <div className="font-bold text-xs text-purple-700"><strong>Total:</strong> ₹{booking.totalAmount?.toFixed(2) || booking.charges?.grandTotal || '0.00'}</div>
                                      <div className="text-gray-700"><strong>Payment Method:</strong> {booking.paymentMethod || 'N/A'}</div>
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

export default AllBookings;
