import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Truck,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Calendar,
  Search,
  Package,
  MapPin,
  User,
  MessageSquare,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ConsignmentSuggestions from './ConsignmentSuggestions';
import ComplaintChatModal from './ComplaintChatModal';
import emailIcon from '@/assets/email.png';

interface CourierComplaint {
  id?: string;
  _id?: string;
  consignmentNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  courierName?: string;
  courierContact?: string;
  createdAt: string;
  updatedAt: string;
  response?: string;
  responseDate?: string;
  messages?: Array<{
    _id?: string;
    message: string;
    senderType: 'corporate' | 'admin';
    senderId: string;
    senderName: string;
    createdAt: string | Date;
  }>;
}

interface ShipmentInfo {
  consignmentNumber: string;
  destination: string;
  status: string;
  bookingDate: string;
  courierName?: string;
  courierContact?: string;
}

interface ConsignmentSuggestion {
  consignmentNumber: string;
  destination: string;
  bookingDate: string;
  status: string;
}

interface CourierComplaintDeskProps {
  isDarkMode?: boolean;
}

const CourierComplaintDesk: React.FC<CourierComplaintDeskProps> = ({ isDarkMode = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [complaints, setComplaints] = useState<CourierComplaint[]>([]);
  const [shipmentInfo, setShipmentInfo] = useState<ShipmentInfo | null>(null);
  const [searchConsignment, setSearchConsignment] = useState('');
  const [consignmentSuggestions, setConsignmentSuggestions] = useState<ConsignmentSuggestion[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'complete'>('active');
  const [otherValue, setOtherValue] = useState('');
  const [isClosingComplaint, setIsClosingComplaint] = useState<string | null>(null);
  const [selectedComplaintForChat, setSelectedComplaintForChat] = useState<CourierComplaint | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [newComplaint, setNewComplaint] = useState({
    consignmentNumber: '',
    subject: '',
    category: '',
    priority: '',
    description: '',
  });

  const { toast } = useToast();

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: ConsignmentSuggestion) => {
    setSearchConsignment(suggestion.consignmentNumber);
    // Automatically search for shipment details when suggestion is selected
    handleSearchShipmentWithNumber(suggestion.consignmentNumber);
  };

  // Search for shipment with a specific consignment number
  const handleSearchShipmentWithNumber = async (consignmentNumber: string) => {
    setIsSearching(true);
    
    try {
      const token = localStorage.getItem('corporateToken');
      const response = await fetch(`/api/courier-complaints/search-shipment/${consignmentNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setShipmentInfo(data.shipmentInfo);
        setNewComplaint(prev => ({ ...prev, consignmentNumber: consignmentNumber }));
        
        toast({
          title: "Success",
          description: "Shipment details found successfully",
        });
      } else {
        throw new Error(data.error || 'Shipment not found');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Shipment not found. Please check the consignment number.",
        variant: "destructive"
      });
      setShipmentInfo(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Load shipments to populate consignment suggestions
  useEffect(() => {
    const loadShipments = async () => {
      try {
        const token = localStorage.getItem('corporateToken');
        if (!token) {
          return;
        }

        try {
          const response = await fetch('/api/corporate/bookings', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch shipments');
          }

          const data = await response.json();
          
          if (data.success && data.data && Array.isArray(data.data)) {
            // Transform shipments into consignment suggestions
            const suggestions: ConsignmentSuggestion[] = data.data
              .map((booking: any) => {
                const consignmentNumber = booking.consignmentNumber || booking.bookingReference;
                const destinationData = booking.bookingData?.destinationData || {};
                const destination = destinationData.city 
                  ? `${destinationData.city}, ${destinationData.state || ''}`.trim()
                  : 'Unknown';
                
                return {
                  consignmentNumber: consignmentNumber?.toString() || booking.bookingReference,
                  destination: destination,
                  bookingDate: booking.usedAt || booking.createdAt,
                  status: booking.status || 'booked'
                };
              })
              .filter((suggestion: ConsignmentSuggestion) => suggestion.consignmentNumber); // Remove any invalid entries
            
            setConsignmentSuggestions(suggestions);
          }
        } catch (apiError) {
          // Fallback to local storage if API fails
          console.log('Loading shipments from local storage');
          const localBookings = JSON.parse(localStorage.getItem('corporateBookings') || '[]');
          const suggestions: ConsignmentSuggestion[] = localBookings
            .map((booking: any) => {
              const consignmentNumber = booking.consignmentNumber || booking.bookingReference;
              const destination = booking.destinationData?.city 
                ? `${booking.destinationData.city}, ${booking.destinationData.state || ''}`.trim()
                : 'Unknown';
              
              return {
                consignmentNumber: consignmentNumber?.toString() || booking.bookingReference,
                destination: destination,
                bookingDate: booking.bookingDate,
                status: booking.status || 'booked'
              };
            })
            .filter((suggestion: ConsignmentSuggestion) => suggestion.consignmentNumber);
          
          setConsignmentSuggestions(suggestions);
        }
      } catch (error) {
        console.error('Failed to load shipments:', error);
      }
    };

    loadShipments();
  }, []);

  // Load existing complaints
  const loadComplaints = async () => {
    try {
      const token = localStorage.getItem('corporateToken');
      const response = await fetch('/api/courier-complaints', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load complaints: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.complaints) {
        // Normalize complaint IDs - ensure all complaints have 'id' field
        const normalizedComplaints = data.complaints.map((complaint: any) => ({
          ...complaint,
          id: complaint.id || complaint._id,
          messages: complaint.messages || []
        }));
        setComplaints(normalizedComplaints);
      }
    } catch (error) {
      console.error('Failed to load complaints:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load complaints",
        variant: "destructive"
      });
    }
  };

  // Load existing complaints on component mount
  useEffect(() => {
    loadComplaints();
  }, []);

  // Search for shipment by consignment number
  const handleSearchShipment = async () => {
    if (!searchConsignment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a consignment number",
        variant: "destructive"
      });
      return;
    }

    await handleSearchShipmentWithNumber(searchConsignment);
  };

  const handleSubmitComplaint = async () => {
    // Check if Other is selected but no value provided
    if (newComplaint.category === 'Other' && !otherValue.trim()) {
      toast({
        title: "Error",
        description: "Please specify the other category value",
        variant: "destructive"
      });
      return;
    }

    if (!newComplaint.consignmentNumber || !newComplaint.category || !newComplaint.priority || !newComplaint.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!shipmentInfo) {
      toast({
        title: "Error",
        description: "Please search and verify the consignment number first",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('corporateToken');
      // If Other is selected, use the otherValue as the category
      const finalCategory = newComplaint.category === 'Other' ? otherValue.trim() : newComplaint.category;
      const complaintData = {
        consignmentNumber: newComplaint.consignmentNumber,
        subject: finalCategory, // Use category as subject since they're the same in this form
        category: finalCategory,
        priority: newComplaint.priority,
        description: newComplaint.description
      };
      const response = await fetch('/api/courier-complaints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(complaintData)
      });

      const data = await response.json();

      if (data.success) {
        // Add the new complaint to the list
        const newComplaintData: CourierComplaint = {
          id: data.complaint.id || data.complaint._id,
          consignmentNumber: data.complaint.consignmentNumber,
          subject: data.complaint.subject,
          category: data.complaint.category,
          priority: data.complaint.priority,
          status: data.complaint.status,
          description: newComplaint.description,
          courierName: shipmentInfo.courierName,
          courierContact: shipmentInfo.courierContact,
          createdAt: data.complaint.createdAt,
          updatedAt: data.complaint.createdAt,
          messages: data.complaint.messages || []
        };

        setComplaints(prev => [newComplaintData, ...prev]);
        
        setNewComplaint({
          consignmentNumber: '',
          subject: '',
          category: '',
          priority: '',
          description: '',
        });
        setOtherValue('');
        setShipmentInfo(null);
        setSearchConsignment('');

        toast({
          title: "Success",
          description: "Your courier complaint has been submitted successfully. We will investigate and get back to you soon.",
        });
      } else {
        throw new Error(data.error || 'Failed to submit complaint');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit complaint. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <Badge variant="destructive">Open</Badge>;
      case 'In Progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'Resolved':
        return <Badge variant="default">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive">High</Badge>;
      case 'Medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'Low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
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

  const handleMarkAsResolved = async (complaintId: string) => {
    setIsClosingComplaint(complaintId);
    try {
      const token = localStorage.getItem('corporateToken');
      const response = await fetch(`/api/courier-complaints/${complaintId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to resolve complaint' }));
        throw new Error(errorData.error || 'Failed to resolve complaint');
      }

      const data = await response.json();

      if (data.success) {
        // Update the complaint status in the local state
        setComplaints(prev => prev.map(complaint => 
          (complaint.id === complaintId || complaint._id === complaintId)
            ? { ...complaint, status: 'Resolved' }
            : complaint
        ));
        
        // Update selected complaint if it's the same one
        if (selectedComplaintForChat && (selectedComplaintForChat.id === complaintId || selectedComplaintForChat._id === complaintId)) {
          setSelectedComplaintForChat(prev => prev ? { ...prev, status: 'Resolved' } : null);
        }
        
        toast({
          title: "Success",
          description: "Complaint marked as resolved successfully",
        });
        loadComplaints(); // Refresh to get updated data
      } else {
        throw new Error(data.error || 'Failed to mark complaint as resolved');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark complaint as resolved. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsClosingComplaint(null);
    }
  };

  const handleMarkAsComplete = async (complaintId: string) => {
    setIsClosingComplaint(complaintId);
    try {
      const token = localStorage.getItem('corporateToken');
      const response = await fetch(`/api/courier-complaints/${complaintId}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to close complaint' }));
        throw new Error(errorData.error || 'Failed to close complaint');
      }

      const data = await response.json();

      if (data.success) {
        // Update the complaint status in the local state
        setComplaints(prev => prev.map(complaint => 
          (complaint.id === complaintId || complaint._id === complaintId)
            ? { ...complaint, status: 'Closed' }
            : complaint
        ));
        
        toast({
          title: "Success",
          description: "Complaint marked as complete successfully",
        });
        loadComplaints(); // Refresh to get updated data
      } else {
        throw new Error(data.error || 'Failed to mark complaint as complete');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark complaint as complete. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsClosingComplaint(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-200px)] pt-20 pb-8">
      <div className="w-full max-w-4xl space-y-6 px-0 md:px-8">
      {/* Search Shipment Section */}
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1">
                <ConsignmentSuggestions
                  value={searchConsignment}
                  onChange={setSearchConsignment}
                  onSelect={handleSuggestionSelect}
                  placeholder="Consignment No."
                  label="Consignment No."
                  required={true}
                  isDarkMode={isDarkMode}
                  initialSuggestions={consignmentSuggestions}
                />
              </div>
              <div className="flex items-end w-full sm:w-auto">
                <Button
                  onClick={handleSearchShipment}
                  disabled={isSearching}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 h-10 w-full sm:w-auto rounded-lg shadow-[0_2px_8px_rgba(234,88,12,0.2),0_4px_12px_rgba(234,88,12,0.15)]"
                >
                  <Search className="h-3 w-3 mr-1" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            {/* Shipment Info Display */}
            {shipmentInfo && (
              <Alert className={cn(
                "p-2",
                isDarkMode
                  ? "bg-green-900/20 border-green-700/50"
                  : "bg-green-50 border-green-200"
              )}>
                <CheckCircle className={cn(
                  "h-4 w-4",
                  isDarkMode ? "text-green-400" : "text-green-600"
                )} />
                <AlertDescription>
                  <div className={cn(
                    "font-medium mb-1 text-xs",
                    isDarkMode ? "text-green-300" : "text-green-800"
                  )}>Shipment Found:</div>
                  <div className={cn(
                    "flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between",
                    isDarkMode ? "text-slate-300" : "text-gray-700"
                  )}>
                    <span className="flex-1">
                      <span className="font-medium">Booking Status:</span> {shipmentInfo.status}
                    </span>
                    <span className="flex-1">
                      <span className="font-medium">Destination:</span> {shipmentInfo.destination}
                    </span>
                    <span className="flex-1">
                      <span className="font-medium">Booking Date:</span> {new Date(shipmentInfo.bookingDate).toLocaleDateString()}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

      {/* Submit New Complaint */}
      {shipmentInfo && (
        <Card className={cn(
          "border rounded-lg",
          isDarkMode
            ? "border-slate-700 bg-slate-800/60"
            : "border-slate-200 bg-white"
        )}>
          <CardContent className="p-6">
            <div className="space-y-5">
              {/* Subject (formerly Category), Priority, and Other (when Other is selected) */}
              <div className={cn(
                "grid gap-5",
                newComplaint.category === 'Other' 
                  ? "grid-cols-1 md:grid-cols-3" 
                  : "grid-cols-1 md:grid-cols-2"
              )}>
                {/* Subject Select with Floating Label (formerly Category) */}
                <div className="relative">
                  <select
                    value={newComplaint.category}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      setNewComplaint(prev => ({ ...prev, category: newCategory }));
                      // Clear otherValue if category changes away from "Other"
                      if (newCategory !== 'Other') {
                        setOtherValue('');
                      }
                    }}
                    onFocus={() => setFocusedField('category')}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      "w-full h-10 px-4 border rounded-xl transition-all duration-200 ease-in-out text-xs appearance-none pr-8",
            isDarkMode
                        ? "bg-slate-800/60 border-slate-700 text-slate-100" 
                        : "bg-white/90 border-gray-300/60 text-[#4B5563]",
                      focusedField === 'category'
                        ? isDarkMode
                          ? "border-blue-500"
                          : "border-blue-400"
                        : isDarkMode
                          ? "hover:border-blue-400/50"
                          : "hover:border-blue-400/50 hover:shadow-sm",
                      "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    )}
                  >
                    <option value="" disabled hidden></option>
                    <option value="Delivery Delay">Delivery Delay</option>
                    <option value="Package Damage">Package Damage</option>
                    <option value="Wrong Delivery">Wrong Delivery</option>
                    <option value="Courier Behavior">Courier Behavior</option>
                    <option value="Communication Issues">Communication Issues</option>
                    <option value="Pickup Issues">Pickup Issues</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className={cn("h-4 w-4", isDarkMode ? "text-slate-400" : "text-gray-400")} />
                </div>
                  <label
                    className={cn(
                      "absolute transition-all duration-200 ease-in-out pointer-events-none select-none left-4",
                      (focusedField === 'category' || newComplaint.category.length > 0)
                        ? "top-0 -translate-y-1/2 text-xs px-2"
                        : "top-1/2 -translate-y-1/2 text-xs",
                      (focusedField === 'category' || newComplaint.category.length > 0)
                        ? isDarkMode 
                          ? "bg-slate-900 text-blue-400" 
                          : "bg-white text-blue-600"
                        : isDarkMode 
                          ? "text-slate-400" 
                          : "text-gray-500",
                      focusedField === 'category' && newComplaint.category.length === 0 && (isDarkMode ? "text-blue-400" : "text-blue-600")
                    )}
                  >
                    Subject<span className="text-red-500 ml-1">*</span>
                  </label>
              </div>

                {/* Other Input - Only shown when "Other" is selected */}
                {newComplaint.category === 'Other' && (
                  <div className="relative">
                    <input
                      type="text"
                      value={otherValue}
                      onChange={(e) => setOtherValue(e.target.value)}
                      onFocus={() => setFocusedField('other')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "w-full h-10 px-4 border rounded-xl transition-all duration-200 ease-in-out text-xs",
                        isDarkMode 
                          ? "bg-slate-800/60 text-slate-100 placeholder:text-slate-400" 
                          : "bg-white/90 text-[#4B5563] placeholder:text-[#4B5563]",
                        isDarkMode ? "border-slate-700" : "border-gray-300/60",
                        focusedField === 'other'
                          ? isDarkMode
                            ? "border-blue-500"
                            : "border-blue-400"
                          : isDarkMode
                            ? "hover:border-blue-400/50"
                            : "hover:border-blue-400/50 hover:shadow-sm",
                        "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      )}
                      placeholder=""
                    />
                    <label
                      className={cn(
                        "absolute transition-all duration-200 ease-in-out pointer-events-none select-none left-4",
                        (focusedField === 'other' || otherValue.length > 0)
                          ? "top-0 -translate-y-1/2 text-xs px-2"
                          : "top-1/2 -translate-y-1/2 text-xs",
                        (focusedField === 'other' || otherValue.length > 0)
                          ? isDarkMode 
                            ? "bg-slate-900 text-blue-400" 
                            : "bg-white text-blue-600"
                          : isDarkMode 
                            ? "text-slate-400" 
                            : "text-gray-500",
                        focusedField === 'other' && otherValue.length === 0 && (isDarkMode ? "text-blue-400" : "text-blue-600")
                      )}
                    >
                      Specify Other<span className="text-red-500 ml-1">*</span>
                    </label>
                  </div>
                )}

                {/* Priority Select with Floating Label */}
                <div className="relative">
                  <select
                    value={newComplaint.priority}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, priority: e.target.value }))}
                    onFocus={() => setFocusedField('priority')}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      "w-full h-10 px-4 border rounded-xl transition-all duration-200 ease-in-out text-xs appearance-none pr-8",
                      isDarkMode 
                        ? "bg-slate-800/60 border-slate-700 text-slate-100" 
                        : "bg-white/90 border-gray-300/60 text-[#4B5563]",
                      focusedField === 'priority'
                        ? isDarkMode
                          ? "border-blue-500"
                          : "border-blue-400"
                        : isDarkMode
                          ? "hover:border-blue-400/50"
                          : "hover:border-blue-400/50 hover:shadow-sm",
                      "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    )}
                  >
                    <option value="" disabled hidden></option>
                    <option value="High">High - Urgent attention required</option>
                    <option value="Medium">Medium - Normal processing</option>
                    <option value="Low">Low - Can be addressed later</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className={cn("h-4 w-4", isDarkMode ? "text-slate-400" : "text-gray-400")} />
                  </div>
                  <label
                    className={cn(
                      "absolute transition-all duration-200 ease-in-out pointer-events-none select-none left-4",
                      (focusedField === 'priority' || newComplaint.priority.length > 0)
                        ? "top-0 -translate-y-1/2 text-xs px-2"
                        : "top-1/2 -translate-y-1/2 text-xs",
                      (focusedField === 'priority' || newComplaint.priority.length > 0)
                        ? isDarkMode 
                          ? "bg-slate-900 text-blue-400" 
                          : "bg-white text-blue-600"
                        : isDarkMode 
                          ? "text-slate-400" 
                          : "text-gray-500",
                      focusedField === 'priority' && newComplaint.priority.length === 0 && (isDarkMode ? "text-blue-400" : "text-blue-600")
                    )}
                  >
                    Priority<span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
              </div>

              {/* Description Textarea with Floating Label - same height as priority */}
              <div className="relative">
                <textarea
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint(prev => ({ ...prev, description: e.target.value }))}
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    "w-full h-10 px-4 py-3 border rounded-xl transition-all duration-200 ease-in-out text-xs resize-none overflow-hidden",
                    isDarkMode 
                      ? "bg-slate-800/60 text-slate-100 placeholder:text-slate-400" 
                      : "bg-white/90 text-[#4B5563] placeholder:text-[#4B5563]",
                    isDarkMode ? "border-slate-700" : "border-gray-300/60",
                    focusedField === 'description'
                      ? isDarkMode
                        ? "border-blue-500"
                        : "border-blue-400"
                      : isDarkMode
                        ? "hover:border-blue-400/50"
                        : "hover:border-blue-400/50 hover:shadow-sm",
                    "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  )}
                  placeholder=""
                />
                <label
                  className={cn(
                    "absolute transition-all duration-200 ease-in-out pointer-events-none select-none left-4",
                    (focusedField === 'description' || newComplaint.description.length > 0)
                      ? "top-0 -translate-y-1/2 text-xs px-2"
                      : "top-1/2 -translate-y-1/2 text-xs",
                    (focusedField === 'description' || newComplaint.description.length > 0)
                      ? isDarkMode 
                        ? "bg-slate-900 text-blue-400" 
                        : "bg-white text-blue-600"
                      : isDarkMode 
                        ? "text-slate-400" 
                        : "text-gray-500",
                    focusedField === 'description' && newComplaint.description.length === 0 && (isDarkMode ? "text-blue-400" : "text-blue-600")
                  )}
                >
                  Detailed Description<span className="text-red-500 ml-1">*</span>
                </label>
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  onClick={handleSubmitComplaint}
                  disabled={isSubmitting}
                  className={cn(
                    "h-11 w-full sm:w-auto px-6 rounded-md text-sm font-medium transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2",
                    isDarkMode
                      ? "bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500/50 disabled:bg-orange-600/50 disabled:cursor-not-allowed"
                      : "bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500/50 disabled:bg-orange-600/50 disabled:cursor-not-allowed"
                  )}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card 
        className={cn(
          "border-0 overflow-hidden",
          isDarkMode && "bg-gradient-to-b from-slate-800/60 to-slate-900/60"
        )}
        style={isDarkMode ? {
          boxShadow: 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px'
        } : {
          backgroundColor: '#E8F4F8',
          boxShadow: 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px'
        }}
      >
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <div className={cn(
              "flex flex-col items-center text-center px-4 py-3 border-b md:border-b-0 md:border-r last:border-b-0 md:last:border-r-0",
              isDarkMode ? "border-slate-700/50" : "border-gray-200"
            )}
            style={!isDarkMode ? { backgroundColor: '#EFF6FF' } : {}}
            >
              <div className={cn(
                "p-1.5 rounded-lg mb-1.5 flex items-center justify-center",
                isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
              )}>
                <span className="text-2xl">📞</span>
              </div>
              <p className={cn(
                "font-semibold text-xs mb-0.5",
                isDarkMode ? "text-slate-200" : "text-gray-900"
              )}>Phone Support</p>
              <a 
                href="tel:+918453994809"
                className={cn(
                  "text-xs font-medium cursor-pointer transition-colors duration-200 underline",
                  isDarkMode 
                    ? "text-blue-400 hover:text-blue-300" 
                    : "text-blue-600 hover:text-blue-700"
                )}
              >
                +91 84539 94809
              </a>
            </div>
            <div className={cn(
              "flex flex-col items-center text-center px-4 py-3 border-b md:border-b-0 md:border-r last:border-b-0 md:last:border-r-0",
              isDarkMode ? "border-slate-700/50" : "border-gray-200"
            )}
            style={!isDarkMode ? { backgroundColor: '#EFF6FF' } : {}}
            >
              <div className={cn(
                "p-1.5 rounded-lg mb-1.5 flex items-center justify-center",
                isDarkMode ? "bg-green-900/30" : "bg-green-50"
              )}>
                <img src={emailIcon} alt="Email" className="h-6 w-6 object-contain" />
              </div>
              <p className={cn(
                "font-semibold text-xs mb-0.5",
                isDarkMode ? "text-slate-200" : "text-gray-900"
              )}>Email Support</p>
              <a 
                href="mailto:info@oclservices.com"
                className={cn(
                  "text-xs font-medium cursor-pointer transition-colors duration-200 underline",
                  isDarkMode 
                    ? "text-blue-400 hover:text-blue-300" 
                    : "text-blue-600 hover:text-blue-700"
                )}
              >
                info@oclservices.com
              </a>
            </div>
            <div className={cn(
              "flex flex-col items-center text-center px-4 py-3 border-b md:border-b-0 md:border-r last:border-b-0 md:last:border-r-0",
              isDarkMode ? "border-slate-700/50" : "border-gray-200"
            )}
            style={!isDarkMode ? { backgroundColor: '#EFF6FF' } : {}}
            >
              <div className={cn(
                "p-1.5 rounded-lg mb-1.5 flex items-center justify-center",
                isDarkMode ? "bg-purple-900/30" : "bg-purple-50"
              )}>
                <span className="text-2xl">💬</span>
              </div>
              <p className={cn(
                "font-semibold text-xs mb-0.5",
                isDarkMode ? "text-slate-200" : "text-gray-900"
              )}>Live Chat</p>
              <p className={cn(
                "text-xs font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Available Now</p>
            </div>
          </div>
          {/* Single row with all three texts */}
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-3 gap-0 border-t",
            isDarkMode ? "border-slate-700/50" : "border-gray-200"
          )}
          style={!isDarkMode ? { backgroundColor: '#E8F4F8' } : {}}
          >
            <div className={cn(
              "flex items-center justify-center px-4 py-2 border-r last:border-r-0",
              isDarkMode ? "border-slate-700/50" : "border-gray-200"
            )}>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-slate-400" : "text-gray-500"
              )}>Mon - Sat | 10 AM - 7 PM</p>
            </div>
            <div className={cn(
              "flex items-center justify-center px-4 py-2 border-r last:border-r-0",
              isDarkMode ? "border-slate-700/50" : "border-gray-200"
            )}>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-slate-400" : "text-gray-500"
              )}>24/7 Response</p>
            </div>
            <div className={cn(
              "flex items-center justify-center px-4 py-2 border-r last:border-r-0",
              isDarkMode ? "border-slate-700/50" : "border-gray-200"
            )}>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-slate-400" : "text-gray-500"
              )}>Instant Support</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaint History */}
      <Card 
        className={cn(
          "border-0 overflow-hidden",
          isDarkMode && "bg-slate-800/60"
        )}
        style={{ 
          boxShadow: 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px'
        }}
      >
        {/* Tabs */}
        <div className={cn(
          "flex border-b",
          isDarkMode ? "border-slate-700/50" : "border-gray-200"
        )}>
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200",
              activeTab === 'active'
                ? isDarkMode
                  ? "bg-slate-700/50 text-blue-400 border-b-2 border-blue-400"
                  : "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                : isDarkMode
                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            Active Complaints
          </button>
          <button
            onClick={() => setActiveTab('complete')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200",
              activeTab === 'complete'
                ? isDarkMode
                  ? "bg-slate-700/50 text-blue-400 border-b-2 border-blue-400"
                  : "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                : isDarkMode
                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            Complete Complaints
          </button>
        </div>

        <CardContent className="p-0">
          {(() => {
            // Filter complaints based on active tab
            const filteredComplaints = complaints.filter(complaint => {
              if (activeTab === 'active') {
                return complaint.status === 'Open' || complaint.status === 'In Progress';
              } else {
                return complaint.status === 'Resolved' || complaint.status === 'Closed';
              }
            });

            return filteredComplaints.length === 0 ? (
            <div 
              className={cn(
                "p-6 text-center sm:p-12",
                isDarkMode
                  ? "bg-gradient-to-b from-slate-800/60 to-slate-900/60"
                  : "bg-gradient-to-b from-gray-50 to-gray-100"
              )}
            >
              <div className={cn(
                "p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
                isDarkMode ? "bg-slate-700/50" : "bg-white"
              )}>
                <Truck className={cn(
                  "h-8 w-8",
                  isDarkMode ? "text-slate-400" : "text-gray-400"
                )} strokeWidth={1.5} />
              </div>
              <h3 className={cn(
                "text-base font-semibold mb-2",
                isDarkMode ? "text-slate-200" : "text-gray-800"
              )}>
                {activeTab === 'active' 
                  ? 'No active complaints' 
                  : 'No completed complaints'}
              </h3>
              <p className={cn(
                "text-sm leading-relaxed max-w-md mx-auto",
                isDarkMode ? "text-slate-400" : "text-gray-500"
              )}>
                {activeTab === 'active'
                  ? 'You don\'t have any active complaints at the moment.'
                  : 'You don\'t have any completed complaints yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredComplaints.map((complaint, index) => (
                  <div
                    key={complaint.id}
                    className={cn(
                      "p-4",
                      index !== filteredComplaints.length - 1 && (isDarkMode ? "border-b border-slate-700/50" : "border-b border-gray-200")
                    )}
                  >
                    {/* First Row: Issue, Status, Priority */}
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <h3 className={cn(
                        "font-semibold text-sm",
                        isDarkMode ? "text-slate-200" : "text-gray-900"
                      )}>{complaint.subject}</h3>
                      {getStatusBadge(complaint.status)}
                      {getPriorityBadge(complaint.priority)}
                    </div>

                    {/* Second Row: Consignment, Updated Date, Action Buttons */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 text-xs" style={{ flex: '1 1 auto', minWidth: 0 }}>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 flex-shrink-0" />
                          <span className="font-mono">{complaint.consignmentNumber}</span>
                        </div>
                        {complaint.updatedAt !== complaint.createdAt && (
                          <>
                            <span className={cn("text-xs", isDarkMode ? "text-slate-500" : "text-gray-400")}>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span className="whitespace-nowrap">Updated: {formatDate(complaint.updatedAt)}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-2 sm:flex-shrink-0">
                        <Button
                          onClick={() => {
                            setSelectedComplaintForChat(complaint);
                            setIsChatOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                          className={cn(
                            "h-10 w-full sm:w-auto px-3 text-xs",
                            isDarkMode
                              ? "border-slate-600 text-slate-200 hover:bg-slate-700"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Open Chat
                        </Button>
                        {(complaint.status === 'Open' || complaint.status === 'In Progress') && (
                          <Button
                            onClick={() => handleMarkAsResolved(complaint.id || complaint._id || '')}
                            disabled={isClosingComplaint === (complaint.id || complaint._id)}
                            size="sm"
                            className={cn(
                              "h-10 w-full sm:w-auto px-3 text-xs",
                              isDarkMode
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            )}
                          >
                            {isClosingComplaint === (complaint.id || complaint._id) ? (
                              <>
                                <Clock className="h-3 w-3 mr-1 animate-spin" />
                                Marking...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Mark as Resolved
                              </>
                            )}
                          </Button>
                        )}
                        {complaint.status === 'Resolved' && (
                          <Button
                            onClick={() => handleMarkAsComplete(complaint.id || complaint._id || '')}
                            disabled={isClosingComplaint === (complaint.id || complaint._id)}
                            size="sm"
                            className={cn(
                              "h-10 w-full sm:w-auto px-3 text-xs",
                              isDarkMode
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-green-600 hover:bg-green-700 text-white"
                            )}
                          >
                            {isClosingComplaint === (complaint.id || complaint._id) ? (
                              <>
                                <Clock className="h-3 w-3 mr-1 animate-spin" />
                                Marking...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Mark Complete
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
              ))}
            </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Chat Modal */}
      {selectedComplaintForChat && (selectedComplaintForChat.id || selectedComplaintForChat._id) && (
        <ComplaintChatModal
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedComplaintForChat(null);
            loadComplaints(); // Refresh complaints to get updated messages
          }}
          complaintId={(selectedComplaintForChat.id || selectedComplaintForChat._id) as string}
          complaintStatus={selectedComplaintForChat.status}
          initialMessages={selectedComplaintForChat.messages || []}
          onStatusChange={() => {
            loadComplaints(); // Refresh when status changes
          }}
          onMarkResolved={() => {
            handleMarkAsResolved((selectedComplaintForChat.id || selectedComplaintForChat._id) as string);
          }}
          onMarkComplete={() => {
            handleMarkAsComplete((selectedComplaintForChat.id || selectedComplaintForChat._id) as string);
            setIsChatOpen(false);
            setSelectedComplaintForChat(null);
          }}
          isDarkMode={isDarkMode}
        />
      )}
      </div>
    </div>
  );
};

export default CourierComplaintDesk;
