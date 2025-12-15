import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Building2,
  Pill,
  Users,
  Search,
  Loader2,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getStoredToken } from '@/utils/auth';
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
    city: string;
    state: string;
  };
  destinationData: {
    name: string;
    companyName: string;
    mobileNumber: string;
    email: string;
    city: string;
    state: string;
  };
  invoiceData: {
    calculatedPrice: number;
    gst: number;
    finalPrice: number;
  };
  paymentStatus: 'paid' | 'unpaid';
  paymentType: 'FP' | 'TP';
  bookingDate: string;
}

interface CorporateGroup {
  corporate: {
    _id: string;
    corporateId: string;
    companyName: string;
    email: string;
    contactNumber: string;
  };
  bookings: ShipmentData[];
}

const CorporatePayments = () => {
  const [corporateGroups, setCorporateGroups] = useState<CorporateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'FP' | 'TP'>('TP');
  const { toast } = useToast();

  useEffect(() => {
    const fetchCorporateBookings = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/admin/corporate-bookings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch corporate bookings');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch corporate bookings');
        }
        
        if (!data.data || !Array.isArray(data.data)) {
          throw new Error('Invalid response format from server');
        }
        
        setCorporateGroups(data.data);
      } catch (error) {
        console.error('Error fetching corporate bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load corporate payments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCorporateBookings();
  }, [toast]);

  const filterBookings = (bookings: ShipmentData[]) => {
    return bookings.filter(booking => {
      const matchesSearch = 
        booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.consignmentNumber?.toString().includes(searchTerm) ||
        booking.originData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destinationData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.originData?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destinationData?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
      const matchesPaymentType = booking.paymentType === activeTab;
      
      return matchesSearch && matchesPayment && matchesPaymentType;
    });
  };

  const filteredCorporateGroups = corporateGroups.map(group => ({
    ...group,
    bookings: filterBookings(group.bookings)
  })).filter(group => group.bookings.length > 0);

  // For FP tab: Aggregate by corporate
  const aggregatedFPData = activeTab === 'FP' ? filteredCorporateGroups.reduce((acc, group) => {
    const corporateId = group.corporate._id;
    if (!acc[corporateId]) {
      acc[corporateId] = {
        corporate: group.corporate,
        totalAmount: 0,
        totalBookings: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        paidCount: 0,
        unpaidCount: 0,
      };
    }
    
    group.bookings.forEach(booking => {
      const amount = booking.invoiceData?.finalPrice || 0;
      acc[corporateId].totalAmount += amount;
      acc[corporateId].totalBookings += 1;
      
      if (booking.paymentStatus === 'paid') {
        acc[corporateId].paidAmount += amount;
        acc[corporateId].paidCount += 1;
      } else {
        acc[corporateId].unpaidAmount += amount;
        acc[corporateId].unpaidCount += 1;
      }
    });
    
    return acc;
  }, {} as Record<string, {
    corporate: CorporateGroup['corporate'];
    totalAmount: number;
    totalBookings: number;
    paidAmount: number;
    unpaidAmount: number;
    paidCount: number;
    unpaidCount: number;
  }>) : null;

  const aggregatedFPList = aggregatedFPData ? Object.values(aggregatedFPData).filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.corporate.companyName.toLowerCase().includes(search) ||
      item.corporate.email.toLowerCase().includes(search) ||
      item.corporate.corporateId.toLowerCase().includes(search)
    );
  }) : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  };

  const calculateTotals = () => {
    let totalAmount = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    filteredCorporateGroups.forEach(group => {
      group.bookings.forEach(booking => {
        const amount = booking.invoiceData?.finalPrice || 0;
        totalAmount += amount;
        
        if (booking.paymentStatus === 'paid') {
          paidAmount += amount;
          paidCount++;
        } else {
          unpaidAmount += amount;
          unpaidCount++;
        }
      });
    });

    return { totalAmount, paidAmount, unpaidAmount, paidCount, unpaidCount };
  };

  const totals = calculateTotals();
  const totalBookingsCount = activeTab === 'FP' 
    ? aggregatedFPList.reduce((sum, item) => sum + item.totalBookings, 0)
    : filteredCorporateGroups.reduce((sum, group) => sum + group.bookings.length, 0);

  const handleRefresh = () => {
    setLoading(true);
    const token = getStoredToken();
    if (token) {
      fetch('/api/admin/corporate-bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setCorporateGroups(data.data);
          }
        })
        .catch(err => console.error('Error refreshing:', err))
        .finally(() => setLoading(false));
    }
  };

  if (loading && corporateGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Loading corporate payments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-800">{totalBookingsCount}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Paid ({totals.paidCount})</p>
                <p className="text-2xl font-bold text-green-700">₹{totals.paidAmount.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unpaid ({totals.unpaidCount})</p>
                <p className="text-2xl font-bold text-red-700">₹{totals.unpaidAmount.toFixed(2)}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-purple-700">₹{totals.totalAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by reference, consignment, name, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
              />
            </div>
          </div>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-40 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              {totals.paidCount} Paid
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              {totals.unpaidCount} Unpaid
            </span>
          </div>
        </div>
      </div>

      {/* TP/FP Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('TP')}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
              activeTab === 'TP'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            TP (To Pay)
          </button>
          <button
            onClick={() => setActiveTab('FP')}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
              activeTab === 'FP'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            FP (Free Paid)
          </button>
        </div>
      </div>

      {/* Corporate Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-gray-800">
              {activeTab === 'FP' ? 'Aggregated' : 'Individual'} Payments ({totalBookingsCount})
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          {(activeTab === 'FP' ? aggregatedFPList.length === 0 : filteredCorporateGroups.length === 0) ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-gray-500">
              <DollarSign className="h-10 w-10 text-gray-400" />
              <span className="font-semibold text-sm">No payments found</span>
            </div>
          ) : activeTab === 'FP' ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">#</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Corporate</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Total Bookings</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Total Amount</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Paid Amount</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Unpaid Amount</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregatedFPList.map((item, index) => (
                  <TableRow key={item.corporate._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <TableCell className="py-3 px-4 font-medium text-left">{index + 1}</TableCell>
                    <TableCell className="py-3 px-4 text-left">
                      <div>
                        <div className="font-medium text-gray-900">{item.corporate.companyName}</div>
                        <div className="text-sm text-gray-500">{item.corporate.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-left">
                      <div className="font-semibold text-gray-900">{item.totalBookings}</div>
                    </TableCell>
                    <TableCell className="text-gray-900 py-3 px-4 text-left">
                      ₹{item.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-green-700 py-3 px-4 text-left">
                      ₹{item.paidAmount.toFixed(2)} ({item.paidCount})
                    </TableCell>
                    <TableCell className="text-red-700 py-3 px-4 text-left">
                      ₹{item.unpaidAmount.toFixed(2)} ({item.unpaidCount})
                    </TableCell>
                    <TableCell className="py-3 px-4 text-left">
                      <Badge 
                        variant={item.unpaidAmount === 0 ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs px-3 py-1",
                          item.unpaidAmount === 0
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        )}
                      >
                        {item.unpaidAmount === 0 ? (
                          <CheckCircle className="h-3 w-3 mr-1 inline" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1 inline" />
                        )}
                        {item.unpaidAmount === 0 ? 'FULLY PAID' : 'PARTIAL'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">#</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Consignment</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Company Name</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Receiver Name</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Receiver Phone</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Route</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Amount</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Payment Status</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCorporateGroups.map((group, groupIndex) =>
                  group.bookings.map((booking, bookingIndex) => {
                    const rowNumber = filteredCorporateGroups
                      .slice(0, groupIndex)
                      .reduce((sum, g) => sum + g.bookings.length, 0) + bookingIndex + 1;

                    return (
                      <TableRow key={booking._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <TableCell className="py-3 px-4 font-medium text-left">{rowNumber}</TableCell>
                        <TableCell className="font-semibold text-gray-900 py-3 px-4 text-left">
                          {booking.consignmentNumber || booking.bookingReference}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-left">
                          <div className="font-medium text-gray-900">{group.corporate.companyName}</div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-left">
                          <div className="text-gray-900">{booking.destinationData?.name || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-left">
                          <div className="text-gray-900">{booking.destinationData?.mobileNumber || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-left">
                          <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                            {booking.originData?.city || 'N/A'} <span className="text-gray-400 mx-1">→</span> {booking.destinationData?.city || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-900 py-3 px-4 text-left">
                          ₹{booking.invoiceData?.finalPrice?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-left">
                          <Badge 
                            variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}
                            className={cn(
                              "text-xs px-3 py-1",
                              booking.paymentStatus === 'paid'
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            )}
                          >
                            {booking.paymentStatus === 'paid' ? (
                              <CheckCircle className="h-3 w-3 mr-1 inline" />
                            ) : (
                              <AlertCircle className="h-3 w-3 mr-1 inline" />
                            )}
                            {booking.paymentStatus.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 py-3 px-4 text-left">
                          {formatDate(booking.bookingDate)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

const Payments = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        
        
        <Tabs defaultValue="corporate" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto bg-white border border-gray-200 rounded-lg gap-1 p-1">
            <TabsTrigger 
              value="corporate" 
              className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all px-4 py-2 flex items-center justify-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Corporate
            </TabsTrigger>
            <TabsTrigger 
              value="medicine" 
              className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all px-4 py-2 flex items-center justify-center gap-2"
            >
              <Pill className="h-4 w-4" />
              Medicine
            </TabsTrigger>
            <TabsTrigger 
              value="customers" 
              className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all px-4 py-2 flex items-center justify-center gap-2"
            >
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="corporate" className="space-y-0">
            <CorporatePayments />
          </TabsContent>

          <TabsContent value="medicine" className="space-y-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex flex-col items-center justify-center gap-3 text-center text-gray-500">
                <Pill className="h-12 w-12 text-gray-400" />
                <p className="font-semibold text-sm">Medicine Payments</p>
                <p className="text-sm">Content coming soon</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex flex-col items-center justify-center gap-3 text-center text-gray-500">
                <Users className="h-12 w-12 text-gray-400" />
                <p className="font-semibold text-sm">Customer Payments</p>
                <p className="text-sm">Content coming soon</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Payments;

