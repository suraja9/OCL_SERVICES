import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, X, Eye, Check, AlertCircle, DollarSign, User, Calendar, Building, Package, Truck, Plane, Zap, RotateCcw, TrendingUp, MapPin, RefreshCw, Search, Edit, Trash2, MoreVertical, Plus, Minus, MoonStar, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CorporatePricing {
  _id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: {
    name: string;
    email: string;
  };
  approvedBy?: {
    name: string;
    email: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  fuelChargePercentage?: number;
  doxPricing?: any;
  nonDoxSurfacePricing?: any;
  nonDoxAirPricing?: any;
  priorityPricing?: any;
  reversePricing?: any;
  // Email approval workflow fields
  clientEmail?: string;
  clientName?: string;
  clientCompany?: string;
  emailSentAt?: string;
  emailApprovedAt?: string;
  emailApprovedBy?: string;
  emailRejectedAt?: string;
  emailRejectionReason?: string;
  // Corporate client connection
  corporateClient?: {
    _id: string;
    companyName: string;
    corporateId: string;
  };
}

const CorporateApproval = () => {
  console.log('CorporateApproval component rendering...');
  const { toast } = useToast();
  const [pricingList, setPricingList] = useState<CorporatePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPricing, setSelectedPricing] = useState<CorporatePricing | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    fuelChargePercentage: '',
    doxPricing: {
      '01gm-250gm': { assam: '', neBySurface: '', neByAirAgtImp: '', restOfIndia: '' },
      '251gm-500gm': { assam: '', neBySurface: '', neByAirAgtImp: '', restOfIndia: '' },
      'add500gm': { assam: '', neBySurface: '', neByAirAgtImp: '', restOfIndia: '' }
    },
    nonDoxSurfacePricing: { assam: '', neBySurface: '', neByAirAgtImp: '', restOfIndia: '' },
    nonDoxAirPricing: { assam: '', neBySurface: '', neByAirAgtImp: '', restOfIndia: '' },
    priorityPricing: {
      '01gm-500gm': { assam: '', neBySurface: '', neByAirAgtImp: '', restOfIndia: '' },
      'add500gm': { assam: '', neBySurface: '', neByAirAgtImp: '', restOfIndia: '' }
    },
    reversePricing: {
      toAssam: {
        byRoad: { normal: '', priority: '' },
        byTrain: { normal: '', priority: '' },
        byFlight: { normal: '', priority: '' }
      },
      toNorthEast: {
        byRoad: { normal: '', priority: '' },
        byTrain: { normal: '', priority: '' },
        byFlight: { normal: '', priority: '' }
      }
    },
    notes: ''
  });

  // Fetch pricing data
  const fetchPricingData = async () => {
    try {
      setLoading(true);
      console.log('Fetching corporate pricing data for approval...');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const url = `/api/admin/corporate-pricing?${params}`;
      console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Response data:', result);

      if (result.success) {
        setPricingList(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalCount(result.pagination?.totalCount || 0);
        console.log('Pricing data loaded:', result.data?.length || 0, 'items');
      } else {
        throw new Error(result.error || 'Failed to fetch pricing data');
      }
    } catch (error: any) {
      console.error('Fetch pricing error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch pricing data",
        variant: "destructive"
      });
      setPricingList([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingData();
  }, [currentPage, searchTerm, statusFilter]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/corporate-pricing/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Corporate pricing approved successfully!",
        });
        fetchPricingData();
      } else {
        throw new Error(result.error || 'Failed to approve pricing');
      }
    } catch (error: any) {
      console.error('Approval error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve pricing",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      });
      return;
    }
    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/corporate-pricing/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() })
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Corporate pricing rejected successfully!",
        });
        setRejectionReason('');
        setShowRejectDialog(false);
        fetchPricingData();
      } else {
        throw new Error(result.error || 'Failed to reject pricing');
      }
    } catch (error: any) {
      console.error('Rejection error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject pricing",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/corporate-pricing/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Corporate pricing deleted successfully!",
        });
        setShowDeleteDialog(false);
        fetchPricingData();
      } else {
        throw new Error(result.error || 'Failed to delete pricing');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete pricing",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (pricing: CorporatePricing) => {
    setSelectedPricing(pricing);
    
    // Helper function to safely get nested values
    const getNestedValue = (obj: any, path: string, defaultValue: any = '') => {
      return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue;
    };

    setEditFormData({
      name: pricing.name || '',
      fuelChargePercentage: (pricing as any).fuelChargePercentage?.toString() || '15',
      doxPricing: {
        '01gm-250gm': {
          assam: getNestedValue(pricing.doxPricing, '01gm-250gm.assam'),
          neBySurface: getNestedValue(pricing.doxPricing, '01gm-250gm.neBySurface'),
          neByAirAgtImp: getNestedValue(pricing.doxPricing, '01gm-250gm.neByAirAgtImp'),
          restOfIndia: getNestedValue(pricing.doxPricing, '01gm-250gm.restOfIndia')
        },
        '251gm-500gm': {
          assam: getNestedValue(pricing.doxPricing, '251gm-500gm.assam'),
          neBySurface: getNestedValue(pricing.doxPricing, '251gm-500gm.neBySurface'),
          neByAirAgtImp: getNestedValue(pricing.doxPricing, '251gm-500gm.neByAirAgtImp'),
          restOfIndia: getNestedValue(pricing.doxPricing, '251gm-500gm.restOfIndia')
        },
        'add500gm': {
          assam: getNestedValue(pricing.doxPricing, 'add500gm.assam'),
          neBySurface: getNestedValue(pricing.doxPricing, 'add500gm.neBySurface'),
          neByAirAgtImp: getNestedValue(pricing.doxPricing, 'add500gm.neByAirAgtImp'),
          restOfIndia: getNestedValue(pricing.doxPricing, 'add500gm.restOfIndia')
        }
      },
      nonDoxSurfacePricing: {
        assam: getNestedValue(pricing.nonDoxSurfacePricing, 'assam'),
        neBySurface: getNestedValue(pricing.nonDoxSurfacePricing, 'neBySurface'),
        neByAirAgtImp: getNestedValue(pricing.nonDoxSurfacePricing, 'neByAirAgtImp'),
        restOfIndia: getNestedValue(pricing.nonDoxSurfacePricing, 'restOfIndia')
      },
      nonDoxAirPricing: {
        assam: getNestedValue(pricing.nonDoxAirPricing, 'assam'),
        neBySurface: getNestedValue(pricing.nonDoxAirPricing, 'neBySurface'),
        neByAirAgtImp: getNestedValue(pricing.nonDoxAirPricing, 'neByAirAgtImp'),
        restOfIndia: getNestedValue(pricing.nonDoxAirPricing, 'restOfIndia')
      },
      priorityPricing: {
        '01gm-500gm': {
          assam: getNestedValue(pricing.priorityPricing, '01gm-500gm.assam'),
          neBySurface: getNestedValue(pricing.priorityPricing, '01gm-500gm.neBySurface'),
          neByAirAgtImp: getNestedValue(pricing.priorityPricing, '01gm-500gm.neByAirAgtImp'),
          restOfIndia: getNestedValue(pricing.priorityPricing, '01gm-500gm.restOfIndia')
        },
        'add500gm': {
          assam: getNestedValue(pricing.priorityPricing, 'add500gm.assam'),
          neBySurface: getNestedValue(pricing.priorityPricing, 'add500gm.neBySurface'),
          neByAirAgtImp: getNestedValue(pricing.priorityPricing, 'add500gm.neByAirAgtImp'),
          restOfIndia: getNestedValue(pricing.priorityPricing, 'add500gm.restOfIndia')
        }
      },
      reversePricing: {
        toAssam: {
          byRoad: {
            normal: getNestedValue(pricing.reversePricing, 'toAssam.byRoad.normal'),
            priority: getNestedValue(pricing.reversePricing, 'toAssam.byRoad.priority')
          },
          byTrain: {
            normal: getNestedValue(pricing.reversePricing, 'toAssam.byTrain.normal'),
            priority: getNestedValue(pricing.reversePricing, 'toAssam.byTrain.priority')
          },
          byFlight: {
            normal: getNestedValue(pricing.reversePricing, 'toAssam.byFlight.normal'),
            priority: getNestedValue(pricing.reversePricing, 'toAssam.byFlight.priority')
          }
        },
        toNorthEast: {
          byRoad: {
            normal: getNestedValue(pricing.reversePricing, 'toNorthEast.byRoad.normal'),
            priority: getNestedValue(pricing.reversePricing, 'toNorthEast.byRoad.priority')
          },
          byTrain: {
            normal: getNestedValue(pricing.reversePricing, 'toNorthEast.byTrain.normal'),
            priority: getNestedValue(pricing.reversePricing, 'toNorthEast.byTrain.priority')
          },
          byFlight: {
            normal: getNestedValue(pricing.reversePricing, 'toNorthEast.byFlight.normal'),
            priority: getNestedValue(pricing.reversePricing, 'toNorthEast.byFlight.priority')
          }
        }
      },
      notes: pricing.notes || ''
    });
    setShowEditDialog(true);
  };

  // Helper function to update nested form data
  const updateFormData = (path: string, value: string) => {
    setEditFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newData;
    });
  };

  // Helper function to format price input
  const formatPriceInput = (value: string) => {
    if (value === '' || value === null || value === undefined) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toString();
  };

  const handleUpdatePricing = async () => {
    if (!selectedPricing) return;
    
    setActionLoading(selectedPricing._id);
    try {
      // Convert string values to numbers for pricing data
      const processedData = {
        ...editFormData,
        fuelChargePercentage: parseFloat(editFormData.fuelChargePercentage) || 15,
        doxPricing: Object.fromEntries(
          Object.entries(editFormData.doxPricing).map(([weight, regions]) => [
            weight,
            Object.fromEntries(
              Object.entries(regions).map(([region, price]) => [
                region,
                price ? parseFloat(price.toString()) || 0 : 0
              ])
            )
          ])
        ),
        nonDoxSurfacePricing: Object.fromEntries(
          Object.entries(editFormData.nonDoxSurfacePricing).map(([region, price]) => [
            region,
            price ? parseFloat(price.toString()) || 0 : 0
          ])
        ),
        nonDoxAirPricing: Object.fromEntries(
          Object.entries(editFormData.nonDoxAirPricing).map(([region, price]) => [
            region,
            price ? parseFloat(price.toString()) || 0 : 0
          ])
        ),
        priorityPricing: Object.fromEntries(
          Object.entries(editFormData.priorityPricing).map(([weight, regions]) => [
            weight,
            Object.fromEntries(
              Object.entries(regions).map(([region, price]) => [
                region,
                price ? parseFloat(price.toString()) || 0 : 0
              ])
            )
          ])
        ),
        reversePricing: {
          toAssam: Object.fromEntries(
            Object.entries(editFormData.reversePricing.toAssam).map(([mode, types]) => [
              mode,
              Object.fromEntries(
                Object.entries(types).map(([type, price]) => [
                  type,
                  price ? parseFloat(price.toString()) || 0 : 0
                ])
              )
            ])
          ),
          toNorthEast: Object.fromEntries(
            Object.entries(editFormData.reversePricing.toNorthEast).map(([mode, types]) => [
              mode,
              Object.fromEntries(
                Object.entries(types).map(([type, price]) => [
                  type,
                  price ? parseFloat(price.toString()) || 0 : 0
                ])
              )
            ])
          )
        }
      };

      const response = await fetch(`/api/admin/corporate-pricing/${selectedPricing._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(processedData)
      });
      
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Corporate pricing updated successfully!",
        });
        setShowEditDialog(false);
        fetchPricingData();
      } else {
        throw new Error(result.error || 'Failed to update pricing');
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update pricing",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, text: 'Pending Approval', color: 'text-yellow-600' };
      case 'approved':
        return { icon: CheckCircle, text: 'Approved', color: 'text-green-600' };
      case 'rejected':
        return { icon: X, text: 'Rejected', color: 'text-red-600' };
      default:
        return { icon: AlertCircle, text: 'Unknown', color: 'text-gray-600' };
    }
  };

  const formatPricingData = (pricing: any) => {
    if (!pricing || typeof pricing !== 'object') return 'No data';
    
    const entries = Object.entries(pricing);
    if (entries.length === 0) return 'No data';
    
    return entries.map(([key, value]: [string, any]) => {
      if (typeof value === 'object' && value !== null) {
        const subEntries = Object.entries(value);
        return `${key}: ${subEntries.map(([k, v]) => `${k}: ₹${v}`).join(', ')}`;
      }
      return `${key}: ₹${value}`;
    }).join(' | ');
  };

  // Helper function to format region names
  const formatRegionName = (region: string) => {
    return region
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace('Ne By Surface', 'NE by Surface')
      .replace('Ne By Air Agt Imp', 'NE by Air (Agent Import)')
      .replace('Rest Of India', 'Rest of India');
  };

  // Helper function to format weight ranges
  const formatWeightRange = (weight: string) => {
    return weight
      .replace('01gm-250gm', '0.1g - 250g')
      .replace('251gm-500gm', '251g - 500g')
      .replace('add500gm', 'Additional 500g');
  };

  // Component to render pricing table
  const renderPricingTable = (title: string, data: any, isWeightBased = false, icon: React.ReactNode) => {
    if (!data || Object.keys(data).length === 0) return null;

    return (
      <div className={cn(
        "rounded-2xl border overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col",
        isDarkMode
          ? "bg-slate-800/60 border-slate-700/60 backdrop-blur-xl"
          : "bg-white border-gray-200"
      )}>
        <div className={cn(
          "flex items-center justify-between p-5 border-b transition-colors",
          isDarkMode
            ? "border-slate-700 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-800"
            : "border-gray-100 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50"
        )}>
          <div className="flex items-center space-x-4">
            {icon}
            <h3 className={cn(
              "text-base font-bold transition-colors",
              isDarkMode ? "text-slate-50" : "text-gray-800"
            )} style={{ fontFamily: 'Calibri' }}>
              {title}
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full h-full">
            <thead style={{ fontFamily: 'Calibr', backgroundColor: '#406AB9' }}>
              <tr>
                <th className="px-5 py-4 text-left text-sm font-semibold text-white" style={{ fontFamily: 'Calibr' }}>Weight Range</th>
                <th className="px-5 py-4 text-center text-sm font-semibold text-white" style={{ fontFamily: 'Calibr' }}>Assam</th>
                <th className="px-5 py-4 text-center text-sm font-semibold text-white" style={{ fontFamily: 'Calibr' }}>NE by Surface</th>
                <th className="px-5 py-4 text-center text-sm font-semibold text-white" style={{ fontFamily: 'Calibr' }}>NE by Air (Agent Import)</th>
                <th className="px-5 py-4 text-center text-sm font-semibold text-white" style={{ fontFamily: 'Calibr' }}>Rest of India</th>
              </tr>
            </thead>
            <tbody className={cn(
              "divide-y transition-colors",
              isDarkMode ? "bg-slate-800/40 divide-slate-700" : "bg-white divide-gray-100"
            )}>
              {isWeightBased ? (
                Object.entries(data).map(([weight, prices]: [string, any], index) => (
                  <tr key={weight} className={cn(
                    "transition-colors",
                    isDarkMode
                      ? `hover:bg-slate-700/50 ${index % 2 === 0 ? 'bg-slate-800/40' : 'bg-slate-800/60'}`
                      : `hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`
                  )}>
                    <td className={cn(
                      "px-5 py-4 text-sm font-medium transition-colors",
                      isDarkMode ? "text-slate-200" : "text-gray-900"
                    )} style={{ fontFamily: 'Calibri' }}>
                      {formatWeightRange(weight)}
                    </td>
                    <td className={cn(
                      "px-5 py-4 text-sm text-center font-semibold transition-colors",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )} style={{ fontFamily: 'Calibri' }}>₹{prices.assam || 0}</td>
                    <td className={cn(
                      "px-5 py-4 text-sm text-center font-semibold transition-colors",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )} style={{ fontFamily: 'Calibri' }}>₹{prices.neBySurface || 0}</td>
                    <td className={cn(
                      "px-5 py-4 text-sm text-center font-semibold transition-colors",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )} style={{ fontFamily: 'Calibri' }}>₹{prices.neByAirAgtImp || 0}</td>
                    <td className={cn(
                      "px-5 py-4 text-sm text-center font-semibold transition-colors",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )} style={{ fontFamily: 'Calibri' }}>₹{prices.restOfIndia || 0}</td>
                  </tr>
                ))
              ) : (
                <>
                  <tr className={cn(
                    "transition-colors",
                    isDarkMode ? "hover:bg-slate-700/50 bg-slate-800/40" : "hover:bg-blue-50 bg-white"
                  )}>
                    <td className={cn(
                      "px-5 py-4 text-sm font-medium transition-colors",
                      isDarkMode ? "text-slate-200" : "text-gray-900"
                    )} style={{ fontFamily: 'Calibri' }}>All Weights</td>
                    <td className={cn(
                      "px-5 py-4 text-sm text-center font-semibold transition-colors",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )} style={{ fontFamily: 'Calibri' }}>₹{data.assam || 0}</td>
                    <td className={cn(
                      "px-5 py-4 text-sm text-center font-semibold transition-colors",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )} style={{ fontFamily: 'Calibri' }}>₹{data.neBySurface || 0}</td>
                    <td className={cn(
                      "px-5 py-4 text-sm text-center font-semibold transition-colors",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )} style={{ fontFamily: 'Calibri' }}>₹{data.neByAirAgtImp || 0}</td>
                    <td className={cn(
                      "px-5 py-4 text-sm text-center font-semibold transition-colors",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )} style={{ fontFamily: 'Calibri' }}>₹{data.restOfIndia || 0}</td>
                  </tr>
                  {/* Add empty rows to match height with weight-based tables */}
                  <tr className={isDarkMode ? "bg-slate-800/60" : "bg-gray-50"}>
                    <td colSpan={5} className="px-5 py-4 text-sm text-center text-transparent" style={{ fontFamily: 'Calibri' }}>₹0</td>
                  </tr>
                  <tr className={isDarkMode ? "bg-slate-800/40" : "bg-white"}>
                    <td colSpan={5} className="px-5 py-4 text-sm text-center text-transparent" style={{ fontFamily: 'Calibri' }}>₹0</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Component to render reverse pricing table
  const renderReversePricingTable = (title: string, data: any) => {
    if (!data || Object.keys(data).length === 0) return null;

    return (
      <div className={cn(
        "rounded-2xl border overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300",
        isDarkMode
          ? "bg-slate-800/60 border-slate-700/60 backdrop-blur-xl"
          : "bg-white border-gray-200"
      )}>
        <div className={cn(
          "flex items-center justify-between p-5 border-b transition-colors",
          isDarkMode
            ? "border-slate-700 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-800"
            : "border-gray-100 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50"
        )}>
          <div className="flex items-center space-x-4">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <RotateCcw className="h-4 w-4 text-white" />
            </div>
            <h3 className={cn(
              "text-base font-bold transition-colors",
              isDarkMode ? "text-slate-50" : "text-gray-800"
            )} style={{ fontFamily: 'Calibri' }}>
              {title}
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead style={{ fontFamily: 'Calibr', backgroundColor: '#406AB9' }}>
              <tr>
                <th className="px-5 py-4 text-left text-sm font-semibold text-white" style={{ fontFamily: 'Calibr' }}>Region</th>
                <th className="px-5 py-4 text-center text-sm font-semibold text-white" style={{ fontFamily: 'Calibr' }}>Transport Mode</th>
                <th className="px-5 py-4 text-center text-sm font-semibold text-white" style={{ fontFamily: 'Calibr' }}>Normal</th>
                <th className="px-5 py-4 text-center text-sm font-semibold text-white" style={{ fontFamily: 'Calibr' }}>Priority</th>
              </tr>
            </thead>
            <tbody className={cn(
              "divide-y transition-colors",
              isDarkMode ? "bg-slate-800/40 divide-slate-700" : "bg-white divide-gray-100"
            )}>
              {Object.entries(data).map(([region, transport]: [string, any], regionIndex) => (
                Object.entries(transport).map(([mode, pricing]: [string, any], modeIndex) => {
                  const rowIndex = regionIndex * Object.keys(transport).length + modeIndex;
                  return (
                    <tr key={`${region}-${mode}`} className={cn(
                      "transition-colors",
                      isDarkMode
                        ? `hover:bg-slate-700/50 ${rowIndex % 2 === 0 ? 'bg-slate-800/40' : 'bg-slate-800/60'}`
                        : `hover:bg-purple-50 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`
                    )}>
                      <td className={cn(
                        "px-5 py-4 text-sm font-medium transition-colors",
                        isDarkMode ? "text-slate-200" : "text-gray-900"
                      )} style={{ fontFamily: 'Calibri' }}>
                        {formatRegionName(region)}
                      </td>
                      <td className={cn(
                        "px-5 py-4 text-sm text-center capitalize font-semibold transition-colors",
                        isDarkMode ? "text-slate-300" : "text-gray-700"
                      )} style={{ fontFamily: 'Calibri' }}>{mode}</td>
                      <td className={cn(
                        "px-5 py-4 text-sm text-center font-semibold transition-colors",
                        isDarkMode ? "text-slate-300" : "text-gray-700"
                      )} style={{ fontFamily: 'Calibri' }}>₹{pricing?.normal || 0}</td>
                      <td className={cn(
                        "px-5 py-4 text-sm text-center font-semibold transition-colors",
                        isDarkMode ? "text-slate-300" : "text-gray-700"
                      )} style={{ fontFamily: 'Calibri' }}>₹{pricing?.priority || 0}</td>
                    </tr>
                  );
                })
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  console.log('Rendering CorporateApproval with loading:', loading, 'pricingList:', pricingList.length);

  // Theme variables
  const pageBackground = isDarkMode
    ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50"
    : "bg-gradient-to-b from-white to-sky-100 text-slate-900";
  const accentGradient = isDarkMode
    ? "from-blue-500/20 via-blue-400/10 to-transparent"
    : "from-blue-400/15 via-blue-300/10 to-transparent";
  const accentGradientAlt = isDarkMode
    ? "from-purple-500/25 via-indigo-400/10 to-transparent"
    : "from-purple-400/15 via-violet-300/10 to-transparent";
  const cardBackground = isDarkMode
    ? "bg-slate-900/95 border-slate-700/80 backdrop-blur-xl"
    : "bg-white/95 border-slate-200/80 backdrop-blur-xl";

  return (
    <div
      className={cn(
        "relative min-h-screen transition-colors duration-500 ease-out p-6",
        pageBackground
      )}
    >
      {/* Decorative gradient blurs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute -right-24 top-[-10%] h-[280px] w-[280px] rounded-full blur-3xl",
            `bg-gradient-to-br ${accentGradient}`
          )}
        />
        <div
          className={cn(
            "absolute bottom-[-15%] left-[-10%] h-[340px] w-[340px] rounded-full blur-3xl",
            `bg-gradient-to-tr ${accentGradientAlt}`
          )}
        />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Dark Mode Toggle */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className={cn(
              "flex items-center gap-2 rounded-full border transition shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]",
              isDarkMode
                ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
            )}
          >
            {isDarkMode ? (
              <>
                <Sun size={16} />
                <span className="text-sm font-medium">Light mode</span>
              </>
            ) : (
              <>
                <MoonStar size={16} />
                <span className="text-sm font-medium">Dark mode</span>
              </>
            )}
          </Button>
        </div>

      <Card className={cn(
        "rounded-2xl border transition-all duration-300 shadow-[rgba(0,0,0,0.19)_0px_10px_20px,rgba(0,0,0,0.23)_0px_6px_6px]",
        isDarkMode
          ? "border-slate-800/60 bg-slate-900/60 backdrop-blur-xl"
          : "border-slate-200/80 bg-white/95 backdrop-blur-xl"
      )}>
        <CardHeader className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={cn(
                "text-lg font-bold transition-colors",
                isDarkMode ? "text-slate-50" : "text-slate-900"
              )} style={{ fontFamily: 'Calibr', fontSize: '32px' }}>Corporate Approval</CardTitle>
              <p className={cn(
                "text-sm mt-1 transition-colors",
                isDarkMode ? "text-slate-400" : "text-slate-600"
              )} style={{ fontFamily: 'Calibri' }}>{totalCount} total pricing submissions</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchPricingData()} 
                className={cn(
                  "rounded-full px-4 transition-all shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]",
                  isDarkMode
                    ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                    : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                )}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
            <div className="flex-1 relative max-w-[720px] w-full">
              <Search className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 z-10 transition-colors",
                isDarkMode ? "text-slate-400" : "text-gray-400"
              )} />
              <div className="relative">
                <Input
                  placeholder=""
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    "pl-12 rounded-full border-2 focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all",
                    isDarkMode
                      ? searchTerm
                        ? "border-blue-500 bg-slate-800/50 text-slate-50"
                        : "border-slate-700 bg-slate-800/50 text-slate-50"
                      : searchTerm
                        ? "border-blue-500 bg-white"
                        : "border-gray-300 bg-white"
                  )}
                  style={{ 
                    borderColor: searchTerm ? '#3b82f6' : (isDarkMode ? '#475569' : '#d1d5db'),
                    boxShadow: 'none'
                  }}
                />
                <label 
                  className={cn(
                    "absolute left-12 transition-all duration-200 pointer-events-none px-1",
                    isDarkMode ? "bg-slate-900" : "bg-white",
                    searchTerm 
                      ? '-top-2 text-sm font-medium text-blue-500' 
                      : cn(
                          "top-1/2 -translate-y-1/2 text-sm",
                          isDarkMode ? "text-slate-400" : "text-gray-500"
                        )
                  )}
                >
                  Search by Pricing Name / Company
                </label>
              </div>
            </div>
            
            <Button 
              onClick={() => { setSearchTerm(''); setStatusFilter(''); setCurrentPage(1); }} 
              variant="outline"
              className={cn(
                "rounded-full px-4 transition-all shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]",
                isDarkMode
                  ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                  : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
              )}
            >
              Reset Filters
            </Button>
          </div>

          {/* Table */}
          <div className={cn(
            "rounded-lg overflow-hidden border transition-colors",
            isDarkMode ? "border-slate-700/60" : "border-slate-200"
          )}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead style={{ fontFamily: 'Calibr', backgroundColor: '#406AB9' }} className="">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-gray-300 last:border-r-0" style={{ fontFamily: 'Calibr', color: '#4ec0f7' }}>Pricing Name</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-gray-300 last:border-r-0" style={{ fontFamily: 'Calibr', color: '#4ec0f7' }}>Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-gray-300 last:border-r-0" style={{ fontFamily: 'Calibr', color: '#4ec0f7' }}>Created By</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-gray-300 last:border-r-0" style={{ fontFamily: 'Calibr', color: '#4ec0f7' }}>Corporate Name</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-gray-300 last:border-r-0" style={{ fontFamily: 'Calibr', color: '#4ec0f7' }}>Recipient Email</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-gray-300 last:border-r-0" style={{ fontFamily: 'Calibr', color: '#4ec0f7' }}>Approved By</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-gray-300 last:border-r-0" style={{ fontFamily: 'Calibr', color: '#4ec0f7' }}>Created On</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold border-r border-gray-300 last:border-r-0" style={{ fontFamily: 'Calibr', color: '#4ec0f7' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className={cn(
                  "divide-y transition-colors",
                  isDarkMode ? "bg-slate-800/40 divide-slate-700" : "bg-white divide-gray-200"
                )}>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className={cn(
                        "text-center py-12 transition-colors",
                        isDarkMode ? "text-slate-400" : "text-gray-500"
                      )}>
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading pricing submissions...
                      </td>
                    </tr>
                  ) : pricingList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={cn(
                        "text-center py-12 transition-colors",
                        isDarkMode ? "text-slate-400" : "text-gray-500"
                      )}>No pricing submissions found</td>
                    </tr>
                  ) : (
                    pricingList.map((pricing) => {
                      const statusConfig = getStatusConfig(pricing.status);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <tr key={pricing._id} className={cn(
                          "border-b transition-colors last:border-b-0",
                          isDarkMode
                            ? "hover:bg-slate-700/50 border-slate-700"
                            : "hover:bg-gray-50 border-gray-100"
                        )}>
                          <td className={cn(
                            "px-4 text-sm border-r last:border-r-0 transition-colors",
                            isDarkMode ? "text-slate-200 border-slate-700" : "text-slate-900 border-gray-100"
                          )} style={{ fontFamily: 'Calibri', lineHeight: '1' }}>{pricing.name}</td>
                          <td className={cn(
                            "px-4 text-sm border-r last:border-r-0 transition-colors",
                            isDarkMode ? "border-slate-700" : "border-gray-100"
                          )} style={{ fontFamily: 'Calibri', lineHeight: '1' }}>
                            <Badge variant={getStatusBadgeVariant(pricing.status)} className="flex items-center gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.text}
                            </Badge>
                          </td>
                          <td className={cn(
                            "px-4 text-sm border-r last:border-r-0 transition-colors",
                            isDarkMode ? "text-slate-300 border-slate-700" : "text-slate-700 border-gray-100"
                          )} style={{ fontFamily: 'Calibri', lineHeight: '1' }}>{pricing.createdBy?.email || 'N/A'}</td>
                          <td className={cn(
                            "px-4 text-sm border-r last:border-r-0 transition-colors",
                            isDarkMode ? "border-slate-700" : "border-gray-100"
                          )} style={{ fontFamily: 'Calibri', lineHeight: '1' }}>
                            {pricing.corporateClient ? (
                              <span className={cn(
                                "font-medium transition-colors",
                                isDarkMode ? "text-slate-200" : "text-gray-800"
                              )}>{pricing.corporateClient.companyName} ({pricing.corporateClient.corporateId})</span>
                            ) : (
                              <span className={cn(
                                "text-sm transition-colors",
                                isDarkMode ? "text-slate-400" : "text-gray-500"
                              )}>Not Connected</span>
                            )}
                          </td>
                          <td className={cn(
                            "px-4 text-sm border-r last:border-r-0 transition-colors",
                            isDarkMode ? "text-slate-300 border-slate-700" : "text-slate-700 border-gray-100"
                          )} style={{ fontFamily: 'Calibri', lineHeight: '1' }}>
                            {pricing.clientEmail || 'N/A'}
                          </td>
                          <td className={cn(
                            "px-4 text-sm border-r last:border-r-0 transition-colors",
                            isDarkMode ? "text-slate-300 border-slate-700" : "text-slate-700 border-gray-100"
                          )} style={{ fontFamily: 'Calibri', lineHeight: '1' }}>
                            {pricing.status === 'approved' ? (
                              pricing.emailApprovedBy ? 
                                pricing.emailApprovedBy : 
                                pricing.approvedBy ? 
                                  (pricing.approvedBy.email || 'Admin') : 
                                  'Admin'
                            ) : pricing.status === 'rejected' ? (
                              'Rejected'
                            ) : (
                              'Pending'
                            )}
                          </td>
                          <td className={cn(
                            "px-4 text-sm border-r last:border-r-0 transition-colors",
                            isDarkMode ? "text-slate-300 border-slate-700" : "text-slate-700 border-gray-100"
                          )} style={{ fontFamily: 'Calibri', lineHeight: '1' }}>{new Date(pricing.createdAt).toLocaleDateString()}</td>
                          <td className={cn(
                            "px-4 text-sm border-r last:border-r-0 transition-colors",
                            isDarkMode ? "border-slate-700" : "border-gray-100"
                          )} style={{ fontFamily: 'Calibri', lineHeight: '1' }}>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setSelectedPricing(pricing); setShowDetailsDialog(true); }} 
                                className={cn(
                                  "h-8 w-8 p-0 transition-all",
                                  isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"
                                )}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" style={{color:'#1e66f5'}} />
                              </Button>

                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEdit(pricing)} 
                                className={cn(
                                  "h-8 w-8 p-0 transition-all",
                                  isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"
                                )}
                                title="Edit pricing"
                              >
                                <Edit className="h-4 w-4" style={{color:'#16a34a'}} />
                              </Button>

                              {pricing.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApprove(pricing._id)}
                                    disabled={actionLoading === pricing._id}
                                    className={cn(
                                      "h-8 w-8 p-0 transition-all",
                                      isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"
                                    )}
                                    title="Approve pricing"
                                  >
                                    <Check className="h-4 w-4" style={{color:'#16a34a'}} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSelectedPricing(pricing); setShowRejectDialog(true); }}
                                    disabled={actionLoading === pricing._id}
                                    className={cn(
                                      "h-8 w-8 p-0 transition-all",
                                      isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"
                                    )}
                                    title="Reject pricing"
                                  >
                                    <X className="h-4 w-4" style={{color:'#dc2626'}} />
                                  </Button>
                                </>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedPricing(pricing); setShowDeleteDialog(true); }}
                                disabled={actionLoading === pricing._id}
                                className={cn(
                                  "h-8 w-8 p-0 transition-all",
                                  isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"
                                )}
                                title="Delete pricing"
                              >
                                <Trash2 className="h-4 w-4" style={{color:'#dc2626'}} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={cn(
              "flex items-center justify-between mt-8 p-4 rounded-lg transition-colors",
              isDarkMode
                ? "bg-slate-800/40 border border-slate-700"
                : "bg-slate-50/50 border border-slate-200"
            )}>
              <div className={cn(
                "text-sm transition-colors",
                isDarkMode ? "text-slate-300" : "text-slate-600"
              )}>
                Showing <span className={cn(
                  "font-semibold transition-colors",
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                )}>{((currentPage - 1) * 10) + 1}</span> to <span className={cn(
                  "font-semibold transition-colors",
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                )}>{Math.min(currentPage * 10, totalCount)}</span> of <span className={cn(
                  "font-semibold transition-colors",
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                )}>{totalCount}</span> results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={cn(
                    "rounded-full transition-all shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]",
                    isDarkMode
                      ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                      : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                  )}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={cn(
                    "rounded-full transition-all shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]",
                    isDarkMode
                      ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                      : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                  )}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className={cn(
          "sm:max-w-[1200px] max-h-[85vh] overflow-y-auto transition-colors",
          isDarkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        )}>
          <DialogHeader className="pb-4">
            <DialogTitle className={cn(
              "text-2xl font-bold flex items-center gap-3 transition-colors",
              isDarkMode ? "text-slate-50" : "text-gray-800"
            )} style={{ fontFamily: 'Calibri' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              Pricing Details: {selectedPricing?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPricing && (
            <div className="space-y-6">
              {/* Basic Information Card */}
              <div className={cn(
                "rounded-xl p-4 border transition-colors",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-800/30"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100"
              )}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="flex items-center gap-2">
                    <Building className={cn(
                      "h-4 w-4 transition-colors",
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    )} />
                    <div>
                      <p className={cn(
                        "text-xs font-medium transition-colors",
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      )} style={{ fontFamily: 'Calibri' }}>Name</p>
                      <p className={cn(
                        "text-sm font-semibold transition-colors",
                        isDarkMode ? "text-slate-50" : "text-gray-800"
                      )} style={{ fontFamily: 'Calibri' }}>{selectedPricing.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedPricing.status === 'approved' ? 'bg-green-500' :
                        selectedPricing.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Status</p>
                      <Badge variant={getStatusBadgeVariant(selectedPricing.status)} className="text-xs">
                        {selectedPricing.status.charAt(0).toUpperCase() + selectedPricing.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className={cn(
                      "h-4 w-4 transition-colors",
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    )} />
                    <div>
                      <p className={cn(
                        "text-xs font-medium transition-colors",
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      )} style={{ fontFamily: 'Calibri' }}>Fuel Charge</p>
                      <p className={cn(
                        "text-sm font-semibold transition-colors",
                        isDarkMode ? "text-slate-50" : "text-gray-800"
                      )} style={{ fontFamily: 'Calibri' }}>
                        {(selectedPricing as any).fuelChargePercentage || 15}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className={cn(
                      "h-4 w-4 transition-colors",
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    )} />
                    <div>
                      <p className={cn(
                        "text-xs font-medium transition-colors",
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      )} style={{ fontFamily: 'Calibri' }}>Created By</p>
                      <p className={cn(
                        "text-sm font-semibold transition-colors",
                        isDarkMode ? "text-slate-50" : "text-gray-800"
                      )} style={{ fontFamily: 'Calibri' }}>{selectedPricing.createdBy?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className={cn(
                      "h-4 w-4 transition-colors",
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    )} />
                    <div>
                      <p className={cn(
                        "text-xs font-medium transition-colors",
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      )} style={{ fontFamily: 'Calibri' }}>Created At</p>
                      <p className={cn(
                        "text-sm font-semibold transition-colors",
                        isDarkMode ? "text-slate-50" : "text-gray-800"
                      )} style={{ fontFamily: 'Calibri' }}>{new Date(selectedPricing.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {selectedPricing.status === 'approved' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Approved By</p>
                        <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Calibri' }}>
                          {selectedPricing.emailApprovedBy ? 
                            `Email: ${selectedPricing.emailApprovedBy}` : 
                            selectedPricing.approvedBy ? 
                              `Admin: ${selectedPricing.approvedBy.email || 'Admin'}` : 
                              'Admin'
                          }
                        </p>
                        {selectedPricing.approvedAt && (
                          <p className="text-xs text-gray-500" style={{ fontFamily: 'Calibri' }}>
                            {new Date(selectedPricing.approvedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedPricing.status === 'rejected' && (
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Rejected</p>
                        <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Calibri' }}>
                          {selectedPricing.rejectionReason ? 'With reason' : 'No reason provided'}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedPricing.corporateClient && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Connected Corporate</p>
                        <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Calibri' }}>
                          {selectedPricing.corporateClient.companyName}
                        </p>
                        <p className="text-xs text-blue-600 font-medium" style={{ fontFamily: 'Calibri' }}>
                          ID: {selectedPricing.corporateClient.corporateId}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Approval Information */}
              {selectedPricing.clientEmail && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800" style={{ fontFamily: 'Calibri' }}>Email Approval Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-200 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Recipient Email</p>
                        <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Calibri' }}>{selectedPricing.clientEmail}</p>
                      </div>
                    </div>
                    {selectedPricing.clientName && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Client Name</p>
                          <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Calibri' }}>{selectedPricing.clientName}</p>
                        </div>
                      </div>
                    )}
                    {selectedPricing.clientCompany && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Company</p>
                          <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Calibri' }}>{selectedPricing.clientCompany}</p>
                        </div>
                      </div>
                    )}
                    {selectedPricing.emailSentAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Email Sent</p>
                          <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Calibri' }}>{new Date(selectedPricing.emailSentAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    {selectedPricing.emailApprovedAt && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Email Approved</p>
                          <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Calibri' }}>{new Date(selectedPricing.emailApprovedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    {selectedPricing.emailApprovedBy && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Approved By</p>
                          <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Calibri' }}>{selectedPricing.emailApprovedBy}</p>
                        </div>
                      </div>
                    )}
                    {selectedPricing.emailRejectedAt && (
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Email Rejected</p>
                          <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Calibri' }}>{new Date(selectedPricing.emailRejectedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedPricing.emailRejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-medium text-red-800" style={{ fontFamily: 'Calibri' }}>Rejection Reason:</p>
                      <p className="text-sm text-red-700 mt-1" style={{ fontFamily: 'Calibri' }}>{selectedPricing.emailRejectionReason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pricing Tables Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                  <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Calibri' }}>Pricing Structure</h3>
                </div>

                {/* Main Pricing Tables - Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6 flex flex-col">
                    <div className="flex-1">
                      {renderPricingTable("DOX Pricing", selectedPricing.doxPricing, true, 
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {renderPricingTable("Non-DOX Surface Pricing", selectedPricing.nonDoxSurfacePricing, false, 
                        <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Truck className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6 flex flex-col">
                    <div className="flex-1">
                      {renderPricingTable("Non-DOX Air Pricing", selectedPricing.nonDoxAirPricing, false, 
                        <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Plane className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {renderPricingTable("Priority Pricing", selectedPricing.priorityPricing, true, 
                        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reverse Pricing - Full Width */}
                <div className="mt-8">
                  {renderReversePricingTable("Reverse Pricing", selectedPricing.reversePricing)}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className={cn(
            "pt-6 border-t transition-colors",
            isDarkMode ? "border-slate-700" : "border-gray-100"
          )}>
            <Button 
              variant="outline" 
              onClick={() => setShowDetailsDialog(false)} 
              className={cn(
                "rounded-full px-6 transition-all shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]",
                isDarkMode
                  ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                  : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
              )}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className={cn(
          "transition-colors",
          isDarkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              "text-xl font-bold transition-colors",
              isDarkMode ? "text-slate-50" : "text-gray-800"
            )} style={{ fontFamily: 'Calibri' }}>Reject Pricing: {selectedPricing?.name}</DialogTitle>
            <DialogDescription className={cn(
              "transition-colors",
              isDarkMode ? "text-slate-400" : "text-gray-600"
            )} style={{ fontFamily: 'Calibri' }}>
              Please provide a reason for rejecting this corporate pricing submission.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason" className={cn(
                "text-sm font-medium transition-colors",
                isDarkMode ? "text-slate-300" : "text-gray-600"
              )} style={{ fontFamily: 'Calibri' }}>Reason for Rejection</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className={cn(
                  "rounded-xl border-2 focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all",
                  isDarkMode
                    ? "border-slate-700 bg-slate-800/50 text-slate-50 focus:border-blue-500"
                    : "border-gray-200 focus:border-blue-500"
                )}
                style={{ fontFamily: 'Calibri' }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRejectDialog(false)} 
              className={cn(
                "rounded-full px-4 transition-all shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]",
                isDarkMode
                  ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                  : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
              )}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReject(selectedPricing?._id || '')}
              disabled={actionLoading === selectedPricing?._id || !rejectionReason.trim()}
              className="rounded-full px-4 transition-all shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]"
            >
              <X className="h-4 w-4 mr-2" />
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className={cn(
          "transition-colors",
          isDarkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              "text-xl font-bold transition-colors",
              isDarkMode ? "text-slate-50" : "text-gray-800"
            )} style={{ fontFamily: 'Calibri' }}>Delete Pricing: {selectedPricing?.name}</DialogTitle>
            <DialogDescription className={cn(
              "transition-colors",
              isDarkMode ? "text-slate-400" : "text-gray-600"
            )} style={{ fontFamily: 'Calibri' }}>
              Are you sure you want to delete this corporate pricing submission? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className={cn(
              "border rounded-lg p-4 transition-colors",
              isDarkMode
                ? "bg-red-900/20 border-red-800/30"
                : "bg-red-50 border-red-200"
            )}>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    isDarkMode ? "text-red-300" : "text-red-800"
                  )} style={{ fontFamily: 'Calibri' }}>
                    Warning: This will permanently delete the pricing data
                  </p>
                  <p className={cn(
                    "text-xs mt-1 transition-colors",
                    isDarkMode ? "text-red-400" : "text-red-600"
                  )} style={{ fontFamily: 'Calibri' }}>
                    All associated pricing information will be lost and cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)} 
              className={cn(
                "rounded-full px-4 transition-all shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]",
                isDarkMode
                  ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                  : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
              )}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(selectedPricing?._id || '')}
              disabled={actionLoading === selectedPricing?._id}
              className="rounded-full px-4 transition-all shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]"
            >
              {actionLoading === selectedPricing?._id ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className={cn(
          "sm:max-w-5xl max-h-[85vh] overflow-y-auto transition-colors",
          isDarkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              "text-2xl font-bold flex items-center gap-2 transition-colors",
              isDarkMode ? "text-slate-50" : "text-gray-800"
            )} style={{ fontFamily: 'Calibri' }}>
              <Edit className={cn(
                "h-6 w-6 transition-colors",
                isDarkMode ? "text-blue-400" : "text-blue-600"
              )} />
              Edit Pricing: {selectedPricing?.name}
            </DialogTitle>
            <DialogDescription className={cn(
              "transition-colors",
              isDarkMode ? "text-slate-400" : "text-gray-600"
            )} style={{ fontFamily: 'Calibri' }}>
              Update the corporate pricing details below. All fields are editable.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-2">
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className={cn(
                "text-sm font-semibold transition-colors",
                isDarkMode ? "text-slate-50" : "text-gray-800"
              )} style={{ fontFamily: 'Calibri' }}>Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editName" className={cn(
                    "text-xs font-medium transition-colors",
                    isDarkMode ? "text-slate-300" : "text-gray-600"
                  )} style={{ fontFamily: 'Calibri' }}>Pricing Name</Label>
                  <Input
                    id="editName"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={cn(
                      "rounded-lg shadow-sm focus:shadow-md transition-all",
                      isDarkMode
                        ? "bg-slate-800/50 border-slate-700 text-slate-50"
                        : "bg-white border-slate-200"
                    )}
                    placeholder="Enter pricing name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editFuelCharge" className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Fuel Charge Percentage</Label>
                  <div className="relative">
                    <Input
                      id="editFuelCharge"
                      type="number"
                      value={editFormData.fuelChargePercentage}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, fuelChargePercentage: e.target.value }))}
                      className="rounded-lg shadow-sm focus:shadow-md transition-shadow pr-8"
                      placeholder="15"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editNotes" className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>Notes</Label>
                  <Input
                    id="editNotes"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="rounded-lg shadow-sm focus:shadow-md transition-shadow"
                    placeholder="Enter notes (optional)"
                  />
                </div>
              </div>
            </div>

            {/* DOX Pricing */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2" style={{ fontFamily: 'Calibri' }}>
                <Package className="h-4 w-4 text-blue-600" />
                DOX Pricing
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>Weight Range</th>
                        <th className="text-center py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>Assam</th>
                        <th className="text-center py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>NE by Surface</th>
                        <th className="text-center py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>NE by Air</th>
                        <th className="text-center py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>Rest of India</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(editFormData.doxPricing).map(([weight, regions]) => (
                        <tr key={weight} className="border-b border-gray-100">
                          <td className="py-1 px-2 text-xs font-medium text-gray-800" style={{ fontFamily: 'Calibri' }}>
                            {weight === '01gm-250gm' ? '0.1g - 250g' : 
                             weight === '251gm-500gm' ? '251g - 500g' : 
                             'Additional 500g'}
                          </td>
                          {Object.entries(regions).map(([region, price]) => (
                            <td key={region} className="py-1 px-2">
                              <Input
                                type="number"
                                value={price}
                                onChange={(e) => updateFormData(`doxPricing.${weight}.${region}`, e.target.value)}
                                className="w-16 text-center text-xs shadow-sm focus:shadow-md transition-shadow"
                                placeholder="0"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Non-DOX Surface Pricing */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2" style={{ fontFamily: 'Calibri' }}>
                <Truck className="h-4 w-4 text-green-600" />
                Non-DOX Surface Pricing
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(editFormData.nonDoxSurfacePricing).map(([region, price]) => (
                    <div key={region} className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>
                        {region === 'assam' ? 'Assam' :
                         region === 'neBySurface' ? 'NE by Surface' :
                         region === 'neByAirAgtImp' ? 'NE by Air' : 'Rest of India'}
                      </Label>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => updateFormData(`nonDoxSurfacePricing.${region}`, e.target.value)}
                        className="shadow-sm focus:shadow-md transition-shadow text-xs"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Non-DOX Air Pricing */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2" style={{ fontFamily: 'Calibri' }}>
                <Plane className="h-4 w-4 text-purple-600" />
                Non-DOX Air Pricing
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(editFormData.nonDoxAirPricing).map(([region, price]) => (
                    <div key={region} className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Calibri' }}>
                        {region === 'assam' ? 'Assam' :
                         region === 'neBySurface' ? 'NE by Surface' :
                         region === 'neByAirAgtImp' ? 'NE by Air' : 'Rest of India'}
                      </Label>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => updateFormData(`nonDoxAirPricing.${region}`, e.target.value)}
                        className="shadow-sm focus:shadow-md transition-shadow text-xs"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority Pricing */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2" style={{ fontFamily: 'Calibri' }}>
                <Zap className="h-4 w-4 text-orange-600" />
                Priority Pricing
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>Weight Range</th>
                        <th className="text-center py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>Assam</th>
                        <th className="text-center py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>NE by Surface</th>
                        <th className="text-center py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>NE by Air</th>
                        <th className="text-center py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>Rest of India</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(editFormData.priorityPricing).map(([weight, regions]) => (
                        <tr key={weight} className="border-b border-gray-100">
                          <td className="py-1 px-2 text-xs font-medium text-gray-800" style={{ fontFamily: 'Calibri' }}>
                            {weight === '01gm-500gm' ? '0.1g - 500g' : 'Additional 500g'}
                          </td>
                          {Object.entries(regions).map(([region, price]) => (
                            <td key={region} className="py-1 px-2">
                              <Input
                                type="number"
                                value={price}
                                onChange={(e) => updateFormData(`priorityPricing.${weight}.${region}`, e.target.value)}
                                className="w-16 text-center text-xs shadow-sm focus:shadow-md transition-shadow"
                                placeholder="0"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Reverse Pricing */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2" style={{ fontFamily: 'Calibri' }}>
                <RotateCcw className="h-4 w-4 text-purple-600" />
                Reverse Pricing
              </h3>
              <div className="space-y-3">
                {/* To Assam */}
                <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                  <h4 className="text-xs font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Calibri' }}>To Assam</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>Transport Mode</th>
                          <th className="text-center py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>Normal</th>
                          <th className="text-center py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(editFormData.reversePricing.toAssam).map(([mode, types]) => (
                          <tr key={mode} className="border-b border-gray-100">
                            <td className="py-1 px-2 text-xs font-medium text-gray-800 capitalize" style={{ fontFamily: 'Calibri' }}>{mode}</td>
                            {Object.entries(types).map(([type, price]) => (
                              <td key={type} className="py-1 px-2">
                                <Input
                                  type="number"
                                  value={price}
                                  onChange={(e) => updateFormData(`reversePricing.toAssam.${mode}.${type}`, e.target.value)}
                                  className="w-16 text-center text-xs shadow-sm focus:shadow-md transition-shadow"
                                  placeholder="0"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* To North East */}
                <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                  <h4 className="text-xs font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Calibri' }}>To North East</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>Transport Mode</th>
                          <th className="text-center py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>Normal</th>
                          <th className="text-center py-1 px-2 text-xs font-medium text-gray-700" style={{ fontFamily: 'Calibri' }}>Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(editFormData.reversePricing.toNorthEast).map(([mode, types]) => (
                          <tr key={mode} className="border-b border-gray-100">
                            <td className="py-1 px-2 text-xs font-medium text-gray-800 capitalize" style={{ fontFamily: 'Calibri' }}>{mode}</td>
                            {Object.entries(types).map(([type, price]) => (
                              <td key={type} className="py-1 px-2">
                                <Input
                                  type="number"
                                  value={price}
                                  onChange={(e) => updateFormData(`reversePricing.toNorthEast.${mode}.${type}`, e.target.value)}
                                  className="w-16 text-center text-xs shadow-sm focus:shadow-md transition-shadow"
                                  placeholder="0"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)} 
              className={cn(
                "rounded-full px-4 transition-all shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]",
                isDarkMode
                  ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                  : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
              )}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePricing}
              disabled={actionLoading === selectedPricing?._id || !editFormData.name.trim()}
              className="rounded-full px-4 transition-all shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]"
            >
              {actionLoading === selectedPricing?._id ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Update Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default CorporateApproval;
