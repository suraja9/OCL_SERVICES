import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MedicineSidebar from '@/components/medicine/MedicineSidebar';
import Settlement from '@/components/medicine/Settlement';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, 
  Loader2, 
  Package, 
  CheckCircle, 
  Clock, 
  Truck, 
  FileText, 
  TrendingUp,
  Calendar,
  Weight,
  CreditCard,
  Wallet,
  Filter,
  IndianRupee,
  Sun,
  MoonStar
} from 'lucide-react';

interface MedicineUserInfo {
  id: string;
  email: string;
  name: string;
  lastLogin?: string;
}

interface DashboardSummary {
  bookings: {
    total: number;
    booked: number;
    pending: number;
    readyToDispatch: number;
    inTransit: number;
    arrivedAtHub: number;
    delivered: number;
    cancelled: number;
  };
  payments: {
    paid: number;
    willPay: number;
    notPaid: number;
  };
  manifests: {
    total: number;
    submitted: number;
    dispatched: number;
    delivered: number;
  };
  settlements: {
    totalTransactions: number;
    totalWeight: number;
    oclCharge: number;
    remainingBalance: number;
    totalCost: number;
  };
}

const MedicineDashboard: React.FC = () => {
  const [user, setUser] = useState<MedicineUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [useDateFilter, setUseDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('medicineDarkMode');
    return savedDarkMode === 'true';
  });
  const location = useLocation();
  const navigate = useNavigate();
  const settlementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('medicineToken');
    const info = localStorage.getItem('medicineInfo');
    if (!token || !info) {
      navigate('/medicine');
      return;
    }
    try {
      setUser(JSON.parse(info));
    } catch {
      navigate('/medicine');
      return;
    }
    setIsLoading(false);
  }, [navigate]);

  // Scroll to settlement section when hash is #settlement
  useEffect(() => {
    if (location.hash === '#settlement' && settlementRef.current) {
      settlementRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location]);

  // Persist dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('medicineDarkMode', isDarkMode.toString());
    // Apply dark mode class to document root for global styling
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch dashboard summary
  useEffect(() => {
    const fetchDashboardSummary = async () => {
      if (!user) return;
      
      try {
        setSummaryLoading(true);
        const token = localStorage.getItem('medicineToken');
        
        let url = '/api/medicine/dashboard-summary';
        
        if (useDateFilter && startDate && endDate) {
          url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          setDashboardSummary(result.data);
        } else {
          console.error('Failed to fetch dashboard summary:', result.message);
        }
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setSummaryLoading(false);
      }
    };
    
    if (user) {
      fetchDashboardSummary();
    }
  }, [user, useDateFilter, startDate, endDate]);

  const handleLogout = () => {
    localStorage.removeItem('medicineToken');
    localStorage.removeItem('medicineInfo');
    navigate('/medicine');
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The useEffect will automatically refetch when startDate or endDate changes
  };

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDarkMode ? "bg-slate-950" : "bg-gray-50"
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
        "min-h-screen flex items-center justify-center",
        isDarkMode ? "bg-slate-950" : "bg-gray-50"
      )}>
        <div className="text-center">
          <AlertCircle className={cn(
            "h-8 w-8 mx-auto mb-4",
            isDarkMode ? "text-red-400" : "text-red-600"
          )} />
          <p className={isDarkMode ? "text-red-400" : "text-red-600 mb-4"}>{error}</p>
        </div>
      </div>
    );
  }

  const showSettlement = location.hash === '#settlement';

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-IN');
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format weight
  const formatWeight = (weight: number): string => {
    return `${weight.toLocaleString('en-IN', { maximumFractionDigits: 2 })} KG`;
  };

  // Get dynamic circle size class based on content length
  const getCircleSizeClass = (content: string): string => {
    const length = content.length;
    if (length <= 4) return 'w-20 h-20';
    if (length <= 6) return 'w-24 h-24';
    return 'w-28 h-28';
  };

  // Get dynamic text size class based on content length
  const getTextSizeClass = (content: string): string => {
    const length = content.length;
    if (length <= 4) return 'text-xl';
    if (length <= 6) return 'text-lg';
    return 'text-base';
  };

  return (
    <div className={cn(
      "flex h-screen w-screen overflow-hidden transition-colors",
      isDarkMode ? "bg-slate-950" : "bg-gray-100"
    )}>
      <MedicineSidebar 
        user={user} 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
      />
      <main className={cn(
        `${isSidebarCollapsed ? 'ml-16 w-[calc(100vw-4rem)]' : 'ml-80 w-[calc(100vw-20rem)]'} h-screen overflow-y-auto p-6 transition-all duration-300 ease-in-out`,
        isDarkMode ? "bg-slate-950" : "bg-gray-100"
      )}>
        <div className={cn(
          "rounded-2xl shadow-[0_20px_50px_rgba(16,24,40,0.08)] border p-6 min-h-[calc(100vh-3rem)] transition-colors",
          isDarkMode
            ? "bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border-slate-800/60"
            : "bg-white border-gray-100"
        )}>
          <div className="flex items-center justify-between mb-6">
            <h1 className={cn(
              "text-2xl font-bold",
              isDarkMode ? "text-slate-50" : "text-gray-800"
            )}>Medicine Dashboard</h1>
            
            {/* Dark Mode Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setIsDarkMode((prev) => !prev)}
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
          
          {/* Date Filter Section */}
          <div className={cn(
            "mb-6 p-4 rounded-lg border transition-colors",
            isDarkMode
              ? "bg-slate-800/50 border-slate-700/50"
              : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center mb-3">
              <Filter className={cn(
                "h-5 w-5 mr-2",
                isDarkMode ? "text-slate-300" : "text-gray-600"
              )} />
              <h3 className={cn(
                "text-lg font-medium",
                isDarkMode ? "text-slate-200" : "text-gray-800"
              )}>Filter by Date</h3>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useDateFilter"
                  checked={useDateFilter}
                  onChange={(e) => setUseDateFilter(e.target.checked)}
                  className={cn(
                    "h-4 w-4 text-blue-600 rounded focus:ring-blue-500",
                    isDarkMode ? "border-slate-600 bg-slate-700" : "border-gray-300"
                  )}
                />
                <label htmlFor="useDateFilter" className={cn(
                  "ml-2 text-sm",
                  isDarkMode ? "text-slate-300" : "text-gray-700"
                )}>
                  Enable Date Filter
                </label>
              </div>
              
              {useDateFilter && (
                <form onSubmit={handleFilterSubmit} className="flex items-center space-x-4">
                  <div>
                    <label htmlFor="startDate" className={cn(
                      "block text-sm font-medium mb-1",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={cn(
                        "border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                        isDarkMode
                          ? "border-slate-600 bg-slate-700 text-slate-200"
                          : "border-gray-300 bg-white"
                      )}
                      required={useDateFilter}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="endDate" className={cn(
                      "block text-sm font-medium mb-1",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={cn(
                        "border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                        isDarkMode
                          ? "border-slate-600 bg-slate-700 text-slate-200"
                          : "border-gray-300 bg-white"
                      )}
                      required={useDateFilter}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                        isDarkMode
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      )}
                    >
                      Apply Filter
                    </button>
                  </div>
                </form>
              )}
            </div>
            
            {useDateFilter && (!startDate || !endDate) && (
              <p className={cn(
                "mt-2 text-sm",
                isDarkMode ? "text-yellow-400" : "text-yellow-600"
              )}>
                Please select both start and end dates to apply the filter.
              </p>
            )}
          </div>
          
          {!showSettlement ? (
            <>
              {/* Dashboard Summary Cards */}
              {summaryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className={cn(
                    "h-8 w-8 animate-spin",
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  )} />
                  <span className={cn(
                    "ml-3",
                    isDarkMode ? "text-slate-300" : "text-gray-600"
                  )}>Loading summary...</span>
                </div>
              ) : dashboardSummary ? (
                <div className="space-y-8">
                  {/* Booking Summary - First Row */}
                  <div>
                    <h2 className={cn(
                      "text-lg font-semibold mb-4",
                      isDarkMode ? "text-slate-200" : "text-gray-800"
                    )}>Booking Summary {useDateFilter ? '(Filtered)' : ''}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 xl:grid-cols-7 gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.bookings.total))} rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mb-2`}>
                          <span className={`text-blue-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.bookings.total))}`}>{formatNumber(dashboardSummary.bookings.total)}</span>
                        </div>
                        <Package className="h-6 w-6 text-blue-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Total</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.bookings.booked))} rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mb-2`}>
                          <span className={`text-blue-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.bookings.booked))}`}>{formatNumber(dashboardSummary.bookings.booked)}</span>
                        </div>
                        <CheckCircle className="h-6 w-6 text-blue-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Booked</p>
                      </div>
                      

                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.bookings.inTransit))} rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center mb-2`}>
                          <span className={`text-purple-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.bookings.inTransit))}`}>{formatNumber(dashboardSummary.bookings.inTransit)}</span>
                        </div>
                        <Truck className="h-6 w-6 text-purple-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>In Transit</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.bookings.arrivedAtHub))} rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center mb-2`}>
                          <span className={`text-indigo-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.bookings.arrivedAtHub))}`}>{formatNumber(dashboardSummary.bookings.arrivedAtHub)}</span>
                        </div>
                        <Package className="h-6 w-6 text-indigo-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Arrived at Hub</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.bookings.readyToDispatch))} rounded-full bg-yellow-100 border border-yellow-200 flex items-center justify-center mb-2`}>
                          <span className={`text-yellow-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.bookings.readyToDispatch))}`}>{formatNumber(dashboardSummary.bookings.readyToDispatch)}</span>
                        </div>
                        <Clock className="h-6 w-6 text-yellow-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Ready to Dispatch</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.bookings.delivered))} rounded-full bg-green-100 border border-green-200 flex items-center justify-center mb-2`}>
                          <span className={`text-green-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.bookings.delivered))}`}>{formatNumber(dashboardSummary.bookings.delivered)}</span>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Delivered</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.bookings.cancelled))} rounded-full bg-red-100 border border-red-200 flex items-center justify-center mb-2`}>
                          <span className={`text-red-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.bookings.cancelled))}`}>{formatNumber(dashboardSummary.bookings.cancelled)}</span>
                        </div>
                        <AlertCircle className="h-6 w-6 text-red-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Cancelled</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Manifest Summary - Second Row */}
                  <div>
                    <h2 className={cn(
                      "text-lg font-semibold mb-4",
                      isDarkMode ? "text-slate-200" : "text-gray-800"
                    )}>Manifest Summary {useDateFilter ? '(Filtered)' : ''}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.manifests.total))} rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mb-2`}>
                          <span className={`text-blue-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.manifests.total))}`}>{formatNumber(dashboardSummary.manifests.total)}</span>
                        </div>
                        <FileText className="h-6 w-6 text-blue-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Total</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.manifests.submitted))} rounded-full bg-yellow-100 border border-yellow-200 flex items-center justify-center mb-2`}>
                          <span className={`text-yellow-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.manifests.submitted))}`}>{formatNumber(dashboardSummary.manifests.submitted)}</span>
                        </div>
                        <Clock className="h-6 w-6 text-yellow-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Submitted</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.manifests.dispatched))} rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center mb-2`}>
                          <span className={`text-purple-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.manifests.dispatched))}`}>{formatNumber(dashboardSummary.manifests.dispatched)}</span>
                        </div>
                        <Truck className="h-6 w-6 text-purple-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Dispatched</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.manifests.delivered))} rounded-full bg-green-100 border border-green-200 flex items-center justify-center mb-2`}>
                          <span className={`text-green-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.manifests.delivered))}`}>{formatNumber(dashboardSummary.manifests.delivered)}</span>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Delivered</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Settlement Summary - Third Row */}
                  <div>
                    <h2 className={cn(
                      "text-lg font-semibold mb-4",
                      isDarkMode ? "text-slate-200" : "text-gray-800"
                    )}>Settlement Summary {useDateFilter ? '(Filtered)' : ''}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.settlements.totalTransactions))} rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mb-2`}>
                          <span className={`text-blue-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.settlements.totalTransactions))}`}>{formatNumber(dashboardSummary.settlements.totalTransactions)}</span>
                        </div>
                        <CreditCard className="h-6 w-6 text-blue-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Transactions</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatWeight(dashboardSummary.settlements.totalWeight).replace(' KG', ''))} rounded-full bg-green-100 border border-green-200 flex items-center justify-center mb-2`}>
                          <span className={`text-green-900 font-bold ${getTextSizeClass(formatWeight(dashboardSummary.settlements.totalWeight).replace(' KG', ''))}`}>{formatWeight(dashboardSummary.settlements.totalWeight).replace(' KG', '')}</span>
                        </div>
                        <Weight className="h-6 w-6 text-green-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Weight (KG)</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatCurrency(dashboardSummary.settlements.oclCharge).replace('₹', ''))} rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center mb-2`}>
                          <span className={`text-purple-900 font-bold ${getTextSizeClass(formatCurrency(dashboardSummary.settlements.oclCharge).replace('₹', ''))}`}>{formatCurrency(dashboardSummary.settlements.oclCharge).replace('₹', '')}</span>
                        </div>
                        <Calendar className="h-6 w-6 text-purple-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>OCL Charge</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatCurrency(dashboardSummary.settlements.remainingBalance).replace('₹', ''))} rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center mb-2`}>
                          <span className={`text-orange-900 font-bold ${getTextSizeClass(formatCurrency(dashboardSummary.settlements.remainingBalance).replace('₹', ''))}`}>{formatCurrency(dashboardSummary.settlements.remainingBalance).replace('₹', '')}</span>
                        </div>
                        <Wallet className="h-6 w-6 text-orange-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Balance</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Summary - Fourth Row (Last) */}
                  <div>
                    <h2 className={cn(
                      "text-lg font-semibold mb-4",
                      isDarkMode ? "text-slate-200" : "text-gray-800"
                    )}>Payment Summary</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.payments.paid))} rounded-full bg-green-100 border border-green-200 flex items-center justify-center mb-2`}>
                          <span className={`text-green-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.payments.paid))}`}>{formatNumber(dashboardSummary.payments.paid)}</span>
                        </div>
                        <IndianRupee className="h-6 w-6 text-green-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Paid</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.payments.willPay))} rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mb-2`}>
                          <span className={`text-blue-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.payments.willPay))}`}>{formatNumber(dashboardSummary.payments.willPay)}</span>
                        </div>
                        <CreditCard className="h-6 w-6 text-blue-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Will Pay</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`${getCircleSizeClass(formatNumber(dashboardSummary.payments.notPaid))} rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-2`}>
                          <span className={`text-gray-900 font-bold ${getTextSizeClass(formatNumber(dashboardSummary.payments.notPaid))}`}>{formatNumber(dashboardSummary.payments.notPaid)}</span>
                        </div>
                        <AlertCircle className={cn(
                          "h-6 w-6 mb-1",
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        )} />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Not Paid</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* POD Summary - Fifth Row */}
                  <div>
                    <h2 className={cn(
                      "text-lg font-semibold mb-4",
                      isDarkMode ? "text-slate-200" : "text-gray-800"
                    )}>POD Summary</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mb-2">
                          <span className="text-blue-900 font-bold text-xl">0</span>
                        </div>
                        <CheckCircle className="h-6 w-6 text-blue-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Total Pod</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mb-2">
                          <span className="text-green-900 font-bold text-xl">0</span>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-600 mb-1" />
                        <p className={cn(
                          "text-sm text-center",
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        )}>Received Pod</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <AlertCircle className={cn(
                    "h-8 w-8",
                    isDarkMode ? "text-red-400" : "text-red-600"
                  )} />
                  <span className={cn(
                    "ml-3",
                    isDarkMode ? "text-red-400" : "text-red-600"
                  )}>Failed to load dashboard summary</span>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="mt-8">
                <h2 className={cn(
                  "text-xl font-semibold mb-4",
                  isDarkMode ? "text-slate-200" : "text-gray-800"
                )}>Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-colors",
                      isDarkMode
                        ? "bg-blue-900/30 border-blue-700/50 hover:bg-blue-900/40"
                        : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                    )}
                    onClick={() => navigate('/medicine/booking')}
                  >
                    <h3 className={cn(
                      "font-medium mb-2",
                      isDarkMode ? "text-blue-300" : "text-blue-800"
                    )}>New Booking</h3>
                    <p className={cn(
                      "text-sm",
                      isDarkMode ? "text-blue-200" : "text-blue-600"
                    )}>Create a new medicine shipment booking with our easy form.</p>
                  </div>
                  <div className={cn(
                    "border rounded-lg p-4",
                    isDarkMode
                      ? "bg-green-900/30 border-green-700/50"
                      : "bg-green-50 border-green-200"
                  )}>
                    <h3 className={cn(
                      "font-medium mb-2",
                      isDarkMode ? "text-green-300" : "text-green-800"
                    )}>Booking Guidelines</h3>
                    <div className={cn(
                      "text-sm",
                      isDarkMode ? "text-green-200" : "text-green-600"
                    )}>
                      <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>Use our platform to return expired medicine from retailers to companies</li>
                        <li>Only medicine items are allowed for shipping - no other items permitted</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div ref={settlementRef}>
              <Settlement />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MedicineDashboard;