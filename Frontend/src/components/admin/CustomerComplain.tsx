import React, { useState, useEffect, useMemo } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  RefreshCw,
  Filter,
  Eye,
  MessageCircle,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  User,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import CourierComplaintChatModal from "./CourierComplaintChatModal";

interface CustomerComplain {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category: string;
  priority?: string;
  source?: 'public' | 'corporate' | 'customer-app';
  corporateInfo?: {
    corporateId?: string;
    companyName?: string;
    email?: string;
    contactNumber?: string;
  };
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  response?: string;
  responseDate?: string;
  respondedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CourierComplaint {
  _id: string;
  consignmentNumber: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  response?: string;
  responseDate?: string;
  respondedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  corporateInfo?: {
    companyName: string;
    email: string;
    contactNumber: string;
  };
  shipmentInfo?: {
    destination: string;
    courierName?: string;
    courierContact?: string;
  };
  messages?: Array<{
    _id?: string;
    message: string;
    senderType: 'corporate' | 'admin';
    senderId: string;
    senderName: string;
    createdAt: string | Date;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byStatus: Array<{ _id: string; count: number }>;
  byCategory: Array<{ _id: string; count: number }>;
}

const CustomerComplain = () => {
  const [activeTab, setActiveTab] = useState<'customer' | 'courier'>('customer');
  const [complaints, setComplaints] = useState<(CustomerComplain | CourierComplaint)[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<CustomerComplain | CourierComplaint | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCourierComplaint, setSelectedCourierComplaint] = useState<CourierComplaint | null>(null);
  const [isCourierChatOpen, setIsCourierChatOpen] = useState(false);
  const [statusTab, setStatusTab] = useState<'active' | 'complete'>('active');
  const [searchFocused, setSearchFocused] = useState(false);
  
  const { toast } = useToast();

  const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchComplaints();
    fetchStats();
  }, [statusFilter, categoryFilter, searchTerm, currentPage, activeTab]);

  const fetchComplaints = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        setError('Please login as admin to view complaints');
        return;
      }

      if (activeTab === 'customer') {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      
      const response = await fetch(`${API_BASE}/api/customer-complain?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComplaints(data.data);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalCount(data.pagination?.totalCount || 0);
        } else {
          setError(data.error || 'Failed to load complaints');
        }
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        window.location.href = '/admin';
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to load complaints');
        }
      } else {
        // Fetch courier complaints
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
        });
        
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (categoryFilter !== 'all') params.append('category', categoryFilter);
        
        const response = await fetch(`${API_BASE}/api/admin/courier-complaints?${params}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setComplaints(data.data);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalCount(data.pagination?.totalCount || 0);
          } else {
            setError(data.error || 'Failed to load courier complaints');
          }
        } else if (response.status === 401) {
          setError('Session expired. Please login again.');
          window.location.href = '/admin';
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to load courier complaints');
        }
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Network error while loading complaints');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) return;

      const endpoint = activeTab === 'customer' 
        ? `${API_BASE}/api/customer-complain/stats`
        : `${API_BASE}/api/admin/courier-complaints/stats`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleView = (complaint: CustomerComplain | CourierComplaint) => {
    setSelectedComplaint(complaint);
    setIsViewDialogOpen(true);
  };

  const handleRespond = (complaint: CustomerComplain | CourierComplaint) => {
    setSelectedComplaint(complaint);
    setResponseText(complaint.response || '');
    setNewStatus(complaint.status);
    setIsResponseDialogOpen(true);
  };

  const handleOpenCourierChat = (complaint: CourierComplaint) => {
    const normalizedComplaint: CourierComplaint = {
      ...complaint,
      _id: (complaint as any)._id || (complaint as any).id || '',
      messages: complaint.messages || [],
    };
    setSelectedCourierComplaint(normalizedComplaint);
    setIsCourierChatOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedComplaint) return;

    setIsSubmitting(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast({
          title: "Error",
          description: "Please login as admin",
          variant: "destructive",
        });
        return;
      }

      const endpoint = activeTab === 'customer'
        ? `${API_BASE}/api/customer-complain/${selectedComplaint._id}`
        : `${API_BASE}/api/admin/courier-complaints/${selectedComplaint._id}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: newStatus,
          response: responseText,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Complaint updated successfully",
        });
        setIsResponseDialogOpen(false);
        setSelectedComplaint(null);
        setResponseText('');
        fetchComplaints();
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update complaint",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast({
        title: "Error",
        description: "Network error while updating complaint",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Open': { variant: 'destructive' as const, icon: AlertCircle },
      'In Progress': { variant: 'default' as const, icon: Clock },
      'Resolved': { variant: 'default' as const, icon: CheckCircle },
      'Closed': { variant: 'secondary' as const, icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Open'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 text-[10px] px-2 py-0.5">
        <Icon className="h-2.5 w-2.5" />
        {status}
      </Badge>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      // Customer complaint categories
      'General Inquiry': 'bg-blue-100 text-blue-800',
      'Booking Issue': 'bg-yellow-100 text-yellow-800',
      'Tracking Issue': 'bg-purple-100 text-purple-800',
      'Payment Issue': 'bg-red-100 text-red-800',
      'Complaint': 'bg-orange-100 text-orange-800',
      'Feedback': 'bg-green-100 text-green-800',
      // Courier complaint categories
      'Delivery Delay': 'bg-yellow-100 text-yellow-800',
      'Package Damage': 'bg-red-100 text-red-800',
      'Wrong Delivery': 'bg-orange-100 text-orange-800',
      'Courier Behavior': 'bg-pink-100 text-pink-800',
      'Communication Issues': 'bg-purple-100 text-purple-800',
      'Pickup Issues': 'bg-blue-100 text-blue-800',
      'Other': 'bg-gray-100 text-gray-800',
      // Corporate ticket categories
      'Delivery Issues': 'bg-yellow-100 text-yellow-800',
      'Billing & Payment': 'bg-blue-100 text-blue-800',
      'Service Quality': 'bg-purple-100 text-purple-800',
      'Tracking Issues': 'bg-indigo-100 text-indigo-800',
      'Others': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors['Other'];
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive" className="text-[10px] px-2 py-0.5">High</Badge>;
      case 'Medium':
        return <Badge variant="secondary" className="text-[10px] px-2 py-0.5">Medium</Badge>;
      case 'Low':
        return <Badge variant="outline" className="text-[10px] px-2 py-0.5">Low</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-2 py-0.5">{priority}</Badge>;
    }
  };

  const isCourierView = activeTab === 'courier';

  const statusGroups = useMemo(() => {
    const activeStatuses = new Set(['Open', 'In Progress']);
    const completeStatuses = new Set(['Resolved', 'Closed']);

    return {
      active: complaints.filter((complaint) => activeStatuses.has(complaint.status)),
      complete: complaints.filter((complaint) => completeStatuses.has(complaint.status)),
    };
  }, [complaints]);

  const displayedComplaints = statusGroups[statusTab];

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-200px)] pt-6 pb-6">
      <div className="w-full max-w-6xl space-y-4 px-4 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Complaints Management</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Manage and respond to customer and courier complaints</p>
        </div>
          <button
            type="button"
            onClick={() => { fetchComplaints(); fetchStats(); }}
            className="h-8 px-3 rounded-lg bg-white text-gray-700 text-xs border-0 inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 self-start md:self-auto"
            style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
      </div>

        <div className="rounded-xl border border-gray-200 bg-white/80 shadow-sm overflow-hidden">
          <div className="flex">
        <button
          onClick={() => {
            setActiveTab('customer');
            setCurrentPage(1);
            setSearchTerm('');
            setStatusFilter('all');
            setCategoryFilter('all');
                setStatusTab('active');
          }}
              className={cn(
                "flex-1 px-4 py-2.5 text-xs font-semibold transition-all duration-200",
            activeTab === 'customer'
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-inner"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            Customer Complaints
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('courier');
            setCurrentPage(1);
            setSearchTerm('');
            setStatusFilter('all');
            setCategoryFilter('all');
                setStatusTab('active');
          }}
              className={cn(
                "flex-1 px-4 py-2.5 text-xs font-semibold transition-all duration-200",
            activeTab === 'courier'
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-inner"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            Courier Complaints
          </div>
        </button>
          </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Card className="border-0 bg-purple-50 shadow-none" style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}>
            <CardContent className="pt-2 pb-2 px-3">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-purple-700">Total</p>
                  <p className="text-base font-bold text-purple-600">{stats.total}</p>
                </div>
                <MessageCircle className="h-4 w-4 text-purple-500" />
              </div>
            </CardContent>
          </Card>
            <Card className="border-0 bg-red-50 shadow-none" style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}>
            <CardContent className="pt-2 pb-2 px-3">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-red-700">Open</p>
                  <p className="text-base font-bold text-red-600">{stats.open}</p>
                </div>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            </CardContent>
          </Card>
            <Card className="border-0 bg-blue-50 shadow-none" style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}>
            <CardContent className="pt-2 pb-2 px-3">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-blue-700">In Progress</p>
                  <p className="text-base font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
            </CardContent>
          </Card>
            <Card className="border-0 bg-green-50 shadow-none" style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}>
            <CardContent className="pt-2 pb-2 px-3">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-green-700">Resolved</p>
                  <p className="text-base font-bold text-green-600">{stats.resolved}</p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </CardContent>
          </Card>
            <Card className="border-0 bg-orange-50 shadow-none" style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}>
            <CardContent className="pt-2 pb-2 px-3">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-orange-700">Closed</p>
                  <p className="text-base font-bold text-orange-600">{stats.closed}</p>
                </div>
                <CheckCircle className="h-4 w-4 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

        <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-700">Quick Filters</p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex-1 relative max-w-[720px] w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5 z-10" />
              <div className="relative">
                <Input
                  placeholder=""
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="h-8 pl-10 rounded-full border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-0 focus:ring-offset-0 text-xs"
                  style={{ 
                    borderColor: searchFocused || searchTerm ? '#3b82f6' : '#d1d5db',
                    boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
                  }}
                />
                <label 
                  className={`absolute left-10 transition-all duration-200 pointer-events-none bg-white px-1 ${
                    searchFocused || searchTerm 
                      ? '-top-2 text-[10px] text-blue-600 font-medium' 
                      : 'top-1/2 -translate-y-1/2 text-xs text-gray-500'
                  }`}
                >
                  {activeTab === 'customer' 
                    ? "Search by name, email, subject, or message..."
                    : "Search by consignment number, subject, or company name..."}
                </label>
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
                <SelectTrigger 
                  className="w-full md:w-[160px] h-8 border border-gray-300 focus:border-blue-500 focus:ring-0 rounded-md text-xs"
                  style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
                >
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setCurrentPage(1); }}>
                <SelectTrigger 
                  className="w-full md:w-[160px] h-8 border border-gray-300 focus:border-blue-500 focus:ring-0 rounded-md text-xs"
                  style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
                >
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {activeTab === 'customer' ? (
                  <>
                <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                <SelectItem value="Booking Issue">Booking Issue</SelectItem>
                <SelectItem value="Tracking Issue">Tracking Issue</SelectItem>
                <SelectItem value="Payment Issue">Payment Issue</SelectItem>
                <SelectItem value="Complaint">Complaint</SelectItem>
                <SelectItem value="Feedback">Feedback</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="Delivery Issues">Delivery Issues</SelectItem>
                <SelectItem value="Billing & Payment">Billing & Payment</SelectItem>
                <SelectItem value="Package Damage">Package Damage</SelectItem>
                <SelectItem value="Service Quality">Service Quality</SelectItem>
                <SelectItem value="Tracking Issues">Tracking Issues</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="Delivery Delay">Delivery Delay</SelectItem>
                    <SelectItem value="Package Damage">Package Damage</SelectItem>
                    <SelectItem value="Wrong Delivery">Wrong Delivery</SelectItem>
                    <SelectItem value="Courier Behavior">Courier Behavior</SelectItem>
                    <SelectItem value="Communication Issues">Communication Issues</SelectItem>
                    <SelectItem value="Pickup Issues">Pickup Issues</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

      {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

        <Card
          className={cn(
            "border-0 overflow-hidden",
            "bg-white/90"
          )}
          style={{
            boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
          }}
        >
          <div className="px-4 pt-3 pb-3 border-b border-gray-100 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400">
                Overview
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {isCourierView ? 'Courier Complaints' : 'Customer Complaints'} ({totalCount})
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Showing {statusTab === 'active' ? 'Open & In Progress' : 'Resolved & Closed'}
            </p>
          </div>
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setStatusTab('active')}
              className={cn(
                "flex-1 px-3 py-2 text-xs font-medium transition-colors duration-200",
                statusTab === 'active'
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Active Complaints
            </button>
            <button
              onClick={() => setStatusTab('complete')}
              className={cn(
                "flex-1 px-3 py-2 text-xs font-medium transition-colors duration-200",
                statusTab === 'complete'
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Complete Complaints
            </button>
          </div>
          <CardContent className="p-0">
          {isLoading ? (
              <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
            </div>
            ) : displayedComplaints.length === 0 ? (
              <div className="p-6 text-center bg-gradient-to-b from-gray-50 to-white">
                <div className="p-3 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] bg-white">
                  {isCourierView ? (
                    <Truck className="h-6 w-6 text-gray-400" strokeWidth={1.5} />
                  ) : (
                    <MessageCircle className="h-6 w-6 text-gray-400" strokeWidth={1.5} />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1.5">
                  {statusTab === 'active' ? 'No active complaints' : 'No completed complaints'}
                </h3>
                <p className="text-xs text-gray-500">
                  Everything looks quiet here. New complaints will appear automatically.
                </p>
            </div>
          ) : (
              <div className="space-y-0">
                {displayedComplaints.map((complaint, index) => {
                      const courierComplaint = complaint as CourierComplaint;
                      const customerComplaint = complaint as CustomerComplain;
                      return (
                    <div
                      key={complaint._id}
                      className={cn(
                        "p-4",
                        index !== displayedComplaints.length - 1 && "border-b border-gray-100"
                      )}
                    >
                      <div className="flex flex-wrap items-start gap-1.5 mb-2">
                        <h3 className="font-semibold text-xs text-gray-900">{complaint.subject}</h3>
                        {getStatusBadge(complaint.status)}
                        <Badge className={cn(getCategoryColor(complaint.category), "text-[10px] px-2 py-0.5")}>
                          {complaint.category}
                        </Badge>
                        {isCourierView && courierComplaint.priority && getPriorityBadge(courierComplaint.priority)}
                        {!isCourierView && customerComplaint.priority && getPriorityBadge(customerComplaint.priority)}
                        {!isCourierView && customerComplaint.source === 'corporate' && (
                          <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                            Corporate
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-[11px] text-gray-600 space-y-0.5">
                          {isCourierView ? (
                            <>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="font-medium">
                                  {courierComplaint.corporateInfo?.companyName || 'N/A'}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{courierComplaint.corporateInfo?.email || 'No email'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Package className="h-3 w-3 text-gray-400" />
                                <span className="font-mono">{courierComplaint.consignmentNumber}</span>
                                {courierComplaint.shipmentInfo?.destination && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span>{courierComplaint.shipmentInfo.destination}</span>
                                  </>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              {customerComplaint.corporateInfo ? (
                                <>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <User className="h-3 w-3 text-gray-400" />
                                    <span className="font-medium">
                                      {customerComplaint.corporateInfo.companyName || customerComplaint.name}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span>{customerComplaint.corporateInfo.email || customerComplaint.email}</span>
                                  </div>
                                  {(customerComplaint.corporateInfo.contactNumber || customerComplaint.phone) && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <Phone className="h-3 w-3 text-gray-400" />
                                      <span>{customerComplaint.corporateInfo.contactNumber || customerComplaint.phone}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <User className="h-3 w-3 text-gray-400" />
                                    <span className="font-medium">{customerComplaint.name}</span>
                                    <span className="text-gray-400">•</span>
                                    <span>{customerComplaint.email}</span>
                                  </div>
                                  {customerComplaint.phone && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <Phone className="h-3 w-3 text-gray-400" />
                                      <span>{customerComplaint.phone}</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-500">Created: {formatDate(complaint.createdAt)}</span>
                          </div>
                          {complaint.updatedAt && complaint.updatedAt !== complaint.createdAt && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-500">Updated: {formatDate(complaint.updatedAt)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:flex-row sm:flex-shrink-0">
                          <button
                            type="button"
                            className="h-8 px-3 rounded-lg bg-white text-gray-700 text-xs border-0 inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                            style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
                            onClick={() => handleView(complaint)}
                          >
                            View Details
                          </button>
                          {isCourierView ? (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 px-3 rounded-lg bg-blue-50 text-blue-700 text-xs hover:bg-blue-50 hover:text-blue-700"
                                onClick={() => handleOpenCourierChat(courierComplaint)}
                              >
                                <MessageSquare className="h-3 w-3 mr-1.5" />
                                Open Chat
                              </Button>
                              <button
                                type="button"
                                className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                                style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
                                onClick={() => handleRespond(complaint)}
                              >
                                Update Status
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                              style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
                              onClick={() => handleRespond(complaint)}
                            >
                              Respond
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
            <DialogDescription>
              View full details of the customer complaint
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              {activeTab === 'customer' ? (
                <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-sm">{(selectedComplaint as CustomerComplain).name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm">{(selectedComplaint as CustomerComplain).email}</p>
                </div>
                    {(selectedComplaint as CustomerComplain).phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="text-sm">{(selectedComplaint as CustomerComplain).phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <Badge className={getCategoryColor(selectedComplaint.category)}>
                    {selectedComplaint.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  {getStatusBadge(selectedComplaint.status)}
                </div>
                {(selectedComplaint as CustomerComplain).priority && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Priority</p>
                    {getPriorityBadge((selectedComplaint as CustomerComplain).priority!)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-sm">{new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                </div>
                {(selectedComplaint as CustomerComplain).corporateInfo?.companyName && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Company</p>
                    <p className="text-sm">
                      {(selectedComplaint as CustomerComplain).corporateInfo?.companyName}
                      { (selectedComplaint as CustomerComplain).corporateInfo?.corporateId
                        ? ` (${(selectedComplaint as CustomerComplain).corporateInfo?.corporateId})`
                        : ''}
                    </p>
                  </div>
                )}
                {(selectedComplaint as CustomerComplain).corporateInfo?.contactNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Corporate Contact</p>
                    <p className="text-sm">{(selectedComplaint as CustomerComplain).corporateInfo?.contactNumber}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Subject</p>
                <p className="text-sm">{selectedComplaint.subject}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Message</p>
                    <p className="text-sm whitespace-pre-wrap">{(selectedComplaint as CustomerComplain).message}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company Name</p>
                      <p className="text-sm">{(selectedComplaint as CourierComplaint).corporateInfo?.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm">{(selectedComplaint as CourierComplaint).corporateInfo?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contact</p>
                      <p className="text-sm">{(selectedComplaint as CourierComplaint).corporateInfo?.contactNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Consignment Number</p>
                      <p className="text-sm font-mono">{(selectedComplaint as CourierComplaint).consignmentNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Destination</p>
                      <p className="text-sm">{(selectedComplaint as CourierComplaint).shipmentInfo?.destination || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Courier</p>
                      <p className="text-sm">{(selectedComplaint as CourierComplaint).shipmentInfo?.courierName || 'Not Assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Category</p>
                      <Badge className={getCategoryColor(selectedComplaint.category)}>
                        {selectedComplaint.category}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Priority</p>
                      <Badge variant={(selectedComplaint as CourierComplaint).priority === 'High' ? 'destructive' : (selectedComplaint as CourierComplaint).priority === 'Medium' ? 'secondary' : 'outline'}>
                        {(selectedComplaint as CourierComplaint).priority}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      {getStatusBadge(selectedComplaint.status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="text-sm">{new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Subject</p>
                    <p className="text-sm">{selectedComplaint.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{(selectedComplaint as CourierComplaint).description}</p>
              </div>
                </>
              )}
              {selectedComplaint.response && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Response</p>
                  <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{selectedComplaint.response}</p>
                  {selectedComplaint.respondedBy && (
                    <p className="text-xs text-gray-500 mt-2">
                      Responded by {selectedComplaint.respondedBy.name} on{' '}
                      {selectedComplaint.responseDate
                        ? new Date(selectedComplaint.responseDate).toLocaleString()
                        : 'N/A'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedComplaint && (
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                handleRespond(selectedComplaint);
              }}>
                Respond
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Complaint</DialogTitle>
            <DialogDescription>
              Update status and add response to the complaint
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Response</p>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response to the customer..."
                  rows={6}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsResponseDialogOpen(false);
              setResponseText('');
              setSelectedComplaint(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmitResponse} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Response'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Courier Complaint Chat Modal */}
      {selectedCourierComplaint && selectedCourierComplaint._id && (
        <CourierComplaintChatModal
          isOpen={isCourierChatOpen}
          onClose={() => {
            setIsCourierChatOpen(false);
            setSelectedCourierComplaint(null);
            fetchComplaints(); // Refresh complaints
          }}
          complaint={selectedCourierComplaint}
          onStatusChange={() => {
            fetchComplaints(); // Refresh when status changes
          }}
        />
      )}
    </div>
  </div>
  );
};

export default CustomerComplain;


