import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Package,
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  Loader2,
  ShoppingCart,
  ClipboardCheck,
  Home,
  XCircle,
  Navigation,
  Calendar,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface ShipmentData {
  _id: string;
  bookingReference: string;
  consignmentNumber?: number;
  originData: {
    name: string;
    city: string;
    state: string;
  };
  destinationData: {
    name: string;
    city: string;
    state: string;
  };
  status: 'booked' | 'received_at_ocl' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled';
  bookingDate: string;
}

interface CorporateTrackingProps {
  isDarkMode: boolean;
}

type CorporateTrackingStepKey =
  | "booked"
  | "received_at_ocl"
  | "in_transit"
  | "out_for_delivery"
  | "delivered";

type TrackerStep = {
  key: CorporateTrackingStepKey;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
};

interface TrackingField {
  label: string;
  value: string;
  format?: "datetime" | "text";
  helper?: string | null;
}

interface TrackingStepDetail {
  key: CorporateTrackingStepKey;
  title: string;
  completed: boolean;
  timestamp: string | null;
  description: string | null;
  fields: TrackingField[];
}

interface CorporateTrackingSummary {
  metadata: {
    consignmentNumber: string;
    bookingReference?: string;
    serviceType?: string;
    packageCount?: number | null;
    totalWeight?: number | string | null;
    paymentMethod?: string;
    routeSummary?: string;
    bookingDate?: string | null;
    statusLabel: string;
    currentStepKey: CorporateTrackingStepKey;
    estimatedDelivery?: string | null;
    lastUpdated?: string | null;
  };
  steps: TrackingStepDetail[];
  movementHistory: Array<{
    status: string;
    label: string;
    timestamp: string | null;
    description?: string | null;
    location?: string | null;
  }>;
  attachments: {
    packageImages: string[];
    deliveryProofImages: string[];
  };
}

interface CorporateBookingRecord {
  _id: string;
  bookingReference?: string;
  consignmentNumber?: number;
  bookingData?: {
    originData?: {
      name?: string;
      city?: string;
      state?: string;
    };
    destinationData?: {
      name?: string;
      city?: string;
      state?: string;
    };
    shipmentData?: {
      services?: string;
      mode?: string;
      packagesCount?: number;
      totalPackages?: number;
      actualWeight?: number;
      chargeableWeight?: number;
      specialInstructions?: string;
      packageImages?: Array<{ url?: string }>;
      declaredValue?: number;
      estimatedDeliveryDate?: string;
    };
    invoiceData?: {
      serviceType?: string;
      chargeableWeight?: number;
      finalPrice?: number;
      estimatedDeliveryDate?: string;
    };
    paymentData?: {
      paymentType?: string;
    };
  };
  usedAt?: string;
  createdAt?: string;
  currentStatus?: string;
  status?: string;
  paymentType?: string;
  paymentStatus?: string;
}

interface TrackingApiPayload {
  booking: CorporateBookingRecord;
  trackingSummary: CorporateTrackingSummary;
}

// Map tracking status from database to simplified component status format
const mapTrackingStatusToComponentStatus = (trackingStatus: string | undefined | null): ShipmentData['status'] => {
  if (!trackingStatus) return 'booked';
  const normalized = trackingStatus.toLowerCase();
  const statusMap: Record<string, ShipmentData['status']> = {
    'booked': 'booked',
    'picked': 'received_at_ocl',
    'pickup': 'received_at_ocl',
    'picked_up': 'received_at_ocl',
    'received': 'received_at_ocl',
    'assigned': 'in_transit',
    'courierboy': 'in_transit',
    'in_transit': 'in_transit',
    'intransit': 'in_transit',
    'reached-hub': 'in_transit',
    'assigned_completed': 'in_transit',
    'ofp': 'out_for_delivery',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'returned': 'cancelled'
  };
  return statusMap[normalized] || 'booked';
};

const formatCityState = (city?: string, state?: string) => {
  if (city && state) return `${city}, ${state}`;
  return city || state || "Not available";
};

const transformBookingToShipment = (booking: CorporateBookingRecord): ShipmentData | null => {
  const bookingData = booking.bookingData;
  if (!bookingData) {
    return null;
  }

  const trackingStatus = booking.currentStatus || booking.status;
  const mappedStatus = mapTrackingStatusToComponentStatus(trackingStatus);

  return {
    _id: booking._id,
    bookingReference: booking.bookingReference,
    consignmentNumber: booking.consignmentNumber,
    originData: {
      name: bookingData.originData?.name || '',
      city: bookingData.originData?.city || '',
      state: bookingData.originData?.state || '',
    },
    destinationData: {
      name: bookingData.destinationData?.name || '',
      city: bookingData.destinationData?.city || '',
      state: bookingData.destinationData?.state || '',
    },
    status: mappedStatus,
    bookingDate: booking.usedAt || booking.createdAt,
  };
};

const fetchAllShipmentsFromApi = async (token: string) => {
  const aggregatedShipments: ShipmentData[] = [];
  const limit = 50;
  const MAX_PAGES = 100;
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
      throw new Error('Invalid response format from server');
    }

    const bookingsData = data.data as CorporateBookingRecord[];
    const transformed = bookingsData
      .map((booking) => transformBookingToShipment(booking))
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

  return aggregatedShipments;
};

const CorporateTracking: React.FC<CorporateTrackingProps> = ({ isDarkMode }) => {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentStepKey, setCurrentStepKey] = useState<CorporateTrackingStepKey>("booked");
  const [trackingSummary, setTrackingSummary] = useState<CorporateTrackingSummary | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [selectedStepKey, setSelectedStepKey] = useState<CorporateTrackingStepKey | null>(null);
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [expandedShipmentId, setExpandedShipmentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { toast } = useToast();

  const trackerSteps = useMemo<TrackerStep[]>(
    () => [
      { key: "booked", title: "Booked", icon: ShoppingCart },
      { key: "received_at_ocl", title: "Received at OCL", icon: Home },
      { key: "in_transit", title: "In Transit", icon: Truck },
      { key: "out_for_delivery", title: "Out for Delivery", icon: Navigation },
      { key: "delivered", title: "Delivered", icon: CheckCircle },
    ],
    []
  );

  const stepIndexMap = useMemo(() => {
    return trackerSteps.reduce<Record<TrackerStep["key"], number>>((acc, step, index) => {
      acc[step.key] = index;
      return acc;
    }, {} as Record<TrackerStep["key"], number>);
  }, [trackerSteps]);

  const statusToStepMap: Record<string, TrackerStep["key"]> = {
    'booked': 'booked',
    'received_at_ocl': 'received_at_ocl',
    'in_transit': 'in_transit',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'booked',
  };

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const token = localStorage.getItem('corporateToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        try {
          const apiShipments = await fetchAllShipmentsFromApi(token);
          setShipments(apiShipments);
        } catch (apiError) {
          console.log('Loading shipments from local storage');
          setShipments([]);
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

  const filteredShipments = useMemo(() => {
    const result = shipments.filter((shipment) => {
      const trackingValue = shipment.consignmentNumber?.toString() || shipment.bookingReference || shipment._id;
      const matchesSearch =
        trackingValue.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        shipment.originData?.name?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        shipment.destinationData?.name?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        formatCityState(shipment.originData?.city, shipment.originData?.state).toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        formatCityState(shipment.destinationData?.city, shipment.destinationData?.state).toLowerCase().includes(orderSearchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        shipment.status.toLowerCase().includes(statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });

    // Whenever the filtered set changes, reset to first page
    setCurrentPage(1);
    return result;
  }, [shipments, orderSearchTerm, statusFilter]);

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedShipments = useMemo(() => {
    const start = (currentPageSafe - 1) * ITEMS_PER_PAGE;
    return filteredShipments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredShipments, currentPageSafe]);

  useEffect(() => {
    if (filteredShipments.length === 0) {
      setActiveOrderId(null);
      return;
    }
    if (!filteredShipments.some((shipment) => shipment._id === activeOrderId)) {
      setActiveOrderId(null);
    }
  }, [filteredShipments, activeOrderId]);

  const formatDateLabel = (timestamp: string | null, withTime = false) => {
    if (!timestamp) return "Pending update";
    const date = new Date(timestamp);
    return withTime
      ? `${date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })} • ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
      : date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast({
        title: "Tracking Number Required",
        description: "Please enter a tracking number to search.",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(true);
    setShowResults(true);
    setExpandedShipmentId(null);
    setTrackingSummary(null);
    setTrackingError(null);

    try {
      await fetchTrackingSummary(trackingNumber.trim());
      toast({
        title: "Tracking Information Found",
        description: `Tracking details for ${trackingNumber.trim()}`,
      });
    } catch (error: unknown) {
      console.error("Tracking error:", error);
      const message = error instanceof Error ? error.message : "An error occurred while tracking your shipment.";
      setTrackingError(message);
      toast({
        title: "Unable to fetch tracking",
        description: message || "Please check the tracking number and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTracking(false);
    }
  };

  const handleShipmentClick = async (shipment: ShipmentData) => {
    const trackingValue = shipment.consignmentNumber?.toString() || shipment.bookingReference || shipment._id;
    if (expandedShipmentId === shipment._id) {
      // Collapse if already expanded
      setExpandedShipmentId(null);
      setTrackingSummary(null);
      setShowResults(false);
      setSelectedStepKey(null);
      setCurrentStepKey("booked");
    } else {
      // Expand this shipment
      setTrackingNumber(trackingValue);
      setExpandedShipmentId(shipment._id);
      setShowResults(true);
      try {
        await fetchTrackingSummary(trackingValue);
      } catch (error) {
        console.error("Failed to load tracking summary:", error);
      }
    }
  };

  const handleClearTracking = () => {
    setTrackingNumber("");
    setTrackingSummary(null);
    setShowResults(false);
    setCurrentStepKey("booked");
    setSelectedStepKey(null);
    setExpandedShipmentId(null);
    setTrackingError(null);
  };

  const getStepDetails = (stepKey: CorporateTrackingStepKey) => {
    if (!trackingSummary) return null;
    return trackingSummary.steps.find((step) => step.key === stepKey) || null;
  };

  const getStepDateLabel = (stepKey: TrackerStep["key"]) => {
    const detail = getStepDetails(stepKey);
    if (detail?.timestamp) {
      return formatDateLabel(detail.timestamp, false);
    }

    if (trackingSummary?.metadata?.bookingDate && stepKey === "booked") {
      return formatDateLabel(trackingSummary.metadata.bookingDate, false);
    }

    return "Pending update";
  };

  const fetchTrackingSummary = useCallback(async (identifier: string) => {
    const lookupValue = identifier.trim();
    if (!lookupValue) {
      throw new Error("Tracking identifier is required.");
    }

    const token = localStorage.getItem('corporateToken');
    if (!token) {
      throw new Error("Access denied. No token provided.");
    }

    setIsLoadingTracking(true);
    setTrackingError(null);

    try {
      const response = await fetch(`/api/corporate/tracking/${encodeURIComponent(lookupValue)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || `Unable to fetch tracking for ${lookupValue}`);
      }

      const payload = await response.json() as { success: boolean; data: TrackingApiPayload; error?: string };
      if (!payload.success) {
        throw new Error(payload.error || "Unable to fetch tracking details.");
      }

      const normalizedShipment = transformBookingToShipment(payload.data.booking);
      if (normalizedShipment) {
        setShipments((prev) => {
          const exists = prev.some((shipment) => shipment._id === normalizedShipment._id);
          if (!exists) return prev;
          return prev.map((shipment) =>
            shipment._id === normalizedShipment._id ? normalizedShipment : shipment
          );
        });
        setActiveOrderId(normalizedShipment._id);
      }

      const summary: CorporateTrackingSummary = payload.data.trackingSummary;
      setTrackingSummary(summary);
      const derivedStepKey = summary.metadata.currentStepKey || "booked";
      setCurrentStepKey(derivedStepKey);
      setSelectedStepKey(null); // Don't auto-select, only show when user clicks a step
      setTrackingNumber(summary.metadata.consignmentNumber || lookupValue);
      return { shipment: normalizedShipment, summary };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to fetch tracking details.";
      setTrackingError(message);
      setTrackingSummary(null);
      setCurrentStepKey("booked");
      setSelectedStepKey(null);
      throw new Error(message);
    } finally {
      setIsLoadingTracking(false);
    }
  }, [setShipments]);

  const activeStepKey = selectedStepKey ?? currentStepKey;
  const activeStepIndex = stepIndexMap[activeStepKey] ?? 0;
  const currentStepIndex = stepIndexMap[currentStepKey] ?? 0;

  const renderTrackingSummary = (variant: "standalone" | "embedded" = "standalone") => {
    const isEmbedded = variant === "embedded";
    const cardClassName = cn(
      "transition",
      isEmbedded 
        ? "border-0 bg-transparent" 
        : cn(
            "border rounded-2xl",
            isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
          )
    );

    if (isLoadingTracking) {
      return (
        <Card className={cardClassName}>
          <CardContent className="py-10 text-center space-y-3">
            <Loader2 className={cn("h-6 w-6 mx-auto animate-spin", isDarkMode ? "text-blue-300" : "text-blue-600")} />
            <p className={cn("text-sm", isDarkMode ? "text-slate-300" : "text-slate-600")}>
              Fetching live tracking updates...
            </p>
          </CardContent>
        </Card>
      );
    }

    if (trackingError) {
      return (
        <Card className={cardClassName}>
          <CardContent className="py-10 text-center space-y-3">
            <XCircle className={cn("h-8 w-8 mx-auto", isDarkMode ? "text-red-400" : "text-red-500")} />
            <p className={cn("text-sm font-medium", isDarkMode ? "text-red-300" : "text-red-600")}>{trackingError}</p>
            <p className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>
              Please verify the consignment number and try again.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (!trackingSummary) {
      return null;
    }

    const activeDetail = getStepDetails(activeStepKey);
    // Route, Service Type, Package Count - shown in 3 columns
    const topRowItems = [
      {
        label: "Route",
        value: trackingSummary.metadata.routeSummary || "Not available",
      },
      { label: "Service Type", value: trackingSummary.metadata.serviceType || "Not available" },
      {
        label: "Package Count",
        value: trackingSummary.metadata.packageCount
          ? `${trackingSummary.metadata.packageCount}`
          : "Not available",
      },
    ];
    
    // Other metadata items
    const metadataItems = [
      {
        label: "Consignment",
        value: trackingSummary.metadata.consignmentNumber || "N/A",
      },
      {
        label: "Estimated Delivery",
        value: trackingSummary.metadata.estimatedDelivery
          ? formatDateLabel(trackingSummary.metadata.estimatedDelivery, false)
          : "Not available",
      },
      {
        label: "Last Updated",
        value: trackingSummary.metadata.lastUpdated
          ? formatDateLabel(trackingSummary.metadata.lastUpdated, true)
          : "Not available",
      },
    ];

    // Hide specific metadata items based on current step
    const filteredMetadataItems = metadataItems.filter((item) => {
      const label = item.label.toLowerCase();
      // In "booked" state, do not show booking reference or payment method
      if (currentStepKey === "booked" && (label === "booking reference" || label === "payment method")) {
        return false;
      }
      return true;
    });

    const formatFieldValue = (field: TrackingField) => {
      if (!field.value) return "Not available";
      if (field.format === "datetime") {
        return formatDateLabel(field.value, true);
      }
      return field.value;
    };

    // Decide which step fields should be visible per step
    const getVisibleStepFields = (detail: TrackingStepDetail) => {
      return detail.fields.filter((field) => {
        const label = field.label?.toLowerCase?.() ?? "";

        // Booked: hide payment method & booking reference
        if (
          detail.key === "booked" &&
          (label.includes("payment method") || label.includes("booking reference"))
        ) {
          return false;
        }

        // Received at OCL: hide scan status 1
        if (
          detail.key === "received_at_ocl" &&
          (label === "scan status 1" || label.includes("scan status 1"))
        ) {
          return false;
        }

        // In transit: hide movement updates
        if (
          detail.key === "in_transit" &&
          label.includes("movement updates")
        ) {
          return false;
        }

        // Out for delivery: hide agent phone number & payment to collect
        if (
          detail.key === "out_for_delivery" &&
          (label.includes("agent phone") || label.includes("payment to collect"))
        ) {
          return false;
        }

        // Delivered: hide payment collected / amount collected & payment method
        if (
          detail.key === "delivered" &&
          (
            label.includes("payment collected") ||
            label.includes("amount collected") ||
            label.includes("payment method")
          )
        ) {
          return false;
        }

        return true;
      });
    };

    // Use the currently active step (selected step if any, otherwise current step)
    const progressIndex = stepIndexMap[activeStepKey] ?? stepIndexMap[currentStepKey] ?? 0;

    const renderDesktopTimeline = () => {
      const totalSteps = trackerSteps.length;
      const barLeft = `${(0.5 / totalSteps) * 100}%`;
      const barWidth = `${((totalSteps - 1) / totalSteps) * 100}%`;
      const fillWidth = `${(progressIndex / (totalSteps - 1)) * 100}%`;
      const progressColor = isDarkMode ? "#60a5fa" : "#3b82f6";
      const bgColor = isDarkMode ? "#334155" : "#e2e8f0";
      const borderColor = isDarkMode ? "#475569" : "#cbd5e1";
      const activeBorderColor = isDarkMode ? "#60a5fa" : "#3b82f6";
      const iconColor = isDarkMode ? "#60a5fa" : "#3b82f6";
      const inactiveIconColor = isDarkMode ? "#94a3b8" : "#94a3b8";
      const textColor = isDarkMode ? "#f1f5f9" : "#1e293b";
      const mutedTextColor = isDarkMode ? "#64748b" : "#64748b";

      return (
        <div className="relative hidden sm:block" style={{ paddingTop: isEmbedded ? "8px" : "14px", paddingBottom: isEmbedded ? "8px" : "14px" }}>
          <div className="relative flex items-start justify-between" style={{ gap: 32 }}>
            {trackerSteps.map((step, index) => {
              const Icon = step.icon;
              const detail = getStepDetails(step.key);
              const isDone = (detail?.completed ?? false) || index <= progressIndex;
              const isActive = step.key === activeStepKey;
              const canSelect = isDone && Boolean(detail?.timestamp || detail?.description);
              const dateLabel = getStepDateLabel(step.key);

              return (
                <div key={step.key} className="relative flex flex-1 flex-col items-center text-center">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      disabled={!canSelect}
                      onClick={() => {
                        if (!canSelect) return;
                        // Toggle: if clicking the same step, deselect it
                        if (selectedStepKey === step.key) {
                          setSelectedStepKey(null);
                        } else {
                          setSelectedStepKey(step.key);
                        }
                      }}
                      className={cn(
                        "relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-0 focus:ring-offset-0",
                        !canSelect ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                      )}
                      style={{
                        background: isActive
                          ? progressColor
                          : isDarkMode
                            ? "#1e293b"
                            : "#ffffff",
                        borderColor: isActive
                          ? activeBorderColor
                          : isDone
                            ? activeBorderColor
                            : borderColor,
                        color: isActive
                          ? "#0f172a"
                          : isDone
                            ? iconColor
                            : inactiveIconColor,
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                    <div
                      className="mt-0.5 text-[11px] font-medium transition-colors"
                      style={{
                        color: isActive
                          ? progressColor
                          : isDone
                            ? textColor
                            : mutedTextColor,
                        fontWeight: isActive ? 700 : 500,
                      }}
                    >
                      {step.title}
                    </div>
                  </div>

                  <div className={isEmbedded ? "h-6" : "h-12"} />

                  <div className="text-[9px]" style={{ color: mutedTextColor }}>
                    {dateLabel}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute" style={{ left: barLeft, width: barWidth, top: isEmbedded ? 80 : 100 }}>
            <div
              className="h-2 w-full rounded-md"
              style={{
                background: bgColor,
                boxShadow: isDarkMode
                  ? "inset 0 1px 1px rgba(0,0,0,0.3)"
                  : "inset 0 1px 1px rgba(0,0,0,0.06)",
              }}
            />
            <div
              className="h-2 rounded-md transition-all duration-500"
              style={{
                background: progressColor,
                position: "relative",
                top: -8,
                width: fillWidth,
              }}
            />
          </div>

          <div
            className="absolute"
            style={{
              left: barLeft,
              width: barWidth,
              top: isEmbedded ? 83 : 100,
              height: 0,
              pointerEvents: "none",
            }}
          >
            {trackerSteps.map((step, index) => {
              const detail = getStepDetails(step.key);
              const isDone = (detail?.completed ?? false) || index <= progressIndex;
              return (
                <div
                  key={step.key}
                  className="absolute"
                  style={{
                    left: `${(index / (totalSteps - 1)) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: 10,
                  }}
                >
                  <div
                    className="h-3.5 w-3.5 rounded-[3px] border transition-all"
                    style={{
                      background: isDone
                        ? progressColor
                        : isDarkMode
                          ? "#1e293b"
                          : "#ffffff",
                      borderColor: isDone ? progressColor : borderColor,
                    }}
                  >
                    {isDone && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="absolute top-0.5 left-0.5"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const renderMobileTimeline = () => (
      <div
        className={cn(
          "sm:hidden",
          isEmbedded ? "space-y-1.5" : "space-y-2"
        )}
      >
        {trackerSteps.map((step, index) => {
          const Icon = step.icon;
          const detail = getStepDetails(step.key);
          const isDone = (detail?.completed ?? false) || index <= progressIndex;
          const canSelect = isDone && Boolean(detail?.timestamp || detail?.description);
          const isActive = step.key === activeStepKey;
          const dateLabel = getStepDateLabel(step.key);

          return (
            <div
              key={step.key}
                className={cn(
                  "flex items-stretch",
                  isEmbedded ? "gap-2" : "gap-2.5"
                )}
              title={step.title}
            >
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!canSelect}
                  onClick={() => {
                    if (!canSelect) return;
                    // Toggle: if clicking the same step, deselect it
                    if (selectedStepKey === step.key) {
                      setSelectedStepKey(null);
                    } else {
                      setSelectedStepKey(step.key);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 transition focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                    isEmbedded ? "h-7 w-7" : "h-9 w-9",
                    canSelect
                      ? isDarkMode
                        ? "border-blue-500/70 text-blue-200"
                        : "border-blue-500/60 text-blue-600"
                      : isDarkMode
                        ? "border-slate-700 text-slate-500"
                        : "border-slate-200 text-slate-400",
                    !canSelect && "cursor-not-allowed opacity-60",
                    isActive && (isDarkMode ? "bg-blue-500/10" : "bg-blue-50")
                  )}
                >
                  <Icon className={isEmbedded ? "h-3 w-3" : "h-4 w-4"} />
                </button>
                {index < trackerSteps.length - 1 && (
                  <span
                    className={cn(
                      "mt-1 w-px flex-1",
                      isDone
                        ? isDarkMode
                          ? "bg-blue-500/70"
                          : "bg-blue-400"
                        : isDarkMode
                          ? "bg-slate-700"
                          : "bg-slate-200"
                    )}
                  />
                )}
              </div>
              <div
                className={cn(
                  "flex-1",
                  isEmbedded 
                    ? "" 
                    : cn(
                        "rounded-lg border p-2.5",
                        isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
                      )
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(isEmbedded ? "text-xs font-semibold" : "text-sm font-semibold", isDarkMode ? "text-white" : "text-slate-900")}>
                    {step.title}
                  </p>
                  <span className={cn("text-[10px]", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                    {dateLabel}
                  </span>
                </div>
                {!isEmbedded && (
                  <p className={cn("mt-0.5 text-xs", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                    {detail?.description ?? (isDone ? "Awaiting confirmation" : "Pending update")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );

    return (
      <div className={cn(isEmbedded ? "space-y-3" : "space-y-4 sm:space-y-6")}>
        {/* Timeline Section */}
        <div className={cn(
          isEmbedded
            ? "py-2"
            : cn(
                "px-3 py-4 sm:p-6 border rounded-lg",
                isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
              )
        )}>
          {!isEmbedded && (
            <div className="mb-4">
              <div className={cn("text-sm font-semibold mb-1", isDarkMode ? "text-white" : "text-slate-900")}>
                Order Status
              </div>
              <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                {trackingSummary.metadata.statusLabel} • Consignment #{trackingSummary.metadata.consignmentNumber || trackingNumber || "N/A"}
              </div>
            </div>
          )}
          {renderDesktopTimeline()}
          {renderMobileTimeline()}
        </div>

        {/* Combined Step + Shipment Details - Single Box */}
        {(() => {
          const statusColorMap = {
            'booked': {
              light: 'bg-blue-50/80 border-blue-100',
              dark: 'bg-blue-950/30 border-blue-800/40'
            },
            'received_at_ocl': {
              light: 'bg-purple-50/80 border-purple-100',
              dark: 'bg-purple-950/30 border-purple-800/40'
            },
            'in_transit': {
              light: 'bg-amber-50/80 border-amber-100',
              dark: 'bg-amber-950/30 border-amber-800/40'
            },
            'out_for_delivery': {
              light: 'bg-orange-50/80 border-orange-100',
              dark: 'bg-orange-950/30 border-orange-800/40'
            },
            'delivered': {
              light: 'bg-green-50/80 border-green-100',
              dark: 'bg-green-950/30 border-green-800/40'
            }
          };
          const currentStatus = currentStepKey || 'booked';
          const colors = statusColorMap[currentStatus] || statusColorMap['booked'];
          
          return (
            <div
              className={cn(
                isEmbedded
                  ? cn(
                      "p-2.5 border rounded-lg shadow-sm",
                      isDarkMode ? colors.dark : colors.light
                    )
                  : cn(
                      "p-3 sm:p-4 border rounded-lg",
                      isDarkMode ? colors.dark : colors.light
                    )
              )}
            >
          {/* Header with Status, Location, and Date */}
          <div className={cn("flex items-center justify-between mb-2.5 pb-2", "border-b", isDarkMode ? "border-slate-700/50" : "border-slate-200/60")}>
            {/* Left: Icon and Status */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {(() => {
                const ActiveIcon = trackerSteps.find((step) => step.key === activeStepKey)?.icon || ShoppingCart;
                return <ActiveIcon className={cn("h-3.5 w-3.5", isDarkMode ? "text-blue-400" : "text-blue-600")} />;
              })()}
              <span
                className={cn(
                  isEmbedded ? "text-xs font-semibold whitespace-nowrap" : "text-sm font-semibold whitespace-nowrap",
                  isDarkMode ? "text-white" : "text-slate-900"
                )}
              >
                {trackerSteps.find((step) => step.key === activeStepKey)?.title || "Booked"}
              </span>
            </div>
            
            {/* Center: Location */}
            <div className="flex-1 text-center px-2 min-w-0">
              <span className={cn(
                isEmbedded ? "text-xs whitespace-nowrap" : "text-sm whitespace-nowrap",
                isDarkMode ? "text-slate-300" : "text-slate-700"
              )}>
                {trackingSummary.metadata.routeSummary || 
                 (trackingSummary.movementHistory.length > 0 && trackingSummary.movementHistory[0].location) ||
                 "Location not available"}
              </span>
            </div>
            
            {/* Right: Date and Time */}
            <div className="text-right flex-shrink-0">
              <span className={cn(
                isEmbedded ? "text-xs whitespace-nowrap" : "text-sm whitespace-nowrap",
                isDarkMode ? "text-slate-300" : "text-slate-700"
              )}>
                {activeDetail?.timestamp 
                  ? formatDateLabel(activeDetail.timestamp, true)
                  : trackingSummary.metadata.lastUpdated
                    ? formatDateLabel(trackingSummary.metadata.lastUpdated, true)
                    : trackingSummary.metadata.bookingDate
                      ? formatDateLabel(trackingSummary.metadata.bookingDate, true)
                      : "Not available"}
              </span>
            </div>
          </div>

          {/* Step details (optional) */}
          {((isEmbedded && activeDetail) || (!isEmbedded && selectedStepKey && activeDetail)) && activeDetail && (
            <div className={cn(isEmbedded ? "space-y-2 mb-2.5" : "space-y-3 mb-2.5")}>
              {(() => {
                const visibleFields = getVisibleStepFields(activeDetail);
                return visibleFields.length > 0 ? (
                  <div
                    className={cn(
                      "grid",
                      isEmbedded ? "gap-1.5 grid-cols-3" : "gap-2 grid-cols-3"
                    )}
                  >
                    {visibleFields.map((field) => (
                      <div key={`${activeDetail.key}-${field.label}`} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] uppercase tracking-wide whitespace-nowrap",
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          )}
                        >
                          {field.label}:
                        </span>
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            isDarkMode ? "text-white" : "text-slate-900"
                          )}
                        >
                          {formatFieldValue(field)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Shipment summary */}
          {!isEmbedded && (
            <div className="mb-3">
              <div
                className={cn(
                  "text-xs font-medium uppercase tracking-wide text-blue-500 mb-2"
                )}
              >
                Shipment Summary
              </div>
            </div>
          )}
          {/* Route, Service Type, Package Count in 3 columns */}
          <div
            className={cn(
              "grid mb-3",
              isEmbedded ? "gap-1.5 grid-cols-3" : "gap-3 grid-cols-3"
            )}
          >
            {topRowItems.map((item, index) => (
              <div 
                key={item.label} 
                className={cn(
                  "flex items-center gap-2",
                  index === 0 && "justify-start", // Left align for Route
                  index === 1 && "justify-center", // Center align for Service Type
                  index === 2 && "justify-center" // Center align for Package Count
                )}
              >
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wide whitespace-nowrap",
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  {item.label}:
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isDarkMode ? "text-white" : "text-slate-900"
                  )}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          {/* Other metadata items */}
          <div
            className={cn(
              "grid",
              isEmbedded ? "gap-1.5 grid-cols-3" : "gap-3 grid-cols-3"
            )}
          >
            {filteredMetadataItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wide whitespace-nowrap",
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  {item.label}:
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isDarkMode ? "text-white" : "text-slate-900"
                  )}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>

        </div>
          );
        })()}

        {/* Movement History / Event Log */}
        {trackingSummary.movementHistory && trackingSummary.movementHistory.length > 0 && (() => {
          const statusColorMap = {
            'booked': {
              light: 'bg-blue-50/80 border-blue-100',
              dark: 'bg-blue-950/30 border-blue-800/40'
            },
            'received_at_ocl': {
              light: 'bg-purple-50/80 border-purple-100',
              dark: 'bg-purple-950/30 border-purple-800/40'
            },
            'in_transit': {
              light: 'bg-amber-50/80 border-amber-100',
              dark: 'bg-amber-950/30 border-amber-800/40'
            },
            'out_for_delivery': {
              light: 'bg-orange-50/80 border-orange-100',
              dark: 'bg-orange-950/30 border-orange-800/40'
            },
            'delivered': {
              light: 'bg-green-50/80 border-green-100',
              dark: 'bg-green-950/30 border-green-800/40'
            }
          };
          const currentStatus = currentStepKey || 'booked';
          const eventLogColors = statusColorMap[currentStatus] || statusColorMap['booked'];
          
          const getEventIcon = (status: string, label: string) => {
            const normalizedStatus = (status || '').toLowerCase();
            const normalizedLabel = (label || '').toLowerCase();
            
            if (normalizedStatus.includes('booked') || normalizedLabel.includes('booked')) {
              return ShoppingCart;
            }
            if (normalizedStatus.includes('pickup') || normalizedStatus.includes('picked') || normalizedLabel.includes('picked')) {
              return Truck;
            }
            if (normalizedStatus.includes('received') || normalizedLabel.includes('received')) {
              return Home;
            }
            if (normalizedStatus.includes('assigned') || normalizedLabel.includes('assigned')) {
              return ClipboardCheck;
            }
            if (normalizedStatus.includes('transit') || normalizedLabel.includes('transit')) {
              return Truck;
            }
            if (normalizedStatus.includes('reached') || normalizedLabel.includes('reached')) {
              return Home;
            }
            if (normalizedStatus.includes('out_for_delivery') || normalizedLabel.includes('out for delivery')) {
              return Navigation;
            }
            if (normalizedStatus.includes('delivered') || normalizedLabel.includes('delivered')) {
              return CheckCircle;
            }
            return Package;
          };
          
          return (
            <div
              className={cn(
                isEmbedded ? "p-2.5 border rounded-lg" : "p-3 sm:p-4 border rounded-lg",
                isDarkMode ? eventLogColors.dark : eventLogColors.light
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {trackingSummary.movementHistory.map((event, index) => {
                  const EventIcon = getEventIcon(event.status, event.label || '');
                  
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-2.5"
                    >
                      <EventIcon className={cn(
                        "h-3.5 w-3.5 mt-0.5 flex-shrink-0",
                        isDarkMode ? "text-blue-400" : "text-blue-600"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p 
                          className={cn(
                            "leading-tight",
                            isDarkMode ? "text-slate-900" : "text-slate-900"
                          )}
                          style={{ fontSize: '0.75rem', fontWeight: 500 }}
                        >
                          {event.label || event.status}
                        </p>
                        {event.location && (
                          <p className={cn(
                            "text-xs mt-0.5 leading-tight",
                            isDarkMode ? "text-slate-600" : "text-slate-600"
                          )}>
                            {event.location}
                          </p>
                        )}
                        {event.timestamp && (
                          <p className={cn(
                            "text-xs mt-0.5 leading-tight font-medium",
                            isDarkMode ? "text-slate-500" : "text-slate-500"
                          )}>
                            {formatDateLabel(event.timestamp, true)}
                          </p>
                        )}
                        {event.description && (
                          <p className={cn(
                            "text-xs mt-0.5 leading-tight font-medium",
                            isDarkMode ? "text-slate-500" : "text-slate-500"
                          )}>
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div className="space-y-6 px-6 sm:px-12 lg:px-16 xl:px-20">
      {/* Tracking Results - show summary when not viewing inside a card */}
      {showResults && !expandedShipmentId && (
        <div className="space-y-6 mb-4">
          {renderTrackingSummary("standalone")}
        </div>
      )}

      {/* Orders overview */}
      <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10",
                isDarkMode ? "text-slate-500" : "text-slate-400"
              )} />
              <Input
                id="order-search"
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder=""
                className={cn(
                  "pl-9 h-10 sm:h-9 transition-colors",
                  "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                  "focus:border-blue-400 focus-visible:border-blue-400",
                  isDarkMode
                    ? "bg-slate-900/60 border-slate-800 text-white placeholder:text-slate-400 focus:border-blue-500"
                    : "bg-white/90 border-slate-200 focus:border-blue-400"
                )}
              />
              <Label
                htmlFor="order-search"
                className={cn(
                  "absolute left-9 transition-all duration-200 ease-in-out pointer-events-none",
                  isSearchFocused || orderSearchTerm
                    ? cn(
                        "-top-2.5 text-xs px-1",
                        isDarkMode ? "bg-slate-900/60 text-slate-400" : "bg-white text-slate-600"
                      )
                    : "top-1/2 -translate-y-1/2 text-sm",
                  !isSearchFocused && !orderSearchTerm && (
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  )
                )}
              >
                Search by consignment, origin, or destination
              </Label>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className={cn(
                  "w-full sm:w-[220px] h-10 sm:h-9 transition-colors",
                  "focus:ring-0 focus:ring-offset-0 focus:outline-none",
                  "focus:border-blue-400 focus-visible:border-blue-400",
                  isDarkMode
                    ? "bg-slate-900/60 border-slate-800 text-white focus:border-blue-500"
                    : "bg-white/90 border-slate-200 focus:border-blue-400"
                )}
              >
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  isDarkMode
                    ? "bg-slate-900 border-slate-800 text-slate-100"
                    : "bg-white border-slate-200"
                )}
              >
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="received_at_ocl">Received at OCL</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Header Section */}
          <div className={cn(
            "mt-12 rounded-none border-0 shadow-none",
            "border-l border-r border-t",
            isDarkMode
              ? "bg-blue-600 border-slate-800/60"
              : "bg-blue-600 border-slate-200"
          )}>
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="sm:w-1/3">
                <p className="text-xs font-bold tracking-wide text-white">Consignment</p>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
                <p className="text-xs font-bold tracking-wide text-white">Origin & Destination</p>
              </div>
              <div className="flex items-center gap-6 sm:w-1/3 sm:justify-end">
                <p className="text-xs font-bold tracking-wide text-white">Status</p>
                <p className="text-xs font-bold tracking-wide text-white sm:w-16 text-center">Actions</p>
              </div>
            </div>
          </div>

          <div className="space-y-0 -mt-px">

            {loading ? (
              <Card
                className={cn(
                  "p-6 text-center border-dashed",
                  isDarkMode
                    ? "border-slate-800 bg-slate-900/50 text-slate-400"
                    : "border-slate-200 bg-white text-slate-600"
                )}
              >
                Fetching latest shipments...
              </Card>
            ) : filteredShipments.length === 0 ? (
              <Card
                className={cn(
                  "p-6 text-center border-dashed",
                  isDarkMode
                    ? "border-slate-800 bg-slate-900/50 text-slate-400"
                    : "border-slate-200 bg-white text-slate-500"
                )}
              >
                No shipments match your filters.
              </Card>
            ) : (
              paginatedShipments.map((shipment, index) => {
                const trackingValue = shipment.consignmentNumber?.toString() || shipment.bookingReference || shipment._id;
                const normalizedTrackingValue = trackingValue?.toString() || "";
                const originLocation = formatCityState(shipment.originData?.city, shipment.originData?.state);
                const destinationLocation = formatCityState(shipment.destinationData?.city, shipment.destinationData?.state);
                const stepKey = statusToStepMap[shipment.status] || 'booked';
                const stepIndex = stepIndexMap[stepKey] ?? 0;
                const currentStepDef = trackerSteps[stepIndex];
                const isExpanded = expandedShipmentId === shipment._id;
                const summaryConsignment = trackingSummary?.metadata.consignmentNumber || "";
                const summaryBookingRef = trackingSummary?.metadata.bookingReference
                  ? trackingSummary.metadata.bookingReference.toString()
                  : "";
                const summaryMatchesShipment =
                  !!trackingSummary &&
                  (
                    summaryConsignment === normalizedTrackingValue ||
                    (
                      summaryBookingRef &&
                      summaryBookingRef.toLowerCase() === normalizedTrackingValue.toLowerCase()
                    )
                  );
                const isFirst = index === 0;
                const isLast = index === paginatedShipments.length - 1;
                const isEven = index % 2 === 0;

                return (
                  <div key={shipment._id} className="space-y-0">
                    <Card
                      className={cn(
                        "rounded-none border-0 shadow-none transition relative overflow-hidden",
                        "border-l border-r",
                        !isFirst && "border-t-0",
                        !isLast && (isDarkMode ? "border-b border-slate-700/40" : "border-b border-slate-200/60"),
                        isDarkMode
                          ? "border-slate-800/60"
                          : "border-slate-200",
                        isDarkMode
                          ? isEven
                            ? "bg-slate-800/40 hover:bg-slate-800/40"
                            : "bg-slate-900/50 hover:bg-slate-900/50"
                          : isEven
                            ? "bg-slate-100/60 hover:bg-slate-100/60"
                            : "bg-white hover:bg-white",
                        isExpanded && (isDarkMode ? "bg-slate-800/60" : "bg-slate-50/50")
                      )}
                    >
                      {/* Black triangle in top-right corner */}
                      <div 
                        className="absolute top-0 right-0 w-0 h-0 pointer-events-none"
                        style={{
                          borderLeft: '24px solid transparent',
                          borderTop: '24px solid #000000',
                          zIndex: 1
                        }}
                      />
                      <div className="w-full relative z-10">
                        <div className="flex flex-col gap-3 px-4 py-3 pr-8 sm:flex-row sm:items-center sm:justify-between">
                          {/* Left: receiver & basic info */}
                          <div className="sm:w-1/3">
                            <p
                              className={cn(
                                "text-xs uppercase tracking-normal",
                                isDarkMode ? "text-slate-500" : "text-slate-400"
                              )}
                            >
                              {trackingValue}
                            </p>
                            <p
                              className={cn(
                                "text-base font-semibold",
                                isDarkMode ? "text-white" : "text-slate-900"
                              )}
                            >
                              {shipment.destinationData?.name || "Recipient"} •{" "}
                              {formatDateLabel(shipment.bookingDate)}
                            </p>
                          </div>

                          {/* Middle: route, centered horizontally on desktop */}
                          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
                            <p
                              className={cn(
                                "text-xs font-medium",
                                isDarkMode ? "text-slate-300" : "text-slate-600"
                              )}
                            >
                              {originLocation} &rarr; {destinationLocation}
                            </p>
                          </div>

                          {/* Right: status, icon, and actions */}
                          <div className="flex items-center gap-3 sm:w-1/3 sm:justify-end">
                            <div className="text-right">
                              <p
                                className={cn(
                                  "text-xs font-medium mb-1",
                                  isDarkMode ? "text-slate-300" : "text-slate-600"
                                )}
                              >
                                {currentStepDef?.title || shipment.status}
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isDarkMode ? "text-slate-500" : "text-slate-500"
                                )}
                              >
                                {originLocation}
                              </p>
                            </div>
                            {(() => {
                              const Icon = currentStepDef?.icon || Package;
                              return (
                                <Icon
                                  className={cn(
                                    "h-5 w-5 flex-shrink-0",
                                    isDarkMode ? "text-blue-400" : "text-blue-600"
                                  )}
                                />
                              );
                            })()}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShipmentClick(shipment);
                              }}
                              className={cn(
                                "h-8 w-8 flex-shrink-0 rounded-md focus-visible:ring-0 focus-visible:ring-offset-0 shadow-sm",
                                isDarkMode
                                  ? "bg-slate-700/60 hover:bg-slate-700/80 border border-slate-600/40"
                                  : "bg-white hover:bg-slate-50 border border-slate-200/60"
                              )}
                            >
                              {isExpanded ? (
                                <ChevronDown className={cn(
                                  "h-4 w-4",
                                  isDarkMode ? "text-slate-300" : "text-slate-700"
                                )} />
                              ) : (
                                <ChevronRight className={cn(
                                  "h-4 w-4",
                                  isDarkMode ? "text-slate-300" : "text-slate-700"
                                )} />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Expanded Tracking Details */}
                    {isExpanded && summaryMatchesShipment && (
                        <div className="mt-0 mb-8">
                          <div className="pb-6">
                            {renderTrackingSummary("embedded")}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination controls */}
          {filteredShipments.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <p className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                Showing {(currentPageSafe - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPageSafe * ITEMS_PER_PAGE, filteredShipments.length)} of {filteredShipments.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={currentPageSafe === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={cn(
                    "h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0",
                    isDarkMode
                      ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  ‹
                </Button>
                <span className={cn("text-xs font-medium", isDarkMode ? "text-slate-200" : "text-slate-700")}>
                  Page {currentPageSafe} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={currentPageSafe === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={cn(
                    "h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0",
                    isDarkMode
                      ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  ›
                </Button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default CorporateTracking;

