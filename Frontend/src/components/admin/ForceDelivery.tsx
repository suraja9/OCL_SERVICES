import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Zap, ChevronLeft, ChevronRight, Package, PackageX, Search, Upload, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrackingData {
    _id: string;
    consignmentNumber: number;
    bookingReference: string;
    originData?: {
        name?: string;
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
        paymentType: string;
    };
    paymentStatus?: string;
    source?: 'tracking' | 'customerbooking'; // Add source to distinguish collection
}

// Floating Input Component
interface FloatingInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
    className?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
    label,
    value,
    onChange,
    type = 'text',
    required = false,
    placeholder = '',
    className = ''
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value.length > 0;
    const shouldFloat = isFocused || hasValue;

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`
                        w-full h-10 px-4
                        border rounded-xl bg-white/90 backdrop-blur-sm text-sm
                        transition-all duration-200 ease-in-out
                        ${isFocused 
                            ? 'border-[#406ab9] ring-2 ring-[#4ec0f7]/20 shadow-[0_4px_8px_rgba(0,0,0,0.1)]' 
                            : 'border-gray-300/60 hover:border-[#406ab9]/50 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)]'
                        }
                        focus:outline-none text-[#1e293b]
                    `}
                    style={{ fontFamily: 'Calibri, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important' }}
                    placeholder={placeholder}
                />
                <label
                    className={`
                        absolute left-4
                        transition-all duration-200 ease-in-out
                        pointer-events-none select-none
                        ${shouldFloat
                            ? 'top-0 -translate-y-1/2 text-xs bg-white px-2 text-[#406ab9] font-medium'
                            : 'top-1/2 -translate-y-1/2 text-base text-[#64748b]'
                        }
                        ${isFocused && !hasValue ? 'text-[#406ab9]' : ''}
                    `}
                    style={{ fontFamily: 'Calibri, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important' }}
                >
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </label>
            </div>
        </div>
    );
};

// Floating Select Component
interface FloatingSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    required?: boolean;
    className?: string;
}

const FloatingSelect: React.FC<FloatingSelectProps> = ({
    label,
    value,
    onChange,
    options,
    required = false,
    className = ''
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value.length > 0;
    const shouldFloat = isFocused || hasValue;

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`
                        w-full h-10 px-4 pr-8
                        border rounded-xl bg-white/90 backdrop-blur-sm text-sm
                        transition-all duration-200 ease-in-out
                        ${isFocused 
                            ? 'border-[#406ab9] ring-2 ring-[#4ec0f7]/20 shadow-[0_4px_8px_rgba(0,0,0,0.1)]' 
                            : 'border-gray-300/60 hover:border-[#406ab9]/50 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)]'
                        }
                        focus:outline-none text-[#1e293b] appearance-none
                    `}
                    style={{ fontFamily: 'Calibri, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important' }}
                >
                    <option value="" disabled hidden></option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <label
                    className={`
                        absolute left-4
                        transition-all duration-200 ease-in-out
                        pointer-events-none select-none
                        ${shouldFloat
                            ? 'top-0 -translate-y-1/2 text-xs bg-white px-2 text-[#406ab9] font-medium'
                            : 'top-1/2 -translate-y-1/2 text-base text-[#64748b]'
                        }
                        ${isFocused && !hasValue ? 'text-[#406ab9]' : ''}
                    `}
                    style={{ fontFamily: 'Calibri, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important' }}
                >
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
            </div>
        </div>
    );
};

const ForceDelivery = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<TrackingData[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<TrackingData | null>(null);
    const [formData, setFormData] = useState({
        personName: '',
        vehicleType: '',
        vehicleNumber: '',
        podFile: null as File | null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const itemsPerPage = 7;
    const [totalCount, setTotalCount] = useState(0);
    const [trackingTotalCount, setTrackingTotalCount] = useState(0);
    const [bookingTotalCount, setBookingTotalCount] = useState(0);
    const [hasMoreData, setHasMoreData] = useState(true);
    const { toast } = useToast();

    const fetchForceDeliveryData = async (page: number = 1, append: boolean = false) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            
            // Fetch enough items to cover multiple pages when combining data
            // Since we're combining two sources, we fetch more items to ensure we have enough after combining
            // Fetch enough items per collection to cover at least 2-3 pages of combined results
            const fetchLimit = itemsPerPage * 3; // Fetch 21 items from each collection per API call
            
            // Fetch from tracking collection
            const trackingResponse = await fetch(`/api/admin/tracking/force-delivery?page=${page}&limit=${fetchLimit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!trackingResponse.ok) {
                throw new Error('Failed to fetch tracking data');
            }

            const trackingResult = await trackingResponse.json();
            let trackingData: TrackingData[] = [];
            if (trackingResult.success && trackingResult.data) {
                trackingData = trackingResult.data.map((item: TrackingData) => ({
                    ...item,
                    source: 'tracking' as const
                }));
                setTrackingTotalCount(trackingResult.pagination?.totalCount || 0);
            }

            // Fetch from customerbookings collection
            const bookingResponse = await fetch(`/api/admin/customerbookings/force-delivery?page=${page}&limit=${fetchLimit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!bookingResponse.ok) {
                throw new Error('Failed to fetch customer booking data');
            }

            const bookingResult = await bookingResponse.json();
            let bookingData: TrackingData[] = [];
            if (bookingResult.success && bookingResult.data) {
                bookingData = bookingResult.data.map((item: TrackingData) => ({
                    ...item,
                    source: 'customerbooking' as const
                }));
                setBookingTotalCount(bookingResult.pagination?.totalCount || 0);
            }

            // Combine and sort by date (most recent first)
            const newOrders = [...trackingData, ...bookingData].sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
            });

            // Update data - either append for search or replace for pagination
            if (append || searchTerm) {
                // When searching, we might need to load more data
                setData(prev => {
                    // Remove duplicates based on _id
                    const existingIds = new Set(prev.map(item => item._id));
                    const uniqueNewOrders = newOrders.filter(item => !existingIds.has(item._id));
                    return [...prev, ...uniqueNewOrders];
                });
            } else {
                // Normal pagination - replace data
                setData(newOrders);
            }

            // Calculate total count
            const combinedTotal = (trackingResult.pagination?.totalCount || 0) + (bookingResult.pagination?.totalCount || 0);
            setTotalCount(combinedTotal);

            // Check if there's more data to load
            const trackingHasMore = trackingResult.pagination?.hasNext || false;
            const bookingHasMore = bookingResult.pagination?.hasNext || false;
            setHasMoreData(trackingHasMore || bookingHasMore);

            setError('');
        } catch (error) {
            console.error('Error fetching force delivery data:', error);
            setError('Failed to fetch force delivery data');
            toast({
                title: 'Error',
                description: 'Failed to fetch force delivery data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchTerm) {
            // When searching, load more data to ensure we can filter properly
            // But still limit to reasonable amount
            fetchForceDeliveryData(1, false);
        } else {
            // Normal pagination - load only current page
            fetchForceDeliveryData(currentPage, false);
        }
    }, [currentPage, searchTerm]);

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) {
            return data;
        }

        const searchLower = searchTerm.toLowerCase().trim();
        return data.filter((item) => {
            const consignmentNumber = item.consignmentNumber?.toString() || '';
            const bookingReference = item.bookingReference?.toLowerCase() || '';
            const receiverName = (item.destinationData?.name || item.receiverName || '').toLowerCase();
            const senderName = (item.originData?.name || item.senderName || '').toLowerCase();
            const destinationCity = (item.destinationData?.city || '').toLowerCase();
            const destinationState = (item.destinationData?.state || '').toLowerCase();
            const originCity = (item.originData?.city || '').toLowerCase();
            const originState = (item.originData?.state || '').toLowerCase();
            const status = (item.currentStatus || '').toLowerCase();
            const paymentType = (item.paymentData?.paymentType || '').toLowerCase();
            const paymentStatus = (item.paymentStatus || '').toLowerCase();

            return (
                consignmentNumber.includes(searchLower) ||
                bookingReference.includes(searchLower) ||
                receiverName.includes(searchLower) ||
                senderName.includes(searchLower) ||
                destinationCity.includes(searchLower) ||
                destinationState.includes(searchLower) ||
                originCity.includes(searchLower) ||
                originState.includes(searchLower) ||
                status.includes(searchLower) ||
                paymentType.includes(searchLower) ||
                paymentStatus.includes(searchLower)
            );
        });
    }, [data, searchTerm]);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Calculate pagination based on filtered data (for search) or fetched data (for normal pagination)
    const displayData = searchTerm ? filteredData : data;
    const calculatedTotalPages = searchTerm 
        ? Math.ceil(filteredData.length / itemsPerPage)
        : Math.ceil(totalCount / itemsPerPage);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = useMemo(() => {
        return displayData.slice(startIndex, endIndex);
    }, [displayData, startIndex, endIndex]);

    // Reset to page 1 when filtered data changes
    useEffect(() => {
        if (searchTerm && filteredData.length > 0 && currentPage > calculatedTotalPages) {
            setCurrentPage(1);
        }
    }, [searchTerm, filteredData.length, calculatedTotalPages, currentPage]);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < calculatedTotalPages) {
            setCurrentPage(currentPage + 1);
            // If we're near the end and have more data, preload next page
            if (!searchTerm && currentPage === Math.ceil(data.length / itemsPerPage) - 1 && hasMoreData) {
                fetchForceDeliveryData(currentPage + 1, false);
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleForceDeliveryClick = (item: TrackingData) => {
        setSelectedOrder(item);
        setFormData({
            personName: '',
            vehicleType: '',
            vehicleNumber: '',
            podFile: null,
        });
        setIsFormDialogOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, podFile: file }));
        }
    };

    const handleRemoveFile = () => {
        setFormData(prev => ({ ...prev, podFile: null }));
    };

    const handleFormSubmit = async () => {
        // Validation
        if (!formData.personName.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please enter person name',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.vehicleType) {
            toast({
                title: 'Validation Error',
                description: 'Please select vehicle type',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.vehicleNumber.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please enter vehicle number',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.podFile) {
            toast({
                title: 'Validation Error',
                description: 'Please upload POD (Proof of Delivery)',
                variant: 'destructive',
            });
            return;
        }

        if (!selectedOrder) {
            toast({
                title: 'Error',
                description: 'No order selected',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('adminToken');
            
            // Determine the correct endpoint based on source
            const isCustomerBooking = selectedOrder.source === 'customerbooking';
            const endpoint = isCustomerBooking 
                ? '/api/admin/customerbookings/force-delivery'
                : '/api/admin/tracking/force-delivery';
            const idFieldName = isCustomerBooking ? 'bookingId' : 'trackingId';
            
            // Create FormData for file upload
            const submitFormData = new FormData();
            submitFormData.append(idFieldName, selectedOrder._id);
            submitFormData.append('personName', formData.personName.trim());
            submitFormData.append('vehicleType', formData.vehicleType);
            submitFormData.append('vehicleNumber', formData.vehicleNumber.trim());
            submitFormData.append('podFile', formData.podFile);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: submitFormData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit force delivery');
            }

            toast({
                title: 'Success',
                description: `Force delivery completed for consignment #${selectedOrder.consignmentNumber}`,
            });

            setIsFormDialogOpen(false);
            setSelectedOrder(null);
            setFormData({
                personName: '',
                vehicleType: '',
                vehicleNumber: '',
                podFile: null,
            });

            // Refresh list after successful submission - order will be hidden as it's now delivered
            await fetchForceDeliveryData(currentPage);
            
            // If current page becomes empty and we're not on page 1, go to previous page
            if (data.length <= 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (error: any) {
            console.error('Error submitting force delivery form:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to submit force delivery form',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-md">
                                <Zap className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Force Delivery</h1>
                                <p className="text-sm text-gray-600">Force delivery for orders that need immediate attention</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => fetchForceDeliveryData(currentPage)}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Search Filter */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by consignment number, receiver name, destination, status..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                                />
                            </div>
                        </div>
                        {searchTerm && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>
                                    {filteredData.length} of {totalCount} orders
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchTerm('')}
                                    className="h-7 text-xs"
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-600" />
                            <h3 className="font-semibold text-gray-800">
                                Orders ({searchTerm ? filteredData.length : totalCount})
                            </h3>
                            <span className="text-xs text-gray-500 ml-2">
                                (From Trackings & Customer Bookings - Any status except delivered)
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                                    <span className="text-gray-600">Loading orders...</span>
                                </div>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <PackageX className="h-12 w-12 text-gray-400 mb-3" />
                                <span className="text-gray-500">
                                    {searchTerm ? 'No orders match your search' : 'No orders found'}
                                </span>
                                <span className="text-sm text-gray-400 mt-1">
                                    {searchTerm 
                                        ? 'Try adjusting your search terms'
                                        : 'No orders found (excluding delivered status)'
                                    }
                                </span>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-gray-200">
                                            <TableHead className="font-medium text-gray-700 py-3 px-4">Consignment No.</TableHead>
                                            <TableHead className="font-medium text-gray-700 py-3 px-4">Source</TableHead>
                                            <TableHead className="font-medium text-gray-700 py-3 px-4">Receiver Name</TableHead>
                                            <TableHead className="font-medium text-gray-700 py-3 px-4">Destination</TableHead>
                                            <TableHead className="font-medium text-gray-700 py-3 px-4">Status</TableHead>
                                            <TableHead className="font-medium text-gray-700 py-3 px-4">Date</TableHead>
                                            <TableHead className="font-medium text-gray-700 py-3 px-4">Payment Status</TableHead>
                                            <TableHead className="font-medium text-gray-700 py-3 px-4">Final Price</TableHead>
                                            <TableHead className="font-medium text-gray-700 py-3 px-4">Payment Type</TableHead>
                                            <TableHead className="font-medium text-gray-700 py-3 px-4 text-center">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.map((item) => (
                                            <TableRow key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4">
                                                    <div className="font-medium text-gray-900">{item.consignmentNumber}</div>
                                                    {item.bookingReference && item.bookingReference !== item.consignmentNumber?.toString() && (
                                                        <div className="text-xs text-gray-500">{item.bookingReference}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`text-xs ${
                                                            item.source === 'customerbooking' 
                                                                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                                                : 'bg-blue-50 text-blue-700 border-blue-200'
                                                        }`}
                                                    >
                                                        {item.source === 'customerbooking' ? 'Customer Booking' : 'Tracking'}
                                                    </Badge>
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
                                                    <Badge variant="outline" className="capitalize text-xs">
                                                        {item.currentStatus || 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <span className="text-sm text-gray-900">{formatDate(item.createdAt)}</span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <Badge
                                                        variant={item.paymentStatus === 'paid' ? 'default' : 'destructive'}
                                                        className={item.paymentStatus === 'paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                                                    >
                                                        {item.paymentStatus ? item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1) : 'Unpaid'}
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
                                                    <div className="flex justify-center">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleForceDeliveryClick(item)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 h-7 text-xs"
                                                        >
                                                            <Zap className="h-3 w-3 mr-1" />
                                                            Force Delivery
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {!loading && displayData.length > 0 && calculatedTotalPages > 1 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Showing {startIndex + 1} to {Math.min(endIndex, displayData.length)} of {searchTerm ? displayData.length : totalCount} orders
                                {searchTerm && ` (filtered from ${totalCount} total)`}
                                {!searchTerm && (
                                    <span className="text-xs text-gray-500 ml-2">
                                        (Tracking: {trackingTotalCount}, Customer Bookings: {bookingTotalCount})
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1 || loading}
                                    className="px-3 py-1 h-8 text-sm"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-600 px-2">
                                    Page {currentPage} of {calculatedTotalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={handleNextPage}
                                    disabled={currentPage >= calculatedTotalPages || loading}
                                    className="px-3 py-1 h-8 text-sm"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Force Delivery Form Dialog */}
                <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                    <DialogContent className="sm:max-w-[500px] max-h-[85vh] bg-gray-50">
                        <DialogHeader className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-md">
                                    <Zap className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-gray-900">Force Delivery</DialogTitle>
                                    <DialogDescription className="text-sm text-gray-600 mt-1">
                                        Enter delivery details for consignment <span className="font-semibold text-blue-600">#{selectedOrder?.consignmentNumber}</span>
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="space-y-4">
                                {/* Person Name */}
                                <FloatingInput
                                    label="Person Name"
                                    value={formData.personName}
                                    onChange={(value) => setFormData(prev => ({ ...prev, personName: value }))}
                                    required
                                    placeholder=""
                                />

                                {/* Vehicle Type */}
                                <FloatingSelect
                                    label="Vehicle Type"
                                    value={formData.vehicleType}
                                    onChange={(value) => setFormData(prev => ({ ...prev, vehicleType: value }))}
                                    required
                                    options={[
                                        { value: 'bike', label: 'Bike' },
                                        { value: 'scooter', label: 'Scooter' },
                                        { value: 'car', label: 'Car' },
                                        { value: 'van', label: 'Van' },
                                        { value: 'truck', label: 'Truck' },
                                        { value: 'auto', label: 'Auto Rickshaw' },
                                        { value: 'other', label: 'Other' },
                                    ]}
                                />

                                {/* Vehicle Number */}
                                <FloatingInput
                                    label="Vehicle Number"
                                    value={formData.vehicleNumber}
                                    onChange={(value) => setFormData(prev => ({ ...prev, vehicleNumber: value }))}
                                    required
                                    placeholder=""
                                />

                                {/* POD Upload */}
                                <div className="space-y-2">
                                    <label htmlFor="podFile" className="text-sm font-medium text-gray-700 block">
                                        Upload POD (Proof of Delivery) <span className="text-red-500">*</span>
                                    </label>
                                    {!formData.podFile ? (
                                        <div className="flex items-center justify-center w-full">
                                            <label
                                                htmlFor="podFile"
                                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                                    <p className="mb-2 text-sm text-gray-500">
                                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500">PNG, JPG, PDF (MAX. 10MB)</p>
                                                </div>
                                                <input
                                                    id="podFile"
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*,.pdf"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-5 w-5 text-gray-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{formData.podFile.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {(formData.podFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleRemoveFile}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-4 pt-4 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={() => setIsFormDialogOpen(false)}
                                disabled={isSubmitting}
                                className="border-gray-300 hover:bg-gray-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleFormSubmit}
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-2 h-4 w-4" />
                                        Submit
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default ForceDelivery;