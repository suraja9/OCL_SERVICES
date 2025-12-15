import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Calendar,
  Navigation,
} from "lucide-react";

interface CustomerTrackingProps {
  isDarkMode: boolean;
}

type TrackerStep = {
  key:
    | "booked"
    | "pickup_assigned"
    | "picked_up"
    | "origin_hub"
    | "in_transit"
    | "destination_hub"
    | "out_for_delivery"
    | "delivered";
  title: string;
  icon: React.ComponentType<{ className?: string }>;
};

type OrderTimelineItem = {
  key: TrackerStep["key"];
  status: string;
  location: string;
  timestamp: string | null;
};

type Order = {
  id: string;
  trackingNumber: string;
  customerName: string;
  origin: string;
  destination: string;
  service: string;
  currentStatus: string;
  currentLocation: string;
  orderDate: string;
  timeline: OrderTimelineItem[];
};

type BackendStatus = "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";

type ReachedHubEntry = {
  adminId?: { $oid?: string };
  adminName?: string;
  adminEmail?: string;
  timestamp?: { $date?: string } | string;
  notes?: string;
  _id?: { $oid?: string };
};

type AssignedEntry = {
  coloaderId?: { $oid?: string };
  coloaderName?: string;
  adminId?: { $oid?: string };
  adminName?: string;
  assignedAt?: { $date?: string } | string;
  legNumber?: number;
  totalLegs?: number;
  notes?: string;
  currentAssignment?: string;
  _id?: { $oid?: string };
};

type CourierBoyEntry = {
  courierBoyId?: { $oid?: string };
  courierBoyName?: string;
  courierBoyEmail?: string;
  courierBoyPhone?: string;
  coloaderId?: { $oid?: string };
  coloaderName?: string;
  adminId?: { $oid?: string };
  adminName?: string;
  adminEmail?: string;
  assignedAt?: { $date?: string } | string;
  notes?: string;
  _id?: { $oid?: string };
};

type OutForDeliveryEntry = {
  courierBoyId?: { $oid?: string };
  courierBoyName?: string;
  courierBoyPhone?: string;
  courierBoyEmail?: string;
  assignedAt?: { $date?: string } | string;
  assignedBy?: { $oid?: string };
  assignedByName?: string;
  assignedByEmail?: string;
  consignmentNumber?: number;
  receiverName?: string;
  destination?: any;
  paymentStatus?: string;
  finalPrice?: number;
  paymentType?: string;
  notes?: string;
  _id?: { $oid?: string };
};

type StatusHistoryEntry = {
  status?: string;
  timestamp?: { $date?: string } | string;
  notes?: string;
  _id?: { $oid?: string };
};

type CustomerBookingRecord = {
  _id: string;
  bookingReference?: string;
  consignmentNumber?: number;
  status: BackendStatus;
  currentStatus?: string;
  origin: {
    name?: string;
    city?: string;
    state?: string;
  };
  destination: {
    name?: string;
    city?: string;
    state?: string;
  };
  serviceType?: string;
  shippingMode?: string;
  calculatedPrice?: number | null;
  createdAt: string | { $date?: string };
  updatedAt: string | { $date?: string };
  BookedAt?: { $date?: string } | string;
  assignedCourierBoyAt?: { $date?: string } | string;
  PickedUpAt?: { $date?: string } | string;
  ReceivedAt?: { $date?: string } | string;
  reachedHub?: ReachedHubEntry[];
  assigned?: AssignedEntry[];
  courierboy?: CourierBoyEntry[];
  intransit?: any[];
  OutForDelivery?: OutForDeliveryEntry[];
  delivered?: {
    deliveredAt?: { $date?: string } | string;
    amountCollected?: number;
    paymentMethod?: string;
    timestamp?: { $date?: string } | string;
  };
  statusHistory?: StatusHistoryEntry[];
  completedAt?: { $date?: string } | string;
};

type TrackingTimelineEntry = {
  key: TrackerStep["key"];
  status: string;
  location: string;
  timestamp: string | null;
  completed: boolean;
};

type TrackingData = {
  trackingNumber: string;
  status: string;
  estimatedDelivery: string;
  currentLocation: string;
  usedAt: string;
  timeline: TrackingTimelineEntry[];
};

const CustomerTracking: React.FC<CustomerTrackingProps> = ({ isDarkMode }) => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isTrackingInputFocused, setIsTrackingInputFocused] = useState(false);
  const [selectedOrderSteps, setSelectedOrderSteps] = useState<Record<string, TrackerStep["key"]>>({});
  const { toast } = useToast();

  const API_BASE: string =
    (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000";

  const trackerSteps = useMemo<TrackerStep[]>(
    () => [
      { key: "booked", title: "Booked", icon: ShoppingCart },
      { key: "pickup_assigned", title: "Pickup", icon: ClipboardCheck },
      { key: "picked_up", title: "Picked", icon: Package },
      { key: "origin_hub", title: "Origin Hub", icon: Home },
      { key: "in_transit", title: "Transit", icon: Truck },
      { key: "destination_hub", title: "Dest. Hub", icon: MapPin },
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

  const backendStatusProgressMap: Record<BackendStatus, TrackerStep["key"]> = {
    pending: "booked",
    confirmed: "origin_hub",
    in_transit: "in_transit",
    delivered: "delivered",
    cancelled: "booked",
  };

  // Map currentStatus string to step key
  const getStepKeyFromCurrentStatus = (currentStatus?: string): TrackerStep["key"] => {
    if (!currentStatus) return "booked";
    const statusLower = currentStatus.toLowerCase();
    
    if (statusLower.includes("delivered")) return "delivered";
    if (statusLower.includes("out for delivery") || statusLower.includes("out_for_delivery")) return "out_for_delivery";
    if (statusLower.includes("destination hub") || statusLower.includes("destination_hub")) return "destination_hub";
    if (statusLower.includes("in transit") || statusLower.includes("in_transit") || statusLower.includes("transit")) return "in_transit";
    if (statusLower.includes("origin hub") || statusLower.includes("origin_hub") || statusLower.includes("reached hub") || statusLower.includes("reached-hub")) return "origin_hub";
    if (statusLower.includes("picked up") || statusLower.includes("picked_up") || statusLower.includes("picked")) return "picked_up";
    if (statusLower.includes("pickup") || statusLower.includes("assigned")) return "pickup_assigned";
    if (statusLower.includes("cancelled") || statusLower.includes("cancel")) return "booked";
    
    return "booked";
  };

  const getMaxStepIndexForStatus = (status: BackendStatus, currentStatus?: string) => {
    // Prefer currentStatus if available, otherwise use status
    if (currentStatus) {
      const key = getStepKeyFromCurrentStatus(currentStatus);
      return stepIndexMap[key] ?? 0;
    }
    const key = backendStatusProgressMap[status] ?? "booked";
    return stepIndexMap[key] ?? 0;
  };

  const hasReachedStep = (status: BackendStatus, stepKey: TrackerStep["key"], currentStatus?: string) => {
    return (stepIndexMap[stepKey] ?? 0) <= getMaxStepIndexForStatus(status, currentStatus);
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const getProgressStepKey = (status: BackendStatus, currentStatus?: string): TrackerStep["key"] => {
    if (currentStatus) {
      return getStepKeyFromCurrentStatus(currentStatus);
    }
    return backendStatusProgressMap[status] ?? "booked";
  };

  const formatCityState = (city?: string, state?: string) => {
    if (city && state) return `${city}, ${state}`;
    return city || state || "Not available";
  };

  // Helper to extract date string from MongoDB date format
  const extractDate = (dateValue?: { $date?: string } | string | null): string | null => {
    if (!dateValue) return null;
    if (typeof dateValue === "string") {
      // If it's already a string, validate it's a valid date
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : dateValue;
    }
    if (typeof dateValue === "object" && dateValue !== null) {
      if ("$date" in dateValue && dateValue.$date) {
        return typeof dateValue.$date === "string" ? dateValue.$date : null;
      }
    }
    return null;
  };

  // Helper to get the latest timestamp from an array of entries
  const getLatestTimestamp = (entries: any[] | undefined, field: string = "timestamp"): string | null => {
    if (!entries || entries.length === 0) return null;
    const timestamps = entries
      .map((entry) => extractDate(entry[field] || entry.assignedAt))
      .filter((ts): ts is string => ts !== null)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return timestamps[0] || null;
  };

  const getStepLocation = (
    stepKey: TrackerStep["key"],
    originLocation: string,
    destinationLocation: string
  ) => {
    if (
      stepKey === "booked" ||
      stepKey === "pickup_assigned" ||
      stepKey === "picked_up" ||
      stepKey === "origin_hub"
    ) {
      return originLocation;
    }
    if (stepKey === "in_transit") {
      return "In Transit";
    }
    return destinationLocation;
  };

  const formatServiceType = (serviceType?: string) => {
    if (!serviceType) return "Standard";
    return serviceType
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : ""))
      .join(" ")
      .trim();
  };

  const buildOrderTimeline = (booking: CustomerBookingRecord): OrderTimelineItem[] => {
    const originLocation = formatCityState(booking.origin?.city, booking.origin?.state);
    const destinationLocation = formatCityState(booking.destination?.city, booking.destination?.state);
    const timeline: OrderTimelineItem[] = [];

    // Extract timestamps from actual tracking data
    const bookedAt = extractDate(booking.BookedAt) || extractDate(booking.createdAt);
    const pickupAssignedAt = extractDate(booking.assignedCourierBoyAt);
    const pickedUpAt = extractDate(booking.PickedUpAt);
    const originHubAt = getLatestTimestamp(booking.reachedHub) || extractDate(booking.ReceivedAt);
    const inTransitAt = getLatestTimestamp(booking.intransit) || 
      (booking.assigned && booking.assigned.length > 0 && 
       booking.assigned.some(a => a.currentAssignment === "Completed") 
       ? getLatestTimestamp(booking.assigned, "assignedAt") : null);
    const destinationHubAt = booking.reachedHub && booking.reachedHub.length > 0
      ? getLatestTimestamp(booking.reachedHub)
      : (booking.assigned && booking.assigned.length > 0 && 
         booking.assigned.some(a => a.currentAssignment === "Completed")
         ? getLatestTimestamp(booking.assigned, "assignedAt") : null);
    const outForDeliveryAt = getLatestTimestamp(booking.OutForDelivery, "assignedAt");
    const deliveredAt = extractDate(booking.delivered?.deliveredAt) || 
                       extractDate(booking.delivered?.timestamp);

    // Determine which steps have been completed based on actual data
    const completedSteps: Record<TrackerStep["key"], boolean> = {
      booked: !!bookedAt,
      pickup_assigned: !!pickupAssignedAt,
      picked_up: !!pickedUpAt,
      origin_hub: !!originHubAt,
      in_transit: !!inTransitAt,
      destination_hub: !!destinationHubAt,
      out_for_delivery: !!outForDeliveryAt,
      delivered: !!deliveredAt,
    };

    // Build timeline with actual timestamps
    trackerSteps.forEach((step) => {
      let timestamp: string | null = null;
      
      switch (step.key) {
        case "booked":
          timestamp = bookedAt;
          break;
        case "pickup_assigned":
          timestamp = pickupAssignedAt;
          break;
        case "picked_up":
          timestamp = pickedUpAt;
          break;
        case "origin_hub":
          timestamp = originHubAt;
          break;
        case "in_transit":
          timestamp = inTransitAt;
          break;
        case "destination_hub":
          timestamp = destinationHubAt;
          break;
        case "out_for_delivery":
          timestamp = outForDeliveryAt;
          break;
        case "delivered":
          timestamp = deliveredAt;
          break;
      }

      // Only add steps that have been reached (based on currentStatus or actual data)
      const stepIndex = stepIndexMap[step.key];
      const maxStepIndex = getMaxStepIndexForStatus(booking.status, booking.currentStatus);
      const hasActualData = completedSteps[step.key];
      
      // Include step if it's reached by status OR has actual data
      if (stepIndex <= maxStepIndex || hasActualData) {
        timeline.push({
          key: step.key,
          status: step.title,
          location: getStepLocation(step.key, originLocation, destinationLocation),
          timestamp: timestamp,
        });
      }
    });

    return timeline;
  };

  const getOrderStepDetails = (order: Order, stepKey: TrackerStep["key"]) => {
    return order.timeline.find((item) => item.key === stepKey) ?? null;
  };

  const mapBookingToOrder = (booking: CustomerBookingRecord): Order => {
    const timeline = buildOrderTimeline(booking);
    const trackingValue =
      booking.bookingReference ||
      (typeof booking.consignmentNumber === "number"
        ? booking.consignmentNumber.toString()
        : "") ||
      booking._id;
    const originLocation = formatCityState(booking.origin?.city, booking.origin?.state);
    const destinationLocation = formatCityState(booking.destination?.city, booking.destination?.state);

    const progressKey = getProgressStepKey(booking.status, booking.currentStatus);
    const progressIndex = stepIndexMap[progressKey] ?? 0;
    
    // Use currentStatus if available, otherwise derive from progress
    let normalizedStatus: string;
    if (booking.status === "cancelled") {
      normalizedStatus = "Cancelled";
    } else if (booking.currentStatus) {
      // Capitalize first letter of each word
      normalizedStatus = booking.currentStatus
        .split(/[\s_]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    } else {
      normalizedStatus = trackerSteps[progressIndex]?.title ?? trackerSteps[0].title;
    }

    const createdAt = extractDate(booking.createdAt) || new Date().toISOString();

    return {
      id: booking._id,
      trackingNumber: trackingValue,
      customerName: booking.destination?.name || "Recipient",
      origin: originLocation,
      destination: destinationLocation,
      service: formatServiceType(booking.serviceType),
      currentStatus: normalizedStatus,
      currentLocation:
        booking.status === "cancelled"
          ? originLocation
          : getStepLocation(progressKey, originLocation, destinationLocation),
      orderDate: createdAt,
      timeline,
    };
  };

  const mapBookingToTrackingData = (booking: CustomerBookingRecord): TrackingData => {
    const timeline = buildOrderTimeline(booking);
    const trackingValue =
      booking.bookingReference ||
      (typeof booking.consignmentNumber === "number"
        ? booking.consignmentNumber.toString()
        : "") ||
      booking._id;
    const originLocation = formatCityState(booking.origin?.city, booking.origin?.state);
    const destinationLocation = formatCityState(booking.destination?.city, booking.destination?.state);

    const progressKey = getProgressStepKey(booking.status, booking.currentStatus);
    const progressIndex = stepIndexMap[progressKey] ?? 0;

    const cardTimeline = trackerSteps.map((step) => {
      const timelineEntry = timeline.find((item) => item.key === step.key);

      return {
        key: step.key,
        status: step.title,
        location:
          timelineEntry?.location ?? getStepLocation(step.key, originLocation, destinationLocation),
        timestamp: timelineEntry?.timestamp ?? null,
        completed: Boolean(timelineEntry && timelineEntry.timestamp),
      };
    });

    // Use currentStatus if available, otherwise derive from progress
    let status: string;
    if (booking.status === "cancelled") {
      status = "Cancelled";
    } else if (booking.currentStatus) {
      status = booking.currentStatus
        .split(/[\s_]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    } else {
      status = trackerSteps[progressIndex]?.title ?? trackerSteps[0].title;
    }

    const createdAt = extractDate(booking.createdAt) || new Date().toISOString();
    const updatedAt = extractDate(booking.updatedAt) || createdAt;
    const deliveredAt = extractDate(booking.delivered?.deliveredAt) || extractDate(booking.delivered?.timestamp);

    return {
      trackingNumber: trackingValue,
      status,
      estimatedDelivery:
        deliveredAt
          ? new Date(deliveredAt).toLocaleDateString(undefined, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Not available",
      currentLocation:
        booking.status === "cancelled"
          ? originLocation
          : getStepLocation(progressKey, originLocation, destinationLocation),
      usedAt: createdAt,
      timeline: cardTimeline,
    };
  };

  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    setOrdersError(null);
    try {
      const response = await fetch(`${API_BASE}/api/customer-booking?limit=100`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to fetch customer bookings");
      }

      if (result.success && Array.isArray(result.data)) {
        setOrders(result.data.map((booking: CustomerBookingRecord) => mapBookingToOrder(booking)));
      } else {
        setOrders([]);
        throw new Error(result?.message || "No bookings found");
      }
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setOrdersError(error.message || "Failed to load bookings");
      toast({
        title: "Unable to load orders",
        description: error.message || "Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOrders(false);
    }
  }, [API_BASE, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" ||
        order.currentStatus.toLowerCase().includes(statusFilter.toLowerCase());
      return matchesStatus;
    });
  }, [orders, statusFilter]);

  useEffect(() => {
    if (filteredOrders.length === 0) {
      setActiveOrderId(null);
      return;
    }
    if (!filteredOrders.some((order) => order.id === activeOrderId)) {
      setActiveOrderId(null);
    }
  }, [filteredOrders, activeOrderId]);

  const formatDateLabel = (timestamp: string | null, withTime = false) => {
    if (!timestamp) return "Pending update";
    const date = new Date(timestamp);
    return withTime
      ? `${date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })} • ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
      : date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleOrderToggle = (orderId: string, defaultStepKey: TrackerStep["key"]) => {
    if (activeOrderId === orderId) {
      setActiveOrderId(null);
      setSelectedOrderSteps((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      return;
    }

    setActiveOrderId(orderId);
    setSelectedOrderSteps((prev) => ({
      ...prev,
      [orderId]: defaultStepKey,
    }));
  };

  const getStatusAccentClasses = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("cancel")) {
      return "bg-red-100 text-red-700 border-red-200";
    }
    if (statusLower.includes("delivered") || statusLower.includes("attempted") || statusLower.includes("rto")) {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
    if (statusLower.includes("out for delivery")) {
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    }
    if (statusLower.includes("destination")) {
      return "bg-blue-100 text-blue-700 border-blue-200";
    }
    if (statusLower.includes("transit")) {
      return "bg-sky-100 text-sky-700 border-sky-200";
    }
    if (statusLower.includes("origin") || statusLower.includes("pickup")) {
      return "bg-purple-100 text-purple-700 border-purple-200";
    }
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  // Map API status to step index
  const getStepFromStatus = (status: string): number => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("cancel")) return 0;
    if (statusLower.includes("attempted") || statusLower.includes("rto")) {
      return stepIndexMap["delivered"] ?? trackerSteps.length - 1;
    }

    // Use the same logic as getStepKeyFromCurrentStatus
    const stepKey = getStepKeyFromCurrentStatus(status);
    return stepIndexMap[stepKey] ?? 0;
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
    setIsLoadingTracking(true);
    setTrackingError(null);
    setTrackingData(null);
    setSelectedStepIndex(null);
    setCurrentStep(0);
    setShowResults(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/customer-booking/${trackingNumber.trim()}`);
      const result = await response.json();

      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.message || "No tracking information found.");
      }

      const booking: CustomerBookingRecord = result.data;
      const normalizedTrackingData = mapBookingToTrackingData(booking);
      setTrackingData(normalizedTrackingData);

      // Calculate current step based on the highest completed step in timeline
      let maxCompletedIndex = -1;
      normalizedTrackingData.timeline.forEach((entry, index) => {
        if (entry.completed && entry.timestamp) {
          const stepIndex = stepIndexMap[entry.key] ?? -1;
          if (stepIndex > maxCompletedIndex) {
            maxCompletedIndex = stepIndex;
          }
        }
      });

      // If no completed steps found, use status-based calculation
      const stepIndex = maxCompletedIndex >= 0 
        ? maxCompletedIndex 
        : getStepFromStatus(normalizedTrackingData.status);
      
      setCurrentStep(stepIndex);
      setSelectedStepIndex(stepIndex);
      setShowResults(true);
      
      toast({
        title: "Tracking Information Found",
        description: `Tracking details for ${normalizedTrackingData.trackingNumber}`,
      });
    } catch (error: any) {
      console.error("Tracking error:", error);
      setTrackingError(error.message || "An error occurred while tracking your shipment.");
      toast({
        title: "Unable to fetch tracking",
        description: error.message || "Please check the tracking number and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTracking(false);
      setIsLoadingTracking(false);
    }
  };

  const handleClearTracking = () => {
    setTrackingNumber("");
    setShowResults(false);
    setTrackingData(null);
    setCurrentStep(0);
    setTrackingError(null);
    setSelectedStepIndex(null);
  };

  // Auto-animate steps when results are shown (only if not using API data)
  useEffect(() => {
    if (!showResults || trackingData || isLoadingTracking || trackingError) return;
    if (currentStep >= trackerSteps.length - 1) return;
    const id = setTimeout(() => setCurrentStep((s) => Math.min(s + 1, trackerSteps.length - 1)), 800);
    return () => clearTimeout(id);
  }, [currentStep, showResults, trackingData, trackerSteps.length, isLoadingTracking, trackingError]);

  // Get step details from timeline
  const getStepDetails = (stepIndex: number) => {
    if (!trackingData) return null;

    const step = trackerSteps[stepIndex];
    if (!step) return null;

    // Find matching timeline entry
    const timelineEntry = trackingData.timeline?.find(
      (t) => t.key === step.key && t.timestamp
    );

    if (timelineEntry) {
      return {
        status: timelineEntry.status,
        location: timelineEntry.location,
        timestamp: timelineEntry.timestamp,
        completed: timelineEntry.completed,
      };
    }

    // Fallback for order placed
    if (stepIndex === 0 && trackingData.usedAt) {
      return {
        status: "Booked",
        location: trackingData.timeline?.[0]?.location || "Origin Location",
        timestamp: trackingData.usedAt,
        completed: true,
      };
    }

    return null;
  };

  const getStepDateLabel = (stepKey: TrackerStep["key"], index: number) => {
    const formatDate = (value: Date) =>
      value.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    if (trackingData?.timeline?.length) {
      const timelineEntry = trackingData.timeline.find(
        (t) => t.key === stepKey && t.timestamp
      );
      if (timelineEntry?.timestamp) {
        return formatDate(new Date(timelineEntry.timestamp));
      }
    }

    if (trackingData?.usedAt && index === 0) {
      return formatDate(new Date(trackingData.usedAt));
    }

    const placeholderDate = new Date(Date.now() + index * 24 * 60 * 60 * 1000);
    const formatted = formatDate(placeholderDate);
    return index <= currentStep ? formatted : `Expected ${formatted}`;
  };

  const activeStepIndex = selectedStepIndex ?? currentStep;

  return (
    <div className="space-y-6 bg-transparent w-full min-w-0">
      {/* Header */}
      <div className="space-y-2">
        <h2
          className={cn(
            "text-2xl font-semibold sm:text-3xl",
            isDarkMode ? "text-white" : "text-slate-900"
          )}
        >
          Track Your Package
        </h2>
      </div>

      {/* Tracking Form */}
      <form
        onSubmit={handleTracking}
        className="flex flex-col gap-3 sm:flex-row sm:items-center w-full"
      >
        <div className="relative flex-1 w-full">
          <div className="relative">
            <Search
              className={cn(
                "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 z-10",
                isDarkMode ? "text-slate-500" : "text-slate-400"
              )}
            />
            <input
              id="trackingNumber"
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onFocus={() => setIsTrackingInputFocused(true)}
              onBlur={() => setIsTrackingInputFocused(false)}
              className={cn(
                "w-full h-10 sm:h-9 pl-10 pr-4 rounded-xl transition-all duration-200 ease-in-out text-xs",
                "shadow-[rgba(0,0,0,0.15)_0px_3px_3px_0px] border",
                isDarkMode
                  ? "bg-slate-800/60 text-slate-100 placeholder:text-slate-400 border-slate-700"
                  : "bg-white/90 text-[#4B5563] placeholder:text-[#4B5563] border-gray-300/60",
                "focus:outline-none focus:border-blue-500 focus:border-[1px]",
                "hover:border-blue-400/50"
              )}
              style={{ outline: 'none' }}
              placeholder=""
            />
            <label
              htmlFor="trackingNumber"
              className={cn(
                "absolute transition-all duration-200 ease-in-out pointer-events-none select-none left-12",
                isTrackingInputFocused || trackingNumber
                  ? "top-0 -translate-y-1/2 text-xs px-2"
                  : "top-1/2 -translate-y-1/2 text-xs",
                isTrackingInputFocused || trackingNumber
                  ? isDarkMode
                    ? "bg-slate-900 text-blue-400"
                    : "bg-white text-blue-600"
                  : isDarkMode
                    ? "text-slate-400"
                    : "text-gray-500"
              )}
            >
              Enter tracking number e.g. 871026572
            </label>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className={cn(
                "w-full sm:w-[180px] h-10 sm:h-9 rounded-xl transition-all duration-200 ease-in-out",
                "shadow-[rgba(0,0,0,0.15)_0px_3px_3px_0px] border border-[1px]",
                isDarkMode
                  ? "bg-slate-800/60 border-slate-700 text-white hover:border-blue-400/50"
                  : "bg-white/90 border-gray-300/60 hover:border-blue-400/50",
                "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                "focus:border-blue-500 focus:border-[1px]",
                "data-[state=open]:border-blue-500 data-[state=open]:border-[1px]"
              )}
              style={{ outline: 'none' }}
            >
              <SelectValue placeholder="All statuses" />
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
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="picked">Picked</SelectItem>
              <SelectItem value="origin hub">Origin hub</SelectItem>
              <SelectItem value="transit">Transit</SelectItem>
              <SelectItem value="dest. hub">Dest. hub</SelectItem>
              <SelectItem value="out for delivery">Out for delivery</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="submit"
            size="sm"
            disabled={isTracking}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap h-10 sm:h-9 flex-1 sm:flex-initial"
          >
            {isTracking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Tracking...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Track
              </>
            )}
          </Button>
          {trackingNumber && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClearTracking}
              className={cn(
                "whitespace-nowrap h-10 sm:h-9",
                isDarkMode
                  ? "border-slate-700 hover:bg-slate-800 text-slate-200"
                  : "border-slate-200 hover:bg-slate-50"
              )}
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      {/* Tracking Results */}
      {showResults && (
        <div className="space-y-6">
          {/* Progress Tracker - Using MyShipments design */}
          <Card
            className={cn(
              "border transition rounded-2xl shadow-none",
              isDarkMode
                ? "border-slate-800 bg-slate-900/60"
                : "border-slate-200 bg-white"
            )}
          >
            <CardContent className="p-6">
              <div className="mb-4">
                <div className={cn(
                  "text-sm font-semibold mb-1",
                  isDarkMode ? "text-white" : "text-slate-900"
                )}>
                  Order Status
                </div>
                <div className={cn(
                  "text-xs",
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                )}>
                  Order ID: #{trackingData?.trackingNumber || trackingNumber || "N/A"}
                </div>
              </div>

              {isLoadingTracking && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: isDarkMode ? '#60a5fa' : '#3b82f6' }} />
                  <p className={cn(
                    "text-sm",
                    isDarkMode ? "text-slate-400" : "text-slate-600"
                  )}>
                    Loading tracking information...
                  </p>
                </div>
              )}

              {trackingError && (
                <div className="text-center py-8">
                  <XCircle className={cn(
                    "h-12 w-12 mx-auto mb-3",
                    isDarkMode ? "text-red-400" : "text-red-500"
                  )} />
                  <p className={cn(
                    "text-sm font-medium mb-2",
                    isDarkMode ? "text-red-300" : "text-red-600"
                  )}>
                    {trackingError}
                  </p>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-slate-500" : "text-slate-500"
                  )}>
                    Please check the tracking number and try again.
                  </p>
                </div>
              )}

              {!isLoadingTracking && !trackingError && (
                <>
                  <div
                    className="relative hidden sm:block"
                    style={{ paddingTop: "14px", paddingBottom: "14px" }}
                  >
                    {(() => {
                      const totalSteps = trackerSteps.length;
                      const barLeft = `${(0.5 / totalSteps) * 100}%`;
                      const barWidth = `${((totalSteps - 1) / totalSteps) * 100}%`;
                      const fillWidth = `${(currentStep / (totalSteps - 1)) * 100}%`;
                      const progressColor = isDarkMode ? "#60a5fa" : "#3b82f6";
                      const bgColor = isDarkMode ? "#334155" : "#e2e8f0";
                      const borderColor = isDarkMode ? "#475569" : "#cbd5e1";
                      const activeBorderColor = isDarkMode ? "#60a5fa" : "#3b82f6";
                      const iconColor = isDarkMode ? "#60a5fa" : "#3b82f6";
                      const inactiveIconColor = isDarkMode ? "#94a3b8" : "#94a3b8";
                      const textColor = isDarkMode ? "#f1f5f9" : "#1e293b";
                      const mutedTextColor = isDarkMode ? "#64748b" : "#64748b";

                      return (
                        <>
                          {/* Progress bar */}
                          <div
                            className="absolute"
                            style={{ left: barLeft, width: barWidth, top: 88 }}
                          >
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

                          {/* Ticks */}
                          <div
                            className="absolute"
                            style={{
                              left: barLeft,
                              width: barWidth,
                              top: 92,
                              height: 0,
                              pointerEvents: "none",
                            }}
                          >
                            {trackerSteps.map((step, index) => {
                              const isDone = index <= currentStep;
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

                          {/* Steps */}
                          <div
                            className="relative flex items-start justify-between"
                            style={{ gap: 32 }}
                          >
                            {trackerSteps.map((step, index) => {
                              const Icon = step.icon;
                              const isDone = index <= currentStep;
                              const isActive = activeStepIndex === index;
                              const dateLabel = getStepDateLabel(step.key, index);

                              return (
                                <div
                                  key={step.key}
                                  className="relative flex flex-1 flex-col items-center text-center"
                                >
                                  <div className="flex flex-col items-center">
                                    <button
                                      type="button"
                                      disabled={index > currentStep}
                                      onClick={() => {
                                        if (index > currentStep) return;
                                        setSelectedStepIndex(index);
                                      }}
                                      className={cn(
                                        "relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                                        isDarkMode
                                          ? "focus:ring-blue-500/50"
                                          : "focus:ring-blue-500",
                                        index > currentStep
                                          ? "cursor-not-allowed opacity-60"
                                          : "cursor-pointer"
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
                                      title={`Click to view ${step.title} details`}
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

                                  <div className="h-6" />
                                  <div className="h-0" />
                                  <div className="h-6" />

                                  <div
                                    className="text-[9px]"
                                    style={{ color: mutedTextColor }}
                                  >
                                    {dateLabel}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="space-y-3 sm:hidden">
                    {trackerSteps.map((step, index) => {
                      const Icon = step.icon;
                      const isDone = index <= currentStep;
                      const canSelect = index <= currentStep;
                      const isActive = activeStepIndex === index;
                      const dateLabel = getStepDateLabel(step.key, index);
                      const stepDetails = getStepDetails(index);

                      return (
                        <div
                          key={step.key}
                          className="flex items-stretch gap-3"
                          title={step.title}
                        >
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              disabled={!canSelect}
                              onClick={() => {
                                if (!canSelect) return;
                                setSelectedStepIndex(index);
                              }}
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                                canSelect
                                  ? isDarkMode
                                    ? "border-blue-500/70 text-blue-200 focus-visible:ring-blue-500/40 focus-visible:ring-offset-slate-900"
                                    : "border-blue-500/60 text-blue-600 focus-visible:ring-blue-500/40 focus-visible:ring-offset-white"
                                  : isDarkMode
                                  ? "border-slate-700 text-slate-500"
                                  : "border-slate-200 text-slate-400",
                                !canSelect && "cursor-not-allowed opacity-60",
                                isActive &&
                                  (isDarkMode
                                    ? "bg-blue-500/10"
                                    : "bg-blue-50")
                              )}
                            >
                              <Icon className="h-4 w-4" />
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
                              "flex-1 rounded-2xl border p-3",
                              isDarkMode
                                ? "border-slate-800 bg-slate-900/60"
                                : "border-slate-200 bg-white"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={cn(
                                  "text-sm font-semibold",
                                  isDarkMode ? "text-white" : "text-slate-900"
                                )}
                              >
                                {step.title}
                              </p>
                              <span
                                className={cn(
                                  "text-[10px]",
                                  isDarkMode ? "text-slate-400" : "text-slate-500"
                                )}
                              >
                                {dateLabel}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "mt-1 text-xs",
                                isDarkMode ? "text-slate-300" : "text-slate-600"
                              )}
                            >
                              {stepDetails?.status ??
                                (isDone ? "Awaiting confirmation" : "Pending update")}
                            </p>
                            {stepDetails?.location && (
                              <p
                                className={cn(
                                  "text-xs font-medium",
                                  isDarkMode ? "text-slate-100" : "text-slate-800"
                                )}
                              >
                                {stepDetails.location}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Selected Step Details */}
          {trackingData && selectedStepIndex !== null && (
            <Card
              className={cn(
                "border transition rounded-2xl",
                isDarkMode
                  ? "border-slate-800 bg-slate-900/60"
                  : "border-slate-200 bg-white"
              )}
            >
              <CardHeader>
                <CardTitle
                  className={cn(
                    "flex items-center gap-2 text-lg",
                    isDarkMode ? "text-white" : "text-slate-900"
                  )}
                >
              {(() => {
                const SelectedIcon = trackerSteps[selectedStepIndex].icon;
                return (
                  <SelectedIcon
                    className={cn(
                      "h-5 w-5",
                      isDarkMode ? "text-blue-300" : "text-blue-600"
                    )}
                  />
                );
              })()}
                  {trackerSteps[selectedStepIndex].title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const stepDetails = getStepDetails(selectedStepIndex);
                  const isCompleted = selectedStepIndex <= currentStep;

                  if (!stepDetails) {
                    return (
                      <div
                        className={cn(
                          "p-4 rounded-lg border text-center",
                          isDarkMode
                            ? "bg-slate-800/50 border-slate-700 text-slate-400"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        )}
                      >
                        {isCompleted
                          ? "Details for this step are not available yet."
                          : "This step has not been reached yet."}
                      </div>
                    );
                  }

                  const date = new Date(stepDetails.timestamp);
                  const formattedDate = date.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  const formattedTime = date.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div className="space-y-4">
                      <div
                        className={cn(
                          "p-4 rounded-lg border",
                          isDarkMode
                            ? "bg-slate-800/50 border-slate-700"
                            : "bg-blue-50/50 border-blue-200"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <MapPin
                            className={cn(
                              "h-5 w-5 mt-0.5 flex-shrink-0",
                              isDarkMode ? "text-blue-400" : "text-blue-600"
                            )}
                          />
                          <div className="flex-1">
                            <p
                              className={cn(
                                "text-xs font-semibold mb-1 uppercase tracking-wide",
                                isDarkMode ? "text-slate-400" : "text-slate-600"
                              )}
                            >
                              Location
                            </p>
                            <p
                              className={cn(
                                "text-sm font-medium",
                                isDarkMode ? "text-white" : "text-slate-900"
                              )}
                            >
                              {stepDetails.location}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="flex items-start gap-3">
                          {isCompleted ? (
                            <CheckCircle
                              className={cn(
                                "h-5 w-5 mt-0.5 flex-shrink-0",
                                isDarkMode ? "text-blue-400" : "text-blue-600"
                              )}
                            />
                          ) : (
                            <Clock
                              className={cn(
                                "h-5 w-5 mt-0.5 flex-shrink-0",
                                isDarkMode ? "text-slate-400" : "text-slate-600"
                              )}
                            />
                          )}
                          <div>
                            <p
                              className={cn(
                                "text-xs font-semibold mb-1 uppercase tracking-wide",
                                isDarkMode ? "text-slate-400" : "text-slate-600"
                              )}
                            >
                              Status
                            </p>
                            <p
                              className={cn(
                                "text-sm font-medium",
                                isDarkMode ? "text-white" : "text-slate-900"
                              )}
                            >
                              {stepDetails.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar
                            className={cn(
                              "h-5 w-5 mt-0.5 flex-shrink-0",
                              isDarkMode ? "text-slate-400" : "text-slate-600"
                            )}
                          />
                          <div>
                            <p
                              className={cn(
                                "text-xs font-semibold mb-1 uppercase tracking-wide",
                                isDarkMode ? "text-slate-400" : "text-slate-600"
                              )}
                            >
                              Date
                            </p>
                            <p
                              className={cn(
                                "text-sm font-medium",
                                isDarkMode ? "text-white" : "text-slate-900"
                              )}
                            >
                              {formattedDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Clock
                            className={cn(
                              "h-5 w-5 mt-0.5 flex-shrink-0",
                              isDarkMode ? "text-slate-400" : "text-slate-600"
                            )}
                          />
                          <div>
                            <p
                              className={cn(
                                "text-xs font-semibold mb-1 uppercase tracking-wide",
                                isDarkMode ? "text-slate-400" : "text-slate-600"
                              )}
                            >
                              Time
                            </p>
                            <p
                              className={cn(
                                "text-sm font-medium",
                                isDarkMode ? "text-white" : "text-slate-900"
                              )}
                            >
                              {formattedTime}
                            </p>
                          </div>
                        </div>
                      </div>

                      {!isCompleted && (
                        <p
                          className={cn(
                            "text-xs text-center",
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          )}
                        >
                          This step is pending real-time confirmation.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

        </div>
      )}

      {/* Orders overview */}
      <div className="space-y-5">
        <div className="space-y-4">
          {isLoadingOrders ? (
            <Card
              className={cn(
                "p-6 text-center border-dashed shadow-none",
                isDarkMode
                  ? "border-slate-800 bg-slate-900/50 text-slate-400"
                  : "border-slate-200 bg-white text-slate-600"
              )}
            >
              Fetching latest bookings...
            </Card>
          ) : ordersError ? (
            <Card
              className={cn(
                "p-6 text-center border border-red-200 shadow-none",
                isDarkMode
                  ? "border-red-500/40 bg-red-500/10 text-red-200"
                  : "border-red-200 bg-red-50 text-red-600"
              )}
            >
              <p className="text-sm font-medium mb-2">{ordersError}</p>
              <Button size="sm" variant="outline" onClick={fetchOrders}>
                Retry
              </Button>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card
              className={cn(
                "p-6 text-center border-dashed shadow-none",
                isDarkMode
                  ? "border-slate-800 bg-slate-900/50 text-slate-400"
                  : "border-slate-200 bg-white text-slate-500"
              )}
            >
              No orders match your filters.
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const orderStep = Math.min(
                getStepFromStatus(order.currentStatus),
                trackerSteps.length - 1
              );
              const currentStepDef = trackerSteps[orderStep];
              const currentMilestone = order.timeline.find(
                (item) => item.key === currentStepDef.key
              );
              const isActive = activeOrderId === order.id;
              const selectedOrderStepKey =
                selectedOrderSteps[order.id] ?? currentStepDef.key;
              const selectedOrderStepDef =
                trackerSteps.find((step) => step.key === selectedOrderStepKey) ??
                currentStepDef;
              const selectedOrderStepDetails = getOrderStepDetails(
                order,
                selectedOrderStepKey
              );
              const orderOriginLocation =
                order.timeline[0]?.location || order.destination;
              const orderDestinationLocation = order.destination;
              const fallbackSelectedLocation = getStepLocation(
                selectedOrderStepKey,
                orderOriginLocation,
                orderDestinationLocation
              );

              return (
                <Card
                  key={order.id}
                  className={cn(
                    "border shadow-[rgba(0,0,0,0.15)_0px_3px_3px_0px] rounded-none",
                    isDarkMode
                      ? "border-slate-800/60 bg-slate-900/50"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleOrderToggle(order.id, currentStepDef.key)
                    }
                    className="w-full text-left"
                  >
                    <div className={cn(
                      "flex flex-col gap-1.5 p-2.5 sm:flex-row sm:items-center sm:justify-between",
                      isActive && (isDarkMode ? "bg-blue-500/20" : "bg-blue-50")
                    )}>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isActive 
                              ? (isDarkMode ? "text-white" : "text-slate-900")
                              : (isDarkMode ? "text-white" : "text-slate-900")
                          )}
                        >
                          {order.customerName}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            isActive
                              ? (isDarkMode ? "text-slate-200" : "text-slate-700")
                              : (isDarkMode ? "text-slate-400" : "text-slate-600")
                          )}
                        >
                          {order.destination} • {order.service}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <p
                          className={cn(
                            "text-xs uppercase tracking-[0.3em]",
                            isActive
                              ? (isDarkMode ? "text-slate-300" : "text-slate-600")
                              : (isDarkMode ? "text-slate-500" : "text-slate-400")
                          )}
                        >
                          {order.trackingNumber}
                        </p>
                        <div
                          className={cn(
                            "inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs",
                            isActive
                              ? (isDarkMode ? "bg-slate-800/80 text-slate-100" : "bg-white text-slate-700")
                              : (isDarkMode ? "bg-slate-900/60 text-slate-200" : "bg-slate-100 text-slate-600")
                          )}
                        >
                        <span className="font-medium text-center">
                          {order.origin}
                        </span>
                        <span
                          className={cn(
                            "text-base font-semibold",
                            isActive
                              ? (isDarkMode ? "text-blue-200" : "text-blue-700")
                              : (isDarkMode ? "text-blue-300" : "text-blue-600")
                          )}
                        >
                          →
                        </span>
                        <span className="font-medium text-center">
                          {order.destination}
                        </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-1 sm:items-end">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            getStatusAccentClasses(order.currentStatus)
                          )}
                        >
                          {order.currentStatus}
                        </span>
                        <p
                          className={cn(
                            "text-xs",
                            isActive
                              ? (isDarkMode ? "text-slate-300" : "text-slate-600")
                              : (isDarkMode ? "text-slate-500" : "text-slate-500")
                          )}
                        >
                          Updated {formatDateLabel(currentMilestone?.timestamp, true)}
                        </p>
                      </div>
                    </div>
                  </button>
                  {isActive && (
                    <div className="border-t border-dashed px-4 py-4 space-y-4">
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {trackerSteps.map((step, index) => {
                          const StepIcon = step.icon;
                          const isDone = index <= orderStep;
                          const isSelected = selectedOrderStepKey === step.key;
                          return (
                            <React.Fragment key={step.key}>
                              <div className="flex flex-col items-center gap-1 min-w-[80px] text-center">
                                <button
                                  type="button"
                                  aria-label={`View ${step.title} details`}
                                  aria-pressed={isSelected}
                                  disabled={index > orderStep}
                                  onClick={(event) => {
                                    if (index > orderStep) return;
                                    event.stopPropagation();
                                    setSelectedOrderSteps((prev) => ({
                                      ...prev,
                                      [order.id]: step.key,
                                    }));
                                  }}
                                  className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full border text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                                    isDone
                                      ? isDarkMode
                                        ? "border-blue-500 bg-blue-500/20 text-blue-100"
                                        : "border-blue-500 bg-blue-50 text-blue-700"
                                      : isDarkMode
                                      ? "border-slate-700 text-slate-500"
                                      : "border-slate-200 text-slate-500",
                                    isSelected &&
                                      (isDarkMode
                                        ? "ring-blue-400/40 ring-offset-slate-900 border-blue-400"
                                        : "ring-blue-500/40 ring-offset-white border-blue-500"),
                                    index > orderStep
                                      ? "cursor-not-allowed opacity-60"
                                      : "cursor-pointer"
                                  )}
                                >
                                  {isDone ? (
                                    <StepIcon className="h-4 w-4" />
                                  ) : (
                                    index + 1
                                  )}
                                </button>
                                <span
                                  className={cn(
                                    "text-[10px] font-medium leading-tight",
                                    isSelected
                                      ? isDarkMode
                                        ? "text-white"
                                        : "text-slate-900"
                                      : isDarkMode
                                      ? "text-slate-400"
                                      : "text-slate-500"
                                  )}
                                >
                                  {step.title}
                                </span>
                              </div>
                              {index < trackerSteps.length - 1 && (
                                <div
                                  className={cn(
                                    "h-0.5 flex-1",
                                    isDone
                                      ? isDarkMode
                                        ? "bg-blue-500/60"
                                        : "bg-blue-400/80"
                                      : isDarkMode
                                      ? "bg-slate-700"
                                      : "bg-slate-200"
                                  )}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <div
                        className={cn(
                          "rounded-2xl border px-4 py-3",
                          isDarkMode
                            ? "border-slate-800 bg-slate-900/80"
                            : "border-slate-200 bg-slate-50"
                        )}
                      >
                        <div>
                          <p
                            className={cn(
                              "text-[0.65rem] uppercase tracking-wide",
                              isDarkMode ? "text-slate-500" : "text-slate-500"
                            )}
                          >
                            Status
                          </p>
                          <p
                            className={cn(
                              "text-sm font-medium",
                              isDarkMode ? "text-slate-100" : "text-slate-800"
                            )}
                          >
                            {selectedOrderStepDetails?.status ??
                              "Awaiting next update"}
                          </p>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                          <div>
                            <p
                              className={cn(
                                "uppercase tracking-wide text-[0.65rem]",
                                isDarkMode ? "text-slate-500" : "text-slate-500"
                              )}
                            >
                              Location
                            </p>
                            <p
                              className={cn(
                                "font-medium",
                                isDarkMode ? "text-slate-100" : "text-slate-800"
                              )}
                            >
                              {selectedOrderStepDetails?.location ??
                                fallbackSelectedLocation}
                            </p>
                          </div>
                          <div>
                            <p
                              className={cn(
                                "uppercase tracking-wide text-[0.65rem]",
                                isDarkMode ? "text-slate-500" : "text-slate-500"
                              )}
                            >
                              Last update
                            </p>
                            <p
                              className={cn(
                                "font-medium",
                                isDarkMode ? "text-slate-100" : "text-slate-800"
                              )}
                            >
                              {formatDateLabel(
                                selectedOrderStepDetails?.timestamp ?? null,
                                true
                              )}
                            </p>
                          </div>
                        </div>
                        {!selectedOrderStepDetails && (
                          <p
                            className={cn(
                              "mt-3 text-xs",
                              isDarkMode ? "text-slate-400" : "text-slate-600"
                            )}
                          >
                            We haven&apos;t recorded an update for this step yet.
                            Hang tight—we&apos;ll notify you as soon as we do.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default CustomerTracking;

