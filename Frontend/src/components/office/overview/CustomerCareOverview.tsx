import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { dashboardService } from '@/services/dashboard.service';
import { shipmentsService, type Shipment } from '@/services/shipments.service';
import { paymentsService } from '@/services/payments.service';
import { shipmentActionsService, type InternalNote, type Escalation } from '@/services/shipment-actions.service';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Briefcase,
  History,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Truck,
  User,
  Weight,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Eye,
  AlertCircle,
  Building,
  Bike,
  DollarSign,
  MessageSquare,
  X,
  ExternalLink,
  Flag,
  Timer,
  Zap,
  FileText,
  Send,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Warehouse,
  ShoppingBag,
  Pill,
  Bell,
  RefreshCw,
  TrendingDown,
  Receipt,
  Calendar,
  Users,
  Upload,
  Navigation,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Area, AreaChart } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getStoredToken } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';

type AddressFormRecord = {
  _id: string;
  senderName?: string;
  senderPhone?: string;
  senderEmail?: string;
  senderPincode?: string;
  senderCity?: string;
  senderState?: string;
  receiverName?: string;
  receiverCity?: string;
  receiverPincode?: string;
  receiverState?: string;
  originData?: {
    companyName?: string;
    name?: string;
    mobileNumber?: string;
    email?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  destinationData?: {
    name?: string;
    mobileNumber?: string;
    email?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  assignmentData?: {
    status?:
    | 'booked'
    | 'assigned'
    | 'partially_assigned'
    | 'picked_up'
    | 'in_transit'
    | 'delivered'
    | 'failed'
    | 'received';
  };
  currentStatus?: string; // From trackings table: booked, pickup, received, assigned, intransit, reached-hub, OFP, delivered
  consignmentNumber?: number;
  bookingReference?: string;
  paymentStatus?: 'paid' | 'unpaid' | 'pending';
  totalAmount?: number;
  bookingDate?: string;
  createdAt?: string;
  updatedAt?: string;
  booked?: Array<{
    originData?: any;
    destinationData?: any;
    bookingDate?: string;
  }>;
};

type RouteKey = 'assamToNe' | 'assamToRoi';

type RouteRates = {
  assamToNe?: number;
  assamToRoi?: number;
};

type WeightSlab = {
  '01gm-250gm'?: RouteRates;
  '251gm-500gm'?: RouteRates;
  add500gm?: RouteRates;
};

type NonDoxSlab = {
  '1kg-5kg'?: RouteRates;
  '5kg-100kg'?: RouteRates;
};

type CustomerPricingSnapshot = {
  standardDox?: {
    air?: WeightSlab;
    road?: WeightSlab;
    train?: RouteRates;
  };
  standardNonDox?: {
    air?: NonDoxSlab;
    road?: NonDoxSlab;
    train?: RouteRates;
  };
  priorityPricing?: {
    base500gm?: number;
  };
};

type ServiceabilityState = {
  status: 'idle' | 'checking' | 'serviceable' | 'not-serviceable';
  city?: string;
  state?: string;
  district?: string;
};

type QuoteResult = {
  amount: number;
  chargeableWeight: number;
  minimumApplied: boolean;
  routeLabel: string;
  serviceType: string;
  modeLabel: string;
};

// Unified booking interface for status popup
interface UnifiedBooking {
  _id: string;
  bookingReference: string;
  consignmentNumber?: number;
  source: 'customer' | 'medicine' | 'corporate';
  origin: {
    name: string;
    city: string;
    mobileNumber?: string;
  };
  destination: {
    name: string;
    city: string;
    mobileNumber?: string;
  };
  status: string;
  currentStatus?: string;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  totalAmount?: number;
  bookingDate: string;
  createdAt: string;
}

const API_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL || '';
const withBase = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);
const PINCODE_PATH = '/api/pincode';
const PUBLIC_PRICING_PATH = '/api/admin/customer-pricing/public';

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatRelativeTime = (value?: string) => {
  if (!value) return '—';
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }
  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
};

const formatTimeSinceUpdate = (lastUpdate?: string) => {
  if (!lastUpdate) return '—';

  const updateDate = new Date(lastUpdate);
  const now = new Date();
  const diffMs = now.getTime() - updateDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // If less than 24 hours, show real time
  if (diffHours < 24) {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(updateDate);
  }

  // If 24 hours or more, show "1D Ago", "2D Ago", etc.
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}D Ago`;
};

const determineRoute = (pincode: string): RouteKey => {
  const pin = parseInt(pincode, 10);
  if (
    (pin >= 781000 && pin <= 788999) || // Assam
    (pin >= 790000 && pin <= 791999) || // Arunachal Pradesh
    (pin >= 793000 && pin <= 793999) || // Meghalaya
    (pin >= 795000 && pin <= 795999) || // Manipur
    (pin >= 796000 && pin <= 796999) || // Mizoram
    (pin >= 797000 && pin <= 797999) || // Nagaland
    (pin >= 737000 && pin <= 737999) || // Sikkim
    (pin >= 799000 && pin <= 799999) // Tripura
  ) {
    return 'assamToNe';
  }
  return 'assamToRoi';
};

const sanitizePincode = (value: string) => value.replace(/\D/g, '').slice(0, 6);

// Display-only status resolver - no logic, no normalization
const resolveDisplayStatus = (status?: string): string => {
  if (!status) return 'Booked';
  return status
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const statusTint: Record<string, string> = {
  // Trackings table statuses
  booked: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  pickup: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  received: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  assigned: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
  intransit: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100',
  'reached-hub': 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  OFP: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  delivered: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  // Legacy statuses for backward compatibility
  partially_assigned: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
  picked_up: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  in_transit: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100',
  failed: 'bg-rose-100 text-rose-700 hover:bg-rose-100',
  received_at_ocl: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  out_for_delivery: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  cancelled: 'bg-rose-100 text-rose-700 hover:bg-rose-100',
};

const CustomerCareOverview = () => {
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerRecords, setCustomerRecords] = useState<AddressFormRecord[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDialogSearchFocused, setIsDialogSearchFocused] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState('');

  const [originPincode, setOriginPincode] = useState('');
  const [destinationPincode, setDestinationPincode] = useState('');
  const [originState, setOriginState] = useState<ServiceabilityState>({ status: 'idle' });
  const [destinationState, setDestinationState] = useState<ServiceabilityState>({ status: 'idle' });

  const [pricingSnapshot, setPricingSnapshot] = useState<CustomerPricingSnapshot | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [serviceType, setServiceType] = useState<'standard' | 'priority'>('standard');
  const [consignmentType, setConsignmentType] = useState<'dox' | 'non-dox'>('dox');
  const [mode, setMode] = useState<'air' | 'road' | 'train'>('air');

  // Live Shipments data - fetched from AllBookings API
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeError, setActiveError] = useState('');
  const [activeTotal, setActiveTotal] = useState<number | null>(3);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [dashboardSummary, setDashboardSummary] = useState<{
    totalShipments: number;
    statusCounts: Record<string, number>;
    todayCount: number;
  } | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [checkerOpen, setCheckerOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'FP' | 'TP' | null>(null);

  const [unpaidPayments, setUnpaidPayments] = useState<{
    FP: {
      totalAmount: number;
      totalOrders: number;
      orders: Array<{
        consignmentNumber: number;
        bookingReference: string;
        amount: number;
        receiverName: string;
        receiverPhone: string;
        route: string;
        bookingDate: string;
      }>;
    };
    TP: {
      totalAmount: number;
      totalOrders: number;
      orders: Array<{
        consignmentNumber: number;
        bookingReference: string;
        amount: number;
        receiverName: string;
        receiverPhone: string;
        route: string;
        bookingDate: string;
      }>;
    };
  } | null>(null);
  const [unpaidPaymentsLoading, setUnpaidPaymentsLoading] = useState(false);

  const [courierPayments, setCourierPayments] = useState<{
    totalAmount: number;
    totalCourierBoys: number;
    totalOrders: number;
  } | null>(null);

  // Detailed courier boy payment data for popup
  const [courierBoysList, setCourierBoysList] = useState<Array<{
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    area: string;
    totalAmount: number;
    orders: Array<{
      consignmentNumber: number;
      bookingReference: string;
      amount: number;
      receiverName: string;
      receiverPhone: string;
      route: string;
      bookingDate: string;
    }>;
  }>>([]);
  const [courierBoysListLoading, setCourierBoysListLoading] = useState(false);
  const [courierBoysDialogOpen, setCourierBoysDialogOpen] = useState(false);
  const [courierBoysExpandedRows, setCourierBoysExpandedRows] = useState<Set<string>>(new Set());

  // Status popup state
  const [statusPopupOpen, setStatusPopupOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [statusBookings, setStatusBookings] = useState<UnifiedBooking[]>([]);
  const [statusBookingsLoading, setStatusBookingsLoading] = useState(false);
  const { toast } = useToast();
  const [courierPaymentsLoading, setCourierPaymentsLoading] = useState(false);

  // New features state
  const [needsAttention, setNeedsAttention] = useState<Array<{
    consignmentNumber: number;
    issueType: string;
    timeSinceUpdate: string;
    priority: 'high' | 'medium' | 'low';
    status: string;
    lastUpdate: string;
  }>>([]);
  const [needsAttentionLoading, setNeedsAttentionLoading] = useState(false);
  const [needsAttentionDialogOpen, setNeedsAttentionDialogOpen] = useState(false);

  const [selectedShipment, setSelectedShipment] = useState<{
    consignmentNumber: number;
  } | null>(null);
  const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false);
  const [shipmentTimeline, setShipmentTimeline] = useState<any>(null);
  const [shipmentLoading, setShipmentLoading] = useState(false);

  const [internalNotes, setInternalNotes] = useState<Array<{
    id: string;
    note: string;
    agentName: string;
    timestamp: string;
  }>>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const [systemAlerts, setSystemAlerts] = useState<Array<{
    id: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    dismissed: boolean;
  }>>([]);

  const [escalationDialogOpen, setEscalationDialogOpen] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationTarget, setEscalationTarget] = useState<'ops_manager' | 'hub_manager' | 'admin'>('ops_manager');
  const [escalatingShipment, setEscalatingShipment] = useState<any>(null);
  const [escalationHistory, setEscalationHistory] = useState<Record<number, {
    target: string;
    reason: string;
    agent: string;
    timestamp: string;
  }>>({});

  const [customerHistory, setCustomerHistory] = useState<{
    totalShipments: number;
    complaintsCount: number;
    isVIP: boolean;
    isRegular: boolean;
  } | null>(null);

  // Tracking data for consignments
  const [trackingDataMap, setTrackingDataMap] = useState<Record<number, {
    trackingSummary?: any;
    movementHistory?: any[];
    loading?: boolean;
    error?: string;
  }>>({});

  const [accountsSummary, setAccountsSummary] = useState<{
    totalPaid: number;
    totalUnpaid: number;
    totalAmount: number;
    medicine: {
      total: number;
      oclCharge: number;
      grandTotal: number;
      count: number;
    };
    corporate: {
      paid: number;
      unpaid: number;
      total: number;
      paidCount: number;
      unpaidCount: number;
    };
    customer: {
      paid: number;
      unpaid: number;
      total: number;
      paidCount: number;
      unpaidCount: number;
    };
    courierBoy: {
      total: number;
      count: number;
      orderCount: number;
    };
    monthlyData: Array<{
      month: string;
      paid: number;
      unpaid: number;
      total: number;
    }>;
  }>({
    totalPaid: 0,
    totalUnpaid: 0,
    totalAmount: 0,
    medicine: { total: 0, oclCharge: 0, grandTotal: 0, count: 0 },
    corporate: { paid: 0, unpaid: 0, total: 0, paidCount: 0, unpaidCount: 0 },
    customer: { paid: 0, unpaid: 0, total: 0, paidCount: 0, unpaidCount: 0 },
    courierBoy: { total: 0, count: 0, orderCount: 0 },
    monthlyData: [],
  });
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Sales Form state
  const [salesForms, setSalesForms] = useState<any[]>([]);
  const [salesFormsLoading, setSalesFormsLoading] = useState(false);
  const [salesFormsCount, setSalesFormsCount] = useState(0);
  const [salesFormsDialogOpen, setSalesFormsDialogOpen] = useState(false);
  const [selectedSalesForm, setSelectedSalesForm] = useState<any | null>(null);
  const [salesFormDetailDialogOpen, setSalesFormDetailDialogOpen] = useState(false);

  // Quick filters for Live Shipments Table
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [escalatedShipments, setEscalatedShipments] = useState<Set<number>>(new Set());
  const [shipmentNotes, setShipmentNotes] = useState<Record<number, Array<{
    id: string;
    note: string;
    agentName: string;
    timestamp: string;
  }>>>({});

  const token = useMemo(() => localStorage.getItem('officeToken'), []);

  const fetchCustomerRecords = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setCustomerRecords([]);
        setCustomerError('');
        return;
      }

      if (!token) {
        setCustomerError('Login expired. Please sign in again.');
        return;
      }

      setCustomerLoading(true);
      setCustomerError('');

      try {
        const params = new URLSearchParams({
          query: query.trim(),
        });

        const response = await fetch(`/api/office/consignments/search?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Unable to fetch consignment records');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch records');
        }

        // Transform the results to match the expected format
        const transformedRecords = (data.data || []).map((item: any) => ({
          _id: item._id,
          consignmentNumber: item.consignmentNumber,
          senderName: item.origin?.name,
          senderPhone: item.origin?.mobileNumber,
          senderEmail: item.origin?.email,
          senderPincode: item.origin?.pincode,
          senderCity: item.origin?.city,
          senderState: item.origin?.state,
          receiverName: item.destination?.name,
          receiverCity: item.destination?.city,
          receiverPincode: item.destination?.pincode,
          receiverState: item.destination?.state,
          originData: {
            companyName: item.origin?.companyName,
            name: item.origin?.name,
            mobileNumber: item.origin?.mobileNumber,
            email: item.origin?.email,
            city: item.origin?.city,
            state: item.origin?.state,
            pincode: item.origin?.pincode,
          },
          destinationData: {
            name: item.destination?.name,
            mobileNumber: item.destination?.mobileNumber,
            email: item.destination?.email,
            city: item.destination?.city,
            state: item.destination?.state,
            pincode: item.destination?.pincode,
          },
          assignmentData: {
            status: item.currentStatus,
          },
          currentStatus: item.currentStatus,
          bookingReference: item.bookingReference,
          totalAmount: item.totalAmount,
          paymentStatus: item.paymentStatus,
          bookingDate: item.bookingDate,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));

        setCustomerRecords(transformedRecords);

        // Fetch tracking data for each consignment
        if (transformedRecords.length > 0) {
          transformedRecords.forEach((record) => {
            if (record.consignmentNumber) {
              fetchTrackingData(record.consignmentNumber);
            }
          });
        }

        if (data.error) {
          setCustomerError(data.error);
        }
      } catch (err) {
        console.error(err);
        setCustomerError(err instanceof Error ? err.message : 'Failed to fetch consignment records');
        setCustomerRecords([]);
      } finally {
        setCustomerLoading(false);
      }
    },
    [token],
  );

  // Fetch tracking data for a consignment
  const fetchTrackingData = useCallback(async (consignmentNumber: number) => {
    if (!consignmentNumber) return;

    setTrackingDataMap((prev) => ({
      ...prev,
      [consignmentNumber]: { ...prev[consignmentNumber], loading: true, error: undefined }
    }));

    try {
      const [trackingResponse, movementResponse] = await Promise.all([
        fetch(`/api/tracking/${consignmentNumber}`),
        fetch(`/api/tracking/${consignmentNumber}/movement-history`)
      ]);

      if (trackingResponse.ok) {
        const data = await trackingResponse.json();
        if (data.success && data.data.trackingSummary) {
          let movementHistory = [];
          if (movementResponse.ok) {
            const movementData = await movementResponse.json();
            movementHistory = movementData.data?.movementHistory || [];
          }

          setTrackingDataMap((prev) => ({
            ...prev,
            [consignmentNumber]: {
              trackingSummary: data.data.trackingSummary,
              movementHistory,
              loading: false
            }
          }));
        } else {
          setTrackingDataMap((prev) => ({
            ...prev,
            [consignmentNumber]: { loading: false, error: 'Tracking data not available' }
          }));
        }
      } else {
        setTrackingDataMap((prev) => ({
          ...prev,
          [consignmentNumber]: { loading: false, error: 'Failed to fetch tracking data' }
        }));
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setTrackingDataMap((prev) => ({
        ...prev,
        [consignmentNumber]: { loading: false, error: 'Error loading tracking data' }
      }));
    }
  }, []);

  const handleLookupSubmit = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!customerQuery.trim()) {
        await fetchCustomerRecords(customerQuery);
        return;
      }
      setLookupOpen(true);
      await fetchCustomerRecords(customerQuery);
    },
    [customerQuery, fetchCustomerRecords],
  );

  const parsePincodeResponse = (data: any) => {
    try {
      if (!data || typeof data !== 'object') {
        return { state: '', city: '', district: '' };
      }

      const state = data?.state || '';
      const cities = data?.cities || {};
      const firstCityKey = Object.keys(cities)[0] || '';
      const city = firstCityKey;
      const districts = firstCityKey ? cities[firstCityKey]?.districts || {} : {};
      const firstDistrictKey = Object.keys(districts)[0] || '';
      const district = firstDistrictKey;

      return { state, city, district };
    } catch (error) {
      console.error('Error parsing pincode response:', error);
      return { state: '', city: '', district: '' };
    }
  };

  const runServiceabilityCheck = useCallback(
    async (pincode: string, type: 'origin' | 'destination') => {
      if (pincode.length !== 6) {
        if (type === 'origin') {
          setOriginState({ status: 'idle' });
        } else {
          setDestinationState({ status: 'idle' });
        }
        return;
      }

      if (type === 'origin') {
        setOriginState((prev) => ({ ...prev, status: 'checking' }));
      } else {
        setDestinationState((prev) => ({ ...prev, status: 'checking' }));
      }

      try {
        const response = await fetch(withBase(`${PINCODE_PATH}/${pincode}`));
        if (!response.ok) {
          throw new Error('Service unavailable');
        }
        const data = await response.json();
        const parsed = parsePincodeResponse(data);
        const isServiceable = Boolean(data);
        const nextState: ServiceabilityState = {
          status: isServiceable ? 'serviceable' : 'not-serviceable',
          ...parsed,
        };

        if (type === 'origin') {
          setOriginState(nextState);
        } else {
          setDestinationState(nextState);
        }
      } catch (error) {
        console.error('Failed to check serviceability', error);
        const nextState: ServiceabilityState = { status: 'not-serviceable' };
        if (type === 'origin') {
          setOriginState(nextState);
        } else {
          setDestinationState(nextState);
        }
      }
    },
    [],
  );

  const fetchPricingSnapshot = useCallback(async () => {
    setPricingLoading(true);
    try {
      const response = await fetch(withBase(PUBLIC_PRICING_PATH));
      if (!response.ok) {
        throw new Error('Unable to load pricing matrix');
      }
      const payload = await response.json();
      setPricingSnapshot(payload?.data || payload || null);
    } catch (error) {
      console.error('Pricing fetch failed', error);
      setPricingSnapshot(null);
    } finally {
      setPricingLoading(false);
    }
  }, []);

  const fetchActiveOrders = useCallback(async () => {
    if (!token) {
      setActiveError('Login expired. Please sign in again.');
      setActiveLoading(false);
      return;
    }

    setActiveLoading(true);
    setActiveError('');

    try {
      // Fetch summary and recent tracking data using office endpoints
      const [summary, trackingResponse] = await Promise.all([
        dashboardService.getSummary(),
        fetch('/api/office/tracking?limit=500', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Store summary for status counts
      setDashboardSummary(summary);

      const allBookings: any[] = [];

      // Process tracking data (office endpoint accessible to office users)
      if (trackingResponse.ok) {
        const trackingData = await trackingResponse.json();
        if (trackingData.success && Array.isArray(trackingData.data)) {
          const transformed = trackingData.data.map((item: any) => {
            // Extract origin and destination from booked array (Tracking model structure)
            const bookedEntry = item.booked?.[0] || {};
            const originData = bookedEntry.originData || {};
            const destinationData = bookedEntry.destinationData || {};
            const invoiceData = bookedEntry.invoiceData || {};

            // Determine source based on assignmentType (from Tracking model)
            // assignmentType can be: 'corporate', 'office_user', 'courier_boy', 'medicine', 'online_customer'
            let source: 'customer' | 'medicine' | 'corporate' = 'customer';
            if (item.assignmentType === 'medicine') {
              source = 'medicine';
            } else if (item.assignmentType === 'corporate' || item.corporateId) {
              source = 'corporate';
            } else if (item.assignmentType === 'online_customer') {
              source = 'customer';
            }

            // Extract payment status from bookedEntry (matching AllBookings.tsx corporate booking structure)
            const paymentStatus = bookedEntry.paymentStatus === 'paid' ? 'paid' : 'unpaid';

            // Extract total amount from invoiceData.finalPrice (matching AllBookings.tsx corporate booking structure)
            const totalAmount = invoiceData.finalPrice
              ? parseFloat(invoiceData.finalPrice.toString())
              : 0;

            return {
              _id: item._id || item.consignmentNumber?.toString() || '',
              consignmentNumber: item.consignmentNumber,
              bookingReference: item.bookingReference || item.consignmentNumber?.toString() || '',
              source: source,
              origin: {
                name: originData.name || 'N/A',
                companyName: originData.companyName,
                mobileNumber: originData.mobileNumber || '',
                email: originData.email,
                locality: originData.locality,
                flatBuilding: originData.flatBuilding,
                landmark: originData.landmark,
                pincode: originData.pincode || '',
                area: originData.area,
                city: originData.city || 'N/A',
                district: originData.district,
                state: originData.state || '',
                gstNumber: originData.gstNumber,
                addressType: originData.addressType,
              },
              destination: {
                name: destinationData.name || 'N/A',
                companyName: destinationData.companyName,
                mobileNumber: destinationData.mobileNumber || '',
                email: destinationData.email,
                locality: destinationData.locality,
                flatBuilding: destinationData.flatBuilding,
                landmark: destinationData.landmark,
                pincode: destinationData.pincode || '',
                area: destinationData.area,
                city: destinationData.city || 'N/A',
                district: destinationData.district,
                state: destinationData.state || '',
                gstNumber: destinationData.gstNumber,
                addressType: destinationData.addressType,
              },
              currentStatus: item.currentStatus || 'booked',
              paymentStatus: paymentStatus,
              totalAmount: totalAmount,
              bookingDate: bookedEntry.bookingDate || item.createdAt,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt || item.createdAt,
            };
          });
          allBookings.push(...transformed);
        }
      }

      // Filter out only cancelled and returned bookings (keep delivered/completed for recent shipments)
      const liveBookings = allBookings.filter((booking: any) => {
        const status = booking.currentStatus?.toLowerCase() || '';
        return status !== 'cancelled' && status !== 'returned';
      });

      // Debug logging
      console.log(`📦 Live Shipments: ${allBookings.length} total bookings, ${liveBookings.length} after filtering (excluding cancelled/returned)`);
      if (allBookings.length > 0) {
        const sample = allBookings[0];
        console.log('📊 Sample booking data:', {
          consignmentNumber: sample.consignmentNumber,
          source: sample.source,
          paymentStatus: sample.paymentStatus,
          totalAmount: sample.totalAmount,
          originName: sample.origin?.name,
          destinationName: sample.destination?.name,
        });
      }

      // Calculate SLA for each booking and determine flags
      const transformed = liveBookings.map((booking: any) => {
        const status = booking.currentStatus?.toLowerCase() || 'booked';
        const updatedAt = new Date(booking.updatedAt || booking.createdAt);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

        // Simple SLA calculation
        let sla: any = { status: 'ok' as const };
        if (status === 'out_for_delivery' || status === 'ofp') {
          if (hoursSinceUpdate > 48) {
            sla = { status: 'breached' as const, breachedByHours: Math.round(hoursSinceUpdate - 48) };
          } else if (hoursSinceUpdate > 24) {
            sla = { status: 'warning' as const, hoursRemaining: Math.round(48 - hoursSinceUpdate) };
          }
        }

        // Determine flags
        const flags: string[] = [];
        if (booking.paymentStatus === 'unpaid') {
          flags.push('payment_issue');
        }

        return {
          _id: booking._id,
          consignmentNumber: booking.consignmentNumber,
          source: booking.source,
          origin: booking.origin,
          destination: booking.destination,
          currentStatus: booking.currentStatus || 'booked',
          paymentStatus: booking.paymentStatus,
          totalAmount: booking.totalAmount,
          bookingDate: booking.bookingDate || booking.createdAt,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt || booking.createdAt,
          sla,
          flags,
        };
      });

      // Sort by updatedAt/createdAt/bookingDate (most recent first)
      transformed.sort((a, b) => {
        const dateA = new Date((a as any).updatedAt || (a as any).createdAt || (a as any).bookingDate || 0).getTime();
        const dateB = new Date((b as any).updatedAt || (b as any).createdAt || (b as any).bookingDate || 0).getTime();
        return dateB - dateA; // Most recent first
      });

      // Update orders with real data (filteredActiveOrders will automatically limit to 5 most recent)
      setActiveOrders(transformed);
      setActiveTotal(summary.totalShipments);

    } catch (error) {
      console.error(error);
      setActiveError(error instanceof Error ? error.message : 'Failed to load shipment data');
      setActiveOrders([]);
      setActiveTotal(0);
    } finally {
      setActiveLoading(false);
    }
  }, [token]);

  // Fetch bookings by status for popup
  const fetchBookingsByStatus = useCallback(async (status: string) => {
    if (!token) {
      setStatusBookings([]);
      return;
    }

    setStatusBookingsLoading(true);
    try {
      // Map status keys to API status values
      const statusMap: Record<string, string> = {
        'total': 'all',
        'booked': 'booked',
        'pickup': 'picked_up',
        'picked': 'picked_up',
        'received': 'received',
        'intransit': 'in_transit',
        'in_transit': 'in_transit',
        'reached-hub': 'reached-hub',
        'reached_hub': 'reached-hub',
        'OFP': 'out_for_delivery',
        'ofp': 'out_for_delivery',
        'out_for_delivery': 'out_for_delivery',
        'delivered': 'delivered',
      };

      const apiStatus = statusMap[status.toLowerCase()] || status.toLowerCase();

      // Use office tracking endpoint instead of admin endpoints
      const trackingResponse = await fetch(
        `/api/office/tracking${apiStatus !== 'all' ? `?status=${apiStatus}&limit=1000` : '?limit=1000'}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const allBookings: UnifiedBooking[] = [];

      // Process tracking data
      if (trackingResponse.ok) {
        const trackingData = await trackingResponse.json();
        if (trackingData.success && Array.isArray(trackingData.data)) {
          const transformed = trackingData.data.map((item: any) => {
            // Extract data from booked array (Tracking model structure)
            const bookedEntry = item.booked?.[0] || {};
            const originData = bookedEntry.originData || {};
            const destinationData = bookedEntry.destinationData || {};
            const invoiceData = bookedEntry.invoiceData || {};

            // Determine source based on assignmentType
            let source: 'customer' | 'medicine' | 'corporate' = 'customer';
            if (item.assignmentType === 'medicine') {
              source = 'medicine';
            } else if (item.assignmentType === 'corporate' || item.corporateId) {
              source = 'corporate';
            } else if (item.assignmentType === 'online_customer') {
              source = 'customer';
            }

            // Extract payment status from bookedEntry (matching AllBookings.tsx structure)
            const paymentStatus = bookedEntry.paymentStatus === 'paid' ? 'paid' : 'unpaid';

            // Extract total amount from invoiceData.finalPrice (matching AllBookings.tsx structure)
            const totalAmount = invoiceData.finalPrice
              ? parseFloat(invoiceData.finalPrice.toString())
              : 0;

            return {
              _id: item._id || item.consignmentNumber?.toString() || '',
              bookingReference: item.bookingReference || item.consignmentNumber?.toString() || '',
              consignmentNumber: item.consignmentNumber,
              source: source,
              origin: {
                name: originData.name || 'N/A',
                city: originData.city || 'N/A',
                mobileNumber: originData.mobileNumber || '',
              },
              destination: {
                name: destinationData.name || 'N/A',
                city: destinationData.city || 'N/A',
                mobileNumber: destinationData.mobileNumber || '',
              },
              status: item.currentStatus || 'booked',
              currentStatus: item.currentStatus || 'booked',
              paymentStatus: paymentStatus,
              totalAmount: totalAmount,
              bookingDate: bookedEntry.bookingDate || item.createdAt,
              createdAt: item.createdAt,
            };
          });
          allBookings.push(...transformed);
        }
      }

      // Sort by date (newest first)
      allBookings.sort((a, b) => {
        const dateA = new Date(a.bookingDate || a.createdAt).getTime();
        const dateB = new Date(b.bookingDate || b.createdAt).getTime();
        return dateB - dateA;
      });

      setStatusBookings(allBookings);
    } catch (error) {
      console.error('Error fetching bookings by status:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive",
      });
      setStatusBookings([]);
    } finally {
      setStatusBookingsLoading(false);
    }
  }, [token, toast]);

  // Handle status card click
  const handleStatusCardClick = useCallback((statusKey: string) => {
    setSelectedStatus(statusKey);
    setStatusPopupOpen(true);
    fetchBookingsByStatus(statusKey);
  }, [fetchBookingsByStatus]);

  const handleQuote = useCallback(() => {
    setQuoteError('');

    if (!pricingSnapshot) {
      setQuoteError('Pricing matrix is unavailable. Refresh and try again.');
      return;
    }

    if (!destinationPincode || destinationPincode.length !== 6) {
      setQuoteError('Destination pincode required for routing.');
      return;
    }

    const weight = parseFloat(weightInput);
    if (Number.isNaN(weight) || weight <= 0) {
      setQuoteError('Enter a valid chargeable weight in kilograms.');
      return;
    }

    const routeKey = determineRoute(destinationPincode);
    let price = 0;
    let chargeableWeight = weight;
    let minimumApplied = false;
    const isDox = consignmentType === 'dox';

    if (serviceType === 'priority') {
      const weightInGrams = weight * 1000;
      if (weightInGrams > 100000) {
        setQuoteError('For >100kg please escalate to pricing desk.');
        return;
      }
      const pricePer500gm = Number(pricingSnapshot.priorityPricing?.base500gm) || 0;
      const units = Math.ceil(weightInGrams / 500);
      price = pricePer500gm * units;
    } else if (isDox) {
      const weightInGrams = weight * 1000;
      if (mode === 'train') {
        const minKg = 25;
        chargeableWeight = Math.max(weight, minKg);
        minimumApplied = chargeableWeight > weight;
        const perKg = Number(pricingSnapshot.standardDox?.train?.[routeKey]) || 0;
        price = perKg * chargeableWeight;
      } else {
        const slab = pricingSnapshot.standardDox?.[mode];
        if (!slab) {
          setQuoteError('Mode unavailable for DOX.');
          return;
        }
        const minGrams = mode === 'road' ? 3000 : 0;
        const chargeableGrams = Math.max(weightInGrams, minGrams);
        minimumApplied = chargeableGrams > weightInGrams;
        if (chargeableGrams <= 250) {
          price = Number(slab['01gm-250gm']?.[routeKey]) || 0;
        } else if (chargeableGrams <= 500) {
          price = Number(slab['251gm-500gm']?.[routeKey]) || 0;
        } else {
          const base = Number(slab['251gm-500gm']?.[routeKey]) || 0;
          const additionalBlocks = Math.ceil((chargeableGrams - 500) / 500);
          const additional = Number(slab.add500gm?.[routeKey]) || 0;
          price = base + additionalBlocks * additional;
        }
      }
    } else {
      if (mode === 'train') {
        const minKg = 25;
        chargeableWeight = Math.max(weight, minKg);
        minimumApplied = chargeableWeight > weight;
        const perKg = Number(pricingSnapshot.standardNonDox?.train?.[routeKey]) || 0;
        price = perKg * chargeableWeight;
      } else {
        const slab = pricingSnapshot.standardNonDox?.[mode];
        if (!slab) {
          setQuoteError('Mode unavailable for NON DOX.');
          return;
        }

        const minKg = mode === 'road' ? 3 : 0;
        chargeableWeight = Math.max(weight, minKg);
        minimumApplied = chargeableWeight > weight;

        const slabKey = chargeableWeight <= 5 ? '1kg-5kg' : '5kg-100kg';
        const perKg = Number(slab[slabKey]?.[routeKey]) || 0;
        price = perKg * chargeableWeight;
      }
    }

    setQuoteResult({
      amount: Number(price.toFixed(2)),
      chargeableWeight,
      minimumApplied,
      routeLabel: routeKey === 'assamToNe' ? 'Assam ➜ North East' : 'Assam ➜ Rest of India',
      serviceType: serviceType === 'priority' ? 'Priority' : `Standard • ${consignmentType.toUpperCase()}`,
      modeLabel: serviceType === 'priority' ? 'Unified' : mode.toUpperCase(),
    });
  }, [consignmentType, destinationPincode, mode, pricingSnapshot, serviceType, weightInput]);

  const fetchUnpaidPayments = useCallback(async () => {
    if (!token) return;

    setUnpaidPaymentsLoading(true);
    try {
      const data = await paymentsService.getUnpaidPayments();
      setUnpaidPayments(data);
    } catch (error) {
      console.error('Error fetching unpaid payments:', error);
      setUnpaidPayments(null);
    } finally {
      setUnpaidPaymentsLoading(false);
    }
  }, [token]);

  const fetchCourierPayments = useCallback(async () => {
    if (!token) return;

    setCourierPaymentsLoading(true);
    try {
      const data = await paymentsService.getCourierPaymentsSummary();
      setCourierPayments(data);
    } catch (error) {
      console.error('Error fetching courier payments:', error);
    } finally {
      setCourierPaymentsLoading(false);
    }
  }, [token]);

  // Fetch detailed courier boys list with payments
  const fetchCourierBoysList = useCallback(async () => {
    if (!token) return;

    setCourierBoysListLoading(true);
    try {
      const [courierBoysResponse, paymentsResponse] = await Promise.all([
        fetch('/api/office/courier-boys/list', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/office/courier-boys/payments', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!courierBoysResponse.ok || !paymentsResponse.ok) {
        throw new Error('Failed to fetch courier boys data');
      }

      const courierBoysData = await courierBoysResponse.json();
      const paymentsData = await paymentsResponse.json();

      if (courierBoysData.success && paymentsData.success) {
        const courierBoys = courierBoysData.data || [];
        const payments = paymentsData.data || [];

        // Merge courier boys with payment data
        const merged = courierBoys.map((cb: any) => {
          const payment = payments.find((p: any) => p.courierBoyId === cb._id);
          return {
            _id: cb._id,
            fullName: cb.fullName,
            email: cb.email,
            phone: cb.phone,
            area: cb.area,
            totalAmount: payment?.totalAmount || 0,
            orders: payment?.orders || []
          };
        });

        setCourierBoysList(merged);
      }
    } catch (error) {
      console.error('Error fetching courier boys list:', error);
      toast({
        title: "Error",
        description: "Failed to load courier boys data",
        variant: "destructive",
      });
    } finally {
      setCourierBoysListLoading(false);
    }
  }, [token, toast]);

  // Fetch needs attention shipments from all three tabs (undelivered, RTO, reserve)
  const fetchNeedsAttention = useCallback(async () => {
    if (!token) return;

    setNeedsAttentionLoading(true);
    try {
      // Fetch from all three statuses in parallel using office endpoint
      const [undeliveredResponse, rtoResponse, reserveResponse] = await Promise.all([
        fetch(`/api/office/tracking?status=undelivered&limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/office/tracking?status=rto&limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/office/tracking?status=reserve&limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Helper function to transform data
      const transformRecord = (item: any, statusType: 'undelivered' | 'rto' | 'reserve') => {
        const unreachableAttempts = item.unreachable?.attempts || [];
        const lastAttempt = unreachableAttempts[unreachableAttempts.length - 1];
        const lastReason = lastAttempt?.reason || '';

        // Determine priority based on unreachable attempts count and status
        let priority: 'high' | 'medium' | 'low' = 'low';
        const attemptCount = unreachableAttempts.length || 0;
        if (statusType === 'rto') {
          priority = 'high'; // RTO is always high priority
        } else if (statusType === 'reserve') {
          priority = 'medium'; // Reserve is medium priority
        } else if (attemptCount >= 3) {
          priority = 'high';
        } else if (attemptCount >= 2) {
          priority = 'medium';
        }

        // Determine issue type based on status
        let issueType = '';
        if (statusType === 'rto') {
          issueType = 'Return to Origin';
        } else if (statusType === 'reserve') {
          issueType = 'Reserve - Needs Courier Assignment';
        } else {
          // For undelivered
          if (lastReason.toLowerCase().includes('delayed')) {
            issueType = 'Delayed beyond SLA';
          } else if (item.currentStatus === 'out_for_delivery' || item.OFD?.length > 0) {
            issueType = 'Out for Delivery too long';
          } else if (lastReason) {
            issueType = lastReason;
          } else {
            issueType = 'Undelivered';
          }
        }

        return {
          consignmentNumber: item.consignmentNumber || 0,
          issueType: issueType,
          timeSinceUpdate: item.updatedAt || item.createdAt || '',
          priority: priority,
          status: item.currentStatus || statusType,
          lastUpdate: item.updatedAt || item.createdAt || '',
        };
      };

      // Process all responses
      const allRecords: any[] = [];

      if (undeliveredResponse.ok) {
        const undeliveredResult = await undeliveredResponse.json();
        const undeliveredRecords = undeliveredResult.data || [];
        console.log(`Fetched ${undeliveredRecords.length} undelivered records`);
        allRecords.push(...undeliveredRecords.map((item: any) => transformRecord(item, 'undelivered')));
      } else {
        const errorText = await undeliveredResponse.text();
        console.error('Failed to fetch undelivered:', undeliveredResponse.status, errorText);
      }

      if (rtoResponse.ok) {
        const rtoResult = await rtoResponse.json();
        const rtoRecords = rtoResult.data || [];
        console.log(`Fetched ${rtoRecords.length} RTO records`);
        allRecords.push(...rtoRecords.map((item: any) => transformRecord(item, 'rto')));
      } else {
        const errorText = await rtoResponse.text();
        console.error('Failed to fetch RTO:', rtoResponse.status, errorText);
      }

      if (reserveResponse.ok) {
        const reserveResult = await reserveResponse.json();
        const reserveRecords = reserveResult.data || [];
        console.log(`Fetched ${reserveRecords.length} reserve records`);
        allRecords.push(...reserveRecords.map((item: any) => transformRecord(item, 'reserve')));
      } else {
        const errorText = await reserveResponse.text();
        console.error('Failed to fetch reserve:', reserveResponse.status, errorText);
      }

      console.log(`Total needs attention records: ${allRecords.length}`);

      // Sort by lastUpdate (most recent first)
      allRecords.sort((a, b) => {
        const dateA = new Date(a.lastUpdate || 0).getTime();
        const dateB = new Date(b.lastUpdate || 0).getTime();
        return dateB - dateA;
      });

      setNeedsAttention(allRecords);
    } catch (error) {
      console.error('Error fetching needs attention:', error);
      setNeedsAttention([]);
    } finally {
      setNeedsAttentionLoading(false);
    }
  }, [token]);

  // Fetch detailed shipment timeline
  const fetchShipmentTimeline = useCallback(async (consignmentNumber: number) => {
    if (!token) return;

    setShipmentLoading(true);
    try {
      const [shipment, notes, escalations] = await Promise.all([
        shipmentsService.getShipmentDetails(consignmentNumber),
        shipmentActionsService.getNotes(consignmentNumber),
        shipmentActionsService.getEscalations(consignmentNumber),
      ]);

      if (shipment) {
        setShipmentTimeline(shipment);
        setInternalNotes(notes);

        // Set escalation history
        if (escalations.length > 0) {
          const latestEscalation = escalations[escalations.length - 1];
          setEscalationHistory((prev) => ({
            ...prev,
            [consignmentNumber]: {
              target: latestEscalation.target,
              reason: latestEscalation.reason,
              agent: latestEscalation.agent,
              timestamp: latestEscalation.timestamp,
            },
          }));
          setEscalatedShipments((prev) => new Set([...prev, consignmentNumber]));
        }

        // Fetch customer history (simplified - would need proper API)
        const bookedEntry = shipment.booked?.[0];
        const customerPhone = bookedEntry?.originData?.mobileNumber || bookedEntry?.destinationData?.mobileNumber;

        if (customerPhone) {
          // TODO: Replace with proper customer history API
          setCustomerHistory({
            totalShipments: 0,
            complaintsCount: 0,
            isVIP: false,
            isRegular: false,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching shipment timeline:', error);
    } finally {
      setShipmentLoading(false);
    }
  }, [token]);

  // Add internal note
  const addInternalNote = useCallback(async (consignmentNumber: number) => {
    if (!newNote.trim() || !token) return;

    setAddingNote(true);
    try {
      const note = await shipmentActionsService.addNote(consignmentNumber, newNote.trim());
      setInternalNotes((prev) => [...prev, note]);
      setShipmentNotes((prev) => ({
        ...prev,
        [consignmentNumber]: [...(prev[consignmentNumber] || []), note],
      }));
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setAddingNote(false);
    }
  }, [newNote, token]);

  // Handle escalation
  const handleEscalation = useCallback(async () => {
    if (!escalationReason.trim() || !escalatingShipment || !token) return;

    try {
      const consignmentNumber = escalatingShipment.consignmentNumber;
      const escalation = await shipmentActionsService.escalate(
        consignmentNumber,
        escalationTarget,
        escalationReason.trim()
      );

      // Mark as escalated
      setEscalatedShipments((prev) => new Set([...prev, consignmentNumber]));

      // Store escalation history
      setEscalationHistory((prev) => ({
        ...prev,
        [consignmentNumber]: {
          target: escalation.target,
          reason: escalation.reason,
          agent: escalation.agent,
          timestamp: escalation.timestamp,
        },
      }));

      setEscalationDialogOpen(false);
      setEscalationReason('');
      setEscalatingShipment(null);
    } catch (error) {
      console.error('Error escalating:', error);
    }
  }, [escalationReason, escalationTarget, escalatingShipment, token]);

  // SLA status comes from backend - no calculation needed

  // Fetch sales forms
  const fetchSalesForms = useCallback(async () => {
    if (!token) return;

    setSalesFormsLoading(true);
    try {
      const response = await fetch('/api/sales-form?limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setSalesForms(data.data);
          setSalesFormsCount(data.pagination?.total || data.data.length);
        }
      }
    } catch (error) {
      console.error('Error fetching sales forms:', error);
    } finally {
      setSalesFormsLoading(false);
    }
  }, [token]);

  // Fetch individual sales form details
  const fetchSalesFormDetails = useCallback(async (id: string) => {
    if (!token) return;

    try {
      // First, fetch the sales form details
      const response = await fetch(`/api/sales-form/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const salesForm = data.data;

          // If status is "pending", update it to "seen"
          if (salesForm.status === 'pending') {
            try {
              const updateResponse = await fetch(`/api/sales-form/${id}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'seen' })
              });

              if (updateResponse.ok) {
                const updateData = await updateResponse.json();
                if (updateData.success) {
                  // Update the local state to reflect the status change
                  setSalesForms(prevForms =>
                    prevForms.map(form =>
                      form._id === id ? { ...form, status: 'seen' } : form
                    )
                  );
                  // Update the selected form with the new status
                  salesForm.status = 'seen';
                }
              }
            } catch (updateError) {
              console.error('Error updating sales form status:', updateError);
              // Continue to show the form even if status update fails
            }
          }

          setSelectedSalesForm(salesForm);
          setSalesFormDetailDialogOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching sales form details:', error);
      toast({
        title: "Error",
        description: "Failed to load sales form details.",
        variant: "destructive",
      });
    }
  }, [token, toast]);

  // Fetch accounts data
  const fetchAccountsData = useCallback(async () => {
    try {
      setAccountsLoading(true);
      if (!token) {
        setAccountsLoading(false);
        return;
      }

      // Parse selected month (format: YYYY-MM)
      const [year, monthStr] = selectedMonth.split('-');
      const month = parseInt(monthStr, 10);
      const yearNum = parseInt(year, 10);

      const [
        medicineSummaryRes,
        medicineSettlementsRes,
        customerBookingsRes,
        medicineBookingsRes,
        corporateBookingsRes,
        courierPaymentsRes,
      ] = await Promise.all([
        fetch(`/api/admin/medicine/settlements/summary?month=${month}&year=${yearNum}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => ({ ok: false })),
        fetch(`/api/admin/medicine/settlements?month=${month}&year=${yearNum}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => ({ ok: false })),
        fetch('/api/admin/customer-bookings', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => ({ ok: false })),
        fetch('/api/admin/medicine/bookings?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => ({ ok: false })),
        fetch('/api/admin/corporate-bookings', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => ({ ok: false })),
        fetch('/api/office/courier-boys/payments', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => ({ ok: false })),
      ]);

      const newSummary = {
        totalPaid: 0,
        totalUnpaid: 0,
        totalAmount: 0,
        medicine: { total: 0, oclCharge: 0, grandTotal: 0, count: 0 },
        corporate: { paid: 0, unpaid: 0, total: 0, paidCount: 0, unpaidCount: 0 },
        customer: { paid: 0, unpaid: 0, total: 0, paidCount: 0, unpaidCount: 0 },
        courierBoy: { total: 0, count: 0, orderCount: 0 },
        monthlyData: [] as Array<{ month: string; paid: number; unpaid: number; total: number }>,
      };

      const monthlyMap = new Map<string, { paid: number; unpaid: number; total: number }>();

      if (medicineSummaryRes.ok && 'json' in medicineSummaryRes) {
        try {
          const medicineSummary = await medicineSummaryRes.json();
          if (medicineSummary.success) {
            newSummary.medicine.total = medicineSummary.data?.total || 0;
            newSummary.medicine.oclCharge = medicineSummary.data?.oclCharge || 0;
            newSummary.medicine.grandTotal = newSummary.medicine.total - newSummary.medicine.oclCharge;
          }
        } catch (e) {
          console.error('Error parsing medicine summary:', e);
        }
      }

      if (medicineSettlementsRes.ok && 'json' in medicineSettlementsRes) {
        try {
          const settlements = await medicineSettlementsRes.json();
          if (settlements.success && Array.isArray(settlements.data)) {
            newSummary.medicine.count = settlements.data.length;
          }
        } catch (e) {
          console.error('Error parsing medicine settlements:', e);
        }
      }

      if (customerBookingsRes.ok && 'json' in customerBookingsRes) {
        try {
          const customerData = await customerBookingsRes.json();
          if (customerData.success && Array.isArray(customerData.data)) {
            customerData.data.forEach((booking: any) => {
              const amount = booking.totalAmount || booking.calculatedPrice || 0;
              if (amount > 0) {
                newSummary.customer.total += amount;
                const bookingDate = new Date(booking.bookingDate || booking.createdAt);
                const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;

                if (!monthlyMap.has(monthKey)) {
                  monthlyMap.set(monthKey, { paid: 0, unpaid: 0, total: 0 });
                }
                const monthData = monthlyMap.get(monthKey)!;
                monthData.total += amount;

                if (booking.paymentStatus === 'paid') {
                  newSummary.customer.paid += amount;
                  newSummary.customer.paidCount++;
                  monthData.paid += amount;
                } else {
                  newSummary.customer.unpaid += amount;
                  newSummary.customer.unpaidCount++;
                  monthData.unpaid += amount;
                }
              }
            });
          }
        } catch (e) {
          console.error('Error parsing customer bookings:', e);
        }
      }

      if (medicineBookingsRes.ok && 'json' in medicineBookingsRes) {
        try {
          const medicineData = await medicineBookingsRes.json();
          if (medicineData.success && Array.isArray(medicineData.bookings)) {
            medicineData.bookings.forEach((booking: any) => {
              const amount = booking.charges?.grandTotal
                ? parseFloat(booking.charges.grandTotal)
                : 0;
              if (amount > 0) {
                newSummary.customer.total += amount;
                const bookingDate = new Date(booking.createdAt || booking.bookingDate);
                const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;

                if (!monthlyMap.has(monthKey)) {
                  monthlyMap.set(monthKey, { paid: 0, unpaid: 0, total: 0 });
                }
                const monthData = monthlyMap.get(monthKey)!;
                monthData.total += amount;

                const isPaid = booking.payment?.mode ? true : false;
                if (isPaid) {
                  newSummary.customer.paid += amount;
                  newSummary.customer.paidCount++;
                  monthData.paid += amount;
                } else {
                  newSummary.customer.unpaid += amount;
                  newSummary.customer.unpaidCount++;
                  monthData.unpaid += amount;
                }
              }
            });
          }
        } catch (e) {
          console.error('Error parsing medicine bookings:', e);
        }
      }

      if (corporateBookingsRes.ok && 'json' in corporateBookingsRes) {
        try {
          const corporateData = await corporateBookingsRes.json();
          if (corporateData.success && Array.isArray(corporateData.data)) {
            corporateData.data.forEach((group: any) => {
              if (Array.isArray(group.bookings)) {
                group.bookings.forEach((booking: any) => {
                  const amount = booking.invoiceData?.finalPrice || 0;
                  if (amount > 0) {
                    newSummary.corporate.total += amount;
                    const bookingDate = new Date(booking.bookingDate || booking.createdAt);
                    const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;

                    if (!monthlyMap.has(monthKey)) {
                      monthlyMap.set(monthKey, { paid: 0, unpaid: 0, total: 0 });
                    }
                    const monthData = monthlyMap.get(monthKey)!;
                    monthData.total += amount;

                    if (booking.paymentStatus === 'paid') {
                      newSummary.corporate.paid += amount;
                      newSummary.corporate.paidCount++;
                      monthData.paid += amount;
                    } else {
                      newSummary.corporate.unpaid += amount;
                      newSummary.corporate.unpaidCount++;
                      monthData.unpaid += amount;
                    }
                  }
                });
              }
            });
          }
        } catch (e) {
          console.error('Error parsing corporate bookings:', e);
        }
      }

      if (courierPaymentsRes.ok && 'json' in courierPaymentsRes) {
        try {
          const courierData = await courierPaymentsRes.json();
          if (courierData.success && Array.isArray(courierData.data)) {
            courierData.data.forEach((payment: any) => {
              const amount = payment.totalAmount || 0;
              if (amount > 0) {
                newSummary.courierBoy.total += amount;
                newSummary.courierBoy.orderCount += payment.orders?.length || 0;
              }
            });
            newSummary.courierBoy.count = courierData.data.length;
          }
        } catch (e) {
          console.error('Error parsing courier payments:', e);
        }
      }

      newSummary.totalPaid =
        newSummary.corporate.paid + newSummary.customer.paid + newSummary.courierBoy.total;
      newSummary.totalUnpaid =
        newSummary.corporate.unpaid + newSummary.customer.unpaid;
      newSummary.totalAmount = newSummary.totalPaid + newSummary.totalUnpaid;

      newSummary.monthlyData = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          ...data,
        }))
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(-6);

      setAccountsSummary(newSummary);
    } catch (error) {
      console.error('Error fetching accounts data:', error);
    } finally {
      setAccountsLoading(false);
    }
  }, [token, selectedMonth]);

  useEffect(() => {
    fetchPricingSnapshot();
    fetchActiveOrders();
    fetchUnpaidPayments();
    fetchCourierPayments();
    fetchNeedsAttention();
    fetchAccountsData();
    fetchSalesForms();
  }, [fetchPricingSnapshot, fetchActiveOrders, fetchUnpaidPayments, fetchCourierPayments, fetchNeedsAttention, fetchAccountsData, fetchSalesForms]);

  // Helper function to open timeline drawer
  const openShipmentTimeline = useCallback((consignmentNumber: number) => {
    setSelectedShipment({ consignmentNumber });
  }, []);

  // Open timeline drawer only when selectedShipment is explicitly set
  useEffect(() => {
    if (!selectedShipment?.consignmentNumber) {
      // Reset drawer state when no shipment is selected
      setTimelineDrawerOpen(false);
      return;
    }

    console.log('Opening timeline for consignment:', selectedShipment.consignmentNumber);
    fetchShipmentTimeline(selectedShipment.consignmentNumber);
    setTimelineDrawerOpen(true);
    // Load notes for this shipment
    const notes = shipmentNotes[selectedShipment.consignmentNumber] || [];
    setInternalNotes(notes);
  }, [selectedShipment, fetchShipmentTimeline]);

  // Filter and sort activeOrders to show only the 5 most recent shipments
  // Sort by updatedAt/createdAt (most recent first) and limit to 5
  const filteredActiveOrders = useMemo(() => {
    // Sort by most recent first (using updatedAt or createdAt)
    const sorted = [...activeOrders].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || a.bookingDate || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || b.bookingDate || 0).getTime();
      return dateB - dateA; // Most recent first
    });

    // Return only the 5 most recent
    return sorted.slice(0, 5);
  }, [activeOrders]);

  // Get status badge variant and icon (from AllBookings.tsx)
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
          icon: <Activity className="h-4 w-4" />,
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

  // Get source badge (from AllBookings.tsx)
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'customer':
        return { label: 'Customer', color: 'bg-blue-100 text-blue-800', hoverColor: 'hover:!bg-blue-100', icon: <User className="h-3 w-3" /> };
      case 'medicine':
        return { label: 'Medicine', color: 'bg-purple-100 text-purple-800', hoverColor: 'hover:!bg-purple-100', icon: <Pill className="h-3 w-3" /> };
      case 'corporate':
        return { label: 'Corporate', color: 'bg-teal-100 text-teal-800', hoverColor: 'hover:!bg-teal-100', icon: <Building2 className="h-3 w-3" /> };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', hoverColor: 'hover:!bg-gray-100', icon: <Package className="h-3 w-3" /> };
    }
  };

  // Get hover override class for status badge
  const getStatusHoverClass = (bgColor: string) => {
    if (bgColor.includes('gray')) return 'hover:!bg-gray-100';
    if (bgColor.includes('blue')) return 'hover:!bg-blue-100';
    if (bgColor.includes('cyan')) return 'hover:!bg-cyan-100';
    if (bgColor.includes('green')) return 'hover:!bg-green-100';
    if (bgColor.includes('indigo')) return 'hover:!bg-indigo-100';
    if (bgColor.includes('orange')) return 'hover:!bg-orange-100';
    if (bgColor.includes('teal')) return 'hover:!bg-teal-100';
    if (bgColor.includes('purple')) return 'hover:!bg-purple-100';
    if (bgColor.includes('red')) return 'hover:!bg-red-100';
    return 'hover:!bg-gray-100';
  };

  // Format date (from AllBookings.tsx)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency for accounts
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = {
    corporate: '#14b8a6',
    customer: '#3b82f6',
    medicine: '#a855f7',
    courierBoy: '#f97316',
    paid: '#10b981',
    unpaid: '#ef4444',
  };

  const paymentDistributionData = useMemo(() => [
    { name: 'Corporate', value: accountsSummary.corporate.total, color: COLORS.corporate },
    { name: 'Customer', value: accountsSummary.customer.total, color: COLORS.customer },
    { name: 'Medicine', value: accountsSummary.medicine.grandTotal, color: COLORS.medicine },
    { name: 'Courier Boy', value: accountsSummary.courierBoy.total, color: COLORS.courierBoy },
  ].filter(item => item.value > 0), [accountsSummary]);

  const paidUnpaidData = useMemo(() => [
    { name: 'Paid', value: accountsSummary.totalPaid, color: COLORS.paid },
    { name: 'Unpaid', value: accountsSummary.totalUnpaid, color: COLORS.unpaid },
  ].filter(item => item.value > 0), [accountsSummary]);

  const sourceBreakdownData = useMemo(() => [
    {
      source: 'Corporate',
      paid: accountsSummary.corporate.paid,
      unpaid: accountsSummary.corporate.unpaid,
      total: accountsSummary.corporate.total,
    },
    {
      source: 'Customer',
      paid: accountsSummary.customer.paid,
      unpaid: accountsSummary.customer.unpaid,
      total: accountsSummary.customer.total,
    },
    {
      source: 'Medicine',
      paid: accountsSummary.medicine.grandTotal,
      unpaid: 0,
      total: accountsSummary.medicine.grandTotal,
    },
    {
      source: 'Courier Boy',
      paid: accountsSummary.courierBoy.total,
      unpaid: 0,
      total: accountsSummary.courierBoy.total,
    },
  ].filter(item => item.total > 0), [accountsSummary]);

  // Toggle row expansion
  const toggleRowExpansion = (orderId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(orderId)) {
      newExpandedRows.delete(orderId);
    } else {
      newExpandedRows.add(orderId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Toggle filter
  const toggleFilter = useCallback((filterKey: string) => {
    setActiveFilters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(filterKey)) {
        newSet.delete(filterKey);
      } else {
        newSet.add(filterKey);
      }
      return newSet;
    });
  }, []);

  // For consignment number search, show only that consignment
  // For phone/email search, show all matching consignments
  const customerProfile = customerRecords.length === 1 ? customerRecords[0] : null;

  const statusSummary = useMemo(() => {
    // Use status counts from backend summary - single source of truth (opaque)
    return dashboardSummary?.statusCounts || {};
  }, [dashboardSummary]);

  const todayCount = useMemo(() => {
    // Use todayCount from backend summary
    return dashboardSummary?.todayCount || 0;
  }, [dashboardSummary]);

  // Icon mapping for common statuses (display only)
  const getStatusIcon = (statusKey: string) => {
    const iconMap: Record<string, any> = {
      'total': Package,
      'booked': Clock,
      'pickup': Truck,
      'picked': Truck,
      'received': Building,
      'assigned': Activity,
      'intransit': Activity,
      'in_transit': Activity,
      'reached-hub': MapPin,
      'OFP': MapPin,
      'out_for_delivery': MapPin,
      'delivered': CheckCircle,
    };
    return iconMap[statusKey] || Package;
  };

  // Color mapping for common statuses (display only)
  const getStatusColors = (statusKey: string) => {
    const colorMap: Record<string, { cardBgColor: string; textColor: string; iconColor: string }> = {
      'total': { cardBgColor: 'bg-blue-50', textColor: 'text-blue-700', iconColor: 'text-blue-600' },
      'booked': { cardBgColor: 'bg-purple-50', textColor: 'text-purple-700', iconColor: 'text-purple-600' },
      'pickup': { cardBgColor: 'bg-amber-50', textColor: 'text-amber-700', iconColor: 'text-amber-600' },
      'picked': { cardBgColor: 'bg-orange-50', textColor: 'text-orange-700', iconColor: 'text-orange-600' },
      'received': { cardBgColor: 'bg-indigo-50', textColor: 'text-indigo-700', iconColor: 'text-indigo-600' },
      'assigned': { cardBgColor: 'bg-violet-50', textColor: 'text-violet-700', iconColor: 'text-violet-600' },
      'intransit': { cardBgColor: 'bg-rose-50', textColor: 'text-rose-700', iconColor: 'text-rose-600' },
      'in_transit': { cardBgColor: 'bg-rose-50', textColor: 'text-rose-700', iconColor: 'text-rose-600' },
      'reached-hub': { cardBgColor: 'bg-cyan-50', textColor: 'text-cyan-700', iconColor: 'text-cyan-600' },
      'OFP': { cardBgColor: 'bg-sky-50', textColor: 'text-sky-700', iconColor: 'text-sky-600' },
      'out_for_delivery': { cardBgColor: 'bg-sky-50', textColor: 'text-sky-700', iconColor: 'text-sky-600' },
      'delivered': { cardBgColor: 'bg-emerald-50', textColor: 'text-emerald-700', iconColor: 'text-emerald-600' },
    };
    return colorMap[statusKey] || { cardBgColor: 'bg-slate-50', textColor: 'text-slate-700', iconColor: 'text-slate-600' };
  };

  const keyMetrics = useMemo(() => {
    const total = activeTotal ?? activeOrders.length;

    // Total metric
    const metrics = [{
      key: 'total',
      label: 'Total',
      value: total,
      icon: Package,
      cardBgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
    }];

    // Dynamically build metrics from status counts (opaque - no assumptions)
    if (statusSummary && typeof statusSummary === 'object') {
      Object.entries(statusSummary).forEach(([statusKey, value]) => {
        if (statusKey !== 'total' && typeof value === 'number') {
          const colors = getStatusColors(statusKey);
          metrics.push({
            key: statusKey,
            label: resolveDisplayStatus(statusKey),
            value: value || 0,
            icon: getStatusIcon(statusKey),
            cardBgColor: colors.cardBgColor,
            textColor: colors.textColor,
            iconColor: colors.iconColor,
          });
        }
      });
    }

    return metrics;
  }, [activeOrders, activeTotal, statusSummary]);

  // Filter and sort needsAttention to show only 5 most recent items
  const recentNeedsAttention = useMemo(() => {
    if (!needsAttention || needsAttention.length === 0) return [];

    // Sort by lastUpdate (most recent first) - convert to Date for comparison
    const sorted = [...needsAttention].sort((a, b) => {
      const dateA = new Date(a.lastUpdate || 0).getTime();
      const dateB = new Date(b.lastUpdate || 0).getTime();
      return dateB - dateA; // Most recent first
    });

    // Return only the 5 most recent
    return sorted.slice(0, 5);
  }, [needsAttention]);

  // Get 2 most recent sales forms for preview
  const recentSalesForms = useMemo(() => {
    if (!salesForms || salesForms.length === 0) return [];

    // Sales forms are already sorted by createdAt descending from API
    // Just take the first 2
    return salesForms.slice(0, 2);
  }, [salesForms]);

  const renderServiceabilityStatus = (state: ServiceabilityState) => {
    if (state.status === 'idle') {
      return <span className="text-sm text-gray-500">Awaiting 6-digit pincode</span>;
    }
    if (state.status === 'checking') {
      return (
        <span className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking network coverage
        </span>
      );
    }
    if (state.status === 'serviceable') {
      return (
        <span className="flex items-center gap-2 text-sm text-emerald-600">
          <ShieldCheck className="h-4 w-4" />
          {state.city ? `${state.city}, ${state.state}` : 'Serviceable'}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-2 text-sm text-rose-600">
        <AlertTriangle className="h-4 w-4" />
        Not serviceable
      </span>
    );
  };

  return (
    <section className="bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6">
      <div className="max-w-[1920px] mx-auto space-y-4">
        {/* System Alerts / Announcements Bar */}
        {systemAlerts.filter(a => !a.dismissed).length > 0 && (
          <div className="space-y-2">
            {systemAlerts.filter(a => !a.dismissed).map((alert) => (
              <Alert
                key={alert.id}
                className={`${alert.type === 'error' ? 'bg-rose-50 border-rose-200' :
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                      'bg-blue-50 border-blue-200'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {alert.type === 'error' ? <AlertCircle className="h-4 w-4 text-rose-600" /> :
                      alert.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-600" /> :
                        <AlertCircle className="h-4 w-4 text-blue-600" />}
                    <AlertDescription className="text-sm font-medium">
                      {alert.message}
                    </AlertDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setSystemAlerts(prev => prev.map(a =>
                        a.id === alert.id ? { ...a, dismissed: true } : a
                      ));
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Header Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-rose-500 rounded-full"></span>
              </button>
              <button
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                onClick={() => {
                  fetchActiveOrders();
                  fetchNeedsAttention();
                  fetchUnpaidPayments();
                  fetchCourierPayments();
                  fetchAccountsData();
                  fetchSalesForms();
                }}
              >
                <RefreshCw className="h-5 w-5 text-slate-600" />
              </button>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="grid gap-3 lg:grid-cols-[3fr_1fr]">
            <div className="">
              <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleLookupSubmit}>
                <div className="relative flex-1">
                  <label
                    className={`absolute left-10 transition-all duration-200 ease-in-out pointer-events-none z-20 bg-white px-1 ${isSearchFocused || customerQuery
                        ? 'top-0 text-xs text-blue-600 -translate-y-1/2'
                        : 'top-3 text-sm text-slate-500'
                      }`}
                  >
                    Consignment number, phone, or email...
                  </label>
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
                  <Input
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="h-11 pl-10 pr-3 text-sm border border-slate-200 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 transition-all duration-200 ease-in-out"
                    style={isSearchFocused ? {
                      boxShadow: 'rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px'
                    } : {}}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={customerLoading}
                  className="min-w-[140px] h-11 bg-blue-600 hover:bg-blue-600 text-white border-0 focus:ring-0 focus-visible:ring-0"
                  style={{
                    boxShadow: 'rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px';
                  }}
                >
                  {customerLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching
                    </>
                  ) : (
                    'Run lookup'
                  )}
                </Button>
              </form>
            </div>
            <div className="">
              <Button
                size="lg"
                className="w-full h-11 bg-blue-600 hover:bg-blue-600 text-white border-0 focus:ring-0 focus-visible:ring-0"
                onClick={() => setCheckerOpen(true)}
                style={{
                  boxShadow: 'rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px';
                }}
              >
                Serviceability
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {activeLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            )}
          </div>

          {activeError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{activeError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-nowrap gap-2 w-full">
            {keyMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.key}
                  onClick={() => handleStatusCardClick(metric.key)}
                  className={`group relative flex-1 overflow-hidden rounded-lg border border-slate-200 ${metric.cardBgColor || 'bg-white'} p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 cursor-pointer active:scale-95`}
                >
                  <div className="relative w-full h-full flex flex-col min-h-[80px]">
                    {/* Title at top left */}
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide leading-tight truncate">{metric.label}</p>
                      {metric.key === 'total' && todayCount > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 flex-shrink-0 font-semibold">
                          +{todayCount}
                        </Badge>
                      )}
                    </div>

                    {/* Number below title */}
                    <div className="flex-1 flex items-center justify-between">
                      <p className="text-2xl font-bold text-slate-900 leading-none">{metric.value.toLocaleString()}</p>

                      {/* Icon at right */}
                      <div className="flex-shrink-0">
                        <Icon className={`h-5 w-5 ${metric.iconColor}`} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Collection - All in One Line */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          {/* Courier Boy Payments */}
          <div
            className="flex-1 rounded-lg border border-slate-200 overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all"
            onClick={() => {
              setCourierBoysDialogOpen(true);
              fetchCourierBoysList();
            }}
          >
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bike className="h-4 w-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Courier Boy</h3>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                  {courierPayments?.totalCourierBoys ?? 0}
                </Badge>
              </div>
            </div>
            <div className="bg-white px-3 py-2">
              {courierPaymentsLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              ) : courierPayments ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Orders</span>
                    <span className="font-semibold text-slate-900">
                      {courierPayments.totalOrders}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Amount</span>
                    <span className="text-sm font-bold text-green-700">
                      ₹{courierPayments.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-1">
                  No data
                </div>
              )}
            </div>
          </div>

          {/* Flying Customer Block */}
          <div
            className="flex-1 rounded-lg border border-slate-200 overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all"
            onClick={() => {
              setSelectedPaymentType('FP');
              setPaymentDialogOpen(true);
            }}
          >
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-blue-600">₹</span>
                <h3 className="text-sm font-semibold text-slate-900">Flying Customer</h3>
                <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                  Unpaid
                </Badge>
              </div>
            </div>
            <div className="bg-white px-3 py-2">
              {unpaidPaymentsLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              ) : unpaidPayments ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Orders</span>
                    <span className="font-semibold text-slate-900">
                      {unpaidPayments.FP.totalOrders}
                    </span>
                  </div>
                  {unpaidPayments.FP.totalOrders === 0 && (
                    <div className="text-xs text-slate-500 text-center pt-1">
                      No orders
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Amount</span>
                    <span className="text-sm font-bold text-blue-700">
                      ₹{unpaidPayments.FP.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-1">
                  No data
                </div>
              )}
            </div>
          </div>

          {/* Corporate Customer Block */}
          <div
            className="flex-1 rounded-lg border border-slate-200 overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all"
            onClick={() => {
              setSelectedPaymentType('TP');
              setPaymentDialogOpen(true);
            }}
          >
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-amber-600">₹</span>
                <h3 className="text-sm font-semibold text-slate-900">Corporate Customer</h3>
                <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200">
                  Unpaid
                </Badge>
              </div>
            </div>
            <div className="bg-white px-3 py-2">
              {unpaidPaymentsLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              ) : unpaidPayments ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Orders</span>
                    <span className="font-semibold text-slate-900">
                      {unpaidPayments.TP.totalOrders}
                    </span>
                  </div>
                  {unpaidPayments.TP.totalOrders === 0 && (
                    <div className="text-xs text-slate-500 text-center pt-1">
                      No orders
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Amount</span>
                    <span className="text-sm font-bold text-amber-700">
                      ₹{unpaidPayments.TP.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-1">
                  No data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sales Form + Needs Attention (Bento layout) */}
        <div className="grid gap-3 items-start lg:grid-cols-[1fr_2fr]">
          {/* Sales Form Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between h-7">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-base lg:text-sm font-semibold text-slate-900">Sales Forms</h2>
              </div>
              <Badge className="bg-blue-100 text-slate-900 px-2 py-0.5 text-xs lg:text-[11px] rounded-none hover:bg-blue-100">
                Total: {salesFormsCount}
              </Badge>
            </div>
            <div
              className="rounded-lg border border-slate-200 bg-white shadow-sm cursor-pointer hover:shadow-md transition-all"
              onClick={() => setSalesFormsDialogOpen(true)}
            >
              <div className="p-3">
                {salesFormsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                ) : recentSalesForms.length > 0 ? (
                  <div className="space-y-0">
                    {recentSalesForms.map((form, index, array) => (
                      <div
                        key={form._id}
                        className={`flex items-center justify-between text-sm lg:text-xs py-2 ${index < array.length - 1 ? 'border-b border-slate-100' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 truncate">{form.companyName || 'N/A'}</div>
                          <div className="text-xs text-slate-500 truncate">{form.concernPersonName || 'N/A'}</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`ml-2 flex-shrink-0 px-2 py-0.5 text-xs lg:text-[11px] rounded-full ${form.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : form.status === 'seen'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : form.status === 'contacted'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : form.status === 'converted'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                        >
                          {form.status || 'pending'}
                        </Badge>
                      </div>
                    ))}
                    {salesFormsCount > 2 && (
                      <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-100">
                        +{salesFormsCount - 2} more forms
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-xs text-slate-500 py-2">
                    No sales forms available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Needs Attention / Action Required Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between h-7">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h2 className="text-base lg:text-sm font-semibold text-slate-900">Needs Attention / Action Required</h2>
              </div>
              <div className="flex items-center gap-2">
                {needsAttentionLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                )}
                {needsAttention.length > 0 && (
                  <button
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    onClick={() => setNeedsAttentionDialogOpen(true)}
                  >
                    View All
                  </button>
                )}
              </div>
            </div>

            {recentNeedsAttention.length > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="max-h-[150px] overflow-y-auto scrollbar-thin [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent" style={{ scrollbarWidth: 'thin' }}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-600 hover:bg-blue-600">
                        <TableHead className="w-[120px] px-3 py-0.5 text-xs text-white font-semibold text-center">Tracking ID</TableHead>
                        <TableHead className="px-3 py-0.5 text-xs text-white font-semibold text-center">Issue Type</TableHead>
                        <TableHead className="px-3 py-0.5 text-xs text-white font-semibold text-center">Time Since Update</TableHead>
                        <TableHead className="px-3 py-0.5 text-xs text-white font-semibold text-center">Priority</TableHead>
                        <TableHead className="px-3 py-0.5 text-xs text-white font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentNeedsAttention.map((item, index) => {
                        // Alternate row colors: even index = gray, odd index = white
                        const rowBgColor = index % 2 === 0 ? 'bg-slate-200' : 'bg-white';
                        const hoverBgColor = index % 2 === 0 ? 'hover:!bg-slate-200' : 'hover:!bg-white';

                        return (
                          <TableRow key={index} className={`${rowBgColor} ${hoverBgColor} h-7 border-b border-slate-100`}>
                            <TableCell className="font-medium py-0.5 text-xs text-center text-slate-600">
                              #{item.consignmentNumber}
                            </TableCell>
                            <TableCell className="py-0.5 text-xs text-center text-slate-600">{item.issueType}</TableCell>
                            <TableCell className="py-0.5 text-xs text-center text-slate-600">{formatTimeSinceUpdate(item.lastUpdate)}</TableCell>
                            <TableCell className="py-0.5 text-center">
                              <Badge
                                className={`text-[10px] px-1.5 py-0 rounded-none ${item.priority === 'high'
                                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-100'
                                    : item.priority === 'medium'
                                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                  }`}
                              >
                                {item.priority.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center py-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 text-xs px-1.5 text-slate-600 hover:text-slate-900 hover:bg-transparent"
                                onClick={() => {
                                  openShipmentTimeline(item.consignmentNumber);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-0.5" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                <p>No shipments require immediate attention</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Shipments Action Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-900">Live Shipments</h2>
            </div>
            {activeLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            )}
          </div>


          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent" style={{ scrollbarWidth: 'thin' }}>
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="h-4 bg-blue-600 hover:bg-blue-600">
                    <TableHead className="py-0 text-xs font-medium text-white text-left leading-tight w-12">#</TableHead>
                    <TableHead className="py-0 text-xs font-medium text-white text-left leading-tight">Source</TableHead>
                    <TableHead className="py-0 text-xs font-medium text-white text-left leading-tight">Consignment</TableHead>
                    <TableHead className="py-0 text-xs font-medium text-white text-left leading-tight">Origin</TableHead>
                    <TableHead className="py-0 text-xs font-medium text-white text-left leading-tight">Destination</TableHead>
                    <TableHead className="py-0 text-xs font-medium text-white text-left leading-tight">Status</TableHead>
                    <TableHead className="py-0 text-xs font-medium text-white text-left leading-tight">Payment</TableHead>
                    <TableHead className="py-0 text-xs font-medium text-white text-left leading-tight">Amount</TableHead>
                    <TableHead className="py-0 text-xs font-medium text-white text-left leading-tight">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActiveOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                          <Package className="h-8 w-8 text-slate-400" />
                          <p className="text-sm font-medium">No live shipments found</p>
                          <p className="text-xs">All shipments may be delivered or there are no active orders</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredActiveOrders.map((order: any, index: number) => {
                      const isExpanded = expandedRows.has(order._id);
                      const status = order.currentStatus || 'booked';
                      const statusInfo = getStatusInfo(status);
                      const sourceBadge = getSourceBadge(order.source || 'customer');
                      const sla = order.sla || { status: 'ok' as const };

                      // Alternate row colors: even index = gray, odd index = white
                      const rowBgColor = index % 2 === 0 ? 'bg-slate-200' : 'bg-white';
                      const hoverBgColor = index % 2 === 0 ? 'hover:!bg-slate-200' : 'hover:!bg-white';

                      return (
                        <React.Fragment key={order._id}>
                          <TableRow
                            className={`${rowBgColor} ${hoverBgColor} h-10 border-b border-slate-100`}
                          >
                            <TableCell className="p-2 text-left">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpansion(order._id)}
                                className="h-7 w-7 p-0 rounded-lg hover:bg-blue-500/20 hover:scale-110 transition-all duration-300"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-blue-600" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="text-left py-1.5 text-xs">
                              <Badge
                                className={cn(
                                  "text-xs px-2 py-1 rounded-lg flex items-center gap-1 w-fit shadow-lg text-slate-600",
                                  sourceBadge.color.split(' ')[0],
                                  sourceBadge.hoverColor
                                )}
                              >
                                {sourceBadge.icon}
                                {sourceBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-left py-1.5 text-xs text-slate-600">
                              {order.consignmentNumber}
                            </TableCell>
                            <TableCell className="text-left py-1.5 text-xs">
                              <div className="font-bold text-xs text-slate-900">{order.origin?.name || 'N/A'}</div>
                              <div className="text-xs text-slate-600">{order.origin?.city || 'N/A'}</div>
                            </TableCell>
                            <TableCell className="text-left py-1.5 text-xs">
                              <div className="font-bold text-xs text-slate-900">{order.destination?.name || 'N/A'}</div>
                              <div className="text-xs text-slate-600">{order.destination?.city || 'N/A'}</div>
                            </TableCell>
                            <TableCell className="text-left py-1.5 text-xs">
                              <Badge
                                variant={statusInfo.variant}
                                className={cn(
                                  statusInfo.bgColor,
                                  getStatusHoverClass(statusInfo.bgColor),
                                  "text-slate-600 border border-white/30 text-xs px-3 py-1.5 rounded-xl shadow-lg font-semibold flex items-center gap-1.5 w-fit"
                                )}
                              >
                                {statusInfo.icon}
                                <span className="capitalize">
                                  {status.replace('_', ' ').replace('-', ' ')}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-left py-1.5 text-xs">
                              <Badge
                                variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                                className={cn(
                                  "text-xs px-3 py-1.5 rounded-xl shadow-lg font-semibold w-fit text-slate-600",
                                  order.paymentStatus === 'paid'
                                    ? "bg-gradient-to-br from-green-100/90 to-emerald-100/90 border border-green-200/40 hover:!bg-gradient-to-br hover:!from-green-100/90 hover:!to-emerald-100/90"
                                    : "bg-gradient-to-br from-red-100/90 to-rose-100/90 border border-red-200/40 hover:!bg-gradient-to-br hover:!from-red-100/90 hover:!to-rose-100/90"
                                )}
                              >
                                <span className="flex items-center gap-1.5">
                                  {order.paymentStatus === 'paid' ? (
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5" />
                                  )}
                                  <span className="capitalize">{order.paymentStatus || 'unpaid'}</span>
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-left py-1.5 text-xs text-slate-600">
                              ₹{order.totalAmount?.toFixed(2) || '0.00'}
                            </TableCell>
                            <TableCell className="text-left py-1.5 text-xs text-slate-600">
                              {formatDate(order.bookingDate || order.updatedAt || order.createdAt)}
                            </TableCell>
                          </TableRow>

                          {/* Expanded Row */}
                          {isExpanded && (
                            <TableRow className="bg-transparent">
                              <TableCell colSpan={9} className="p-0">
                                <div className="p-4 space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {/* Origin Card */}
                                    <div
                                      className="group relative rounded-xl p-3 border bg-blue-50 border-blue-200"
                                      style={{ boxShadow: 'rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px' }}
                                    >
                                      <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs text-blue-800">
                                        <MapPin className="h-3.5 w-3.5" />
                                        Origin
                                      </h4>
                                      <div className="space-y-1 text-xs">
                                        <div className="text-slate-700">
                                          <strong>Name:</strong> {order.origin?.name || 'N/A'}
                                          {order.origin?.companyName && (
                                            <span className="text-slate-500 block ml-0 mt-0.5">{order.origin.companyName}</span>
                                          )}
                                        </div>
                                        {order.origin?.mobileNumber && (
                                          <div className="text-slate-700"><strong>Mobile:</strong> +91 {order.origin.mobileNumber}</div>
                                        )}
                                        {(order.origin?.flatBuilding || order.origin?.locality) && (
                                          <div className="text-slate-700">
                                            <strong>Address:</strong> {[order.origin.flatBuilding, order.origin.locality].filter(Boolean).join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Destination Card */}
                                    <div
                                      className="group relative rounded-xl p-3 border bg-green-50 border-green-200"
                                      style={{ boxShadow: 'rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px' }}
                                    >
                                      <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs text-green-800">
                                        <Truck className="h-3.5 w-3.5" />
                                        Destination
                                      </h4>
                                      <div className="space-y-1 text-xs">
                                        <div className="text-slate-700">
                                          <strong>Name:</strong> {order.destination?.name || 'N/A'}
                                          {order.destination?.companyName && (
                                            <span className="text-slate-500 block ml-0 mt-0.5">{order.destination.companyName}</span>
                                          )}
                                        </div>
                                        {order.destination?.mobileNumber && (
                                          <div className="text-slate-700"><strong>Mobile:</strong> +91 {order.destination.mobileNumber}</div>
                                        )}
                                        {(order.destination?.flatBuilding || order.destination?.locality) && (
                                          <div className="text-slate-700">
                                            <strong>Address:</strong> {[order.destination.flatBuilding, order.destination.locality].filter(Boolean).join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Status Card */}
                                    <div
                                      className="group relative rounded-xl p-3 border bg-orange-50 border-orange-200"
                                      style={{ boxShadow: 'rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px' }}
                                    >
                                      <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs text-orange-800">
                                        <Package className="h-3.5 w-3.5" />
                                        Status
                                      </h4>
                                      <div className="space-y-1 text-xs">
                                        {order.consignmentNumber && (
                                          <div className="text-slate-700"><strong>Consignment:</strong> {order.consignmentNumber}</div>
                                        )}
                                        <div className="text-slate-700"><strong>Status:</strong> {resolveDisplayStatus(status)}</div>
                                        {order.bookingDate && (
                                          <div className="text-slate-700"><strong>Booked:</strong> {formatDate(order.bookingDate)}</div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Payment Card */}
                                    <div
                                      className="group relative rounded-xl p-3 border bg-purple-50 border-purple-200"
                                      style={{ boxShadow: 'rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px' }}
                                    >
                                      <h4 className="font-bold mb-2 flex items-center gap-1.5 text-xs text-purple-800">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        Payment
                                      </h4>
                                      <div className="space-y-1 text-xs">
                                        {order.bookingReference && (
                                          <div className="text-slate-700"><strong>Reference:</strong> {order.bookingReference}</div>
                                        )}
                                        <div className="font-bold text-sm text-purple-700">
                                          <strong>Total:</strong> ₹{order.totalAmount?.toFixed(2) || '0.00'}
                                        </div>
                                        <div className="text-slate-700">
                                          <strong>Status:</strong>
                                          <Badge
                                            className={`ml-2 rounded-none text-xs ${order.paymentStatus === 'paid'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                              }`}
                                          >
                                            <span className="capitalize">{order.paymentStatus || 'unpaid'}</span>
                                          </Badge>
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
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Payment Orders Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col p-0 shadow-xl">
            {/* Refined Header */}
            <div className={`relative px-5 py-4 ${selectedPaymentType === 'FP'
                ? 'bg-gradient-to-r from-blue-500/10 via-blue-50 to-indigo-50'
                : 'bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50'
              }`}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md shadow-sm ${selectedPaymentType === 'FP'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-amber-100 text-amber-600'
                    }`}>
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className={`text-sm font-bold ${selectedPaymentType === 'FP' ? 'text-blue-900' : 'text-amber-900'
                      }`}>
                      {selectedPaymentType === 'FP' ? 'Flying Customer' : 'Corporate Customer'}
                    </DialogTitle>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {selectedPaymentType === 'FP' ? 'Unpaid Orders from CustomerBookings' : 'Unpaid Orders from Trackings'}
                    </p>
                  </div>
                </div>
                {unpaidPayments && selectedPaymentType && (
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm ${selectedPaymentType === 'FP'
                        ? 'bg-white text-blue-700 shadow-blue-100'
                        : 'bg-white text-amber-700 shadow-amber-100'
                      }`}>
                      {unpaidPayments[selectedPaymentType].totalOrders} orders
                    </div>
                    <div className={`px-3 py-1.5 rounded-md text-xs font-bold shadow-sm ${selectedPaymentType === 'FP'
                        ? 'bg-blue-500 text-white'
                        : 'bg-amber-500 text-white'
                      }`}>
                      {unpaidPayments[selectedPaymentType].totalAmount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Refined Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30">
              {unpaidPaymentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-xs text-slate-500">Loading orders...</span>
                  </div>
                </div>
              ) : unpaidPayments && selectedPaymentType && unpaidPayments[selectedPaymentType].totalOrders > 0 ? (
                <div className="p-4">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className={`${selectedPaymentType === 'FP'
                              ? 'bg-blue-50/80'
                              : 'bg-amber-50/80'
                            }`}>
                            <TableHead className="w-12 text-xs font-bold text-slate-700 py-3 px-3">#</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700 py-3 px-3">Consignment</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700 py-3 px-3">Receiver</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700 py-3 px-3">Phone</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700 py-3 px-3">Route</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700 py-3 px-3">Date</TableHead>
                            <TableHead className="text-right text-xs font-bold text-slate-700 py-3 px-3">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unpaidPayments[selectedPaymentType].orders.map((order, index) => (
                            <TableRow
                              key={index}
                              className="hover:bg-slate-50 transition-all duration-150 group"
                            >
                              <TableCell className="text-xs text-slate-400 font-medium py-3 px-3">
                                {index + 1}
                              </TableCell>
                              <TableCell className="py-3 px-3">
                                <span className="text-sm font-bold text-slate-900">
                                  {order.consignmentNumber || 'N/A'}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-slate-700 font-medium py-3 px-3">
                                {order.receiverName || 'N/A'}
                              </TableCell>
                              <TableCell className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <Phone className={`h-3.5 w-3.5 ${selectedPaymentType === 'FP' ? 'text-blue-400' : 'text-amber-400'
                                    }`} />
                                  <span className="text-xs text-slate-600">
                                    {order.receiverPhone || 'N/A'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className={`h-3.5 w-3.5 ${selectedPaymentType === 'FP' ? 'text-blue-400' : 'text-amber-400'
                                    }`} />
                                  <span className="text-xs text-slate-600">
                                    {order.route || 'N/A'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-500 py-3 px-3">
                                {order.bookingDate ? formatDateTime(order.bookingDate) : '—'}
                              </TableCell>
                              <TableCell className="text-right py-3 px-3">
                                <span className={`inline-block px-2.5 py-1 rounded-md text-sm font-bold ${selectedPaymentType === 'FP'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-amber-50 text-amber-700'
                                  }`}>
                                  {order.amount.toFixed(2)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className={`p-3 rounded-full mb-3 ${selectedPaymentType === 'FP' ? 'bg-blue-100' : 'bg-amber-100'
                    }`}>
                    <DollarSign className={`h-6 w-6 ${selectedPaymentType === 'FP' ? 'text-blue-500' : 'text-amber-500'
                      }`} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    No unpaid {selectedPaymentType === 'FP' ? 'Flying Customer' : 'Corporate Customer'} orders
                  </p>
                  <p className="text-xs text-slate-500">
                    All orders have been paid
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
          <DialogContent className="max-w-5xl space-y-6">
            <DialogHeader>
              <DialogTitle>Consignment Lookup</DialogTitle>
              <DialogDescription>Search by consignment number, phone, or email</DialogDescription>
            </DialogHeader>

            <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleLookupSubmit}>
              <div className="relative flex-1">
                <label
                  className={`absolute left-10 transition-all duration-200 ease-in-out pointer-events-none z-20 bg-white px-1 ${isDialogSearchFocused || customerQuery
                      ? 'top-0 text-xs text-blue-600 -translate-y-1/2'
                      : 'top-3 text-sm text-slate-500'
                    }`}
                >
                  Consignment number, phone, or email...
                </label>
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
                <Input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  onFocus={() => setIsDialogSearchFocused(true)}
                  onBlur={() => setIsDialogSearchFocused(false)}
                  className="h-11 pl-10 pr-3 text-sm border border-slate-200 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 transition-all duration-200 ease-in-out"
                  style={isDialogSearchFocused ? {
                    boxShadow: 'rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px'
                  } : {}}
                />
              </div>
              <Button
                type="submit"
                disabled={customerLoading}
                className="min-w-[140px] bg-blue-600 hover:bg-blue-600 text-white border-0 focus:ring-0 focus-visible:ring-0"
                style={{
                  boxShadow: 'rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px'
                }}
              >
                {customerLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching
                  </>
                ) : (
                  'Run lookup'
                )}
              </Button>
            </form>

            {customerError && (
              <Alert variant="destructive">
                <AlertDescription>{customerError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {customerRecords.length > 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {customerRecords.length === 1 ? 'Consignment Details' : `Found ${customerRecords.length} Consignments`}
                      </h3>
                      {customerRecords.length > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          {customerRecords.length} results
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto">
                    {customerRecords.map((record, index) => {
                      const trackingData = record.consignmentNumber ? trackingDataMap[record.consignmentNumber] : null;
                      const movementHistory = trackingData?.movementHistory || [];

                      return (
                        <div
                          key={record._id || index}
                          className={`p-4 ${index < customerRecords.length - 1 ? 'border-b border-slate-100' : ''}`}
                        >
                          <div className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  <Package className="h-4 w-4 text-slate-400" />
                                  Consignment #{record.consignmentNumber || '—'}
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className={statusTint[record.currentStatus || record.assignmentData?.status || 'booked'] || 'bg-slate-100 text-slate-700'}>
                                      {resolveDisplayStatus(record.currentStatus || record.assignmentData?.status || 'booked')}
                                    </Badge>
                                    <Badge variant={record.paymentStatus === 'paid' ? 'default' : 'secondary'} className={record.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                      {record.paymentStatus || 'unpaid'}
                                    </Badge>
                                  </div>
                                  {record.totalAmount && (
                                    <p className="text-sm font-semibold text-slate-900">
                                      Amount: ₹{record.totalAmount.toFixed(2)}
                                    </p>
                                  )}
                                  <p className="text-xs text-slate-500">
                                    Booked: {formatDateTime(record.bookingDate || record.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  <MapPin className="h-4 w-4 text-slate-400" />
                                  Origin
                                </div>
                                <div className="space-y-1 text-sm">
                                  <p className="font-medium text-slate-900">
                                    {record.originData?.name || record.senderName || '—'}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {record.originData?.city || record.senderCity || '—'}, {record.originData?.state || record.senderState || '—'}
                                  </p>
                                  {record.originData?.mobileNumber || record.senderPhone ? (
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                      <Phone className="h-3 w-3" />
                                      {record.originData?.mobileNumber || record.senderPhone}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  <Truck className="h-4 w-4 text-slate-400" />
                                  Destination
                                </div>
                                <div className="space-y-1 text-sm">
                                  <p className="font-medium text-slate-900">
                                    {record.destinationData?.name || record.receiverName || '—'}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {record.destinationData?.city || record.receiverCity || '—'}, {record.destinationData?.state || record.receiverState || '—'}
                                  </p>
                                  {record.destinationData?.mobileNumber ? (
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                      <Phone className="h-3 w-3" />
                                      {record.destinationData.mobileNumber}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  <Clock className="h-4 w-4 text-slate-400" />
                                  Timeline
                                </div>
                                <div className="space-y-1 text-xs text-slate-600">
                                  <p>Created: {formatDateTime(record.createdAt)}</p>
                                  <p>Updated: {formatRelativeTime(record.updatedAt)}</p>
                                  {record.bookingReference && (
                                    <p>Reference: {record.bookingReference}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Movement History */}
                            {trackingData?.loading ? (
                              <div className="flex items-center justify-center py-4 border-t border-slate-200 mt-4">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                                <span className="text-xs text-slate-500">Loading movement history...</span>
                              </div>
                            ) : movementHistory && movementHistory.length > 0 ? (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="text-xs font-semibold text-slate-700 mb-2">Movement History</div>
                                <div className="grid grid-cols-3 gap-2">
                                  {movementHistory.map((event: any, eventIndex: number) => {
                                    const formatDateLabel = (timestamp: string | null) => {
                                      if (!timestamp) return "Pending";
                                      const date = new Date(timestamp);
                                      return `${date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} • ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
                                    };

                                    return (
                                      <div key={eventIndex} className="flex flex-col">
                                        <div className="flex items-start gap-1.5">
                                          <span
                                            className="h-1.5 w-1.5 rounded-full mt-1 flex-shrink-0"
                                            style={{ background: '#FDA11E' }}
                                          />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-semibold text-slate-900">{event.label}</p>
                                            {event.location && (
                                              <p className="text-[9px] text-slate-500">{event.location}</p>
                                            )}
                                            <p className="text-[9px] text-slate-500">
                                              {event.timestamp ? formatDateLabel(event.timestamp) : "Pending"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : trackingData?.error ? (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="text-xs text-slate-500 text-center py-2">
                                  {trackingData.error}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
                  <History className="mb-3 h-6 w-6 text-slate-400" />
                  <p className="text-sm font-medium mb-1">No consignments found</p>
                  <p className="text-xs">Search by consignment number, phone number, or email address</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setLookupOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={checkerOpen} onOpenChange={setCheckerOpen}>
          <DialogContent className="max-w-5xl space-y-6">
            <div className="rounded-2xl bg-white/95 shadow-sm shadow-slate-200/60 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-purple-600">Serviceability + pricing</p>
                  <h3 className="text-base font-semibold text-slate-900">Instant feasibility checker</h3>
                </div>
              </div>

              <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                <div className="space-y-4 p-4">
                  <p className="text-sm font-semibold text-slate-800">Serviceability</p>
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-wide text-slate-500">
                      Origin pincode
                      <Input
                        value={originPincode}
                        onChange={(e) => {
                          const value = sanitizePincode(e.target.value);
                          setOriginPincode(value);
                          if (value.length === 6) {
                            runServiceabilityCheck(value, 'origin');
                          } else {
                            setOriginState({ status: 'idle' });
                          }
                        }}
                        inputMode="numeric"
                        maxLength={6}
                        className="mt-1"
                      />
                    </label>
                    {renderServiceabilityStatus(originState)}
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-wide text-slate-500">
                      Destination pincode
                      <Input
                        value={destinationPincode}
                        onChange={(e) => {
                          const value = sanitizePincode(e.target.value);
                          setDestinationPincode(value);
                          if (value.length === 6) {
                            runServiceabilityCheck(value, 'destination');
                          } else {
                            setDestinationState({ status: 'idle' });
                          }
                        }}
                        inputMode="numeric"
                        maxLength={6}
                        className="mt-1"
                      />
                    </label>
                    {renderServiceabilityStatus(destinationState)}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-sm text-slate-600">
                    <p className="flex items-center gap-2 font-medium text-slate-900">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      Coverage notes
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Telecallers can confirm coverage instantly from the pincode directory. Escalate over Teams for
                      special lanes or exceptions.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <p className="text-sm font-semibold text-slate-800">Pricing checker</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500">
                      Service
                      <Select
                        value={serviceType}
                        onValueChange={(value: 'standard' | 'priority') => setServiceType(value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </label>
                    {serviceType === 'standard' && (
                      <label className="text-xs uppercase tracking-wide text-slate-500">
                        Mode
                        <Select value={mode} onValueChange={(value: 'air' | 'road' | 'train') => setMode(value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="air">Air</SelectItem>
                            <SelectItem value="road">Road</SelectItem>
                            <SelectItem value="train">Train</SelectItem>
                          </SelectContent>
                        </Select>
                      </label>
                    )}
                    {serviceType === 'standard' && (
                      <label className="text-xs uppercase tracking-wide text-slate-500">
                        Consignment
                        <Select
                          value={consignmentType}
                          onValueChange={(value: 'dox' | 'non-dox') => setConsignmentType(value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dox">DOX</SelectItem>
                            <SelectItem value="non-dox">NON DOX</SelectItem>
                          </SelectContent>
                        </Select>
                      </label>
                    )}
                    <label className="text-xs uppercase tracking-wide text-slate-500">
                      Chargeable weight (kg)
                      <Input
                        value={weightInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*\.?\d*$/.test(value)) {
                            setWeightInput(value);
                          }
                        }}
                        placeholder="e.g. 2.5"
                        className="mt-1"
                      />
                    </label>
                  </div>

                  {quoteError && (
                    <Alert variant="destructive">
                      <AlertDescription>{quoteError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleQuote} disabled={pricingLoading}>
                      <Weight className="mr-2 h-4 w-4" />
                      Get quote
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setWeightInput('');
                        setQuoteResult(null);
                      }}
                    >
                      Reset
                    </Button>
                  </div>

                  {quoteResult ? (
                    <div className="rounded-2xl border border-slate-900 bg-slate-900 text-white shadow-lg">
                      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm">
                        <span>{quoteResult.serviceType}</span>
                        <span className="flex items-center gap-1 text-xs text-white/70">
                          {quoteResult.modeLabel}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <div className="space-y-2 px-4 py-4">
                        <p className="text-3xl font-semibold">
                          ₹{quoteResult.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-white/70">{quoteResult.routeLabel}</p>
                        <div className="text-xs text-white/60">
                          Chargeable weight {quoteResult.chargeableWeight} kg{' '}
                          {quoteResult.minimumApplied && '(minimum applied)'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Quote will appear here. Amounts are indicative; confirm before booking.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Order Timeline Side Drawer */}
        <Sheet
          open={timelineDrawerOpen}
          onOpenChange={(open) => {
            setTimelineDrawerOpen(open);
            if (!open) {
              // Reset selected shipment when drawer is closed
              setSelectedShipment(null);
            }
          }}
        >
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent" style={{ scrollbarWidth: 'thin' }}>
            <SheetHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SheetTitle>
                    #{shipmentTimeline?.consignmentNumber || selectedShipment?.consignmentNumber}
                  </SheetTitle>
                  {shipmentTimeline && (
                    <div className="flex items-center gap-2">
                      <Badge className={statusTint[(shipmentTimeline as any).currentStatus || 'booked'] || 'bg-slate-100 text-slate-700'}>
                        {resolveDisplayStatus((shipmentTimeline as any).currentStatus || 'booked')}
                      </Badge>
                      {escalatedShipments.has((shipmentTimeline as any).consignmentNumber) && (
                        <Badge className="bg-purple-100 text-purple-700">
                          <Zap className="h-3 w-3 mr-1" />
                          Escalated
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {shipmentTimeline && (
                  <div className="flex items-center gap-3 flex-wrap">
                    {(() => {
                      const sla = (shipmentTimeline as any).sla || { status: 'ok' as const };
                      return (
                        <Badge
                          className={
                            sla.status === 'breached'
                              ? 'bg-rose-100 text-rose-700'
                              : sla.status === 'warning'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }
                        >
                          <Timer className="h-3 w-3 mr-1" />
                          SLA: {sla.status === 'breached'
                            ? `Breached${sla.breachedByHours ? ` (${Math.round(sla.breachedByHours)}h)` : ''}`
                            : sla.status === 'warning'
                              ? `Warning${sla.hoursRemaining ? ` (${Math.round(sla.hoursRemaining)}h)` : ''}`
                              : 'OK'}
                        </Badge>
                      );
                    })()}
                    {customerHistory && (
                      <>
                        <span className="text-xs text-slate-500">
                          Past shipments: {customerHistory.totalShipments}
                          {customerHistory.complaintsCount > 0 && (
                            <span className="ml-2 text-rose-600">
                              • {customerHistory.complaintsCount} complaints
                            </span>
                          )}
                        </span>
                        {customerHistory.isVIP && (
                          <Badge className="bg-purple-100 text-purple-700">VIP</Badge>
                        )}
                        {customerHistory.isRegular && (
                          <Badge className="bg-blue-100 text-blue-700">Regular</Badge>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </SheetHeader>

            {shipmentLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : shipmentTimeline ? (
              <div className="space-y-6 mt-6">
                {/* Contact Section */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Contact Information</h3>

                  {/* Customer Contact - Display only from booked array */}
                  {(shipmentTimeline as any).booked?.[0]?.originData && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {(shipmentTimeline as any).booked[0].originData.name || 'Customer'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(shipmentTimeline as any).booked[0].originData.mobileNumber || 'N/A'}
                        </p>
                      </div>
                      {(shipmentTimeline as any).booked[0].originData.mobileNumber && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(`tel:${(shipmentTimeline as any).booked[0].originData.mobileNumber}`);
                          }}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Courier Boy Contact - Display only from OFD array */}
                  {(shipmentTimeline as any).OFD?.[0] && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          Courier: {(shipmentTimeline as any).OFD[0].courierBoyName || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(shipmentTimeline as any).OFD[0].courierBoyPhone || 'N/A'}
                        </p>
                      </div>
                      {(shipmentTimeline as any).OFD[0].courierBoyPhone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(`tel:${(shipmentTimeline as any).OFD[0].courierBoyPhone}`);
                          }}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {(shipmentTimeline as any).booked?.[0]?.originData?.mobileNumber && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          const message = encodeURIComponent(
                            `Your shipment #${(shipmentTimeline as any).consignmentNumber} is out for delivery.`
                          );
                          window.open(`https://wa.me/${(shipmentTimeline as any).booked[0].originData.mobileNumber.replace(/[^0-9]/g, '')}?text=${message}`);
                        }}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setEscalatingShipment(shipmentTimeline);
                        setEscalationDialogOpen(true);
                      }}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Escalate
                    </Button>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Shipment Timeline</h3>
                  <div className="space-y-3">
                    {(shipmentTimeline as any).timeline?.map((entry: any, index: number) => {
                      const statusColors: Record<string, string> = {
                        booked: 'bg-blue-500',
                        received: 'bg-purple-500',
                        assigned: 'bg-indigo-500',
                        'in_transit': 'bg-indigo-500',
                        'reached-hub': 'bg-cyan-500',
                        OFP: 'bg-blue-500',
                        'out_for_delivery': 'bg-blue-500',
                        delivered: 'bg-emerald-500',
                        cancelled: 'bg-rose-500',
                        failed: 'bg-rose-500',
                      };

                      const isDelivered = entry.status === 'delivered';
                      const isFailed = entry.status === 'cancelled' || entry.status === 'failed';
                      const bgColor = isDelivered ? 'bg-emerald-50 border-emerald-200' : isFailed ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200';
                      const textColor = isDelivered ? 'text-emerald-900' : isFailed ? 'text-rose-900' : 'text-slate-900';
                      const timeColor = isDelivered ? 'text-emerald-700' : isFailed ? 'text-rose-700' : 'text-slate-500';

                      return (
                        <div key={index} className={`flex gap-3 p-3 rounded-lg border ${bgColor}`}>
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full ${statusColors[entry.status] || 'bg-slate-500'} mt-2`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className={`font-medium ${textColor}`}>
                                {resolveDisplayStatus(entry.status)}
                              </p>
                              <span className={`text-xs ${timeColor}`}>
                                {formatDateTime(entry.timestamp)}
                              </span>
                            </div>
                            {entry.location && (
                              <p className={`text-sm ${isFailed ? 'text-rose-700' : 'text-slate-600'} mt-1`}>
                                Location: {entry.location}
                              </p>
                            )}
                            {entry.hubName && (
                              <p className={`text-sm ${isFailed ? 'text-rose-700' : 'text-slate-600'} mt-1`}>
                                Hub: {entry.hubName}
                              </p>
                            )}
                            {entry.courierBoyName && (
                              <p className={`text-sm ${isFailed ? 'text-rose-700' : 'text-slate-600'} mt-1`}>
                                Courier: {entry.courierBoyName}
                                {entry.courierBoyPhone && (
                                  <span className="ml-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() => {
                                        window.open(`tel:${entry.courierBoyPhone}`);
                                      }}
                                    >
                                      <Phone className="h-3 w-3" />
                                    </Button>
                                  </span>
                                )}
                              </p>
                            )}
                            {entry.failedReason && (
                              <div className="mt-2 p-2 rounded bg-white border border-rose-200">
                                <p className="text-xs font-medium text-rose-900 mb-1">Failure Reason:</p>
                                <p className="text-sm text-rose-700">{entry.failedReason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Escalation History */}
                {shipmentTimeline && escalationHistory[shipmentTimeline.consignmentNumber] && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">Escalation History</h3>
                      <Badge className="bg-purple-100 text-purple-700">
                        <Zap className="h-3 w-3 mr-1" />
                        Escalated
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg border border-purple-200 bg-purple-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-900">
                          Escalated to: {escalationHistory[shipmentTimeline.consignmentNumber].target.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-xs text-purple-700">
                          {formatDateTime(escalationHistory[shipmentTimeline.consignmentNumber].timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-purple-800 mb-1">
                        {escalationHistory[shipmentTimeline.consignmentNumber].reason}
                      </p>
                      <p className="text-xs text-purple-600">
                        By: {escalationHistory[shipmentTimeline.consignmentNumber].agent}
                      </p>
                    </div>
                  </div>
                )}

                {/* Internal Notes System */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-semibold text-slate-900">Internal Notes (Staff Only)</h3>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add internal note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (shipmentTimeline.consignmentNumber) {
                          addInternalNote(shipmentTimeline.consignmentNumber);
                        }
                      }}
                      disabled={!newNote.trim() || addingNote}
                    >
                      {addingNote ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Add Note
                        </>
                      )}
                    </Button>
                  </div>
                  {internalNotes.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {internalNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-700">
                              {note.agentName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatDateTime(note.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-900">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p>No shipment data available</p>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Escalation Dialog */}
        <Dialog open={escalationDialogOpen} onOpenChange={setEscalationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Escalate Shipment</DialogTitle>
              <DialogDescription>
                Escalate shipment #{escalatingShipment?.consignmentNumber} for review
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {escalatingShipment && escalationHistory[escalatingShipment.consignmentNumber] && (
                <Alert className="bg-purple-50 border-purple-200">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-sm">
                    <p className="font-medium text-purple-900 mb-1">Previously Escalated</p>
                    <p className="text-purple-700">
                      Escalated to {escalationHistory[escalatingShipment.consignmentNumber].target.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} on{' '}
                      {formatDateTime(escalationHistory[escalatingShipment.consignmentNumber].timestamp)}
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Escalate To
                </label>
                <Select
                  value={escalationTarget}
                  onValueChange={(value: 'ops_manager' | 'hub_manager' | 'admin') =>
                    setEscalationTarget(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ops_manager">Ops Manager</SelectItem>
                    <SelectItem value="hub_manager">Hub Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Reason for Escalation
                </label>
                <Textarea
                  placeholder="Describe the issue..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEscalationDialogOpen(false);
                    setEscalationReason('');
                    setEscalatingShipment(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleEscalation} disabled={!escalationReason.trim()}>
                  <Zap className="h-4 w-4 mr-2" />
                  Escalate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Needs Attention View All Dialog */}
        <Dialog open={needsAttentionDialogOpen} onOpenChange={setNeedsAttentionDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Needs Attention / Action Required</DialogTitle>
              <DialogDescription>
                {needsAttention.length} shipment{needsAttention.length !== 1 ? 's' : ''} requiring immediate attention
              </DialogDescription>
            </DialogHeader>

            {needsAttention.length > 0 ? (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent" style={{ scrollbarWidth: 'thin' }}>
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-600 hover:bg-blue-600">
                        <TableHead className="w-[120px] px-3 py-2 text-xs text-white font-semibold text-center">Tracking ID</TableHead>
                        <TableHead className="px-3 py-2 text-xs text-white font-semibold text-center">Issue Type</TableHead>
                        <TableHead className="px-3 py-2 text-xs text-white font-semibold text-center">Time Since Update</TableHead>
                        <TableHead className="px-3 py-2 text-xs text-white font-semibold text-center">Priority</TableHead>
                        <TableHead className="px-3 py-2 text-xs text-white font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {needsAttention.map((item, index) => {
                        // Alternate row colors: even index = gray, odd index = white
                        const rowBgColor = index % 2 === 0 ? 'bg-slate-200' : 'bg-white';
                        const hoverBgColor = index % 2 === 0 ? 'hover:!bg-slate-200' : 'hover:!bg-white';

                        return (
                          <TableRow key={index} className={`${rowBgColor} ${hoverBgColor} border-b border-slate-100`}>
                            <TableCell className="font-medium py-2 text-xs text-center text-slate-600">
                              #{item.consignmentNumber}
                            </TableCell>
                            <TableCell className="py-2 text-xs text-center text-slate-600">{item.issueType}</TableCell>
                            <TableCell className="py-2 text-xs text-center text-slate-600">{formatTimeSinceUpdate(item.lastUpdate)}</TableCell>
                            <TableCell className="py-2 text-center">
                              <Badge
                                className={`text-[10px] px-1.5 py-0.5 rounded-none ${item.priority === 'high'
                                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-100'
                                    : item.priority === 'medium'
                                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                  }`}
                              >
                                {item.priority.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-slate-600 hover:text-slate-900 hover:bg-transparent"
                                onClick={() => {
                                  setNeedsAttentionDialogOpen(false);
                                  openShipmentTimeline(item.consignmentNumber);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                <p>No shipments require immediate attention</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Sales Forms List Dialog */}
        <Dialog open={salesFormsDialogOpen} onOpenChange={setSalesFormsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sales Forms
                <Badge variant="secondary" className="ml-2">
                  {salesFormsCount}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                List of all sales form submissions
              </DialogDescription>
            </DialogHeader>

            {salesFormsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading sales forms...</span>
              </div>
            ) : salesForms.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">No sales forms found</p>
                <p className="text-sm mt-1">No sales form submissions available</p>
              </div>
            ) : (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesForms.map((form, index) => (
                        <TableRow key={form._id} className="hover:bg-slate-50">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{form.companyName || 'N/A'}</TableCell>
                          <TableCell>{form.concernPersonName || 'N/A'}</TableCell>
                          <TableCell>{form.phoneNumber || 'N/A'}</TableCell>
                          <TableCell>{form.emailAddress || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                form.status === 'pending'
                                  ? 'bg-amber-100 text-amber-700'
                                  : form.status === 'seen'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : form.status === 'contacted'
                                      ? 'bg-blue-100 text-blue-700'
                                      : form.status === 'converted'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                              }
                            >
                              {form.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {form.submittedByName || 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {formatDateTime(form.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchSalesFormDetails(form._id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Sales Form Detail Dialog */}
        <Dialog open={salesFormDetailDialogOpen} onOpenChange={setSalesFormDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedSalesForm ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 space-y-6">
                {/* Company & Contact Information */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    Company & Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Company Name</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Concern Person</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.concernPersonName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Designation</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.designation || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Phone Number</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Email Address</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.emailAddress || 'N/A'}</p>
                    </div>
                    {selectedSalesForm.alternatePhoneNumber && (
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">Alternate Phone</p>
                        <p className="text-xs font-medium text-slate-900">{selectedSalesForm.alternatePhoneNumber}</p>
                      </div>
                    )}
                    {selectedSalesForm.website && (
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">Website</p>
                        <p className="text-xs font-medium text-slate-900">{selectedSalesForm.website}</p>
                      </div>
                    )}
                    {/* Address Fields */}
                    {(selectedSalesForm.locality || selectedSalesForm.fullAddress) && (
                      <div className="md:col-span-2 space-y-2">
                        <p className="text-[10px] text-slate-500 mb-2">Address</p>
                        {selectedSalesForm.locality ? (
                          <div className="space-y-1 text-xs">
                            <p className="font-medium text-slate-900">
                              {selectedSalesForm.locality}
                              {selectedSalesForm.buildingFlatNo && `, ${selectedSalesForm.buildingFlatNo}`}
                              {selectedSalesForm.landmark && `, ${selectedSalesForm.landmark}`}
                            </p>
                            <p className="text-slate-700">
                              {[
                                selectedSalesForm.area,
                                selectedSalesForm.city,
                                selectedSalesForm.state,
                                selectedSalesForm.pincode
                              ].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-slate-900">{selectedSalesForm.fullAddress || 'N/A'}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Business & Shipment Details */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5" />
                    Business & Shipment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Type of Business</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.typeOfBusiness || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Type of Shipments</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.typeOfShipments || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Average Shipment Volume</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.averageShipmentVolume || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Most Frequent Routes</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.mostFrequentRoutes || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Weight Range</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.weightRange || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Packing Required</p>
                      <p className="text-xs font-medium text-slate-900 capitalize">{selectedSalesForm.packingRequired || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Current Logistics Setup */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5" />
                    Current Logistics Setup
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Existing Logistics Partners</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.existingLogisticsPartners || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Current Issues / Pain Points</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.currentIssues || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Requirements */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5" />
                    Vehicle Requirements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Vehicles Needed Per Month</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.vehiclesNeededPerMonth || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Type of Vehicle Required</p>
                      <p className="text-xs font-medium text-slate-900">{selectedSalesForm.typeOfVehicleRequired || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Uploaded Images */}
                {((selectedSalesForm.uploadedImages && selectedSalesForm.uploadedImages.length > 0) || selectedSalesForm.uploadedImage) && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Upload className="h-3.5 w-3.5" />
                      Uploaded Images
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Display multiple images if available */}
                      {selectedSalesForm.uploadedImages && selectedSalesForm.uploadedImages.length > 0 ? (
                        selectedSalesForm.uploadedImages.map((imageUrl: string, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Uploaded ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(imageUrl, '_blank')}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="h-4 w-4 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        ))
                      ) : (
                        /* Fallback to single image for backward compatibility */
                        selectedSalesForm.uploadedImage && (
                          <div className="relative group">
                            <img
                              src={selectedSalesForm.uploadedImage}
                              alt="Uploaded"
                              className="w-full h-48 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(selectedSalesForm.uploadedImage, '_blank')}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="h-4 w-4 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Status & Metadata */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 mb-3">Status & Metadata</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Status</p>
                      <Badge
                        className={
                          selectedSalesForm.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : selectedSalesForm.status === 'seen'
                              ? 'bg-indigo-100 text-indigo-700'
                              : selectedSalesForm.status === 'contacted'
                                ? 'bg-blue-100 text-blue-700'
                                : selectedSalesForm.status === 'converted'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {selectedSalesForm.status || 'pending'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Submitted On</p>
                      <p className="text-xs font-medium text-slate-900">{formatDateTime(selectedSalesForm.createdAt)}</p>
                    </div>
                    {selectedSalesForm.submittedByName && (
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">Submitted By</p>
                        <p className="text-xs font-medium text-slate-900">{selectedSalesForm.submittedByName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submission Location */}
                {(selectedSalesForm.submissionCity || selectedSalesForm.submissionState || selectedSalesForm.submissionCountry) && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Navigation className="h-3.5 w-3.5" />
                      Submission Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">City</p>
                        <p className="text-xs font-medium text-slate-900">{selectedSalesForm.submissionCity || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">State</p>
                        <p className="text-xs font-medium text-slate-900">{selectedSalesForm.submissionState || 'N/A'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[10px] text-slate-500 mb-1">Country</p>
                        <p className="text-xs font-medium text-slate-900">{selectedSalesForm.submissionCountry || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No sales form data available</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Courier Boys Payment Dialog */}
        <Dialog open={courierBoysDialogOpen} onOpenChange={setCourierBoysDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bike className="h-5 w-5 text-green-600" />
                Courier Boy Payments
                <Badge variant="secondary" className="ml-2">
                  {courierBoysList.length}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                View courier boys and payment amounts to collect
              </DialogDescription>
            </DialogHeader>

            {courierBoysListLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <span className="ml-3 text-gray-600">Loading courier boys...</span>
              </div>
            ) : courierBoysList.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bike className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">No courier boys found</p>
                <p className="text-sm mt-1">No courier boys with pending payments</p>
              </div>
            ) : (
              <div className="mt-4">
                <div className="mb-4 grid grid-cols-3 gap-4">
                  <Card className="bg-white">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Courier Boys</p>
                          <p className="text-xl font-bold text-gray-800">{courierBoysList.length}</p>
                        </div>
                        <Bike className="h-6 w-6 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                          <p className="text-xl font-bold text-green-700">
                            ₹{courierBoysList.reduce((sum, cb) => sum + cb.totalAmount, 0).toFixed(2)}
                          </p>
                        </div>
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Orders</p>
                          <p className="text-xl font-bold text-purple-700">
                            {courierBoysList.reduce((sum, cb) => sum + cb.orders.length, 0)}
                          </p>
                        </div>
                        <Package className="h-6 w-6 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 bg-green-500">
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4 text-white" />
                      <h3 className="font-semibold text-white">
                        Courier Boys ({courierBoysList.length})
                      </h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200 bg-gray-100">
                          <TableHead className="font-medium text-gray-700 py-3 px-4 text-left w-10"></TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">#</TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Name</TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Contact</TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Email</TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Area</TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Total Amount</TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4 text-left w-32">Orders</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courierBoysList.map((courierBoy, index) => {
                          const isExpanded = courierBoysExpandedRows.has(courierBoy._id);
                          const hasOrders = courierBoy.orders.length > 0;

                          return (
                            <React.Fragment key={courierBoy._id}>
                              <TableRow className="border-b border-gray-100">
                                <TableCell className="py-3 px-4 text-left">
                                  {hasOrders && (
                                    <button
                                      onClick={() => {
                                        setCourierBoysExpandedRows(prev => {
                                          const newSet = new Set(prev);
                                          if (newSet.has(courierBoy._id)) {
                                            newSet.delete(courierBoy._id);
                                          } else {
                                            newSet.add(courierBoy._id);
                                          }
                                          return newSet;
                                        });
                                      }}
                                      className="p-1 rounded hover:bg-gray-100"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-gray-600" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                      )}
                                    </button>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4 font-medium text-left">{index + 1}</TableCell>
                                <TableCell className="py-3 px-4 text-left">
                                  <div className="font-medium text-gray-900">{courierBoy.fullName}</div>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-left">
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-900">{courierBoy.phone}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-left">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-900">{courierBoy.email}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-left">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-900">{courierBoy.area}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-left">
                                  <div className="font-semibold text-green-700">
                                    ₹{courierBoy.totalAmount.toFixed(2)}
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-left w-32">
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 hover:text-blue-800">
                                    {courierBoy.orders.length} order(s)
                                  </Badge>
                                </TableCell>
                              </TableRow>

                              {/* Expanded orders row */}
                              {isExpanded && hasOrders && (
                                <TableRow className="bg-gray-50/50">
                                  <TableCell colSpan={8} className="py-4 px-6">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-gray-800 text-sm">Paid Orders ({courierBoy.orders.length})</h4>
                                        <div className="text-sm text-gray-600">
                                          Total: <span className="font-semibold text-green-700">₹{courierBoy.totalAmount.toFixed(2)}</span>
                                        </div>
                                      </div>
                                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                        <Table>
                                          <TableHeader>
                                            <TableRow className="bg-gray-50 border-b border-gray-200">
                                              <TableHead className="font-medium text-gray-700 py-3 px-4 text-left text-xs">#</TableHead>
                                              <TableHead className="font-medium text-gray-700 py-3 px-4 text-left text-xs">Consignment</TableHead>
                                              <TableHead className="font-medium text-gray-700 py-3 px-4 text-left text-xs">Receiver Name</TableHead>
                                              <TableHead className="font-medium text-gray-700 py-3 px-4 text-left text-xs">Phone Number</TableHead>
                                              <TableHead className="font-medium text-gray-700 py-3 px-4 text-left text-xs">Route</TableHead>
                                              <TableHead className="font-medium text-gray-700 py-3 px-4 text-left text-xs">Amount</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {courierBoy.orders.map((order, orderIndex) => (
                                              <TableRow
                                                key={orderIndex}
                                                className="border-b border-gray-100"
                                              >
                                                <TableCell className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                                                  {orderIndex + 1}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-left">
                                                  <div className="font-medium text-gray-900 text-sm">
                                                    {order.consignmentNumber || order.bookingReference}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-left">
                                                  <div className="font-medium text-gray-900 text-sm">
                                                    {order.receiverName}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-left">
                                                  <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                    <span>{order.receiverPhone}</span>
                                                  </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-left">
                                                  <div className="text-sm text-gray-700 font-medium">
                                                    {order.route}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-left">
                                                  <div className="font-semibold text-green-700 text-sm">
                                                    ₹{order.amount.toFixed(2)}
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
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
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Status Bookings Popup */}
        <Dialog open={statusPopupOpen} onOpenChange={setStatusPopupOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {selectedStatus === 'total' ? 'All Shipments' : `${resolveDisplayStatus(selectedStatus || '')} Shipments`}
                <Badge variant="secondary" className="ml-2">
                  {statusBookings.length}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Quick view of all bookings with this status
              </DialogDescription>
            </DialogHeader>

            {statusBookingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading bookings...</span>
              </div>
            ) : statusBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">No bookings found</p>
                <p className="text-sm mt-1">No bookings match this status</p>
              </div>
            ) : (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Consignment</TableHead>
                        <TableHead>Origin</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statusBookings.map((booking, index) => {
                        const statusInfo = getStatusInfo(booking.currentStatus || booking.status);
                        const sourceBadge = getSourceBadge(booking.source);

                        return (
                          <TableRow key={booking._id} className="hover:bg-slate-50">
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <Badge className={cn("text-xs px-2 py-1 rounded-lg flex items-center gap-1 w-fit", sourceBadge.color)}>
                                {sourceBadge.icon}
                                {sourceBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold">
                              {booking.consignmentNumber || booking.bookingReference}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{booking.origin.name}</div>
                                <div className="text-xs text-gray-500">{booking.origin.city}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{booking.destination.name}</div>
                                <div className="text-xs text-gray-500">{booking.destination.city}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={statusInfo.variant}
                                className={cn(statusInfo.bgColor, statusInfo.color, "text-xs px-2 py-1 rounded-lg flex items-center gap-1")}
                              >
                                {statusInfo.icon}
                                <span className="capitalize">
                                  {(booking.currentStatus || booking.status).replace('_', ' ').replace('-', ' ')}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}
                                className={cn(
                                  "text-xs px-2 py-1 rounded-lg",
                                  booking.paymentStatus === 'paid'
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                )}
                              >
                                {booking.paymentStatus === 'paid' ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                )}
                                <span className="capitalize">{booking.paymentStatus}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              ₹{booking.totalAmount?.toFixed(2) || '0.00'}
                            </TableCell>
                            <TableCell className="text-xs text-gray-600">
                              {formatDateTime(booking.bookingDate || booking.createdAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default CustomerCareOverview;                        