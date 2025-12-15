import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Truck,
  Package,
  Building,
  MapPin,
  Phone,
  Calendar,
  DollarSign,
  Search,
  RefreshCw,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShipmentData {
  _id: string;
  bookingReference: string;
  consignmentNumber?: number;
  originData: {
    name: string;
    companyName: string;
    mobileNumber: string;
    city: string;
    state: string;
  };
  destinationData: {
    name: string;
    companyName: string;
    mobileNumber: string;
    city: string;
    state: string;
  };
  shipmentData: {
    natureOfConsignment: string;
    actualWeight: string;
    totalPackages: string;
  };
  invoiceData: {
    finalPrice: number;
  };
  paymentStatus: 'paid' | 'unpaid';
  paymentType: 'FP' | 'TP';
  bookingDate: string;
  assignedCourierBoy?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  } | null;
  assignedCourierBoyAt?: string | null;
}

interface CorporateGroup {
  corporate: {
    _id: string;
    corporateId: string;
    companyName: string;
    email: string;
    contactNumber: string;
  };
  shipments: ShipmentData[];
}

interface CourierBoy {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  area: string;
  status: string;
}

interface MedicineBooking {
  _id: string;
  bookingReference: string;
  consignmentNumber?: number;
  status: string;
  origin: {
    name: string;
    city: string;
    state: string;
    pincode: string;
    mobileNumber: string;
  };
  destination: {
    name: string;
    city: string;
    state: string;
    pincode: string;
    mobileNumber: string;
  };
  shipment: {
    natureOfConsignment: string;
    actualWeight: string;
  };
  package: {
    totalPackages: string;
  };
  invoice: {
    invoiceValue: string;
    invoiceNumber: string;
  };
  createdAt: string;
  assignedCourierBoyId?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  } | null;
  assignedCourierBoyAt?: string | null;
}

interface TrackingAssignmentDetails {
  coloaderId?: string;
  coloaderName?: string;
  adminName?: string;
  assignedAt?: string;
  legNumber?: number;
  totalLegs?: number;
}

interface TrackingShipmentRecord {
  _id: string;
  consignmentNumber?: number;
  bookingReference?: string;
  currentStatus: string;
  booked?: Array<{
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
      natureOfConsignment?: string;
      actualWeight?: string;
      totalPackages?: string;
    };
    invoiceData?: {
      finalPrice?: number;
    };
    bookingDate?: string;
  }>;
  createdAt?: string;
  latestAssignment?: TrackingAssignmentDetails;
}

interface ColoaderGroup {
  coloaderId: string;
  coloaderName: string;
  totalOrders: number;
  latestAssignedAt?: string;
  shipments: TrackingShipmentRecord[];
}

interface CustomerBookingColoaderGroup {
  coloaderId: string;
  coloaderName: string;
  totalOrders: number;
  latestAssignedAt?: string;
  bookings: Array<CustomerBooking & { latestAssignment?: TrackingAssignmentDetails }>;
}

// Unified interface for merged coloader groups (trackings + customerbookings)
interface MergedColoaderGroup {
  coloaderId: string;
  coloaderName: string;
  totalOrders: number;
  latestAssignedAt?: string;
  shipments: TrackingShipmentRecord[];
  bookings: Array<CustomerBooking & { latestAssignment?: TrackingAssignmentDetails }>;
}

type ColoaderAddressType = 'company' | 'from' | 'to';

interface ColoaderAddressDetails {
  flatNo?: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  concernPerson?: string;
  mobile?: string;
  email?: string;
  gst?: string;
}

interface ColoaderAddressOption {
  id: string;
  type: ColoaderAddressType;
  index?: number | null;
  label: string;
  subtitle: string;
  details: ColoaderAddressDetails;
}

interface CustomerBooking {
  _id: string;
  bookingReference?: string;
  consignmentNumber?: number;
  currentStatus?: string;
  status: string;
  origin: {
    name: string;
    mobileNumber: string;
    email?: string;
    companyName?: string;
    city: string;
    state: string;
    pincode?: string;
    locality?: string;
    flatBuilding?: string;
  };
  destination: {
    name: string;
    mobileNumber: string;
    email?: string;
    companyName?: string;
    city: string;
    state: string;
    pincode?: string;
    locality?: string;
    flatBuilding?: string;
  };
  shipment: {
    natureOfConsignment?: string;
    weight?: string;
    packagesCount?: string;
  };
  actualWeight?: number;
  calculatedPrice?: number;
  totalAmount?: number;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  BookedAt?: string | Date;
  createdAt: string | Date;
  assignedCourierBoy?: {
    courierBoyId?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  } | null;
  assignedCourierBoyAt?: string | Date | null;
}

const AssignCourierBoy = () => {
  const [corporateGroups, setCorporateGroups] = useState<CorporateGroup[]>([]);
  const [medicineBookings, setMedicineBookings] = useState<MedicineBooking[]>([]);
  const [coloaderGroups, setColoaderGroups] = useState<MergedColoaderGroup[]>([]);
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMedicine, setLoadingMedicine] = useState(false);
  const [loadingColoaderGroups, setLoadingColoaderGroups] = useState(false);
  const [loadingCustomerBookings, setLoadingCustomerBookings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [selectedMedicineBookingIds, setSelectedMedicineBookingIds] = useState<string[]>([]);
  const [selectedTrackingIds, setSelectedTrackingIds] = useState<string[]>([]);
  const [selectedCustomerBookingIds, setSelectedCustomerBookingIds] = useState<string[]>([]);
  const [selectedCorporateGroup, setSelectedCorporateGroup] = useState<CorporateGroup | null>(null);
  const [selectedColoaderGroup, setSelectedColoaderGroup] = useState<MergedColoaderGroup | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMedicineAssignModal, setShowMedicineAssignModal] = useState(false);
  const [showColoaderAssignModal, setShowColoaderAssignModal] = useState(false);
  const [showCustomerPickupModal, setShowCustomerPickupModal] = useState(false);
  const [courierBoys, setCourierBoys] = useState<CourierBoy[]>([]);
  const [loadingCourierBoys, setLoadingCourierBoys] = useState(false);
  const [selectedCourierBoyId, setSelectedCourierBoyId] = useState<string>('');
  const [coloaderAddressOptions, setColoaderAddressOptions] = useState<ColoaderAddressOption[]>([]);
  const [loadingColoaderAddresses, setLoadingColoaderAddresses] = useState(false);
  const [coloaderAddressesError, setColoaderAddressesError] = useState<string | null>(null);
  const [selectedAddressOptionId, setSelectedAddressOptionId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [coloaderError, setColoaderError] = useState<string | null>(null);
  const [customerBookingColoaderGroups, setCustomerBookingColoaderGroups] = useState<CustomerBookingColoaderGroup[]>([]);
  const [loadingCustomerBookingColoaderGroups, setLoadingCustomerBookingColoaderGroups] = useState(false);
  const [customerBookingColoaderError, setCustomerBookingColoaderError] = useState<string | null>(null);
  const [selectedCustomerBookingColoaderGroup, setSelectedCustomerBookingColoaderGroup] = useState<CustomerBookingColoaderGroup | null>(null);
  const [selectedCustomerBookingColoaderIds, setSelectedCustomerBookingColoaderIds] = useState<string[]>([]);
  const [showCustomerBookingColoaderModal, setShowCustomerBookingColoaderModal] = useState(false);
  const { toast } = useToast();

  // Fetch shipments grouped by corporate
  const fetchShipments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/shipments/grouped-by-corporate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch shipments');
      }

      const data = await response.json();
      console.log('Fetched shipments:', data); // Debug log

      if (data.success && data.data) {
        setCorporateGroups(data.data || []);
      } else {
        setCorporateGroups([]);
      }

    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load shipments. Please try again.",
        variant: "destructive",
      });
      setCorporateGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch medicine bookings with 'arrived' status
  const fetchMedicineBookings = async () => {
    try {
      setLoadingMedicine(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/medicine/bookings?status=arrived', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch medicine bookings');
      }

      const data = await response.json();
      console.log('Fetched medicine bookings:', data);

      if (data.success && data.bookings) {
        setMedicineBookings(data.bookings || []);
      } else {
        setMedicineBookings([]);
      }

    } catch (error) {
      console.error('Error fetching medicine bookings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load medicine bookings. Please try again.",
        variant: "destructive",
      });
      setMedicineBookings([]);
    } finally {
      setLoadingMedicine(false);
    }
  };

  // Fetch courier boys
  const fetchCourierBoys = async () => {
    try {
      setLoadingCourierBoys(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/courier-boy?status=approved&limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCourierBoys(data.courierBoys || []);
        }
      }
    } catch (error) {
      console.error('Error fetching courier boys:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courier boys",
        variant: "destructive"
      });
    } finally {
      setLoadingCourierBoys(false);
    }
  };

  // Fetch customer bookings with 'booked' status
  const fetchCustomerBookings = async () => {
    try {
      setLoadingCustomerBookings(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/customer-booking?currentStatus=booked&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch customer bookings');
      }

      const data = await response.json();
      console.log('Fetched customer bookings:', data);

      if (data.success && Array.isArray(data.data)) {
        setCustomerBookings(data.data || []);
      } else {
        setCustomerBookings([]);
      }

    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load customer bookings. Please try again.",
        variant: "destructive",
      });
      setCustomerBookings([]);
    } finally {
      setLoadingCustomerBookings(false);
    }
  };

  useEffect(() => {
    fetchShipments();
    fetchMedicineBookings();
    fetchColoaderAssignments();
    fetchCustomerBookings();
    fetchCustomerBookingColoaderGroups();
  }, []);

  // Handle assign click for a corporate group
  const handleAssignClick = (group: CorporateGroup) => {
    setSelectedCorporateGroup(group);
    // Select all shipments in this group that don't have a courier assigned
    const unassignedShipmentIds = group.shipments
      .filter(s => !s.assignedCourierBoy)
      .map(s => s._id);
    setSelectedShipmentIds(unassignedShipmentIds);
    setSelectedCourierBoyId('');
    setShowAssignModal(true);
    fetchCourierBoys();
  };

  // Handle assign click for individual shipment
  const handleAssignIndividualClick = (group: CorporateGroup, shipmentId: string) => {
    setSelectedCorporateGroup(group);
    setSelectedShipmentIds([shipmentId]);
    setSelectedCourierBoyId('');
    setShowAssignModal(true);
    fetchCourierBoys();
  };

  // Handle assign courier to shipments
  const handleAssignCourier = async () => {
    if (!selectedCorporateGroup || !selectedCourierBoyId || selectedShipmentIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select a courier boy and at least one shipment",
        variant: "destructive"
      });
      return;
    }

    try {
      setAssigning(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Assign courier to all selected shipments
      const assignmentPromises = selectedShipmentIds.map(shipmentId =>
        fetch(`/api/admin/shipments/${shipmentId}/assign-courier`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ courierBoyId: selectedCourierBoyId })
        })
      );

      const results = await Promise.all(assignmentPromises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to assign ${failed.length} shipment(s)`);
      }

      toast({
        title: "Success",
        description: `Courier boy assigned to ${selectedShipmentIds.length} shipment(s) successfully`,
      });

      // Refresh shipments
      await fetchShipments();

      setShowAssignModal(false);
      setSelectedCorporateGroup(null);
      setSelectedShipmentIds([]);
      setSelectedCourierBoyId('');
    } catch (error) {
      console.error('Error assigning courier boy:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign courier boy",
        variant: "destructive"
      });
    } finally {
      setAssigning(false);
    }
  };

  // Handle assign pickup courier to customer bookings
  const handleAssignCustomerPickup = async () => {
    if (!selectedCourierBoyId || selectedCustomerBookingIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select a courier boy and at least one customer booking",
        variant: "destructive"
      });
      return;
    }

    try {
      setAssigning(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Assign courier to all selected customer bookings
      const assignmentPromises = selectedCustomerBookingIds.map(bookingId =>
        fetch(`/api/admin/customer-booking/${bookingId}/assign-pickup-courier`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ courierBoyId: selectedCourierBoyId })
        })
      );

      const results = await Promise.all(assignmentPromises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        const errorData = await failed[0].json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to assign ${failed.length} booking(s)`);
      }

      toast({
        title: "Success",
        description: `Pickup courier assigned to ${selectedCustomerBookingIds.length} customer booking(s) successfully`,
      });

      // Refresh customer bookings
      await fetchCustomerBookings();

      setShowCustomerPickupModal(false);
      setSelectedCustomerBookingIds([]);
      setSelectedCourierBoyId('');
    } catch (error) {
      console.error('Error assigning pickup courier:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign pickup courier",
        variant: "destructive"
      });
    } finally {
      setAssigning(false);
    }
  };

  // Handle assign delivery courier to medicine bookings
  const handleAssignMedicineDelivery = async () => {
    if (!selectedCourierBoyId || selectedMedicineBookingIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select a courier boy and at least one medicine order",
        variant: "destructive"
      });
      return;
    }

    try {
      setAssigning(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Assign courier to all selected medicine bookings
      const assignmentPromises = selectedMedicineBookingIds.map(bookingId =>
        fetch(`/api/admin/medicine/bookings/${bookingId}/assign-delivery-courier`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ courierBoyId: selectedCourierBoyId })
        })
      );

      const results = await Promise.all(assignmentPromises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        const errorData = await failed[0].json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to assign ${failed.length} order(s)`);
      }

      toast({
        title: "Success",
        description: `Delivery courier assigned to ${selectedMedicineBookingIds.length} medicine order(s) successfully`,
      });

      // Refresh medicine bookings
      await fetchMedicineBookings();

      setShowMedicineAssignModal(false);
      setSelectedMedicineBookingIds([]);
      setSelectedCourierBoyId('');
    } catch (error) {
      console.error('Error assigning delivery courier:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign delivery courier",
        variant: "destructive"
      });
    } finally {
      setAssigning(false);
    }
  };

  const formatAddressSubtitle = (details: ColoaderAddressDetails) => {
    const parts = [
      details.area,
      details.city,
      details.state,
      details.pincode
    ].filter(Boolean);
    return parts.join(', ');
  };

  const resetColoaderAddressState = () => {
    setColoaderAddressOptions([]);
    setColoaderAddressesError(null);
    setSelectedAddressOptionId('');
  };

  const fetchColoaderAddresses = async (coloaderId: string) => {
    try {
      setLoadingColoaderAddresses(true);
      setColoaderAddressesError(null);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/admin/tracking/coloader/${coloaderId}/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch coloader addresses');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const { companyAddress, fromLocations = [], toLocations = [] } = data.data;
        const options: ColoaderAddressOption[] = [];

        if (companyAddress) {
          options.push({
            id: 'company',
            type: 'company',
            index: null,
            label: 'Company Address',
            subtitle: formatAddressSubtitle(companyAddress),
            details: companyAddress
          });
        }

        fromLocations.forEach((location: ColoaderAddressDetails, index: number) => {
          options.push({
            id: `from-${index}`,
            type: 'from',
            index,
            label: `From Address ${index + 1}`,
            subtitle: formatAddressSubtitle(location),
            details: location
          });
        });

        toLocations.forEach((location: ColoaderAddressDetails, index: number) => {
          options.push({
            id: `to-${index}`,
            type: 'to',
            index,
            label: `To Address ${index + 1}`,
            subtitle: formatAddressSubtitle(location),
            details: location
          });
        });

        setColoaderAddressOptions(options);
      } else {
        setColoaderAddressOptions([]);
      }
    } catch (error) {
      console.error('Error fetching coloader addresses:', error);
      setColoaderAddressesError(error instanceof Error ? error.message : 'Failed to load coloader addresses.');
      setColoaderAddressOptions([]);
    } finally {
      setLoadingColoaderAddresses(false);
    }
  };

  // Handle assign click for medicine bookings
  const handleAssignMedicineClick = (bookingIds: string[]) => {
    setSelectedMedicineBookingIds(bookingIds);
    setSelectedCourierBoyId('');
    setShowMedicineAssignModal(true);
    fetchCourierBoys();
  };

  const openColoaderAssignModal = (group: MergedColoaderGroup, trackingIds: string[], bookingIds: string[], isTracking: boolean) => {
    setSelectedColoaderGroup(group);
    setSelectedTrackingIds(trackingIds);
    setSelectedCustomerBookingColoaderIds(bookingIds);
    setSelectedCourierBoyId('');
    resetColoaderAddressState();
    setShowColoaderAssignModal(true);
    fetchCourierBoys();
    fetchColoaderAddresses(group.coloaderId);
  };

  // Handle assign click for coloader group (all shipments and bookings)
  const handleAssignColoaderGroupClick = (group: MergedColoaderGroup) => {
    const trackingIds = group.shipments.map((shipment) => shipment._id);
    const bookingIds = group.bookings.map((booking) => booking._id);
    openColoaderAssignModal(group, trackingIds, bookingIds, false);
  };

  // Handle assign click for single tracking record within a coloader group
  const handleAssignColoaderShipmentClick = (group: MergedColoaderGroup, trackingId: string) => {
    openColoaderAssignModal(group, [trackingId], [], true);
  };

  // Handle assign click for single customer booking within a coloader group
  const handleAssignColoaderBookingClick = (group: MergedColoaderGroup, bookingId: string) => {
    openColoaderAssignModal(group, [], [bookingId], false);
  };

  // Assign courier boy to selected tracking records and/or customer bookings
  const handleAssignCourierToTracking = async () => {
    if (!selectedCourierBoyId || (!selectedTrackingIds.length && !selectedCustomerBookingColoaderIds.length) || !selectedColoaderGroup) {
      toast({
        title: "Error",
        description: "Please select a courier boy, coloader, and at least one record",
        variant: "destructive"
      });
      return;
    }

    const selectedAddressOption = coloaderAddressOptions.find(option => option.id === selectedAddressOptionId);

    if (!selectedAddressOption) {
      toast({
        title: "Error",
        description: "Please select a coloader address",
        variant: "destructive"
      });
      return;
    }

    try {
      setAssigning(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const promises: Promise<Response>[] = [];
      let totalAssigned = 0;

      // Assign to tracking records if any
      if (selectedTrackingIds.length > 0) {
        promises.push(
          fetch('/api/admin/tracking/coloader/assign-courier-boy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              trackingIds: selectedTrackingIds,
              courierBoyId: selectedCourierBoyId,
              coloaderId: selectedColoaderGroup.coloaderId,
              addressSelection: {
                type: selectedAddressOption.type,
                index: selectedAddressOption.index ?? null
              }
            })
          })
        );
        totalAssigned += selectedTrackingIds.length;
      }

      // Assign to customer bookings if any
      if (selectedCustomerBookingColoaderIds.length > 0) {
        promises.push(
          fetch('/api/admin/customer-booking/coloader/assign-courier-boy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              bookingIds: selectedCustomerBookingColoaderIds,
              courierBoyId: selectedCourierBoyId,
              coloaderId: selectedColoaderGroup.coloaderId,
              addressSelection: {
                type: selectedAddressOption.type,
                index: selectedAddressOption.index ?? null
              }
            })
          })
        );
        totalAssigned += selectedCustomerBookingColoaderIds.length;
      }

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        const errorData = await failed[0].json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to assign courier boy');
      }

      toast({
        title: "Success",
        description: `Courier boy assigned to ${totalAssigned} record(s) successfully`,
      });

      await fetchColoaderAssignments();

      setShowColoaderAssignModal(false);
      setSelectedColoaderGroup(null);
      setSelectedTrackingIds([]);
      setSelectedCustomerBookingColoaderIds([]);
      setSelectedCourierBoyId('');
      resetColoaderAddressState();
    } catch (error) {
      console.error('Error assigning courier boy:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign courier boy",
        variant: "destructive"
      });
    } finally {
      setAssigning(false);
    }
  };

  // Fetch customer booking coloader group assignments
  const fetchCustomerBookingColoaderGroups = async () => {
    try {
      setLoadingCustomerBookingColoaderGroups(true);
      setCustomerBookingColoaderError(null);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔍 Fetching customer booking coloader groups...');
      const response = await fetch('/api/admin/customer-booking/coloader/groups?status=assigned', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch customer booking coloader assignments');
      }

      const data = await response.json();
      console.log('📦 Customer booking coloader groups response:', data);
      if (data.success && Array.isArray(data.data)) {
        console.log(`✅ Setting ${data.data.length} customer booking coloader groups`);
        setCustomerBookingColoaderGroups(data.data);
      } else {
        console.log('⚠️ No data or invalid response structure:', data);
        setCustomerBookingColoaderGroups([]);
      }
    } catch (error) {
      console.error('❌ Error fetching customer booking coloader assignments:', error);
      setCustomerBookingColoaderGroups([]);
      const message = error instanceof Error ? error.message : 'Failed to load customer booking coloader assignments.';
      setCustomerBookingColoaderError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingCustomerBookingColoaderGroups(false);
    }
  };

  // Fetch coloader group assignments from both tracking data and customer bookings
  const fetchColoaderAssignments = async () => {
    try {
      setLoadingColoaderGroups(true);
      setColoaderError(null);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch from both endpoints in parallel
      const [trackingResponse, customerBookingResponse] = await Promise.all([
        fetch('/api/admin/tracking/coloader/groups?status=assigned', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/customer-booking/coloader/groups?status=assigned', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!trackingResponse.ok) {
        const errorData = await trackingResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch tracking coloader assignments');
      }

      if (!customerBookingResponse.ok) {
        const errorData = await customerBookingResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch customer booking coloader assignments');
      }

      const trackingData = await trackingResponse.json();
      const customerBookingData = await customerBookingResponse.json();

      const trackingGroups: ColoaderGroup[] = trackingData.success && Array.isArray(trackingData.data) ? trackingData.data : [];
      const customerBookingGroups: CustomerBookingColoaderGroup[] = customerBookingData.success && Array.isArray(customerBookingData.data) ? customerBookingData.data : [];

      // Merge groups by coloaderId
      const mergedGroupsMap = new Map<string, MergedColoaderGroup>();

      // Add tracking groups
      trackingGroups.forEach((group) => {
        mergedGroupsMap.set(group.coloaderId, {
          coloaderId: group.coloaderId,
          coloaderName: group.coloaderName,
          totalOrders: group.totalOrders,
          latestAssignedAt: group.latestAssignedAt,
          shipments: group.shipments,
          bookings: []
        });
      });

      // Merge customer booking groups
      customerBookingGroups.forEach((group) => {
        const existing = mergedGroupsMap.get(group.coloaderId);
        if (existing) {
          // Merge into existing group
          existing.totalOrders += group.totalOrders;
          existing.bookings = group.bookings;
          // Update latestAssignedAt if customer booking is more recent
          if (group.latestAssignedAt && (!existing.latestAssignedAt || new Date(group.latestAssignedAt) > new Date(existing.latestAssignedAt))) {
            existing.latestAssignedAt = group.latestAssignedAt;
          }
        } else {
          // Create new group
          mergedGroupsMap.set(group.coloaderId, {
            coloaderId: group.coloaderId,
            coloaderName: group.coloaderName,
            totalOrders: group.totalOrders,
            latestAssignedAt: group.latestAssignedAt,
            shipments: [],
            bookings: group.bookings
          });
        }
      });

      // Convert map to array and sort by latestAssignedAt
      const mergedGroups = Array.from(mergedGroupsMap.values()).sort(
        (a, b) => new Date(b.latestAssignedAt || 0).getTime() - new Date(a.latestAssignedAt || 0).getTime()
      );

      setColoaderGroups(mergedGroups);
    } catch (error) {
      console.error('Error fetching coloader assignments:', error);
      setColoaderGroups([]);
      const message = error instanceof Error ? error.message : 'Failed to load coloader assignments.';
      setColoaderError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingColoaderGroups(false);
    }
  };

  // Handle assign click for customer booking coloader group (all bookings)
  const handleAssignCustomerBookingColoaderGroupClick = (group: CustomerBookingColoaderGroup) => {
    const bookingIds = group.bookings.map((booking) => booking._id);
    openCustomerBookingColoaderModal(group, bookingIds);
  };

  // Handle assign click for single customer booking within a coloader group
  const handleAssignCustomerBookingColoaderClick = (group: CustomerBookingColoaderGroup, bookingId: string) => {
    openCustomerBookingColoaderModal(group, [bookingId]);
  };

  const openCustomerBookingColoaderModal = (group: CustomerBookingColoaderGroup, bookingIds: string[]) => {
    setSelectedCustomerBookingColoaderGroup(group);
    setSelectedCustomerBookingColoaderIds(bookingIds);
    setSelectedCourierBoyId('');
    resetColoaderAddressState();
    setShowCustomerBookingColoaderModal(true);
    fetchCourierBoys();
    fetchColoaderAddresses(group.coloaderId);
  };

  // Assign courier boy to selected customer bookings
  const handleAssignCourierToCustomerBooking = async () => {
    if (!selectedCourierBoyId || selectedCustomerBookingColoaderIds.length === 0 || !selectedCustomerBookingColoaderGroup) {
      toast({
        title: "Error",
        description: "Please select a courier boy, coloader, and at least one customer booking",
        variant: "destructive"
      });
      return;
    }

    const selectedAddressOption = coloaderAddressOptions.find(option => option.id === selectedAddressOptionId);

    if (!selectedAddressOption) {
      toast({
        title: "Error",
        description: "Please select a coloader address",
        variant: "destructive"
      });
      return;
    }

    try {
      setAssigning(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/customer-booking/coloader/assign-courier-boy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingIds: selectedCustomerBookingColoaderIds,
          courierBoyId: selectedCourierBoyId,
          coloaderId: selectedCustomerBookingColoaderGroup.coloaderId,
          addressSelection: {
            type: selectedAddressOption.type,
            index: selectedAddressOption.index ?? null
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to assign courier boy');
      }

      toast({
        title: "Success",
        description: `Courier boy assigned to ${selectedCustomerBookingColoaderIds.length} customer booking(s) successfully`,
      });

      await fetchCustomerBookingColoaderGroups();

      setShowCustomerBookingColoaderModal(false);
      setSelectedCustomerBookingColoaderGroup(null);
      setSelectedCustomerBookingColoaderIds([]);
      setSelectedCourierBoyId('');
      resetColoaderAddressState();
    } catch (error) {
      console.error('Error assigning courier boy to customer booking:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign courier boy",
        variant: "destructive"
      });
    } finally {
      setAssigning(false);
    }
  };

  // Filter corporate groups based on search and assignment status
  const getFilteredGroups = (showAssigned: boolean) => {
    const filtered = corporateGroups
      .map(group => {
        // Filter shipments based on assignment status
        const filteredShipments = group.shipments.filter(shipment =>
          showAssigned ? shipment.assignedCourierBoy : !shipment.assignedCourierBoy
        );

        // Return group with filtered shipments, or null if no shipments match
        if (filteredShipments.length === 0) return null;

        return {
          ...group,
          shipments: filteredShipments
        };
      })
      .filter(group => group !== null)
      .filter(group => {
        // Apply search filter
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          group.corporate.companyName.toLowerCase().includes(term) ||
          group.corporate.corporateId.toLowerCase().includes(term) ||
          group.shipments.some(s =>
            s.consignmentNumber?.toString().includes(term) ||
            s.bookingReference.toLowerCase().includes(term)
          )
        );
      }) as CorporateGroup[];
    return filtered;
  };

  // Get filtered groups for unassigned tab
  const unassignedGroups = getFilteredGroups(false);

  // Get filtered groups for assigned tab
  const assignedGroups = getFilteredGroups(true);
  const totalColoaderShipments = coloaderGroups.reduce((sum, group) => sum + group.shipments.length + group.bookings.length, 0);

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

  const renderColoaderGroups = () => {
    if (loadingColoaderGroups) {
      return (
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading coloader assignments...</p>
          </CardContent>
        </Card>
      );
    }

    if (coloaderError) {
      return (
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardContent className="p-12 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to load coloader assignments
              </h3>
              <p className="text-gray-600">{coloaderError}</p>
            </div>
            <Button onClick={fetchColoaderAssignments} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (coloaderGroups.length === 0) {
      return (
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardContent className="p-12 text-center space-y-4">
            <Package className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No coloader assignments found
              </h3>
              <p className="text-gray-600">
                Trackings and customer bookings with current status "assigned" will appear here once a coloader is linked.
              </p>
            </div>
            <Button onClick={fetchColoaderAssignments} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {coloaderGroups.map((group) => (
          <Card key={group.coloaderId} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-100 rounded-md">
                      <Truck className="h-4 w-4 text-indigo-600" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800">
                      {group.coloaderName}
                    </CardTitle>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-7">
                    {group.totalOrders} assigned record(s) ({group.shipments.length} corporate{group.shipments.length !== 1 ? 's' : ''}, {group.bookings.length} customer{group.bookings.length !== 1 ? 's' : ''})
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white text-gray-700 border-gray-200 text-xs">
                    Latest: {group.latestAssignedAt ? formatDate(group.latestAssignedAt) : 'N/A'}
                  </Badge>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                    onClick={() => handleAssignColoaderGroupClick(group)}
                    disabled={group.shipments.length === 0 && group.bookings.length === 0}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Assign Courier Boy
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchColoaderAssignments}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Type</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Consignment</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Origin</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Destination</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Weight</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Amount</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Assigned At</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Leg</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Status</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Render tracking shipments */}
                    {group.shipments.map((shipment) => {
                      const bookedData = shipment.booked && shipment.booked.length > 0 ? shipment.booked[0] : undefined;
                      const assignmentDetails = shipment.latestAssignment;
                      return (
                        <TableRow key={`tracking-${shipment._id}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <TableCell className="py-3 px-4">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Corporate</Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="font-medium text-gray-900">
                              {shipment.consignmentNumber || shipment.bookingReference || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{bookedData?.originData?.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">
                                {bookedData?.originData?.city || '--'}, {bookedData?.originData?.state || '--'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{bookedData?.destinationData?.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">
                                {bookedData?.destinationData?.city || '--'}, {bookedData?.destinationData?.state || '--'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-sm">
                            {bookedData?.shipmentData?.actualWeight || '0'} kg
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="font-medium text-gray-900">
                              ₹{bookedData?.invoiceData?.finalPrice?.toFixed(2) || '0.00'}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-sm text-gray-500">
                            {assignmentDetails?.assignedAt ? formatDate(assignmentDetails.assignedAt) : 'N/A'}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-sm">
                            {assignmentDetails?.legNumber || 1} / {assignmentDetails?.totalLegs || 1}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                              {shipment.currentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300"
                                onClick={() => handleAssignColoaderShipmentClick(group, shipment._id)}
                              >
                                <Truck className="h-3 w-3 mr-1" />
                                Assign
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Render customer bookings */}
                    {group.bookings.map((booking) => {
                      const assignmentDetails = booking.latestAssignment;
                      return (
                        <TableRow key={`booking-${booking._id}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <TableCell className="py-3 px-4">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Customer</Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="font-medium text-gray-900">
                              {booking.consignmentNumber || booking.bookingReference || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{booking.origin.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">
                                {booking.origin.city || '--'}, {booking.origin.state || '--'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{booking.destination.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">
                                {booking.destination.city || '--'}, {booking.destination.state || '--'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-sm">
                            {booking.actualWeight || booking.shipment?.weight || '0'} kg
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="font-medium text-gray-900">
                              ₹{booking.totalAmount?.toFixed(2) || booking.calculatedPrice?.toFixed(2) || '0.00'}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-sm text-gray-500">
                            {assignmentDetails?.assignedAt ? formatDate(assignmentDetails.assignedAt) : 'N/A'}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-sm">
                            {assignmentDetails?.legNumber || 1} / {assignmentDetails?.totalLegs || 1}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                              {booking.currentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300"
                                onClick={() => handleAssignColoaderBookingClick(group, booking._id)}
                              >
                                <Truck className="h-3 w-3 mr-1" />
                                Assign
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render customer booking coloader groups
  const renderCustomerBookingColoaderGroups = () => {
    if (loadingCustomerBookingColoaderGroups) {
      return (
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading customer booking coloader assignments...</p>
          </CardContent>
        </Card>
      );
    }

    if (customerBookingColoaderError) {
      return (
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardContent className="p-12 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to load customer booking coloader assignments
              </h3>
              <p className="text-gray-600">{customerBookingColoaderError}</p>
            </div>
            <Button onClick={fetchCustomerBookingColoaderGroups} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (customerBookingColoaderGroups.length === 0) {
      return (
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardContent className="p-12 text-center space-y-4">
            <Package className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No customer booking coloader assignments found
              </h3>
              <p className="text-gray-600">
                Customer bookings with current status "assigned" will appear here once a coloader is linked.
              </p>
            </div>
            <Button onClick={fetchCustomerBookingColoaderGroups} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {customerBookingColoaderGroups.map((group) => (
          <Card key={group.coloaderId} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-100 rounded-md">
                      <Truck className="h-4 w-4 text-indigo-600" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800">
                      {group.coloaderName}
                    </CardTitle>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-7">
                    {group.totalOrders} assigned booking(s)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white text-gray-700 border-gray-200 text-xs">
                    Latest: {group.latestAssignedAt ? formatDate(group.latestAssignedAt) : 'N/A'}
                  </Badge>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                    onClick={() => handleAssignCustomerBookingColoaderGroupClick(group)}
                    disabled={group.bookings.length === 0}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Assign Courier Boy
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchCustomerBookingColoaderGroups}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Consignment</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Origin</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Destination</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Weight</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Amount</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Assigned At</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Leg</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Status</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.bookings.map((booking) => {
                      const assignmentDetails = booking.latestAssignment;
                      return (
                        <TableRow key={booking._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <TableCell className="py-3 px-4">
                            <span className="font-medium text-gray-900">
                              {booking.consignmentNumber || booking.bookingReference || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{booking.origin.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">
                                {booking.origin.city || '--'}, {booking.origin.state || '--'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{booking.destination.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">
                                {booking.destination.city || '--'}, {booking.destination.state || '--'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-sm">
                            {booking.actualWeight || booking.shipment?.weight || '0'} kg
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="font-medium text-gray-900">
                              ₹{booking.totalAmount?.toFixed(2) || booking.calculatedPrice?.toFixed(2) || '0.00'}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-sm text-gray-500">
                            {assignmentDetails?.assignedAt ? formatDate(assignmentDetails.assignedAt) : 'N/A'}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-sm">
                            {assignmentDetails?.legNumber || 1} / {assignmentDetails?.totalLegs || 1}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                              {booking.currentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300"
                                onClick={() => handleAssignCustomerBookingColoaderClick(group, booking._id)}
                              >
                                <Truck className="h-3 w-3 mr-1" />
                                Assign
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render corporate groups list (reusable component)
  const renderCorporateGroupsList = (groups: CorporateGroup[], showAssigned: boolean) => {
    if (groups.length === 0) {
      return (
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {corporateGroups.length === 0
                ? `No corporate shipments available`
                : `No ${showAssigned ? 'assigned' : 'unassigned'} shipments match your search criteria`}
            </h3>
            <p className="text-gray-600 mb-4">
              {corporateGroups.length === 0
                ? "Corporate accounts will appear here once they create bookings. Check back later or ensure corporate accounts have made shipments."
                : `Try adjusting your search terms to find ${showAssigned ? 'assigned' : 'unassigned'} shipments.`}
            </p>
            {corporateGroups.length === 0 && (
              <Button onClick={fetchShipments} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {groups.map((group) => (
          <Card key={group.corporate._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-blue-100 rounded-md">
                      <Building className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800">
                      {group.corporate.companyName}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 ml-7">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">ID:</span>
                      <span>{group.corporate.corporateId}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{group.corporate.contactNumber}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>{group.shipments.length} shipment(s)</span>
                    </div>
                  </div>
                </div>
                {!showAssigned && (
                  <Button
                    onClick={() => handleAssignClick(group)}
                    disabled={group.shipments.filter(s => !s.assignedCourierBoy).length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Assign Courier Boy
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Consignment</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Origin</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Destination</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Weight</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Amount</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Date</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Assigned Courier</TableHead>
                      <TableHead className="font-medium text-gray-700 py-3 px-4">Status</TableHead>
                      {!showAssigned && (
                        <TableHead className="font-medium text-gray-700 py-3 px-4 text-center">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.shipments.map((shipment) => (
                      <TableRow key={shipment._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <TableCell className="py-3 px-4">
                          <span className="font-medium text-gray-900">
                            {shipment.consignmentNumber || shipment.bookingReference}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{shipment.originData.name}</div>
                            <div className="text-sm text-gray-500">{shipment.originData.city}, {shipment.originData.state}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{shipment.destinationData.name}</div>
                            <div className="text-sm text-gray-500">{shipment.destinationData.city}, {shipment.destinationData.state}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm">{shipment.shipmentData.actualWeight || 'N/A'} kg</TableCell>
                        <TableCell className="py-3 px-4">
                          <span className="font-medium text-gray-900">₹{shipment.invoiceData.finalPrice?.toFixed(2) || '0.00'}</span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm text-gray-500">{formatDate(shipment.bookingDate)}</TableCell>
                        <TableCell className="py-3 px-4">
                          {shipment.assignedCourierBoy ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-green-600" />
                                <span className="font-medium text-green-600 text-sm">{shipment.assignedCourierBoy.fullName}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="h-3 w-3" />
                                <span>{shipment.assignedCourierBoy.phone}</span>
                              </div>
                              {shipment.assignedCourierBoyAt && (
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <Calendar className="h-3 w-3" />
                                  <span>Assigned: {formatDate(shipment.assignedCourierBoyAt)}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit text-xs">
                              <AlertCircle className="h-3 w-3" />
                              Not Assigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge
                            variant={shipment.paymentStatus === 'paid' ? 'default' : 'secondary'}
                            className={shipment.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                          >
                            {shipment.paymentStatus === 'paid' ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {shipment.paymentStatus}
                          </Badge>
                        </TableCell>
                        {!showAssigned && (
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              {shipment.assignedCourierBoy ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Assigned
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAssignIndividualClick(group, shipment._id)}
                                  className="h-7 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300"
                                >
                                  <Truck className="h-3 w-3 mr-1" />
                                  Assign
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardContent className="p-12">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-gray-600">Loading shipments...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assign Courier Boy</h1>
                <p className="text-sm text-gray-600">Assign courier boys to corporate shipments, coloaders, and medicine orders</p>
              </div>
            </div>
            <Button
              onClick={() => {
                fetchShipments();
                fetchMedicineBookings();
                fetchColoaderAssignments();
                fetchCustomerBookings();
                fetchCustomerBookingColoaderGroups();
              }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Compact Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by company name, corporate ID, or consignment number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Corporates</p>
                  <p className="text-2xl font-bold text-gray-900">{corporateGroups.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-md">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Shipments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {corporateGroups.reduce((sum, group) => sum + group.shipments.length, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-md">
                  <Truck className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unassigned Shipments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {corporateGroups.reduce((sum, group) =>
                      sum + group.shipments.filter(s => !s.assignedCourierBoy).length, 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <Tabs defaultValue="unassigned" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6 h-auto min-h-[40px] bg-gray-100 rounded-lg gap-1 p-1">
              <TabsTrigger
                value="unassigned"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all px-4 py-2 flex items-center justify-center rounded-md"
              >
                <Truck className="h-4 w-4 mr-2" />
                Assign Pickup
              </TabsTrigger>
              <TabsTrigger
                value="coloader"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all px-4 py-2 flex items-center justify-center rounded-md"
              >
                <Truck className="h-4 w-4 mr-2" />
                Coloader
              </TabsTrigger>
              <TabsTrigger
                value="delivery"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all px-4 py-2 flex items-center justify-center rounded-md"
              >
                <Truck className="h-4 w-4 mr-2" />
                Medicine Delivery
              </TabsTrigger>
              <TabsTrigger
                value="customer-pickup"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all px-4 py-2 flex items-center justify-center rounded-md"
              >
                <Truck className="h-4 w-4 mr-2" />
                Customer Pickup
              </TabsTrigger>
              <TabsTrigger
                value="customer-booking-coloader"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all px-4 py-2 flex items-center justify-center rounded-md"
              >
                <Truck className="h-4 w-4 mr-2" />
                Customer Booking Coloader
              </TabsTrigger>
              <TabsTrigger
                value="assigned"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all px-4 py-2 flex items-center justify-center rounded-md"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Assigned
              </TabsTrigger>
            </TabsList>

            {/* Unassigned Tab */}
            <TabsContent value="unassigned" className="space-y-4">
              {renderCorporateGroupsList(unassignedGroups, false)}
            </TabsContent>

            {/* Coloader Tab */}
            <TabsContent value="coloader" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-indigo-100 rounded-md">
                        <Truck className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Coloaders</p>
                        <p className="text-2xl font-bold text-gray-900">{coloaderGroups.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-md">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Assigned Records</p>
                        <p className="text-2xl font-bold text-gray-900">{totalColoaderShipments}</p>
                        <p className="text-xs text-gray-500 mt-1">Trackings + Bookings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-emerald-100 rounded-md">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Status Filter</p>
                        <p className="text-2xl font-bold text-gray-900">Assigned</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {renderColoaderGroups()}
            </TabsContent>

            {/* Delivery Tab */}
            <TabsContent value="delivery" className="space-y-4">
              {loadingMedicine ? (
                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading medicine orders...</p>
                  </CardContent>
                </Card>
              ) : medicineBookings.length === 0 ? (
                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Arrived Medicine Orders
                    </h3>
                    <p className="text-gray-600 mb-4">
                      There are no medicine orders with "Arrived" status to assign for delivery.
                    </p>
                    <Button onClick={fetchMedicineBookings} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Medicine Orders - Arrived Status
                      </h3>
                      <p className="text-sm text-gray-600">
                        {medicineBookings.filter(b => !b.assignedCourierBoyId).length} unassigned order(s)
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const unassignedIds = medicineBookings
                          .filter(b => !b.assignedCourierBoyId)
                          .map(b => b._id);
                        if (unassignedIds.length > 0) {
                          handleAssignMedicineClick(unassignedIds);
                        }
                      }}
                      disabled={medicineBookings.filter(b => !b.assignedCourierBoyId).length === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Assign All Unassigned
                    </Button>
                  </div>

                  <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-gray-200">
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Consignment</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Origin</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Destination</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Weight</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Packages</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Amount</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Date</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Assigned Courier</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4 text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {medicineBookings.map((booking) => (
                              <TableRow key={booking._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <TableCell className="py-3 px-4">
                                  <span className="font-medium text-gray-900">
                                    {booking.consignmentNumber || booking.bookingReference}
                                  </span>
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <div>
                                    <div className="font-medium text-gray-900">{booking.origin.name}</div>
                                    <div className="text-sm text-gray-500">{booking.origin.city}, {booking.origin.state}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <div>
                                    <div className="font-medium text-gray-900">{booking.destination.name}</div>
                                    <div className="text-sm text-gray-500">{booking.destination.city}, {booking.destination.state}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-sm">{booking.shipment.actualWeight || 'N/A'} kg</TableCell>
                                <TableCell className="py-3 px-4 text-sm">{booking.package.totalPackages || 'N/A'}</TableCell>
                                <TableCell className="py-3 px-4">
                                  <span className="font-medium text-gray-900">₹{parseFloat(booking.invoice.invoiceValue || '0').toFixed(2)}</span>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-sm text-gray-500">{formatDate(booking.createdAt)}</TableCell>
                                <TableCell className="py-3 px-4">
                                  {booking.assignedCourierBoyId ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3 text-green-600" />
                                        <span className="font-medium text-green-600 text-sm">
                                          {typeof booking.assignedCourierBoyId === 'object'
                                            ? booking.assignedCourierBoyId.fullName
                                            : 'Assigned'}
                                        </span>
                                      </div>
                                      {typeof booking.assignedCourierBoyId === 'object' && booking.assignedCourierBoyId.phone && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                          <Phone className="h-3 w-3" />
                                          <span>{booking.assignedCourierBoyId.phone}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit text-xs">
                                      <AlertCircle className="h-3 w-3" />
                                      Not Assigned
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <div className="flex items-center justify-center">
                                    {booking.assignedCourierBoyId ? (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Assigned
                                      </Badge>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAssignMedicineClick([booking._id])}
                                        className="h-7 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300"
                                      >
                                        <Truck className="h-3 w-3 mr-1" />
                                        Assign
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Customer Pickup Tab */}
            <TabsContent value="customer-pickup" className="space-y-4">
              {loadingCustomerBookings ? (
                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading customer bookings...</p>
                  </CardContent>
                </Card>
              ) : customerBookings.length === 0 ? (
                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Customer Bookings Available
                    </h3>
                    <p className="text-gray-600 mb-4">
                      There are no customer bookings with "booked" status that need pickup assignment.
                    </p>
                    <Button onClick={fetchCustomerBookings} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Customer Bookings (currentStatus: "booked")
                      </h3>
                      <p className="text-sm text-gray-600">
                        {customerBookings.length} booking(s) with currentStatus "booked" • {' '}
                        {customerBookings.filter(b => !b.assignedCourierBoy?.courierBoyId && !b.assignedCourierBoy?.fullName).length} unassigned
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const unassignedBookings = customerBookings.filter(
                          b => !b.assignedCourierBoy?.courierBoyId && !b.assignedCourierBoy?.fullName
                        );
                        if (unassignedBookings.length > 0) {
                          setSelectedCustomerBookingIds(unassignedBookings.map(b => b._id));
                          setSelectedCourierBoyId('');
                          setShowCustomerPickupModal(true);
                          fetchCourierBoys();
                        }
                      }}
                      disabled={
                        customerBookings.filter(
                          b => !b.assignedCourierBoy?.courierBoyId && !b.assignedCourierBoy?.fullName
                        ).length === 0
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Assign All Unassigned
                    </Button>
                  </div>

                  <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-gray-200">
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Consignment</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Origin</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Destination</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Weight</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Packages</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Amount</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Payment Status</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Booked Date</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4">Assigned Courier</TableHead>
                              <TableHead className="font-medium text-gray-700 py-3 px-4 text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerBookings.map((booking) => (
                              <TableRow key={booking._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <TableCell className="py-3 px-4">
                                  <span className="font-medium text-gray-900">
                                    {booking.consignmentNumber || booking.bookingReference || booking._id}
                                  </span>
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <div>
                                    <div className="font-medium text-gray-900">{booking.origin.name}</div>
                                    <div className="text-sm text-gray-500">{booking.origin.city}, {booking.origin.state}</div>
                                    <div className="text-xs text-gray-400">{booking.origin.mobileNumber}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <div>
                                    <div className="font-medium text-gray-900">{booking.destination.name}</div>
                                    <div className="text-sm text-gray-500">{booking.destination.city}, {booking.destination.state}</div>
                                    <div className="text-xs text-gray-400">{booking.destination.mobileNumber}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-sm">{booking.actualWeight || booking.shipment?.weight || 'N/A'} kg</TableCell>
                                <TableCell className="py-3 px-4 text-sm">{booking.shipment?.packagesCount || 'N/A'}</TableCell>
                                <TableCell className="py-3 px-4">
                                  <span className="font-medium text-gray-900">₹{booking.totalAmount?.toFixed(2) || booking.calculatedPrice?.toFixed(2) || '0.00'}</span>
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <Badge
                                    variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}
                                    className={
                                      booking.paymentStatus === 'paid'
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : booking.paymentStatus === 'failed'
                                        ? 'bg-red-100 text-red-700 border-red-200'
                                        : booking.paymentStatus === 'refunded'
                                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    }
                                  >
                                    {booking.paymentStatus === 'paid' ? (
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                    ) : booking.paymentStatus === 'failed' ? (
                                      <XCircle className="h-3 w-3 mr-1" />
                                    ) : (
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                    )}
                                    {booking.paymentStatus || 'pending'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-sm text-gray-500">
                                  {booking.BookedAt ? formatDate(booking.BookedAt) : formatDate(booking.createdAt)}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {booking.assignedCourierBoy?.courierBoyId || booking.assignedCourierBoy?.fullName ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3 text-green-600" />
                                        <span className="font-medium text-green-600 text-sm">
                                          {booking.assignedCourierBoy?.fullName || 'Assigned'}
                                        </span>
                                      </div>
                                      {booking.assignedCourierBoy?.phone && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                          <Phone className="h-3 w-3" />
                                          <span>{booking.assignedCourierBoy.phone}</span>
                                        </div>
                                      )}
                                      {booking.assignedCourierBoyAt && (
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                          <Calendar className="h-3 w-3" />
                                          <span>Assigned: {formatDate(booking.assignedCourierBoyAt)}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit text-xs">
                                      <AlertCircle className="h-3 w-3" />
                                      Not Assigned
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <div className="flex items-center justify-center">
                                    {booking.assignedCourierBoy?.courierBoyId || booking.assignedCourierBoy?.fullName ? (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Assigned
                                      </Badge>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedCustomerBookingIds([booking._id]);
                                          setSelectedCourierBoyId('');
                                          setShowCustomerPickupModal(true);
                                          fetchCourierBoys();
                                        }}
                                        className="h-7 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300"
                                      >
                                        <Truck className="h-3 w-3 mr-1" />
                                        Assign
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Customer Booking Coloader Tab */}
            <TabsContent value="customer-booking-coloader" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-indigo-100 rounded-md">
                        <Truck className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Coloaders</p>
                        <p className="text-2xl font-bold text-gray-900">{customerBookingColoaderGroups.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-md">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Assigned Bookings</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {customerBookingColoaderGroups.reduce((sum, group) => sum + group.bookings.length, 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-emerald-100 rounded-md">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Status Filter</p>
                        <p className="text-2xl font-bold text-gray-900">Assigned</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {renderCustomerBookingColoaderGroups()}
            </TabsContent>

            {/* Assigned Tab */}
            <TabsContent value="assigned" className="space-y-4">
              {renderCorporateGroupsList(assignedGroups, true)}
            </TabsContent>
          </Tabs>
        </div>

        {/* Assign Courier Modal */}
      <Dialog open={showAssignModal} onOpenChange={(open) => {
        if (!open && !assigning) {
          setShowAssignModal(false);
          setSelectedCorporateGroup(null);
          setSelectedShipmentIds([]);
          setSelectedCourierBoyId('');
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-600">
              <Truck className="h-5 w-5 mr-2" />
              Assign Courier Boy
            </DialogTitle>
          </DialogHeader>

          {selectedCorporateGroup && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Corporate Details
                </label>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <p className="text-sm">
                      <span className="font-medium">Company:</span> {selectedCorporateGroup.corporate.companyName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Corporate ID:</span>
                    <Badge variant="outline">{selectedCorporateGroup.corporate.corporateId}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <p className="text-sm">{selectedCorporateGroup.corporate.contactNumber}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-200">
                    <Package className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-semibold">
                      <span className="font-medium">Shipments to assign:</span> {selectedShipmentIds.length} shipment(s)
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Select Courier Boy
                </label>
                {loadingCourierBoys ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">Loading courier boys...</span>
                  </div>
                ) : courierBoys.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No approved courier boys available</p>
                  </div>
                ) : (
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {courierBoys.map((courier) => (
                      <div
                        key={courier._id}
                        onClick={() => setSelectedCourierBoyId(courier._id)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${selectedCourierBoyId === courier._id ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <p className="font-medium text-gray-900">{courier.fullName}</p>
                              {selectedCourierBoyId === courier._id && (
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 ml-6">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="h-3 w-3" />
                                <span>{courier.phone}</span>
                              </div>
                              {courier.area && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <MapPin className="h-3 w-3" />
                                  <span>{courier.area}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedCorporateGroup(null);
                    setSelectedShipmentIds([]);
                    setSelectedCourierBoyId('');
                  }}
                  disabled={assigning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignCourier}
                  disabled={!selectedCourierBoyId || assigning || selectedShipmentIds.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Assign to {selectedShipmentIds.length} Shipment(s)
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Medicine Delivery Courier Modal */}
      <Dialog open={showMedicineAssignModal} onOpenChange={(open) => {
        if (!open && !assigning) {
          setShowMedicineAssignModal(false);
          setSelectedMedicineBookingIds([]);
          setSelectedCourierBoyId('');
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-600">
              <Truck className="h-5 w-5 mr-2" />
              Assign Delivery Courier Boy
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Medicine Orders Details
              </label>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold">
                    <span className="font-medium">Medicine orders to assign for delivery:</span> {selectedMedicineBookingIds.length} order(s)
                  </p>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  These are medicine orders with "Arrived" status that need delivery courier assignment.
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Delivery Courier Boy
              </label>
              {loadingCourierBoys ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Loading courier boys...</span>
                </div>
              ) : courierBoys.length === 0 ? (
                <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No approved courier boys available</p>
                </div>
              ) : (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {courierBoys.map((courier) => (
                    <div
                      key={courier._id}
                      onClick={() => setSelectedCourierBoyId(courier._id)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${selectedCourierBoyId === courier._id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <p className="font-medium text-gray-900">{courier.fullName}</p>
                            {selectedCourierBoyId === courier._id && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 ml-6">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{courier.phone}</span>
                            </div>
                            {courier.area && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span>{courier.area}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMedicineAssignModal(false);
                  setSelectedMedicineBookingIds([]);
                  setSelectedCourierBoyId('');
                }}
                disabled={assigning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignMedicineDelivery}
                disabled={!selectedCourierBoyId || assigning || selectedMedicineBookingIds.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    Assign to {selectedMedicineBookingIds.length} Medicine Order(s)
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Courier Boy for Coloader Shipments */}
      <Dialog open={showColoaderAssignModal} onOpenChange={(open) => {
        if (!open && !assigning) {
          setShowColoaderAssignModal(false);
          setSelectedColoaderGroup(null);
          setSelectedTrackingIds([]);
          setSelectedCustomerBookingColoaderIds([]);
          setSelectedCourierBoyId('');
          resetColoaderAddressState();
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-600">
              <Truck className="h-5 w-5 mr-2" />
              Assign Courier Boy
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedColoaderGroup && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Coloader & Tracking Details
                </label>
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-indigo-600" />
                    <p className="text-sm">
                      <span className="font-medium">Coloader:</span> {selectedColoaderGroup.coloaderName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-indigo-600" />
                    <p className="text-sm font-semibold">
                      <span className="font-medium">Records selected:</span> {selectedTrackingIds.length + selectedCustomerBookingColoaderIds.length} ({selectedTrackingIds.length} corporate{selectedTrackingIds.length !== 1 ? 's' : ''}, {selectedCustomerBookingColoaderIds.length} customer{selectedCustomerBookingColoaderIds.length !== 1 ? 's' : ''})
                    </p>
                  </div>
                  <div className="pt-2 border-t border-indigo-100">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Consignments</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedColoaderGroup.shipments
                        .filter((shipment) => selectedTrackingIds.includes(shipment._id))
                        .map((shipment) => (
                          <Badge key={shipment._id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Corporate: {shipment.consignmentNumber || shipment.bookingReference || 'N/A'}
                          </Badge>
                        ))}
                      {selectedColoaderGroup.bookings
                        .filter((booking) => selectedCustomerBookingColoaderIds.includes(booking._id))
                        .map((booking) => (
                          <Badge key={booking._id} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Customer: {booking.consignmentNumber || booking.bookingReference || 'N/A'}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Courier Boy
              </label>
              {loadingCourierBoys ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Loading courier boys...</span>
                </div>
              ) : courierBoys.length === 0 ? (
                <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No approved courier boys available</p>
                </div>
              ) : (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {courierBoys.map((courier) => (
                    <div
                      key={courier._id}
                      onClick={() => setSelectedCourierBoyId(courier._id)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${selectedCourierBoyId === courier._id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <p className="font-medium text-gray-900">{courier.fullName}</p>
                            {selectedCourierBoyId === courier._id && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 ml-6">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{courier.phone}</span>
                            </div>
                            {courier.area && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span>{courier.area}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <Building className="h-4 w-4" />
                Select Coloader Address
              </label>
              {loadingColoaderAddresses ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Loading coloader addresses...</span>
                </div>
              ) : coloaderAddressesError ? (
                <div className="p-6 border border-red-200 rounded-lg bg-red-50 text-red-700 text-sm">
                  {coloaderAddressesError}
                </div>
              ) : coloaderAddressOptions.length === 0 ? (
                <div className="p-6 border border-gray-200 rounded-lg text-sm text-gray-600">
                  No addresses found for this coloader. Please update the coloader profile.
                </div>
              ) : (
                <RadioGroup
                  value={selectedAddressOptionId}
                  onValueChange={setSelectedAddressOptionId}
                  className="space-y-3"
                >
                  {coloaderAddressOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-start gap-3 border rounded-lg p-4 cursor-pointer hover:border-blue-400 transition"
                    >
                      <RadioGroupItem value={option.id} className="mt-1" />
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">
                          {option.label}
                        </p>
                        <p className="text-sm text-gray-600">
                          {option.subtitle}
                        </p>
                        <div className="text-xs text-gray-500 space-y-0.5">
                          {option.details.flatNo && option.details.address && (
                            <p>{option.details.flatNo}, {option.details.address}</p>
                          )}
                          {option.details.landmark && (
                            <p>Landmark: {option.details.landmark}</p>
                          )}
                          {(option.details.concernPerson || option.details.mobile) && (
                            <p>
                              {option.details.concernPerson && <span className="mr-2">Concern: {option.details.concernPerson}</span>}
                              {option.details.mobile && <span>Phone: {option.details.mobile}</span>}
                            </p>
                          )}
                          {option.details.email && <p>Email: {option.details.email}</p>}
                          {option.details.gst && <p>GST: {option.details.gst}</p>}
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button
                variant="outline"
                  onClick={() => {
                    setShowColoaderAssignModal(false);
                    setSelectedColoaderGroup(null);
                    setSelectedTrackingIds([]);
                    setSelectedCustomerBookingColoaderIds([]);
                    setSelectedCourierBoyId('');
                    resetColoaderAddressState();
                  }}
                disabled={assigning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignCourierToTracking}
                disabled={
                  !selectedCourierBoyId ||
                  !selectedAddressOptionId ||
                  assigning ||
                  (selectedTrackingIds.length === 0 && selectedCustomerBookingColoaderIds.length === 0) ||
                  loadingColoaderAddresses
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    Assign to {selectedTrackingIds.length + selectedCustomerBookingColoaderIds.length} Record(s)
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Customer Pickup Courier Modal */}
      <Dialog open={showCustomerPickupModal} onOpenChange={(open) => {
        if (!open && !assigning) {
          setShowCustomerPickupModal(false);
          setSelectedCustomerBookingIds([]);
          setSelectedCourierBoyId('');
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-600">
              <Truck className="h-5 w-5 mr-2" />
              Assign Pickup Courier Boy
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Customer Booking Details
              </label>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold">
                    <span className="font-medium">Customer bookings to assign for pickup:</span> {selectedCustomerBookingIds.length} booking(s)
                  </p>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  These are customer bookings with "booked" status that need pickup courier assignment.
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Pickup Courier Boy
              </label>
              {loadingCourierBoys ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Loading courier boys...</span>
                </div>
              ) : courierBoys.length === 0 ? (
                <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No approved courier boys available</p>
                </div>
              ) : (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {courierBoys.map((courier) => (
                    <div
                      key={courier._id}
                      onClick={() => setSelectedCourierBoyId(courier._id)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${selectedCourierBoyId === courier._id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <p className="font-medium text-gray-900">{courier.fullName}</p>
                            {selectedCourierBoyId === courier._id && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 ml-6">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{courier.phone}</span>
                            </div>
                            {courier.area && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span>{courier.area}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomerPickupModal(false);
                  setSelectedCustomerBookingIds([]);
                  setSelectedCourierBoyId('');
                }}
                disabled={assigning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignCustomerPickup}
                disabled={!selectedCourierBoyId || assigning || selectedCustomerBookingIds.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    Assign to {selectedCustomerBookingIds.length} Customer Booking(s)
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Courier Boy for Customer Booking Coloader Shipments */}
      <Dialog open={showCustomerBookingColoaderModal} onOpenChange={(open) => {
        if (!open && !assigning) {
          setShowCustomerBookingColoaderModal(false);
          setSelectedCustomerBookingColoaderGroup(null);
          setSelectedCustomerBookingColoaderIds([]);
          setSelectedCourierBoyId('');
          resetColoaderAddressState();
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-600">
              <Truck className="h-5 w-5 mr-2" />
              Assign Courier Boy
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedCustomerBookingColoaderGroup && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Coloader & Customer Booking Details
                </label>
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-indigo-600" />
                    <p className="text-sm">
                      <span className="font-medium">Coloader:</span> {selectedCustomerBookingColoaderGroup.coloaderName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-indigo-600" />
                    <p className="text-sm font-semibold">
                      <span className="font-medium">Customer bookings selected:</span> {selectedCustomerBookingColoaderIds.length}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-indigo-100">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Consignments</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomerBookingColoaderGroup.bookings
                        .filter((booking) => selectedCustomerBookingColoaderIds.includes(booking._id))
                        .map((booking) => (
                          <Badge key={booking._id} variant="outline" className="bg-white text-gray-700 border-gray-200">
                            {booking.consignmentNumber || booking.bookingReference || 'N/A'}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Courier Boy
              </label>
              {loadingCourierBoys ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Loading courier boys...</span>
                </div>
              ) : courierBoys.length === 0 ? (
                <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No approved courier boys available</p>
                </div>
              ) : (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {courierBoys.map((courier) => (
                    <div
                      key={courier._id}
                      onClick={() => setSelectedCourierBoyId(courier._id)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${selectedCourierBoyId === courier._id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <p className="font-medium text-gray-900">{courier.fullName}</p>
                            {selectedCourierBoyId === courier._id && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 ml-6">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{courier.phone}</span>
                            </div>
                            {courier.area && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span>{courier.area}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <Building className="h-4 w-4" />
                Select Coloader Address
              </label>
              {loadingColoaderAddresses ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Loading coloader addresses...</span>
                </div>
              ) : coloaderAddressesError ? (
                <div className="p-6 border border-red-200 rounded-lg bg-red-50 text-red-700 text-sm">
                  {coloaderAddressesError}
                </div>
              ) : coloaderAddressOptions.length === 0 ? (
                <div className="p-6 border border-gray-200 rounded-lg text-sm text-gray-600">
                  No addresses found for this coloader. Please update the coloader profile.
                </div>
              ) : (
                <RadioGroup
                  value={selectedAddressOptionId}
                  onValueChange={setSelectedAddressOptionId}
                  className="space-y-3"
                >
                  {coloaderAddressOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-start gap-3 border rounded-lg p-4 cursor-pointer hover:border-blue-400 transition"
                    >
                      <RadioGroupItem value={option.id} className="mt-1" />
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">
                          {option.label}
                        </p>
                        <p className="text-sm text-gray-600">
                          {option.subtitle}
                        </p>
                        <div className="text-xs text-gray-500 space-y-0.5">
                          {option.details.flatNo && option.details.address && (
                            <p>{option.details.flatNo}, {option.details.address}</p>
                          )}
                          {option.details.landmark && (
                            <p>Landmark: {option.details.landmark}</p>
                          )}
                          {(option.details.concernPerson || option.details.mobile) && (
                            <p>
                              {option.details.concernPerson && <span className="mr-2">Concern: {option.details.concernPerson}</span>}
                              {option.details.mobile && <span>Phone: {option.details.mobile}</span>}
                            </p>
                          )}
                          {option.details.email && <p>Email: {option.details.email}</p>}
                          {option.details.gst && <p>GST: {option.details.gst}</p>}
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomerBookingColoaderModal(false);
                  setSelectedCustomerBookingColoaderGroup(null);
                  setSelectedCustomerBookingColoaderIds([]);
                  setSelectedCourierBoyId('');
                  resetColoaderAddressState();
                }}
                disabled={assigning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignCourierToCustomerBooking}
                disabled={
                  !selectedCourierBoyId ||
                  !selectedAddressOptionId ||
                  assigning ||
                  selectedCustomerBookingColoaderIds.length === 0 ||
                  loadingColoaderAddresses
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    Assign to {selectedCustomerBookingColoaderIds.length} Booking(s)
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default AssignCourierBoy;
