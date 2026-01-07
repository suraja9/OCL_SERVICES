import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Edit,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  PhoneCall,
  CheckCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Package,
  Truck,
  AlertCircle,
  Download,
  Navigation,
  ExternalLink,
  CloudUpload
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
  remarks?: string;
  handledBy?: any;
  createdAt: string;
  updatedAt: string;
  submissionLocation?: {
    type: string;
    coordinates: [number, number];
  };
  submissionCity?: string;
  submissionState?: string;
  submissionCountry?: string;
  submissionFullAddress?: string;
  submissionIpAddress?: string;
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
  
  // Initialize date filters with current date
  const getCurrentDateFilters = () => {
    const now = new Date();
    return {
      day: now.getDate().toString(),
      month: (now.getMonth() + 1).toString(), // getMonth() returns 0-11
      year: now.getFullYear().toString()
    };
  };

  const currentDate = getCurrentDateFilters();
  
  const [salesForms, setSalesForms] = useState<SalesForm[]>([]);
  const [filteredForms, setFilteredForms] = useState<SalesForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>(currentDate.day);
  const [monthFilter, setMonthFilter] = useState<string>(currentDate.month);
  const [yearFilter, setYearFilter] = useState<string>(currentDate.year);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedForm, setSelectedForm] = useState<SalesForm | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingForm, setEditingForm] = useState<SalesForm | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SalesForm>>({});
  const [customTypeOfBusiness, setCustomTypeOfBusiness] = useState<string>('');
  const [customTypeOfShipments, setCustomTypeOfShipments] = useState<string>('');
  const [customTypeOfVehicleRequired, setCustomTypeOfVehicleRequired] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [savingRemarks, setSavingRemarks] = useState<Record<string, boolean>>({});
  const [originalRemarks, setOriginalRemarks] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null);

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchSalesForms();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    filterForms();
  }, [salesForms, searchTerm, dayFilter, monthFilter, yearFilter]);

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
        const forms = result.data || [];
        setSalesForms(forms);
        // Store original remarks values for comparison
        const remarksMap: Record<string, string> = {};
        forms.forEach((form: SalesForm) => {
          remarksMap[form._id] = form.remarks || '';
        });
        setOriginalRemarks(remarksMap);
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
    let filtered = salesForms;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(form =>
        form.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.concernPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.phoneNumber.includes(searchTerm) ||
        form.typeOfBusiness.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date filters
    if (dayFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all') {
      filtered = filtered.filter(form => {
        const formDate = new Date(form.createdAt);
        const formDay = formDate.getDate();
        const formMonth = formDate.getMonth() + 1; // getMonth() returns 0-11
        const formYear = formDate.getFullYear();

        const dayMatch = dayFilter === 'all' || formDay === parseInt(dayFilter);
        const monthMatch = monthFilter === 'all' || formMonth === parseInt(monthFilter);
        const yearMatch = yearFilter === 'all' || formYear === parseInt(yearFilter);

        return dayMatch && monthMatch && yearMatch;
      });
    }

    setFilteredForms(filtered);
  };

  const updateFormStatus = async (formId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/sales-form/${formId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the form in the local state
        setSalesForms(prevForms =>
          prevForms.map(form =>
            form._id === formId ? { ...form, status: newStatus } : form
          )
        );
        
        // Update selected form if it's the same one
        setSelectedForm(prevForm =>
          prevForm && prevForm._id === formId ? { ...prevForm, status: newStatus } : prevForm
        );
      }
    } catch (error: any) {
      console.error('Error updating form status:', error);
      toast({
        title: "Error",
        description: "Failed to update form status",
        variant: "destructive"
      });
    }
  };

  const handleViewForm = async (form: SalesForm) => {
    setSelectedForm(form);
    setShowViewDialog(true);
    
    // If status is pending, update it to seen
    if (form.status === 'pending') {
      await updateFormStatus(form._id, 'seen');
    }
  };

  const handleContacted = async (form: SalesForm) => {
    await updateFormStatus(form._id, 'contacted');
    toast({
      title: "Status Updated",
      description: "Sales form status changed to 'Contacted'",
      variant: "default"
    });
  };

  const handleEditForm = (form: SalesForm) => {
    setEditingForm(form);
    
    // Check if values are custom (not in dropdown options)
    const businessOptions = ['Automotive', 'Computer', 'E-commerce', 'Electronics', 'Food & Beverages', 'Manufacturing', 'Pharmaceutical', 'Retail', 'Textiles', 'Wholesale', 'Other'];
    const shipmentOptions = ['Documents', 'Parcels', 'Bulk Cargo', 'Fragile Items', 'Perishable Goods', 'Hazardous Materials', 'Mixed', 'Other'];
    const vehicleOptions = ['Tata Ace', 'Pickup Van', '407 Truck', '14ft', '17ft', '1109 Truck', '20ft', '22ft', 'Container', 'Trailer', 'Mixed', 'Others'];
    
    const isCustomBusiness = !businessOptions.includes(form.typeOfBusiness);
    const isCustomShipment = !shipmentOptions.includes(form.typeOfShipments);
    const isCustomVehicle = !vehicleOptions.includes(form.typeOfVehicleRequired);
    
    setEditFormData({
      companyName: form.companyName,
      concernPersonName: form.concernPersonName,
      designation: form.designation,
      phoneNumber: form.phoneNumber,
      emailAddress: form.emailAddress,
      alternatePhoneNumber: form.alternatePhoneNumber || '',
      website: form.website || '',
      fullAddress: form.fullAddress,
      typeOfBusiness: isCustomBusiness ? 'Other' : form.typeOfBusiness,
      typeOfShipments: isCustomShipment ? 'Other' : form.typeOfShipments,
      averageShipmentVolume: form.averageShipmentVolume,
      mostFrequentRoutes: form.mostFrequentRoutes,
      weightRange: form.weightRange,
      packingRequired: form.packingRequired,
      existingLogisticsPartners: form.existingLogisticsPartners,
      currentIssues: form.currentIssues,
      vehiclesNeededPerMonth: form.vehiclesNeededPerMonth,
      typeOfVehicleRequired: isCustomVehicle ? 'Others' : form.typeOfVehicleRequired,
      status: form.status,
      notes: form.notes || ''
    });
    
    // Set custom values if they exist
    setCustomTypeOfBusiness(isCustomBusiness ? form.typeOfBusiness : '');
    setCustomTypeOfShipments(isCustomShipment ? form.typeOfShipments : '');
    setCustomTypeOfVehicleRequired(isCustomVehicle ? form.typeOfVehicleRequired : '');
    
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingForm) return;

    try {
      setSaving(true);
      
      // Prepare data with custom values if "Other" is selected
      const submitData = { ...editFormData };
      
      if (submitData.typeOfBusiness === 'Other' && customTypeOfBusiness.trim()) {
        submitData.typeOfBusiness = customTypeOfBusiness.trim();
      }
      if (submitData.typeOfShipments === 'Other' && customTypeOfShipments.trim()) {
        submitData.typeOfShipments = customTypeOfShipments.trim();
      }
      if (submitData.typeOfVehicleRequired === 'Others' && customTypeOfVehicleRequired.trim()) {
        submitData.typeOfVehicleRequired = customTypeOfVehicleRequired.trim();
      }
      
      const response = await fetch(`${API_BASE}/api/sales-form/${editingForm._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to update sales form');
      }

      const result = await response.json();
      
      if (result.success) {
        // Prepare final data with custom values
        const finalData = { ...editFormData };
        if (finalData.typeOfBusiness === 'Other' && customTypeOfBusiness.trim()) {
          finalData.typeOfBusiness = customTypeOfBusiness.trim();
        }
        if (finalData.typeOfShipments === 'Other' && customTypeOfShipments.trim()) {
          finalData.typeOfShipments = customTypeOfShipments.trim();
        }
        if (finalData.typeOfVehicleRequired === 'Others' && customTypeOfVehicleRequired.trim()) {
          finalData.typeOfVehicleRequired = customTypeOfVehicleRequired.trim();
        }
        
        // Update the form in the local state
        setSalesForms(prevForms =>
          prevForms.map(form =>
            form._id === editingForm._id ? { ...form, ...finalData } : form
          )
        );
        
        // Update selected form if it's the same one
        setSelectedForm(prevForm =>
          prevForm && prevForm._id === editingForm._id ? { ...prevForm, ...finalData } : prevForm
        );

        toast({
          title: "Success",
          description: "Sales form updated successfully",
          variant: "default"
        });

        setShowEditDialog(false);
        setEditingForm(null);
        setEditFormData({});
        setCustomTypeOfBusiness('');
        setCustomTypeOfShipments('');
        setCustomTypeOfVehicleRequired('');
      }
    } catch (error: any) {
      console.error('Error updating sales form:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update sales form",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
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
      seen: 'bg-purple-100 text-purple-800',
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

  const getDays = () => {
    return Array.from({ length: 31 }, (_, i) => i + 1);
  };

  const getMonths = () => {
    return [
      { value: '1', label: 'January' },
      { value: '2', label: 'February' },
      { value: '3', label: 'March' },
      { value: '4', label: 'April' },
      { value: '5', label: 'May' },
      { value: '6', label: 'June' },
      { value: '7', label: 'July' },
      { value: '8', label: 'August' },
      { value: '9', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' }
    ];
  };

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    // Generate years from 5 years ago to current year
    for (let i = 0; i <= 5; i++) {
      years.push((currentYear - i).toString());
    }
    return years;
  };

  const clearDateFilters = () => {
    setDayFilter('all');
    setMonthFilter('all');
    setYearFilter('all');
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
        'Updated Date',
        'Submission City',
        'Submission State',
        'Submission Country',
        'Submission Full Address',
        'Submission IP Address'
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
          escapeCSV(formatDate(form.updatedAt)),
          escapeCSV(form.submissionCity || ''),
          escapeCSV(form.submissionState || ''),
          escapeCSV(form.submissionCountry || ''),
          escapeCSV(form.submissionFullAddress || ''),
          escapeCSV(form.submissionIpAddress || '')
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

  const syncToSheets = async () => {
    try {
      setSyncing(true);
      const response = await fetch(`${API_BASE}/api/sales-form/sync-to-sheets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to sync to Google Sheets');
      }

      // Store the spreadsheet URL
      if (result.data?.spreadsheetUrl) {
        setSheetsUrl(result.data.spreadsheetUrl);
      }

      toast({
        title: "Sync Successful",
        description: result.message || `Synced ${result.data?.totalForms || 0} sales form(s) to Google Sheets`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error syncing to Google Sheets:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync sales forms to Google Sheets",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const openSheets = async () => {
    try {
      // If we already have the URL, use it
      if (sheetsUrl) {
        window.open(sheetsUrl, '_blank');
        return;
      }

      // Otherwise, fetch it from the API
      const response = await fetch(`${API_BASE}/api/sales-form/sheets-url`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to get Google Sheets URL');
      }

      if (result.data?.spreadsheetUrl) {
        setSheetsUrl(result.data.spreadsheetUrl);
        window.open(result.data.spreadsheetUrl, '_blank');
      } else {
        throw new Error('Google Sheets URL not available');
      }
    } catch (error: any) {
      console.error('Error opening Google Sheets:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open Google Sheets. Please sync first.",
        variant: "destructive"
      });
    }
  };

  // Fetch sheets URL on component mount
  useEffect(() => {
    const fetchSheetsUrl = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/sales-form/sheets-url`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        if (result.success && result.data?.spreadsheetUrl) {
          setSheetsUrl(result.data.spreadsheetUrl);
        }
      } catch (error) {
        // Silently fail - URL will be fetched when needed
        console.warn('Could not fetch Google Sheets URL:', error);
      }
    };

    if (token) {
      fetchSheetsUrl();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="w-full space-y-2">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sales Forms</h1>
                <p className="text-xs text-gray-600">View and manage all sales form submissions</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                disabled={loading || (filteredForms.length === 0 && salesForms.length === 0)}
                className="border-gray-300 hover:bg-gray-50 h-8 px-2 text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Export CSV
              </Button>
              <Button
                onClick={syncToSheets}
                variant="outline"
                size="sm"
                disabled={loading || syncing || (filteredForms.length === 0 && salesForms.length === 0)}
                className="border-green-300 hover:bg-green-50 text-green-700 h-8 px-2 text-xs"
              >
                <CloudUpload className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync'}
              </Button>
              <Button
                onClick={openSheets}
                variant="outline"
                size="sm"
                disabled={!sheetsUrl}
                className="border-blue-300 hover:bg-blue-50 text-blue-700 h-8 px-2 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Sheets
              </Button>
              <Button
                onClick={fetchSalesForms}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-2 text-xs font-medium transition-colors"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 py-2">
            <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Compact Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          <div className="flex flex-col gap-1.5">
            {/* First Row: Search, Status, and Date Filters */}
            <div className="flex flex-col sm:flex-row gap-1.5 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search by company, contact, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md">
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
              <div className="flex items-center gap-1.5">
                <Select value={dayFilter} onValueChange={setDayFilter}>
                  <SelectTrigger className="w-16 h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {getDays().map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-20 h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {getMonths().map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label.substring(0, 3)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-16 h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {getYears().map(year => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(dayFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDateFilters}
                    className="h-8 px-2 text-xs border-gray-300 hover:bg-gray-50"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            {/* Second Row: Status Counts */}
            <div className="flex items-center justify-end gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                {salesForms.filter(f => f.status === 'pending').length} Pending
              </span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                {salesForms.filter(f => f.status === 'in_progress').length} In Progress
              </span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                {salesForms.filter(f => f.status === 'completed').length} Completed
              </span>
            </div>
          </div>
        </div>

        {/* Sales Forms Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-3 py-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-gray-600" />
              <h3 className="font-semibold text-sm text-gray-800">Sales Form Submissions ({filteredForms.length || salesForms.length})</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-medium text-gray-700 py-2 px-2 text-xs">Company</TableHead>
                  <TableHead className="font-medium text-gray-700 py-2 px-2 text-xs">Contact Person</TableHead>
                  <TableHead className="font-medium text-gray-700 py-2 px-2 text-xs">Contact Info</TableHead>
                  <TableHead className="font-medium text-gray-700 py-2 px-2 text-xs">Business Type</TableHead>
                  <TableHead className="font-medium text-gray-700 py-2 px-2 text-xs">Shipment Type</TableHead>
                  <TableHead className="font-medium text-gray-700 py-2 px-2 text-xs">Status</TableHead>
                  <TableHead className="font-medium text-gray-700 py-2 px-2 text-xs">Location</TableHead>
                  <TableHead className="font-medium text-gray-700 py-2 px-2 text-xs">Submitted</TableHead>
                  <TableHead className="font-medium text-gray-700 py-2 px-2 text-xs">Remarks</TableHead>
                  <TableHead className="font-medium text-gray-700 py-2 px-2 text-center text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">Loading sales forms...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredForms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-500">No sales forms found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredForms.map((form) => (
                    <TableRow key={form._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <TableCell className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                            {form.companyName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900">{form.companyName}</div>
                            {form.website && (
                              <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                {form.website}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{form.concernPersonName}</div>
                          <div className="text-xs text-gray-500">{form.designation}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-xs text-gray-900">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="truncate max-w-[120px]">{form.emailAddress}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-900">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{form.phoneNumber}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <Badge variant="outline" className="text-xs">{form.typeOfBusiness}</Badge>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <Badge variant="secondary" className="text-xs">{form.typeOfShipments}</Badge>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        {getStatusBadge(form.status)}
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <div className="text-xs">
                          {form.submissionFullAddress ? (
                            <div className="text-gray-900" title={form.submissionFullAddress}>
                              {form.submissionFullAddress.length > 40 
                                ? `${form.submissionFullAddress.substring(0, 40)}...` 
                                : form.submissionFullAddress}
                            </div>
                          ) : form.submissionCity ? (
                            <>
                              <div className="text-gray-900">{form.submissionCity}</div>
                              <div className="text-xs text-gray-500">{form.submissionState || form.submissionCountry || ''}</div>
                            </>
                          ) : form.fullAddress ? (
                            <div className="text-gray-900" title={form.fullAddress}>
                              {form.fullAddress.length > 40 
                                ? `${form.fullAddress.substring(0, 40)}...` 
                                : form.fullAddress}
                            </div>
                          ) : (
                            <div className="text-gray-500">N/A</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <div className="text-xs">
                          <div className="text-gray-900">{new Date(form.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(form.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={form.remarks || ''}
                            onChange={(e) => {
                              // Update local state immediately for better UX
                              setSalesForms(prevForms =>
                                prevForms.map(f =>
                                  f._id === form._id ? { ...f, remarks: e.target.value } : f
                                )
                              );
                            }}
                            placeholder="Add remarks..."
                            className="h-7 text-xs w-32 min-w-[120px]"
                            disabled={savingRemarks[form._id]}
                          />
                          {savingRemarks[form._id] ? (
                            <div className="flex-shrink-0">
                              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const newRemarks = form.remarks?.trim() || '';
                                const currentSaved = originalRemarks[form._id] || '';
                                
                                // Only save if there's a change
                                if (newRemarks !== currentSaved) {
                                  setSavingRemarks(prev => ({ ...prev, [form._id]: true }));
                                  
                                  try {
                                    const response = await fetch(`${API_BASE}/api/sales-form/${form._id}`, {
                                      method: 'PATCH',
                                      headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({ remarks: newRemarks })
                                    });

                                    if (response.ok) {
                                      const result = await response.json();
                                      if (result.success) {
                                        // Update the form in the local state with the saved value
                                        setSalesForms(prevForms =>
                                          prevForms.map(f =>
                                            f._id === form._id ? { ...f, remarks: newRemarks } : f
                                          )
                                        );
                                        
                                        // Also update filtered forms if needed
                                        setFilteredForms(prevForms =>
                                          prevForms.map(f =>
                                            f._id === form._id ? { ...f, remarks: newRemarks } : f
                                          )
                                        );
                                        
                                        // Update original remarks to mark as saved
                                        setOriginalRemarks(prev => ({ ...prev, [form._id]: newRemarks }));
                                        
                                        toast({
                                          title: "Saved",
                                          description: "Remarks saved successfully",
                                          variant: "default"
                                        });
                                      } else {
                                        throw new Error(result.message || 'Failed to save remarks');
                                      }
                                    } else {
                                      const result = await response.json();
                                      throw new Error(result.message || 'Failed to save remarks');
                                    }
                                  } catch (error: any) {
                                    console.error('Error saving remarks:', error);
                                    toast({
                                      title: "Error",
                                      description: error.message || "Failed to save remarks",
                                      variant: "destructive"
                                    });
                                  } finally {
                                    setSavingRemarks(prev => ({ ...prev, [form._id]: false }));
                                  }
                                } else {
                                  // No changes, show message
                                  toast({
                                    title: "No Changes",
                                    description: "No changes to save",
                                    variant: "default"
                                  });
                                }
                              }}
                              className={`h-7 w-7 p-0 flex-shrink-0 ${
                                (form.remarks?.trim() || '') !== (originalRemarks[form._id] || '')
                                  ? 'hover:bg-green-50 text-green-600 hover:text-green-700'
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                              }`}
                              title="Save remarks"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewForm(form)}
                            className="h-7 px-2.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditForm(form)}
                            className="h-7 px-2.5 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:border-green-400 hover:text-green-800 transition-colors"
                            title="Edit form"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          {form.status !== 'contacted' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContacted(form)}
                              className="h-7 w-7 p-0 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-colors"
                              title="Mark as contacted"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
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
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-600">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, total)} of {total} forms
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-2 py-1 h-7 text-xs"
                >
                  Previous
                </Button>
                <span className="text-xs text-gray-600 px-1.5">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="px-2 py-1 h-7 text-xs"
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-50 p-3">
          <DialogHeader className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Building2 className="h-4 w-4 text-blue-600" />
              Sales Form Details
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 mt-0.5">
              Submitted on {selectedForm ? formatDate(selectedForm.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedForm && (
            <div className="space-y-2">
              {/* Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                    {getStatusBadge(selectedForm.status)}
                  </div>
                  {selectedForm.notes && (
                    <div className="text-xs">
                      <p className="font-medium text-gray-500 mb-0.5">Notes</p>
                      <p className="text-gray-700">{selectedForm.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-gray-900">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Company Name</p>
                    <p className="text-sm text-gray-900">{selectedForm.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Website</p>
                    <p className="text-sm text-gray-900">{selectedForm.website || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Full Address</p>
                    <p className="text-sm text-gray-900">{selectedForm.fullAddress}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-gray-900">
                  <Phone className="h-4 w-4 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Concern Person</p>
                    <p className="text-sm text-gray-900">{selectedForm.concernPersonName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Designation</p>
                    <p className="text-sm text-gray-900">{selectedForm.designation}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Phone Number</p>
                    <p className="text-sm text-gray-900">{selectedForm.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Alternate Phone</p>
                    <p className="text-sm text-gray-900">{selectedForm.alternatePhoneNumber || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Email Address</p>
                    <p className="text-sm text-gray-900">{selectedForm.emailAddress}</p>
                  </div>
                </div>
              </div>

              {/* Business & Shipment Details */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-gray-900">
                  <Package className="h-4 w-4 text-blue-600" />
                  Business & Shipment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Type of Business</p>
                    <p className="text-sm text-gray-900">{selectedForm.typeOfBusiness}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Type of Shipments</p>
                    <p className="text-sm text-gray-900">{selectedForm.typeOfShipments}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Average Shipment Volume</p>
                    <p className="text-sm text-gray-900">{selectedForm.averageShipmentVolume}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Weight Range</p>
                    <p className="text-sm text-gray-900">{selectedForm.weightRange}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Most Frequent Routes</p>
                    <p className="text-sm text-gray-900">{selectedForm.mostFrequentRoutes}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Packing Required</p>
                    <Badge variant={selectedForm.packingRequired === 'yes' ? 'default' : 'secondary'} className="text-xs">
                      {selectedForm.packingRequired === 'yes' ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Logistics & Vehicle Requirements */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-gray-900">
                  <Truck className="h-4 w-4 text-blue-600" />
                  Logistics & Vehicle Requirements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Existing Logistics Partners</p>
                    <p className="text-sm text-gray-900">{selectedForm.existingLogisticsPartners}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Current Issues / Pain Points</p>
                    <p className="text-sm text-gray-900">{selectedForm.currentIssues}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Vehicles Needed Per Month</p>
                    <p className="text-sm text-gray-900">{selectedForm.vehiclesNeededPerMonth}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Type of Vehicle Required</p>
                    <p className="text-sm text-gray-900">{selectedForm.typeOfVehicleRequired}</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Image */}
              {selectedForm.uploadedImage && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-gray-900">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    Uploaded Image
                  </h3>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedForm.uploadedImage}
                      alt="Uploaded"
                      className="max-w-xs max-h-48 rounded-lg border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="text-xs text-gray-500">
                      {selectedForm.uploadedImageOriginalName && (
                        <p className="font-medium">File: {selectedForm.uploadedImageOriginalName}</p>
                      )}
                      <a
                        href={selectedForm.uploadedImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mt-1 inline-block"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks */}
              {selectedForm.remarks && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-gray-900">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Remarks
                  </h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedForm.remarks}</p>
                </div>
              )}
            </div>
          )}

          {/* Location Information */}
          {(selectedForm?.submissionFullAddress || selectedForm?.submissionCity || selectedForm?.submissionState || selectedForm?.submissionCountry) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-gray-900">
                <Navigation className="h-4 w-4 text-blue-600" />
                Submission Location
              </h3>
              {selectedForm?.submissionFullAddress && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Full Address</p>
                  <p className="text-sm text-gray-900">{selectedForm.submissionFullAddress}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">City</p>
                  <p className="text-sm text-gray-900">{selectedForm?.submissionCity || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">State</p>
                  <p className="text-sm text-gray-900">{selectedForm?.submissionState || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Country</p>
                  <p className="text-sm text-gray-900">{selectedForm?.submissionCountry || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-50 p-3">
          <DialogHeader className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Edit className="h-4 w-4 text-blue-600" />
              Edit Sales Form
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 mt-0.5">
              Update sales form information
            </DialogDescription>
          </DialogHeader>

          {editingForm && (
            <div className="space-y-2">
              {/* Company Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-gray-900">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Company Name *</label>
                    <Input
                      value={editFormData.companyName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Website</label>
                    <Input
                      value={editFormData.website || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                      className="h-8 text-sm"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Full Address *</label>
                    <Input
                      value={editFormData.fullAddress || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, fullAddress: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-gray-900">
                  <Phone className="h-4 w-4 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Concern Person *</label>
                    <Input
                      value={editFormData.concernPersonName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, concernPersonName: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Designation *</label>
                    <Input
                      value={editFormData.designation || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Phone Number *</label>
                    <Input
                      value={editFormData.phoneNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Alternate Phone</label>
                    <Input
                      value={editFormData.alternatePhoneNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, alternatePhoneNumber: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Email Address *</label>
                    <Input
                      type="email"
                      value={editFormData.emailAddress || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, emailAddress: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Business & Shipment Details */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-gray-900">
                  <Package className="h-4 w-4 text-blue-600" />
                  Business & Shipment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Type of Business *</label>
                    <Select
                      value={editFormData.typeOfBusiness || ''}
                      onValueChange={(value) => {
                        setEditFormData({ ...editFormData, typeOfBusiness: value });
                        if (value !== 'Other') {
                          setCustomTypeOfBusiness('');
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select type of business" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Automotive">Automotive</SelectItem>
                        <SelectItem value="Computer">Computer</SelectItem>
                        <SelectItem value="E-commerce">E-commerce</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Food & Beverages">Food & Beverages</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Pharmaceutical">Pharmaceutical</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Textiles">Textiles</SelectItem>
                        <SelectItem value="Wholesale">Wholesale</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {editFormData.typeOfBusiness === 'Other' && (
                      <div className="mt-2">
                        <Input
                          value={customTypeOfBusiness}
                          onChange={(e) => setCustomTypeOfBusiness(e.target.value)}
                          placeholder="Please specify type of business"
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Type of Shipments *</label>
                    <Select
                      value={editFormData.typeOfShipments || ''}
                      onValueChange={(value) => {
                        setEditFormData({ ...editFormData, typeOfShipments: value });
                        if (value !== 'Other') {
                          setCustomTypeOfShipments('');
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select type of shipments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Documents">Documents</SelectItem>
                        <SelectItem value="Parcels">Parcels</SelectItem>
                        <SelectItem value="Bulk Cargo">Bulk Cargo</SelectItem>
                        <SelectItem value="Fragile Items">Fragile Items</SelectItem>
                        <SelectItem value="Perishable Goods">Perishable Goods</SelectItem>
                        <SelectItem value="Hazardous Materials">Hazardous Materials</SelectItem>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {editFormData.typeOfShipments === 'Other' && (
                      <div className="mt-2">
                        <Input
                          value={customTypeOfShipments}
                          onChange={(e) => setCustomTypeOfShipments(e.target.value)}
                          placeholder="Please specify type of shipments"
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Average Shipment Volume *</label>
                    <Input
                      value={editFormData.averageShipmentVolume || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, averageShipmentVolume: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Weight Range *</label>
                    <Select
                      value={editFormData.weightRange || ''}
                      onValueChange={(value) => setEditFormData({ ...editFormData, weightRange: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select weight range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-5 Kg.">0-5 Kg.</SelectItem>
                        <SelectItem value="5-10 Kg.">5-10 Kg.</SelectItem>
                        <SelectItem value="10-25 Kg.">10-25 Kg.</SelectItem>
                        <SelectItem value="25-50 Kg.">25-50 Kg.</SelectItem>
                        <SelectItem value="50-100 Kg.">50-100 Kg.</SelectItem>
                        <SelectItem value="100-500 Kg.">100-500 Kg.</SelectItem>
                        <SelectItem value="500 Kg. +">500 Kg. +</SelectItem>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Most Frequent Routes *</label>
                    <Input
                      value={editFormData.mostFrequentRoutes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, mostFrequentRoutes: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Packing Required *</label>
                    <Select
                      value={editFormData.packingRequired || 'no'}
                      onValueChange={(value) => setEditFormData({ ...editFormData, packingRequired: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Logistics & Vehicle Requirements */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-gray-900">
                  <Truck className="h-4 w-4 text-blue-600" />
                  Logistics & Vehicle Requirements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Existing Logistics Partners *</label>
                    <Input
                      value={editFormData.existingLogisticsPartners || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, existingLogisticsPartners: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Current Issues / Pain Points *</label>
                    <Textarea
                      value={editFormData.currentIssues || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, currentIssues: e.target.value })}
                      className="min-h-[60px] text-sm"
                      placeholder="Describe current issues or pain points..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Vehicles Needed Per Month *</label>
                    <Input
                      value={editFormData.vehiclesNeededPerMonth || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, vehiclesNeededPerMonth: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Type of Vehicle Required *</label>
                    <Select
                      value={editFormData.typeOfVehicleRequired || ''}
                      onValueChange={(value) => {
                        setEditFormData({ ...editFormData, typeOfVehicleRequired: value });
                        if (value !== 'Others') {
                          setCustomTypeOfVehicleRequired('');
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select type of vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tata Ace">Tata Ace</SelectItem>
                        <SelectItem value="Pickup Van">Pickup Van</SelectItem>
                        <SelectItem value="407 Truck">407 Truck</SelectItem>
                        <SelectItem value="14ft">14ft</SelectItem>
                        <SelectItem value="17ft">17ft</SelectItem>
                        <SelectItem value="1109 Truck">1109 Truck</SelectItem>
                        <SelectItem value="20ft">20ft</SelectItem>
                        <SelectItem value="22ft">22ft</SelectItem>
                        <SelectItem value="Container">Container</SelectItem>
                        <SelectItem value="Trailer">Trailer</SelectItem>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    {editFormData.typeOfVehicleRequired === 'Others' && (
                      <div className="mt-2">
                        <Input
                          value={customTypeOfVehicleRequired}
                          onChange={(e) => setCustomTypeOfVehicleRequired(e.target.value)}
                          placeholder="Please specify type of vehicle"
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Notes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-gray-900">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Status & Notes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Status</label>
                    <Select
                      value={editFormData.status || 'pending'}
                      onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="seen">Seen</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-0.5 block">Notes</label>
                    <Textarea
                      value={editFormData.notes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      className="min-h-[60px] text-sm"
                      placeholder="Add notes..."
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingForm(null);
                    setEditFormData({});
                    setCustomTypeOfBusiness('');
                    setCustomTypeOfShipments('');
                    setCustomTypeOfVehicleRequired('');
                  }}
                  disabled={saving}
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesForms;