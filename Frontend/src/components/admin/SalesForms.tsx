import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  RefreshCw,
  Building2,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Package,
  Truck,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

interface SalesForm {
  _id: string;
  companyName: string;
  concernPersonName: string;
  designation: string;
  phoneNumber: string;
  emailAddress: string;
  alternatePhoneNumber?: string;
  website?: string;
  fullAddress: string;
  typeOfBusiness: string;
  typeOfShipments: string;
  averageShipmentVolume: string;
  mostFrequentRoutes: string;
  weightRange: string;
  packingRequired: string;
  existingLogisticsPartners: string;
  currentIssues: string;
  vehiclesNeededPerMonth: string;
  typeOfVehicleRequired: string;
  uploadedImage?: string;
  uploadedImageKey?: string;
  uploadedImageOriginalName?: string;
  status: string;
  notes?: string;
  handledBy?: any;
  createdAt: string;
  updatedAt: string;
}

interface SalesFormsResponse {
  success: boolean;
  data: SalesForm[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const SalesForms = () => {
  const { toast } = useToast();
  const [salesForms, setSalesForms] = useState<SalesForm[]>([]);
  const [filteredForms, setFilteredForms] = useState<SalesForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedForm, setSelectedForm] = useState<SalesForm | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchSalesForms();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    filterForms();
  }, [salesForms, searchTerm]);

  const fetchSalesForms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`${API_BASE}/api/sales-form?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales forms');
      }

      const result: SalesFormsResponse = await response.json();
      
      if (result.success) {
        setSalesForms(result.data || []);
        setTotalPages(result.pagination.pages);
        setTotal(result.pagination.total);
      }
    } catch (error: any) {
      console.error('Error fetching sales forms:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch sales forms",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterForms = () => {
    if (!searchTerm.trim()) {
      setFilteredForms(salesForms);
      return;
    }

    const filtered = salesForms.filter(form => 
      form.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.concernPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.phoneNumber.includes(searchTerm) ||
      form.typeOfBusiness.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredForms(filtered);
  };

  const handleViewForm = (form: SalesForm) => {
    setSelectedForm(form);
    setShowViewDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sales Forms</h1>
            <p className="text-sm text-gray-500">View and manage all sales form submissions</p>
          </div>
        </div>
        <Button
          onClick={fetchSalesForms}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by company name, contact person, email, phone, or business type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Forms</p>
                <p className="text-2xl font-bold text-gray-800">{total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {salesForms.filter(f => f.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {salesForms.filter(f => f.status === 'in_progress').length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {salesForms.filter(f => f.status === 'completed').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Form Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Business Type</TableHead>
                  <TableHead>Shipment Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading sales forms...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredForms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No sales forms found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredForms.map((form) => (
                    <TableRow key={form._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-semibold">{form.companyName}</div>
                            {form.website && (
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                {form.website}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{form.concernPersonName}</div>
                          <div className="text-sm text-gray-500">{form.designation}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="truncate max-w-[150px]">{form.emailAddress}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{form.phoneNumber}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{form.typeOfBusiness}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{form.typeOfShipments}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(form.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(form.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewForm(form)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing page {currentPage} of {totalPages} ({total} total forms)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Sales Form Details
            </DialogTitle>
            <DialogDescription>
              Submitted on {selectedForm ? formatDate(selectedForm.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedForm && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  {getStatusBadge(selectedForm.status)}
                </div>
                {selectedForm.notes && (
                  <div className="text-sm">
                    <p className="font-medium text-gray-500">Notes</p>
                    <p className="text-gray-700">{selectedForm.notes}</p>
                  </div>
                )}
              </div>

              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Company Name</p>
                    <p className="text-gray-800">{selectedForm.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Website</p>
                    <p className="text-gray-800">{selectedForm.website || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Full Address</p>
                    <p className="text-gray-800">{selectedForm.fullAddress}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Concern Person</p>
                    <p className="text-gray-800">{selectedForm.concernPersonName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Designation</p>
                    <p className="text-gray-800">{selectedForm.designation}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone Number</p>
                    <p className="text-gray-800">{selectedForm.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Alternate Phone</p>
                    <p className="text-gray-800">{selectedForm.alternatePhoneNumber || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="text-gray-800">{selectedForm.emailAddress}</p>
                  </div>
                </div>
              </div>

              {/* Business & Shipment Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Business & Shipment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type of Business</p>
                    <p className="text-gray-800">{selectedForm.typeOfBusiness}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type of Shipments</p>
                    <p className="text-gray-800">{selectedForm.typeOfShipments}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Average Shipment Volume</p>
                    <p className="text-gray-800">{selectedForm.averageShipmentVolume}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Weight Range</p>
                    <p className="text-gray-800">{selectedForm.weightRange}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Most Frequent Routes</p>
                    <p className="text-gray-800">{selectedForm.mostFrequentRoutes}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Packing Required</p>
                    <Badge variant={selectedForm.packingRequired === 'yes' ? 'default' : 'secondary'}>
                      {selectedForm.packingRequired === 'yes' ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Logistics & Vehicle Requirements */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Logistics & Vehicle Requirements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Existing Logistics Partners</p>
                    <p className="text-gray-800">{selectedForm.existingLogisticsPartners}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Current Issues / Pain Points</p>
                    <p className="text-gray-800">{selectedForm.currentIssues}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vehicles Needed Per Month</p>
                    <p className="text-gray-800">{selectedForm.vehiclesNeededPerMonth}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type of Vehicle Required</p>
                    <p className="text-gray-800">{selectedForm.typeOfVehicleRequired}</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Image */}
              {selectedForm.uploadedImage && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Uploaded Image
                  </h3>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedForm.uploadedImage}
                      alt="Uploaded"
                      className="max-w-xs max-h-64 rounded-lg border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="text-sm text-gray-500">
                      {selectedForm.uploadedImageOriginalName && (
                        <p className="font-medium">File: {selectedForm.uploadedImageOriginalName}</p>
                      )}
                      <a
                        href={selectedForm.uploadedImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesForms;

