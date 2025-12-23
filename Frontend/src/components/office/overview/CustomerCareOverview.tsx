import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
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
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  };
  destinationData?: {
    name?: string;
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

type ShipmentStatus = 'booked' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled';
type StatusCounts = Record<ShipmentStatus, number>;

const STATUS_KEYS: ShipmentStatus[] = ['booked', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'];

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
    'picked': 'booked',
    'pickup': 'booked',
    'picked_up': 'booked',
    'received': 'booked',
    'assigned': 'booked',
    'partially_assigned': 'booked',
    'courierboy': 'booked',
    'in_transit': 'in_transit',
    'intransit': 'in_transit',
    'reached-hub': 'in_transit',
    'assigned_completed': 'booked',
    'ofp': 'out_for_delivery',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'failed': 'cancelled',
    'returned': 'cancelled',
    'pending': 'booked',
    'completed': 'delivered'
  };

  return statusMap[normalized] || 'booked';
};

const statusTint: Record<string, string> = {
  // Trackings table statuses
  booked: 'bg-slate-100 text-slate-700',
  pickup: 'bg-amber-100 text-amber-700',
  received: 'bg-purple-100 text-purple-700',
  assigned: 'bg-indigo-100 text-indigo-700',
  intransit: 'bg-cyan-100 text-cyan-700',
  'reached-hub': 'bg-blue-100 text-blue-700',
  OFP: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  // Legacy statuses for backward compatibility
  partially_assigned: 'bg-indigo-100 text-indigo-700',
  picked_up: 'bg-amber-100 text-amber-700',
  in_transit: 'bg-cyan-100 text-cyan-700',
  failed: 'bg-rose-100 text-rose-700',
  out_for_delivery: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

const CustomerCareOverview = () => {
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerRecords, setCustomerRecords] = useState<AddressFormRecord[]>([]);
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

  const [activeOrders, setActiveOrders] = useState<AddressFormRecord[]>([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [activeError, setActiveError] = useState('');
  const [activeTotal, setActiveTotal] = useState<number | null>(null);
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
  const [courierPaymentsLoading, setCourierPaymentsLoading] = useState(false);

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
          page: '1',
          limit: '5',
          search: query.trim(),
        });

        const response = await fetch(`/api/office/addressforms?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Unable to fetch customer records');
        }

        const data = await response.json();
        setCustomerRecords(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error(err);
        setCustomerError(err instanceof Error ? err.message : 'Failed to fetch customer records');
      } finally {
        setCustomerLoading(false);
      }
    },
    [token],
  );

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
      // Fetch ALL records from trackings table for accurate metrics
      const allTrackings: any[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      // Fetch all pages from trackings table
      while (hasMore) {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        // Use office-specific tracking endpoint
        const response = await fetch(`/api/office/tracking?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Unable to load tracking data from trackings table');
        }

        const data = await response.json();
        const trackings = data?.data || [];
        
        if (trackings.length === 0) {
          hasMore = false;
        } else {
          allTrackings.push(...trackings);
          
          // Check if there are more pages
          const pagination = data?.pagination;
          if (pagination?.hasNext === false || trackings.length < limit) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }

      // Only use currentStatus from trackings table - nothing else
      const transformed = allTrackings.map((tracking: any) => ({
        _id: tracking._id,
        consignmentNumber: tracking.consignmentNumber,
        currentStatus: tracking.currentStatus, // ONLY from trackings table
        booked: tracking.booked || [],
        createdAt: tracking.createdAt,
        updatedAt: tracking.updatedAt,
      }));

      setActiveOrders(transformed);
      setActiveTotal(transformed.length);
    } catch (error) {
      console.error(error);
      setActiveError(error instanceof Error ? error.message : 'Failed to load tracking data from trackings table');
      setActiveOrders([]);
      setActiveTotal(0);
    } finally {
      setActiveLoading(false);
    }
  }, [token]);

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
      // Fetch all trackings to find unpaid orders
      const allTrackings: any[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      // Fetch all pages from trackings table
      while (hasMore) {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        const response = await fetch(`/api/office/tracking?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Unable to load tracking data');
        }

        const data = await response.json();
        const trackings = data?.data || [];
        
        if (trackings.length === 0) {
          hasMore = false;
        } else {
          allTrackings.push(...trackings);
          
          const pagination = data?.pagination;
          if (pagination?.hasNext === false || trackings.length < limit) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }

      // Filter unpaid orders and group by payment type
      const fpOrders: any[] = [];
      const tpOrders: any[] = [];

      allTrackings.forEach((tracking: any) => {
        const bookedEntry = tracking.booked && tracking.booked.length > 0 ? tracking.booked[0] : null;
        
        if (!bookedEntry) return;
        
        // Check if paymentStatus is unpaid
        if (bookedEntry.paymentStatus !== 'unpaid') return;

        const paymentType = bookedEntry.paymentData?.paymentType || 'TP';
        const amount = bookedEntry.invoiceData?.finalPrice || 0;
        
        if (amount <= 0) return;

        const orderData = {
          consignmentNumber: tracking.consignmentNumber,
          bookingReference: tracking.bookingReference || tracking.consignmentNumber?.toString(),
          amount: amount,
          receiverName: bookedEntry.destinationData?.name || 'N/A',
          receiverPhone: bookedEntry.destinationData?.mobileNumber || 'N/A',
          route: `${bookedEntry.originData?.city || 'N/A'} → ${bookedEntry.destinationData?.city || 'N/A'}`,
          bookingDate: bookedEntry.bookingDate || tracking.createdAt,
        };

        if (paymentType === 'FP') {
          fpOrders.push(orderData);
        } else {
          tpOrders.push(orderData);
        }
      });

      const fpTotal = fpOrders.reduce((sum, order) => sum + order.amount, 0);
      const tpTotal = tpOrders.reduce((sum, order) => sum + order.amount, 0);

      setUnpaidPayments({
        FP: {
          totalAmount: fpTotal,
          totalOrders: fpOrders.length,
          orders: fpOrders,
        },
        TP: {
          totalAmount: tpTotal,
          totalOrders: tpOrders.length,
          orders: tpOrders,
        },
      });
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
      const [courierBoysResponse, paymentsResponse] = await Promise.all([
        fetch('/api/office/courier-boys/list', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/office/courier-boys/payments', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (courierBoysResponse.ok && paymentsResponse.ok) {
        const courierBoysData = await courierBoysResponse.json();
        const paymentsData = await paymentsResponse.json();

        if (courierBoysData.success && paymentsData.success) {
          const payments = paymentsData.data || [];

          const totalAmount = payments.reduce(
            (sum: number, p: { totalAmount: number }) => sum + (p.totalAmount || 0),
            0
          );
          const totalOrders = payments.reduce(
            (sum: number, p: { orders: any[] }) => sum + (p.orders?.length || 0),
            0
          );
          const courierBoysWithPayments = payments.filter(
            (p: { totalAmount: number }) => (p.totalAmount || 0) > 0
          ).length;

          setCourierPayments({
            totalAmount,
            totalCourierBoys: courierBoysWithPayments,
            totalOrders,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching courier payments:', error);
    } finally {
      setCourierPaymentsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPricingSnapshot();
    fetchActiveOrders();
    fetchUnpaidPayments();
    fetchCourierPayments();
  }, [fetchPricingSnapshot, fetchActiveOrders, fetchUnpaidPayments, fetchCourierPayments]);

  const customerProfile = customerRecords[0] || null;

  const statusSummary = useMemo(() => {
    // ONLY use currentStatus from trackings table - no fallbacks, no mapping
    // Trackings table statuses: booked, pickup, received, assigned, intransit, reached-hub, OFP, delivered
    const summary: Record<string, number> = {
      booked: 0,
      pickup: 0,
      received: 0,
      assigned: 0,
      intransit: 0,
      'reached-hub': 0,
      OFP: 0,
      delivered: 0,
    };

    activeOrders.forEach((order) => {
      // ONLY use currentStatus from trackings table - nothing else
      const status = order.currentStatus;
      if (status && status in summary) {
        summary[status] = (summary[status] || 0) + 1;
      }
    });
    return summary;
  }, [activeOrders]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return activeOrders.filter(
      (order) => order.createdAt && new Date(order.createdAt).toDateString() === today,
    ).length;
  }, [activeOrders]);

  const keyMetrics = useMemo(() => {
    const total = activeTotal ?? activeOrders.length;

    // Map trackings table statuses to key metrics
    return [
      {
        key: 'total',
        label: 'Total Shipments',
        value: total,
        icon: Package,
        color: 'blue' as const,
        gradient: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        iconColor: 'text-blue-600',
      },
      {
        key: 'booked',
        label: 'Booked',
        value: statusSummary.booked || 0,
        icon: Clock,
        color: 'purple' as const,
        gradient: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        iconColor: 'text-purple-600',
      },
      {
        key: 'pickup',
        label: 'Pickup',
        value: statusSummary.pickup || 0,
        icon: Truck,
        color: 'amber' as const,
        gradient: 'from-amber-500 to-amber-600',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        iconColor: 'text-amber-600',
      },
      {
        key: 'received',
        label: 'In OCL',
        value: statusSummary.received || 0,
        icon: Building,
        color: 'purple' as const,
        gradient: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        iconColor: 'text-purple-600',
      },
      {
        key: 'intransit',
        label: 'In Transit',
        value: statusSummary.intransit || 0,
        icon: Activity,
        color: 'orange' as const,
        gradient: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        iconColor: 'text-orange-600',
      },
      {
        key: 'reached-hub',
        label: 'Reached Hub',
        value: statusSummary['reached-hub'] || 0,
        icon: MapPin,
        color: 'cyan' as const,
        gradient: 'from-cyan-500 to-cyan-600',
        bgColor: 'bg-cyan-50',
        textColor: 'text-cyan-700',
        iconColor: 'text-cyan-600',
      },
      {
        key: 'OFP',
        label: 'Out for Delivery',
        value: statusSummary.OFP || 0,
        icon: MapPin,
        color: 'blue' as const,
        gradient: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        iconColor: 'text-blue-600',
      },
      {
        key: 'delivered',
        label: 'Delivered',
        value: statusSummary.delivered || 0,
        icon: CheckCircle,
        color: 'green' as const,
        gradient: 'from-emerald-500 to-emerald-600',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        iconColor: 'text-emerald-600',
      },
    ];
  }, [activeOrders, activeTotal, statusSummary]);

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
    <section className="min-h-screen space-y-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="grid gap-4 lg:grid-cols-[3fr_1fr]">
          <div className="">
            <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleLookupSubmit}>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Phone, email, tracking, company..."
                  className="h-11 border-slate-200 pl-10 text-sm"
                />
              </div>
              <Button type="submit" disabled={customerLoading} className="min-w-[140px] h-11">
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
            <Button size="lg" className="w-full h-11" onClick={() => setCheckerOpen(true)}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Serviceability
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Key Metrics</h2>
          </div>
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

        <div className="flex gap-2 w-full">
          {keyMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.key}
                className="group relative flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300"
              >
                <div className="relative w-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`rounded-md ${metric.bgColor} p-1.5`}>
                      <Icon className={`h-4 w-4 ${metric.iconColor}`} />
                    </div>
                    {metric.key === 'total' && todayCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-blue-100 text-blue-700">
                        +{todayCount}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-0.5">
                    <p className="text-lg font-bold text-slate-900 leading-tight">{metric.value.toLocaleString()}</p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide leading-tight">{metric.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Collection - All in One Line */}
      <div className="flex gap-3 w-full">
        {/* Courier Boy Payments */}
        <div className="flex-1 rounded-lg border border-slate-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Bike className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-semibold text-slate-900">Courier Boy</h3>
          </div>
          {courierPaymentsLoading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : courierPayments ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Amount</span>
                <span className="text-lg font-bold text-green-700">
                  ₹{courierPayments.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Boys</span>
                <span className="font-semibold text-slate-900">
                  {courierPayments.totalCourierBoys}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Orders</span>
                <span className="font-semibold text-slate-900">
                  {courierPayments.totalOrders}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-2">
              No data
            </div>
          )}
        </div>

        {/* FP (Freight Paid) Block */}
        <div 
          className="flex-1 rounded-lg border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
          onClick={() => {
            setSelectedPaymentType('FP');
            setPaymentDialogOpen(true);
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">FP</h3>
            <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
              Unpaid
            </Badge>
          </div>
          {unpaidPaymentsLoading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : unpaidPayments ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Amount</span>
                <span className="text-lg font-bold text-blue-700">
                  ₹{unpaidPayments.FP.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
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
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-2">
              No data
            </div>
          )}
        </div>

        {/* TP (To Pay) Block */}
        <div 
          className="flex-1 rounded-lg border border-slate-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
          onClick={() => {
            setSelectedPaymentType('TP');
            setPaymentDialogOpen(true);
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">TP</h3>
            <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200">
              Unpaid
            </Badge>
          </div>
          {unpaidPaymentsLoading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : unpaidPayments ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Amount</span>
                <span className="text-lg font-bold text-amber-700">
                  ₹{unpaidPayments.TP.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
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
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-2">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Payment Orders Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedPaymentType === 'FP' ? 'FP (Freight Paid) - Unpaid Orders' : 'TP (To Pay) - Unpaid Orders'}
            </DialogTitle>
            <DialogDescription>
              {unpaidPayments && selectedPaymentType
                ? `${unpaidPayments[selectedPaymentType].totalOrders} orders • Total: ₹${unpaidPayments[selectedPaymentType].totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'Loading orders...'}
            </DialogDescription>
          </DialogHeader>
          
          {unpaidPayments && selectedPaymentType && unpaidPayments[selectedPaymentType].totalOrders > 0 ? (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {unpaidPayments[selectedPaymentType].orders.map((order, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">
                        #{order.consignmentNumber}
                      </p>
                      {order.bookingReference && order.bookingReference !== order.consignmentNumber?.toString() && (
                        <span className="text-xs text-slate-500">({order.bookingReference})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {order.route}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.receiverPhone}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {order.receiverName}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-lg font-bold ${selectedPaymentType === 'FP' ? 'text-blue-700' : 'text-amber-700'}`}>
                      ₹{order.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No unpaid {selectedPaymentType} orders
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
        <DialogContent className="max-w-5xl space-y-6">
          <DialogHeader>
            <DialogTitle>Customer intelligence</DialogTitle>
            <DialogDescription>Lookup & shipment history</DialogDescription>
          </DialogHeader>

          <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleLookupSubmit}>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="Phone, email, tracking, company..."
                className="h-11 border-slate-200 pl-10 text-sm"
              />
            </div>
            <Button type="submit" disabled={customerLoading} className="min-w-[140px]">
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

          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.9fr]">
            <div className="space-y-4">
              {customerProfile ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-inner">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <User className="h-4 w-4 text-slate-400" />
                        Customer
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-slate-900">
                          {customerProfile.senderName || customerProfile.originData?.name || '—'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {customerProfile.senderCity || customerProfile.senderState
                            ? `${customerProfile.senderCity || ''}${
                                customerProfile.senderCity && customerProfile.senderState ? ', ' : ''
                              }${customerProfile.senderState || ''}`
                            : 'No city on file'}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          {customerProfile.senderPhone || '—'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          {customerProfile.senderEmail || '—'}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {customerProfile.senderPincode || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2.5 rounded-2xl border border-white/60 bg-white p-3.5 shadow-sm">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        Company
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {customerProfile.originData?.companyName || 'Individual shipper'}
                        </p>
                        <p className="text-sm text-slate-500">
                          Consignment #{customerProfile.consignmentNumber || '—'}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-slate-400" />
                          Last update {formatRelativeTime(customerProfile.updatedAt)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-slate-400" />
                          Status{' '}
                          <Badge className={statusTint[customerProfile.currentStatus || customerProfile.assignmentData?.status || 'booked']}>
                            {(customerProfile.currentStatus || customerProfile.assignmentData?.status || 'booked').replace(/-/g, ' ').replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
                  <History className="mb-3 h-6 w-6 text-slate-400" />
                  Search by phone, email, reference or company name to load shipment history.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Recent shipments</p>
                {customerRecords.length > 0 && (
                  <span className="text-xs text-slate-500">Showing {customerRecords.length} recent</span>
                )}
              </div>
              <div className="mt-4 space-y-3">
                {customerRecords.length ? (
                  customerRecords.map((record) => (
                    <div
                      key={record._id}
                      className="rounded-xl border border-slate-100 bg-white p-3 text-sm shadow-inner"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900">
                          {record.receiverCity || record.destinationData?.name || 'Unknown destination'}
                        </p>
                        <Badge className={statusTint[record.currentStatus || record.assignmentData?.status || 'booked']}>
                          {(record.currentStatus || record.assignmentData?.status || 'booked').replace(/-/g, ' ').replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        Created {formatDateTime(record.createdAt)} • Consignment #{record.consignmentNumber || '—'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No shipments to show.</p>
                )}
              </div>
            </div>
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
              {pricingLoading ? (
                <span className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Syncing tariffs
                </span>
              ) : pricingSnapshot ? (
                <span className="text-xs text-emerald-600">Tariffs cached</span>
              ) : (
                <Button variant="outline" size="sm" onClick={fetchPricingSnapshot}>
                  Reload pricing
                </Button>
              )}
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
    </section>
  );
};

export default CustomerCareOverview;