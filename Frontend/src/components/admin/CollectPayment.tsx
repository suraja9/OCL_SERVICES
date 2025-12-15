import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Bike, Users, Loader2, Phone, Mail, MapPin, Search, ChevronDown, ChevronRight, DollarSign, Package, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStoredToken } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CourierBoy {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  area: string;
  pincode?: string;
  locality?: string;
  building?: string;
  status?: string;
}

interface CourierBoyOrder {
  consignmentNumber: number;
  bookingReference: string;
  amount: number;
  receiverName: string;
  receiverPhone: string;
  route: string;
  bookingDate: string;
}

interface CourierBoyPayment {
  courierBoyId: string;
  totalAmount: number;
  orders: CourierBoyOrder[];
}

interface CourierBoyWithPayment extends CourierBoy {
  totalAmount: number;
  orders: CourierBoyOrder[];
}

const CollectPayment = () => {
  const [courierBoys, setCourierBoys] = useState<CourierBoy[]>([]);
  const [payments, setPayments] = useState<CourierBoyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    console.log('CollectPayment component mounted');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        setError('No authentication token found');
        return;
      }

      // Fetch courier boys and payments in parallel
      const [courierBoysResponse, paymentsResponse] = await Promise.all([
        fetch('/api/admin/courier-boys/list', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/courier-boys/payments', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!courierBoysResponse.ok || !paymentsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const courierBoysData = await courierBoysResponse.json();
      const paymentsData = await paymentsResponse.json();

      if (courierBoysData.success) {
        setCourierBoys(courierBoysData.data || []);
      } else {
        throw new Error(courierBoysData.error || 'Failed to fetch courier boys');
      }

      if (paymentsData.success) {
        setPayments(paymentsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
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

  const toggleRow = (courierBoyId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courierBoyId)) {
        newSet.delete(courierBoyId);
      } else {
        newSet.add(courierBoyId);
      }
      return newSet;
    });
  };

  // Merge courier boys with payment data
  const courierBoysWithPayments: CourierBoyWithPayment[] = courierBoys.map(cb => {
    const payment = payments.find(p => p.courierBoyId === cb._id);
    return {
      ...cb,
      totalAmount: payment?.totalAmount || 0,
      orders: payment?.orders || []
    };
  });

  const filteredCourierBoys = courierBoysWithPayments.filter(cb => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      cb.fullName.toLowerCase().includes(search) ||
      cb.email.toLowerCase().includes(search) ||
      cb.phone.includes(search) ||
      cb.area.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalAmount = filteredCourierBoys.reduce((sum, cb) => sum + cb.totalAmount, 0);
  const totalOrders = filteredCourierBoys.reduce((sum, cb) => sum + cb.orders.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <Tabs defaultValue="courierBoy" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-auto bg-white border border-gray-200 rounded-lg gap-1 p-1">
            <TabsTrigger 
              value="courierBoy" 
              className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all px-4 py-2 flex items-center justify-center gap-2"
            >
              <Bike className="h-4 w-4" />
              Courier Boy
            </TabsTrigger>
            <TabsTrigger 
              value="customer" 
              className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all px-4 py-2 flex items-center justify-center gap-2"
            >
              <Users className="h-4 w-4" />
              Customer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courierBoy" className="space-y-0">
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Courier Boys</p>
                        <p className="text-2xl font-bold text-gray-800">{courierBoys.length}</p>
                      </div>
                      <Bike className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-green-700">₹{totalAmount.toFixed(2)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                        <p className="text-2xl font-bold text-purple-700">{totalOrders}</p>
                      </div>
                      <Package className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Showing</p>
                        <p className="text-2xl font-bold text-orange-700">{filteredCourierBoys.length}</p>
                      </div>
                      <Search className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* Search Bar */}
                <div className="flex-1 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      className={cn(
                        "pl-10 pr-3 h-10 border rounded-xl transition-all duration-200 ease-in-out text-xs",
                        "bg-white/90 text-[#4B5563]",
                        "border-gray-300/60",
                        isSearchFocused || searchTerm
                          ? "border-blue-500"
                          : "hover:border-blue-400/50",
                        "focus:outline-none"
                      )}
                    />
                    <label
                      className={cn(
                        "absolute transition-all duration-200 ease-in-out pointer-events-none select-none",
                        "left-12",
                        isSearchFocused || searchTerm
                          ? "top-0 -translate-y-1/2 text-xs px-2 bg-white text-blue-600"
                          : "top-1/2 -translate-y-1/2 text-xs text-gray-500"
                      )}
                    >
                      Search by name, email, phone, or area...
                    </label>
                  </div>
                </div>
              </div>

              {/* Courier Boys Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 bg-blue-500">
                  <div className="flex items-center gap-2">
                    <Bike className="h-4 w-4 text-white" />
                    <h3 className="font-semibold text-white">
                      Courier Boys ({filteredCourierBoys.length})
                    </h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {/* Loading State */}
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                      <p className="text-gray-500">Loading courier boys...</p>
                    </div>
                  )}

                  {/* Error State */}
                  {error && !loading && (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Courier Boys Table */}
                  {!loading && !error && (
                    <>
                      {filteredCourierBoys.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-gray-500">
                          <Bike className="h-10 w-10 text-gray-400" />
                          <span className="font-semibold text-sm">No courier boys found</span>
                          <span className="text-sm">{searchTerm ? 'Try adjusting your search' : 'No courier boys available'}</span>
                        </div>
                      ) : (
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
                               <TableHead className="font-medium text-gray-700 py-3 px-4 text-left w-28">Action</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {filteredCourierBoys.map((courierBoy, index) => {
                               const isExpanded = expandedRows.has(courierBoy._id);
                               const hasOrders = courierBoy.orders.length > 0;
                               
                               return (
                                 <React.Fragment key={courierBoy._id}>
                                   <TableRow className="border-b border-gray-100">
                                     <TableCell className="py-3 px-4 text-left">
                                       {hasOrders && (
                                         <button
                                           onClick={() => toggleRow(courierBoy._id)}
                                           className="p-1 rounded"
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
                                     <TableCell className="py-3 px-4 text-left w-28">
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         className="h-7 px-2.5 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-700 hover:shadow-none"
                                       >
                                         <CheckCircle className="h-3 w-3 mr-1" />
                                         Paid
                                       </Button>
                                     </TableCell>
                                   </TableRow>
                                  
                                  {/* Expanded orders row */}
                                  {isExpanded && hasOrders && (
                                    <TableRow className="bg-gray-50/50">
                                      <TableCell colSpan={9} className="py-4 px-6">
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
                                                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-left text-xs">Action</TableHead>
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
                                                    <TableCell className="py-3 px-4 text-left">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2.5 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-700 hover:shadow-none"
                                                      >
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Paid
                                                      </Button>
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
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customer" className="space-y-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex flex-col items-center justify-center gap-3 text-center text-gray-500">
                <Users className="h-12 w-12 text-gray-400" />
                <p className="font-semibold text-sm">Customer Payment Collection</p>
                <p className="text-sm">Content coming soon</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CollectPayment;

