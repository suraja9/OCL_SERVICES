import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import popupTickImage from '@/assets/popup.png';
import emailIcon from '@/assets/email.png';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Calendar,
  Truck,
  CreditCard,
  PackageX,
  Star,
  MapPin,
  MoreHorizontal,
  AlertTriangle,
  Minus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Floating Label Input Component
interface FloatingLabelInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

interface FloatingLabelInputPropsWithDarkMode extends FloatingLabelInputProps {
  isDarkMode?: boolean;
}

const FloatingLabelInput: React.FC<FloatingLabelInputPropsWithDarkMode> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  className = '',
  isDarkMode = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder=""
        className={`
          w-full h-11 px-3 text-sm
          border rounded-lg transition-all duration-200 ease-in-out
          ${isDarkMode 
            ? 'bg-slate-800/60 text-slate-200' 
            : 'bg-white text-gray-900'
          }
          ${isFocused
            ? isDarkMode ? 'border-blue-500' : 'border-blue-400'
            : isDarkMode 
              ? 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/80' 
              : 'border-gray-300 hover:border-gray-400 hover:shadow-md hover:bg-gray-50/50'
          }
          focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0
        `}
        style={{ boxShadow: 'rgba(0, 0, 0, 0.15) 0px 3px 3px 0px' }}
      />
      <label
        htmlFor={id}
        className={`
          absolute left-3
          transition-all duration-200 ease-in-out
          pointer-events-none select-none
          will-change-transform
          ${isFloating
            ? `top-0 -translate-y-1/2 text-xs px-2 font-medium ${
                isDarkMode 
                  ? 'bg-slate-800 text-blue-400' 
                  : 'bg-white text-blue-600'
              }`
            : isDarkMode 
              ? 'top-1/2 -translate-y-1/2 text-sm text-slate-400'
              : 'top-1/2 -translate-y-1/2 text-sm text-gray-500'
          }
        `}
        style={{ fontFamily: "'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    </div>
  );
};

// Floating Label Textarea Component
interface FloatingLabelTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
}

interface FloatingLabelTextareaPropsWithDarkMode extends FloatingLabelTextareaProps {
  isDarkMode?: boolean;
}

const FloatingLabelTextarea: React.FC<FloatingLabelTextareaPropsWithDarkMode> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  className = '',
  rows = 3,
  maxLength,
  isDarkMode = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <textarea
        id={id}
        value={value}
        onChange={(e) => {
          if (maxLength && e.target.value.length > maxLength) return;
          onChange(e.target.value);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        rows={rows}
        maxLength={maxLength}
        placeholder=""
        className={`
          w-full px-3 pt-4 ${maxLength ? 'pb-6' : 'pb-3'} text-sm
          border rounded-lg resize-none transition-all duration-200 ease-in-out
          ${isDarkMode 
            ? 'bg-slate-800/60 text-slate-200' 
            : 'bg-white text-gray-900'
          }
          ${isFocused
            ? isDarkMode ? 'border-blue-500' : 'border-blue-400'
            : isDarkMode 
              ? 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/80' 
              : 'border-gray-300 hover:border-gray-400 hover:shadow-md hover:bg-gray-50/50'
          }
          focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0
        `}
        style={{ boxShadow: 'rgba(0, 0, 0, 0.15) 0px 3px 3px 0px' }}
      />
      {maxLength && (
        <div className={`absolute bottom-2 right-3 text-xs pointer-events-none ${
          isDarkMode ? 'text-slate-500' : 'text-gray-400'
        }`}>
          {value.length}/{maxLength}
        </div>
      )}
      <label
        htmlFor={id}
        className={`
          absolute left-3
          transition-all duration-200 ease-in-out
          pointer-events-none select-none
          will-change-transform
          ${isFloating
            ? `top-0 -translate-y-1/2 text-xs px-2 font-medium ${
                isDarkMode 
                  ? 'bg-slate-800 text-blue-400' 
                  : 'bg-white text-blue-600'
              }`
            : isDarkMode 
              ? 'top-4 text-sm text-slate-400'
              : 'top-4 text-sm text-gray-500'
          }
        `}
        style={{ fontFamily: "'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    </div>
  );
};

// Floating Label Select Component
interface FloatingLabelSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
}

interface FloatingLabelSelectPropsWithDarkMode extends FloatingLabelSelectProps {
  isDarkMode?: boolean;
}

const FloatingLabelSelect: React.FC<FloatingLabelSelectPropsWithDarkMode> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  className = '',
  options,
  isDarkMode = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasValue = value.length > 0 && value !== 'None';
  const isFloating = isOpen || hasValue;
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`}>
      <Select
        value={value}
        onValueChange={(val) => {
          // If "None" is selected, set to empty string
          onChange(val === 'None' ? '' : val);
        }}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger
          id={id}
          className={`
            w-full h-11 px-3 text-sm
            border rounded-lg transition-all duration-200 ease-in-out
            ${isDarkMode 
              ? 'bg-slate-800/60 border-slate-700 text-slate-200' 
              : 'bg-white border-gray-300 text-gray-900'
            }
            ${isDarkMode 
              ? 'hover:border-slate-600 hover:bg-slate-800/80' 
              : 'hover:border-gray-400 hover:shadow-md hover:bg-gray-50/50'
            }
            focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0
            [&>span]:text-left
            ${isDarkMode 
              ? 'data-[state=open]:border-blue-500 data-[state=closed]:border-slate-700' 
              : 'data-[state=open]:border-blue-400 data-[state=closed]:border-gray-300'
            }
          `}
          style={{ boxShadow: 'rgba(0, 0, 0, 0.15) 0px 3px 3px 0px' }}
        >
          <SelectValue placeholder="">
            {selectedOption && value !== '' && value !== 'None' ? (
              <div className="flex items-center gap-2">
                {selectedOption.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
                <span>{selectedOption.label}</span>
              </div>
            ) : ''}
          </SelectValue>
        </SelectTrigger>
        <SelectContent 
          className={`text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`} 
          style={{ width: 'calc(100% - 0.5rem)', maxWidth: 'calc(100% - 0.5rem)' }}
        >
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value} 
              className={`text-xs font-normal py-1.5 pl-3 pr-8 [&>span:first-child]:right-2 [&>span:first-child]:left-auto ${
                isDarkMode 
                  ? 'text-slate-300 hover:bg-slate-700 focus:bg-slate-700' 
                  : 'text-gray-500'
              }`}
            >
              <div className="flex items-center gap-2">
                {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label
        htmlFor={id}
        className={`
          absolute left-3
          transition-all duration-200 ease-in-out
          pointer-events-none select-none z-10
          will-change-transform
          ${isFloating
            ? `top-0 -translate-y-1/2 text-xs px-2 font-medium ${
                isDarkMode 
                  ? 'bg-slate-800 text-blue-400' 
                  : 'bg-white text-blue-600'
              }`
            : isDarkMode 
              ? 'top-1/2 -translate-y-1/2 text-sm text-slate-400'
              : 'top-1/2 -translate-y-1/2 text-sm text-gray-500'
          }
        `}
        style={{ fontFamily: "'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    </div>
  );
};

interface Complaint {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  source?: string;
  corporateInfo?: {
    companyName?: string;
    email?: string;
    contactNumber?: string;
  };
  response?: string;
  responseDate?: string;
}

interface ComplaintDeskProps {
  isDarkMode?: boolean;
}

const ComplaintDesk: React.FC<ComplaintDeskProps> = ({ isDarkMode = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusTab, setStatusTab] = useState<'active' | 'complete'>('active');
  const [isFetchingComplaints, setIsFetchingComplaints] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(null);

  const [newComplaint, setNewComplaint] = useState({
    category: '',
    priority: '',
    subject: '',
    message: '',
  });

  const { toast } = useToast();

  const corporateInfo = useMemo(() => {
    try {
      const stored = localStorage.getItem('corporateInfo');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to parse corporate info:', error);
      return null;
    }
  }, []);

  const mapComplaintFromApi = useCallback((complaint: any): Complaint => ({
    id: complaint?.id || complaint?._id || Date.now().toString(),
    subject: complaint?.subject || '',
    category: complaint?.category || '',
    priority: complaint?.priority || 'Medium',
    status: complaint?.status || 'Open',
    description: complaint?.message || complaint?.description || '',
    createdAt: complaint?.createdAt || new Date().toISOString(),
    updatedAt: complaint?.updatedAt || complaint?.createdAt || new Date().toISOString(),
    response: complaint?.response,
    responseDate: complaint?.responseDate,
    source: complaint?.source,
    corporateInfo: complaint?.corporateInfo
  }), []);

  const loadComplaints = useCallback(async () => {
    setIsFetchingComplaints(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('corporateToken');
      if (!token) {
        throw new Error('Please login again to view your tickets.');
      }

      const response = await fetch('/api/customer-complain/corporate', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load complaints');
      }

      const mappedComplaints = (data.complaints || []).map(mapComplaintFromApi);
      setComplaints(mappedComplaints);
    } catch (error) {
      console.error('Failed to load complaints:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load complaints');
    } finally {
      setIsFetchingComplaints(false);
    }
  }, [mapComplaintFromApi]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleSubmitComplaint = async () => {
    if (!newComplaint.subject.trim() || !newComplaint.category || !newComplaint.priority || !newComplaint.message.trim()) {
      toast({
        title: "Missing details",
        description: "Please fill in subject, category, priority, and description.",
        variant: "destructive"
      });
      return;
    }

    const token = localStorage.getItem('corporateToken');
    if (!token) {
      toast({
        title: "Session expired",
        description: "Please login again to submit a ticket.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/customer-complain/corporate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: newComplaint.subject.trim(),
          category: newComplaint.category,
          priority: newComplaint.priority,
          message: newComplaint.message.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to submit complaint');
      }

      const createdComplaint = mapComplaintFromApi(data.complaint);
      setComplaints(prev => [createdComplaint, ...prev]);
      loadComplaints();
      
      setNewComplaint({
        category: '',
        priority: '',
        subject: '',
        message: '',
      });

      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to submit complaint:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit complaint. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (complaintId: string, action: 'resolve' | 'close') => {
    const token = localStorage.getItem('corporateToken');
    if (!token) {
      toast({
        title: "Session expired",
        description: "Please login again to update tickets.",
        variant: "destructive"
      });
      return;
    }

    setUpdatingComplaintId(complaintId);
    try {
      const endpoint = action === 'resolve' ? 'resolve' : 'close';
      const response = await fetch(`/api/customer-complain/corporate/${complaintId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update complaint status');
      }

      const updatedComplaint = mapComplaintFromApi(data.complaint);
      setComplaints(prev => prev.map(complaint => 
        complaint.id === complaintId ? updatedComplaint : complaint
      ));
      loadComplaints();

      toast({
        title: "Success",
        description: data.message || "Complaint status updated successfully"
      });
    } catch (error) {
      console.error('Failed to update complaint status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update complaint status",
        variant: "destructive"
      });
    } finally {
      setUpdatingComplaintId(null);
    }
  };

  const handleMarkAsResolved = (complaintId: string) => handleUpdateStatus(complaintId, 'resolve');
  const handleMarkAsClosed = (complaintId: string) => handleUpdateStatus(complaintId, 'close');

  const displayedComplaints = useMemo(() => {
    const activeStatuses = new Set(['Open', 'In Progress']);
    const completeStatuses = new Set(['Resolved', 'Closed']);

    return complaints.filter(complaint => 
      statusTab === 'active'
        ? activeStatuses.has(complaint.status)
        : completeStatuses.has(complaint.status)
    );
  }, [complaints, statusTab]);

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

  return (
    <div 
      className="space-y-6 px-0 sm:px-6 md:px-8 lg:px-16 xl:px-24 max-w-7xl mx-auto pb-8 pt-6"
      style={{ fontFamily: "'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* Submit New Complaint */}
      <div
        className={`rounded-[12px] pt-8 px-8 pb-6 transition-colors ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80' 
            : 'bg-gradient-to-br from-white via-white to-gray-50/30'
        }`}
        style={{
          boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
        }}
      >
        <div className="space-y-6">
          {corporateInfo?.companyName && (
            <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
              Tickets will be associated with <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                {corporateInfo.companyName}
              </span>.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FloatingLabelSelect
              id="category"
              label="Category"
              value={newComplaint.category}
              onChange={(value) => setNewComplaint(prev => ({ ...prev, category: value }))}
              placeholder="Select category"
              required={true}
              isDarkMode={isDarkMode}
              options={[
                { value: 'None', label: 'None' },
                { value: 'Delivery Issues', label: 'Delivery Issues', icon: <Truck className={`h-3.5 w-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} /> },
                { value: 'Billing & Payment', label: 'Billing & Payment', icon: <CreditCard className={`h-3.5 w-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} /> },
                { value: 'Package Damage', label: 'Package Damage', icon: <PackageX className={`h-3.5 w-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} /> },
                { value: 'Service Quality', label: 'Service Quality', icon: <Star className={`h-3.5 w-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} /> },
                { value: 'Tracking Issues', label: 'Tracking Issues', icon: <MapPin className={`h-3.5 w-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} /> },
                { value: 'Others', label: 'Others', icon: <MoreHorizontal className={`h-3.5 w-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} /> },
              ]}
            />
            <FloatingLabelSelect
              id="priority"
              label="Priority"
              value={newComplaint.priority}
              onChange={(value) => setNewComplaint(prev => ({ ...prev, priority: value }))}
              placeholder="Select priority"
              required={true}
              isDarkMode={isDarkMode}
              options={[
                { value: 'None', label: 'None' },
                { value: 'Low', label: 'Low Priority', icon: <CheckCircle className={`h-3.5 w-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} /> },
                { value: 'Medium', label: 'Medium Priority', icon: <Minus className={`h-3.5 w-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} /> },
                { value: 'High', label: 'High Priority', icon: <AlertTriangle className={`h-3.5 w-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} /> },
              ]}
            />
            <FloatingLabelInput
              id="subject"
              label="Subject"
              value={newComplaint.subject}
              onChange={(value) => setNewComplaint(prev => ({ ...prev, subject: value }))}
              required={true}
              isDarkMode={isDarkMode}
              className="md:col-span-2"
            />
          </div>

          <FloatingLabelTextarea
            id="description"
            label="Detailed Description"
            value={newComplaint.message}
            onChange={(value) => setNewComplaint(prev => ({ ...prev, message: value }))}
            placeholder="Please provide detailed information about your complaint..."
            required={true}
            rows={4}
            maxLength={1000}
            isDarkMode={isDarkMode}
          />

          <div className="flex justify-center pt-2">
            <Button
              onClick={handleSubmitComplaint}
              disabled={isSubmitting}
              size="default"
              className={`h-11 px-6 text-sm font-medium rounded-lg shadow-md hover:shadow-xl transition-all duration-200 ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/30'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/30'
              }`}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <Card 
        className={`border-0 overflow-hidden transition-colors ${
          isDarkMode ? 'bg-slate-800/60 border-slate-700' : ''
        }`}
        style={!isDarkMode ? {
          backgroundColor: '#E8F4F8',
          boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
        } : {
          boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
        }}
      >
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <div className={`flex flex-col items-center text-center px-4 py-3 border-r last:border-r-0 transition-colors ${
              isDarkMode 
                ? 'border-slate-700 bg-blue-900/30' 
                : 'border-gray-200'
            }`}
            style={!isDarkMode ? { backgroundColor: '#E8F4F8' } : {}}
            >
              <div className={`p-1.5 rounded-lg mb-1.5 flex items-center justify-center ${
                isDarkMode ? 'bg-blue-800/50' : 'bg-blue-100'
              }`}>
                <span className="text-2xl">📞</span>
              </div>
              <p className={`font-semibold text-xs mb-0.5 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>Phone Support</p>
              <a 
                href="tel:+918453994809"
                className={`text-xs font-medium cursor-pointer transition-colors duration-200 underline ${
                  isDarkMode 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                +91 84539 94809
              </a>
            </div>
            <div className={`flex flex-col items-center text-center px-4 py-3 border-r last:border-r-0 transition-colors ${
              isDarkMode 
                ? 'border-slate-700 bg-emerald-900/30' 
                : 'border-gray-200'
            }`}
            style={!isDarkMode ? { backgroundColor: '#E8F4F8' } : {}}
            >
              <div className={`p-1.5 rounded-lg mb-1.5 flex items-center justify-center ${
                isDarkMode ? 'bg-emerald-800/50' : 'bg-emerald-100'
              }`}>
                <img src={emailIcon} alt="Email" className="h-6 w-6 object-contain" />
              </div>
              <p className={`font-semibold text-xs mb-0.5 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>Email Support</p>
              <a 
                href="mailto:info@oclservices.com"
                className={`text-xs font-medium cursor-pointer transition-colors duration-200 underline ${
                  isDarkMode 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                info@oclservices.com
              </a>
            </div>
            <div className={`flex flex-col items-center text-center px-4 py-3 border-r last:border-r-0 transition-colors ${
              isDarkMode 
                ? 'border-slate-700 bg-violet-900/30' 
                : 'border-gray-200'
            }`}
            style={!isDarkMode ? { backgroundColor: '#E8F4F8' } : {}}
            >
              <div className={`p-1.5 rounded-lg mb-1.5 flex items-center justify-center ${
                isDarkMode ? 'bg-violet-800/50' : 'bg-violet-100'
              }`}>
                <span className="text-2xl">💬</span>
              </div>
              <p className={`font-semibold text-xs mb-0.5 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>Live Chat</p>
              <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Available Now</p>
            </div>
          </div>
          {/* Single row with all three texts */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-0 border-t ${
            isDarkMode ? 'border-slate-700/50' : 'border-gray-200'
          }`}
          style={!isDarkMode ? { backgroundColor: '#E8F4F8' } : {}}
          >
            <div className={`flex items-center justify-center px-4 py-2 border-r last:border-r-0 ${
              isDarkMode ? 'border-slate-700/50' : 'border-gray-200'
            }`}>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Mon - Sat | 10 AM - 7 PM</p>
            </div>
            <div className={`flex items-center justify-center px-4 py-2 border-r last:border-r-0 ${
              isDarkMode ? 'border-slate-700/50' : 'border-gray-200'
            }`}>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>24/7 Response</p>
            </div>
            <div className={`flex items-center justify-center px-4 py-2 border-r last:border-r-0 ${
              isDarkMode ? 'border-slate-700/50' : 'border-gray-200'
            }`}>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Instant Support</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaint History */}
      <Card 
        className={`border-0 overflow-hidden transition-colors ${
          isDarkMode ? 'bg-slate-800/60 border-slate-700' : ''
        }`}
        style={{ 
          boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
        }}
      >
        <CardContent className="p-0">
          <div className={`flex flex-col gap-4 px-6 py-4 border-b ${
            isDarkMode ? 'border-slate-700/60' : 'border-gray-200'
          } sm:flex-row sm:items-center sm:justify-between`}>
            <div>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>Ticket History</p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Track every request raised from your corporate dashboard
              </p>
            </div>
            <div className={`flex rounded-lg overflow-hidden border ${isDarkMode ? 'border-slate-700/80' : 'border-gray-200'}`}>
              <button
                onClick={() => setStatusTab('active')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  statusTab === 'active'
                    ? isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : isDarkMode
                      ? 'text-slate-300 hover:bg-slate-700/60'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusTab('complete')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  statusTab === 'complete'
                    ? isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : isDarkMode
                      ? 'text-slate-300 hover:bg-slate-700/60'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {loadError && (
            <Alert className={`m-6 ${isDarkMode ? 'bg-red-900/20 text-red-200 border-red-800/40' : ''}`} variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}

          {isFetchingComplaints ? (
            <div className="flex items-center justify-center py-16">
              <Clock className={`h-6 w-6 animate-spin ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`} />
            </div>
          ) : displayedComplaints.length === 0 ? (
            <div 
              className={`p-12 text-center transition-colors ${
                isDarkMode ? 'bg-slate-900/40' : ''
              }`}
              style={isDarkMode ? {} : { backgroundColor: '#f3f4f6' }}
            >
              <div className={`p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${
                isDarkMode ? 'bg-slate-800/60' : 'bg-white'
              }`}>
                <Truck className={`h-8 w-8 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} strokeWidth={1.5} />
              </div>
              <h3 className={`text-base font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                {statusTab === 'active' ? 'No active tickets' : 'No completed tickets yet'}
              </h3>
              <p className={`text-sm leading-relaxed max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {statusTab === 'active'
                  ? 'All caught up! Submit a ticket whenever you need assistance.'
                  : 'Completed tickets will show up here once closed.'}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {displayedComplaints.map((complaint, index) => (
                <div
                  key={complaint.id}
                  className={`p-4 transition-colors ${
                    index !== displayedComplaints.length - 1 
                      ? isDarkMode ? 'border-b border-slate-700' : 'border-b border-gray-200'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{complaint.subject}</h3>
                        {getStatusBadge(complaint.status)}
                        {getPriorityBadge(complaint.priority)}
                      </div>
                      <div className={`flex flex-wrap items-center gap-3 text-xs mb-2 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-600'
                      }`}>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{complaint.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Submitted: {formatDate(complaint.createdAt)}</span>
                        </div>
                        {complaint.updatedAt !== complaint.createdAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Updated: {formatDate(complaint.updatedAt)}</span>
                          </div>
                        )}
                      </div>
                      <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{complaint.description}</p>
                      
                      {complaint.response && (
                        <Alert className={`p-2 mt-2 ${
                          isDarkMode 
                            ? 'bg-green-900/30 border-green-700/50' 
                            : 'bg-green-50 border-green-200'
                        }`}>
                          <CheckCircle className={`h-3 w-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                          <AlertDescription>
                            <div className={`font-medium mb-1 text-xs ${
                              isDarkMode ? 'text-green-300' : 'text-green-800'
                            }`}>Response from Support:</div>
                            <p className={`text-xs ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>{complaint.response}</p>
                            {complaint.responseDate && (
                              <p className={`text-xs mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                Responded on: {formatDate(complaint.responseDate)}
                              </p>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:justify-end">
                    {(complaint.status === 'Open' || complaint.status === 'In Progress') && (
                      <Button
                        onClick={() => handleMarkAsResolved(complaint.id)}
                        disabled={updatingComplaintId === complaint.id}
                        className="h-9 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {updatingComplaintId === complaint.id ? (
                          <>
                            <Clock className="h-3 w-3 mr-1 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark as Resolved
                          </>
                        )}
                      </Button>
                    )}
                    {complaint.status === 'Resolved' && (
                      <Button
                        onClick={() => handleMarkAsClosed(complaint.id)}
                        disabled={updatingComplaintId === complaint.id}
                        className="h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {updatingComplaintId === complaint.id ? (
                          <>
                            <Clock className="h-3 w-3 mr-1 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className={`sm:max-w-sm rounded-2xl pt-4 px-8 pb-8 border-0 [&>button]:hidden overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-2 transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-700' : ''
          }`}
          style={{
            boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.06), 0 12px 20px rgba(0,0,0,0.08)',
            background: isDarkMode 
              ? 'linear-gradient(to bottom, #0f172a, #1e293b)' 
              : 'linear-gradient(to bottom, #ffffff, #FFF5E6)',
            animationDuration: '600ms',
            animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              ease: [0.34, 1.56, 0.64, 1],
              opacity: { duration: 0.5 },
              scale: { duration: 0.6 },
              y: { duration: 0.5 }
            }}
            className="flex flex-col items-center"
          >
            {/* Animated Blue 3D Tick */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.2
              }}
              className="mb-6"
            >
              <img 
                src={popupTickImage} 
                alt="Success" 
                className="w-56 h-56 mx-auto"
              />
            </motion.div>
            
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              className="text-center mb-4"
            >
              <DialogTitle className={`text-2xl font-semibold tracking-tight ${
                isDarkMode ? 'text-slate-100' : 'text-gray-900'
              }`}>
                Complaint Submitted
              </DialogTitle>
            </motion.div>
            
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
              className="text-center mb-2"
            >
              <DialogDescription className={`text-xs leading-relaxed ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
              
                Our Executive will Connect with you in next 24 hours.
              </DialogDescription>
            </motion.div>
            
            {/* Additional Line */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
              className="text-center mb-8"
            >
              
            </motion.div>
            
            {/* OK Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
              className="flex justify-center w-full"
            >
              <Button
                onClick={() => setIsModalOpen(false)}
                className={`h-9 px-8 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                style={{ boxShadow: 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px' }}
              >
                OK
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplaintDesk;

