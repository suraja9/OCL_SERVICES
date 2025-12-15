import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Pill,
  Building2,
  Users,
  Bike,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Receipt,
  Package,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getStoredToken } from '@/utils/auth';
import {
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Area, AreaChart } from 'recharts';

interface SummaryData {
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
}

const COLORS = {
  corporate: '#14b8a6',
  customer: '#3b82f6',
  medicine: '#a855f7',
  courierBoy: '#f97316',
  paid: '#10b981',
  unpaid: '#ef4444',
};

const AccountsOverview = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData>({
    totalPaid: 0,
    totalUnpaid: 0,
    totalAmount: 0,
    medicine: { total: 0, oclCharge: 0, grandTotal: 0, count: 0 },
    corporate: { paid: 0, unpaid: 0, total: 0, paidCount: 0, unpaidCount: 0 },
    customer: { paid: 0, unpaid: 0, total: 0, paidCount: 0, unpaidCount: 0 },
    courierBoy: { total: 0, count: 0, orderCount: 0 },
    monthlyData: [],
  });

  const getToken = () => {
    return getStoredToken() || localStorage.getItem('officeToken');
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const [
        medicineSummaryRes,
        medicineSettlementsRes,
        customerBookingsRes,
        medicineBookingsRes,
        corporateBookingsRes,
        courierPaymentsRes,
      ] = await Promise.all([
        fetch(`/api/admin/medicine/settlements/summary?month=${month}&year=${year}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => ({ ok: false })),
        fetch(`/api/admin/medicine/settlements?month=${month}&year=${year}`, {
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

      const newSummary: SummaryData = {
        totalPaid: 0,
        totalUnpaid: 0,
        totalAmount: 0,
        medicine: { total: 0, oclCharge: 0, grandTotal: 0, count: 0 },
        corporate: { paid: 0, unpaid: 0, total: 0, paidCount: 0, unpaidCount: 0 },
        customer: { paid: 0, unpaid: 0, total: 0, paidCount: 0, unpaidCount: 0 },
        courierBoy: { total: 0, count: 0, orderCount: 0 },
        monthlyData: [],
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

      setSummary(newSummary);
    } catch (error) {
      console.error('Error fetching accounts data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounts data. Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const paymentDistributionData = useMemo(() => [
    { name: 'Corporate', value: summary.corporate.total, color: COLORS.corporate },
    { name: 'Customer', value: summary.customer.total, color: COLORS.customer },
    { name: 'Medicine', value: summary.medicine.grandTotal, color: COLORS.medicine },
    { name: 'Courier Boy', value: summary.courierBoy.total, color: COLORS.courierBoy },
  ].filter(item => item.value > 0), [summary]);

  const paidUnpaidData = useMemo(() => [
    { name: 'Paid', value: summary.totalPaid, color: COLORS.paid },
    { name: 'Unpaid', value: summary.totalUnpaid, color: COLORS.unpaid },
  ].filter(item => item.value > 0), [summary]);

  const sourceBreakdownData = useMemo(() => [
    {
      source: 'Corporate',
      paid: summary.corporate.paid,
      unpaid: summary.corporate.unpaid,
      total: summary.corporate.total,
    },
    {
      source: 'Customer',
      paid: summary.customer.paid,
      unpaid: summary.customer.unpaid,
      total: summary.customer.total,
    },
    {
      source: 'Medicine',
      paid: summary.medicine.grandTotal,
      unpaid: 0,
      total: summary.medicine.grandTotal,
    },
    {
      source: 'Courier Boy',
      paid: summary.courierBoy.total,
      unpaid: 0,
      total: summary.courierBoy.total,
    },
  ].filter(item => item.total > 0), [summary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-xs text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 p-3 space-y-2">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Accounts Overview
          </h1>
          <p className="text-xs text-gray-600">Financial summary across all sources</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAllData}
          disabled={loading}
          className="h-8 px-3 text-xs"
        >
          <RefreshCw className={cn('h-3 w-3 mr-1', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Compact Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-blue-100 mb-0.5">Total Amount</p>
                <p className="text-lg font-bold leading-tight">{formatCurrency(summary.totalAmount)}</p>
              </div>
              <DollarSign className="h-5 w-5 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-green-100 mb-0.5">Total Paid</p>
                <p className="text-lg font-bold leading-tight">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-red-100 mb-0.5">Total Unpaid</p>
                <p className="text-lg font-bold leading-tight">{formatCurrency(summary.totalUnpaid)}</p>
              </div>
              <TrendingDown className="h-5 w-5 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-purple-100 mb-0.5">Collection Rate</p>
                <p className="text-lg font-bold leading-tight">
                  {summary.totalAmount > 0
                    ? ((summary.totalPaid / summary.totalAmount) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <CheckCircle className="h-5 w-5 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Payment Distribution Pie Chart */}
        <Card className="shadow-md">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Package className="h-4 w-4 text-purple-600" />
              Revenue by Source
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {paymentDistributionData.length > 0 ? (
              <ChartContainer
                config={paymentDistributionData.reduce((acc, item) => {
                  acc[item.name] = { label: item.name, color: item.color };
                  return acc;
                }, {} as Record<string, { label: string; color: string }>)}
                className="h-[160px]"
              >
                <PieChart>
                  <Pie
                    data={paymentDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded border bg-background p-1.5 shadow-sm text-xs">
                            <div className="font-medium">{payload[0].name}</div>
                            <div className="font-bold">{formatCurrency(payload[0].value as number)}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-xs text-gray-500">
                No data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paid vs Unpaid Pie Chart */}
        <Card className="shadow-md">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-green-600" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {paidUnpaidData.length > 0 ? (
              <ChartContainer
                config={paidUnpaidData.reduce((acc, item) => {
                  acc[item.name] = { label: item.name, color: item.color };
                  return acc;
                }, {} as Record<string, { label: string; color: string }>)}
                className="h-[160px]"
              >
                <PieChart>
                  <Pie
                    data={paidUnpaidData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paidUnpaidData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded border bg-background p-1.5 shadow-sm text-xs">
                            <div className="font-medium">{payload[0].name}</div>
                            <div className="font-bold">{formatCurrency(payload[0].value as number)}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-xs text-gray-500">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compact Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Source Breakdown Bar Chart */}
        <Card className="shadow-md">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Source Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {sourceBreakdownData.length > 0 ? (
              <ChartContainer
                config={{
                  paid: { label: 'Paid', color: COLORS.paid },
                  unpaid: { label: 'Unpaid', color: COLORS.unpaid },
                }}
                className="h-[160px]"
              >
                <BarChart data={sourceBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="source" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded border bg-background p-1.5 shadow-sm text-xs">
                            {payload.map((item, index) => (
                              <div key={index} className="flex justify-between gap-2">
                                <span>{item.name}</span>
                                <span className="font-bold">{formatCurrency(item.value as number)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                  <Bar dataKey="paid" fill={COLORS.paid} name="Paid" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="unpaid" fill={COLORS.unpaid} name="Unpaid" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-xs text-gray-500">
                No data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="shadow-md">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-orange-600" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {summary.monthlyData.length > 0 ? (
              <ChartContainer
                config={{
                  paid: { label: 'Paid', color: COLORS.paid },
                  unpaid: { label: 'Unpaid', color: COLORS.unpaid },
                  total: { label: 'Total', color: COLORS.corporate },
                }}
                className="h-[160px]"
              >
                <AreaChart data={summary.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded border bg-background p-1.5 shadow-sm text-xs">
                            {payload.map((item, index) => (
                              <div key={index} className="flex justify-between gap-2">
                                <span>{item.name}</span>
                                <span className="font-bold">{formatCurrency(item.value as number)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                  <Area type="monotone" dataKey="paid" stackId="1" stroke={COLORS.paid} fill={COLORS.paid} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="unpaid" stackId="1" stroke={COLORS.unpaid} fill={COLORS.unpaid} fillOpacity={0.6} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-xs text-gray-500">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compact Source Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Card className="bg-white border border-purple-200 shadow-sm">
          <CardContent className="p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-purple-100 rounded">
                <Pill className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <p className="text-xs font-bold text-gray-900">Medicine</p>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{formatCurrency(summary.medicine.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">OCL:</span>
                <span className="font-medium text-orange-600">{formatCurrency(summary.medicine.oclCharge)}</span>
              </div>
              <div className="flex justify-between pt-0.5 border-t">
                <span className="font-medium">Grand:</span>
                <span className="font-bold text-purple-700">{formatCurrency(summary.medicine.grandTotal)}</span>
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-gray-500">Count:</span>
                <Badge variant="secondary" className="h-3 px-1 text-[9px]">
                  {summary.medicine.count}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-teal-200 shadow-sm">
          <CardContent className="p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-teal-100 rounded">
                <Building2 className="h-3.5 w-3.5 text-teal-600" />
              </div>
              <p className="text-xs font-bold text-gray-900">Corporate</p>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-600">Paid:</span>
                <span className="font-medium text-green-700">{formatCurrency(summary.corporate.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unpaid:</span>
                <span className="font-medium text-red-700">{formatCurrency(summary.corporate.unpaid)}</span>
              </div>
              <div className="flex justify-between pt-0.5 border-t">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-teal-700">{formatCurrency(summary.corporate.total)}</span>
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-gray-500">P/U:</span>
                <div className="flex gap-0.5">
                  <Badge className="h-3 px-1 text-[9px] bg-green-100 text-green-800">
                    {summary.corporate.paidCount}
                  </Badge>
                  <Badge className="h-3 px-1 text-[9px] bg-red-100 text-red-800">
                    {summary.corporate.unpaidCount}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-blue-200 shadow-sm">
          <CardContent className="p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-blue-100 rounded">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <p className="text-xs font-bold text-gray-900">Customer</p>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-600">Paid:</span>
                <span className="font-medium text-green-700">{formatCurrency(summary.customer.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unpaid:</span>
                <span className="font-medium text-red-700">{formatCurrency(summary.customer.unpaid)}</span>
              </div>
              <div className="flex justify-between pt-0.5 border-t">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-blue-700">{formatCurrency(summary.customer.total)}</span>
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-gray-500">P/U:</span>
                <div className="flex gap-0.5">
                  <Badge className="h-3 px-1 text-[9px] bg-green-100 text-green-800">
                    {summary.customer.paidCount}
                  </Badge>
                  <Badge className="h-3 px-1 text-[9px] bg-red-100 text-red-800">
                    {summary.customer.unpaidCount}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-orange-200 shadow-sm">
          <CardContent className="p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-orange-100 rounded">
                <Bike className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <p className="text-xs font-bold text-gray-900">Courier Boy</p>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between pt-0.5">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-orange-700">{formatCurrency(summary.courierBoy.total)}</span>
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-gray-500">CBs:</span>
                <Badge variant="secondary" className="h-3 px-1 text-[9px]">
                  {summary.courierBoy.count}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Orders:</span>
                <Badge variant="secondary" className="h-3 px-1 text-[9px]">
                  {summary.courierBoy.orderCount}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-sm">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-indigo-700 mb-0.5">Total Bookings</p>
                <p className="text-base font-bold text-indigo-900">
                  {summary.corporate.paidCount +
                    summary.corporate.unpaidCount +
                    summary.customer.paidCount +
                    summary.customer.unpaidCount}
                </p>
              </div>
              <Package className="h-4 w-4 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 shadow-sm">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-cyan-700 mb-0.5">Paid Bookings</p>
                <p className="text-base font-bold text-cyan-900">
                  {summary.corporate.paidCount + summary.customer.paidCount}
                </p>
              </div>
              <CheckCircle className="h-4 w-4 text-cyan-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-amber-700 mb-0.5">Unpaid Bookings</p>
                <p className="text-base font-bold text-amber-900">
                  {summary.corporate.unpaidCount + summary.customer.unpaidCount}
                </p>
              </div>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 shadow-sm">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-rose-700 mb-0.5">Pending</p>
                <p className="text-base font-bold text-rose-900">{formatCurrency(summary.totalUnpaid)}</p>
              </div>
              <Receipt className="h-4 w-4 text-rose-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountsOverview;
