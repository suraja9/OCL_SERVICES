import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Car,
  Package,
  Pill,
  UserCheck,
  UserX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourierBoy {
  _id: string;
  fullName: string;
  designation: string;
  email: string;
  phone: string;
  locality: string;
  building: string;
  landmark: string;
  pincode: string;
  area: string;
  aadharCard: string;
  aadharCardUrl: string;
  panCard: string;
  panCardUrl: string;
  vehicleType: string;
  licenseNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  isVerified: boolean;
  type?: string;
  registrationDate: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const CourierBoyManagement = () => {
  const [courierBoys, setCourierBoys] = useState<CourierBoy[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCourierBoy, setSelectedCourierBoy] = useState<CourierBoy | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTypeSelectionDialogOpen, setIsTypeSelectionDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchCourierBoys();
  }, [searchTerm, statusFilter, currentPage]);

  const fetchCourierBoys = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/courier-boy?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCourierBoys(data.courierBoys);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch courier boys');
      }
    } catch (error) {
      console.error('Error fetching courier boys:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch courier boys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (courierBoy: CourierBoy) => {
    setSelectedCourierBoy(courierBoy);
    setIsDetailsModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedCourierBoy || !selectedType) return;
    
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/courier-boy/${selectedCourierBoy._id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ type: selectedType })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Courier boy approved successfully",
        });
        
        // Update the courier boy in the list
        setCourierBoys(prev => 
          prev.map(cb => 
            cb._id === selectedCourierBoy._id 
              ? { ...cb, status: 'approved', isVerified: true, type: data.courierBoy.type || selectedType, lastUpdated: data.courierBoy.lastUpdated }
              : cb
          )
        );
        
        setIsApproveDialogOpen(false);
        setIsTypeSelectionDialogOpen(false);
        setSelectedCourierBoy(null);
        setSelectedType('');
      } else {
        throw new Error(data.error || 'Failed to approve courier boy');
      }
    } catch (error) {
      console.error('Error approving courier boy:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve courier boy",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCourierBoy) return;
    
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/courier-boy/${selectedCourierBoy._id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Courier boy rejected",
        });
        
        // Update the courier boy in the list
        setCourierBoys(prev => 
          prev.map(cb => 
            cb._id === selectedCourierBoy._id 
              ? { ...cb, status: 'rejected', isVerified: false, lastUpdated: data.courierBoy.lastUpdated }
              : cb
          )
        );
        
        setIsRejectDialogOpen(false);
        setSelectedCourierBoy(null);
      } else {
        throw new Error(data.error || 'Failed to reject courier boy');
      }
    } catch (error) {
      console.error('Error rejecting courier boy:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject courier boy",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string, isVerified: boolean) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-md">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Courier Boy Management</h1>
                <p className="text-sm text-gray-600">Manage courier boy registrations and approvals</p>
              </div>
            </div>
            <Button
              onClick={() => fetchCourierBoys()}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Compact Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, phone, or area..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-9 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                {courierBoys.filter(cb => cb.status === 'approved').length} Approved
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                {courierBoys.filter(cb => cb.status === 'pending').length} Pending
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                {courierBoys.filter(cb => cb.status === 'rejected').length} Rejected
              </span>
            </div>
          </div>
        </div>

        {/* Courier Boys Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Courier Boys ({pagination?.total || 0})</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Name</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Contact</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Area</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Vehicle</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Status</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Registered</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-green-600" />
                        <span className="text-gray-600">Loading courier boys...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : courierBoys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <UserX className="h-6 w-6 text-gray-400" />
                        <span className="text-gray-500">No courier boys found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  courierBoys.map((courierBoy) => (
                    <TableRow key={courierBoy._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                            {courierBoy.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{courierBoy.fullName}</div>
                            <div className="text-sm text-gray-500">{courierBoy.designation}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-900">{courierBoy.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-900">{courierBoy.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-900">{courierBoy.area}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {courierBoy.pincode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{courierBoy.vehicleType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            courierBoy.status === 'approved' ? 'bg-green-400' : 
                            courierBoy.status === 'pending' ? 'bg-yellow-400' : 
                            'bg-red-400'
                          }`}></div>
                          {getStatusBadge(courierBoy.status, courierBoy.isVerified)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(courierBoy.registrationDate)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(courierBoy)}
                            className="h-7 w-7 p-0 hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {courierBoy.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCourierBoy(courierBoy);
                                  setSelectedType('');
                                  setIsTypeSelectionDialogOpen(true);
                                }}
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-300"
                                title="Approve"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCourierBoy(courierBoy);
                                  setIsRejectDialogOpen(true);
                                }}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                                title="Reject"
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Simple Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} courier boys
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPrev || isLoading}
                  className="px-3 py-1 h-8 text-sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-2">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={!pagination.hasNext || isLoading}
                  className="px-3 py-1 h-8 text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-50">
          <DialogHeader className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-md">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Courier Boy Details</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  Complete information about the courier boy registration
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedCourierBoy && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-sm text-gray-900">{selectedCourierBoy.fullName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Designation</label>
                        <p className="text-sm text-gray-900">{selectedCourierBoy.designation}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm text-gray-900">{selectedCourierBoy.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm text-gray-900">{selectedCourierBoy.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Address Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Locality</label>
                        <p className="text-sm text-gray-900">{selectedCourierBoy.locality}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Building</label>
                        <p className="text-sm text-gray-900">{selectedCourierBoy.building}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Landmark</label>
                        <p className="text-sm text-gray-900">{selectedCourierBoy.landmark || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Pincode</label>
                        <p className="text-sm text-gray-900">{selectedCourierBoy.pincode}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Area</label>
                        <p className="text-sm text-gray-900">{selectedCourierBoy.area}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Vehicle Type</label>
                      <p className="text-sm text-gray-900">{selectedCourierBoy.vehicleType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">License Number</label>
                      <p className="text-sm text-gray-900">{selectedCourierBoy.licenseNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Aadhar Card</label>
                      <div className="mt-2">
                        <a 
                          href={selectedCourierBoy.aadharCardUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <FileText className="h-4 w-4" />
                          View Aadhar Card
                        </a>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">PAN Card</label>
                      <div className="mt-2">
                        <a 
                          href={selectedCourierBoy.panCardUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <FileText className="h-4 w-4" />
                          View PAN Card
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Status Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Current Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedCourierBoy.status, selectedCourierBoy.isVerified)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedCourierBoy.registrationDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedCourierBoy.lastUpdated)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setIsDetailsModalOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Type Selection Dialog */}
      <AlertDialog open={isTypeSelectionDialogOpen} onOpenChange={setIsTypeSelectionDialogOpen}>
        <AlertDialogContent className="sm:max-w-[600px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">Select Courier Type</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Choose the type for <span className="font-semibold text-gray-900">{selectedCourierBoy?.fullName}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-2 gap-3">
              {/* OCL Option */}
              <div
                onClick={() => setSelectedType('OCL')}
                className={`relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedType === 'OCL'
                    ? 'border-green-500 bg-green-50 shadow-md shadow-green-100'
                    : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <h3 className={`text-base font-semibold ${
                    selectedType === 'OCL' ? 'text-green-700' : 'text-gray-900'
                  }`}>
                    OCL
                  </h3>
                  {selectedType === 'OCL' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>

              {/* Medicine Option */}
              <div
                onClick={() => setSelectedType('Medicine')}
                className={`relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedType === 'Medicine'
                    ? 'border-green-500 bg-green-50 shadow-md shadow-green-100'
                    : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <h3 className={`text-base font-semibold ${
                    selectedType === 'Medicine' ? 'text-green-700' : 'text-gray-900'
                  }`}>
                    Medicine
                  </h3>
                  {selectedType === 'Medicine' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel 
              onClick={() => {
                setSelectedType('');
                setSelectedCourierBoy(null);
              }}
              className="px-6"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedType) {
                  setIsTypeSelectionDialogOpen(false);
                  setIsApproveDialogOpen(true);
                } else {
                  toast({
                    title: "Error",
                    description: "Please select a type",
                    variant: "destructive"
                  });
                }
              }}
              disabled={!selectedType}
              className="bg-green-600 hover:bg-green-700 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Courier Boy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {selectedCourierBoy?.fullName} as <strong>{selectedType}</strong>? This action will mark them as verified and approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsApproveDialogOpen(false);
              setSelectedType('');
              setSelectedCourierBoy(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Courier Boy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {selectedCourierBoy?.fullName}? This action will mark them as rejected and unverified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isUpdating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUpdating ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourierBoyManagement;