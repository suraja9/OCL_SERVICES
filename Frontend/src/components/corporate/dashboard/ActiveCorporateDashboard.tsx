import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  DollarSign,
  MapPin,
  Clock,
  AlertCircle,
  Eye,
  Calendar,
  CreditCard,
  BarChart3,
  Users,
  Shield,
  Building,
  Sun,
  MoonStar,
  Loader2
} from "lucide-react";
import BentoBox from '@/components/corporate/dashboard/BentoBox';
import CompactMetric from './CompactMetric';
import CompactRecentActivity from './CompactRecentActivity';
import NotificationSystem, { DashboardNotification } from './NotificationSystem';
import CourierRequestModal from '../CourierRequestModal';
import { cn } from '@/lib/utils';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

const LOW_CONSIGNMENT_THRESHOLD = 10;
const ACTIVE_COMPLAINT_STATUSES = ['Open', 'In Progress'];
const RESOLVED_COMPLAINT_STATUSES = ['Resolved', 'Closed'];

interface ActiveCorporateDashboardProps {
  corporate: {
    companyName: string;
    corporateId: string;
    email: string;
    contactNumber: string;
    registrationDate: string;
    lastLogin: string;
    isActive: boolean;
    billingType?: string;
    manager?: string;
    billingCycle?: string;
    companyAddress?: string;
    city?: string;
    state?: string;
    pin?: string;
    locality?: string;
    gstNumber?: string;
    logo?: string;
  };
  stats: {
    summary: {
      totalShipments: number;
      pendingShipments: number;
      completedShipments: number;
      totalSpent: number;
    };
    monthly: {
      shipments: number;
      spend: number;
      deliveryRate: number;
    };
    recentShipments: Array<{
      id: string;
      consignmentNumber: string;
      destination: string;
      status: string;
      date: string;
    }>;
    complaints: {
      active: number;
      resolved: number;
    };
    tpMetrics: {
      tpPaidShipments: number; // TP shipments that are paid
      fpUnpaidShipments: number; // FP shipments that are unpaid (in transit)
      tpUnpaidShipments: number; // TP shipments that are unpaid (on hold)
    };
    topDestinations: Array<{
      route: string;
      count: number;
    }>;
  };
  onNavigateToTab: (tab: string) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onMonthChange?: (monthIndex: number) => void;
}

type ShipmentStatus = 'booked' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled';
type StatusCounts = Record<ShipmentStatus, number>;

const STATUS_KEYS: ShipmentStatus[] = ['booked', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'];

const createEmptyStatusCounts = (): StatusCounts =>
  STATUS_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as StatusCounts);

const normalizeStatus = (rawStatus?: string | null): ShipmentStatus => {
  if (!rawStatus) {
    return 'booked';
  }

  const normalized = rawStatus.trim().toLowerCase();

  // Map tracking status from database to simplified component status format
  const statusMap: Record<string, ShipmentStatus> = {
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

type NestedDateValue = string | number | Date | { [key: string]: unknown } | null | undefined;

type BookingRecord = {
  id: string;
  consignmentNumber?: string | number;
  bookingReference?: string;
  status?: string | null;
  currentStatus?: string | null;
  usedAt?: NestedDateValue;
  bookingDate?: NestedDateValue;
  createdAt?: NestedDateValue;
  updatedAt?: NestedDateValue;
  bookingData?: {
    consignmentNumber?: string | number;
    bookingReference?: string;
    status?: string | null;
    currentStatus?: string | null;
    usedAt?: NestedDateValue;
    destinationData?: {
      locality?: string;
      city?: string;
      state?: string;
    };
    bookingDate?: NestedDateValue;
    createdAt?: NestedDateValue;
    updatedAt?: NestedDateValue;
    shipmentData?: {
      pickupDate?: NestedDateValue;
      dispatchDate?: NestedDateValue;
    };
    trackingUpdates?: Array<{
      status?: string | null;
      updatedAt?: NestedDateValue;
    }>;
  };
  trackingUpdates?: Array<{
    status?: string | null;
    updatedAt?: NestedDateValue;
  }>;
};

type TransformableBookingRecord = Partial<BookingRecord> & {
  _id?: { toString?: () => string } | string | number;
};

type CorporateBookingsResponse = {
  data?: TransformableBookingRecord[];
  pagination?: {
    hasNext?: boolean;
  };
};

const transformBookingRecord = (
  booking: TransformableBookingRecord | null | undefined,
  fallbackId: string
): BookingRecord => {
  const bookingData: BookingRecord['bookingData'] = booking?.bookingData ?? {};
  const baseTrackingUpdates: BookingRecord['trackingUpdates'] =
    Array.isArray(booking?.trackingUpdates) && booking.trackingUpdates.length > 0
      ? booking.trackingUpdates
      : Array.isArray(bookingData?.trackingUpdates) && bookingData.trackingUpdates.length > 0
        ? bookingData.trackingUpdates
        : [];

  const derivedStatus =
    booking?.status ||
    booking?.currentStatus ||
    bookingData?.status ||
    bookingData?.currentStatus ||
    baseTrackingUpdates[baseTrackingUpdates.length - 1]?.status ||
    'booked';

  return {
    id: booking?._id?.toString?.() || booking?.id || fallbackId,
    consignmentNumber: booking?.consignmentNumber ?? bookingData?.consignmentNumber,
    bookingReference: booking?.bookingReference ?? bookingData?.bookingReference,
    status: derivedStatus,
    currentStatus: booking?.currentStatus || bookingData?.currentStatus,
    usedAt: booking?.usedAt || bookingData?.usedAt,
    bookingDate: booking?.bookingDate || bookingData?.bookingDate,
    createdAt: booking?.createdAt || bookingData?.createdAt,
    updatedAt: booking?.updatedAt || bookingData?.updatedAt,
    bookingData: {
      ...bookingData,
      trackingUpdates: baseTrackingUpdates
    },
    trackingUpdates: baseTrackingUpdates
  };
};

const parseDateValue = (value: NestedDateValue): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    // Handle Firestore-style timestamp strings
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      return parseDateValue(numericValue);
    }
  }

  if (typeof value === 'number') {
    // Heuristic: if value is in seconds, convert to ms
    const milliseconds = value < 1e12 ? value * 1000 : value;
    const parsed = new Date(milliseconds);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === 'object') {
    const maybeDate = value as Record<string, unknown>;

    if (maybeDate.$date) {
      return parseDateValue(maybeDate.$date as NestedDateValue);
    }

    if (typeof maybeDate.seconds === 'number') {
      return parseDateValue(maybeDate.seconds as number);
    }

    if (typeof maybeDate._seconds === 'number') {
      return parseDateValue(maybeDate._seconds as number);
    }

    if (maybeDate.value) {
      return parseDateValue(maybeDate.value as NestedDateValue);
    }

    if (maybeDate.date) {
      return parseDateValue(maybeDate.date as NestedDateValue);
    }

    if (typeof maybeDate.iso === 'string') {
      return parseDateValue(maybeDate.iso);
    }
  }

  return null;
};

const getBookingDate = (booking: BookingRecord): Date | null => {
  const candidateDates: NestedDateValue[] = [
    booking?.usedAt,
    booking?.bookingDate,
    booking?.createdAt,
    booking?.updatedAt,
    booking?.bookingData?.bookingDate,
    booking?.bookingData?.createdAt,
    booking?.bookingData?.updatedAt,
    booking?.bookingData?.shipmentData?.pickupDate,
    booking?.bookingData?.shipmentData?.dispatchDate
  ];

  for (const candidate of candidateDates) {
    const parsedDate = parseDateValue(candidate);
    if (parsedDate) {
      return parsedDate;
    }
  }

  return null;
};

const filterBookingsByMonth = (
  bookings: BookingRecord[],
  monthIndex: number
) => {
  if (!Array.isArray(bookings)) {
    return [];
  }

  return bookings.filter((booking) => {
    const bookingDate = getBookingDate(booking);

    if (!bookingDate) {
      return false;
    }

    return bookingDate.getMonth() === monthIndex;
  });
};

const getDisplayStatusFromBooking = (booking: BookingRecord): string => {
  const trackingUpdates = booking?.trackingUpdates;
  const latestTrackingStatus =
    Array.isArray(trackingUpdates) && trackingUpdates.length > 0
      ? trackingUpdates[trackingUpdates.length - 1]?.status
      : undefined;

  // Prefer the most recent status: latest tracking update > currentStatus > status
  const status = latestTrackingStatus
    ? normalizeStatus(latestTrackingStatus)
    : booking?.currentStatus
    ? normalizeStatus(booking.currentStatus)
    : normalizeStatus(booking?.status);

  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const getBookingDestinationLabel = (booking: BookingRecord): string => {
  const destinationData = booking?.bookingData?.destinationData as {
    locality?: string;
    city?: string;
    state?: string;
  } | undefined;

  if (!destinationData) {
    return 'Destination unavailable';
  }

  const parts = [
    destinationData.locality,
    destinationData.city,
    destinationData.state
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Destination unavailable';
};

const getConsignmentLabel = (booking: BookingRecord, fallbackIndex = 0): string => {
  const consignment =
    booking?.consignmentNumber ??
    booking?.bookingData?.consignmentNumber ??
    booking?.bookingReference ??
    booking?.bookingData?.bookingReference;

  if (consignment) {
    return consignment.toString();
  }

  return `Consignment #${fallbackIndex + 1}`;
};

const ActiveCorporateDashboard: React.FC<ActiveCorporateDashboardProps> = ({
  corporate,
  stats,
  onNavigateToTab,
  isDarkMode = false,
  onToggleDarkMode,
  onMonthChange
}) => {
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [totalShipments, setTotalShipments] = useState(stats.summary.totalShipments || 0);
  const [allBookings, setAllBookings] = useState<BookingRecord[] | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>(() => {
    const initialCounts = createEmptyStatusCounts();
    initialCounts.booked = stats.summary.pendingShipments || 0;
    initialCounts.delivered = stats.summary.completedShipments || 0;
    return initialCounts;
  });
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [supportCounts, setSupportCounts] = useState(() => ({
    active: stats.complaints?.active ?? 0,
    resolved: stats.complaints?.resolved ?? 0
  }));
  const [isLoadingSupport, setIsLoadingSupport] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const currentYear = new Date().getFullYear();
  const updateMetricsForMonth = useCallback(
    (bookings: BookingRecord[], monthIndex: number) => {
      if (!Array.isArray(bookings)) {
        setStatusCounts(createEmptyStatusCounts());
        setTotalShipments(0);
        return false;
      }

      const bookingsForMonth = filterBookingsByMonth(bookings, monthIndex);

      const counts = createEmptyStatusCounts();

      bookingsForMonth.forEach((booking) => {
        const trackingUpdates = booking?.trackingUpdates;
        const latestTrackingStatus =
          Array.isArray(trackingUpdates) && trackingUpdates.length > 0
            ? trackingUpdates[trackingUpdates.length - 1]?.status
            : undefined;

        // Prefer the most recent status: latest tracking update > currentStatus > status
        const status = latestTrackingStatus
          ? normalizeStatus(latestTrackingStatus)
          : booking?.currentStatus
          ? normalizeStatus(booking.currentStatus)
          : normalizeStatus(booking?.status);

        if (status && counts[status] !== undefined) {
          counts[status] += 1;
        }
      });

      setStatusCounts(counts);
      setTotalShipments(bookingsForMonth.length);
      return true;
    },
    []
  );
  const selectedMonthFullLabel = new Date(
    currentYear,
    selectedMonth
  ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const updatedNotifications: DashboardNotification[] = [];
    const settlementDate = new Date(currentYear, selectedMonth + 1, 0);
    const settlementDateLabel = settlementDate.toLocaleDateString();
    const todaysLabel = new Date().toLocaleDateString();
    const currentSpend = stats.monthly?.spend || 0;

    if (totalShipments < LOW_CONSIGNMENT_THRESHOLD) {
      updatedNotifications.push({
        id: `low-consignment-${selectedMonth}`,
        title: totalShipments === 0 ? 'No consignments yet' : 'Low consignments alert',
        message:
          totalShipments === 0
            ? `You have not booked any consignments for ${selectedMonthFullLabel}. Create a shipment to stay active.`
            : `Only ${totalShipments} consignments booked for ${selectedMonthFullLabel}. Schedule more pickups to meet your targets.`,
        type: 'warning',
        date: todaysLabel,
        isRead: false,
        priority: 'high'
      });
    }

    updatedNotifications.push({
      id: `payment-reminder-${selectedMonth}`,
      title: 'Payment reminder',
      message: `Settlement for ${selectedMonthFullLabel} (₹${currentSpend.toLocaleString()}) is due by ${settlementDateLabel}. Review and confirm payments.`,
      type: 'alert',
      date: settlementDateLabel,
      isRead: false,
      priority: 'medium'
    });

    setNotifications((prev) =>
      updatedNotifications.map((notification) => {
        const existing = prev.find((item) => item.id === notification.id);
        return existing ? { ...notification, isRead: existing.isRead } : notification;
      })
    );
  }, [currentYear, selectedMonth, selectedMonthFullLabel, stats.monthly?.spend, totalShipments]);

  const keyMetrics = [
    {
      key: 'total',
      label: 'Total Shipments',
      value: totalShipments,
      icon: Package,
      color: 'blue' as const
    },
    {
      key: 'booked',
      label: 'Booked',
      value: statusCounts.booked,
      icon: Clock,
      color: 'purple' as const
    },
    {
      key: 'picked_up',
      label: 'Picked Up',
      value: statusCounts.picked_up,
      icon: Building,
      color: 'purple' as const
    },
    {
      key: 'in_transit',
      label: 'In Transit',
      value: statusCounts.in_transit,
      icon: Truck,
      color: 'orange' as const
    },
    {
      key: 'out_for_delivery',
      label: 'Out for Delivery',
      value: statusCounts.out_for_delivery,
      icon: MapPin,
      color: 'blue' as const
    },
    {
      key: 'delivered',
      label: 'Delivered',
      value: statusCounts.delivered,
      icon: CheckCircle,
      color: 'green' as const
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      value: statusCounts.cancelled,
      icon: AlertCircle,
      color: 'red' as const
    }
  ];

  useEffect(() => {
    if (!allBookings) {
      return;
    }

    updateMetricsForMonth(allBookings, selectedMonth);
  }, [allBookings, selectedMonth, updateMetricsForMonth]);

  useEffect(() => {
    let isMounted = true;

    const fetchAllCorporateBookings = async (token: string) => {
      const aggregated: BookingRecord[] = [];
      const limit = 50;
      const MAX_PAGES = 100;
      let page = 1;
      let hasNext = true;

      while (hasNext && page <= MAX_PAGES) {
        const response = await fetch(`/api/corporate/bookings?page=${page}&limit=${limit}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch bookings page ${page}`);
        }

        const data = await response.json() as CorporateBookingsResponse;

        const bookings = data?.data;
        if (!Array.isArray(bookings)) {
          throw new Error('Invalid bookings response structure');
        }

        const normalized = bookings.map((booking, index) =>
          transformBookingRecord(booking, `remote-${page}-${index}`)
        );

        aggregated.push(...normalized);

        const pagination = data.pagination;
        const expectsMore = pagination?.hasNext ?? (bookings.length === limit);

        if (!expectsMore || data.data.length === 0) {
          hasNext = false;
        } else {
          page += 1;
        }
      }

      if (page > MAX_PAGES) {
        console.warn('Reached max pagination limit while fetching corporate bookings');
      }

      return aggregated;
    };

    const fetchStatusCounts = async () => {
      try {
        const token = localStorage.getItem('corporateToken');
        if (!token) {
          if (isMounted) {
            setAllBookings([]);
          }
          return;
        }

        try {
          const bookings = await fetchAllCorporateBookings(token);
          if (isMounted) {
            setAllBookings(bookings);
          }
        } catch (apiError) {
          console.error('Failed to fetch full corporate bookings:', apiError);
          if (isMounted) {
            setAllBookings([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch shipment status counts:', error);
        if (isMounted) {
          setAllBookings([]);
        }
      }
    };

    fetchStatusCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const updateIsMobile = () => {
      if (typeof window === 'undefined') {
        return;
      }
      setIsMobile(window.innerWidth < 640);
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => {
      window.removeEventListener('resize', updateIsMobile);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCourierSupportCounts = async () => {
      setIsLoadingSupport(true);
      try {
        const token = localStorage.getItem('corporateToken');
        if (!token) {
          setSupportCounts({ active: 0, resolved: 0 });
          return;
        }

        const response = await fetch('/api/courier-complaints', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load courier complaints: ${response.statusText}`);
        }

        const data = await response.json();
        const complaints = Array.isArray(data?.complaints) ? data.complaints : [];
        const active = complaints.filter((complaint) =>
          ACTIVE_COMPLAINT_STATUSES.includes(complaint.status)
        ).length;
        const resolved = complaints.filter((complaint) =>
          RESOLVED_COMPLAINT_STATUSES.includes(complaint.status)
        ).length;

        if (isMounted) {
          setSupportCounts({ active, resolved });
        }
      } catch (error) {
        console.error('Failed to load courier complaint counts:', error);
        if (isMounted) {
          setSupportCounts({ active: stats.complaints?.active ?? 0, resolved: stats.complaints?.resolved ?? 0 });
        }
      } finally {
        if (isMounted) {
          setIsLoadingSupport(false);
        }
      }
    };

    fetchCourierSupportCounts();

    return () => {
      isMounted = false;
    };
  }, [stats.complaints?.active, stats.complaints?.resolved]);

  const recentActivity = useMemo(() => {
    if (Array.isArray(allBookings) && allBookings.length > 0) {
      const sorted = [...allBookings].sort((a, b) => {
        const dateA = getBookingDate(a)?.getTime() ?? 0;
        const dateB = getBookingDate(b)?.getTime() ?? 0;
        return dateB - dateA;
      });

      return sorted.slice(0, 8).map((booking, index) => {
        const bookingDate = getBookingDate(booking);
        return {
          id: booking.id || `booking-${index}`,
          type: 'shipment' as const,
          title: getConsignmentLabel(booking, index),
          description: getBookingDestinationLabel(booking),
          status: getDisplayStatusFromBooking(booking),
          time: bookingDate
            ? bookingDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
            : 'Date unavailable'
        };
      });
    }

    return stats.recentShipments.map((shipment, index) => {
      const normalizedStatus =
        normalizeStatus(shipment.status)?.replace(/_/g, ' ') ||
        shipment.status ||
        'Booked';

      return {
        id: shipment.id || `stat-${index}`,
        type: 'shipment' as const,
        title: shipment.consignmentNumber,
        description: shipment.destination,
        status: normalizedStatus
          .split(' ')
          .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
          .join(' '),
        time: shipment.date
      };
    });
  }, [allBookings, stats.recentShipments]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
  };

  const handleNotificationSelect = (notification: DashboardNotification) => {
    if (notification.id.startsWith('payment-reminder')) {
      onNavigateToTab('settlement');
    }
  };

  const handleRequestCourier = () => {
    setIsCourierModalOpen(true);
  };

  const handleMonthSelect = (index: number) => {
    setSelectedMonth(index);
    if (allBookings) {
      updateMetricsForMonth(allBookings, index);
    }
    onMonthChange?.(index);
  };

  const getStatusColor = (status: string) => {
    if (isDarkMode) {
      switch (status.toLowerCase()) {
        case 'delivered':
          return 'bg-green-900/30 text-green-300';
        case 'in transit':
          return 'bg-blue-900/30 text-blue-300';
        case 'pending':
          return 'bg-yellow-900/30 text-yellow-300';
        default:
          return 'bg-slate-700/50 text-slate-300';
      }
    } else {
      switch (status.toLowerCase()) {
        case 'delivered':
          return 'bg-green-100 text-green-800';
        case 'in transit':
          return 'bg-blue-100 text-blue-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  };

  const dashboardGridClass = cn(
    isMobile
      ? "flex flex-col gap-3 pb-6"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-2 pb-6 sm:pb-0 overflow-y-auto scrollbar-hide scroll-smooth sm:h-[calc(100vh-200px)]"
  );

  const keyMetricsContent = isMobile ? (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1 snap-x snap-mandatory">
      {keyMetrics.map((metric) => (
        <div key={metric.key} className="min-w-[120px] snap-start">
          <CompactMetric
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            size="small"
            isDarkMode={isDarkMode}
          />
        </div>
      ))}
    </div>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
      {keyMetrics.map((metric) => (
        <CompactMetric
          key={metric.key}
          label={metric.label}
          value={metric.value}
          icon={metric.icon}
          color={metric.color}
          size="small"
          isDarkMode={isDarkMode}
        />
      ))}
    </div>
  );

  const requestPickupSection = (
    <BentoBox title="Quick Actions" icon={Truck} size="medium" isDarkMode={isDarkMode}>
      <div className="space-y-2 sm:space-y-3">
        <Button
          onClick={() => handleRequestCourier()}
          className="w-full h-9 sm:h-10 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Request For Pickup
        </Button>
        <div className={cn("text-xs text-center", isDarkMode ? "text-slate-400" : "text-gray-500")}>
          Need a courier boy for pickup? Click to request one.
        </div>
      </div>
    </BentoBox>
  );

  return (
    <div className="h-full overflow-y-auto sm:overflow-hidden">
      {/* Header with Month Selector and Notifications */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="w-full sm:w-auto">
          {isMobile ? (
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-[160px] rounded-lg border shadow-sm">
                <select
                  value={selectedMonth}
                  onChange={(event) => handleMonthSelect(Number(event.target.value))}
                  className={cn(
                    "w-full appearance-none rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2",
                    isDarkMode
                      ? "bg-slate-900/70 border-slate-700 text-slate-100 focus:ring-blue-500/40"
                      : "bg-white border-slate-200 text-slate-700 focus:ring-blue-200"
                  )}
                >
                  {MONTH_LABELS.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
                <div
                  className={cn(
                    "pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold",
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  ▼
                </div>
              </div>
              <div className="flex flex-1 items-center justify-end gap-2">
                <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-[10px] px-2 py-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
                <div className="relative top-0.5">
                  <NotificationSystem
                    notifications={notifications}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    isDarkMode={isDarkMode}
                    onNotificationClick={handleNotificationSelect}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <div
                className={cn(
                  "flex gap-2 min-w-full flex-wrap",
                  isDarkMode
                    ? "border-slate-700 bg-slate-900/60"
                    : "border-slate-200 bg-white shadow-sm"
                )}
              >
                {MONTH_LABELS.map((month, index) => {
                  const isSelected = index === selectedMonth;
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => handleMonthSelect(index)}
                      className={cn(
                        "px-3 py-2 min-w-[60px] text-xs font-semibold rounded-lg border whitespace-nowrap text-center transition-all duration-150",
                        "shrink-0",
                        isSelected
                          ? isDarkMode
                            ? "border-blue-400 bg-blue-900/50 text-white shadow"
                            : "border-blue-500 bg-blue-50 text-blue-700 shadow"
                          : isDarkMode
                          ? "border-slate-700 text-slate-300 hover:bg-slate-800/70"
                          : "border-slate-200 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {month}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {!isMobile && (
          <div className="flex items-center flex-wrap gap-2 sm:space-x-3">
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
            <div className="relative top-1">
              <NotificationSystem
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                isDarkMode={isDarkMode}
                onNotificationClick={handleNotificationSelect}
              />
            </div>
            {onToggleDarkMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleDarkMode}
                className={cn(
                  "flex items-center gap-1 sm:gap-2 rounded-full border transition text-xs sm:text-sm",
                  isDarkMode
                    ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                    : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                )}
              >
                {isDarkMode ? (
                  <>
                    <Sun size={12} className="sm:w-[14px] sm:h-[14px]" />
                    <span className="hidden sm:inline text-xs font-medium">Light mode</span>
                  </>
                ) : (
                  <>
                    <MoonStar size={12} className="sm:w-[14px] sm:h-[14px]" />
                    <span className="hidden sm:inline text-xs font-medium">Dark mode</span>
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Bento Box Grid - Responsive layout */}
      <div className={dashboardGridClass}>
        {/* Row 1: Key Metrics (Full Width) */}
        <BentoBox title="Key Metrics" icon={BarChart3} size="full" isDarkMode={isDarkMode}>
          {keyMetricsContent}
        </BentoBox>
        {isMobile && requestPickupSection}

        {/* Row 2: Recent Shipments (2x2) + Billing Summary (2x1) + Support (1x1) + Quick Actions (1x1) */}
        <BentoBox title="Recent Shipments" icon={Package} size="large" isDarkMode={isDarkMode}>
          <CompactRecentActivity
            title="Latest Activity"
            items={recentActivity}
            onViewAll={() => onNavigateToTab('shipments')}
            isDarkMode={isDarkMode}
          />
        </BentoBox>

        <BentoBox title="Billing Summary" icon={CreditCard} size="medium" isDarkMode={isDarkMode}>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Last Invoice</span>
              <span className={cn("text-sm font-semibold", isDarkMode ? "text-slate-200" : "text-gray-900")}>₹{Math.floor(stats.monthly.spend * 0.8).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Next Due</span>
              <span className={cn("text-xs", isDarkMode ? "text-slate-300" : "text-gray-600")}>
                {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Cycle</span>
              <span className={cn("text-xs", isDarkMode ? "text-slate-300" : "text-gray-600")}>{corporate.billingCycle || 'Monthly'}</span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className={cn(
                "w-full h-8 sm:h-8 text-xs sm:text-xs",
                isDarkMode && "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
              )}
              onClick={() => onNavigateToTab('settlement')}
            >
              View Details
            </Button>
          </div>
        </BentoBox>

        <BentoBox title="Support" icon={AlertCircle} size="small" isDarkMode={isDarkMode}>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Active</span>
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[28px] flex justify-center">
                {isLoadingSupport ? <Loader2 className="h-3 w-3 animate-spin" /> : supportCounts.active}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Resolved</span>
              <Badge variant="default" className="text-xs px-1.5 py-0.5 min-w-[28px] flex justify-center">
                {isLoadingSupport ? <Loader2 className="h-3 w-3 animate-spin" /> : supportCounts.resolved}
              </Badge>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className={cn(
                "w-full h-6 text-xs",
                isDarkMode && "text-slate-300 hover:bg-slate-800/60"
              )}
              onClick={() => onNavigateToTab('complaints')}
            >
              View All
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className={cn(
                "w-full h-6 text-xs",
                isDarkMode && "text-slate-300 hover:bg-slate-800/60"
              )}
              onClick={() => onNavigateToTab('courier-complaints')}
            >
              Courier Issues
            </Button>
          </div>
        </BentoBox>

        <BentoBox title="Quick Actions" icon={Package} size="small" isDarkMode={isDarkMode}>
          <div className="space-y-1.5 sm:space-y-2">
            <Button 
              size="sm" 
              className="w-full h-8 sm:h-8 text-xs sm:text-xs bg-blue-600 hover:bg-blue-700"
              onClick={() => onNavigateToTab('booking')}
            >
              <Package className="h-3 w-3 mr-1" />
              New Shipment
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className={cn(
                "w-full h-8 sm:h-8 text-xs sm:text-xs",
                isDarkMode && "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
              )}
              onClick={() => onNavigateToTab('pricing')}
            >
              <DollarSign className="h-3 w-3 mr-1" />
              View Pricing
            </Button>
          </div>
        </BentoBox>

        {/* Row 3: Top Destinations (2x1) + Account Info (2x1) + Insights (2x1) */}
        <BentoBox title="Top Destinations" icon={MapPin} size="medium" isDarkMode={isDarkMode}>
          <div className="space-y-2">
            {stats.topDestinations && stats.topDestinations.length > 0 ? (
              stats.topDestinations.slice(0, 3).map((destination, index) => (
                <div key={index} className={cn(
                  "flex items-center justify-between p-2 sm:p-2 rounded shadow-sm hover:shadow-md transition-all duration-200",
                  isDarkMode ? "bg-slate-700/50" : "bg-gray-50/50"
                )}>
                  <span className={cn("text-xs font-medium truncate pr-2", isDarkMode ? "text-slate-200" : "text-gray-900")}>{destination.route}</span>
                  <span className={cn("text-xs font-semibold flex-shrink-0", isDarkMode ? "text-slate-200" : "text-gray-900")}>{destination.count}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-3 sm:py-4">
                <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>No shipment data available</div>
                <div className={cn("text-xs mt-1", isDarkMode ? "text-slate-500" : "text-gray-400")}>Create your first shipment to see top destinations</div>
              </div>
            )}
          </div>
        </BentoBox>

        {!isMobile && (
          <BentoBox title="Account Info" icon={Shield} size="large" isDarkMode={isDarkMode}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Company Name</div>
                  <div className={cn("text-xs sm:text-sm font-medium break-words", isDarkMode ? "text-slate-200" : "text-gray-900")}>{corporate.companyName}</div>
                </div>
                <div>
                  <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Corporate ID</div>
                  <div className={cn("text-xs sm:text-sm font-mono font-medium break-all", isDarkMode ? "text-slate-200" : "text-gray-900")}>{corporate.corporateId}</div>
                </div>
                <div>
                  <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Email</div>
                  <div className={cn("text-xs sm:text-sm break-words", isDarkMode ? "text-slate-200" : "text-gray-900")}>{corporate.email}</div>
                </div>
                <div>
                  <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Contact Number</div>
                  <div className={cn("text-xs sm:text-sm", isDarkMode ? "text-slate-200" : "text-gray-900")}>{corporate.contactNumber}</div>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {corporate.gstNumber && (
                  <div>
                    <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>GST Number</div>
                    <div className={cn("text-xs sm:text-sm font-mono break-all", isDarkMode ? "text-slate-200" : "text-gray-900")}>{corporate.gstNumber}</div>
                  </div>
                )}
                <div>
                  <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Address</div>
                  <div className={cn("text-xs sm:text-sm break-words", isDarkMode ? "text-slate-200" : "text-gray-900")}>
                    {corporate.companyAddress || 'Not Available'}
                  </div>
                </div>
                <div>
                  <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Location</div>
                  <div className={cn("text-xs sm:text-sm break-words", isDarkMode ? "text-slate-200" : "text-gray-900")}>
                    {corporate.locality && corporate.city && corporate.state 
                      ? `${corporate.locality}, ${corporate.city}, ${corporate.state}${corporate.pin ? ` - ${corporate.pin}` : ''}`
                      : corporate.city && corporate.state 
                      ? `${corporate.city}, ${corporate.state}${corporate.pin ? ` - ${corporate.pin}` : ''}`
                      : 'Not Available'
                    }
                  </div>
                </div>
                <div>
                  <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Registration Date</div>
                  <div className={cn("text-xs sm:text-sm", isDarkMode ? "text-slate-200" : "text-gray-900")}>{new Date(corporate.registrationDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Last Login</div>
                  <div className={cn("text-xs sm:text-sm", isDarkMode ? "text-slate-200" : "text-gray-900")}>{new Date(corporate.lastLogin).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </BentoBox>
        )}

        {!isMobile && (
          <BentoBox title="Insights" icon={Eye} size="medium" isDarkMode={isDarkMode}>
            <div className="space-y-2">
              {stats.topDestinations && stats.topDestinations.length > 0 ? (
                <div className={cn(
                  "text-xs p-2 rounded shadow-sm break-words",
                  isDarkMode 
                    ? "text-blue-300 bg-blue-900/30" 
                    : "text-blue-600 bg-blue-50"
                )}>
                  Top route: {stats.topDestinations[0].route}
                </div>
              ) : (
                <div className={cn(
                  "text-xs p-2 rounded shadow-sm",
                  isDarkMode 
                    ? "text-slate-400 bg-slate-700/30" 
                    : "text-gray-500 bg-gray-50"
                )}>
                  No routes available yet
                </div>
              )}
              <div className={cn(
                "text-xs p-2 rounded shadow-sm",
                isDarkMode 
                  ? "text-green-300 bg-green-900/30" 
                  : "text-green-600 bg-green-50"
              )}>
                {stats.monthly.deliveryRate}% success rate
              </div>
              <div className={cn(
                "text-xs p-2 rounded shadow-sm",
                isDarkMode 
                  ? "text-purple-300 bg-purple-900/30" 
                  : "text-purple-600 bg-purple-50"
              )}>
                {stats.monthly.shipments} shipments this month
              </div>
              <div className={cn(
                "text-xs p-2 rounded shadow-sm",
                isDarkMode 
                  ? "text-orange-300 bg-orange-900/30" 
                  : "text-orange-600 bg-orange-50"
              )}>
                Consider bulk shipments for cost savings
              </div>
            </div>
          </BentoBox>
        )}

        {/* Row 4: Request Courier (2x1) + Performance Trends (4x1) */}
        {!isMobile && requestPickupSection}

      </div>

      {/* Courier Request Modal */}
      <CourierRequestModal
        isOpen={isCourierModalOpen}
        onClose={() => setIsCourierModalOpen(false)}
        corporateName={corporate.companyName}
        corporateContact={corporate.contactNumber}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default ActiveCorporateDashboard;