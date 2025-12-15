import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';
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

  const fetchUndelivered = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        status: 'undelivered',
        limit: '100'
      });

      const response = await fetch(`/api/admin/tracking?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch undelivered consignments (status ${response.status})`);
      }

      const result = await response.json();
      const records: UndeliveredTracking[] = result.data || [];
      setData(records);
    } catch (err) {
      console.error('Error fetching undelivered consignments:', err);
      setError('Failed to load undelivered consignments.');
      toast({
        title: 'Error',
        description: 'Failed to load undelivered consignments. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUndelivered();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Undelivered Consignments</h1>
              <p className="mt-1 text-xs text-gray-600">
                Showing consignments from the <span className="font-semibold">'trackings'</span>{' '}
                collection where <code>currentStatus = &quot;undelivered&quot;</code>.
              </p>
            </div>
            <Button
              onClick={fetchUndelivered}
              disabled={loading}
              className="h-9 bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
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
                  Loading undelivered consignments...
                </TableCell>
              </TableRow>
            )}

            {!loading && filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-gray-500">
                  No undelivered consignments found.
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
                          RTO
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-xs"
                        >
                          Reverse
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
};

export default Undelivered;
