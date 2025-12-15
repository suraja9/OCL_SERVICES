import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Phone, MapPin, UserX, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface TrackingData {
    _id: string;
    consignmentNumber: number;
    bookingReference: string;
    originData?: {
        city: string;
        state: string;
    };
    destinationData?: {
        name: string;
        city: string;
        state: string;
    };
    currentStatus: string;
    createdAt: string;
    senderName?: string;
    receiverName?: string;
    invoiceData?: {
        finalPrice: number;
    };
    paymentData?: {
        paymentStatus: string;
        paymentType: string;
    };
    source?: 'tracking' | 'customerbooking'; // Source identifier to determine which endpoint to use
}

interface CourierBoy {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    area: string;
    pincode: string;
    locality: string;
    building: string;
}

const Delivery = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<TrackingData[]>([]);
    const { toast } = useToast();

    // Assignment State
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<TrackingData | null>(null);
    const [courierBoys, setCourierBoys] = useState<CourierBoy[]>([]);
    const [selectedCourierBoyId, setSelectedCourierBoyId] = useState<string>('');
    const [assigning, setAssigning] = useState(false);

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

    const handleAssignClick = (order: TrackingData) => {
        setSelectedOrder(order);
        setSelectedCourierBoyId('');
        setIsAssignDialogOpen(true);
    };

    const handleAssignCourier = async () => {
        if (!selectedOrder || !selectedCourierBoyId) return;

        setAssigning(true);
        try {
            const token = localStorage.getItem('adminToken');
            
            // Determine endpoint and request body based on source
            const isCustomerBooking = selectedOrder.source === 'customerbooking';
            const endpoint = isCustomerBooking 
                ? '/api/admin/customer-booking/delivery/assign-courier-boy'
                : '/api/admin/tracking/delivery/assign-courier-boy';
            
            const requestBody = isCustomerBooking
                ? {
                    bookingId: selectedOrder._id,
                    courierBoyId: selectedCourierBoyId,
                }
                : {
                    trackingId: selectedOrder._id,
                    courierBoyId: selectedCourierBoyId,
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
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
            fetchDeliveryBoyData(); // Refresh list
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

    const getSelectedCourierBoyDetails = () => {
        return courierBoys.find(cb => cb._id === selectedCourierBoyId);
    };

    const fetchDeliveryBoyData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/admin/addressforms?currentStatus=reached-hub&limit=100', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const result = await response.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching delivery boy data:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch delivery boy data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveryBoyData();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-md">
                                <Truck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
                                <p className="text-sm text-gray-600">Manage orders ready for delivery assignment</p>
                            </div>
                        </div>
                        <Button
                            onClick={fetchDeliveryBoyData}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-600" />
                            <h3 className="font-semibold text-gray-800">Reached Hub Orders ({data.length})</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                                    <span className="text-gray-600">Loading orders...</span>
                                </div>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-3 bg-gray-100 rounded-full">
                                        <Package className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <span className="text-gray-500">No orders found with status "Reached Hub"</span>
                                </div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-gray-200">
                                        <TableHead className="font-medium text-gray-700 py-3 px-4">Consignment No.</TableHead>
                                        <TableHead className="font-medium text-gray-700 py-3 px-4">Receiver Name</TableHead>
                                        <TableHead className="font-medium text-gray-700 py-3 px-4">Destination</TableHead>
                                        <TableHead className="font-medium text-gray-700 py-3 px-4">Date</TableHead>
                                        <TableHead className="font-medium text-gray-700 py-3 px-4">Payment Status</TableHead>
                                        <TableHead className="font-medium text-gray-700 py-3 px-4">Final Price</TableHead>
                                        <TableHead className="font-medium text-gray-700 py-3 px-4">Payment Type</TableHead>
                                        <TableHead className="font-medium text-gray-700 py-3 px-4 text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((item) => (
                                        <TableRow key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <TableCell className="py-3 px-4">
                                                <div className="font-medium text-gray-900">{item.consignmentNumber}</div>
                                                <div className="text-xs text-gray-500">{item.bookingReference}</div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <span className="text-sm text-gray-900">
                                                    {item.destinationData?.name || item.receiverName || 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <span className="text-sm text-gray-900">
                                                    {item.destinationData?.city}, {item.destinationData?.state}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <span className="text-sm text-gray-900">{formatDate(item.createdAt)}</span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <Badge
                                                    variant={item.paymentData?.paymentStatus === 'paid' ? 'default' : 'destructive'}
                                                    className={item.paymentData?.paymentStatus === 'paid' 
                                                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                                                        : 'bg-red-500 hover:bg-red-600 text-white'}
                                                >
                                                    {item.paymentData?.paymentStatus || 'Unpaid'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <span className="text-sm font-medium text-gray-900">
                                                    ₹{item.invoiceData?.finalPrice?.toFixed(2) || '0.00'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <Badge variant="outline" className="text-xs">
                                                    {item.paymentData?.paymentType || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <div className="flex items-center justify-center">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAssignClick(item)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                                                    >
                                                        Assign
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            </div>

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
        </div>
    );
};

export default Delivery;
