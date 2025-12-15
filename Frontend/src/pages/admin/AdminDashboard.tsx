import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  User,
  FileText,
  MapPin,
  LogOut,
  BarChart3,
  Settings,
  Shield,
  Activity,
  UserCog,
  Crown,
  Truck,
  X,
  Menu,
  DollarSign,
  Tag,
  CheckCircle,
  Building2,
  Package,
  Bike,
  Search,
  Inbox,
  MessageCircle,
  PhoneCall,
  CreditCard,
  Zap,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { isAdminLoggedIn, getStoredAdminInfo, getStoredToken, clearAuthData, isTokenExpired, getTimeUntilExpiry } from '@/utils/auth';
import AddressFormsTable from '@/components/admin/AddressFormsTable';
import PincodeManagement from '@/components/admin/PincodeManagement';
import UserManagement from '@/components/admin/UserManagement';
import AdminManagement from '@/components/admin/AdminManagement';
import ColoaderRegistration from '@/components/admin/ColoaderRegistration';
import ColoaderManagement from '@/components/admin/ColoaderManagement';
import CorporatePricing from '@/components/admin/CorporatePricing';
import CustomerPricing from '@/components/admin/CustomerPricing';
import CorporateApproval from '@/components/admin/CorporateApproval';
import TestComponent from '@/components/admin/TestComponent';
import CorporateRegistration from '@/components/admin/CorporateRegistration';
import CorporateManagement from '@/components/admin/CorporateManagement';
import AssignConsignment from '@/components/admin/AssignConsignment';
import CourierRequests from '@/components/admin/CourierRequests';
import InvoiceManagement from '@/components/admin/InvoiceManagement';
import EmployeeRegistration from '@/components/admin/EmployeeRegistration';
import EmployeeManagement from '@/components/admin/EmployeeManagement';
import AssignColoader from '@/components/admin/AssignColoader';
import ReceivedConsignment from '@/components/admin/ReceivedConsignment';
import BaggingManagement from '@/components/admin/BaggingManagement';
import AssignCourierBoy from '@/components/admin/AssignCourierBoy';
import CourierBoyManagement from '@/components/admin/CourierBoyManagement';
import SingleQuotation from '@/components/admin/SingleQuotation';
import MedicineSettlement from '@/components/admin/MedicineSettlement';
import TrackMedicine from '@/components/admin/TrackMedicine';
import ArrivedMedicine from '@/components/admin/ArrivedMedicine';
import CustomerComplain from '@/components/admin/CustomerComplain';
import ColdCalling from '@/components/admin/ColdCalling';
import CorporateBooking from '@/components/admin/CorporateBooking';
import Delivery from '@/components/admin/Delivery';
import ForceDelivery from '@/components/admin/ForceDelivery';
import PaymentStatus from '@/components/admin/PaymentStatus';
import CollectPayment from '@/components/admin/CollectPayment';
import SalesForm from '@/components/admin/SalesForm';
import MedicineBookingOverview from '@/components/admin/medicineBookingOverview';
import CustomerBookingOverview from '@/components/admin/CustomerBookingOverview';
import AllBookings from '@/components/admin/AllBookings';

interface AdminInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  permissions: {
    dashboard: boolean;
    userManagement: boolean;
    pincodeManagement: boolean;
    addressForms: boolean;
    coloaderRegistration: boolean;
    corporatePricing: boolean;
    corporateRegistration: boolean;
    corporateManagement: boolean;
    consignmentManagement: boolean;
    reports: boolean;
    settings: boolean;
  };
}

interface DashboardStats {
  forms: {
    total: number;
    completed: number;
    incomplete: number;
    completionRate: number;
  };
  pincodes: {
    total: number;
    states: number;
    cities: number;
  };
  bookings: {
    medicine: {
      total: number;
      byStatus: Array<{ _id: string; count: number }>;
    };
    customer: {
      total: number;
      byStatus: Array<{ _id: string; count: number }>;
    };
    corporate: {
      total: number;
    };
    recent: {
      medicine: any[];
      customer: any[];
    };
    monthlyTrend: Array<{ _id: { year: number; month: number }; count: number }>;
  };
  trackings: {
    total: number;
    byStatus: Array<{ _id: string; count: number }>;
  };
  corporates: {
    total: number;
    active: number;
    pending: number;
  };
  coloaders: {
    total: number;
    active: number;
    approved: number;
  };
  courierBoys: {
    total: number;
    approved: number;
    verified: number;
  };
  complaints: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
  };
  courierRequests: {
    total: number;
    pending: number;
  };
  employees: {
    total: number;
    active: number;
  };
  onlineCustomers: {
    total: number;
  };
  recent: {
    forms: any[];
    stats: any[];
    topStates: any[];
  };
}

const AdminDashboard = () => {
  console.log('AdminDashboard component rendering...');

  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin');
      return;
    }

    // Check if token is expired
    if (isTokenExpired()) {
      clearAuthData();
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please login again.",
        variant: "destructive"
      });
      navigate('/admin');
      return;
    }

    // Get admin info from storage
    const storedAdminInfo = getStoredAdminInfo();
    if (storedAdminInfo) {
      setAdminInfo(storedAdminInfo);
    } else {
      navigate('/admin');
      return;
    }

    fetchDashboardStats();

  }, [navigate, toast]);

  // Listen for storage changes to update admin data in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      const storedAdminInfo = localStorage.getItem('adminInfo');
      if (storedAdminInfo) {
        try {
          const adminData = JSON.parse(storedAdminInfo);
          setAdminInfo(adminData);
        } catch (error) {
          console.error('Error parsing updated admin data:', error);
        }
      }
    };

    // Listen for storage events (when localStorage is updated from other tabs/components)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events for same-tab updates
    window.addEventListener('userPermissionsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userPermissionsUpdated', handleStorageChange);
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = getStoredToken();
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else if (response.status === 401) {
        // Token expired or invalid, clear storage and logout
        clearAuthData();
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please login again.",
          variant: "destructive"
        });
        navigate('/admin');
        return;
      } else {
        setError('Failed to load dashboard statistics');
      }
    } catch {
      setError('Network error while loading dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthData();
    toast({ title: 'Logged out', description: 'You have been logged out.' });
    navigate('/admin');
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-500" />
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} h-screen fixed left-0 top-0 flex flex-col bg-white rounded-r-2xl shadow-[0_10px_30px_rgba(16,24,40,0.08)] border border-gray-100 z-20 transition-all duration-300 ease-in-out`}>
        {/* Header Section - Fixed */}
        <div className={`${isSidebarCollapsed ? 'p-3' : 'p-5'} flex-shrink-0`}>
          {/* Button area - dedicated space for cross/expand buttons */}
          <div className={`flex ${isSidebarCollapsed ? 'justify-center' : 'justify-end'} mb-4`}>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title={isSidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            >
              {isSidebarCollapsed ? (
                <Menu className="h-5 w-5 text-gray-600" />
              ) : (
                <X className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Admin logo and text section */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center mb-4' : 'gap-3 mb-6'}`}>
            <div className="p-3 rounded-xl bg-white shadow-inner">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-gray-800">Admin Panel</h2>
                <p className="text-xs text-gray-500">OCL Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section - Scrollable */}
        <div
          className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <nav className={`${isSidebarCollapsed ? 'space-y-2 px-3 pb-4' : 'space-y-3 px-5 pb-4'}`}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'overview'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Overview" : ""}
            >
              <BarChart3 className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Overview</span>}
            </button>

            {/* Priority order requested by admin ops */}
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "User Management" : ""}
            >
              <UserCog className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">User Management</span>}
            </button>

            <button
              onClick={() => setActiveTab('pincodes')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'pincodes'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Pincode Management" : ""}
            >
              <MapPin className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Pincode Management</span>}
            </button>

            <button
              onClick={() => setActiveTab('receivedOrders')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'receivedOrders'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Received Consignments" : ""}
            >
              <Package className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Received Consignments</span>}
            </button>

            <button
              onClick={() => setActiveTab('manageOrders')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'manageOrders'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Assign Coloaders" : ""}
            >
              <Package className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Assign Coloaders</span>}
            </button>

            <button
              onClick={() => setActiveTab('assignCourierBoy')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'assignCourierBoy'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Assign Courier Boy" : ""}
            >
              <Bike className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Assign Courier Boy</span>}
            </button>

            <button
              onClick={() => setActiveTab('delivery')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'delivery'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Delivery" : ""}
            >
              <Truck className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Delivery</span>}
            </button>

            <button
              onClick={() => setActiveTab('forceDelivery')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'forceDelivery'
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Force Delivery" : ""}
            >
              <Zap className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Force Delivery</span>}
            </button>

            <button
              onClick={() => setActiveTab('medicineSettlement')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'medicineSettlement'
                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Medicine Settlement" : ""}
            >
              <DollarSign className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Medicine Settlement</span>}
            </button>

            <button
              onClick={() => setActiveTab('trackMedicine')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'trackMedicine'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Track Medicine" : ""}
            >
              <Search className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Track Medicine</span>}
            </button>

            <button
              onClick={() => setActiveTab('arrivedMedicine')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'arrivedMedicine'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Arrived Medicine" : ""}
            >
              <Inbox className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Arrived Medicine</span>}
            </button>

            <button
              onClick={() => setActiveTab('medicineBooking')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'medicineBooking'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Medicine Booking" : ""}
            >
              <Package className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Medicine Booking</span>}
            </button>

            <button
              onClick={() => setActiveTab('customerBooking')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'customerBooking'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Customer bookings" : ""}
            >
              <Users className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Customer bookings</span>}
            </button>

            <button
              onClick={() => setActiveTab('allBookings')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'allBookings'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "All Bookings" : ""}
            >
              <Package className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">All Bookings</span>}
            </button>

            <button
              onClick={() => setActiveTab('addressforms')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'addressforms'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Address Forms" : ""}
            >
              <FileText className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Address Forms</span>}
            </button>

            <button
              onClick={() => setActiveTab('employeeRegistration')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'employeeRegistration'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Employee Registration" : ""}
            >
              <User className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Employee Registration</span>}
            </button>

            <button
              onClick={() => setActiveTab('coloader')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'coloader'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Coloader Registration" : ""}
            >
              <Truck className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Coloader Registration</span>}
            </button>

            <button
              onClick={() => setActiveTab('coloaderManagement')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'coloaderManagement'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Coloader Management" : ""}
            >
              <Truck className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Coloader Management</span>}
            </button>

            <button
              onClick={() => setActiveTab('corporatePricing')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'corporatePricing'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Corporate Pricing" : ""}
            >
              <DollarSign className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Corporate Pricing</span>}
            </button>

            <button
              onClick={() => setActiveTab('customerPricing')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'customerPricing'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Customer Pricing" : ""}
            >
              <Tag className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Customer Pricing</span>}
            </button>

            <button
              onClick={() => setActiveTab('corporateApproval')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'corporateApproval'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Corporate Approval" : ""}
            >
              <CheckCircle className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Corporate Approval</span>}
            </button>


            <button
              onClick={() => setActiveTab('corporateRegistration')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'corporateRegistration'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Corporate Registration" : ""}
            >
              <Users className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Corporate Registration</span>}
            </button>

            <button
              onClick={() => setActiveTab('corporateManagement')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'corporateManagement'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Corporate Management" : ""}
            >
              <Building2 className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Corporate Management</span>}
            </button>

            <button
              onClick={() => setActiveTab('corporateBooking')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'corporateBooking'
                ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Corporate Booking" : ""}
            >
              <Package className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Corporate Booking</span>}
            </button>

            <button
              onClick={() => setActiveTab('consignment')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'consignment'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Assign Consignment" : ""}
            >
              <Package className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Assign Consignment</span>}
            </button>

            <button
              onClick={() => setActiveTab('courierRequests')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'courierRequests'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Courier Requests" : ""}
            >
              <Truck className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Courier Requests</span>}
            </button>

            <button
              onClick={() => setActiveTab('invoiceManagement')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'invoiceManagement'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Invoice Management" : ""}
            >
              <FileText className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Invoice Management</span>}
            </button>

            <button
              onClick={() => setActiveTab('baggingManagement')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'baggingManagement'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Bagging Management" : ""}
            >
              <Package className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Bagging Management</span>}
            </button>

            <button
              onClick={() => setActiveTab('singleQuotation')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'singleQuotation'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Single Quotation" : ""}
            >
              <FileText className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Single Quotation</span>}
            </button>

            <button
              onClick={() => setActiveTab('courierBoyManagement')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'courierBoyManagement'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Courier Boy Management" : ""}
            >
              <Bike className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Courier Boy Management</span>}
            </button>

            <button
              onClick={() => setActiveTab('customerComplain')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'customerComplain'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Customer Complaints" : ""}
            >
              <MessageCircle className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Customer Complaints</span>}
            </button>

            <button
              onClick={() => setActiveTab('coldCalling')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'coldCalling'
                ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Cold Calling" : ""}
            >
              <PhoneCall className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Cold Calling</span>}
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'payments'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Payment Status" : ""}
            >
              <DollarSign className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Payment Status</span>}
            </button>

            <button
              onClick={() => setActiveTab('collectPayment')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'collectPayment'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Collect Payment" : ""}
            >
              <CreditCard className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Collect Payment</span>}
            </button>

            <button
              onClick={() => setActiveTab('salesForm')}
              className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'salesForm'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
              title={isSidebarCollapsed ? "Sales Form" : ""}
            >
              <ClipboardList className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Sales Form</span>}
            </button>

            {adminInfo?.role === 'super_admin' && (
              <button
                onClick={() => setActiveTab('admins')}
                className={`w-full ${isSidebarCollapsed ? 'flex justify-center p-2' : 'text-left flex items-center gap-3 px-3 py-2'} rounded-xl transition ${activeTab === 'admins'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
                title={isSidebarCollapsed ? "Admin Management" : ""}
              >
                <Crown className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Admin Management</span>}
              </button>
            )}
          </nav>
        </div>

        {/* Footer Section - Fixed at Bottom */}
        <div className={`${isSidebarCollapsed ? 'p-2' : 'p-5'} border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="text-center mb-3">
                <p className="text-sm font-semibold text-gray-800">{adminInfo?.name}</p>
                <p className="text-xs text-gray-500">{adminInfo?.email}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Badge
                  variant={adminInfo?.role === 'super_admin' ? 'default' : 'secondary'}
                  className="px-3 py-1"
                >
                  {adminInfo?.role}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-white/90"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-white/90 p-2 hover:bg-gray-100 transition-colors"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`${isSidebarCollapsed ? 'ml-16 w-[calc(100vw-4rem)]' : 'ml-64 w-[calc(100vw-16rem)]'} h-screen overflow-y-auto p-3 transition-all duration-300 ease-in-out`}>
        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(16,24,40,0.08)] border border-gray-100 p-4 min-h-[calc(100vh-3rem)]">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50/80 border-0">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Overview - Complete Dashboard Design */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-1.5">
              {/* Header */}
              <div className="flex items-center justify-between mb-1 pb-1.5 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-gray-900">Dashboard Overview</h1>
                  <span className="text-xs text-gray-500">Welcome, {adminInfo?.name}</span>
                  <Badge variant="outline" className="text-xs">{adminInfo?.role}</Badge>
                    </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDashboardStats()}
                  className="h-7 px-2 text-xs"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                </div>

              {/* Compact Main Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                {/* Total Bookings */}
                <div 
                  className="col-span-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2.5 text-white shadow-sm hover:shadow transition-all cursor-pointer"
                  onClick={() => setActiveTab('allBookings')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Package className="h-4 w-4 opacity-90" />
                    <Badge className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0">All</Badge>
                    </div>
                  <div className="text-2xl font-bold leading-tight mb-1">
                    {((stats.bookings?.medicine?.total || 0) + (stats.bookings?.customer?.total || 0) + (stats.bookings?.corporate?.total || 0)) || 0}
                  </div>
                  <div className="flex gap-2 text-[10px] text-blue-100">
                    <span>M:{stats.bookings?.medicine?.total || 0}</span>
                    <span>C:{stats.bookings?.customer?.total || 0}</span>
                    <span>Co:{stats.bookings?.corporate?.total || 0}</span>
                  </div>
                </div>

                {/* Active Corporates */}
                <div 
                  className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-2.5 text-white shadow-sm hover:shadow transition-all cursor-pointer"
                  onClick={() => setActiveTab('corporateManagement')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Building2 className="h-4 w-4 opacity-90" />
                    <Badge className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0">{stats.corporates?.active || 0}</Badge>
                    </div>
                  <div className="text-xl font-bold leading-tight">{stats.corporates?.active || 0}</div>
                  <p className="text-[10px] text-purple-100 mt-0.5">of {stats.corporates?.total || 0} total</p>
                  {stats.corporates?.pending > 0 && (
                    <p className="text-[9px] text-purple-200 mt-0.5">{stats.corporates.pending} pending</p>
                  )}
                  </div>

                {/* Courier Boys */}
                <div 
                  className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-2.5 text-white shadow-sm hover:shadow transition-all cursor-pointer"
                  onClick={() => setActiveTab('courierBoyManagement')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Bike className="h-4 w-4 opacity-90" />
                    <Badge className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0">{stats.courierBoys?.verified || 0}</Badge>
                  </div>
                  <div className="text-xl font-bold leading-tight">{stats.courierBoys?.verified || 0}</div>
                  <p className="text-[10px] text-cyan-100 mt-0.5">of {stats.courierBoys?.total || 0} total</p>
                  <p className="text-[9px] text-cyan-200 mt-0.5">{stats.courierBoys?.approved || 0} approved</p>
                </div>

                {/* Complaints */}
                <div 
                  className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm hover:shadow transition-all cursor-pointer"
                  onClick={() => setActiveTab('customerComplain')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <MessageCircle className="h-4 w-4 text-orange-600" />
                    {stats.complaints?.open > 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{stats.complaints.open}</Badge>
                    )}
                    </div>
                  <div className="text-xl font-bold text-gray-900 leading-tight">{stats.complaints?.total || 0}</div>
                  <div className="flex gap-1 text-[9px] text-gray-600 mt-0.5">
                    <span className="text-orange-600">{stats.complaints?.open || 0}O</span>
                    <span>•</span>
                    <span className="text-blue-600">{stats.complaints?.inProgress || 0}P</span>
                    <span>•</span>
                    <span className="text-green-600">{stats.complaints?.resolved || 0}R</span>
                  </div>
                </div>

                {/* Coloaders */}
                <div 
                  className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm hover:shadow transition-all cursor-pointer"
                  onClick={() => setActiveTab('coloaderManagement')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Truck className="h-4 w-4 text-indigo-600" />
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{stats.coloaders?.active || 0}</Badge>
                  </div>
                  <div className="text-xl font-bold text-gray-900 leading-tight">{stats.coloaders?.total || 0}</div>
                  <p className="text-[9px] text-indigo-600 mt-0.5">{stats.coloaders?.approved || 0} approved</p>
              </div>

                {/* Invoices */}
                <div 
                  className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm hover:shadow transition-all cursor-pointer"
                  onClick={() => setActiveTab('invoiceManagement')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    {stats.invoices?.pending > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{stats.invoices.pending}</Badge>
                          )}
                        </div>
                  <div className="text-xl font-bold text-gray-900 leading-tight">{stats.invoices?.total || 0}</div>
                  <div className="flex gap-1 text-[9px] text-gray-600 mt-0.5">
                    <span className="text-green-600">{stats.invoices?.paid || 0}P</span>
                    <span>•</span>
                    <span className="text-orange-600">{stats.invoices?.pending || 0}U</span>
                  </div>
                </div>
              </div>

              {/* Compact Second Row - More Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                {/* Employees */}
                <div 
                  className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm hover:shadow transition-all cursor-pointer"
                  onClick={() => setActiveTab('employeeManagement')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Users className="h-4 w-4 text-teal-600" />
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{stats.employees?.active || 0}</Badge>
                        </div>
                  <div className="text-xl font-bold text-gray-900 leading-tight">{stats.employees?.total || 0}</div>
                  <p className="text-[9px] text-gray-500 mt-0.5">Employees</p>
                      </div>

                {/* Forms */}
                <div 
                  className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm hover:shadow transition-all cursor-pointer"
                  onClick={() => setActiveTab('addressforms')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{stats.forms.completionRate}%</Badge>
                  </div>
                  <div className="text-xl font-bold text-gray-900 leading-tight">{stats.forms.total}</div>
                  <div className="flex gap-1 text-[9px] text-gray-600 mt-0.5">
                    <span className="text-green-600">{stats.forms.completed}C</span>
                    <span>•</span>
                    <span className="text-orange-600">{stats.forms.incomplete}I</span>
                  </div>
                </div>

                {/* Tracking */}
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <Search className="h-4 w-4 text-green-600" />
                    <span className="text-[10px] text-gray-500">Total</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 leading-tight">{stats.trackings?.total || 0}</div>
                  <div className="flex gap-1 text-[9px] text-gray-600 mt-0.5">
                    {stats.trackings?.byStatus?.slice(0, 2).map((s, i) => (
                      <span key={i}>{s._id?.substring(0, 3) || 'N/A'}:{s.count}</span>
                    ))}
                  </div>
                </div>

                {/* Pincodes */}
                <div 
                  className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm hover:shadow transition-all cursor-pointer"
                  onClick={() => setActiveTab('pincodes')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span className="text-[10px] text-gray-500">Coverage</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 leading-tight">{stats.pincodes.total}</div>
                  <div className="flex gap-1 text-[9px] text-gray-600 mt-0.5">
                    <span>{stats.pincodes.states}S</span>
                    <span>•</span>
                    <span>{stats.pincodes.cities}C</span>
                  </div>
                </div>

                {/* Online Customers */}
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-[10px] text-gray-500">Online</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 leading-tight">{stats.onlineCustomers?.total || 0}</div>
                  <p className="text-[9px] text-gray-500 mt-0.5">Customers</p>
                </div>

                {/* Courier Requests */}
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <Truck className="h-4 w-4 text-orange-600" />
                    {stats.courierRequests?.pending > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{stats.courierRequests.pending}</Badge>
                    )}
                  </div>
                  <div className="text-xl font-bold text-gray-900 leading-tight">{stats.courierRequests?.total || 0}</div>
                  <p className="text-[9px] text-gray-500 mt-0.5">Requests</p>
                </div>
              </div>

              {/* Compact Third Row - Activity & Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5">
                {/* Recent Bookings - Compact */}
                <div className="lg:col-span-2 bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-semibold text-gray-900">Recent Bookings</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('allBookings')}
                      className="h-6 px-2 text-xs"
                    >
                      View All →
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-44 overflow-y-auto">
                    {stats.bookings?.recent?.medicine?.slice(0, 5).map((booking: any, idx: number) => (
                      booking && (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3 text-purple-600" />
                            <span className="font-medium text-gray-900">{booking.consignmentNumber || 'N/A'}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">Medicine</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{booking.status || 'Unknown'}</Badge>
                        </div>
                      )
                    ))}
                    {stats.bookings?.recent?.customer?.slice(0, 3).map((booking: any, idx: number) => (
                      booking && (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3 text-blue-600" />
                            <span className="font-medium text-gray-900">{booking.consignmentNumber || 'N/A'}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">Customer</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{booking.status || 'Unknown'}</Badge>
                        </div>
                      )
                    ))}
                    {(!stats.bookings?.recent?.medicine?.length && !stats.bookings?.recent?.customer?.length) && (
                      <p className="text-xs text-gray-500 text-center py-2">No recent bookings</p>
                    )}
                  </div>
                </div>

                {/* Quick Actions - Compact */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-2.5 text-white shadow-sm">
                  <h3 className="text-sm font-semibold mb-1.5">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-0 h-7 text-xs px-2"
                      onClick={() => setActiveTab('medicineBooking')}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Medicine
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-0 h-7 text-xs px-2"
                      onClick={() => setActiveTab('customerBooking')}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Customer
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-0 h-7 text-xs px-2"
                      onClick={() => setActiveTab('corporateBooking')}
                    >
                      <Building2 className="h-3 w-3 mr-1" />
                      Corporate
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-0 h-7 text-xs px-2"
                      onClick={() => setActiveTab('receivedOrders')}
                    >
                      <Inbox className="h-3 w-3 mr-1" />
                      Received
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-0 h-7 text-xs px-2"
                      onClick={() => setActiveTab('assignCourierBoy')}
                    >
                      <Bike className="h-3 w-3 mr-1" />
                      Courier
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-0 h-7 text-xs px-2"
                      onClick={() => setActiveTab('delivery')}
                    >
                      <Truck className="h-3 w-3 mr-1" />
                      Delivery
                    </Button>
                  </div>
                </div>
              </div>

              {/* Charts and Analytics Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5">
                {/* Booking Trends Chart */}
                <div className="lg:col-span-2 bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Booking Trends (Last 6 Months)
                    </h3>
                  </div>
                  {stats.bookings?.monthlyTrend && stats.bookings.monthlyTrend.length > 0 ? (
                    <ChartContainer
                      config={{
                        bookings: {
                          label: "Bookings",
                          color: "#3b82f6",
                        },
                      }}
                      className="h-[180px] w-full"
                    >
                      <LineChart data={stats.bookings.monthlyTrend.map((item: any) => ({
                        month: `${item._id?.month || 0}/${item._id?.year || 0}`,
                        bookings: item.count || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 10 }}
                          stroke="#6b7280"
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          stroke="#6b7280"
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="bookings" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#3b82f6" }}
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-xs text-gray-400">
                      No trend data available
                          </div>
                  )}
                        </div>

                {/* Booking Type Distribution */}
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    Booking Types
                  </h3>
                  <ChartContainer
                    config={{
                      medicine: { label: "Medicine", color: "#9333ea" },
                      customer: { label: "Customer", color: "#3b82f6" },
                      corporate: { label: "Corporate", color: "#10b981" },
                    }}
                    className="h-[200px] w-full"
                  >
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Medicine", value: stats.bookings?.medicine?.total || 0 },
                          { name: "Customer", value: stats.bookings?.customer?.total || 0 },
                          { name: "Corporate", value: stats.bookings?.corporate?.total || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#9333ea" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </div>
              </div>

              {/* Status Distribution and Top States */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
                {/* Tracking Status Distribution */}
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
                    <Search className="h-4 w-4 text-green-600" />
                    Tracking Status Distribution
                  </h3>
                  {stats.trackings?.byStatus && stats.trackings.byStatus.length > 0 ? (
                    <ChartContainer
                      config={Object.fromEntries(
                        stats.trackings.byStatus.slice(0, 5).map((s: any, i: number) => [
                          `status${i}`,
                          { label: s._id || 'Unknown', color: `hsl(${i * 60}, 70%, 50%)` }
                        ])
                      )}
                      className="h-[160px] w-full"
                    >
                      <BarChart data={stats.trackings.byStatus.slice(0, 5).map((s: any) => ({
                        status: (s._id || 'Unknown').substring(0, 15),
                        count: s.count || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="status" 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 9 }}
                          stroke="#6b7280"
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          stroke="#6b7280"
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[160px] flex items-center justify-center text-xs text-gray-400">
                      No tracking data available
                    </div>
                  )}
                </div>

                {/* Top States */}
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    Top States by Activity
                  </h3>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {stats.recent?.topStates && stats.recent.topStates.length > 0 ? (
                      stats.recent.topStates.map((state: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {idx + 1}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{state._id}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                          {state.count} forms
                        </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-4">No state data available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Status Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1.5">
                {/* Medicine Bookings Status */}
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-900 mb-1.5 flex items-center gap-1">
                    <Package className="h-3 w-3 text-purple-600" />
                    Medicine Status
                  </h3>
                  <div className="space-y-1">
                    {stats.bookings?.medicine?.byStatus?.slice(0, 5).map((status: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate flex-1">{status._id || 'Unknown'}</span>
                        <span className="font-bold text-gray-900 ml-2">{status.count}</span>
                      </div>
                    ))}
                    {(!stats.bookings?.medicine?.byStatus || stats.bookings.medicine.byStatus.length === 0) && (
                      <p className="text-xs text-gray-400 text-center py-2">No data</p>
                    )}
                  </div>
                </div>

                {/* Customer Bookings Status */}
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-900 mb-1.5 flex items-center gap-1">
                    <Users className="h-3 w-3 text-blue-600" />
                    Customer Status
                  </h3>
                  <div className="space-y-1.5">
                    {stats.bookings?.customer?.byStatus?.slice(0, 5).map((status: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate flex-1">{status._id || 'Unknown'}</span>
                        <span className="font-bold text-gray-900 ml-2">{status.count}</span>
                      </div>
                    ))}
                    {(!stats.bookings?.customer?.byStatus || stats.bookings.customer.byStatus.length === 0) && (
                      <p className="text-xs text-gray-400 text-center py-2">No data</p>
                    )}
                  </div>
                </div>

                {/* Complaint Categories */}
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-900 mb-1.5 flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-orange-600" />
                    Complaints
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Total</span>
                      <span className="font-bold text-gray-900">{stats.complaints?.total || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-orange-600">Open</span>
                      <span className="font-bold text-orange-600">{stats.complaints?.open || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-600">In Progress</span>
                      <span className="font-bold text-blue-600">{stats.complaints?.inProgress || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-600">Resolved</span>
                      <span className="font-bold text-green-600">{stats.complaints?.resolved || 0}</span>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-900 mb-1.5 flex items-center gap-1">
                    <Activity className="h-3 w-3 text-green-600" />
                    System Health
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Forms Completion</span>
                      <Badge variant={stats.forms.completionRate >= 80 ? "default" : "secondary"} className="text-[10px]">
                        {stats.forms.completionRate}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Active Corporates</span>
                      <span className="font-bold text-gray-900">
                        {stats.corporates?.active || 0}/{stats.corporates?.total || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Verified Couriers</span>
                      <span className="font-bold text-gray-900">
                        {stats.courierBoys?.verified || 0}/{stats.courierBoys?.total || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Active Coloaders</span>
                      <span className="font-bold text-gray-900">
                        {stats.coloaders?.active || 0}/{stats.coloaders?.total || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other pages */}
          {activeTab === 'medicineSettlement' && <MedicineSettlement />}
          {activeTab === 'trackMedicine' && <TrackMedicine />}
          {activeTab === 'arrivedMedicine' && <ArrivedMedicine />}
          {activeTab === 'medicineBooking' && <MedicineBookingOverview />}
          {activeTab === 'customerBooking' && <CustomerBookingOverview />}
          {activeTab === 'allBookings' && <AllBookings />}
          {activeTab === 'addressforms' && <AddressFormsTable />}
          {activeTab === 'pincodes' && <PincodeManagement />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'employeeRegistration' && <EmployeeRegistration />}
          {activeTab === 'employeeManagement' && <EmployeeManagement />}
          {activeTab === 'coloader' && <ColoaderRegistration />}
          {activeTab === 'coloaderManagement' && <ColoaderManagement />}
          {activeTab === 'corporatePricing' && <CorporatePricing />}
          {activeTab === 'customerPricing' && <CustomerPricing />}
          {activeTab === 'corporateApproval' && <CorporateApproval />}
          {activeTab === 'corporateRegistration' && <CorporateRegistration />}
          {activeTab === 'corporateManagement' && <CorporateManagement />}
          {activeTab === 'corporateBooking' && <CorporateBooking />}
          {activeTab === 'consignment' && <AssignConsignment />}
          {activeTab === 'courierRequests' && <CourierRequests />}
          {activeTab === 'invoiceManagement' && <InvoiceManagement />}
          {activeTab === 'manageOrders' && <AssignColoader />}
          {activeTab === 'receivedOrders' && <ReceivedConsignment />}
          {activeTab === 'baggingManagement' && <BaggingManagement />}
          {activeTab === 'singleQuotation' && <SingleQuotation />}
          {activeTab === 'courierBoyManagement' && <CourierBoyManagement />}
          {activeTab === 'assignCourierBoy' && <AssignCourierBoy />}
          {activeTab === 'delivery' && <Delivery />}
          {activeTab === 'forceDelivery' && <ForceDelivery />}
          {activeTab === 'customerComplain' && <CustomerComplain />}
          {activeTab === 'coldCalling' && <ColdCalling />}
          {activeTab === 'payments' && <PaymentStatus />}
          {activeTab === 'collectPayment' && <CollectPayment />}
          {activeTab === 'salesForm' && <SalesForm />}
          {activeTab === 'admins' && adminInfo?.role === 'super_admin' && (
            <AdminManagement />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
