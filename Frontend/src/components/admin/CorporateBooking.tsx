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
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStoredToken } from '@/utils/auth';
import { cn } from '@/lib/utils';

interface ShipmentData {
  _id: string;
  bookingReference: string;
  consignmentNumber?: number;
  originData: {
    name: string;
    companyName: string;
    mobileNumber: string;
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
    addressType: string;
  };
  destinationData: {
    name: string;
    companyName: string;
    mobileNumber: string;
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
    addressType: string;
  };
  shipmentData: {
    natureOfConsignment: string;
    services: string;
    mode: string;
    actualWeight: string;
    totalPackages: string;
    materials: string;
    description: string;
    specialInstructions: string;
  };
  invoiceData: {
    calculatedPrice: number;
    gst: number;
    finalPrice: number;
    serviceType: string;
    location: string;
    transportMode: string;
    chargeableWeight: string;
  };
  status: string;
  currentStatus?: string;
  paymentStatus: 'paid' | 'unpaid';
  paymentType: 'FP' | 'TP';
  bookingDate: string;
  pickupDate?: string;
  deliveryDate?: string;
  trackingUpdates: Array<{
    status: string;
    location: string;
    timestamp: string;
    description: string;
  }>;
}

interface CorporateGroup {
  corporate: {
    _id: string;
    corporateId: string;
    companyName: string;
    email: string;
    contactNumber: string;
  };
  bookings: ShipmentData[];
}

const CorporateBooking: React.FC = () => {
  const [corporateGroups, setCorporateGroups] = useState<CorporateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedCorporates, setExpandedCorporates] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Load corporate bookings data
  useEffect(() => {
    const fetchCorporateBookings = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/admin/corporate-bookings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch corporate bookings');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch corporate bookings');
        }
        
        if (!data.data || !Array.isArray(data.data)) {
          console.error('Invalid response structure:', data);
          throw new Error('Invalid response format from server');
        }
        
        console.log(`📦 Fetched ${data.data.length} corporate groups with ${data.totalBookings} total bookings`);
        
        // Expand all corporates by default
        const allCorporateIds = new Set<string>(data.data.map((group: CorporateGroup) => group.corporate._id));
        setExpandedCorporates(allCorporateIds);
        
        setCorporateGroups(data.data);
      } catch (error) {
        console.error('Error fetching corporate bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load corporate bookings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCorporateBookings();
  }, [toast]);

  // Filter bookings based on search, status, payment status, and month
  const filterBookings = (bookings: ShipmentData[]) => {
    return bookings.filter(booking => {
      const matchesSearch = 
        booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.originData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destinationData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.originData?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destinationData?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.originData?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destinationData?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Use currentStatus from Tracking table if available, otherwise fall back to status
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

  // Get filtered corporate groups
  const filteredCorporateGroups = corporateGroups.map(group => ({
    ...group,
    bookings: filterBookings(group.bookings)
  })).filter(group => group.bookings.length > 0);

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

  // Toggle corporate expansion
  const toggleCorporateExpansion = (corporateId: string) => {
    const newExpandedCorporates = new Set(expandedCorporates);
    if (newExpandedCorporates.has(corporateId)) {
      newExpandedCorporates.delete(corporateId);
    } else {
      newExpandedCorporates.add(corporateId);
    }
    setExpandedCorporates(newExpandedCorporates);
  };

  // Get status badge variant and icon - handles all Tracking table status values
  const getStatusInfo = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'booked';
    
    switch (normalizedStatus) {
      case 'booked':
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
      case 'reached-hub':
        return {
          variant: 'default' as const,
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
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

  // Calculate total bookings count
  const totalBookingsCount = filteredCorporateGroups.reduce((sum, group) => sum + group.bookings.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl animate-pulse bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20"></div>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 relative z-10" />
        </div>
        <span className="ml-3 font-medium text-gray-600">Loading corporate bookings...</span>
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
                  placeholder="Search by reference, name, company, or city..."
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

      {/* Corporate Bookings Table - Premium Glassmorphism */}
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
              <Building2 className="h-5 w-5 relative z-10 text-blue-600" />
            </div>
            Corporate Bookings ({totalBookingsCount} bookings across {filteredCorporateGroups.length} corporates)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative z-10">
          {filteredCorporateGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-500">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl animate-pulse bg-gradient-to-r from-blue-500/20 via-purple-500/15 to-indigo-500/20"></div>
                <div className="absolute inset-0 rounded-full blur-xl bg-white/20"></div>
                <Package className="h-10 w-10 relative z-10 text-gray-400" />
              </div>
              <span className="font-semibold text-sm text-gray-600">No bookings found</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-200/50">
              {filteredCorporateGroups.map((group) => {
                const isCorporateExpanded = expandedCorporates.has(group.corporate._id);
                
                return (
                  <div key={group.corporate._id} className="bg-white/50 backdrop-blur-sm">
                    {/* Corporate Header - Premium Styled */}
                    <div 
                      className="group relative backdrop-blur-md px-4 py-4 border-b border-gray-200/50 cursor-pointer transition-all duration-300 bg-gradient-to-r from-gray-50/80 via-blue-50/40 to-indigo-50/80 hover:from-blue-50/90 hover:via-indigo-50/60 hover:to-purple-50/90 hover:shadow-lg"
                      onClick={() => toggleCorporateExpansion(group.corporate._id)}
                    >
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-indigo-500/10"></div>
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 rounded-lg hover:bg-blue-500/20 hover:scale-110 transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCorporateExpansion(group.corporate._id);
                            }}
                          >
                            {isCorporateExpanded ? (
                              <ChevronDown className="h-4 w-4 text-blue-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-blue-600" />
                            )}
                          </Button>
                          <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-sm"></div>
                            <Building2 className="h-5 w-5 relative z-10 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-base">{group.corporate.companyName}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              ID: {group.corporate.corporateId} | {group.corporate.email} | {group.bookings.length} bookings
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-blue-200/60 shadow-md hover:shadow-lg transition-all duration-300">
                          {group.bookings.length} {group.bookings.length === 1 ? 'booking' : 'bookings'}
                        </Badge>
                      </div>
                    </div>

                    {/* Corporate Bookings Table */}
                    {isCorporateExpanded && (
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
                              <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Type</TableHead>
                              <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Amount</TableHead>
                              <TableHead className="text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Date</TableHead>
                              <TableHead className="w-16 text-xs font-bold relative z-10 py-4 px-4 tracking-wide text-gray-800">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.bookings.map((booking) => {
                              const isExpanded = expandedRows.has(booking._id);
                              // Use currentStatus from Tracking table if available, otherwise fall back to status
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
                                        <div className="font-bold text-xs relative z-10 text-gray-900">{booking.originData?.name || 'N/A'}</div>
                                        <div className="text-xs relative z-10 mt-0.5 text-gray-600">{booking.originData?.city || 'N/A'}</div>
                                        <div className="absolute -inset-1 bg-blue-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm relative z-10 py-4 px-4">
                                      <div className="relative">
                                        <div className="font-bold text-xs relative z-10 text-gray-900">{booking.destinationData?.name || 'N/A'}</div>
                                        <div className="text-xs relative z-10 mt-0.5 text-gray-600">{booking.destinationData?.city || 'N/A'}</div>
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
                                    <TableCell className="relative z-10 py-4 px-4">
                                      <Badge 
                                        variant={booking.paymentType === 'FP' ? 'default' : 'secondary'}
                                        className={cn(
                                          "text-xs px-3 py-1.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-md font-semibold",
                                          booking.paymentType === 'FP'
                                            ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40"
                                            : "bg-gradient-to-br from-blue-100/90 to-cyan-100/90 text-blue-800 border border-blue-200/40"
                                        )}
                                      >
                                        <span className="flex items-center gap-1.5">
                                          <span className="relative">
                                            {booking.paymentType === 'FP' ? (
                                              <CheckCircle className="h-3.5 w-3.5" />
                                            ) : (
                                              <Clock className="h-3.5 w-3.5" />
                                            )}
                                            <span className="absolute inset-0 bg-white/20 rounded-full blur-sm"></span>
                                          </span>
                                          <span>{booking.paymentType}</span>
                                        </span>
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold text-sm relative z-10 py-4 px-4 text-gray-900">
                                      <div className="relative">
                                        <span className="relative z-10">₹{booking.invoiceData?.finalPrice?.toFixed(2) || '0.00'}</span>
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
                                      <TableCell colSpan={10} className="p-0">
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
                                                  <div className="text-gray-700"><strong className="text-gray-800">Name:</strong> {booking.originData?.name || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Mobile:</strong> +91 {booking.originData?.mobileNumber || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Address:</strong> {booking.originData?.flatBuilding || ''}, {booking.originData?.locality || ''}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">City:</strong> {booking.originData?.city || 'N/A'}, {booking.originData?.state || 'N/A'} - {booking.originData?.pincode || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">GST:</strong> {booking.originData?.gstNumber || 'N/A'}</div>
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
                                                  <div className="text-gray-700"><strong className="text-gray-800">Name:</strong> {booking.destinationData?.name || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Mobile:</strong> +91 {booking.destinationData?.mobileNumber || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Address:</strong> {booking.destinationData?.flatBuilding || ''}, {booking.destinationData?.locality || ''}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">City:</strong> {booking.destinationData?.city || 'N/A'}, {booking.destinationData?.state || 'N/A'} - {booking.destinationData?.pincode || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">GST:</strong> {booking.destinationData?.gstNumber || 'N/A'}</div>
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
                                                  <div className="text-gray-700"><strong className="text-gray-800">Nature:</strong> {booking.shipmentData?.natureOfConsignment || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Service:</strong> {booking.shipmentData?.services || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Mode:</strong> {booking.shipmentData?.mode || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Weight:</strong> {booking.shipmentData?.actualWeight || 'N/A'} kg</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Packages:</strong> {booking.shipmentData?.totalPackages || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Description:</strong> {booking.shipmentData?.description || 'N/A'}</div>
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
                                                  <div className="text-gray-700"><strong className="text-gray-800">Service Type:</strong> {booking.invoiceData?.serviceType || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Location Zone:</strong> {booking.invoiceData?.location || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Transport Mode:</strong> {booking.invoiceData?.transportMode || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Base Price:</strong> ₹{booking.invoiceData?.calculatedPrice?.toFixed(2) || '0.00'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">GST (18%):</strong> ₹{booking.invoiceData?.gst?.toFixed(2) || '0.00'}</div>
                                                  <div className="font-bold text-xs text-purple-700"><strong>Total:</strong> ₹{booking.invoiceData?.finalPrice?.toFixed(2) || '0.00'}</div>
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
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CorporateBooking;