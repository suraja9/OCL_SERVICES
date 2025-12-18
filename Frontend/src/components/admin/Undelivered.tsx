import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, Search, ChevronDown, ChevronUp, Truck, UserX, Phone, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

interface UndeliveredTracking {
  _id: string;
  consignmentNumber: number | string;
  bookingReference?: string;
  assignmentType?: string;
  currentStatus?: string;
  OFD?: Array<{
    courierBoyName?: string;
    courierBoyPhone?: string;
    receiverName?: string;
    destination?: {
      name?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    finalPrice?: number;
  }>;
  booked?: Array<{
    corporateInfo?: {
      companyName?: string;
      contactNumber?: string;
    };
    originData?: {
      city?: string;
      state?: string;
    };
    destinationData?: {
      name?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  }>;
  unreachable?: {
    attempts?: Array<{
      at?: string | { $date?: string };
      reason?: string;
      courierBoyName?: string;
      courierBoyPhone?: string;
      location?: {
        latitude?: number;
        longitude?: number;
        address?: string;
      };
    }>;
    count?: number;
  };
  statusHistory?: Array<{
    status?: string;
    timestamp?: string | { $date?: string };
    notes?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

const Undelivered: React.FC = () => {
  const [data, setData] = useState<UndeliveredTracking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('not-delivered');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    consignmentNumber: string | number;
    action: 'rto' | 'reserve' | null;
  }>({
    open: false,
    consignmentNumber: '',
    action: null,
  });
  const [updating, setUpdating] = useState(false);
  
  // Courier boy assignment state
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<UndeliveredTracking | null>(null);
  const [courierBoys, setCourierBoys] = useState<Array<{
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    area: string;
    pincode: string;
    locality: string;
    building: string;
  }>>([]);
  const [selectedCourierBoyId, setSelectedCourierBoyId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  
  const { toast } = useToast();

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const fetchUndelivered = async (status: string = 'undelivered') => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        status: status,
        limit: '100'
      });

      const response = await fetch(`/api/admin/tracking?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consignments (status ${response.status})`);
      }

      const result = await response.json();
      const records: UndeliveredTracking[] = result.data || [];
      setData(records);
    } catch (err) {
      console.error('Error fetching consignments:', err);
      setError('Failed to load consignments.');
      toast({
        title: 'Error',
        description: 'Failed to load consignments. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const statusMap: Record<string, string> = {
      'not-delivered': 'undelivered',
      'rto': 'rto',
      'reserve': 'reserve'
    };
    fetchUndelivered(statusMap[activeTab] || 'undelivered');
  }, [activeTab]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const q = searchTerm.toLowerCase().trim();

    return data.filter((item) => {
      const consignment = item.consignmentNumber?.toString().toLowerCase() || '';
      const bookingRef = item.bookingReference?.toLowerCase() || '';
      const corporate =
        item.booked?.[0]?.corporateInfo?.companyName?.toLowerCase() || '';
      const receiverName =
        item.OFD?.[0]?.receiverName?.toLowerCase() ||
        item.booked?.[0]?.destinationData?.name?.toLowerCase() ||
        '';
      const receiverCity =
        item.OFD?.[0]?.destination?.city?.toLowerCase() ||
        item.booked?.[0]?.destinationData?.city?.toLowerCase() ||
        '';
      const courierName = item.OFD?.[0]?.courierBoyName?.toLowerCase() || '';
      const lastReason =
        item.unreachable?.attempts?.[item.unreachable.attempts.length - 1]?.reason?.toLowerCase() ||
        item.statusHistory
          ?.slice()
          .reverse()
          .find((h) => h.status === 'undelivered')
          ?.notes?.toLowerCase() ||
        '';

      return (
        consignment.includes(q) ||
        bookingRef.includes(q) ||
        corporate.includes(q) ||
        receiverName.includes(q) ||
        receiverCity.includes(q) ||
        courierName.includes(q) ||
        lastReason.includes(q)
      );
    });
  }, [data, searchTerm]);

  const formatDate = (value?: any) => {
    if (!value) return '-';

    const dateString =
      typeof value === 'string'
        ? value
        : typeof value === 'object' && '$date' in value
        ? (value.$date as string)
        : undefined;

    if (!dateString) return '-';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  };

  const getStatusLabel = () => {
    const statusMap: Record<string, string> = {
      'not-delivered': 'undelivered',
      'rto': 'rto',
      'reserve': 'reserve'
    };
    return statusMap[activeTab] || 'undelivered';
  };

  const getTabTitle = () => {
    const titleMap: Record<string, string> = {
      'not-delivered': 'Not Delivered Consignments',
      'rto': 'RTO Consignments',
      'reserve': 'Reserve Consignments'
    };
    return titleMap[activeTab] || 'Not Delivered Consignments';
  };

  const handleRefresh = () => {
    fetchUndelivered(getStatusLabel());
  };

  const handleStatusUpdate = async (consignmentNumber: string | number, newStatus: 'rto' | 'reserve') => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('adminToken');

      const response = await fetch('/api/admin/tracking/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          consignmentNumber,
          newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: result.message || `Status updated to ${newStatus.toUpperCase()} successfully.`,
        variant: 'default'
      });

      // Close dialog and refresh data
      setConfirmDialog({ open: false, consignmentNumber: '', action: null });
      fetchUndelivered(getStatusLabel());
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update status. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const openConfirmDialog = (consignmentNumber: string | number, action: 'rto' | 'reserve') => {
    setConfirmDialog({
      open: true,
      consignmentNumber,
      action
    });
  };

  const handleConfirm = () => {
    if (confirmDialog.action && confirmDialog.consignmentNumber) {
      handleStatusUpdate(confirmDialog.consignmentNumber, confirmDialog.action);
    }
  };

  // Courier boy assignment functions
  const fetchCourierBoys = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/courier-boys/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCourierBoys(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching courier boys:', error);
    }
  };

  useEffect(() => {
    if (isAssignDialogOpen) {
      fetchCourierBoys();
    }
  }, [isAssignDialogOpen]);

  const handleAssignClick = (order: UndeliveredTracking) => {
    setSelectedOrder(order);
    setSelectedCourierBoyId('');
    setIsAssignDialogOpen(true);
  };

  const handleAssignCourier = async () => {
    if (!selectedOrder || !selectedCourierBoyId) return;

    setAssigning(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/tracking/reserve/assign-courier-boy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          trackingId: selectedOrder._id,
          courierBoyId: selectedCourierBoyId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign courier boy');
      }

      toast({
        title: 'Success',
        description: 'Courier boy assigned successfully',
      });

      setIsAssignDialogOpen(false);
      fetchUndelivered(getStatusLabel()); // Refresh list
    } catch (error: any) {
      console.error('Error assigning courier boy:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign courier boy',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{getTabTitle()}</h1>
              <p className="mt-1 text-xs text-gray-600">
                Showing consignments from the <span className="font-semibold">'trackings'</span>{' '}
                collection where <code>currentStatus = &quot;{getStatusLabel()}&quot;</code>.
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              className="h-9 bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <TabsList className="grid w-full grid-cols-3 h-auto min-h-[40px] bg-gray-100 rounded-lg gap-1 p-1">
              <TabsTrigger
                value="not-delivered"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all px-4 py-2 flex items-center justify-center rounded-md"
              >
                Not Delivered
              </TabsTrigger>
              <TabsTrigger
                value="rto"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all px-4 py-2 flex items-center justify-center rounded-md"
              >
                RTO
              </TabsTrigger>
              <TabsTrigger
                value="reserve"
                className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all px-4 py-2 flex items-center justify-center rounded-md"
              >
                Reserve
              </TabsTrigger>
            </TabsList>
          </div>

        {/* Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="h-9 rounded-md border-gray-300 pl-9 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Search consignment, receiver, courier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <span>
                Total:{' '}
                <span className="font-semibold text-gray-900">
                  {data.length}
                </span>
              </span>
              <span>
                Showing:{' '}
                <span className="font-semibold text-gray-900">
                  {filteredData.length}
                </span>{' '}
                {searchTerm && <span className="text-gray-500">(filtered)</span>}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

          {/* Table */}
          <TabsContent value="not-delivered" className="mt-0">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Consignment</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Corporate / Assignment</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Last unreachable reason</TableHead>
                    <TableHead className="w-[160px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-sm text-gray-500">
                        Loading not delivered consignments...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-sm text-gray-500">
                        No not delivered consignments found.
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    filteredData.map((item) => {
                      const booking = item.booked?.[0];
                      const ofd = item.OFD?.[0];
                      const unreachableAttempts = item.unreachable?.attempts || [];

                      const receiverName =
                        ofd?.receiverName || booking?.destinationData?.name || 'N/A';
                      const receiverCity =
                        ofd?.destination?.city || booking?.destinationData?.city || '';
                      const receiverState =
                        ofd?.destination?.state || booking?.destinationData?.state || '';
                      const receiverPincode =
                        ofd?.destination?.pincode || booking?.destinationData?.pincode || '';

                      const corporateName =
                        (booking?.corporateInfo as any)?.companyName ||
                        (booking?.corporateInfo as any)?.name ||
                        'N/A';
                      const originCity = booking?.originData?.city || '';
                      const originState = booking?.originData?.state || '';

                      return (
                        <TableRow
                          key={item._id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {item.consignmentNumber || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">{receiverName}</div>
                              <div className="text-xs text-gray-500">
                                {[receiverCity, receiverState, receiverPincode].filter(Boolean).join(', ') ||
                                  '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">{corporateName}</div>
                              <div className="text-xs text-gray-500">
                                {originCity && originState
                                  ? `${originCity}, ${originState}`
                                  : originCity || originState || '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">
                                {ofd?.courierBoyName || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {ofd?.courierBoyPhone || '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {unreachableAttempts.length > 0 ? (
                              <div className="space-y-1">
                                {expandedRows.has(item._id) ? (
                                  <div className="space-y-1.5">
                                    {unreachableAttempts.map((attempt, idx) => (
                                      <div key={idx} className="space-y-0.5">
                                        <div className="text-xs text-gray-900">
                                          Attempt {idx + 1}: {attempt.reason || '-'}
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                          {attempt.at ? formatDate(attempt.at) : '-'}
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                          {attempt.location?.address || '-'}
                                        </div>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => toggleRow(item._id)}
                                      className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
                                    >
                                      <ChevronUp className="h-3 w-3" />
                                      Show less
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="text-xs text-gray-900">
                                      {unreachableAttempts[unreachableAttempts.length - 1]?.reason || '-'}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      {unreachableAttempts[unreachableAttempts.length - 1]?.at
                                        ? formatDate(unreachableAttempts[unreachableAttempts.length - 1].at)
                                        : '-'}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      {unreachableAttempts[unreachableAttempts.length - 1]?.location?.address ||
                                        '-'}
                                    </div>
                                    {unreachableAttempts.length > 1 && (
                                      <button
                                        onClick={() => toggleRow(item._id)}
                                        className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                        Show all {unreachableAttempts.length} attempts
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">-</div>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={() => openConfirmDialog(item.consignmentNumber, 'rto')}
                                disabled={updating}
                              >
                                RTO
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={() => openConfirmDialog(item.consignmentNumber, 'reserve')}
                                disabled={updating}
                              >
                                Reserve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="rto" className="mt-0">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Consignment</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Corporate / Assignment</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Last unreachable reason</TableHead>
                    <TableHead className="w-[160px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-sm text-gray-500">
                        Loading RTO consignments...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-sm text-gray-500">
                        No RTO consignments found.
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    filteredData.map((item) => {
                      const booking = item.booked?.[0];
                      const ofd = item.OFD?.[0];
                      const unreachableAttempts = item.unreachable?.attempts || [];

                      const receiverName =
                        ofd?.receiverName || booking?.destinationData?.name || 'N/A';
                      const receiverCity =
                        ofd?.destination?.city || booking?.destinationData?.city || '';
                      const receiverState =
                        ofd?.destination?.state || booking?.destinationData?.state || '';
                      const receiverPincode =
                        ofd?.destination?.pincode || booking?.destinationData?.pincode || '';

                      const corporateName =
                        (booking?.corporateInfo as any)?.companyName ||
                        (booking?.corporateInfo as any)?.name ||
                        'N/A';
                      const originCity = booking?.originData?.city || '';
                      const originState = booking?.originData?.state || '';

                      return (
                        <TableRow
                          key={item._id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {item.consignmentNumber || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">{receiverName}</div>
                              <div className="text-xs text-gray-500">
                                {[receiverCity, receiverState, receiverPincode].filter(Boolean).join(', ') ||
                                  '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">{corporateName}</div>
                              <div className="text-xs text-gray-500">
                                {originCity && originState
                                  ? `${originCity}, ${originState}`
                                  : originCity || originState || '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">
                                {ofd?.courierBoyName || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {ofd?.courierBoyPhone || '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {unreachableAttempts.length > 0 ? (
                              <div className="space-y-1">
                                {expandedRows.has(item._id) ? (
                                  <div className="space-y-1.5">
                                    {unreachableAttempts.map((attempt, idx) => (
                                      <div key={idx} className="space-y-0.5">
                                        <div className="text-xs text-gray-900">
                                          Attempt {idx + 1}: {attempt.reason || '-'}
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                          {attempt.at ? formatDate(attempt.at) : '-'}
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                          {attempt.location?.address || '-'}
                                        </div>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => toggleRow(item._id)}
                                      className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
                                    >
                                      <ChevronUp className="h-3 w-3" />
                                      Show less
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="text-xs text-gray-900">
                                      {unreachableAttempts[unreachableAttempts.length - 1]?.reason || '-'}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      {unreachableAttempts[unreachableAttempts.length - 1]?.at
                                        ? formatDate(unreachableAttempts[unreachableAttempts.length - 1].at)
                                        : '-'}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      {unreachableAttempts[unreachableAttempts.length - 1]?.location?.address ||
                                        '-'}
                                    </div>
                                    {unreachableAttempts.length > 1 && (
                                      <button
                                        onClick={() => toggleRow(item._id)}
                                        className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                        Show all {unreachableAttempts.length} attempts
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">-</div>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs"
                              >
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
          </TabsContent>

          <TabsContent value="reserve" className="mt-0">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Consignment</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Corporate / Assignment</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Last unreachable reason</TableHead>
                    <TableHead className="w-[160px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-sm text-gray-500">
                        Loading reserve consignments...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-sm text-gray-500">
                        No reserve consignments found.
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    filteredData.map((item) => {
                      const booking = item.booked?.[0];
                      const ofd = item.OFD?.[0];
                      const unreachableAttempts = item.unreachable?.attempts || [];

                      const receiverName =
                        ofd?.receiverName || booking?.destinationData?.name || 'N/A';
                      const receiverCity =
                        ofd?.destination?.city || booking?.destinationData?.city || '';
                      const receiverState =
                        ofd?.destination?.state || booking?.destinationData?.state || '';
                      const receiverPincode =
                        ofd?.destination?.pincode || booking?.destinationData?.pincode || '';

                      const corporateName =
                        (booking?.corporateInfo as any)?.companyName ||
                        (booking?.corporateInfo as any)?.name ||
                        'N/A';
                      const originCity = booking?.originData?.city || '';
                      const originState = booking?.originData?.state || '';

                      return (
                        <TableRow
                          key={item._id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {item.consignmentNumber || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">{receiverName}</div>
                              <div className="text-xs text-gray-500">
                                {[receiverCity, receiverState, receiverPincode].filter(Boolean).join(', ') ||
                                  '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">{corporateName}</div>
                              <div className="text-xs text-gray-500">
                                {originCity && originState
                                  ? `${originCity}, ${originState}`
                                  : originCity || originState || '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">
                                {ofd?.courierBoyName || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {ofd?.courierBoyPhone || '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {unreachableAttempts.length > 0 ? (
                              <div className="space-y-1">
                                {expandedRows.has(item._id) ? (
                                  <div className="space-y-1.5">
                                    {unreachableAttempts.map((attempt, idx) => (
                                      <div key={idx} className="space-y-0.5">
                                        <div className="text-xs text-gray-900">
                                          Attempt {idx + 1}: {attempt.reason || '-'}
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                          {attempt.at ? formatDate(attempt.at) : '-'}
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                          {attempt.location?.address || '-'}
                                        </div>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => toggleRow(item._id)}
                                      className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
                                    >
                                      <ChevronUp className="h-3 w-3" />
                                      Show less
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="text-xs text-gray-900">
                                      {unreachableAttempts[unreachableAttempts.length - 1]?.reason || '-'}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      {unreachableAttempts[unreachableAttempts.length - 1]?.at
                                        ? formatDate(unreachableAttempts[unreachableAttempts.length - 1].at)
                                        : '-'}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      {unreachableAttempts[unreachableAttempts.length - 1]?.location?.address ||
                                        '-'}
                                    </div>
                                    {unreachableAttempts.length > 1 && (
                                      <button
                                        onClick={() => toggleRow(item._id)}
                                        className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                        Show all {unreachableAttempts.length} attempts
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">-</div>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={() => handleAssignClick(item)}
                                disabled={assigning}
                              >
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
          </TabsContent>
        </Tabs>

        {/* Courier Boy Assignment Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-gray-50">
            <DialogHeader className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">Assign Courier Boy</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 mt-1">
                    Assign a courier boy for consignment #{selectedOrder?.consignmentNumber}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-700">Select Courier Boy</Label>
                <ScrollArea className="h-[400px] pr-4 -mr-4">
                  {courierBoys.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 space-y-3">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <UserX className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm">No approved courier boys found</p>
                    </div>
                  ) : (
                    <RadioGroup value={selectedCourierBoyId} onValueChange={setSelectedCourierBoyId} className="space-y-3 p-1">
                      {courierBoys.map((cb) => (
                        <Label
                          key={cb._id}
                          htmlFor={cb._id}
                          className={`flex items-start space-x-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:border-blue-400 hover:shadow-md ${selectedCourierBoyId === cb._id
                                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-sm'
                                  : 'border-gray-200 bg-white hover:bg-gray-50/50'
                                }`}
                        >
                          <RadioGroupItem value={cb._id} id={cb._id} className="mt-1" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900 text-base">{cb.fullName}</span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600 group">
                                <div className="p-1.5 bg-blue-100 rounded-md mr-2.5 group-hover:bg-blue-200 transition-colors">
                                  <Phone className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <span className="font-medium">{cb.phone}</span>
                              </div>

                              <div className="flex items-start text-sm text-gray-600 group">
                                <div className="p-1.5 bg-red-100 rounded-md mr-2.5 mt-0.5 group-hover:bg-red-200 transition-colors">
                                  <MapPin className="h-3.5 w-3.5 text-red-600 shrink-0" />
                                </div>
                                <span className="text-xs leading-relaxed text-gray-500">
                                  {[cb.building, cb.locality, cb.area, cb.pincode].filter(Boolean).join(', ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
                  )}
                </ScrollArea>
              </div>
            </div>
            <DialogFooter className="mt-4 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setIsAssignDialogOpen(false)}
                disabled={assigning}
                className="border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAssignCourier} 
                disabled={!selectedCourierBoyId || assigning}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {assigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => {
          if (!updating) {
            setConfirmDialog({ open, consignmentNumber: '', action: null });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Update</DialogTitle>
              <DialogDescription>
                Are you sure you want to change the status of consignment{' '}
                <span className="font-semibold">{confirmDialog.consignmentNumber}</span> from{' '}
                <span className="font-semibold">undelivered</span> to{' '}
                <span className="font-semibold">{confirmDialog.action === 'reserve' ? 'RESERVE' : confirmDialog.action?.toUpperCase()}</span>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ open: false, consignmentNumber: '', action: null })}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updating ? 'Updating...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Undelivered;
