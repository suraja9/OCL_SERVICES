import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  LogOut, 
  Settings, 
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Shield,
  Menu,
  MoonStar,
  Sun
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import CorporateSidebar from "@/components/corporate/CorporateSidebar";
import CorporatePricingDisplay from "@/components/corporate/CorporatePricingDisplay";
import ComplaintDesk from "@/components/corporate/ComplaintDesk";
import CourierComplaintDesk from "@/components/corporate/CourierComplaintDesk";
import BookingSection from "@/components/corporate/BookingSection";
import ShipmentOverview from "@/components/corporate/ShipmentOverview";
import CorporateTracking from "@/components/corporate/CorporateTracking";
import SettlementSection from "@/components/corporate/SettlementSection";
import CompanyProfile from "@/components/corporate/CompanyProfile";
import NewCorporateDashboard from "@/components/corporate/dashboard/NewCorporateDashboard";
import ActiveCorporateDashboard from "@/components/corporate/dashboard/ActiveCorporateDashboard";
import DashboardDemoToggle from "@/components/corporate/dashboard/DashboardDemoToggle";
import HelpResources from "@/components/corporate/HelpResources";

interface CorporateInfo {
  id: string;
  corporateId: string;
  companyName: string;
  email: string;
  contactNumber: string;
  username: string;
  lastLogin: string;
  isFirstLogin: boolean;
  logo?: string;
}

interface DashboardStats {
  corporate: {
    id: string;
    corporateId: string;
    companyName: string;
    email: string;
    contactNumber: string;
    registrationDate: string;
    lastLogin: string;
    isActive: boolean;
    billingType?: string;
    manager?: string;
    billingCycle?: string;
    companyAddress?: string;
    city?: string;
    state?: string;
    pin?: string;
    locality?: string;
    gstNumber?: string;
    logo?: string;
  };
  summary: {
    totalShipments: number;
    pendingShipments: number;
    completedShipments: number;
    totalSpent: number;
  };
  monthly: {
    shipments: number;
    spend: number;
    deliveryRate: number;
  };
  recentShipments: Array<{
    id: string;
    consignmentNumber: string;
    destination: string;
    status: string;
    date: string;
  }>;
  complaints: {
    active: number;
    resolved: number;
  };
  tpMetrics: {
    tpPaidShipments: number; // TP shipments that are paid
    fpUnpaidShipments: number; // FP shipments that are unpaid (in transit)
    tpUnpaidShipments: number; // TP shipments that are unpaid (on hold)
  };
  topDestinations: Array<{
    route: string;
    count: number;
  }>;
}

const CorporateDashboard = () => {
  const [corporate, setCorporate] = useState<CorporateInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isNewCorporateDemo, setIsNewCorporateDemo] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('corporateDarkMode');
    return savedDarkMode === 'true';
  });
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('corporateToken');
    const storedCorporateInfo = localStorage.getItem('corporateInfo');

    if (!token || !storedCorporateInfo) {
      navigate('/corporate');
      return;
    }

    try {
      const corporateData = JSON.parse(storedCorporateInfo);
      setCorporate(corporateData);
      
      // Check if it's first login
      if (corporateData.isFirstLogin) {
        navigate('/corporate/change-password');
        return;
      }
    } catch (error) {
      navigate('/corporate');
      return;
    }

    fetchDashboardStats();
  }, [navigate]);

  // Persist dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('corporateDarkMode', isDarkMode.toString());
    // Apply dark mode class to document root for global styling
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Function to calculate top destinations from shipment data
  const calculateTopDestinations = (shipments: any[]): Array<{ route: string; count: number }> => {
    const routeCounts: { [key: string]: number } = {};
    
    console.log('Calculating top destinations from shipments:', shipments.length);
    
    shipments.forEach((shipment, index) => {
      console.log(`Processing shipment ${index}:`, shipment);
      
      // Handle both possible data structures: direct originData/destinationData or nested under bookingData
      let originData, destinationData;
      
      if (shipment.bookingData) {
        // Data is nested under bookingData (from API)
        originData = shipment.bookingData.originData;
        destinationData = shipment.bookingData.destinationData;
        console.log(`Shipment ${index} - Using bookingData structure`);
      } else {
        // Data is direct (transformed data)
        originData = shipment.originData;
        destinationData = shipment.destinationData;
        console.log(`Shipment ${index} - Using direct structure`);
      }
      
      console.log(`Shipment ${index} - Origin data:`, originData);
      console.log(`Shipment ${index} - Destination data:`, destinationData);
      
      if (originData && destinationData) {
        const origin = originData.city || originData.state || 'Unknown';
        const destination = destinationData.city || destinationData.state || 'Unknown';
        const route = `${origin} → ${destination}`;
        routeCounts[route] = (routeCounts[route] || 0) + 1;
        console.log(`Shipment ${index} - Route: ${route}`);
      } else {
        console.log(`Shipment ${index} - Missing origin or destination data`);
      }
    });
    
    console.log('Route counts:', routeCounts);
    
    // Convert to array and sort by count
    const result = Object.entries(routeCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 destinations
    
    console.log('Final top destinations result:', result);
    return result;
  };

  const generateMockStats = (isNewCorporate: boolean): DashboardStats => {
    const baseCorporate = {
      id: corporate?.id || '1',
      corporateId: corporate?.corporateId || 'CORP001',
      companyName: corporate?.companyName || 'Demo Company',
      email: corporate?.email || 'demo@company.com',
      contactNumber: corporate?.contactNumber || '+91 9876543210',
      registrationDate: '2024-01-15',
      lastLogin: new Date().toISOString(),
      isActive: true,
      billingType: 'Monthly',
      manager: 'John Smith',
      billingCycle: 'Monthly'
    };

    if (isNewCorporate) {
      return {
        corporate: baseCorporate,
        summary: {
          totalShipments: 0,
          pendingShipments: 0,
          completedShipments: 0,
          totalSpent: 0
        },
        monthly: {
          shipments: 0,
          spend: 0,
          deliveryRate: 0
        },
        recentShipments: [],
        complaints: {
          active: 0,
          resolved: 0
        },
        tpMetrics: {
          tpPaidShipments: 0,
          fpUnpaidShipments: 0,
          tpUnpaidShipments: 0
        },
        topDestinations: []
      };
    } else {
      // Active corporate with data
      return {
        corporate: baseCorporate,
        summary: {
          totalShipments: 156,
          pendingShipments: 12,
          completedShipments: 144,
          totalSpent: 125000
        },
        monthly: {
          shipments: 45,
          spend: 35000,
          deliveryRate: 96
        },
        recentShipments: [
          {
            id: '1',
            consignmentNumber: 'OCL240101001',
            destination: 'Mumbai, Maharashtra',
            status: 'Delivered',
            date: '2 days ago'
          },
          {
            id: '2',
            consignmentNumber: 'OCL240101002',
            destination: 'Delhi, NCR',
            status: 'In Transit',
            date: '1 day ago'
          },
          {
            id: '3',
            consignmentNumber: 'OCL240101003',
            destination: 'Bangalore, Karnataka',
            status: 'Delivered',
            date: '3 days ago'
          },
          {
            id: '4',
            consignmentNumber: 'OCL240101004',
            destination: 'Chennai, Tamil Nadu',
            status: 'Pending',
            date: 'Today'
          }
        ],
        complaints: {
          active: 2,
          resolved: 8
        },
        tpMetrics: {
          tpPaidShipments: 45, // TP shipments that are paid
          fpUnpaidShipments: 8, // FP shipments that are unpaid (in transit)
          tpUnpaidShipments: 4 // TP shipments that are unpaid (on hold)
        },
        topDestinations: [
          { route: 'Mumbai → Delhi', count: 47 },
          { route: 'Bangalore → Chennai', count: 31 },
          { route: 'Pune → Hyderabad', count: 23 },
          { route: 'Delhi → Mumbai', count: 19 },
          { route: 'Chennai → Bangalore', count: 15 }
        ]
      };
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('corporateToken');
      
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/corporate/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch shipment data for top destinations calculation
      const shipmentsResponse = await fetch('/api/corporate/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        let dashboardStats = statsData.stats;
        
        // If we have shipment data, calculate top destinations
        if (shipmentsResponse.ok) {
          const shipmentsData = await shipmentsResponse.json();
          const shipments = shipmentsData.data || [];
          console.log('Shipments data for top destinations:', shipments);
          const topDestinations = calculateTopDestinations(shipments);
          console.log('Calculated top destinations:', topDestinations);
          dashboardStats.topDestinations = topDestinations;
        } else {
          // If no shipment data, set empty array
          console.log('No shipment data available for top destinations');
          dashboardStats.topDestinations = [];
        }
        
        setStats(dashboardStats);
        setIsDemoMode(false); // Real data loaded
      } else {
        console.error('Failed to fetch dashboard stats:', statsResponse.status);
        setError('Failed to load dashboard data. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('corporateToken');
    localStorage.removeItem('corporateInfo');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/corporate');
  };

  const handleLogoUpdate = (logoUrl: string) => {
    // Update corporate state with new logo
    setCorporate(prev => {
      if (!prev) return null;
      const updated = { ...prev, logo: logoUrl };
      
      // Update localStorage to persist the change
      const storedCorporateInfo = localStorage.getItem('corporateInfo');
      if (storedCorporateInfo) {
        try {
          const corporateData = JSON.parse(storedCorporateInfo);
          corporateData.logo = logoUrl;
          localStorage.setItem('corporateInfo', JSON.stringify(corporateData));
        } catch (error) {
          console.error('Error updating localStorage:', error);
        }
      }
      
      return updated;
    });
  };

  const toggleDemoMode = () => {
    setIsNewCorporateDemo(!isNewCorporateDemo);
    setStats(generateMockStats(!isNewCorporateDemo));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pageBackground = isDarkMode
    ? "bg-slate-950 text-slate-50"
    : "bg-slate-50 text-slate-900";
  const accentGradient = isDarkMode
    ? "from-blue-500/20 via-blue-400/10 to-transparent"
    : "from-blue-400/15 via-blue-300/10 to-transparent";
  const accentGradientAlt = isDarkMode
    ? "from-purple-500/25 via-indigo-400/10 to-transparent"
    : "from-purple-400/15 via-violet-300/10 to-transparent";

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors duration-500",
        pageBackground
      )}>
        <div className="text-center">
          <Loader2 className={cn(
            "h-8 w-8 animate-spin mx-auto mb-4",
            isDarkMode ? "text-blue-400" : "text-blue-600"
          )} />
          <p className={isDarkMode ? "text-slate-300" : "text-gray-600"}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors duration-500",
        pageBackground
      )}>
        <div className="text-center">
          <AlertCircle className={cn(
            "h-8 w-8 mx-auto mb-4",
            isDarkMode ? "text-red-400" : "text-red-600"
          )} />
          <p className={isDarkMode ? "text-red-300" : "text-red-600 mb-4"}>{error}</p>
          <Button 
            onClick={fetchDashboardStats} 
            variant="outline"
            className={cn(
              isDarkMode && "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
            )}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-screen w-screen overflow-hidden transition-colors duration-500 ease-out",
        pageBackground
      )}
    >
      {/* Background gradient effects */}
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

      {/* Demo Toggle */}
      {isDemoMode && (
        <DashboardDemoToggle
          isNewCorporate={isNewCorporateDemo}
          onToggle={toggleDemoMode}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Sidebar */}
      <CorporateSidebar
        corporate={corporate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isDarkMode={isDarkMode}
      />

      {/* Main content */}
      <main className={cn(
        'relative z-10 h-screen overflow-y-auto p-6 transition-all duration-300 ease-in-out',
        isMobile 
          ? 'w-full' 
          : isSidebarCollapsed 
            ? 'ml-16 w-[calc(100vw-4rem)]' 
            : 'ml-64 w-[calc(100vw-16rem)]'
      )}>
        {/* Mobile Header with Hamburger Menu */}
        {isMobile && (
          <div className="flex items-center justify-between gap-4 mb-6 lg:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className={cn(
                "h-10 w-10 rounded-xl border transition",
                isDarkMode
                  ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                  : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
              )}
            >
              <Menu size={20} />
              <span className="sr-only">Open menu</span>
            </Button>
            <div className="flex-1">
              <h1 className={cn(
                "text-xl font-semibold",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                {corporate?.companyName || 'Corporate Portal'}
              </h1>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setIsDarkMode((prev) => {
                  const newValue = !prev;
                  localStorage.setItem('corporateDarkMode', newValue.toString());
                  return newValue;
                });
              }}
              className={cn(
                "h-10 w-10 rounded-xl border transition",
                isDarkMode
                  ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                  : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
              )}
            >
              {isDarkMode ? (
                <Sun size={18} />
              ) : (
                <MoonStar size={18} />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        )}

        <div className={cn(
          "backdrop-blur-sm rounded-2xl shadow-[0_25px_80px_rgba(15,23,42,0.15)] p-6 min-h-[calc(100vh-3rem)] transition",
          isDarkMode
            ? "bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-slate-800/60"
            : "bg-gradient-to-br from-gray-50/50 to-white/80"
        )}>
          {/* Dark Mode Toggle - Top Right (for all pages except dashboard) */}
          {activeTab !== 'dashboard' && (
            <div className="hidden lg:flex justify-end mb-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDarkMode((prev) => {
                    const newValue = !prev;
                    localStorage.setItem('corporateDarkMode', newValue.toString());
                    return newValue;
                  });
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full border transition",
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
          )}

          {error && (
            <div className={cn(
              "mb-6 p-4 rounded-lg shadow-sm",
              isDarkMode
                ? "bg-red-500/10 border border-red-500/20"
                : "bg-red-50/80"
            )}>
              <div className="flex items-center">
                <AlertCircle className={cn(
                  "h-5 w-5 mr-2",
                  isDarkMode ? "text-red-400" : "text-red-600"
                )} />
                <p className={isDarkMode ? "text-red-300" : "text-red-600"}>{error}</p>
              </div>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className={cn(
                    "h-8 w-8 animate-spin",
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  )} />
                  <span className={cn(
                    "ml-2",
                    isDarkMode ? "text-slate-300" : "text-gray-600"
                  )}>Loading dashboard...</span>
                </div>
              ) : stats ? (
                // Check if corporate has any data (shipments, spend, etc.) or if in demo mode
                (isDemoMode ? isNewCorporateDemo : (stats.summary.totalShipments === 0 && stats.summary.totalSpent === 0)) ? (
                  // Scenario A: New Corporate (No Data Yet)
                  <NewCorporateDashboard 
                    corporate={stats.corporate}
                    onNavigateToTab={setActiveTab}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={() => {
                      setIsDarkMode((prev) => {
                        const newValue = !prev;
                        localStorage.setItem('corporateDarkMode', newValue.toString());
                        return newValue;
                      });
                    }}
                  />
                ) : (
                  // Scenario B: Active Corporate (Has Data)
                  <ActiveCorporateDashboard 
                    corporate={stats.corporate}
                    stats={stats}
                    onNavigateToTab={setActiveTab}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={() => {
                      setIsDarkMode((prev) => {
                        const newValue = !prev;
                        localStorage.setItem('corporateDarkMode', newValue.toString());
                        return newValue;
                      });
                    }}
                  />
                )
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className={cn(
                    "h-12 w-12 mx-auto mb-4",
                    isDarkMode ? "text-red-400" : "text-red-500"
                  )} />
                  <h3 className={cn(
                    "text-lg font-semibold mb-2",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>Failed to Load Dashboard</h3>
                  <p className={cn(
                    "mb-4",
                    isDarkMode ? "text-slate-300" : "text-gray-600"
                  )}>Unable to load your dashboard data. Please try again.</p>
                  <Button 
                    onClick={fetchDashboardStats} 
                    variant="outline"
                    className={cn(
                      isDarkMode && "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
                    )}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && <CorporatePricingDisplay isDarkMode={isDarkMode} />}

          {/* Company Profile Tab */}
          {activeTab === 'profile' && <CompanyProfile onLogoUpdate={handleLogoUpdate} isDarkMode={isDarkMode} />}

          {/* Booking Tab */}
          {activeTab === 'booking' && <BookingSection isDarkMode={isDarkMode} />}

          {/* Shipments Tab */}
          {activeTab === 'shipments' && <ShipmentOverview isDarkMode={isDarkMode} />}

          {/* Tracking Tab */}
          {activeTab === 'tracking' && <CorporateTracking isDarkMode={isDarkMode} />}

          {/* Complaint Desk Tab */}
          {activeTab === 'complaints' && <ComplaintDesk isDarkMode={isDarkMode} />}

          {/* Courier Complaint Desk Tab */}
          {activeTab === 'courier-complaints' && <CourierComplaintDesk isDarkMode={isDarkMode} />}

          {/* Settlement Tab */}
          {activeTab === 'settlement' && <SettlementSection isDarkMode={isDarkMode} />}

          {/* Help & Resources Tab */}
          {activeTab === 'help' && <HelpResources />}
        </div>
      </main>
    </div>
  );
};

export default CorporateDashboard;
