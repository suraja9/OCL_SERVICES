import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
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
  Package,
  X,
  Menu,
  DollarSign,
  Tag,
  CheckCircle,
  Building2,
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
import { useToast } from '@/hooks/use-toast';
import BookingPanel from '@/components/BookingPanel';
// Import admin components for users with admin privileges
import AdminManagement from '@/components/admin/AdminManagement';
import ColoaderRegistration from '@/components/admin/ColoaderRegistration';
import AddressFormsTable from '@/components/admin/AddressFormsTable';
import PincodeManagement from '@/components/admin/PincodeManagement';
import UserManagement from '@/components/admin/UserManagement';
import ColoaderManagement from '@/components/admin/ColoaderManagement';
// Import all admin components for office users
import EmployeeRegistration from '@/components/admin/EmployeeRegistration';
import EmployeeManagement from '@/components/admin/EmployeeManagement';
import CorporateRegistration from '@/components/admin/CorporateRegistration';
import CorporateManagement from '@/components/admin/CorporateManagement';
import CorporatePricing from '@/components/admin/CorporatePricing';
import CorporateApproval from '@/components/admin/CorporateApproval';
import AssignConsignment from '@/components/admin/AssignConsignment';
import CourierRequests from '@/components/admin/CourierRequests';
import InvoiceManagement from '@/components/admin/InvoiceManagement';
import BaggingManagement from '@/components/admin/BaggingManagement';
import ReceivedConsignment from '@/components/admin/ReceivedConsignment';
import AssignColoader from '@/components/admin/AssignColoader';
import CustomerCareOverview from '@/components/office/overview/CustomerCareOverview';
import AccountsOverview from '@/components/office/overview/AccountsOverview';
import MedicineSettlement from '@/components/admin/MedicineSettlement';
import TrackMedicine from '@/components/admin/TrackMedicine';
import ArrivedMedicine from '@/components/admin/ArrivedMedicine';
import CustomerPricing from '@/components/admin/CustomerPricing';
import SingleQuotation from '@/components/admin/SingleQuotation';
import CourierBoyManagement from '@/components/admin/CourierBoyManagement';
import AssignCourierBoy from '@/components/admin/AssignCourierBoy';
import CustomerComplain from '@/components/admin/CustomerComplain';
import Delivery from '@/components/admin/Delivery';
import ForceDelivery from '@/components/admin/ForceDelivery';
import Undelivered from '@/components/admin/Undelivered';
import MedicineBookingOverview from '@/components/admin/medicineBookingOverview';
import CustomerBookingOverview from '@/components/admin/CustomerBookingOverview';
import AllBookings from '@/components/admin/AllBookings';
import { OfficeBookingPanel } from '@/components/officeBooking';
import CorporateBooking from '@/components/admin/CorporateBooking';
import ColdCalling from '@/components/admin/ColdCalling';
import PaymentStatus from '@/components/admin/PaymentStatus';
import CollectPayment from '@/components/admin/CollectPayment';
import SalesForm from '@/components/admin/SalesForm';

interface PermissionSet {
  dashboard: boolean;
  booking: boolean;
  reports: boolean;
  settings: boolean;
  pincodeManagement: boolean;
  addressForms: boolean;
  coloaderRegistration: boolean;
  coloaderManagement: boolean;
  corporateRegistration: boolean;
  corporateManagement: boolean;
  corporatePricing: boolean;
  corporateApproval: boolean;
  employeeRegistration: boolean;
  employeeManagement: boolean;
  consignmentManagement: boolean;
  courierRequests: boolean;
  invoiceManagement: boolean;
  userManagement: boolean;
  baggingManagement: boolean;
  receivedOrders: boolean;
  manageOrders: boolean;
  medicineSettlement: boolean;
  trackMedicine: boolean;
  arrivedMedicine: boolean;
  customerPricing: boolean;
  singleQuotation: boolean;
  courierBoyManagement: boolean;
  assignCourierBoy: boolean;
  customerComplain: boolean;
  delivery: boolean;
  forceDelivery: boolean;
  undelivered: boolean;
  medicineBooking: boolean;
  customerBooking: boolean;
  allBookings: boolean;
  officeBooking: boolean;
  corporateBooking: boolean;
  coldCalling: boolean;
  payments: boolean;
  collectPayment: boolean;
  salesForm: boolean;
}

interface OfficeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  permissions: PermissionSet;
  department?: string;
  permissionsUpdatedAt?: string;
  updatedAt?: string;
  adminInfo?: {
    id: string;
    role: string;
    permissions: Partial<PermissionSet>;
    canAssignPermissions: boolean;
  };
}

interface AdminInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  permissions?: Partial<PermissionSet>;
}

const OfficeDashboard = () => {
  const [user, setUser] = useState<OfficeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [consignmentStats, setConsignmentStats] = useState({
    totalAssigned: 0,
    usedCount: 0,
    availableCount: 0,
    usagePercentage: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const permissionVersionRef = useRef<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('officeToken');
    const storedUserInfo = localStorage.getItem('officeUser');

    if (!token || !storedUserInfo) {
      navigate('/office');
      return;
    }

    const loadUserData = () => {
      try {
        const userData = JSON.parse(storedUserInfo);
        
        // Ensure the new permission fields exist in the user data
        // This handles cases where existing users don't have the new fields
        const defaultPermissions = {
          coloaderRegistration: false,
          baggingManagement: false,
          receivedOrders: false,
          manageOrders: false,
          medicineSettlement: false,
          trackMedicine: false,
          arrivedMedicine: false,
          customerPricing: false,
          singleQuotation: false,
          courierBoyManagement: false,
          assignCourierBoy: false,
          customerComplain: false,
          delivery: false,
          forceDelivery: false,
          undelivered: false,
          medicineBooking: false,
          customerBooking: false,
          allBookings: false,
          officeBooking: false,
          corporateBooking: false,
          coldCalling: false,
          payments: false,
          collectPayment: false,
          salesForm: false,
        };

        if (userData.permissions) {
          Object.keys(defaultPermissions).forEach(key => {
            if (userData.permissions[key] === undefined) {
              userData.permissions[key] = defaultPermissions[key];
            }
          });
        }
        
        if (userData.adminInfo && userData.adminInfo.permissions) {
          Object.keys(defaultPermissions).forEach(key => {
            if (userData.adminInfo.permissions[key] === undefined) {
              userData.adminInfo.permissions[key] = defaultPermissions[key];
            }
          });
        }
        
        setUser(userData);
        permissionVersionRef.current = userData.permissionsUpdatedAt || userData.updatedAt || null;
      } catch (error) {
        navigate('/office');
        return;
      }
    };

    loadUserData();

    // Add a global function to refresh permissions (can be called from anywhere)
    (window as any).refreshOfficePermissions = () => {
      console.log('🔄 Manual permission refresh triggered');
      loadUserData();
    };

    // Listen for permission update events
    const handlePermissionUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔄 Permission update detected:', event.type, 'refreshing user data...');
      console.log('🔄 Event details:', customEvent.detail);
      loadUserData();
    };

    // Also add a global listener for any permission changes
    const handleGlobalPermissionUpdate = () => {
      console.log('🔄 Global permission update detected, refreshing user data...');
      loadUserData();
    };

    // Add event listeners for permission updates
    window.addEventListener('userPermissionsUpdated', handlePermissionUpdate);
    window.addEventListener('officeUserPermissionsUpdated', handlePermissionUpdate);
    window.addEventListener('permissionsUpdated', handlePermissionUpdate);
    
    // Add a global listener for any storage changes (fallback)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'officeUser') {
        console.log('🔄 Office user data changed in localStorage, refreshing...');
        loadUserData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Set isLoading to false after user data is loaded
    setIsLoading(false);
    
    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('userPermissionsUpdated', handlePermissionUpdate);
      window.removeEventListener('officeUserPermissionsUpdated', handlePermissionUpdate);
      window.removeEventListener('permissionsUpdated', handlePermissionUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  // Fetch consignment stats for office user
  const fetchConsignmentStats = async () => {
    try {
      const token = localStorage.getItem('officeToken');
      const response = await fetch('/api/office/consignment/assignments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasAssignment) {
          setConsignmentStats(data.summary);
        }
      }
    } catch (error) {
      console.error('Error fetching consignment stats:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConsignmentStats();
    }
  }, [user]);

  useEffect(() => {
    if (user?.permissionsUpdatedAt || user?.updatedAt) {
      permissionVersionRef.current = user.permissionsUpdatedAt || user.updatedAt || null;
    }
  }, [user?.permissionsUpdatedAt, user?.updatedAt]);

  // Function to refresh user data from server
  const refreshUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('officeToken');
      if (!token) return;

      const response = await fetch('/api/office/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user;
        
        // Ensure the new permission fields exist in the user data
        const defaultPermissions = {
          coloaderRegistration: false,
          baggingManagement: false,
          receivedOrders: false,
          manageOrders: false,
          medicineSettlement: false,
          trackMedicine: false,
          arrivedMedicine: false,
          customerPricing: false,
          singleQuotation: false,
          courierBoyManagement: false,
          assignCourierBoy: false,
          customerComplain: false,
          delivery: false,
          forceDelivery: false,
          undelivered: false,
          medicineBooking: false,
          customerBooking: false,
          allBookings: false,
          officeBooking: false,
          corporateBooking: false,
          coldCalling: false,
          payments: false,
          collectPayment: false,
          salesForm: false,
        };

        if (userData.permissions) {
          Object.keys(defaultPermissions).forEach(key => {
            if (userData.permissions[key] === undefined) {
              userData.permissions[key] = defaultPermissions[key];
            }
          });
        }
        
        if (userData.adminInfo && userData.adminInfo.permissions) {
          Object.keys(defaultPermissions).forEach(key => {
            if (userData.adminInfo.permissions[key] === undefined) {
              userData.adminInfo.permissions[key] = defaultPermissions[key];
            }
          });
        }
        
        permissionVersionRef.current = userData.permissionsUpdatedAt || userData.updatedAt || null;
        
        // Update localStorage with fresh data
        localStorage.setItem('officeUser', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, []);

  // Listen for storage changes to update user data in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUserInfo = localStorage.getItem('officeUser');
      if (storedUserInfo) {
        try {
          const userData = JSON.parse(storedUserInfo);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    const handlePermissionsUpdate = () => {
      // When permissions are updated, refresh user data from server to ensure we have the latest
      refreshUserData();
    };

    // Listen for storage events (when localStorage is updated from other tabs/components)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-tab updates
    window.addEventListener('userPermissionsUpdated', handlePermissionsUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userPermissionsUpdated', handlePermissionsUpdate);
    };
  }, [refreshUserData]);

  // Poll the server periodically to detect permission changes across browsers/devices
  useEffect(() => {
    let isChecking = false;

    const checkPermissionVersion = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const token = localStorage.getItem('officeToken');
        if (!token) {
          isChecking = false;
          return;
        }

        const response = await fetch('/api/office/permissions/version', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const latestVersion = data.version || data.permissionsUpdatedAt;
          if (latestVersion && latestVersion !== permissionVersionRef.current) {
            permissionVersionRef.current = latestVersion;
            await refreshUserData();
          }
        }
      } catch (error) {
        console.error('Error checking permission version:', error);
      } finally {
        isChecking = false;
      }
    };

    // Initial check and interval setup
    checkPermissionVersion();
    const intervalId = window.setInterval(checkPermissionVersion, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshUserData]);

  // const fetchDashboardStats = async () => {
  //   try {
  //     const token = localStorage.getItem('officeToken');
  //     const response = await fetch('/api/office/stats', {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       // setStats(data.stats);
  //     } else if (response.status === 401) {
  //       handleLogout();
  //       return;
  //     } else {
  //       setError('Failed to load dashboard statistics');
  //     }
  //   } catch {
  //     setError('Network error while loading dashboard');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = () => {
    localStorage.removeItem('officeToken');
    localStorage.removeItem('officeUser');
    toast({ title: 'Logged out', description: 'You have been logged out.' });
    navigate('/office');
  };

  const activeRoleLabel = user?.adminInfo?.role || user?.role || 'office_user';
  const normalizedRole = activeRoleLabel.trim().toLowerCase().replace(/\s+/g, '_');

  const renderOverviewContent = () => {
    switch (normalizedRole) {
      case 'customer_care':
      case 'customer_support':
      case 'support':
        return <CustomerCareOverview />;
      case 'accounts':
      case 'accounts_head':
        return <AccountsOverview />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-4">
              <p className="text-sm font-medium text-blue-600 mb-1">Active Role</p>
              <p className="text-3xl font-bold text-gray-900">{activeRoleLabel}</p>
            </div>
            <p className="text-gray-500">Custom dashboards per designation will appear here soon.</p>
          </div>
        );
    }
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
        {/* Header section - fixed at top */}
        <div className={`${isSidebarCollapsed ? 'p-3' : 'p-5'} border-b border-gray-100`}>
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

          {/* Office logo and text section */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center mb-4' : 'gap-3 mb-6'}`}>
            <div className="p-3 rounded-xl bg-white shadow-inner">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-gray-800">Office Panel</h2>
                <p className="text-xs text-gray-500">OCL Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable navigation section */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <nav className={`${isSidebarCollapsed ? 'space-y-2 p-3' : 'space-y-3 p-5'}`}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={isSidebarCollapsed ? "Overview" : ""}
            >
              <BarChart3 className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Overview</span>}
            </button>

            {/* Booking Panel - shown when user has booking permission */}
            {(user?.permissions?.booking || user?.adminInfo?.permissions?.booking) && (
              <button
                onClick={() => setActiveTab('booking')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'booking'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Booking" : ""}
              >
                <Package className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Booking</span>}
              </button>
            )}

            {/* Address Forms - only shown when user has access */}
            {(user?.permissions?.addressForms || user?.adminInfo?.permissions?.addressForms) && (
              <button
                onClick={() => setActiveTab('addressforms')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'addressforms'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Address Forms" : ""}
              >
                <FileText className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Address Forms</span>}
              </button>
            )}

            {/* Pincode Management - only shown when user has access */}
            {(user?.permissions?.pincodeManagement || user?.adminInfo?.permissions?.pincodeManagement) && (
              <button
                onClick={() => setActiveTab('pincodes')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'pincodes'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Pincode Management" : ""}
              >
                <MapPin className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Pincode Management</span>}
              </button>
            )}

            {/* User Management - only shown when user has admin access */}
            {(user?.adminInfo?.permissions?.userManagement) && (
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "User Management" : ""}
              >
                <UserCog className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">User Management</span>}
              </button>
            )}

            {/* Settings - shown by default for all users */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={isSidebarCollapsed ? "Settings" : ""}
            >
              <Settings className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Settings</span>}
            </button>

            {/* Reports - shown by default for all users */}
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                activeTab === 'reports'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={isSidebarCollapsed ? "Reports" : ""}
            >
              <FileText className="h-5 w-5" />
              {!isSidebarCollapsed && <span className="font-medium text-sm">Reports</span>}
            </button>

            {/* Coloader Registration - only shown when user has access */}
            {(user?.permissions?.coloaderRegistration || user?.adminInfo?.permissions?.coloaderRegistration) && (
              <button
                onClick={() => setActiveTab('coloader')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'coloader'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Coloader Registration" : ""}
              >
                <Truck className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Coloader Registration</span>}
              </button>
            )}

            {/* Coloader Management - only shown when user has access */}
            {(user?.permissions?.coloaderManagement || user?.adminInfo?.permissions?.coloaderManagement) && (
              <button
                onClick={() => setActiveTab('coloaderManagement')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'coloaderManagement'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Coloader Management" : ""}
              >
                <Truck className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Coloader Management</span>}
              </button>
            )}

            {/* Employee Management - only shown when user has access */}
            {(user?.permissions?.employeeManagement || user?.adminInfo?.permissions?.employeeManagement) && (
              <button
                onClick={() => setActiveTab('employeeManagement')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'employeeManagement'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Employee Management" : ""}
              >
                <Users className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Employee Management</span>}
              </button>
            )}

            {/* Employee Registration - only shown when user has access */}
            {(user?.permissions?.employeeRegistration || user?.adminInfo?.permissions?.employeeRegistration) && (
              <button
                onClick={() => setActiveTab('employeeRegistration')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'employeeRegistration'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Employee Registration" : ""}
              >
                <Users className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Employee Registration</span>}
              </button>
            )}

            {/* Corporate Management - only shown when user has access */}
            {(user?.permissions?.corporateManagement || user?.adminInfo?.permissions?.corporateManagement) && (
              <button
                onClick={() => setActiveTab('corporateManagement')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'corporateManagement'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Corporate Management" : ""}
              >
                <Shield className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Corporate Management</span>}
              </button>
            )}

            {/* Corporate Registration - only shown when user has access */}
            {(user?.permissions?.corporateRegistration || user?.adminInfo?.permissions?.corporateRegistration) && (
              <button
                onClick={() => setActiveTab('corporateRegistration')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'corporateRegistration'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Corporate Registration" : ""}
              >
                <Shield className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Corporate Registration</span>}
              </button>
            )}

            {/* Corporate Pricing - only shown when user has access */}
            {(user?.permissions?.corporatePricing || user?.adminInfo?.permissions?.corporatePricing) && (
              <button
                onClick={() => setActiveTab('corporatePricing')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'corporatePricing'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Corporate Pricing" : ""}
              >
                <BarChart3 className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Corporate Pricing</span>}
              </button>
            )}

            {/* Corporate Approval - only shown when user has access */}
            {(user?.permissions?.corporateApproval || user?.adminInfo?.permissions?.corporateApproval) && (
              <button
                onClick={() => setActiveTab('corporateApproval')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'corporateApproval'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Corporate Approval" : ""}
              >
                <Shield className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Corporate Approval</span>}
              </button>
            )}

            {/* Assign Consignment - only shown when user has access */}
            {(user?.permissions?.consignmentManagement || user?.adminInfo?.permissions?.consignmentManagement) && (
              <button
                onClick={() => setActiveTab('consignmentManagement')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'consignmentManagement'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Assign Consignment" : ""}
              >
                <Package className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Assign Consignment</span>}
              </button>
            )}

            {/* Courier Requests - only shown when user has access */}
            {(user?.permissions?.courierRequests || user?.adminInfo?.permissions?.courierRequests) && (
              <button
                onClick={() => setActiveTab('courierRequests')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'courierRequests'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Courier Requests" : ""}
              >
                <Truck className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Courier Requests</span>}
              </button>
            )}

            {/* Invoice Management - only shown when user has access */}
            {(user?.permissions?.invoiceManagement || user?.adminInfo?.permissions?.invoiceManagement) && (
              <button
                onClick={() => setActiveTab('invoiceManagement')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'invoiceManagement'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Invoice Management" : ""}
              >
                <FileText className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Invoice Management</span>}
              </button>
            )}

            {/* Bagging Management - only shown when user has access */}
            {(user?.permissions?.baggingManagement || user?.adminInfo?.permissions?.baggingManagement) && (
              <button
                onClick={() => setActiveTab('baggingManagement')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'baggingManagement'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Bagging Management" : ""}
              >
                <Package className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Bagging Management</span>}
              </button>
            )}

            {/* Received Consignments - only shown when user has access */}
            {(user?.permissions?.receivedOrders || user?.adminInfo?.permissions?.receivedOrders) && (
              <button
                onClick={() => setActiveTab('receivedOrders')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'receivedOrders'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Received Consignments" : ""}
              >
                <Package className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Received Consignments</span>}
              </button>
            )}

            {/* Assign Coloaders - only shown when user has access */}
            {(user?.permissions?.manageOrders || user?.adminInfo?.permissions?.manageOrders) && (
              <button
                onClick={() => setActiveTab('manageOrders')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'manageOrders'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Assign Coloaders" : ""}
              >
                <Package className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Assign Coloaders</span>}
              </button>
            )}

            {/* Medicine Settlement - only shown when user has access */}
            {(user?.permissions?.medicineSettlement || user?.adminInfo?.permissions?.medicineSettlement) && (
              <button
                onClick={() => setActiveTab('medicineSettlement')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'medicineSettlement'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Medicine Settlement" : ""}
              >
                <DollarSign className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Medicine Settlement</span>}
              </button>
            )}

            {/* Track Medicine - only shown when user has access */}
            {(user?.permissions?.trackMedicine || user?.adminInfo?.permissions?.trackMedicine) && (
              <button
                onClick={() => setActiveTab('trackMedicine')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'trackMedicine'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Track Medicine" : ""}
              >
                <Search className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Track Medicine</span>}
              </button>
            )}

            {/* Arrived Medicine - only shown when user has access */}
            {(user?.permissions?.arrivedMedicine || user?.adminInfo?.permissions?.arrivedMedicine) && (
              <button
                onClick={() => setActiveTab('arrivedMedicine')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'arrivedMedicine'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Arrived Medicine" : ""}
              >
                <CheckCircle className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Arrived Medicine</span>}
              </button>
            )}

            {/* Customer Pricing - only shown when user has access */}
            {(user?.permissions?.customerPricing || user?.adminInfo?.permissions?.customerPricing) && (
              <button
                onClick={() => setActiveTab('customerPricing')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'customerPricing'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Customer Pricing" : ""}
              >
                <Tag className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Customer Pricing</span>}
              </button>
            )}

            {/* Single Quotation - only shown when user has access */}
            {(user?.permissions?.singleQuotation || user?.adminInfo?.permissions?.singleQuotation) && (
              <button
                onClick={() => setActiveTab('singleQuotation')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'singleQuotation'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Single Quotation" : ""}
              >
                <FileText className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Single Quotation</span>}
              </button>
            )}

            {/* Courier Boy Management - only shown when user has access */}
            {(user?.permissions?.courierBoyManagement || user?.adminInfo?.permissions?.courierBoyManagement) && (
              <button
                onClick={() => setActiveTab('courierBoyManagement')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'courierBoyManagement'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Courier Boy Management" : ""}
              >
                <Bike className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Courier Boy Management</span>}
              </button>
            )}

            {/* Assign Courier Boy - only shown when user has access */}
            {(user?.permissions?.assignCourierBoy || user?.adminInfo?.permissions?.assignCourierBoy) && (
              <button
                onClick={() => setActiveTab('assignCourierBoy')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'assignCourierBoy'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Assign Courier Boy" : ""}
              >
                <Bike className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Assign Courier Boy</span>}
              </button>
            )}

            {/* Customer Complaints - only shown when user has access */}
            {(user?.permissions?.customerComplain || user?.adminInfo?.permissions?.customerComplain) && (
              <button
                onClick={() => setActiveTab('customerComplain')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'customerComplain'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Customer Complaints" : ""}
              >
                <MessageCircle className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Customer Complaints</span>}
              </button>
            )}

            {/* Delivery - only shown when user has access */}
            {(user?.permissions?.delivery || user?.adminInfo?.permissions?.delivery) && (
              <button
                onClick={() => setActiveTab('delivery')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'delivery'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Delivery" : ""}
              >
                <Truck className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Delivery</span>}
              </button>
            )}

            {/* Force Delivery - only shown when user has access */}
            {(user?.permissions?.forceDelivery || user?.adminInfo?.permissions?.forceDelivery) && (
              <button
                onClick={() => setActiveTab('forceDelivery')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'forceDelivery'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Force Delivery" : ""}
              >
                <Zap className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Force Delivery</span>}
              </button>
            )}

            {/* Undelivered - only shown when user has access */}
            {(user?.permissions?.undelivered || user?.adminInfo?.permissions?.undelivered) && (
              <button
                onClick={() => setActiveTab('undelivered')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'undelivered'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Undelivered" : ""}
              >
                <X className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Undelivered</span>}
              </button>
            )}

            {/* Medicine Booking - only shown when user has access */}
            {(user?.permissions?.medicineBooking || user?.adminInfo?.permissions?.medicineBooking) && (
              <button
                onClick={() => setActiveTab('medicineBooking')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'medicineBooking'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Medicine Booking" : ""}
              >
                <Package className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Medicine Booking</span>}
              </button>
            )}

            {/* Customer Booking - only shown when user has access */}
            {(user?.permissions?.customerBooking || user?.adminInfo?.permissions?.customerBooking) && (
              <button
                onClick={() => setActiveTab('customerBooking')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'customerBooking'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Customer Booking" : ""}
              >
                <Package className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Customer Booking</span>}
              </button>
            )}

            {/* All Bookings - only shown when user has access */}
            {(user?.permissions?.allBookings || user?.adminInfo?.permissions?.allBookings) && (
              <button
                onClick={() => setActiveTab('allBookings')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'allBookings'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "All Bookings" : ""}
              >
                <ClipboardList className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">All Bookings</span>}
              </button>
            )}

            {/* Office Booking - only shown when user has access */}
            {(user?.permissions?.officeBooking || user?.adminInfo?.permissions?.officeBooking) && (
              <button
                onClick={() => setActiveTab('officeBooking')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'officeBooking'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Office Booking" : ""}
              >
                <Building2 className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Office Booking</span>}
              </button>
            )}

            {/* Corporate Booking - only shown when user has access */}
            {(user?.permissions?.corporateBooking || user?.adminInfo?.permissions?.corporateBooking) && (
              <button
                onClick={() => setActiveTab('corporateBooking')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'corporateBooking'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Corporate Booking" : ""}
              >
                <Building2 className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Corporate Booking</span>}
              </button>
            )}

            {/* Cold Calling - only shown when user has access */}
            {(user?.permissions?.coldCalling || user?.adminInfo?.permissions?.coldCalling) && (
              <button
                onClick={() => setActiveTab('coldCalling')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'coldCalling'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Cold Calling" : ""}
              >
                <PhoneCall className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Cold Calling</span>}
              </button>
            )}

            {/* Payment Status - only shown when user has access */}
            {(user?.permissions?.payments || user?.adminInfo?.permissions?.payments) && (
              <button
                onClick={() => setActiveTab('payments')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'payments'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Payment Status" : ""}
              >
                <CreditCard className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Payment Status</span>}
              </button>
            )}

            {/* Collect Payment - only shown when user has access */}
            {(user?.permissions?.collectPayment || user?.adminInfo?.permissions?.collectPayment) && (
              <button
                onClick={() => setActiveTab('collectPayment')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'collectPayment'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Collect Payment" : ""}
              >
                <DollarSign className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Collect Payment</span>}
              </button>
            )}

            {/* Sales Form - only shown when user has access */}
            {(user?.permissions?.salesForm || user?.adminInfo?.permissions?.salesForm) && (
              <button
                onClick={() => setActiveTab('salesForm')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'salesForm'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isSidebarCollapsed ? "Sales Form" : ""}
              >
                <FileText className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Sales Form</span>}
              </button>
            )}

            {/* Admin-only sections */}
            {user?.adminInfo && user?.adminInfo?.role === 'super_admin' && (
              <button
                onClick={() => setActiveTab('admins')}
                className={`w-full text-left flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition ${
                  activeTab === 'admins'
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

        {/* Footer - User info - fixed at bottom */}
        <div className={`${isSidebarCollapsed ? 'p-3' : 'p-5'} border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="text-center mb-3">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Badge
                  variant={user?.adminInfo?.role === 'super_admin' ? 'default' : 'secondary'}
                  className="px-3 py-1"
                >
                  {user?.adminInfo ? user.adminInfo.role : user?.role}
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
                className="w-full bg-white/90 p-2"
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
      <main className={`${isSidebarCollapsed ? 'ml-16 w-[calc(100vw-4rem)]' : 'ml-64 w-[calc(100vw-16rem)]'} h-screen overflow-y-auto p-6 transition-all duration-300 ease-in-out`}>
        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(16,24,40,0.08)] border border-gray-100 p-6 min-h-[calc(100vh-3rem)]">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50/80 border-0">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Overview */}
          {activeTab === 'overview' && renderOverviewContent()}

          {/* Booking Panel */}
          {activeTab === 'booking' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  {/* <h1 className="text-2xl font-bold text-gray-800">Booking Panel</h1>
                  <p className="text-gray-600">Create and manage shipment bookings</p> */}
                </div>
              </div>
              <BookingPanel />
            </div>
          )}

          {/* Other pages */}
          {activeTab === 'addressforms' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Address Forms</h1>
                  <p className="text-gray-600">View and manage customer address forms</p>
                </div>
              </div>
              <AddressFormsTable />
            </div>
          )}
          {activeTab === 'pincodes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Pincode Management</h1>
                  <p className="text-gray-600">Manage pincode areas and coverage</p>
                </div>
              </div>
              <PincodeManagement />
            </div>
          )}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                  <p className="text-gray-600">Manage office users and permissions</p>
                </div>
              </div>
              <UserManagement />
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                  <p className="text-gray-600">Manage your account settings and preferences</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-700 mb-6">System Configuration</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Shipping Method
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Express Delivery</option>
                      <option>Standard Delivery</option>
                      <option>Economy Delivery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Preferences
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-gray-600">Email notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-gray-600">SMS alerts</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-gray-600">Push notifications</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
                  <p className="text-gray-600">View and generate reports</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Monthly Performance Report</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Delivery Success Rate</span>
                    <span className="font-semibold text-green-600">98.5%</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Average Delivery Time</span>
                    <span className="font-semibold text-blue-600">2.3 days</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Customer Satisfaction</span>
                    <span className="font-semibold text-purple-600">4.8/5.0</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'coloader' && (
            <div className="space-y-6">
              
              <ColoaderRegistration />
            </div>
          )}
          {activeTab === 'coloaderManagement' && (
            <div className="space-y-6">
              
              <ColoaderManagement />
            </div>
          )}
          {/* Employee Management */}
          {activeTab === 'employeeManagement' && (
            <div className="space-y-6">
              <EmployeeManagement />
            </div>
          )}

          {/* Employee Registration */}
          {activeTab === 'employeeRegistration' && (
            <div className="space-y-6">
              
              <EmployeeRegistration />
            </div>
          )}

          {/* Corporate Management */}
          {activeTab === 'corporateManagement' && (
            <div className="space-y-6">
              
              <CorporateManagement />
            </div>
          )}

          {/* Corporate Registration */}
          {activeTab === 'corporateRegistration' && (
            <div className="space-y-6">
              
              <CorporateRegistration />
            </div>
          )}

          {/* Corporate Pricing */}
          {activeTab === 'corporatePricing' && (
            <div className="space-y-6">
              
              <CorporatePricing />
            </div>
          )}

          {/* Corporate Approval */}
          {activeTab === 'corporateApproval' && (
            <div className="space-y-6">
              
              <CorporateApproval />
            </div>
          )}

          {/* Assign Consignment */}
          {activeTab === 'consignmentManagement' && (
            <div className="space-y-6">
              
              <AssignConsignment />
            </div>
          )}

          {/* Courier Requests */}
          {activeTab === 'courierRequests' && (
            <div className="space-y-6">
              
              <CourierRequests />
            </div>
          )}

          {/* Invoice Management */}
          {activeTab === 'invoiceManagement' && (
            <div className="space-y-6">
              
              <InvoiceManagement />
            </div>
          )}

          {/* Bagging Management */}
          {activeTab === 'baggingManagement' && (
            <div className="space-y-6">
              
              <BaggingManagement />
            </div>
          )}

          {/* Received Consignments */}
          {activeTab === 'receivedOrders' && (
            <div className="space-y-6">
              
              <ReceivedConsignment />
            </div>
          )}

          {/* Assign Coloaders */}
          {activeTab === 'manageOrders' && (
            <div className="space-y-6">
              
              <AssignColoader />
            </div>
          )}

          {/* Medicine Settlement */}
          {activeTab === 'medicineSettlement' && (
            <div className="space-y-6">
              <MedicineSettlement />
            </div>
          )}

          {/* Track Medicine */}
          {activeTab === 'trackMedicine' && (
            <div className="space-y-6">
              <TrackMedicine />
            </div>
          )}

          {/* Arrived Medicine */}
          {activeTab === 'arrivedMedicine' && (
            <div className="space-y-6">
              <ArrivedMedicine />
            </div>
          )}

          {/* Customer Pricing */}
          {activeTab === 'customerPricing' && (
            <div className="space-y-6">
              <CustomerPricing />
            </div>
          )}

          {/* Single Quotation */}
          {activeTab === 'singleQuotation' && (
            <div className="space-y-6">
              <SingleQuotation />
            </div>
          )}

          {/* Courier Boy Management */}
          {activeTab === 'courierBoyManagement' && (
            <div className="space-y-6">
              <CourierBoyManagement />
            </div>
          )}

          {/* Assign Courier Boy */}
          {activeTab === 'assignCourierBoy' && (
            <div className="space-y-6">
              <AssignCourierBoy />
            </div>
          )}

          {/* Customer Complaints */}
          {activeTab === 'customerComplain' && (
            <div className="space-y-6">
              <CustomerComplain />
            </div>
          )}

          {/* Delivery */}
          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <Delivery />
            </div>
          )}

          {/* Force Delivery */}
          {activeTab === 'forceDelivery' && (
            <div className="space-y-6">
              <ForceDelivery />
            </div>
          )}

          {/* Undelivered */}
          {activeTab === 'undelivered' && (
            <div className="space-y-6">
              <Undelivered />
            </div>
          )}

          {/* Medicine Booking */}
          {activeTab === 'medicineBooking' && (
            <div className="space-y-6">
              <MedicineBookingOverview />
            </div>
          )}

          {/* Customer Booking */}
          {activeTab === 'customerBooking' && (
            <div className="space-y-6">
              <CustomerBookingOverview />
            </div>
          )}

          {/* All Bookings */}
          {activeTab === 'allBookings' && (
            <div className="space-y-6">
              <AllBookings />
            </div>
          )}

          {/* Office Booking */}
          {activeTab === 'officeBooking' && (
            <div className="space-y-6">
              <OfficeBookingPanel />
            </div>
          )}

          {/* Corporate Booking */}
          {activeTab === 'corporateBooking' && (
            <div className="space-y-6">
              <CorporateBooking />
            </div>
          )}

          {/* Cold Calling */}
          {activeTab === 'coldCalling' && (
            <div className="space-y-6">
              <ColdCalling />
            </div>
          )}

          {/* Payment Status */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <PaymentStatus />
            </div>
          )}

          {/* Collect Payment */}
          {activeTab === 'collectPayment' && (
            <div className="space-y-6">
              <CollectPayment />
            </div>
          )}

          {/* Sales Form */}
          {activeTab === 'salesForm' && (
            <div className="space-y-6">
              <SalesForm />
            </div>
          )}

          {activeTab === 'admins' && user?.adminInfo && user?.adminInfo?.role === 'super_admin' && (
            <AdminManagement />
          )}
          {activeTab === 'admins' && (!user?.adminInfo || user?.adminInfo?.role !== 'super_admin') && (
            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-gray-100">
              <Shield className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Super Admin Access Required</h3>
              <p className="text-gray-500 text-center max-w-md">
                You need super administrator privileges to access this section. 
                Please contact your system administrator if you believe you should have access.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OfficeDashboard;