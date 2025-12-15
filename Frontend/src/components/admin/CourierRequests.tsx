import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Truck, 
  MapPin, 
  Phone, 
  Clock, 
  User, 
  Building,
  Package,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Weight,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourierRequest {
  id: string;
  requestType?: 'corporate' | 'customer';
  corporateId?: string | null;
  corporateInfo: {
    corporateId: string;
    companyName: string;
    email: string;
    contactNumber: string;
  } | null;
  requestData: {
    pickupAddress: string;
    contactPerson: string;
    contactPhone: string;
    urgency: 'normal' | 'urgent' | 'immediate';
    specialInstructions: string;
    packageCount: number;
    weight: number;
  };
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  requestedAt: string;
  estimatedResponseTime: string;
  assignedCourier?: {
    name: string;
    phone: string;
    id: string;
  };
  assignedAt?: string;
  completedAt?: string;
}

interface CourierBoy {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  area: string;
  status: string;
}

const CourierRequests: React.FC = () => {
  const [requests, setRequests] = useState<CourierRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<CourierRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [courierBoys, setCourierBoys] = useState<CourierBoy[]>([]);
  const [loadingCourierBoys, setLoadingCourierBoys] = useState(false);
  const [selectedCourierBoyId, setSelectedCourierBoyId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRequest, setNewRequest] = useState({
    location: '',
    name: '',
    phoneNumber: '',
    packageCount: 1,
    weight: 0.1,
    specialInstructions: ''
  });
  const { toast } = useToast();

  // Fetch courier requests on component mount
  useEffect(() => {
    fetchCourierRequests();
  }, []);

  const fetchCourierBoys = async () => {
    try {
      setLoadingCourierBoys(true);
      
      // Determine which token to use
      const adminToken = localStorage.getItem('adminToken');
      const officeToken = localStorage.getItem('officeToken');
      
      let token;
      if (adminToken) {
        token = adminToken;
      } else if (officeToken) {
        token = officeToken;
      } else {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/courier-boy?status=approved&limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCourierBoys(data.courierBoys || []);
        }
      }
    } catch (error) {
      console.error('Error fetching courier boys:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courier boys",
        variant: "destructive"
      });
    } finally {
      setLoadingCourierBoys(false);
    }
  };

  const handleAssignClick = (request: CourierRequest) => {
    setSelectedRequest(request);
    setSelectedCourierBoyId('');
    setShowAssignModal(true);
    fetchCourierBoys();
  };

  const handleAssignCourier = async () => {
    if (!selectedRequest || !selectedCourierBoyId) {
      toast({
        title: "Error",
        description: "Please select a courier boy",
        variant: "destructive"
      });
      return;
    }

    try {
      setAssigning(true);
      
      // Determine which token and endpoint to use
      const adminToken = localStorage.getItem('adminToken');
      const officeToken = localStorage.getItem('officeToken');
      
      let token, endpoint;
      if (adminToken) {
        token = adminToken;
        endpoint = `/api/admin/courier-requests/${selectedRequest.id}/assign`;
      } else if (officeToken) {
        token = officeToken;
        endpoint = `/api/office/courier-requests/${selectedRequest.id}/assign`;
      } else {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courierBoyId: selectedCourierBoyId })
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh requests list
        await fetchCourierRequests();
        
        toast({
          title: "Success",
          description: `Courier boy assigned successfully`,
        });
        
        setShowAssignModal(false);
        setSelectedRequest(null);
        setSelectedCourierBoyId('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign courier boy');
      }
    } catch (error) {
      console.error('Error assigning courier boy:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign courier boy",
        variant: "destructive"
      });
    } finally {
      setAssigning(false);
    }
  };

  const fetchCourierRequests = async () => {
    try {
      setLoading(true);
      
      // Determine which token and endpoint to use
      const adminToken = localStorage.getItem('adminToken');
      const officeToken = localStorage.getItem('officeToken');
      
      let token, endpoint;
      if (adminToken) {
        token = adminToken;
        endpoint = '/api/admin/courier-requests';
      } else if (officeToken) {
        token = officeToken;
        endpoint = '/api/office/courier-requests';
      } else {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Courier requests fetched:', data);
        setRequests(data.requests || []);
      } else {
        // Set empty array if API fails
        console.log('API failed, no data available. Status:', response.status);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching courier requests:', error);
      // Set empty array on error
      setRequests([]);
      toast({
        title: "Error",
        description: "Failed to fetch courier requests. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      // Determine which token and endpoint to use
      const adminToken = localStorage.getItem('adminToken');
      const officeToken = localStorage.getItem('officeToken');
      
      let token, endpoint;
      if (adminToken) {
        token = adminToken;
        endpoint = `/api/admin/courier-requests/${requestId}/status`;
      } else if (officeToken) {
        token = officeToken;
        endpoint = `/api/office/courier-requests/${requestId}/status`;
      } else {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: newStatus as any, assignedAt: new Date().toISOString() }
            : req
        ));

        toast({
          title: "Status Updated",
          description: `Request ${requestId} status updated to ${newStatus}`,
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleCreateCustomerRequest = async () => {
    if (!newRequest.location || !newRequest.name || !newRequest.phoneNumber) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);
      
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/courier-requests/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          location: newRequest.location,
          name: newRequest.name,
          phoneNumber: newRequest.phoneNumber,
          packageCount: newRequest.packageCount,
          weight: newRequest.weight,
          specialInstructions: newRequest.specialInstructions
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Customer courier request created successfully",
        });
        
        // Reset form and close modal
        setNewRequest({ 
          location: '', 
          name: '', 
          phoneNumber: '',
          packageCount: 1,
          weight: 0.1,
          specialInstructions: ''
        });
        setShowCreateModal(false);
        
        // Refresh requests list
        await fetchCourierRequests();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer request');
      }
    } catch (error) {
      console.error('Error creating customer request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create customer request",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const companyName = request.corporateInfo?.companyName || '';
    const corporateId = request.corporateInfo?.corporateId || '';
    const customerName = request.requestType === 'customer' ? request.requestData.contactPerson : '';
    
    const matchesSearch = companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         corporateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || request.requestData.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const urgentCount = requests.filter(r => r.requestData.urgency === 'urgent' || r.requestData.urgency === 'immediate').length;

  if (loading) {
    return (
      <div className="space-y-4 px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">PickUp Requests</h2>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 animate-pulse" style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6 lg:px-8">
      {/* Header with Stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">PickUp Requests</h2>
        <div className="flex items-center gap-3">
          {/* Compact Stats */}
          <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-lg border border-gray-200" style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">{requests.length}</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-semibold text-gray-900">{pendingCount}</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-gray-900">{urgentCount}</span>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)} 
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            style={{ boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)' }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Request
          </Button>
          <Button onClick={fetchCourierRequests} variant="outline" size="sm" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)' }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white rounded-lg border border-gray-200" style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 h-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
                className="px-3 py-2 h-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}
        >
          <option value="all">All Urgency</option>
          <option value="immediate">Immediate</option>
          <option value="urgent">Urgent</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      {/* Compact Requests List */}
      <div className="space-y-2">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-gray-200" style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
            <Truck className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No courier requests found</h3>
            <p className="text-xs text-gray-600">No requests match your current filters.</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div 
              key={request.id} 
              className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 p-3"
              style={{ 
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)';
              }}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge className={`${getStatusColor(request.status)} text-xs px-2 py-0.5`}>
                      {request.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={`${getUrgencyColor(request.requestData.urgency)} text-xs px-2 py-0.5`}>
                      {request.requestData.urgency}
                    </Badge>
                    {request.requestType === 'customer' && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5">CUSTOMER</Badge>
                    )}
                    <span className="text-xs text-gray-500">{formatTimeAgo(request.requestedAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {request.requestType === 'customer' 
                          ? request.requestData.contactPerson 
                          : request.corporateInfo?.companyName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span>{request.requestData.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{request.requestData.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 min-w-0">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{request.requestData.pickupAddress}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Package className="h-3.5 w-3.5 text-gray-400" />
                      <span>{request.requestData.packageCount} pkg</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Weight className="h-3.5 w-3.5 text-gray-400" />
                      <span>{request.requestData.weight}kg</span>
                    </div>
                    {request.assignedCourier && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600">
                        <Truck className="h-3.5 w-3.5" />
                        <span>{request.assignedCourier.name}</span>
                      </div>
                    )}
                  </div>
                  
                  {request.requestData.specialInstructions && (
                    <div className="mt-1.5 flex items-start gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600 line-clamp-1">{request.requestData.specialInstructions}</span>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetailsModal(true);
                    }}
                    className="h-8 px-2"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)' }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  
                  {request.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleAssignClick(request)}
                      className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs"
                      style={{ boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)' }}
                    >
                      Assign
                    </Button>
                  )}
                  
                  {request.status === 'assigned' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                      className="bg-orange-600 hover:bg-orange-700 h-8 px-3 text-xs"
                      style={{ boxShadow: '0 2px 4px rgba(234, 88, 12, 0.3)' }}
                    >
                      Start
                    </Button>
                  )}
                  
                  {request.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(request.id, 'completed')}
                      className="bg-green-600 hover:bg-green-700 h-8 px-3 text-xs"
                      style={{ boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)' }}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Request Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Request ID</label>
                    <p className="text-sm text-gray-900">{selectedRequest.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Badge className={getStatusColor(selectedRequest.status)}>
                      {selectedRequest.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {selectedRequest.requestType === 'customer' ? (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Customer Name</label>
                    <p className="text-sm text-gray-900">{selectedRequest.requestData.contactPerson}</p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Company</label>
                    <p className="text-sm text-gray-900">{selectedRequest.corporateInfo?.companyName || 'N/A'}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Pickup Address</label>
                  <p className="text-sm text-gray-900">{selectedRequest.requestData.pickupAddress}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Contact Person</label>
                    <p className="text-sm text-gray-900">{selectedRequest.requestData.contactPerson}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Contact Phone</label>
                    <p className="text-sm text-gray-900">{selectedRequest.requestData.contactPhone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Urgency</label>
                    <Badge className={getUrgencyColor(selectedRequest.requestData.urgency)}>
                      {selectedRequest.requestData.urgency.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Package Count</label>
                    <p className="text-sm text-gray-900">{selectedRequest.requestData.packageCount}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Weight</label>
                    <p className="text-sm text-gray-900">{selectedRequest.requestData.weight} kg</p>
                  </div>
                </div>

                {selectedRequest.requestData.specialInstructions && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Special Instructions</label>
                    <p className="text-sm text-gray-900">{selectedRequest.requestData.specialInstructions}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Requested At</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedRequest.requestedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Courier Modal */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Assign Courier Boy</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedRequest(null);
                    setSelectedCourierBoyId('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Request Details
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {selectedRequest.requestType === 'customer' ? (
                      <>
                        <p className="text-sm">
                          <span className="font-medium">Customer:</span> {selectedRequest.requestData.contactPerson}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Request ID:</span> {selectedRequest.id}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Pickup Address:</span> {selectedRequest.requestData.pickupAddress}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Weight:</span> {selectedRequest.requestData.weight} kg
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm">
                          <span className="font-medium">Company:</span> {selectedRequest.corporateInfo?.companyName || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Request ID:</span> {selectedRequest.id}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Pickup Address:</span> {selectedRequest.requestData.pickupAddress}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Weight:</span> {selectedRequest.requestData.weight} kg
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Courier Boy
                  </label>
                  {loadingCourierBoys ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : courierBoys.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No approved courier boys available
                    </div>
                  ) : (
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      {courierBoys.map((courier) => (
                        <div
                          key={courier._id}
                          onClick={() => setSelectedCourierBoyId(courier._id)}
                          className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                            selectedCourierBoyId === courier._id ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{courier.fullName}</p>
                              <p className="text-sm text-gray-600">{courier.phone}</p>
                              {courier.area && (
                                <p className="text-xs text-gray-500 mt-1">Area: {courier.area}</p>
                              )}
                            </div>
                            {selectedCourierBoyId === courier._id && (
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleAssignCourier}
                    disabled={!selectedCourierBoyId || assigning}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {assigning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Assigning...
                      </>
                    ) : (
                      'Assign Courier Boy'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedRequest(null);
                      setSelectedCourierBoyId('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create Customer Courier Request</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRequest({ 
                      location: '', 
                      name: '', 
                      phoneNumber: '',
                      packageCount: 1,
                      weight: 0.1,
                      specialInstructions: ''
                    });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter customer name"
                    value={newRequest.name}
                    onChange={(e) => setNewRequest({ ...newRequest, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter phone number"
                    value={newRequest.phoneNumber}
                    onChange={(e) => setNewRequest({ ...newRequest, phoneNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Location/Pickup Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter pickup location"
                    value={newRequest.location}
                    onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Number of Packages <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter number of packages"
                      value={newRequest.packageCount}
                      onChange={(e) => setNewRequest({ ...newRequest, packageCount: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Approx Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Enter approx weight"
                      value={newRequest.weight}
                      onChange={(e) => setNewRequest({ ...newRequest, weight: parseFloat(e.target.value) || 0.1 })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Special Instructions
                  </label>
                  <Input
                    placeholder="Enter any special instructions"
                    value={newRequest.specialInstructions}
                    onChange={(e) => setNewRequest({ ...newRequest, specialInstructions: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCreateCustomerRequest}
                    disabled={creating || !newRequest.location || !newRequest.name || !newRequest.phoneNumber}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Request'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewRequest({ 
                        location: '', 
                        name: '', 
                        phoneNumber: '',
                        packageCount: 1,
                        weight: 0.1,
                        specialInstructions: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierRequests;