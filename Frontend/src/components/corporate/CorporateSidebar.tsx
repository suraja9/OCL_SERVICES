import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  DollarSign,
  LogOut,
  X,
  Menu,
  MessageSquare,
  Calendar,
  Truck,
  Receipt,
  User,
  HelpCircle,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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

interface CorporateSidebarProps {
  corporate: CorporateInfo | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
  isDarkMode?: boolean;
}

const CorporateSidebar: React.FC<CorporateSidebarProps> = ({
  corporate,
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  onLogout,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen,
  isDarkMode = false,
}) => {
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (isMobile && setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // Reusable Sidebar Content Component
  // On mobile, always show full content (not collapsed)
  const showCollapsed = isMobile ? false : isSidebarCollapsed;
  
  const sidebarBackground = isDarkMode
    ? "bg-slate-900/80 border-slate-800/60"
    : "bg-white/90 border-slate-200/60";
  const sidebarTextMuted = isDarkMode ? "text-slate-300/80" : "text-slate-500";
  
  const SidebarContent = () => (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div className={cn(showCollapsed ? 'p-3' : 'p-5')}>
        {/* Button area - dedicated space for cross/expand buttons */}
        {!isMobile && (
          <div className={cn('flex', showCollapsed ? 'justify-center' : 'justify-end', 'mb-4')}>
            <button
              onClick={toggleSidebar}
              className={cn(
                "p-1 rounded-lg transition-colors",
                isDarkMode
                  ? "hover:bg-slate-800/60 text-slate-300"
                  : "hover:bg-gray-100 text-gray-600"
              )}
              title={showCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            >
              {showCollapsed ? (
                <Menu className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </button>
          </div>
        )}

          {/* Corporate logo section - big, centered, circular */}
          {!showCollapsed && (
            <div className="flex flex-col items-center justify-center mb-6">
              <div className={cn(
                "p-6 rounded-full w-[120px] h-[120px] flex items-center justify-center transition",
                isDarkMode
                  ? "bg-slate-800/60"
                  : "bg-white"
              )}>
                {corporate?.logo ? (
                  <img 
                    src={corporate.logo} 
                    alt={`${corporate.companyName} Logo`}
                    className="h-16 w-16 object-contain"
                  />
                ) : null}
              </div>
              {corporate?.companyName && (
                <p className={cn(
                  "text-sm font-semibold mt-3 text-center",
                  isDarkMode ? "text-slate-200" : "text-gray-800"
                )}>
                  {corporate.companyName}
                </p>
              )}
            </div>
          )}

          <nav className={cn(showCollapsed ? 'space-y-1' : 'space-y-1')}>
          {/* 1. Dashboard */}
          <button
            onClick={() => handleTabClick('dashboard')}
            className={cn(
              "group w-full rounded-xl border px-2 py-1.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              showCollapsed && "flex justify-center px-1.5 py-1.5",
              isDarkMode
                ? "border-transparent hover:border-blue-500/20 hover:bg-blue-500/5"
                : "border-transparent hover:border-blue-400/25 hover:bg-blue-400/10",
              activeTab === 'dashboard'
                ? isDarkMode
                  ? "border-blue-500/40 bg-blue-500/15 text-white"
                  : "border-blue-400/40 bg-[#EFF6FF] text-blue-800"
                : isDarkMode
                ? "text-slate-300"
                : "text-slate-600"
            )}
            title={showCollapsed ? "Dashboard" : ""}
          >
            <div className={cn("flex items-center", showCollapsed ? "justify-center" : "gap-2")}>
              <BarChart3 className={cn(
                "h-4 w-4 transition",
                activeTab === 'dashboard' 
                  ? (isDarkMode ? "text-blue-200" : "text-blue-600")
                  : (isDarkMode ? "text-slate-200" : "text-slate-500")
              )} />
              {!showCollapsed && <span className="block text-sm font-medium text-inherit">Dashboard</span>}
            </div>
          </button>

          {/* 2. Booking */}
          <button
            onClick={() => handleTabClick('booking')}
            className={cn(
              "group w-full rounded-xl border px-2 py-1.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              showCollapsed && "flex justify-center px-1.5 py-1.5",
              isDarkMode
                ? "border-transparent hover:border-blue-500/20 hover:bg-blue-500/5"
                : "border-transparent hover:border-blue-400/25 hover:bg-blue-400/10",
              activeTab === 'booking'
                ? isDarkMode
                  ? "border-blue-500/40 bg-blue-500/15 text-white"
                  : "border-blue-400/40 bg-[#EFF6FF] text-blue-800"
                : isDarkMode
                ? "text-slate-300"
                : "text-slate-600"
            )}
            title={showCollapsed ? "Booking" : ""}
          >
            <div className={cn("flex items-center", showCollapsed ? "justify-center" : "gap-2")}>
              <Calendar className={cn(
                "h-4 w-4 transition",
                activeTab === 'booking' 
                  ? (isDarkMode ? "text-blue-200" : "text-blue-600")
                  : (isDarkMode ? "text-slate-200" : "text-slate-500")
              )} />
              {!showCollapsed && <span className="block text-sm font-medium text-inherit">Booking</span>}
            </div>
          </button>

          {/* 3. Shipments */}
          <button
            onClick={() => handleTabClick('shipments')}
            className={cn(
              "group w-full rounded-xl border px-2 py-1.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              showCollapsed && "flex justify-center px-1.5 py-1.5",
              isDarkMode
                ? "border-transparent hover:border-blue-500/20 hover:bg-blue-500/5"
                : "border-transparent hover:border-blue-400/25 hover:bg-blue-400/10",
              activeTab === 'shipments'
                ? isDarkMode
                  ? "border-blue-500/40 bg-blue-500/15 text-white"
                  : "border-blue-400/40 bg-[#EFF6FF] text-blue-800"
                : isDarkMode
                ? "text-slate-300"
                : "text-slate-600"
            )}
            title={showCollapsed ? "Shipments" : ""}
          >
            <div className={cn("flex items-center", showCollapsed ? "justify-center" : "gap-2")}>
              <Truck className={cn(
                "h-4 w-4 transition",
                activeTab === 'shipments' 
                  ? (isDarkMode ? "text-blue-200" : "text-blue-600")
                  : (isDarkMode ? "text-slate-200" : "text-slate-500")
              )} />
              {!showCollapsed && <span className="block text-sm font-medium text-inherit">Shipments</span>}
            </div>
          </button>

          {/* 3.5. Tracking */}
          <button
            onClick={() => handleTabClick('tracking')}
            className={cn(
              "group w-full rounded-xl border px-2 py-1.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              showCollapsed && "flex justify-center px-1.5 py-1.5",
              isDarkMode
                ? "border-transparent hover:border-blue-500/20 hover:bg-blue-500/5"
                : "border-transparent hover:border-blue-400/25 hover:bg-blue-400/10",
              activeTab === 'tracking'
                ? isDarkMode
                  ? "border-blue-500/40 bg-blue-500/15 text-white"
                  : "border-blue-400/40 bg-[#EFF6FF] text-blue-800"
                : isDarkMode
                ? "text-slate-300"
                : "text-slate-600"
            )}
            title={showCollapsed ? "Tracking" : ""}
          >
            <div className={cn("flex items-center", showCollapsed ? "justify-center" : "gap-2")}>
              <MapPin className={cn(
                "h-4 w-4 transition",
                activeTab === 'tracking' 
                  ? (isDarkMode ? "text-blue-200" : "text-blue-600")
                  : (isDarkMode ? "text-slate-200" : "text-slate-500")
              )} />
              {!showCollapsed && <span className="block text-sm font-medium text-inherit">Tracking</span>}
            </div>
          </button>

          {/* 4. Settlement */}
          <button
            onClick={() => handleTabClick('settlement')}
            className={cn(
              "group w-full rounded-xl border px-2 py-1.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              showCollapsed && "flex justify-center px-1.5 py-1.5",
              isDarkMode
                ? "border-transparent hover:border-blue-500/20 hover:bg-blue-500/5"
                : "border-transparent hover:border-blue-400/25 hover:bg-blue-400/10",
              activeTab === 'settlement'
                ? isDarkMode
                  ? "border-blue-500/40 bg-blue-500/15 text-white"
                  : "border-blue-400/40 bg-[#EFF6FF] text-blue-800"
                : isDarkMode
                ? "text-slate-300"
                : "text-slate-600"
            )}
            title={showCollapsed ? "Settlement" : ""}
          >
            <div className={cn("flex items-center", showCollapsed ? "justify-center" : "gap-2")}>
              <Receipt className={cn(
                "h-4 w-4 transition",
                activeTab === 'settlement' 
                  ? (isDarkMode ? "text-blue-200" : "text-blue-600")
                  : (isDarkMode ? "text-slate-200" : "text-slate-500")
              )} />
              {!showCollapsed && <span className="block text-sm font-medium text-inherit">Settlement</span>}
            </div>
          </button>

          {/* 5. Pricing */}
          <button
            onClick={() => handleTabClick('pricing')}
            className={cn(
              "group w-full rounded-xl border px-2 py-1.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              showCollapsed && "flex justify-center px-1.5 py-1.5",
              isDarkMode
                ? "border-transparent hover:border-blue-500/20 hover:bg-blue-500/5"
                : "border-transparent hover:border-blue-400/25 hover:bg-blue-400/10",
              activeTab === 'pricing'
                ? isDarkMode
                  ? "border-blue-500/40 bg-blue-500/15 text-white"
                  : "border-blue-400/40 bg-[#EFF6FF] text-blue-800"
                : isDarkMode
                ? "text-slate-300"
                : "text-slate-600"
            )}
            title={showCollapsed ? "Pricing" : ""}
          >
            <div className={cn("flex items-center", showCollapsed ? "justify-center" : "gap-2")}>
              <DollarSign className={cn(
                "h-4 w-4 transition",
                activeTab === 'pricing' 
                  ? (isDarkMode ? "text-blue-200" : "text-blue-600")
                  : (isDarkMode ? "text-slate-200" : "text-slate-500")
              )} />
              {!showCollapsed && <span className="block text-sm font-medium text-inherit">Pricing</span>}
            </div>
          </button>

          {/* 6. Complaint Desk */}
          <button
            onClick={() => handleTabClick('complaints')}
            className={cn(
              "group w-full rounded-xl border px-2 py-1.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              showCollapsed && "flex justify-center px-1.5 py-1.5",
              isDarkMode
                ? "border-transparent hover:border-blue-500/20 hover:bg-blue-500/5"
                : "border-transparent hover:border-blue-400/25 hover:bg-blue-400/10",
              activeTab === 'complaints'
                ? isDarkMode
                  ? "border-blue-500/40 bg-blue-500/15 text-white"
                  : "border-blue-400/40 bg-[#EFF6FF] text-blue-800"
                : isDarkMode
                ? "text-slate-300"
                : "text-slate-600"
            )}
            title={showCollapsed ? "Complaint Desk" : ""}
          >
            <div className={cn("flex items-center", showCollapsed ? "justify-center" : "gap-2")}>
              <MessageSquare className={cn(
                "h-4 w-4 transition",
                activeTab === 'complaints' 
                  ? (isDarkMode ? "text-blue-200" : "text-blue-600")
                  : (isDarkMode ? "text-slate-200" : "text-slate-500")
              )} />
              {!showCollapsed && <span className="block text-sm font-medium text-inherit">Complaint Desk</span>}
            </div>
          </button>

          {/* 7. Help & Resources */}
          {/* <button
            onClick={() => handleTabClick('help')}
            className={cn(
              "group w-full rounded-xl border px-3 py-2 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              showCollapsed && "flex justify-center px-2 py-2",
              isDarkMode
                ? "border-transparent hover:border-blue-500/20 hover:bg-blue-500/5"
                : "border-transparent hover:border-blue-400/25 hover:bg-blue-400/10",
              activeTab === 'help'
                ? isDarkMode
                  ? "border-blue-500/40 bg-blue-500/15 text-white shadow-[0_12px_35px_rgba(37,99,235,0.18)]"
                  : "border-blue-400/40 bg-blue-400/15 text-blue-800 shadow-[0_18px_45px_rgba(59,130,246,0.18)]"
                : isDarkMode
                ? "text-slate-300"
                : "text-slate-600"
            )}
            title={showCollapsed ? "Help & Resources" : ""}
          >
            <div className={cn("flex items-center", showCollapsed ? "justify-center" : "gap-2")}>
              <span className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition",
                isDarkMode
                  ? "bg-slate-800/60 text-slate-200 group-hover:bg-blue-500/20"
                  : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600",
                activeTab === 'help' && (isDarkMode ? "bg-blue-500/20 text-blue-200" : "bg-blue-100 text-blue-600")
              )}>
                <HelpCircle className="h-4 w-4" />
              </span>
              {!showCollapsed && <span className="block text-sm font-medium text-inherit">Help & Resources</span>}
            </div>
          </button> */}

          {/* 8. Courier Complaints */}
          <button
            onClick={() => handleTabClick('courier-complaints')}
            className={cn(
              "group w-full rounded-xl border px-2 py-1.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              showCollapsed && "flex justify-center px-1.5 py-1.5",
              isDarkMode
                ? "border-transparent hover:border-blue-500/20 hover:bg-blue-500/5"
                : "border-transparent hover:border-blue-400/25 hover:bg-blue-400/10",
              activeTab === 'courier-complaints'
                ? isDarkMode
                  ? "border-blue-500/40 bg-blue-500/15 text-white"
                  : "border-blue-400/40 bg-[#EFF6FF] text-blue-800"
                : isDarkMode
                ? "text-slate-300"
                : "text-slate-600"
            )}
            title={showCollapsed ? "Courier Complaints" : ""}
          >
            <div className={cn("flex items-center", showCollapsed ? "justify-center" : "gap-2")}>
              <AlertTriangle className={cn(
                "h-4 w-4 transition",
                activeTab === 'courier-complaints' 
                  ? (isDarkMode ? "text-blue-200" : "text-blue-600")
                  : (isDarkMode ? "text-slate-200" : "text-slate-500")
              )} />
              {!showCollapsed && <span className="block text-sm font-medium text-inherit">Courier Complaints</span>}
            </div>
          </button>

          {/* 9. Company Profile */}
          <button
            onClick={() => handleTabClick('profile')}
            className={cn(
              "group w-full rounded-xl border px-2 py-1.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              showCollapsed && "flex justify-center px-1.5 py-1.5",
              isDarkMode
                ? "border-transparent hover:border-blue-500/20 hover:bg-blue-500/5"
                : "border-transparent hover:border-blue-400/25 hover:bg-blue-400/10",
              activeTab === 'profile'
                ? isDarkMode
                  ? "border-blue-500/40 bg-blue-500/15 text-white"
                  : "border-blue-400/40 bg-[#EFF6FF] text-blue-800"
                : isDarkMode
                ? "text-slate-300"
                : "text-slate-600"
            )}
            title={showCollapsed ? "Company Profile" : ""}
          >
            <div className={cn("flex items-center", showCollapsed ? "justify-center" : "gap-2")}>
              <User className={cn(
                "h-4 w-4 transition",
                activeTab === 'profile' 
                  ? (isDarkMode ? "text-blue-200" : "text-blue-600")
                  : (isDarkMode ? "text-slate-200" : "text-slate-500")
              )} />
              {!showCollapsed && <span className="block text-sm font-medium text-inherit">Company Profile</span>}
            </div>
          </button>
        </nav>
        </div>
      </div>

      {/* Footer - Corporate info - Fixed at bottom */}
      <div className={cn(
        showCollapsed ? 'p-2' : 'p-5',
        'border-t flex-shrink-0 rounded-b-2xl transition',
        isDarkMode
          ? "border-slate-800/50 bg-slate-900/80"
          : "border-gray-100 bg-gray-50"
      )}>
        {!showCollapsed ? (
          <>
            <div className="text-center mb-3">
              <p className={cn(
                "text-sm font-semibold",
                isDarkMode ? "text-slate-200" : "text-gray-800"
              )}>{corporate?.companyName}</p>
              <p className={cn(
                "text-xs",
                sidebarTextMuted
              )}>{corporate?.email}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1",
                  isDarkMode
                    ? "border-slate-700 bg-slate-800/60 text-slate-200"
                    : ""
                )}
              >
                {corporate?.corporateId}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "py-0.5 px-4 w-full bg-red-500 text-white border-red-500/20 shadow-md h-8",
                  isDarkMode
                    ? "bg-red-500 text-white border-red-500/20"
                    : "bg-red-500 text-white border-red-500/20"
                )}
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                <span className="text-sm">Logout</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "p-1 bg-red-500 text-white border-red-500/20 shadow-md h-8 w-8",
                isDarkMode
                  ? "bg-red-500 text-white border-red-500/20"
                  : "bg-red-500 text-white border-red-500/20"
              )}
              onClick={onLogout}
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside
        className={cn(
          'h-screen fixed left-0 top-0 flex flex-col justify-between rounded-r-2xl shadow-[0_10px_30px_rgba(16,24,40,0.08)] z-20 transition-all duration-500 ease-in-out backdrop-blur-xl',
          sidebarBackground,
          isSidebarCollapsed ? 'w-16' : 'w-64',
          'hidden lg:flex'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar - Sheet Drawer */}
      {isMobile && setIsMobileMenuOpen && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent
            side="left"
            className={cn(
              "w-[85vw] max-w-sm p-0 backdrop-blur-xl",
              sidebarBackground
            )}
          >
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

export default CorporateSidebar;
