import React from 'react';
import { LogOut, LayoutGrid, Package, BarChart3, X, Menu, Truck, ClipboardList, Send, CheckCircle, Warehouse, FileText, Calculator, UserPlus } from "lucide-react";
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import oclLogo from "@/assets/ocl-logo.png";

interface MedicineSidebarProps {
  user: { id?: string; name: string; email: string } | null;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  isDarkMode?: boolean;
}

const MedicineSidebar: React.FC<MedicineSidebarProps> = ({ 
  user, 
  isSidebarCollapsed, 
  setIsSidebarCollapsed, 
  onLogout,
  isDarkMode = false
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const sidebarBackground = isDarkMode
    ? "bg-slate-900/80 border-slate-800/60"
    : "bg-white/90 border-slate-200/60";
  const sidebarTextMuted = isDarkMode ? "text-slate-300/80" : "text-slate-500";

  // Navigation items configuration
  const navItems = [
    { path: '/medicine/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/medicine/booking', icon: Package, label: 'Booking' },
    { path: '/medicine/shipment', icon: Truck, label: 'Shipments' },
    { path: '/medicine/received-scan', icon: CheckCircle, label: 'Arrived at Hub Scan' },
    { path: '/medicine/consignment', icon: ClipboardList, label: 'Consignment' },
    { path: '/medicine/dispatch-consignment', icon: Send, label: 'Scan For Dispatch' },
    { path: '/medicine/manifest', icon: ClipboardList, label: 'Ready to Dispatch' },
    { path: '/medicine/coloader', icon: Warehouse, label: 'Coloader' },
    { path: '/medicine/coloader-registration', icon: UserPlus, label: 'Coloader Registration' },
    { path: '/medicine/view-manifest', icon: FileText, label: 'View Manifest' },
    { path: '/medicine/view-settlement', icon: Calculator, label: 'Settlement' },
  ];

  return (
    <aside className={cn(
      `${isSidebarCollapsed ? 'w-16' : 'w-64'} h-screen fixed left-0 top-0 flex flex-col justify-between border-r backdrop-blur-xl transition-all duration-500 z-20`,
      sidebarBackground,
      isDarkMode ? "border-slate-800" : "border-slate-200"
    )}>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className={cn(isSidebarCollapsed ? 'p-3' : 'p-5')}>
            {/* Collapse/Expand Button - Above Logo */}
            <div className={cn("flex", isSidebarCollapsed ? "justify-center" : "justify-end", "mb-4")}>
              <button
                onClick={toggleSidebar}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  isDarkMode
                    ? "hover:bg-slate-800/60 text-slate-300"
                    : "hover:bg-gray-100 text-gray-600"
                )}
                title={isSidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
              >
                {isSidebarCollapsed ? (
                  <Menu className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Company Logo */}
            {!isSidebarCollapsed && (
              <div className="flex justify-center mb-6">
                <Link to="/" aria-label="Go to homepage" className="inline-flex">
                  <img 
                    src={oclLogo} 
                    alt="OCL Logo" 
                    className="h-16 w-24 object-contain"
                  />
                </Link>
              </div>
            )}
          
            {/* Navigation Section */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "group w-full rounded-lg border px-3 py-2 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      isSidebarCollapsed && "flex justify-center px-2 py-2",
                      isDarkMode
                        ? "border-transparent hover:border-blue-500/20 hover:bg-blue-500/5"
                        : "border-transparent hover:border-blue-400/25 hover:bg-blue-400/10",
                      active
                        ? isDarkMode
                          ? "border-blue-500/40 bg-blue-500/15 text-blue-300"
                          : "border-blue-400/40 bg-blue-400/15 text-blue-800"
                        : isDarkMode
                        ? "text-slate-300"
                        : "text-slate-600"
                    )}
                    title={isSidebarCollapsed ? item.label : ""}
                  >
                    <div className={cn("flex items-center", isSidebarCollapsed ? "justify-center" : "gap-3")}>
                      <Icon 
                        size={18} 
                        className={cn(
                          "transition",
                          isDarkMode
                            ? "text-slate-400 group-hover:text-blue-300"
                            : "text-slate-500 group-hover:text-blue-600",
                          active && (isDarkMode ? "text-blue-300" : "text-blue-600")
                        )}
                      />
                      {!isSidebarCollapsed && (
                        <span className="block text-sm font-medium text-inherit">
                          {item.label}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      
        {/* Footer - User info - Fixed at bottom */}
        <div className={cn(
          isSidebarCollapsed ? 'p-2' : 'p-5',
          'border-t flex-shrink-0 transition',
          isDarkMode
            ? "border-slate-800/50 bg-slate-900/80"
            : "border-gray-100 bg-gray-50"
        )}>
          {!isSidebarCollapsed ? (
            <>
              <div className="text-center mb-3">
                <p className={cn(
                  "text-sm font-semibold",
                  isDarkMode ? "text-slate-200" : "text-gray-800"
                )}>{user?.name || 'User'}</p>
                <p className={cn(
                  "text-xs",
                  sidebarTextMuted
                )}>{user?.email || ''}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                {user?.id && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1",
                      isDarkMode
                        ? "border-slate-700 bg-slate-800/60 text-slate-200"
                        : ""
                    )}
                  >
                    {user.id}
                  </Badge>
                )}
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
    </aside>
  );
};

export default MedicineSidebar;