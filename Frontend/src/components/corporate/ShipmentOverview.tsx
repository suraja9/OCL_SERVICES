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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Package,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Phone,
  Building,
  FileText,
  Receipt,
  Scale
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  status: 'booked' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid';
  paymentType: 'FP' | 'TP'; // FP = Freight Paid, TP = To Pay
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

interface ShipmentOverviewProps {
  isDarkMode?: boolean;
}

// Map tracking status from database to component status format
// This should match the normalizeStatus function in ActiveCorporateDashboard
const mapTrackingStatusToComponentStatus = (trackingStatus: string | undefined | null): ShipmentData['status'] => {
  if (!trackingStatus) return 'booked';
  
  const normalized = trackingStatus.trim().toLowerCase();
  
  const statusMap: Record<string, ShipmentData['status']> = {
    'booked': 'booked',
    'picked': 'picked_up',
    'pickup': 'picked_up',
    'picked_up': 'picked_up',
    'received': 'picked_up',
    'received_at_ocl': 'picked_up',
    'assigned': 'in_transit',
    'courierboy': 'in_transit',
    'in_transit': 'in_transit',
    'intransit': 'in_transit',
    'reached-hub': 'in_transit',
    'assigned_completed': 'in_transit',
    'ofp': 'out_for_delivery',
    'OFP': 'out_for_delivery',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'returned': 'cancelled',
    'pending': 'booked',
    'completed': 'delivered'
  };
  
  return statusMap[normalized] || 'booked';
};

const ShipmentOverview: React.FC<ShipmentOverviewProps> = ({ isDarkMode = false }) => {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  const getTimeValue = (dateString?: string) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const mergeShipments = (existing: ShipmentData[], incoming: ShipmentData[] = []) => {
    if (!incoming.length && !existing.length) return [];

    const shipmentMap = new Map<string, ShipmentData>();

    [...existing, ...incoming].forEach((shipment) => {
      if (!shipment) return;
      const key = shipment._id || shipment.bookingReference;
      if (!key) return;
      shipmentMap.set(key, {
        ...shipment,
        bookingDate: shipment.bookingDate || new Date().toISOString(),
      });
    });

    return Array.from(shipmentMap.values()).sort(
      (a, b) => getTimeValue(b.bookingDate) - getTimeValue(a.bookingDate)
    );
  };

  const loadLocalShipments = () => {
    try {
      const localData = localStorage.getItem('corporateBookings');
      if (!localData) return [];

      const localBookings = JSON.parse(localData);
      if (!Array.isArray(localBookings)) return [];

      return localBookings.map((booking: any, index: number) => {
        // Use same transformation logic as API bookings
        const baseTrackingUpdates = Array.isArray(booking?.trackingUpdates) && booking.trackingUpdates.length > 0
          ? booking.trackingUpdates
          : Array.isArray(booking.bookingData?.trackingUpdates) && booking.bookingData.trackingUpdates.length > 0
            ? booking.bookingData.trackingUpdates
            : [];

        const latestTrackingStatus = baseTrackingUpdates.length > 0
          ? baseTrackingUpdates[baseTrackingUpdates.length - 1]?.status
          : undefined;

        const derivedStatus = latestTrackingStatus
          || booking?.currentStatus
          || booking?.status
          || booking.bookingData?.currentStatus
          || booking.bookingData?.status
          || 'booked';

        const mappedStatus = mapTrackingStatusToComponentStatus(derivedStatus);

        const bookingDate = booking?.usedAt 
          || booking?.bookingDate 
          || booking?.createdAt 
          || booking?.updatedAt
          || booking.bookingData?.bookingDate
          || booking.bookingData?.createdAt
          || new Date().toISOString();

        return {
          _id: booking._id || booking.bookingReference || `local-${index}-${Date.now()}`,
          bookingReference: booking.bookingReference || booking.bookingData?.bookingReference,
          consignmentNumber: booking.consignmentNumber || booking.bookingData?.consignmentNumber,
          originData: booking.originData || booking.bookingData?.originData || {},
          destinationData: booking.destinationData || booking.bookingData?.destinationData || {},
          shipmentData: booking.shipmentData || booking.bookingData?.shipmentData || {},
          invoiceData: booking.invoiceData || booking.bookingData?.invoiceData || {
            calculatedPrice: 0,
            gst: 0,
            finalPrice: 0,
            serviceType: '',
            location: '',
            transportMode: '',
            chargeableWeight: '',
          },
          status: mappedStatus,
          paymentStatus: booking.paymentStatus || booking.paymentData?.paymentStatus || 'unpaid',
          paymentType: booking.paymentData?.paymentType || booking.paymentType || 'FP',
          bookingDate: bookingDate,
          pickupDate: booking.pickupDate || booking.bookingData?.shipmentData?.pickupDate,
          deliveryDate: booking.deliveryDate || booking.bookingData?.shipmentData?.deliveryDate,
          trackingUpdates: baseTrackingUpdates.length > 0 ? baseTrackingUpdates.map((update: any) => ({
            status: update.status || mappedStatus,
            location: update.location || booking.originData?.city || booking.bookingData?.originData?.city || 'Unknown',
            timestamp: update.timestamp || update.updatedAt || update.createdAt || bookingDate,
            description: update.description || update.notes || `Status: ${update.status || mappedStatus}`
          })) : [
            {
              status: mappedStatus,
              location: booking.originData?.city || booking.bookingData?.originData?.city || 'Unknown',
              timestamp: bookingDate,
              description: 'Shipment booked and ready for pickup'
            }
          ]
        };
      });
    } catch (error) {
      console.error('Failed to load local shipments:', error);
      return [];
    }
  };

  const transformBookingToShipment = (booking: any): ShipmentData | null => {
    if (!booking?.bookingData) {
      console.error('Booking missing bookingData:', booking);
      return null;
    }

    const invoiceData = booking.bookingData.invoiceData || {
      calculatedPrice: 0,
      gst: 0,
      finalPrice: 0,
      serviceType: '',
      location: '',
      transportMode: '',
      chargeableWeight: '',
    };

    // Extract tracking updates - match logic from ActiveCorporateDashboard
    const baseTrackingUpdates = Array.isArray(booking?.trackingUpdates) && booking.trackingUpdates.length > 0
      ? booking.trackingUpdates
      : Array.isArray(booking.bookingData?.trackingUpdates) && booking.bookingData.trackingUpdates.length > 0
        ? booking.bookingData.trackingUpdates
        : [];

    // Derive status using same logic as ActiveCorporateDashboard:
    // latest tracking update > currentStatus > status > 'booked'
    const latestTrackingStatus = baseTrackingUpdates.length > 0
      ? baseTrackingUpdates[baseTrackingUpdates.length - 1]?.status
      : undefined;

    const derivedStatus = latestTrackingStatus
      || booking?.currentStatus
      || booking?.status
      || booking.bookingData?.currentStatus
      || booking.bookingData?.status
      || 'booked';

    const mappedStatus = mapTrackingStatusToComponentStatus(derivedStatus);

    // Use same date priority as ActiveCorporateDashboard
    const bookingDate = booking?.usedAt 
      || booking?.bookingDate 
      || booking?.createdAt 
      || booking?.updatedAt
      || booking.bookingData?.bookingDate
      || booking.bookingData?.createdAt
      || booking.bookingData?.updatedAt
      || new Date().toISOString();

    return {
      _id: booking._id?.toString?.() || booking._id || booking.bookingReference || `booking-${Date.now()}`,
      bookingReference: booking.bookingReference || booking.bookingData?.bookingReference,
      consignmentNumber: booking.consignmentNumber || booking.bookingData?.consignmentNumber,
      originData: booking.bookingData.originData || {},
      destinationData: booking.bookingData.destinationData || {},
      shipmentData: booking.bookingData.shipmentData || {},
      invoiceData,
      status: mappedStatus,
      paymentStatus: booking.paymentStatus || booking.paymentData?.paymentStatus || 'unpaid',
      paymentType: booking.paymentType || booking.paymentData?.paymentType || 'FP',
      bookingDate: bookingDate,
      pickupDate: booking.pickupDate || booking.bookingData?.shipmentData?.pickupDate,
      deliveryDate: booking.deliveryDate || booking.bookingData?.shipmentData?.deliveryDate,
      trackingUpdates: baseTrackingUpdates.length > 0 ? baseTrackingUpdates.map((update: any) => ({
        status: update.status || mappedStatus,
        location: update.location || booking.bookingData.originData?.city || 'Unknown',
        timestamp: update.timestamp || update.updatedAt || update.createdAt || bookingDate,
        description: update.description || update.notes || `Status: ${update.status || mappedStatus}`
      })) : [
        {
          status: mappedStatus,
          location: booking.bookingData.originData?.city || 'Unknown',
          timestamp: bookingDate,
          description: 'Shipment booked and ready for pickup'
        }
      ]
    };
  };

  const fetchAllShipmentsFromApi = async (token: string) => {
    const aggregatedShipments: ShipmentData[] = [];
    const limit = 50;
    const MAX_PAGES = 100; // safety guard
    let page = 1;
    let hasNext = true;

    while (hasNext && page <= MAX_PAGES) {
      const response = await fetch(`/api/corporate/bookings?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch shipments (page ${page})`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch shipments');
      }

      if (!Array.isArray(data.data)) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response format from server');
      }

      const transformed = data.data
        .map((booking: any) => transformBookingToShipment(booking))
        .filter((shipment: ShipmentData | null): shipment is ShipmentData => shipment !== null);

      aggregatedShipments.push(...transformed);

      const pagination = data.pagination;
      const expectMore = pagination?.hasNext ?? (data.data.length === limit);

      if (expectMore) {
        page += 1;
        hasNext = true;
      } else {
        hasNext = false;
      }

      if (data.data.length === 0) {
        break;
      }
    }

    if (page > MAX_PAGES) {
      console.warn('Reached max pagination limit while fetching shipments');
    }

    return aggregatedShipments;
  };

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

  // Load shipments data
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const token = localStorage.getItem('corporateToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        try {
          const apiShipments = await fetchAllShipmentsFromApi(token);
          const localShipments = loadLocalShipments();
          setShipments(() => mergeShipments([], [...localShipments, ...apiShipments]));
        } catch (apiError) {
          // If API fails, fall back to local storage
          console.log('Loading shipments from local storage');
          
          const localShipments = loadLocalShipments();
          setShipments(() => mergeShipments([], localShipments));
          
          // Silent fallback - no need to show demo message
        }
      } catch (error) {
        console.error('Error fetching shipments:', error);
        toast({
          title: "Error",
          description: "Failed to load shipments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, [toast]);

  // Filter shipments based on search, status, payment status, and month
  const filteredShipments = shipments.filter(shipment => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch = 
      (shipment.bookingReference || '').toLowerCase().includes(normalizedSearch) ||
      (shipment.originData?.name || '').toLowerCase().includes(normalizedSearch) ||
      (shipment.destinationData?.name || '').toLowerCase().includes(normalizedSearch) ||
      (shipment.originData?.city || '').toLowerCase().includes(normalizedSearch) ||
      (shipment.destinationData?.city || '').toLowerCase().includes(normalizedSearch);
    
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || shipment.paymentStatus === paymentFilter;
    
    // Month filtering
    let matchesMonth = true;
    if (monthFilter !== 'all') {
      const shipmentDate = new Date(shipment.bookingDate);
      const shipmentMonth = shipmentDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
      matchesMonth = shipmentMonth.toString() === monthFilter;
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesMonth;
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedShipments = filteredShipments.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, monthFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Toggle row expansion
  const toggleRowExpansion = (shipmentId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(shipmentId)) {
      newExpandedRows.delete(shipmentId);
    } else {
      newExpandedRows.add(shipmentId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Get status badge variant and icon
  const getStatusInfo = (status: string) => {
    if (isDarkMode) {
      switch (status) {
        case 'booked':
          return {
            variant: 'secondary' as const,
            icon: <Clock className="h-4 w-4" />,
            color: 'text-slate-300',
            bgColor: 'bg-slate-700/60',
            hoverBgColor: 'hover:!bg-slate-700/60'
          };
        case 'picked_up':
          return {
            variant: 'default' as const,
            icon: <Truck className="h-4 w-4" />,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20',
            hoverBgColor: 'hover:!bg-blue-500/20'
          };
        case 'in_transit':
          return {
            variant: 'default' as const,
            icon: <Package className="h-4 w-4" />,
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/20',
            hoverBgColor: 'hover:!bg-orange-500/20'
          };
        case 'out_for_delivery':
          return {
            variant: 'default' as const,
            icon: <Truck className="h-4 w-4" />,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/20',
            hoverBgColor: 'hover:!bg-purple-500/20'
          };
        case 'delivered':
          return {
            variant: 'default' as const,
            icon: <CheckCircle className="h-4 w-4" />,
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
            hoverBgColor: 'hover:!bg-green-500/20'
          };
        case 'cancelled':
          return {
            variant: 'destructive' as const,
            icon: <AlertCircle className="h-4 w-4" />,
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            hoverBgColor: 'hover:!bg-red-500/20'
          };
        default:
          return {
            variant: 'secondary' as const,
            icon: <Clock className="h-4 w-4" />,
            color: 'text-slate-300',
            bgColor: 'bg-slate-700/60',
            hoverBgColor: 'hover:!bg-slate-700/60'
          };
      }
    } else {
    switch (status) {
      case 'booked':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-4 w-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          hoverBgColor: 'hover:!bg-gray-100'
        };
      case 'picked_up':
        return {
          variant: 'default' as const,
          icon: <Truck className="h-4 w-4" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          hoverBgColor: 'hover:!bg-blue-100'
        };
      case 'in_transit':
        return {
          variant: 'default' as const,
          icon: <Package className="h-4 w-4" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          hoverBgColor: 'hover:!bg-orange-100'
        };
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

  const renderDetailCards = (shipment: ShipmentData) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Origin Card */}
      <div className={cn(
        "group relative backdrop-blur-xl rounded-xl p-3 border transition-all duration-300 overflow-hidden",
        isDarkMode
          ? "bg-slate-800/70 border-blue-500/30"
          : "bg-white/70 border-blue-200/40"
      )}
      style={{
        boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
      }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl"></div>
        <div className="absolute top-3 right-3 z-10">
          <div className={cn(
            "px-2 py-1 font-bold text-xs bg-white border border-gray-300",
            isDarkMode ? "text-gray-800" : "text-gray-800"
          )}>
            Origin
          </div>
        </div>
        <div className="space-y-1 text-xs relative z-10">
          <div className="flex items-center gap-1"><User className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Name:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.originData.name}</span></div>
          <div className="flex items-center gap-1"><Phone className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Mobile:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>+91 {shipment.originData.mobileNumber}</span></div>
          <div className="flex items-start gap-1"><MapPin className={cn("h-3 w-3 mt-0.5", isDarkMode ? "text-slate-200" : "text-gray-800")} /><div><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Address:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.originData.flatBuilding}, {shipment.originData.locality}</span></div></div>
          <div className="flex items-center gap-1"><Building className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>City:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.originData.city}, {shipment.originData.state} - {shipment.originData.pincode}</span></div>
          <div className="flex items-center gap-1"><FileText className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>GST:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.originData.gstNumber || 'N/A'}</span></div>
        </div>
      </div>

      {/* Destination Card */}
      <div className={cn(
        "group relative backdrop-blur-xl rounded-xl p-3 border transition-all duration-300 overflow-hidden",
        isDarkMode
          ? "bg-slate-800/70 border-green-500/30"
          : "bg-white/70 border-green-200/40"
      )}
      style={{
        boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
      }}>
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl"></div>
        <div className="absolute top-3 right-3 z-10">
          <div className={cn(
            "px-2 py-1 font-bold text-xs bg-white border border-gray-300",
            isDarkMode ? "text-gray-800" : "text-gray-800"
          )}>
            Destination
          </div>
        </div>
        <div className="space-y-1 text-xs relative z-10">
          <div className="flex items-center gap-1"><User className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Name:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.destinationData.name}</span></div>
          <div className="flex items-center gap-1"><Phone className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Mobile:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>+91 {shipment.destinationData.mobileNumber}</span></div>
          <div className="flex items-start gap-1"><MapPin className={cn("h-3 w-3 mt-0.5", isDarkMode ? "text-slate-200" : "text-gray-800")} /><div><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Address:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.destinationData.flatBuilding}, {shipment.destinationData.locality}</span></div></div>
          <div className="flex items-center gap-1"><Building className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>City:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.destinationData.city}, {shipment.destinationData.state} - {shipment.destinationData.pincode}</span></div>
          <div className="flex items-center gap-1"><FileText className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>GST:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.destinationData.gstNumber || 'N/A'}</span></div>
        </div>
      </div>

      {/* Shipment Card */}
      <div className={cn(
        "group relative backdrop-blur-xl rounded-xl p-3 border transition-all duration-300 overflow-hidden",
        isDarkMode
          ? "bg-slate-800/70 border-orange-500/30"
          : "bg-white/70 border-orange-200/40"
      )}
      style={{
        boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
      }}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl"></div>
        <div className="absolute top-3 right-3 z-10">
          <div className={cn(
            "px-2 py-1 font-bold text-xs bg-white border border-gray-300",
            isDarkMode ? "text-gray-800" : "text-gray-800"
          )}>
            Shipment
          </div>
        </div>
        <div className="space-y-1 text-xs relative z-10">
          <div className="flex items-center gap-1"><Package className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Nature:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.shipmentData.natureOfConsignment}</span></div>
          <div className="flex items-center gap-1"><Truck className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Service:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.shipmentData.services}</span></div>
          <div className="flex items-center gap-1"><Truck className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Mode:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.shipmentData.mode}</span></div>
          <div className="flex items-center gap-1"><Scale className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Weight:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.shipmentData.actualWeight} kg</span></div>
          <div className="flex items-center gap-1"><Package className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Packages:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.shipmentData.totalPackages}</span></div>
          <div className="flex items-center gap-1"><FileText className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Description:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.shipmentData.description}</span></div>
        </div>
      </div>

      {/* Invoice Card */}
      <div className={cn(
        "group relative backdrop-blur-xl rounded-xl p-3 border transition-all duration-300 overflow-hidden",
        isDarkMode
          ? "bg-gradient-to-br from-slate-800/80 via-slate-700/60 to-slate-800/80 border-purple-500/40"
          : "bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-purple-50/80 border-purple-200/60"
      )}
      style={{
        boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
      }}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-purple-500/10 opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
        <div className="absolute top-3 right-3 z-10">
          <div className={cn(
            "px-2 py-1 font-bold text-xs bg-white border border-gray-300",
            isDarkMode ? "text-gray-800" : "text-gray-800"
          )}>
            Invoice
          </div>
        </div>
        <div className="space-y-1 text-xs relative z-10">
          <div className="flex items-center gap-1"><Package className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Service Type:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.invoiceData.serviceType}</span></div>
          <div className="flex items-center gap-1"><MapPin className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Location Zone:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.invoiceData.location}</span></div>
          <div className="flex items-center gap-1"><Truck className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Transport Mode:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>{shipment.invoiceData.transportMode}</span></div>
          <div className="flex items-center gap-1"><DollarSign className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>Base Price:</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>₹{shipment.invoiceData.calculatedPrice.toFixed(2)}</span></div>
          <div className="flex items-center gap-1"><Receipt className={cn("h-3 w-3", isDarkMode ? "text-slate-200" : "text-gray-800")} /><strong className={isDarkMode ? "text-slate-200" : "text-gray-800"}>GST (18%):</strong> <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>₹{shipment.invoiceData.gst.toFixed(2)}</span></div>
          <div className="flex items-center gap-1"><DollarSign className={cn("h-3 w-3", isDarkMode ? "text-purple-300" : "text-purple-700")} /><strong className={isDarkMode ? "text-purple-300" : "text-purple-700"}>Total:</strong> <span className={isDarkMode ? "text-purple-300" : "text-purple-700"}>₹{shipment.invoiceData.finalPrice.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className={cn(
            "absolute inset-0 rounded-full blur-xl animate-pulse",
            isDarkMode
              ? "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20"
              : "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20"
          )}></div>
          <Loader2 className={cn(
            "h-8 w-8 animate-spin relative z-10",
            isDarkMode ? "text-blue-400" : "text-blue-600"
          )} />
        </div>
        <span className={cn(
          "ml-3 font-medium",
          isDarkMode ? "text-slate-300" : "text-gray-600"
        )}>Loading shipments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Ambient background gradient */}
      <div className={cn(
        "fixed inset-0 pointer-events-none -z-10",
        isDarkMode
          ? "bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50"
          : "bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30"
      )}></div>
      
      {/* Filters */}
      <div className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 min-w-0">
                <div className="relative">
                  <Input
                    id="search"
                    placeholder=" "
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className={cn(
                      "pr-12 pl-3 h-9 text-sm rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 relative z-10",
                      isDarkMode
                        ? "bg-slate-700/50 border-slate-600 text-slate-200 focus:border-blue-500"
                        : "bg-white border-gray-300 focus:border-blue-600"
                    )}
                  />
                  <Label
                    htmlFor="search"
                    className={cn(
                      "absolute left-3 transition-all duration-200 pointer-events-none z-20 bg-white px-1",
                      searchTerm || isSearchFocused
                        ? "-top-2.5 text-xs"
                        : "top-2.5 text-sm",
                      isDarkMode
                        ? searchTerm || isSearchFocused
                          ? "text-blue-400 bg-slate-800"
                          : "text-slate-400 bg-slate-800"
                        : searchTerm || isSearchFocused
                          ? "text-blue-600 bg-white"
                          : "text-gray-500 bg-white"
                    )}
                  >
                    Search Shipments <span className="text-red-500">*</span>
                  </Label>
                  <div className={cn(
                    "absolute right-0 top-0 bottom-0 rounded-r-lg px-3 flex items-center justify-center z-10 pointer-events-none",
                    isDarkMode ? "bg-blue-600" : "bg-black"
                  )}>
                    <Search className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            <div className="w-full md:w-40 flex-shrink-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={cn(
                  "mt-0 h-8 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  isDarkMode
                    ? "bg-slate-700/60 border-slate-600/60 text-slate-200 hover:shadow-md hover:border-blue-500/60 focus:border-blue-500 focus:ring-0 focus:ring-offset-0"
                    : "bg-white/60 border-gray-200/60 hover:shadow-md hover:border-blue-300/60 focus:border-blue-400 focus:ring-0 focus:ring-offset-0"
                )}>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className={cn(
                  "backdrop-blur-xl rounded-xl shadow-2xl",
                  isDarkMode
                    ? "bg-slate-800/95 border-slate-700/60"
                    : "bg-white/95 border-gray-200/60"
                )}>
                  <SelectItem value="all" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>All Status</SelectItem>
                  <SelectItem value="booked" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>Booked</SelectItem>
                  <SelectItem value="picked_up" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>Picked Up</SelectItem>
                  <SelectItem value="in_transit" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>In Transit</SelectItem>
                  <SelectItem value="out_for_delivery" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>Out for Delivery</SelectItem>
                  <SelectItem value="delivered" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>Delivered</SelectItem>
                  <SelectItem value="cancelled" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-40 flex-shrink-0">
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className={cn(
                  "mt-0 h-8 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  isDarkMode
                    ? "bg-slate-700/60 border-slate-600/60 text-slate-200 hover:shadow-md hover:border-blue-500/60 focus:border-blue-500 focus:ring-0 focus:ring-offset-0"
                    : "bg-white/60 border-gray-200/60 hover:shadow-md hover:border-blue-300/60 focus:border-blue-400 focus:ring-0 focus:ring-offset-0"
                )}>
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent className={cn(
                  "backdrop-blur-xl rounded-xl shadow-2xl",
                  isDarkMode
                    ? "bg-slate-800/95 border-slate-700/60"
                    : "bg-white/95 border-gray-200/60"
                )}>
                  <SelectItem value="all" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>All Payments</SelectItem>
                  <SelectItem value="paid" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>Paid</SelectItem>
                  <SelectItem value="unpaid" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-40 flex-shrink-0">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className={cn(
                  "mt-0 h-8 text-sm backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  isDarkMode
                    ? "bg-slate-700/60 border-slate-600/60 text-slate-200 hover:shadow-md hover:border-blue-500/60 focus:border-blue-500 focus:ring-0 focus:ring-offset-0"
                    : "bg-white/60 border-gray-200/60 hover:shadow-md hover:border-blue-300/60 focus:border-blue-400 focus:ring-0 focus:ring-offset-0"
                )}>
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent className={cn(
                  "backdrop-blur-xl rounded-xl shadow-2xl",
                  isDarkMode
                    ? "bg-slate-800/95 border-slate-700/60"
                    : "bg-white/95 border-gray-200/60"
                )}>
                  <SelectItem value="all" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>All Months</SelectItem>
                  <SelectItem value="1" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>January</SelectItem>
                  <SelectItem value="2" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>February</SelectItem>
                  <SelectItem value="3" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>March</SelectItem>
                  <SelectItem value="4" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>April</SelectItem>
                  <SelectItem value="5" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>May</SelectItem>
                  <SelectItem value="6" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>June</SelectItem>
                  <SelectItem value="7" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>July</SelectItem>
                  <SelectItem value="8" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>August</SelectItem>
                  <SelectItem value="9" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>September</SelectItem>
                  <SelectItem value="10" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>October</SelectItem>
                  <SelectItem value="11" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>November</SelectItem>
                  <SelectItem value="12" className={isDarkMode ? "text-slate-300 text-xs" : "text-gray-500 text-xs"}>December</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
      </div>

      {/* Shipments Table */}
      <div>
        {/* Header */}
        <div className={cn(
          "border-b pt-4",
          isDarkMode
            ? "border-slate-700/50"
            : "border-gray-200"
        )}>
          <h2 className={cn(
            "flex items-center gap-2 text-lg font-bold pb-4",
            isDarkMode ? "text-slate-200" : "text-gray-800"
          )}>
            <Package className={cn(
              "h-5 w-5",
              isDarkMode ? "text-blue-400" : "text-blue-600"
            )} />
            Shipment History - {filteredShipments.length}
          </h2>
        </div>
        
        <div className="relative z-10">
          {filteredShipments.length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center gap-3 py-16 text-center",
              isDarkMode ? "text-slate-400" : "text-gray-500"
            )}>
              <div className="relative">
                <div className={cn(
                  "absolute inset-0 rounded-full blur-2xl animate-pulse",
                  isDarkMode
                    ? "bg-gradient-to-r from-blue-500/20 via-purple-500/15 to-indigo-500/20"
                    : "bg-gradient-to-r from-blue-200/40 via-purple-200/30 to-indigo-200/40"
                )}></div>
                <div className={cn(
                  "absolute inset-0 rounded-full blur-xl",
                  isDarkMode ? "bg-slate-700/20" : "bg-white/20"
                )}></div>
                <Package className={cn(
                  "h-10 w-10 relative z-10",
                  isDarkMode ? "text-slate-500" : "text-gray-400"
                )} />
              </div>
              <span className={cn(
                "font-semibold text-sm",
                isDarkMode ? "text-slate-300" : "text-gray-600"
              )}>No shipments found</span>
            </div>
          ) : isMobile ? (
            <div className="space-y-4 p-4">
              {paginatedShipments.map((shipment) => {
                const statusInfo = getStatusInfo(shipment.status);

                return (
                  <div
                    key={shipment._id}
                    className={cn(
                      "rounded-2xl border p-4 space-y-4 shadow-lg transition-all duration-300",
                      isDarkMode
                        ? "bg-slate-800/70 border-slate-700/60 text-slate-200"
                        : "bg-white/80 border-gray-100 text-gray-800"
                    )}
                  >
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className={cn(
                          "text-xs font-semibold uppercase tracking-wide",
                          isDarkMode ? "text-blue-300" : "text-blue-600"
                        )}>
                          Consignment
                        </p>
                        <p className="text-lg font-bold">
                          {shipment.consignmentNumber || shipment.bookingReference}
                        </p>
                      </div>
                      <p className={cn(
                        "text-xs",
                        isDarkMode ? "text-slate-400" : "text-gray-500"
                      )}>
                        Booked on {formatDate(shipment.bookingDate)}
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
                          <span className="capitalize">{shipment.status.replace('_', ' ')}</span>
                        </span>
                      </Badge>
                      <Badge 
                        variant={shipment.paymentStatus === 'paid' ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md font-semibold",
                          isDarkMode
                            ? shipment.paymentStatus === 'paid'
                              ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/40 hover:bg-gradient-to-br hover:from-green-500/20 hover:to-emerald-500/20"
                              : "bg-gradient-to-br from-red-500/20 to-rose-500/20 text-red-300 border border-red-500/40 hover:bg-gradient-to-br hover:from-red-500/20 hover:to-rose-500/20"
                            : shipment.paymentStatus === 'paid'
                              ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40 hover:bg-gradient-to-br hover:from-green-100/90 hover:to-emerald-100/90"
                              : "bg-gradient-to-br from-red-100/90 to-rose-100/90 text-red-800 border border-red-200/40 hover:bg-gradient-to-br hover:from-red-100/90 hover:to-rose-100/90"
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          {shipment.paymentStatus === 'paid' ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}
                          <span className="capitalize">{shipment.paymentStatus}</span>
                        </span>
                      </Badge>
                      <Badge 
                        variant={shipment.paymentType === 'FP' ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md font-semibold",
                          isDarkMode
                            ? shipment.paymentType === 'FP'
                              ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-black border border-green-500/40 hover:bg-gradient-to-br hover:from-green-500/20 hover:to-emerald-500/20"
                              : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/40 hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-cyan-500/20"
                            : shipment.paymentType === 'FP'
                              ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40 hover:bg-gradient-to-br hover:from-green-100/90 hover:to-emerald-100/90"
                              : "bg-gradient-to-br from-blue-100/90 to-cyan-100/90 text-blue-800 border border-blue-200/40 hover:bg-gradient-to-br hover:from-blue-100/90 hover:to-cyan-100/90"
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          {shipment.paymentType === 'FP' ? (
                            <CheckCircle className={cn(
                              "h-3.5 w-3.5",
                              isDarkMode ? "text-black" : ""
                            )} />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          <span>{shipment.paymentType}</span>
                        </span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className={cn(
                        "rounded-xl border p-3 text-sm",
                        isDarkMode ? "border-slate-600 bg-slate-900/30" : "border-blue-100 bg-blue-50/50"
                      )}>
                        <p className={cn(
                          "text-xs font-semibold uppercase tracking-wide mb-1",
                          isDarkMode ? "text-blue-200" : "text-blue-700"
                        )}>Origin</p>
                        <p className="font-semibold">{shipment.originData.name}</p>
                        <p className={cn(
                          "text-xs",
                          isDarkMode ? "text-slate-400" : "text-gray-500"
                        )}>{shipment.originData.city}, {shipment.originData.state}</p>
                      </div>
                      <div className={cn(
                        "rounded-xl border p-3 text-sm",
                        isDarkMode ? "border-slate-600 bg-slate-900/30" : "border-purple-100 bg-purple-50/50"
                      )}>
                        <p className={cn(
                          "text-xs font-semibold uppercase tracking-wide mb-1",
                          isDarkMode ? "text-purple-200" : "text-purple-700"
                        )}>Destination</p>
                        <p className="font-semibold">{shipment.destinationData.name}</p>
                        <p className={cn(
                          "text-xs",
                          isDarkMode ? "text-slate-400" : "text-gray-500"
                        )}>{shipment.destinationData.city}, {shipment.destinationData.state}</p>
                      </div>
                    </div>

                    <Collapsible>
                      <div className={cn(
                        "border-t pt-3 mt-1",
                        isDarkMode ? "border-slate-700" : "border-slate-100"
                      )}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-between rounded-xl",
                              isDarkMode
                                ? "text-slate-200 hover:bg-slate-700/60"
                                : "text-gray-700 hover:bg-blue-50"
                            )}
                          >
                            View full details
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-3">
                          {renderDetailCards(shipment)}
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
                  {paginatedShipments.map((shipment, index) => {
                    const isExpanded = expandedRows.has(shipment._id);
                    const statusInfo = getStatusInfo(shipment.status);
                    const isEven = index % 2 === 0;
                    
                    return (
                      <React.Fragment key={shipment._id}>
                        <TableRow className={cn(
                          "h-14 border-b",
                          isDarkMode
                            ? isEven
                              ? "bg-slate-800/50 border-slate-600/50"
                              : "bg-slate-700/30 border-slate-600/50"
                            : isEven
                              ? "bg-white border-gray-200"
                              : "bg-gray-100 border-gray-200"
                        )}>
                          
                          <TableCell className={cn(
                            "font-bold text-sm py-4 px-4",
                            isDarkMode ? "text-slate-200" : "text-gray-900"
                          )}>
                            {shipment.consignmentNumber || shipment.bookingReference}
                          </TableCell>
                          <TableCell className="text-sm py-4 px-4">
                            <div>
                              <div className={cn(
                                "font-bold text-xs",
                                isDarkMode ? "text-slate-200" : "text-gray-900"
                              )}>{shipment.originData.name}</div>
                              <div className={cn(
                                "text-xs mt-0.5",
                                isDarkMode ? "text-slate-400" : "text-gray-600"
                              )}>{shipment.originData.city}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm py-4 px-4">
                            <div>
                              <div className={cn(
                                "font-bold text-xs",
                                isDarkMode ? "text-slate-200" : "text-gray-900"
                              )}>{shipment.destinationData.name}</div>
                              <div className={cn(
                                "text-xs mt-0.5",
                                isDarkMode ? "text-slate-400" : "text-gray-600"
                              )}>{shipment.destinationData.city}</div>
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
                                  {shipment.status.replace('_', ' ')}
                                </span>
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <Badge 
                              variant={shipment.paymentStatus === 'paid' ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md font-semibold",
                                isDarkMode
                                  ? shipment.paymentStatus === 'paid'
                                    ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/40 hover:!bg-gradient-to-br hover:!from-green-500/20 hover:!to-emerald-500/20"
                                    : "bg-gradient-to-br from-red-500/20 to-rose-500/20 text-red-300 border border-red-500/40 hover:!bg-gradient-to-br hover:!from-red-500/20 hover:!to-rose-500/20"
                                  : shipment.paymentStatus === 'paid'
                                    ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40 hover:!bg-gradient-to-br hover:!from-green-100/90 hover:!to-emerald-100/90"
                                    : "bg-gradient-to-br from-red-100/90 to-rose-100/90 text-red-800 border border-red-200/40 hover:!bg-gradient-to-br hover:!from-red-100/90 hover:!to-rose-100/90"
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                {shipment.paymentStatus === 'paid' ? (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                ) : (
                                  <AlertCircle className="h-3.5 w-3.5" />
                                )}
                                <span className="capitalize">{shipment.paymentStatus}</span>
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <Badge 
                              variant={shipment.paymentType === 'FP' ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md font-semibold",
                                isDarkMode
                                  ? shipment.paymentType === 'FP'
                                    ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-black border border-green-500/40 hover:!bg-gradient-to-br hover:!from-green-500/20 hover:!to-emerald-500/20"
                                    : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/40 hover:!bg-gradient-to-br hover:!from-blue-500/20 hover:!to-cyan-500/20"
                                  : shipment.paymentType === 'FP'
                                    ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 text-green-800 border border-green-200/40 hover:!bg-gradient-to-br hover:!from-green-100/90 hover:!to-emerald-100/90"
                                    : "bg-gradient-to-br from-blue-100/90 to-cyan-100/90 text-blue-800 border border-blue-200/40 hover:!bg-gradient-to-br hover:!from-blue-100/90 hover:!to-cyan-100/90"
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                {shipment.paymentType === 'FP' ? (
                                  <CheckCircle className={cn(
                                    "h-3.5 w-3.5",
                                    isDarkMode ? "text-black" : ""
                                  )} />
                                ) : (
                                  <Clock className="h-3.5 w-3.5" />
                                )}
                                <span>{shipment.paymentType}</span>
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className={cn(
                            "text-xs py-4 px-4",
                            isDarkMode ? "text-slate-400" : "text-gray-600"
                          )}>
                            {formatDate(shipment.bookingDate)}
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(shipment._id)}
                              className={cn(
                                "h-8 w-8 p-0 rounded-xl backdrop-blur-sm border shadow-lg",
                                isDarkMode
                                  ? "bg-slate-700/60 border-slate-600/40"
                                  : "bg-white/60 border-gray-200/40"
                              )}
                            >
                              {isExpanded ? (
                                <ChevronDown className={cn(
                                  "h-4 w-4",
                                  isDarkMode
                                    ? "text-slate-300"
                                    : "text-gray-700"
                                )} />
                              ) : (
                                <ChevronRight className={cn(
                                  "h-4 w-4",
                                  isDarkMode
                                    ? "text-slate-300"
                                    : "text-gray-700"
                                )} />
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
                                {renderDetailCards(shipment)}
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
        
        {filteredShipments.length > 0 && (
          <div className={cn(
            "flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t text-sm",
            isDarkMode ? "border-slate-700/50 text-slate-300" : "border-gray-200 text-gray-600"
          )}>
            <div>
              Showing {filteredShipments.length === 0 ? 0 : startIndex + 1}-
              {Math.min(startIndex + paginatedShipments.length, filteredShipments.length)} of {filteredShipments.length} shipments
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={safeCurrentPage === 1}
                className={cn(
                  "h-8 px-3 rounded-lg",
                  isDarkMode
                    ? "border-slate-600/60 text-slate-200 disabled:text-slate-500"
                    : "border-gray-200 text-gray-700 disabled:text-gray-400"
                )}
              >
                Previous
              </Button>
              <span className={cn(
                "font-medium",
                isDarkMode ? "text-slate-200" : "text-gray-700"
              )}>
                Page {safeCurrentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={safeCurrentPage === totalPages}
                className={cn(
                  "h-8 px-3 rounded-lg",
                  isDarkMode
                    ? "border-slate-600/60 text-slate-200 disabled:text-slate-500"
                    : "border-gray-200 text-gray-700 disabled:text-gray-400"
                )}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentOverview;
