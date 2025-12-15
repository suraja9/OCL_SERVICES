import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  RefreshCw,
  MapPin,
  User,
  Weight,
  Calendar,
  UserPlus,
  Phone,
  Mail,
  Truck,
  Edit,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface AddressFormData {
  _id: string;
  consignmentNumber?: number;
  originData?: {
    name: string;
    city: string;
    state: string;
    pincode: string;
    flatBuilding?: string;
    locality?: string;
    landmark?: string;
    area?: string;
    district?: string;
  };
  destinationData?: {
    name: string;
    city: string;
    state: string;
    pincode: string;
    flatBuilding?: string;
    locality?: string;
    landmark?: string;
    area?: string;
    district?: string;
  };
  shipmentData?: {
    actualWeight: number;
    totalPackages: string;
    natureOfConsignment: string;
  };
  uploadData?: {
    totalPackages: number;
  };
  senderName?: string;
  senderCity?: string;
  senderState?: string;
  senderPincode?: string;
  senderAddressLine1?: string;
  senderAddressLine2?: string;
  senderLandmark?: string;
  senderArea?: string;
  senderDistrict?: string;
  receiverName?: string;
  receiverCity?: string;
  receiverState?: string;
  receiverPincode?: string;
  receiverAddressLine1?: string;
  receiverAddressLine2?: string;
  receiverLandmark?: string;
  receiverArea?: string;
  receiverDistrict?: string;
  formCompleted: boolean;
  createdAt: string;
  // Tracking data from tracking collection
  trackingData?: {
    currentStatus: 'booked' | 'picked' | 'received' | 'assigned' | 'in_transit' | 'intransit' | 'reached-hub' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'courierboy';
    assigned: Array<{
      coloaderId: string;
      coloaderName: string;
      adminId: string;
      adminName: string;
      assignedAt: string;
      legNumber: number;
      totalLegs: number;
      notes: string;
      currentAssignment?: typeof ASSIGNMENT_STATES[keyof typeof ASSIGNMENT_STATES] | string;
    }>;
    statusHistory: Array<{
      status: string;
      timestamp: string;
      notes: string;
    }>;
  };
  // Legacy assignment data (deprecated - use trackingData instead)
  assignmentData?: {
    assignedColoader?: string;
    assignedColoaderName?: string;
    assignedAt?: string;
    totalLegs?: number;
    legAssignments?: Array<{
      legNumber: number;
      coloaderId: string;
      coloaderName: string;
      assignedAt: string;
      assignedBy: string;
    }>;
    status?: 'booked' | 'assigned' | 'partially_assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'completed';
    completedAt?: string;
  };
}

interface Coloader {
  _id: string;
  companyName: string;
  concernPerson: string;
  email: string;
  mobileNumbers: string[];
  fromLocations: Array<{
    state: string;
    city: string;
    pincode: string;
    area?: string;
  }>;
  toLocations: Array<{
    state: string;
    city: string;
    pincode: string;
    area?: string;
  }>;
  companyAddress?: {
    city?: string;
    state?: string;
    pincode?: string;
    area?: string;
  };
  isActive: boolean;
}

type RouteKey = string;

const ASSIGNMENT_STATES = {
  ASSIGNED_PATH: 'AssignedPath',
  COMPLETED: 'Completed'
} as const;

interface AddressFormResponse {
  success: boolean;
  data: {
    addressForms: AddressFormData[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

const AssignColoader = () => {
  const [addressForms, setAddressForms] = useState<AddressFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AddressFormData | null>(null);
  const [matchingColoaders, setMatchingColoaders] = useState<Coloader[]>([]);
  const [loadingColoaders, setLoadingColoaders] = useState(false);
  const [numberOfLegs, setNumberOfLegs] = useState(1);
  const [currentLeg, setCurrentLeg] = useState(1);
  const [assignedColoaders, setAssignedColoaders] = useState<Coloader[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingAssignments, setExistingAssignments] = useState<Array<{
    legNumber: number;
    coloaderId: string;
    coloaderName: string;
    assignedAt?: string;
    assignedBy?: string;
  }>>([]);
  const [customFromLocation, setCustomFromLocation] = useState('');
  const [customToLocation, setCustomToLocation] = useState('');
  // Path-level assignment state
  const [selectedRouteKey, setSelectedRouteKey] = useState<RouteKey | null>(null);
  const [selectedRouteOrders, setSelectedRouteOrders] = useState<AddressFormData[]>([]);

  // Tab state for manage orders
  const [activeTab, setActiveTab] = useState<'normal' | 'assigned' | 'completed'>('normal');

  // State for expanded paths in assigned tab
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  // Group assigned orders by path (excluding completed ones)
  const getAssignedPaths = () => {
    const assignedOrders = addressForms.filter(order =>
      order.trackingData?.assigned?.some(assignment =>
        (assignment.currentAssignment || ASSIGNMENT_STATES.ASSIGNED_PATH) === ASSIGNMENT_STATES.ASSIGNED_PATH
      )
    );

    const pathGroups: Record<string, {
      groupKey: string;
      route: string;
      orders: AddressFormData[];
      assignedDate: string;
      coloaderName: string;
      totalWeight: number;
      totalPackages: number;
    }> = {};

    assignedOrders.forEach(order => {
      const route = makeRouteKey(order);
      const firstAssignment = order.trackingData?.assigned[0];
      const assignedDate = firstAssignment?.assignedAt || order.createdAt;
      const dateKey = new Date(assignedDate).toLocaleDateString('en-IN');
      const groupKey = `${route}|${dateKey}`;
      const coloaderName = firstAssignment?.coloaderName || 'Unknown';

      if (!pathGroups[groupKey]) {
        pathGroups[groupKey] = {
          groupKey,
          route,
          orders: [],
          assignedDate,
          coloaderName,
          totalWeight: 0,
          totalPackages: 0
        };
      }

      pathGroups[groupKey].orders.push(order);
      pathGroups[groupKey].totalWeight += order.shipmentData?.actualWeight || 0;

      // Handle totalPackages from both shipmentData (string) and uploadData (number)
      let packageCount = 0;
      if (order.uploadData?.totalPackages) {
        packageCount = order.uploadData.totalPackages;
      } else if (order.shipmentData?.totalPackages) {
        packageCount = parseInt(order.shipmentData.totalPackages, 10) || 0;
      }
      pathGroups[groupKey].totalPackages += packageCount;
    });

    return Object.values(pathGroups).sort((a, b) =>
      new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime()
    );
  };

  // Group completed assigned orders by path
  const getCompletedPaths = () => {
    const completedOrders = addressForms.filter(order =>
      order.trackingData?.assigned?.some(assignment => assignment.currentAssignment === ASSIGNMENT_STATES.COMPLETED)
    );

    const pathGroups: Record<string, {
      groupKey: string;
      route: string;
      orders: AddressFormData[];
      assignedDate: string;
      coloaderName: string;
      totalWeight: number;
      totalPackages: number;
      completedDate: string;
    }> = {};

    completedOrders.forEach(order => {
      const route = makeRouteKey(order);
      const firstAssignment = order.trackingData?.assigned[0];
      const assignedDate = firstAssignment?.assignedAt || order.createdAt;
      const coloaderName = firstAssignment?.coloaderName || 'Unknown';
      const completedHistoryDate = order.trackingData?.statusHistory
        ?.filter(h => h.status === 'assigned_completed' || h.status === 'delivered')
        .pop()?.timestamp;
      const completedDate = completedHistoryDate || firstAssignment?.assignedAt || order.createdAt;

      // For completed paths, we might also want to group by completion date or assignment date
      // Keeping it simple for now, but adding groupKey for consistency
      const dateKey = new Date(completedDate).toLocaleDateString('en-IN');
      const groupKey = `${route}|${dateKey}`;

      if (!pathGroups[groupKey]) {
        pathGroups[groupKey] = {
          groupKey,
          route,
          orders: [],
          assignedDate,
          coloaderName,
          totalWeight: 0,
          totalPackages: 0,
          completedDate
        };
      }

      pathGroups[groupKey].orders.push(order);
      pathGroups[groupKey].totalWeight += order.shipmentData?.actualWeight || 0;

      // Handle totalPackages from both shipmentData (string) and uploadData (number)
      let packageCount = 0;
      if (order.uploadData?.totalPackages) {
        packageCount = order.uploadData.totalPackages;
      } else if (order.shipmentData?.totalPackages) {
        packageCount = parseInt(order.shipmentData.totalPackages, 10) || 0;
      }
      pathGroups[groupKey].totalPackages += packageCount;
    });

    return Object.values(pathGroups).sort((a, b) =>
      new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
    );
  };

  // Toggle path expansion
  const togglePathExpansion = (groupKey: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedPaths(newExpanded);
  };

  // Fetch address forms data
  const fetchAddressForms = async (page = 1, useLargeLimit = false, tabOverride?: typeof activeTab) => {
    try {
      console.log('Fetching address forms for page:', page);
      setLoading(true);
      setError('');

      const token = localStorage.getItem('adminToken');
      console.log('Using token:', token ? 'Token exists' : 'No token found');

      const tabToUse = tabOverride || activeTab;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: useLargeLimit ? '1000' : '10' // Use large limit for small datasets
      });

      // Apply filters based on the active tab
      if (tabToUse === 'normal') {
        params.append('currentStatus', 'received');
      } else if (tabToUse === 'assigned') {
        params.append('assignmentState', ASSIGNMENT_STATES.ASSIGNED_PATH);
      } else if (tabToUse === 'completed') {
        params.append('assignmentState', ASSIGNMENT_STATES.COMPLETED);
      }

      // Add search filter
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const url = `/api/admin/addressforms?${params}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      const addressFormsData = result.data || [];
      const totalCount = result.pagination?.totalCount || 0;

      setAddressForms(addressFormsData);
      setCurrentPage(result.pagination?.currentPage || 1);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalCount(totalCount);
      setHasNext(result.pagination?.hasNext || false);
      setHasPrev(result.pagination?.hasPrev || false);
      setError('');

      // If total count is small (≤20), refetch with large limit to get all data
      if (totalCount <= 20 && !useLargeLimit) {
        console.log('Small dataset detected, refetching with large limit');
        await fetchAddressForms(1, true, tabToUse);
        return;
      }

    } catch (err) {
      console.error('Error fetching address forms:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load address forms';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchAddressForms(1, false, activeTab); // Let the function decide whether to use large limit
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get sender name
  const getSenderName = (form: AddressFormData) => {
    return form.originData?.name || form.senderName || 'N/A';
  };

  // Get receiver name
  const getReceiverName = (form: AddressFormData) => {
    return form.destinationData?.name || form.receiverName || 'N/A';
  };

  // Get from location
  const getFromLocation = (form: AddressFormData) => {
    // Check if we have nested originData (full booking flow)
    if (form.originData) {
      const address = form.originData.flatBuilding || '';
      const locality = form.originData.locality || '';
      const landmark = form.originData.landmark || '';
      const area = form.originData.area || '';
      const city = form.originData.city || '';
      const state = form.originData.state || '';
      const pincode = form.originData.pincode || '';

      const addressParts = [address, locality, landmark, area].filter(Boolean);
      const locationParts = [city, state, pincode].filter(Boolean);

      const addressLine = addressParts.join(', ');
      const locationLine = locationParts.join(', ');
      const fullAddress = [addressLine, locationLine].filter(Boolean).join(', ');

      // If full address is too long (more than 50 chars), split into two lines
      if (fullAddress.length > 50) {
        return addressLine && locationLine ? `${addressLine}\n${locationLine}` : addressLine || locationLine;
      }

      return fullAddress;
    }

    // Fallback to flat fields (normal address form)
    const address1 = form.senderAddressLine1 || '';
    const address2 = form.senderAddressLine2 || '';
    const landmark = form.senderLandmark || '';
    const area = form.senderArea || '';
    const city = form.senderCity || 'N/A';
    const state = form.senderState || '';
    const pincode = form.senderPincode || '';

    const addressParts = [address1, address2, landmark, area].filter(Boolean);
    const locationParts = [city, state, pincode].filter(Boolean);

    const addressLine = addressParts.join(', ');
    const locationLine = locationParts.join(', ');
    const fullAddress = [addressLine, locationLine].filter(Boolean).join(', ');

    // If full address is too long (more than 50 chars), split into two lines
    if (fullAddress.length > 50) {
      return addressLine && locationLine ? `${addressLine}\n${locationLine}` : addressLine || locationLine;
    }

    return fullAddress;
  };

  // Get to location
  const getToLocation = (form: AddressFormData) => {
    // Check if we have nested destinationData (full booking flow)
    if (form.destinationData) {
      const address = form.destinationData.flatBuilding || '';
      const locality = form.destinationData.locality || '';
      const landmark = form.destinationData.landmark || '';
      const area = form.destinationData.area || '';
      const city = form.destinationData.city || '';
      const state = form.destinationData.state || '';
      const pincode = form.destinationData.pincode || '';

      const addressParts = [address, locality, landmark, area].filter(Boolean);
      const locationParts = [city, state, pincode].filter(Boolean);

      const addressLine = addressParts.join(', ');
      const locationLine = locationParts.join(', ');
      const fullAddress = [addressLine, locationLine].filter(Boolean).join(', ');

      // If full address is too long (more than 50 chars), split into two lines
      if (fullAddress.length > 50) {
        return addressLine && locationLine ? `${addressLine}\n${locationLine}` : addressLine || locationLine;
      }

      return fullAddress;
    }

    // Fallback to flat fields (normal address form)
    const address1 = form.receiverAddressLine1 || '';
    const address2 = form.receiverAddressLine2 || '';
    const landmark = form.receiverLandmark || '';
    const area = form.receiverArea || '';
    const city = form.receiverCity || 'N/A';
    const state = form.receiverState || '';
    const pincode = form.receiverPincode || '';

    const addressParts = [address1, address2, landmark, area].filter(Boolean);
    const locationParts = [city, state, pincode].filter(Boolean);

    const addressLine = addressParts.join(', ');
    const locationLine = locationParts.join(', ');
    const fullAddress = [addressLine, locationLine].filter(Boolean).join(', ');

    // If full address is too long (more than 50 chars), split into two lines
    if (fullAddress.length > 50) {
      return addressLine && locationLine ? `${addressLine}\n${locationLine}` : addressLine || locationLine;
    }

    return fullAddress;
  };

  // Build compact route labels using City, State only
  const getLocationLabel = (form: AddressFormData, isOrigin: boolean) => {
    if (isOrigin) {
      const city = form.originData?.city || form.senderCity || 'N/A';
      const state = form.originData?.state || form.senderState || 'N/A';
      return `${city}, ${state}`;
    }
    const city = form.destinationData?.city || form.receiverCity || 'N/A';
    const state = form.destinationData?.state || form.receiverState || 'N/A';
    return `${city}, ${state}`;
  };

  const makeRouteKey = (form: AddressFormData): RouteKey => {
    return `${getLocationLabel(form, true)} → ${getLocationLabel(form, false)}`;
  };

  // Helper function to create route segments for multi-leg assignments
  const createRouteSegments = (order: AddressFormData, legAssignments: any[]) => {
    if (!legAssignments || legAssignments.length <= 1) return [];

    const segments = [];
    const sortedLegs = legAssignments.sort((a, b) => a.legNumber - b.legNumber);

    for (let i = 0; i < sortedLegs.length; i++) {
      const currentLeg = sortedLegs[i];
      const nextLeg = sortedLegs[i + 1];

      let fromLocation, toLocation;

      if (i === 0) {
        // First leg: from origin to intermediate point
        fromLocation = getLocationLabel(order, true);
        toLocation = nextLeg ? `${currentLeg.coloaderName} Hub` : getLocationLabel(order, false);
      } else if (i === sortedLegs.length - 1) {
        // Last leg: from previous hub to destination
        fromLocation = `${sortedLegs[i - 1].coloaderName} Hub`;
        toLocation = getLocationLabel(order, false);
      } else {
        // Intermediate legs: from previous hub to next hub
        fromLocation = `${sortedLegs[i - 1].coloaderName} Hub`;
        toLocation = `${currentLeg.coloaderName} Hub`;
      }

      segments.push({
        legNumber: currentLeg.legNumber,
        fromLocation,
        toLocation,
        coloaderName: currentLeg.coloaderName,
        assignedAt: currentLeg.assignedAt
      });
    }

    return segments;
  };

  // Group orders by route (path)
  const ordersByRoute = useMemo(() => {
    const groups: Record<RouteKey, AddressFormData[]> = {};
    for (const order of addressForms) {
      const key = makeRouteKey(order);
      if (!groups[key]) groups[key] = [];
      groups[key].push(order);
    }
    return groups;
  }, [addressForms]);

  const routeKeys = useMemo(() => Object.keys(ordersByRoute), [ordersByRoute]);

  const totalWeightForRoute = (key: RouteKey) => {
    return (ordersByRoute[key] || []).reduce((sum, o) => sum + (o.shipmentData?.actualWeight || 0), 0);
  };

  // Get weight
  const getWeight = (form: AddressFormData) => {
    return form.shipmentData?.actualWeight ? `${form.shipmentData.actualWeight} kg` : 'N/A';
  };

  // Search coloaders with custom locations
  const searchColoadersWithCustomLocations = async () => {
    if (!customFromLocation.trim() && !customToLocation.trim()) {
      return; // Don't show error for auto-search, just return silently
    }

    setLoadingColoaders(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/coloaders?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const allColoaders = result.data || [];

        // Filter coloaders based on custom locations
        const matchingColoaders = allColoaders.filter((coloader: Coloader) => {
          // Check if coloader is active
          if (!coloader.isActive) {
            return false;
          }

          const fromLocation = customFromLocation.trim();
          const toLocation = customToLocation.trim();

          // Debug pincode values
          if (fromLocation || toLocation) {
            console.log('Search pincodes:', { fromLocation, toLocation });
          }


          // Check if coloader serves the from location
          const servesFrom = !fromLocation || coloader.fromLocations?.some(location => {
            // For 6-digit pincode search, do exact pincode match (handle both string and number)
            if (fromLocation.length === 6 && /^\d{6}$/.test(fromLocation)) {
              const locationPincode = String(location.pincode || '');
              const match = locationPincode === fromLocation;
              return match;
            }

            // For other searches, match city/state/area
            const cityMatch = location.city?.toLowerCase().includes(fromLocation.toLowerCase()) ||
              fromLocation.toLowerCase().includes(location.city?.toLowerCase() || '');
            const stateMatch = location.state?.toLowerCase().includes(fromLocation.toLowerCase()) ||
              fromLocation.toLowerCase().includes(location.state?.toLowerCase() || '');
            const areaMatch = location.area?.toLowerCase().includes(fromLocation.toLowerCase()) ||
              fromLocation.toLowerCase().includes(location.area?.toLowerCase() || '');
            const pincodeMatch = String(location.pincode || '') === fromLocation;

            return cityMatch || stateMatch || areaMatch || pincodeMatch;
          }) || false;

          // Check if coloader serves the to location
          const servesTo = !toLocation || coloader.toLocations?.some(location => {
            // For 6-digit pincode search, do exact pincode match (handle both string and number)
            if (toLocation.length === 6 && /^\d{6}$/.test(toLocation)) {
              const locationPincode = String(location.pincode || '');
              const match = locationPincode === toLocation;
              return match;
            }

            // For other searches, match city/state/area
            const cityMatch = location.city?.toLowerCase().includes(toLocation.toLowerCase()) ||
              toLocation.toLowerCase().includes(location.city?.toLowerCase() || '');
            const stateMatch = location.state?.toLowerCase().includes(toLocation.toLowerCase()) ||
              toLocation.toLowerCase().includes(location.state?.toLowerCase() || '');
            const areaMatch = location.area?.toLowerCase().includes(toLocation.toLowerCase()) ||
              toLocation.toLowerCase().includes(location.area?.toLowerCase() || '');
            const pincodeMatch = String(location.pincode || '') === toLocation;

            return cityMatch || stateMatch || areaMatch || pincodeMatch;
          }) || false;

          // Fallback: If no specific location matches, try company address for broad matching
          let companyAddressMatch = false;
          if (coloader.companyAddress) {
            const companyPincode = String(coloader.companyAddress.pincode || '');
            const companyCity = coloader.companyAddress.city?.toLowerCase() || '';
            const companyState = coloader.companyAddress.state?.toLowerCase() || '';
            const companyArea = coloader.companyAddress.area?.toLowerCase() || '';

            // Check company address against from location
            if (fromLocation) {
              if (fromLocation.length === 6 && /^\d{6}$/.test(fromLocation)) {
                companyAddressMatch = companyPincode === fromLocation;
              } else {
                companyAddressMatch = companyCity.includes(fromLocation.toLowerCase()) ||
                  companyState.includes(fromLocation.toLowerCase()) ||
                  companyArea.includes(fromLocation.toLowerCase());
              }
            }

            // Check company address against to location (if from didn't match)
            if (toLocation && !companyAddressMatch) {
              if (toLocation.length === 6 && /^\d{6}$/.test(toLocation)) {
                companyAddressMatch = companyPincode === toLocation;
              } else {
                companyAddressMatch = companyCity.includes(toLocation.toLowerCase()) ||
                  companyState.includes(toLocation.toLowerCase()) ||
                  companyArea.includes(toLocation.toLowerCase());
              }
            }
          }

          // If only one location is provided, match that location or company address
          if (fromLocation && !toLocation) {
            return servesFrom || companyAddressMatch;
          }
          if (toLocation && !fromLocation) {
            return servesTo || companyAddressMatch;
          }
          // If both locations are provided, both must match (or company address for at least one)
          return (servesFrom && servesTo) || (companyAddressMatch && (servesFrom || servesTo));
        });


        setMatchingColoaders(matchingColoaders);

        if (matchingColoaders.length === 0) {
          const searchDetails = [];
          if (customFromLocation) searchDetails.push(`From: ${customFromLocation}`);
          if (customToLocation) searchDetails.push(`To: ${customToLocation}`);

          // Show all active coloaders as fallback
          const allActiveColoaders = allColoaders.filter(c => c.isActive);

          toast({
            title: "No coloaders found",
            description: `No active coloaders found for ${searchDetails.join(' and ')}. Showing all ${allActiveColoaders.length} active coloaders instead.`,
            variant: "destructive"
          });

          // Keep search fields populated so user doesn't have to re-enter
          // setCustomFromLocation('');
          // setCustomToLocation('');

          // Set all active coloaders as fallback
          setMatchingColoaders(allActiveColoaders);
        } else {
          toast({
            title: "Search completed",
            description: `Found ${matchingColoaders.length} coloader(s)`,
          });
        }
      } else {
        throw new Error('Failed to fetch coloaders');
      }
    } catch (error) {
      console.error('Error searching coloaders:', error);
      toast({
        title: "Search failed",
        description: "Failed to search for coloaders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingColoaders(false);
    }
  };

  // Handle edit assignment click
  const handleEditAssignment = async (order: AddressFormData) => {
    setSelectedOrder(order);
    setIsEditMode(true);
    setIsAssignModalOpen(true);
    setLoadingColoaders(true);

    // Set existing assignments for edit mode from trackingData
    if (order.trackingData?.assigned && order.trackingData.assigned.length > 0) {
      const assignments = order.trackingData.assigned.map(a => ({
        legNumber: a.legNumber,
        coloaderId: a.coloaderId,
        coloaderName: a.coloaderName,
        assignedAt: a.assignedAt,
        assignedBy: a.adminId
      }));
      setExistingAssignments(assignments);
      const maxLegNumber = Math.max(...order.trackingData.assigned.map(a => a.legNumber));
      const maxTotalLegs = Math.max(...order.trackingData.assigned.map(a => a.totalLegs));
      setNumberOfLegs(maxTotalLegs || 1);
      setAssignedColoaders([]);
    }

    // Reset current leg to 1 for editing
    setCurrentLeg(1);

    try {
      // Fetch coloaders that match the order's from/to locations
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/coloaders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const allColoaders = result.data || [];

        // Filter coloaders based on from/to locations
        const matchingColoaders = allColoaders.filter((coloader: Coloader) => {
          if (!coloader.isActive) return false;

          const fromCity = order.originData?.city || order.senderCity || '';
          const fromState = order.originData?.state || order.senderState || '';
          const fromPincode = order.originData?.pincode || order.senderPincode || '';

          const toCity = order.destinationData?.city || order.receiverCity || '';
          const toState = order.destinationData?.state || order.receiverState || '';
          const toPincode = order.destinationData?.pincode || order.receiverPincode || '';

          // Check if coloader serves the from location
          // Check main company address first
          const mainAddressMatch = coloader.companyAddress && (
            coloader.companyAddress.city?.toLowerCase().includes(fromCity.toLowerCase()) ||
            fromCity.toLowerCase().includes(coloader.companyAddress.city?.toLowerCase() || '') ||
            coloader.companyAddress.state?.toLowerCase().includes(fromState.toLowerCase()) ||
            fromState.toLowerCase().includes(coloader.companyAddress.state?.toLowerCase() || '') ||
            coloader.companyAddress.pincode === fromPincode
          );

          // Check additional from locations
          const additionalFromMatch = coloader.fromLocations?.some(location => {
            const cityMatch = location.city?.toLowerCase().includes(fromCity.toLowerCase()) ||
              fromCity.toLowerCase().includes(location.city?.toLowerCase() || '');
            const stateMatch = location.state?.toLowerCase().includes(fromState.toLowerCase()) ||
              fromState.toLowerCase().includes(location.state?.toLowerCase() || '');
            const pincodeMatch = location.pincode === fromPincode;

            return cityMatch || stateMatch || pincodeMatch;
          }) || false;

          const servesFrom = mainAddressMatch || additionalFromMatch;

          // Check if coloader serves the to location
          const servesTo = coloader.toLocations?.some(location => {
            const cityMatch = location.city?.toLowerCase().includes(toCity.toLowerCase()) ||
              toCity.toLowerCase().includes(location.city?.toLowerCase() || '');
            const stateMatch = location.state?.toLowerCase().includes(toState.toLowerCase()) ||
              toState.toLowerCase().includes(location.state?.toLowerCase() || '');
            const pincodeMatch = location.pincode === toPincode;

            return cityMatch || stateMatch || pincodeMatch;
          }) || false;

          return servesFrom && servesTo;
        });

        setMatchingColoaders(matchingColoaders);
      } else {
        throw new Error('Failed to fetch coloaders');
      }
    } catch (error) {
      console.error('Error fetching coloaders:', error);
      toast({
        title: "Error",
        description: "Failed to load coloaders",
        variant: "destructive"
      });
      setMatchingColoaders([]);
    } finally {
      setLoadingColoaders(false);
    }
  };

  // Handle assign button click for single order
  const handleAssignClick = async (order: AddressFormData) => {
    setSelectedOrder(order);
    setIsEditMode(false);
    setIsAssignModalOpen(true);
    setLoadingColoaders(true);

    // Auto-populate search fields with order pincodes
    const fromPincode = order.originData?.pincode || order.senderPincode || '';
    const toPincode = order.destinationData?.pincode || order.receiverPincode || '';

    console.log('Auto-populating pincodes:', { fromPincode, toPincode });
    setCustomFromLocation(fromPincode);
    setCustomToLocation(toPincode);

    try {
      // Fetch coloaders that match the order's from/to locations
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/coloaders?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const allColoaders = result.data || [];

        // Filter coloaders based on from/to locations
        const matchingColoaders = allColoaders.filter((coloader: Coloader) => {
          if (!coloader.isActive) return false;

          const fromCity = order.originData?.city || order.senderCity || '';
          const fromState = order.originData?.state || order.senderState || '';
          const fromPincode = order.originData?.pincode || order.senderPincode || '';

          const toCity = order.destinationData?.city || order.receiverCity || '';
          const toState = order.destinationData?.state || order.receiverState || '';
          const toPincode = order.destinationData?.pincode || order.receiverPincode || '';

          // Check if coloader serves the from location
          // Check main company address first
          const mainAddressMatch = coloader.companyAddress && (
            coloader.companyAddress.city?.toLowerCase().includes(fromCity.toLowerCase()) ||
            fromCity.toLowerCase().includes(coloader.companyAddress.city?.toLowerCase() || '') ||
            coloader.companyAddress.state?.toLowerCase().includes(fromState.toLowerCase()) ||
            fromState.toLowerCase().includes(coloader.companyAddress.state?.toLowerCase() || '') ||
            String(coloader.companyAddress.pincode || '') === fromPincode
          );

          // Check additional from locations
          const additionalFromMatch = coloader.fromLocations?.some(location => {
            const cityMatch = location.city?.toLowerCase().includes(fromCity.toLowerCase()) ||
              fromCity.toLowerCase().includes(location.city?.toLowerCase() || '');
            const stateMatch = location.state?.toLowerCase().includes(fromState.toLowerCase()) ||
              fromState.toLowerCase().includes(location.state?.toLowerCase() || '');
            const pincodeMatch = String(location.pincode || '') === fromPincode;

            return cityMatch || stateMatch || pincodeMatch;
          }) || false;

          const servesFrom = mainAddressMatch || additionalFromMatch;

          // Check if coloader serves the to location
          const servesTo = coloader.toLocations?.some(location => {
            const cityMatch = location.city?.toLowerCase().includes(toCity.toLowerCase()) ||
              toCity.toLowerCase().includes(location.city?.toLowerCase() || '');
            const stateMatch = location.state?.toLowerCase().includes(toState.toLowerCase()) ||
              toState.toLowerCase().includes(location.state?.toLowerCase() || '');
            const pincodeMatch = String(location.pincode || '') === toPincode;

            return cityMatch || stateMatch || pincodeMatch;
          }) || false;

          return servesFrom && servesTo;
        });

        setMatchingColoaders(matchingColoaders);

        if (matchingColoaders.length === 0) {
          toast({
            title: "No coloaders found",
            description: "No coloaders found for the order locations. Try custom search with different pincodes.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Auto-search completed",
            description: `Found ${matchingColoaders.length} coloader(s) for this order`,
          });
        }
      } else {
        throw new Error('Failed to fetch coloaders');
      }
    } catch (error) {
      console.error('Error fetching coloaders:', error);
      toast({
        title: "Error",
        description: "Failed to load coloaders",
        variant: "destructive"
      });
      setMatchingColoaders([]);
    } finally {
      setLoadingColoaders(false);
    }
  };

  // Handle "Assign More" for existing assignments
  const handleAssignMore = async (order: AddressFormData) => {
    setSelectedOrder(order);
    setIsEditMode(true);
    setIsAssignModalOpen(true);
    setLoadingColoaders(true);

    // Set existing assignments for multi-leg assignment from trackingData
    if (order.trackingData?.assigned && order.trackingData.assigned.length > 0) {
      const assignments = order.trackingData.assigned.map(a => ({
        legNumber: a.legNumber,
        coloaderId: a.coloaderId,
        coloaderName: a.coloaderName,
        assignedAt: a.assignedAt,
        assignedBy: a.adminId
      }));
      setExistingAssignments(assignments);
      const maxTotalLegs = Math.max(...order.trackingData.assigned.map(a => a.totalLegs));
      setNumberOfLegs(maxTotalLegs || 1);
      setCurrentLeg(order.trackingData.assigned.length + 1); // Next leg
    }

    try {
      // Fetch coloaders that match the order's from/to locations
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/coloaders?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const allColoaders = result.data || [];

        // Filter coloaders based on from/to locations
        const matchingColoaders = allColoaders.filter((coloader: Coloader) => {
          if (!coloader.isActive) return false;

          const fromCity = order.originData?.city || order.senderCity || '';
          const fromState = order.originData?.state || order.senderState || '';
          const fromPincode = order.originData?.pincode || order.senderPincode || '';

          const toCity = order.destinationData?.city || order.receiverCity || '';
          const toState = order.destinationData?.state || order.receiverState || '';
          const toPincode = order.destinationData?.pincode || order.receiverPincode || '';

          // Check if coloader serves the from location
          const mainAddressMatch = coloader.companyAddress && (
            coloader.companyAddress.city?.toLowerCase().includes(fromCity.toLowerCase()) ||
            fromCity.toLowerCase().includes(coloader.companyAddress.city?.toLowerCase() || '') ||
            coloader.companyAddress.state?.toLowerCase().includes(fromState.toLowerCase()) ||
            fromState.toLowerCase().includes(coloader.companyAddress.state?.toLowerCase() || '') ||
            String(coloader.companyAddress.pincode || '') === fromPincode
          );

          const additionalFromMatch = coloader.fromLocations?.some(location => {
            const cityMatch = location.city?.toLowerCase().includes(fromCity.toLowerCase()) ||
              fromCity.toLowerCase().includes(location.city?.toLowerCase() || '');
            const stateMatch = location.state?.toLowerCase().includes(fromState.toLowerCase()) ||
              fromState.toLowerCase().includes(location.state?.toLowerCase() || '');
            const pincodeMatch = String(location.pincode || '') === fromPincode;

            return cityMatch || stateMatch || pincodeMatch;
          }) || false;

          const servesFrom = mainAddressMatch || additionalFromMatch;

          // Check if coloader serves the to location
          const servesTo = coloader.toLocations?.some(location => {
            const cityMatch = location.city?.toLowerCase().includes(toCity.toLowerCase()) ||
              toCity.toLowerCase().includes(location.city?.toLowerCase() || '');
            const stateMatch = location.state?.toLowerCase().includes(toState.toLowerCase()) ||
              toState.toLowerCase().includes(location.state?.toLowerCase() || '');
            const pincodeMatch = String(location.pincode || '') === toPincode;

            return cityMatch || stateMatch || pincodeMatch;
          }) || false;

          return servesFrom && servesTo;
        });

        setMatchingColoaders(matchingColoaders);

        if (matchingColoaders.length === 0) {
          toast({
            title: "No coloaders found",
            description: "No coloaders found for the order locations. Try custom search with different pincodes.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Search completed",
            description: `Found ${matchingColoaders.length} coloader(s) for additional assignment`,
          });
        }
      } else {
        throw new Error('Failed to fetch coloaders');
      }
    } catch (error) {
      console.error('Error fetching coloaders:', error);
      toast({
        title: "Error",
        description: "Failed to load coloaders",
        variant: "destructive"
      });
      setMatchingColoaders([]);
    } finally {
      setLoadingColoaders(false);
    }
  };

  // Handle assign button click for route (path-level)
  const handleAssignRouteClick = async (routeKey: RouteKey) => {
    const orders = ordersByRoute[routeKey] || [];
    // Only work with unassigned orders (orders that are still in 'received' status)
    const unassignedOrders = orders.filter(order =>
      !order.trackingData?.assigned || order.trackingData.assigned.length === 0
    );
    if (unassignedOrders.length === 0) return;

    // Prepare modal in non-edit mode and no specific selected order
    setSelectedOrder(null);
    setSelectedRouteKey(routeKey);
    setSelectedRouteOrders(unassignedOrders);
    setIsEditMode(false);
    setIsAssignModalOpen(true);
    setLoadingColoaders(true);

    // Use pincodes from first unassigned order to seed search (fallback to city/state matching if needed)
    const first = unassignedOrders[0];
    const fromPincode = first.originData?.pincode || first.senderPincode || '';
    const toPincode = first.destinationData?.pincode || first.receiverPincode || '';
    setCustomFromLocation(fromPincode);
    setCustomToLocation(toPincode);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/coloaders?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch coloaders');
      const result = await response.json();
      const allColoaders = result.data || [];

      // Derive matching based on path locations (city/state/pincode) from first order
      const fromCity = first.originData?.city || first.senderCity || '';
      const fromState = first.originData?.state || first.senderState || '';
      const toCity = first.destinationData?.city || first.receiverCity || '';
      const toState = first.destinationData?.state || first.receiverState || '';

      const matching = allColoaders.filter((coloader: Coloader) => {
        if (!coloader.isActive) return false;
        const fromPin = first.originData?.pincode || first.senderPincode || '';
        const toPin = first.destinationData?.pincode || first.receiverPincode || '';

        const mainAddressFrom = coloader.companyAddress && (
          coloader.companyAddress.city?.toLowerCase().includes(fromCity.toLowerCase()) ||
          fromCity.toLowerCase().includes(coloader.companyAddress.city?.toLowerCase() || '') ||
          coloader.companyAddress.state?.toLowerCase().includes(fromState.toLowerCase()) ||
          fromState.toLowerCase().includes(coloader.companyAddress.state?.toLowerCase() || '') ||
          String(coloader.companyAddress.pincode || '') === String(fromPin)
        );
        const additionalFrom = coloader.fromLocations?.some((loc) => {
          const cityMatch = loc.city?.toLowerCase().includes(fromCity.toLowerCase()) || fromCity.toLowerCase().includes(loc.city?.toLowerCase() || '');
          const stateMatch = loc.state?.toLowerCase().includes(fromState.toLowerCase()) || fromState.toLowerCase().includes(loc.state?.toLowerCase() || '');
          const pinMatch = String(loc.pincode || '') === String(fromPin);
          return cityMatch || stateMatch || pinMatch;
        }) || false;
        const servesFrom = mainAddressFrom || additionalFrom;

        const servesTo = coloader.toLocations?.some((loc) => {
          const cityMatch = loc.city?.toLowerCase().includes(toCity.toLowerCase()) || toCity.toLowerCase().includes(loc.city?.toLowerCase() || '');
          const stateMatch = loc.state?.toLowerCase().includes(toState.toLowerCase()) || toState.toLowerCase().includes(loc.state?.toLowerCase() || '');
          const pinMatch = String(loc.pincode || '') === String(toPin);
          return cityMatch || stateMatch || pinMatch;
        }) || false;

        return servesFrom && servesTo;
      });

      setMatchingColoaders(matching);
      toast({ title: 'Search completed', description: `Found ${matching.length} coloader(s) for this path` });
    } catch (error) {
      console.error('Error fetching coloaders for path:', error);
      toast({ title: 'Error', description: 'Failed to load coloaders', variant: 'destructive' });
      setMatchingColoaders([]);
    } finally {
      setLoadingColoaders(false);
    }
  };

  // Handle clear all assignments
  const handleClearAllAssignments = async () => {
    if (!selectedOrder) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/clear-all-assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: selectedOrder._id
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "All assignments cleared",
        });
        // Clear the existing assignments
        setExistingAssignments([]);
        // Refresh the orders list
        fetchAddressForms(currentPage, false, activeTab);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to clear assignments: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error clearing assignments:', error);
      toast({
        title: "Error",
        description: `Failed to clear assignments: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Handle remove assignment
  const handleRemoveAssignment = async (legNumber: number) => {
    if (!selectedOrder) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/remove-assignment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          legNumber: legNumber
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Leg ${legNumber} assignment removed`,
        });
        // Refresh the assignments
        setExistingAssignments(existingAssignments.filter(a => a.legNumber !== legNumber));
        // Refresh the orders list
        fetchAddressForms(currentPage, false, activeTab);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to remove assignment: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: `Failed to remove assignment: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Handle removing assignment from assigned paths tab
  const handleRemoveAssignmentFromTab = async (orderId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/remove-assignment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          legNumber: 1 // Remove the first (and typically only) leg
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Assignment removed for this order",
        });
        // Refresh the orders list
        fetchAddressForms(currentPage, false, activeTab);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to remove assignment: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove assignment",
        variant: "destructive",
      });
    }
  };

  // Handle removing all assignments for a path
  const handleRemovePathAssignments = async (pathGroup: {
    route: string;
    orders: AddressFormData[];
    assignedDate: string;
    coloaderName: string;
    totalWeight: number;
  }) => {
    try {
      const token = localStorage.getItem('adminToken');
      let successCount = 0;

      // Remove assignments for all orders in the path
      for (const order of pathGroup.orders) {
        const response = await fetch('/api/admin/remove-assignment', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: order._id,
            legNumber: 1
          })
        });

        if (response.ok) {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Success",
          description: `Removed assignments for ${successCount}/${pathGroup.orders.length} orders in this path`,
        });
        // Refresh the orders list
        fetchAddressForms(currentPage, false, activeTab);
      } else {
        throw new Error('Failed to remove any assignments');
      }
    } catch (error) {
      console.error('Error removing path assignments:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove path assignments",
        variant: "destructive",
      });
    }
  };

  // Handle marking individual order assignment as complete
  const handleCompleteAssignment = async (order: AddressFormData) => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('🔑 Token exists:', !!token);
      console.log('🔑 Token length:', token?.length || 0);

      if (!token) {
        throw new Error('No admin token found. Please log in again.');
      }

      console.log(`🔄 Completing assignment for order: ${order._id}`, order);

      if (!order._id) {
        console.error(`❌ Order missing ID:`, order);
        throw new Error('Order ID is missing');
      }

      // Check if order has assignment data
      if (!order.assignmentData || (!order.assignmentData.assignedColoader && !order.assignmentData.legAssignments?.length)) {
        console.error(`❌ Order ${order._id} is not assigned to any coloader:`, order.assignmentData);
        throw new Error('Order is not assigned to any coloader');
      }

      const response = await fetch('/api/admin/complete-assignment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackingId: order._id,
          consignmentNumber: order.consignmentNumber,
          completedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log(`✅ Order ${order._id} completed successfully`);
        toast({
          title: "Assignment Completed",
          description: `Order ${order.consignmentNumber || order._id} has been marked as complete`,
        });
        // Refresh the data to reflect the changes
        await fetchAddressForms(currentPage, false, activeTab);
      } else {
        const errorData = await response.json();
        console.error(`❌ Failed to complete order ${order._id}:`, errorData);
        throw new Error(errorData.error || `Failed to complete assignment: ${response.status}`);
      }
    } catch (error) {
      console.error('Error completing assignment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete assignment",
        variant: "destructive",
      });
    }
  };

  // Handle completing a path (move to completed section)
  const handleCompletePath = async (pathGroup: {
    route: string;
    orders: AddressFormData[];
    assignedDate: string;
    coloaderName: string;
    totalWeight: number;
  }) => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('🔑 Token exists:', !!token);
      console.log('🔑 Token length:', token?.length || 0);

      if (!token) {
        throw new Error('No admin token found. Please log in again.');
      }

      let successCount = 0;

      // Update each order in the path to mark as completed
      for (const order of pathGroup.orders) {
        console.log(`🔄 Processing order: ${order._id}`, order);

        if (!order._id) {
          console.error(`❌ Order missing ID:`, order);
          continue;
        }

        // Check if order has assignment data
        if (!order.assignmentData || !order.assignmentData.assignedColoader) {
          console.error(`❌ Order ${order._id} is not assigned to any coloader:`, order.assignmentData);
          continue;
        }

        try {
          const response = await fetch('/api/admin/complete-assignment', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              trackingId: order._id,
              consignmentNumber: order.consignmentNumber,
              completedAt: new Date().toISOString()
            })
          });

          if (response.ok) {
            successCount++;
            console.log(`✅ Order ${order._id} completed successfully`);
          } else {
            const errorData = await response.json();
            console.error(`❌ Failed to complete order ${order._id}:`, errorData);
            console.error(`❌ Full error response:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            });
            if (errorData.details) {
              console.error(`❌ Validation details:`, errorData.details);
            }
          }
        } catch (orderError) {
          console.error(`❌ Network error completing order ${order._id}:`, orderError);
        }
      }

      if (successCount > 0) {
        // Refresh the data to reflect the changes
        await fetchAddressForms(currentPage, false, activeTab);

        toast({
          title: "Path Completed",
          description: `Path "${pathGroup.route}" has been completed and moved to completed section`,
        });
      } else {
        throw new Error(`Failed to complete any orders in this path. ${pathGroup.orders.length} orders attempted, 0 succeeded.`);
      }
    } catch (error) {
      console.error('Error completing path:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete path",
        variant: "destructive",
      });
    }
  };

  // Handle coloader assignment (single order or path-level)
  const handleAssignColoader = async (coloader: Coloader) => {
    if (!coloader._id) {
      toast({ title: 'Error', description: 'No coloader ID found', variant: 'destructive' });
      return;
    }

    const token = localStorage.getItem('adminToken');

    try {
      if (selectedRouteKey && selectedRouteOrders.length > 0) {
        // Assign for all orders in the selected route that are not yet assigned
        const targets = selectedRouteOrders;
        let successCount = 0;
        for (const order of targets) {
          if (!order.consignmentNumber) continue;
          const requestBody = {
            consignmentNumber: order.consignmentNumber,
            coloaderId: coloader._id,
            legNumber: 1,
            totalLegs: 1,
            isEditMode: false
          };

          const resp = await fetch('/api/admin/assign-coloader', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          if (resp.ok) successCount += 1;
        }
        toast({ title: 'Assignment complete', description: `Assigned ${successCount}/${selectedRouteOrders.length} orders for this path` });
      } else {
        // Single-order assignment (existing flow)
        if (!selectedOrder || !selectedOrder.consignmentNumber) {
          toast({ title: 'Error', description: 'No consignment number found', variant: 'destructive' });
          return;
        }

        // For multi-leg assignments, update the total legs count
        let finalTotalLegs = numberOfLegs;
        if (isEditMode && existingAssignments.length > 0) {
          // If we're adding to existing assignments, update total legs
          finalTotalLegs = Math.max(numberOfLegs, currentLeg);
        }

        const requestBody = {
          consignmentNumber: selectedOrder.consignmentNumber,
          coloaderId: coloader._id,
          legNumber: currentLeg,
          totalLegs: finalTotalLegs,
          isEditMode: isEditMode
        };

        const response = await fetch('/api/admin/assign-coloader', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to assign coloader: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const isComplete = currentLeg === finalTotalLegs;

        toast({
          title: 'Success',
          description: `Coloader assigned successfully! ${isComplete ? 'Assignment complete.' : `Leg ${currentLeg} of ${finalTotalLegs} assigned.`}`
        });
      }

      // Refresh and reset
      await fetchAddressForms(currentPage, false, activeTab);
      setIsAssignModalOpen(false);
      setIsEditMode(false);
      setExistingAssignments([]);
      setAssignedColoaders([]);
      setCurrentLeg(1);
      setNumberOfLegs(1);
      setCustomFromLocation('');
      setCustomToLocation('');
      setSelectedRouteKey(null);
      setSelectedRouteOrders([]);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error assigning coloader:', error);
      toast({ title: 'Error', description: `Failed to assign coloader: ${error.message}`, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchAddressForms(1, false, activeTab); // Let the function decide whether to use large limit
  }, [activeTab]);

  // Listen for order status changes from other components
  useEffect(() => {
    const handleOrderStatusChange = (event: CustomEvent) => {
      const { orderId, newStatus, consignmentNumber } = event.detail;
      console.log(`Order status changed: ${consignmentNumber} -> ${newStatus}`);

      // Refresh the address forms data to reflect the status change
      fetchAddressForms(currentPage, false, activeTab);

      // Show a toast notification
      toast({
        title: "Status Updated",
        description: `Order ${consignmentNumber} status changed to ${newStatus}`,
      });
    };

    const handleOrderWeightUpdate = (event: CustomEvent) => {
      const { orderId, newWeight } = event.detail;
      console.log(`Order weight updated: ${orderId} -> ${newWeight}kg`);

      // Refresh the address forms data to reflect the weight change
      fetchAddressForms(currentPage, false, activeTab);
    };

    // Add event listeners
    window.addEventListener('orderStatusChanged', handleOrderStatusChange as EventListener);
    window.addEventListener('orderWeightUpdated', handleOrderWeightUpdate as EventListener);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange as EventListener);
      window.removeEventListener('orderWeightUpdated', handleOrderWeightUpdate as EventListener);
    };
  }, [currentPage, activeTab]);

  // Add error boundary fallback
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assign Coloaders</h1>
                <p className="text-sm text-gray-600">Manage coloader assignments for received consignments</p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Data</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fetchAddressForms(1, false, activeTab)} className="bg-blue-600 hover:bg-blue-700">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assign Coloaders</h1>
                <p className="text-sm text-gray-600">Manage coloader assignments for received consignments</p>
              </div>
            </div>
            <Button
              onClick={() => fetchAddressForms(currentPage, false, activeTab)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setCurrentPage(1);
                setActiveTab('normal');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'normal'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Normal Assignment
            </button>
            <button
              onClick={() => {
                setCurrentPage(1);
                setActiveTab('assigned');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'assigned'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Assigned Paths
            </button>
            <button
              onClick={() => {
                setCurrentPage(1);
                setActiveTab('completed');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'completed'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Completed Assigned Paths
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {/* Workflow Information */}
          {activeTab === 'normal' && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1 text-sm">Order Workflow</h4>
                  <p className="text-xs text-blue-700">
                    Orders appear here only after they are marked as 'received' through the barcode scanning process.
                    The workflow is: <strong>Booked</strong> → <strong>Received</strong> (via barcode scan) → <strong>Assign Coloaders</strong> (this page).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Normal Assignment Tab */}
          {activeTab === 'normal' && (
            <>
              {/* Compact Filters */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by sender, receiver, or location..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                  />
                </div>
              </div>

              {/* Path (Route) Groups with total weight and Assign */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Paths ({routeKeys.filter(key => {
                      const routeOrders = ordersByRoute[key] || [];
                      return routeOrders.some(order => !order.trackingData?.assigned || order.trackingData.assigned.length === 0);
                    }).length})</h3>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-gray-600">Loading paths...</span>
                    </div>
                  </div>
                ) : routeKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-6 w-6 text-gray-400" />
                      <span className="text-gray-500">No received consignments found</span>
                      <p className="text-xs text-gray-400">Orders will appear here after they are marked as 'received' through barcode scanning.</p>
                    </div>
                  </div>
                ) : routeKeys.filter(key => {
                  const routeOrders = ordersByRoute[key] || [];
                  return routeOrders.some(order => !order.trackingData?.assigned || order.trackingData.assigned.length === 0);
                }).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">All orders have been assigned</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {routeKeys
                      .filter(key => {
                        // Only show routes that have unassigned orders
                        const routeOrders = ordersByRoute[key] || [];
                        return routeOrders.some(order => !order.trackingData?.assigned || order.trackingData.assigned.length === 0);
                      })
                      .map((key) => (
                        <div key={key} className="rounded-lg border border-gray-200 p-4 bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-gray-900 text-sm">{key}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                <span className="inline-flex items-center gap-1">
                                  <Package className="h-3 w-3" /> {(ordersByRoute[key] || []).filter(order => !order.trackingData?.assigned || order.trackingData.assigned.length === 0).length} orders
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Weight className="h-3 w-3" /> {(ordersByRoute[key] || []).filter(order => !order.trackingData?.assigned || order.trackingData.assigned.length === 0).reduce((sum, o) => sum + (o.shipmentData?.actualWeight || 0), 0)} kg
                                </span>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleAssignRouteClick(key)} 
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-7"
                            >
                              <UserPlus className="h-3 w-3 mr-1" /> Assign
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Pagination - Only show for datasets with more than 20 orders */}
              {totalCount > 20 && totalPages > 1 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => fetchAddressForms(currentPage - 1, false, activeTab)}
                        disabled={!hasPrev || loading}
                        className="px-3 py-1 h-8 text-sm"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => fetchAddressForms(currentPage + 1, false, activeTab)}
                        disabled={!hasNext || loading}
                        className="px-3 py-1 h-8 text-sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Assigned Paths Tab */}
          {activeTab === 'assigned' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Assigned Paths ({getAssignedPaths().length})</h3>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading assigned paths...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {getAssignedPaths().map((pathGroup) => {
                    // Check if any order in the group is eligible for completion (status is 'intransit')
                    const hasCompletableOrders = pathGroup.orders.some(
                      order => order.trackingData?.currentStatus === 'intransit'
                    );

                    return (
                      <div key={pathGroup.groupKey} className="bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        {/* Path Header */}
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => togglePathExpansion(pathGroup.groupKey)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-gray-900 text-sm">{pathGroup.route}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {pathGroup.totalPackages} packages
                                </span>
                                <span className="flex items-center gap-1">
                                  <Weight className="h-3 w-3" />
                                  {pathGroup.totalWeight} kg
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(pathGroup.assignedDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="mt-2">
                                <span className="text-xs text-gray-600">
                                  Assigned to: <span className="font-medium text-blue-600">{pathGroup.coloaderName}</span>
                                </span>
                                {/* Show detailed leg assignments if available */}
                                {pathGroup.orders[0]?.assignmentData?.legAssignments && pathGroup.orders[0].assignmentData.legAssignments.length > 1 && (
                                  <div className="mt-2 space-y-1">
                                    <div className="text-xs font-medium text-gray-700">Multi-leg Route:</div>
                                    {createRouteSegments(pathGroup.orders[0], pathGroup.orders[0].assignmentData.legAssignments).map((segment, index) => (
                                      <div key={segment.legNumber} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded border-l-2 border-blue-200">
                                        <div className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                                          {segment.legNumber}
                                        </div>
                                        <div className="flex-1">
                                          <div className="font-medium text-gray-800">{segment.coloaderName}</div>
                                          <div className="text-gray-600 text-xs">
                                            <span className="font-medium">{segment.fromLocation}</span>
                                            <span className="mx-1">→</span>
                                            <span className="font-medium">{segment.toLocation}</span>
                                          </div>
                                          <div className="text-gray-500">
                                            Leg {segment.legNumber} • {new Date(segment.assignedAt).toLocaleDateString()}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignMore(pathGroup.orders[0]);
                                }}
                                className="h-7 px-3 text-xs hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                Assign More
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAssignment(pathGroup.orders[0]);
                                }}
                                className="h-7 w-7 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                                title="Edit Assignment"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              {hasCompletableOrders && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompletePath(pathGroup);
                                  }}
                                  className="h-7 px-3 text-xs hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  Complete
                                </Button>
                              )}
                              <div className="p-1 rounded hover:bg-gray-100">
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expandedPaths.has(pathGroup.groupKey) ? 'rotate-180' : ''
                                  }`} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Orders List */}
                        {expandedPaths.has(pathGroup.groupKey) && (
                          <div className="border-t border-gray-200 bg-gray-50">
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Package className="h-4 w-4 text-gray-600" />
                                <h5 className="text-sm font-medium text-gray-800">Orders ({pathGroup.orders.length})</h5>
                              </div>
                              <div className="space-y-2">
                                {pathGroup.orders.map((order) => (
                                  <div key={order._id} className="bg-white rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="text-sm">
                                          <div className="font-medium text-gray-900">
                                            Consignment #{order.consignmentNumber || 'N/A'}
                                          </div>
                                          <div className="text-gray-600 mt-1 flex items-center gap-4 text-xs">
                                            <span className="flex items-center gap-1">
                                              <Weight className="h-3 w-3" />
                                              {order.shipmentData?.actualWeight || 0} kg
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Package className="h-3 w-3" />
                                              {order.uploadData?.totalPackages || parseInt(order.shipmentData?.totalPackages || '0', 10) || 0} packages
                                            </span>
                                          </div>
                                          <div className="mt-2">
                                            <Badge 
                                              variant="outline" 
                                              className={`text-xs ${
                                                order.assignmentData?.status === 'delivered'
                                                  ? 'bg-green-50 text-green-700 border-green-200'
                                                  : order.assignmentData?.status === 'in_transit'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                              }`}
                                            >
                                              {order.assignmentData?.status || 'assigned'}
                                            </Badge>
                                          </div>
                                          {/* Show detailed leg assignments for individual orders */}
                                          {order.assignmentData?.legAssignments && order.assignmentData.legAssignments.length > 1 && (
                                            <div className="mt-2 space-y-1">
                                              <div className="text-xs font-medium text-gray-600">Route Details:</div>
                                              {createRouteSegments(order, order.assignmentData.legAssignments).map((segment, index) => (
                                                <div key={segment.legNumber} className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                                                  <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                                    {segment.legNumber}
                                                  </div>
                                                  <div className="flex-1">
                                                    <div className="font-medium text-gray-800">{segment.coloaderName}</div>
                                                    <div className="text-gray-600 text-xs">
                                                      <span className="font-medium">{segment.fromLocation}</span>
                                                      <span className="mx-1">→</span>
                                                      <span className="font-medium">{segment.toLocation}</span>
                                                    </div>
                                                    <div className="text-gray-500">
                                                      Leg {segment.legNumber} • {new Date(segment.assignedAt).toLocaleDateString()}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEditAssignment(order)}
                                          className="h-7 w-7 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                                          title="Edit Assignment"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        {order.trackingData?.currentStatus === 'intransit' && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCompleteAssignment(order)}
                                            className="h-7 px-3 text-xs hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                                          >
                                            <Package className="h-3 w-3 mr-1" />
                                            Complete
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {getAssignedPaths().length === 0 && (
                    <div className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <MapPin className="h-6 w-6 text-gray-400" />
                        <span className="text-gray-500">No assigned paths found</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Completed Assigned Paths Tab */}
          {activeTab === 'completed' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Completed Assigned Paths ({getCompletedPaths().length})</h3>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading completed paths...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {getCompletedPaths().map((pathGroup) => (
                    <div key={pathGroup.groupKey} className="bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      {/* Path Header */}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-gray-900 text-sm">{pathGroup.route}</span>
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Completed
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {pathGroup.totalPackages} packages
                              </span>
                              <span className="flex items-center gap-1">
                                <Weight className="h-3 w-3" />
                                {pathGroup.totalWeight} kg
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Completed: {new Date(pathGroup.completedDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className="text-xs text-gray-600">
                                Assigned to: <span className="font-medium text-blue-600">{pathGroup.coloaderName}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {getCompletedPaths().length === 0 && (
                    <div className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-6 w-6 text-gray-400" />
                        <span className="text-gray-500">No completed paths found</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-5xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditMode ? <Edit className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              {isEditMode ? 'Edit Assignment' : 'Assign Coloader'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Modify coloader assignments for this order' : 'Select coloaders for this order'}
              {selectedOrder && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <strong>Order Details:</strong>
                    <div className="mt-1">
                      <span className="text-gray-600">From: </span>
                      {getFromLocation(selectedOrder)}
                    </div>
                    <div>
                      <span className="text-gray-600">To: </span>
                      {getToLocation(selectedOrder)}
                    </div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Custom From/To Location Inputs */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Custom Search Locations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  From Location
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit pincode"
                  value={customFromLocation}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow digits and limit to 6 characters
                    if (/^\d*$/.test(value) && value.length <= 6) {
                      setCustomFromLocation(value);
                      // Auto-search when exactly 6 digits are entered
                      if (value.length === 6) {
                        setTimeout(() => searchColoadersWithCustomLocations(), 100);
                      }
                    }
                  }}
                  maxLength={6}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  To Location
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit pincode"
                  value={customToLocation}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow digits and limit to 6 characters
                    if (/^\d*$/.test(value) && value.length <= 6) {
                      setCustomToLocation(value);
                      // Auto-search when exactly 6 digits are entered
                      if (value.length === 6) {
                        setTimeout(() => searchColoadersWithCustomLocations(), 100);
                      }
                    }
                  }}
                  maxLength={6}
                  className="w-full"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-between">
              <Button
                size="sm"
                onClick={() => {
                  setCustomFromLocation('');
                  setCustomToLocation('');
                  setMatchingColoaders([]);
                }}
                variant="outline"
                className="text-xs"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={searchColoadersWithCustomLocations}
                disabled={loadingColoaders || (!customFromLocation.trim() && !customToLocation.trim())}
                className="text-xs"
              >
                {loadingColoaders ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3 mr-1" />
                    Search Coloaders
                  </>
                )}
              </Button>
            </div>
          </div>



          {/* Assigned Coloader Summary */}
          {(assignedColoaders.length > 0 || (isEditMode && existingAssignments.length > 0)) && (
            <div className="mb-3 p-2 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-green-800">
                  {isEditMode ? 'Assignment Progress' : 'Assigned Coloader'}
                </h3>
                {isEditMode && existingAssignments.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearAllAssignments}
                    className="text-red-600 hover:text-red-700 h-5 px-2 text-xs border-0 shadow-none"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Progress indicator */}
              {isEditMode && existingAssignments.length > 0 && (
                <div className="mb-2 text-xs text-gray-600">
                  Leg {existingAssignments.length} of {numberOfLegs} assigned
                  {currentLeg > existingAssignments.length && (
                    <span className="ml-2 text-blue-600 font-medium">
                      (Assigning leg {currentLeg})
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-0.5">
                {isEditMode ? (
                  existingAssignments.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-1.5 rounded shadow-md border-0 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium border-0">
                          {assignment.legNumber}
                        </div>
                        <span className="text-sm font-medium leading-tight">{assignment.coloaderName}</span>
                        <span className="text-xs text-gray-500">(Leg {assignment.legNumber})</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveAssignment(assignment.legNumber)}
                        className="h-4 w-4 p-0 text-red-500 hover:text-red-700 border-0 shadow-none"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  assignedColoaders.map((coloader, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-1.5 rounded shadow-md border-0 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium border-0">
                          ✓
                        </div>
                        <span className="text-sm font-medium leading-tight">{coloader.companyName}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Continue assignment message */}
              {isEditMode && currentLeg <= numberOfLegs && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  <strong>Continue Assignment:</strong> Select a coloader for leg {currentLeg} of {numberOfLegs}
                </div>
              )}

              {/* Complete assignment message */}
              {isEditMode && existingAssignments.length > 0 && currentLeg > numberOfLegs && (
                <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                  <strong>All Legs Assigned:</strong> You can now mark this assignment as complete
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {loadingColoaders ? (
              <div className="text-center py-4">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading coloaders...</p>
              </div>
            ) : matchingColoaders.length === 0 ? (
              <div className="text-center py-4">
                <Truck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No matching coloaders found</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {matchingColoaders.map((coloader) => (
                  <Card key={coloader._id} className="p-2 hover:shadow-lg transition-all duration-200 border-0 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center border-0">
                            <Truck className="h-3 w-3 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm text-gray-900 leading-tight">{coloader.companyName}</h3>
                            <p className="text-xs text-gray-600 leading-tight">{coloader.concernPerson}</p>
                          </div>
                        </div>

                        <div className="flex gap-3 text-xs text-gray-600 mb-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{coloader.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{coloader.mobileNumbers[0] || 'No number'}</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-600 leading-tight">
                          <div className="flex items-center gap-1 mb-0.5">
                            <MapPin className="h-3 w-3" />
                            <span className="font-medium">Areas:</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-xs leading-tight">
                              <strong>From:</strong> {coloader.fromLocations?.slice(0, 2).map(loc => `${loc.city}, ${loc.state}`).join(', ') || 'N/A'}
                              {coloader.fromLocations?.length > 2 && ` +${coloader.fromLocations.length - 2} more`}
                            </div>
                            <div className="text-xs leading-tight">
                              <strong>To:</strong> {coloader.toLocations?.slice(0, 2).map(loc => `${loc.city}, ${loc.state}`).join(', ') || 'N/A'}
                              {coloader.toLocations?.length > 2 && ` +${coloader.toLocations.length - 2} more`}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ml-3">
                        <Button
                          size="sm"
                          onClick={() => handleAssignColoader(coloader)}
                          className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Assign
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAssignModalOpen(false);
              setIsEditMode(false);
              setExistingAssignments([]);
              setAssignedColoaders([]);
              setCurrentLeg(1);
              setNumberOfLegs(1);
              setCustomFromLocation('');
              setCustomToLocation('');
            }}>
              Cancel
            </Button>
            {isEditMode && (
              <>
                {currentLeg <= numberOfLegs && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Add another leg
                      setNumberOfLegs(numberOfLegs + 1);
                      setCurrentLeg(numberOfLegs + 1);
                      toast({
                        title: "Added Leg",
                        description: `Now assigning leg ${numberOfLegs + 1}`,
                      });
                    }}
                    className="mr-2"
                  >
                    Add Another Leg
                  </Button>
                )}
                {selectedOrder && existingAssignments.length > 0 && currentLeg > numberOfLegs && (
                  <Button
                    variant="outline"
                    onClick={() => handleCompleteAssignment(selectedOrder)}
                    className="mr-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  >
                    <Package className="h-3 w-3 mr-1" />
                    Mark as Complete
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setIsAssignModalOpen(false);
                    setIsEditMode(false);
                    setExistingAssignments([]);
                    setAssignedColoaders([]);
                    setCurrentLeg(1);
                    setNumberOfLegs(1);
                    setCustomFromLocation('');
                    setCustomToLocation('');
                    fetchAddressForms(currentPage, false, activeTab);
                  }}
                >
                  Done
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignColoader;
