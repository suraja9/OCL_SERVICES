import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertCircle,
  Download
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
  const [error, setError] = useState('');

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
        setError('');
      } else {
        setError('Failed to fetch sales forms');
      }
    } catch (error: any) {
      console.error('Error fetching sales forms:', error);
      setError(error.message || 'Network error while loading sales forms');
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

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const exportToCSV = () => {
    try {
      const dataToExport = filteredForms.length > 0 ? filteredForms : salesForms;
      
      if (dataToExport.length === 0) {
        toast({
          title: "No Data",
          description: "No sales forms to export",
          variant: "destructive"
        });
        return;
      }

      // Define CSV headers
      const headers = [
        'Company Name',
        'Concern Person Name',
        'Designation',
        'Phone Number',
        'Alternate Phone Number',
        'Email Address',
        'Website',
        'Full Address',
        'Type of Business',
        'Type of Shipments',
        'Average Shipment Volume',
        'Most Frequent Routes',
        'Weight Range',
        'Packing Required',
        'Existing Logistics Partners',
        'Current Issues',
        'Vehicles Needed Per Month',
        'Type of Vehicle Required',
        'Status',
        'Notes',
        'Submitted Date',
        'Updated Date'
      ];

      // Create CSV rows
      const csvRows = [
        headers.join(',')
      ];

      dataToExport.forEach(form => {
        const row = [
          escapeCSV(form.companyName),
          escapeCSV(form.concernPersonName),
          escapeCSV(form.designation),
          escapeCSV(form.phoneNumber),
          escapeCSV(form.alternatePhoneNumber || ''),
          escapeCSV(form.emailAddress),
          escapeCSV(form.website || ''),
          escapeCSV(form.fullAddress),
          escapeCSV(form.typeOfBusiness),
          escapeCSV(form.typeOfShipments),
          escapeCSV(form.averageShipmentVolume),
          escapeCSV(form.mostFrequentRoutes),
          escapeCSV(form.weightRange),
          escapeCSV(form.packingRequired),
          escapeCSV(form.existingLogisticsPartners),
          escapeCSV(form.currentIssues),
          escapeCSV(form.vehiclesNeededPerMonth),
          escapeCSV(form.typeOfVehicleRequired),
          escapeCSV(form.status),
          escapeCSV(form.notes || ''),
          escapeCSV(formatDate(form.createdAt)),
          escapeCSV(formatDate(form.updatedAt))
        ];
        csvRows.push(row.join(','));
      });

      // Create CSV content
      const csvContent = csvRows.join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `sales-forms-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${dataToExport.length} sales form(s) to CSV`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export sales forms to CSV",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Forms</h1>
                <p className="text-sm text-gray-600">View and manage all sales form submissions</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                disabled={loading || (filteredForms.length === 0 && salesForms.length === 0)}
                className="border-gray-300 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={fetchSalesForms}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
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
                  placeholder="Search by company name, contact person, email, phone, or business type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                {salesForms.filter(f => f.status === 'pending').length} Pending
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                {salesForms.filter(f => f.status === 'in_progress').length} In Progress
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                {salesForms.filter(f => f.status === 'completed').length} Completed
              </span>
            </div>
          </div>
        </div>

        {/* Sales Forms Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Sales Form Submissions ({filteredForms.length || salesForms.length})</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Company</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Contact Person</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Contact Info</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Business Type</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Shipment Type</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Status</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Submitted</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-gray-600">Loading sales forms...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredForms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-6 w-6 text-gray-400" />
                        <span className="text-gray-500">No sales forms found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredForms.map((form) => (
                    <TableRow key={form._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {form.companyName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{form.companyName}</div>
                            {form.website && (
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                {form.website}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{form.concernPersonName}</div>
                          <div className="text-sm text-gray-500">{form.designation}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="truncate max-w-[150px]">{form.emailAddress}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{form.phoneNumber}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">{form.typeOfBusiness}</Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge variant="secondary" className="text-xs">{form.typeOfShipments}</Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        {getStatusBadge(form.status)}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="text-sm">
                          <div className="text-gray-900">{new Date(form.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(form.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewForm(form)}
                            className="h-7 px-3 text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
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
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, total)} of {total} forms
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1 h-8 text-sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-1 h-8 text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-50">
          <DialogHeader className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Building2 className="h-5 w-5 text-blue-600" />
              Sales Form Details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Submitted on {selectedForm ? formatDate(selectedForm.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedForm && (
            <div className="space-y-4">
              {/* Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Status</p>
                    {getStatusBadge(selectedForm.status)}
                  </div>
                  {selectedForm.notes && (
                    <div className="text-sm">
                      <p className="font-medium text-gray-500 mb-1">Notes</p>
                      <p className="text-gray-700">{selectedForm.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Company Name</p>
                    <p className="text-gray-900">{selectedForm.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Website</p>
                    <p className="text-gray-900">{selectedForm.website || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 mb-1">Full Address</p>
                    <p className="text-gray-900">{selectedForm.fullAddress}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <Phone className="h-5 w-5 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Concern Person</p>
                    <p className="text-gray-900">{selectedForm.concernPersonName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Designation</p>
                    <p className="text-gray-900">{selectedForm.designation}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                    <p className="text-gray-900">{selectedForm.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Alternate Phone</p>
                    <p className="text-gray-900">{selectedForm.alternatePhoneNumber || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                    <p className="text-gray-900">{selectedForm.emailAddress}</p>
                  </div>
                </div>
              </div>

              {/* Business & Shipment Details */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <Package className="h-5 w-5 text-blue-600" />
                  Business & Shipment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Type of Business</p>
                    <p className="text-gray-900">{selectedForm.typeOfBusiness}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Type of Shipments</p>
                    <p className="text-gray-900">{selectedForm.typeOfShipments}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Average Shipment Volume</p>
                    <p className="text-gray-900">{selectedForm.averageShipmentVolume}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Weight Range</p>
                    <p className="text-gray-900">{selectedForm.weightRange}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 mb-1">Most Frequent Routes</p>
                    <p className="text-gray-900">{selectedForm.mostFrequentRoutes}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Packing Required</p>
                    <Badge variant={selectedForm.packingRequired === 'yes' ? 'default' : 'secondary'}>
                      {selectedForm.packingRequired === 'yes' ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Logistics & Vehicle Requirements */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Logistics & Vehicle Requirements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 mb-1">Existing Logistics Partners</p>
                    <p className="text-gray-900">{selectedForm.existingLogisticsPartners}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 mb-1">Current Issues / Pain Points</p>
                    <p className="text-gray-900">{selectedForm.currentIssues}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Vehicles Needed Per Month</p>
                    <p className="text-gray-900">{selectedForm.vehiclesNeededPerMonth}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Type of Vehicle Required</p>
                    <p className="text-gray-900">{selectedForm.typeOfVehicleRequired}</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Image */}
              {selectedForm.uploadedImage && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                    <ImageIcon className="h-5 w-5 text-blue-600" />
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

