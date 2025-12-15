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
  User,
  Pill,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStoredToken } from '@/utils/auth';
import { cn } from '@/lib/utils';

interface MedicineBookingData {
  _id: string;
  bookingReference: string;
  consignmentNumber?: number;
  medicineUserId?: string | {
    _id: string;
    name: string;
    email: string;
  };
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
    services?: string;
    mode?: string;
    actualWeight: string;
    volumetricWeight?: number;
    chargeableWeight?: number;
  };
  package: {
    totalPackages: string;
    materials?: string;
    contentDescription?: string;
  };
  invoice: {
    invoiceNumber: string;
    invoiceValue: string;
  };
  charges?: {
    grandTotal?: string;
    total?: string;
  };
  billing?: {
    partyType: 'sender' | 'recipient';
    gst?: string;
    billType?: string;
  };
  payment?: {
    mode?: string;
    deliveryType?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface MedicineUserGroup {
  medicineUser: {
    _id: string;
    name?: string;
    email?: string;
  };
  bookings: MedicineBookingData[];
}

const MedicineBookingOverview: React.FC = () => {
  const [medicineUserGroups, setMedicineUserGroups] = useState<MedicineUserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  // Load medicine bookings data
  useEffect(() => {
    const fetchMedicineBookings = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch with high limit to get all bookings
        const response = await fetch('/api/admin/medicine/bookings?limit=1000', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch medicine bookings');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch medicine bookings');
        }
        
        if (!data.bookings || !Array.isArray(data.bookings)) {
          console.error('Invalid response structure:', data);
          throw new Error('Invalid response format from server');
        }
        
        console.log(`💊 Fetched ${data.bookings.length} medicine bookings`);
        
        // Group bookings by medicineUserId
        const groupedByUser: Map<string, MedicineUserGroup> = new Map();
        
        data.bookings.forEach((booking: MedicineBookingData) => {
          const userId = booking.medicineUserId 
            ? (typeof booking.medicineUserId === 'string' 
                ? booking.medicineUserId 
                : booking.medicineUserId._id)
            : 'unknown';
          
          if (!groupedByUser.has(userId)) {
            groupedByUser.set(userId, {
              medicineUser: {
                _id: userId,
                name: typeof booking.medicineUserId === 'object' ? booking.medicineUserId.name : 'Unknown User',
                email: typeof booking.medicineUserId === 'object' ? booking.medicineUserId.email : ''
              },
              bookings: []
            });
          }
          
          groupedByUser.get(userId)!.bookings.push(booking);
        });
        
        const groupsArray = Array.from(groupedByUser.values());
        
        // Expand all users by default
        const allUserIds = new Set<string>(groupsArray.map(group => group.medicineUser._id));
        setExpandedUsers(allUserIds);
        
        setMedicineUserGroups(groupsArray);
      } catch (error) {
        console.error('Error fetching medicine bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load medicine bookings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMedicineBookings();
  }, [toast]);

  // Filter bookings based on search, status, payment status, and month
  const filterBookings = (bookings: MedicineBookingData[]) => {
    return bookings.filter(booking => {
      const matchesSearch = 
        booking.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.consignmentNumber?.toString().includes(searchTerm.toLowerCase()) ||
        booking.origin?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destination?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destination?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.origin?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destination?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || booking.status?.toLowerCase() === statusFilter.toLowerCase();
      
      // Payment filtering - check billing partyType (deliveryPayment doesn't exist in MedicineBooking model)
      let matchesPayment = true;
      if (paymentFilter !== 'all') {
        if (paymentFilter === 'paid') {
          matchesPayment = booking.billing?.partyType === 'sender';
        } else if (paymentFilter === 'unpaid') {
          matchesPayment = booking.billing?.partyType === 'recipient';
        }
      }
      
      // Month filtering (use createdAt as bookingDate doesn't exist in MedicineBooking model)
      let matchesMonth = true;
      if (monthFilter !== 'all') {
        const bookingDate = new Date(booking.createdAt);
        const bookingMonth = bookingDate.getMonth() + 1;
        matchesMonth = bookingMonth.toString() === monthFilter;
      }
      
      return matchesSearch && matchesStatus && matchesPayment && matchesMonth;
    });
  };

  // Get filtered medicine user groups
  const filteredMedicineUserGroups = medicineUserGroups.map(group => ({
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

  // Toggle user expansion
  const toggleUserExpansion = (userId: string) => {
    const newExpandedUsers = new Set(expandedUsers);
    if (newExpandedUsers.has(userId)) {
      newExpandedUsers.delete(userId);
    } else {
      newExpandedUsers.add(userId);
    }
    setExpandedUsers(newExpandedUsers);
  };

  // Get status badge variant and icon
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
      case 'assigned':
      case 'in_transit':
      case 'reached-hub':
        return {
          variant: 'default' as const,
          icon: <Package className="h-4 w-4" />,
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
  const totalBookingsCount = filteredMedicineUserGroups.reduce((sum, group) => sum + group.bookings.length, 0);

  // Flatten all bookings from all groups for pagination
  interface BookingWithUser extends MedicineBookingData {
    medicineUserInfo: {
      _id: string;
      name?: string;
      email?: string;
    };
  }

  const allBookings: BookingWithUser[] = filteredMedicineUserGroups.flatMap(group => 
    group.bookings.map(booking => ({
      ...booking,
      medicineUserInfo: group.medicineUser
    }))
  );

  // Paginate bookings
  const totalPages = Math.ceil(allBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = allBookings.slice(startIndex, endIndex);

  // Re-group paginated bookings by user
  const paginatedGroups: MedicineUserGroup[] = [];
  const userGroupsMap = new Map<string, MedicineBookingData[]>();

  paginatedBookings.forEach(booking => {
    const userId = booking.medicineUserInfo._id;
    if (!userGroupsMap.has(userId)) {
      userGroupsMap.set(userId, []);
    }
    // Extract booking data without the medicineUserInfo for storage
    const { medicineUserInfo, ...bookingData } = booking;
    userGroupsMap.get(userId)!.push(bookingData);
  });

  userGroupsMap.forEach((bookings, userId) => {
    const userInfo = paginatedBookings.find(b => b.medicineUserInfo._id === userId)?.medicineUserInfo;
    if (userInfo) {
      paginatedGroups.push({
        medicineUser: userInfo,
        bookings
      });
    }
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, monthFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl animate-pulse bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-pink-500/20"></div>
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 relative z-10" />
        </div>
        <span className="ml-3 font-medium text-gray-600">Loading medicine bookings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-br from-purple-50/30 via-indigo-50/20 to-pink-50/30"></div>
      
      {/* Filters - Premium Glassmorphism */}
      <Card className="border-0 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden relative bg-white/70">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 pointer-events-none"></div>
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        <CardContent className="p-4 relative z-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 min-w-0">
              <Label htmlFor="search" className="text-sm font-medium mb-1.5 block text-purple-600">
                Search Bookings <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Search by reference, consignment, name, company, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 pl-3 h-9 text-sm rounded-lg focus:outline-none focus:ring-0 transition-all duration-200 relative z-10 bg-white border-purple-600 focus:border-purple-600"
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
                <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-200/60 hover:shadow-md hover:border-purple-300/60 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl rounded-xl shadow-2xl bg-white/95 border-gray-200/60">
                  <SelectItem value="all" className="text-gray-500 text-xs">All Status</SelectItem>
                  <SelectItem value="booked" className="text-gray-500 text-xs">Booked</SelectItem>
                  <SelectItem value="picked" className="text-gray-500 text-xs">Picked</SelectItem>
                  <SelectItem value="received" className="text-gray-500 text-xs">Received</SelectItem>
                  <SelectItem value="arrived" className="text-gray-500 text-xs">Arrived</SelectItem>
                  <SelectItem value="arrived at hub" className="text-gray-500 text-xs">Arrived at Hub</SelectItem>
                  <SelectItem value="assigned" className="text-gray-500 text-xs">Assigned</SelectItem>
                  <SelectItem value="in_transit" className="text-gray-500 text-xs">In Transit</SelectItem>
                  <SelectItem value="reached-hub" className="text-gray-500 text-xs">Reached Hub</SelectItem>
                  <SelectItem value="out_for_delivery" className="text-gray-500 text-xs">Out for Delivery</SelectItem>
                  <SelectItem value="delivered" className="text-gray-500 text-xs">Delivered</SelectItem>
                  <SelectItem value="cancelled" className="text-gray-500 text-xs">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-40 flex-shrink-0">
              <Label htmlFor="payment-filter" className="text-xs font-semibold mb-1.5 block text-gray-700">
                Payment
              </Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-200/60 hover:shadow-md hover:border-purple-300/60 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20">
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
                <SelectTrigger className="mt-0 h-9 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 bg-white/60 border-gray-200/60 hover:shadow-md hover:border-purple-300/60 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20">
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

      {/* Medicine Bookings Table - Premium Glassmorphism */}
      <Card className="border-0 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden relative bg-white/70">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5"></div>
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10"></div>
        
        <CardHeader className="backdrop-blur-sm border-b py-4 relative z-10 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 border-white/20">
          <div className="absolute inset-0 opacity-50 bg-gradient-to-r from-purple-500/10 to-indigo-500/10"></div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold relative z-10 text-gray-800">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-md bg-purple-500/20"></div>
              <Pill className="h-5 w-5 relative z-10 text-purple-600" />
            </div>
            Medicine Bookings ({totalBookingsCount} bookings across {filteredMedicineUserGroups.length} users) - Page {currentPage} of {totalPages || 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative z-10">
          {paginatedGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-500">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl animate-pulse bg-gradient-to-r from-purple-500/20 via-indigo-500/15 to-pink-500/20"></div>
                <div className="absolute inset-0 rounded-full blur-xl bg-white/20"></div>
                <Package className="h-10 w-10 relative z-10 text-gray-400" />
              </div>
              <span className="font-semibold text-sm text-gray-600">No bookings found</span>
            </div>
          ) : (
            <>
            <div className="divide-y divide-gray-200/50">
              {paginatedGroups.map((group) => {
                const isUserExpanded = expandedUsers.has(group.medicineUser._id);
                
                return (
                  <div key={group.medicineUser._id} className="bg-white/50 backdrop-blur-sm">
                    {/* Medicine User Header - Premium Styled */}
                    <div 
                      className="group relative backdrop-blur-md px-4 py-4 border-b border-gray-200/50 cursor-pointer transition-all duration-300 bg-gradient-to-r from-gray-50/80 via-purple-50/40 to-indigo-50/80 hover:from-purple-50/90 hover:via-indigo-50/60 hover:to-pink-50/90 hover:shadow-lg"
                      onClick={() => toggleUserExpansion(group.medicineUser._id)}
                    >
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-pink-500/10"></div>
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 rounded-lg hover:bg-purple-500/20 hover:scale-110 transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUserExpansion(group.medicineUser._id);
                            }}
                          >
                            {isUserExpanded ? (
                              <ChevronDown className="h-4 w-4 text-purple-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-purple-600" />
                            )}
                          </Button>
                          <div className="relative">
                            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-sm"></div>
                            <Pill className="h-5 w-5 relative z-10 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-base">
                              {group.medicineUser.name || 'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {group.medicineUser.email || group.medicineUser._id} | {group.bookings.length} bookings
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-purple-200/60 shadow-md hover:shadow-lg transition-all duration-300">
                          {group.bookings.length} {group.bookings.length === 1 ? 'booking' : 'bookings'}
                        </Badge>
                      </div>
                    </div>

                    {/* Medicine Bookings Table */}
                    {isUserExpanded && (
                      <div className="overflow-x-auto relative">
                        {/* Premium table shadow overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-purple-500/5 pointer-events-none"></div>
                        <Table className="relative">
                          <TableHeader>
                            <TableRow className="backdrop-blur-md border-b shadow-lg relative bg-gradient-to-r from-slate-50/90 via-purple-50/50 to-indigo-50/50 border-white/30 shadow-purple-500/5">
                              {/* Premium gradient overlay */}
                              <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-purple-500/8 via-indigo-500/5 to-pink-500/8"></div>
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
                              const statusInfo = getStatusInfo(booking.status);
                              
                              // Determine payment status (deliveryPayment doesn't exist in MedicineBooking model)
                              // Use billing partyType: sender = paid (FP), recipient = unpaid (TP)
                              const paymentStatus = booking.billing?.partyType === 'sender' ? 'paid' : 'unpaid';
                              const paymentType = booking.billing?.partyType === 'sender' ? 'FP' : 'TP';
                              
                              // Get total amount from charges
                              const totalAmount = parseFloat(booking.charges?.grandTotal || booking.charges?.total || '0');
                              
                              return (
                                <React.Fragment key={booking._id}>
                                  <TableRow className="h-14 backdrop-blur-md border-b transition-all duration-500 group relative bg-white/50 border-white/20 hover:bg-gradient-to-r hover:from-purple-50/40 hover:via-indigo-50/30 hover:to-pink-50/40 hover:shadow-xl hover:shadow-purple-500/15 hover:border-purple-200/30">
                                    {/* Premium glow effect on hover */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg bg-gradient-to-r from-purple-500/0 via-purple-500/8 to-indigo-500/0"></div>
                                    {/* Subtle depth shadow */}
                                    <div className="absolute inset-0 shadow-inner pointer-events-none shadow-gray-900/5"></div>
                                    {/* Shine effect on hover */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-b from-white/30 to-transparent"></div>
                                    
                                    <TableCell className="p-2 relative z-10">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleRowExpansion(booking._id)}
                                        className="h-7 w-7 p-0 rounded-lg hover:bg-purple-500/20 hover:scale-110 transition-all duration-300"
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="h-3.5 w-3.5 text-purple-600" />
                                        ) : (
                                          <ChevronRight className="h-3.5 w-3.5 text-purple-600" />
                                        )}
                                      </Button>
                                    </TableCell>
                                    <TableCell className="font-bold text-sm relative z-10 py-4 px-4 text-gray-900">
                                      <div className="relative">
                                        <span className="relative z-10">{booking.consignmentNumber || booking.bookingReference}</span>
                                        <div className="absolute -inset-1 bg-purple-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm relative z-10 py-4 px-4">
                                      <div className="relative">
                                        <div className="font-bold text-xs relative z-10 text-gray-900">{booking.origin?.name || 'N/A'}</div>
                                        <div className="text-xs relative z-10 mt-0.5 text-gray-600">{booking.origin?.city || 'N/A'}</div>
                                        <div className="absolute -inset-1 bg-purple-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm relative z-10 py-4 px-4">
                                      <div className="relative">
                                        <div className="font-bold text-xs relative z-10 text-gray-900">{booking.destination?.name || 'N/A'}</div>
                                        <div className="text-xs relative z-10 mt-0.5 text-gray-600">{booking.destination?.city || 'N/A'}</div>
                                        <div className="absolute -inset-1 bg-pink-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
                                            {booking.status.replace('_', ' ').replace('-', ' ')}
                                          </span>
                                        </span>
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="relative z-10 py-4 px-4">
                                      <Badge 
                                        variant={paymentStatus === 'paid' ? 'default' : 'secondary'}
                                        className={cn(
                                          "text-xs px-3 py-1.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-md font-semibold",
                                          paymentStatus === 'paid'
                                            ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40"
                                            : "bg-gradient-to-br from-red-100/90 to-rose-100/90 text-red-800 border border-red-200/40"
                                        )}
                                      >
                                        <span className="flex items-center gap-1.5">
                                          <span className="relative">
                                            {paymentStatus === 'paid' ? (
                                              <CheckCircle className="h-3.5 w-3.5" />
                                            ) : (
                                              <AlertCircle className="h-3.5 w-3.5" />
                                            )}
                                            <span className="absolute inset-0 bg-white/20 rounded-full blur-sm"></span>
                                          </span>
                                          <span className="capitalize">{paymentStatus}</span>
                                        </span>
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="relative z-10 py-4 px-4">
                                      <Badge 
                                        variant={paymentType === 'FP' ? 'default' : 'secondary'}
                                        className={cn(
                                          "text-xs px-3 py-1.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-md font-semibold",
                                          paymentType === 'FP'
                                            ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40"
                                            : "bg-gradient-to-br from-blue-100/90 to-cyan-100/90 text-blue-800 border border-blue-200/40"
                                        )}
                                      >
                                        <span className="flex items-center gap-1.5">
                                          <span className="relative">
                                            {paymentType === 'FP' ? (
                                              <CheckCircle className="h-3.5 w-3.5" />
                                            ) : (
                                              <Clock className="h-3.5 w-3.5" />
                                            )}
                                            <span className="absolute inset-0 bg-white/20 rounded-full blur-sm"></span>
                                          </span>
                                          <span>{paymentType}</span>
                                        </span>
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold text-sm relative z-10 py-4 px-4 text-gray-900">
                                      <div className="relative">
                                        <span className="relative z-10">₹{totalAmount.toFixed(2)}</span>
                                        <div className="absolute -inset-1 bg-green-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs relative z-10 py-4 px-4 text-gray-600">
                                      <div className="relative">
                                        <span className="relative z-10">{formatDate(booking.createdAt)}</span>
                                        <div className="absolute -inset-1 bg-gray-500/5 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="relative z-10 py-4 px-4">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleRowExpansion(booking._id)}
                                        className="h-8 w-8 p-0 rounded-xl backdrop-blur-sm border hover:bg-gradient-to-br hover:to-purple-500/20 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-110 transition-all duration-300 group/btn bg-white/60 border-gray-200/40 hover:from-purple-500/20 hover:border-purple-300/60"
                                      >
                                        <div className="relative">
                                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-indigo-500/30 rounded-xl blur-md opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                                          <Eye className="h-4 w-4 relative z-10 transition-colors duration-300 text-gray-700 group-hover/btn:text-purple-700" />
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
                                              <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/70 border-purple-200/40 hover:shadow-purple-500/20">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl"></div>
                                                <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs relative z-10 text-purple-800">
                                                  <div className="relative">
                                                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-sm"></div>
                                                    <MapPin className="h-3.5 w-3.5 relative z-10" />
                                                  </div>
                                                  Origin
                                                </h4>
                                                <div className="space-y-1 text-xs relative z-10">
                                                  <div className="text-gray-700"><strong className="text-gray-800">Name:</strong> {booking.origin?.name || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Mobile:</strong> +91 {booking.origin?.mobileNumber || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Address:</strong> {booking.origin?.flatBuilding || ''}, {booking.origin?.locality || ''}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">City:</strong> {booking.origin?.city || 'N/A'}, {booking.origin?.state || 'N/A'} - {booking.origin?.pincode || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">GST:</strong> {booking.origin?.gstNumber || 'N/A'}</div>
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
                                                  <div className="text-gray-700"><strong className="text-gray-800">GST:</strong> {booking.destination?.gstNumber || 'N/A'}</div>
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
                                                  <div className="text-gray-700"><strong className="text-gray-800">Service:</strong> {booking.shipment?.services || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Mode:</strong> {booking.shipment?.mode || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Weight:</strong> {booking.shipment?.actualWeight || 'N/A'} kg</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Packages:</strong> {booking.package?.totalPackages || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Description:</strong> {booking.package?.contentDescription || 'N/A'}</div>
                                                </div>
                                              </div>

                                              {/* Invoice Card */}
                                              <div className="group relative backdrop-blur-xl rounded-xl p-3 border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-indigo-50/80 border-indigo-200/60 hover:shadow-indigo-500/20">
                                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl"></div>
                                                <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs relative z-10 text-indigo-800">
                                                  <div className="relative">
                                                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-sm"></div>
                                                    <DollarSign className="h-3.5 w-3.5 relative z-10" />
                                                  </div>
                                                  Invoice
                                                </h4>
                                                <div className="space-y-1 text-xs relative z-10">
                                                  <div className="text-gray-700"><strong className="text-gray-800">Invoice #:</strong> {booking.invoice?.invoiceNumber || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Invoice Value:</strong> ₹{booking.invoice?.invoiceValue || '0.00'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Billing Type:</strong> {booking.billing?.partyType || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">GST:</strong> {booking.billing?.gst || 'N/A'}</div>
                                                  <div className="text-gray-700"><strong className="text-gray-800">Payment Mode:</strong> {booking.payment?.mode || 'N/A'}</div>
                                                  <div className="font-bold text-xs text-indigo-700"><strong>Total:</strong> ₹{totalAmount.toFixed(2)}</div>
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalBookingsCount)} of {totalBookingsCount} bookings
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-3 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
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
                              ? "bg-purple-600 hover:bg-purple-700 text-white"
                              : "hover:bg-purple-50 hover:border-purple-300"
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
                    className="h-8 px-3 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicineBookingOverview;
