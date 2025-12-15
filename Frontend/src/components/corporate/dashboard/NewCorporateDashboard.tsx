import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  DollarSign, 
  MessageSquare, 
  CheckCircle, 
  ArrowRight,
  HelpCircle,
  BookOpen,
  Phone,
  TrendingUp,
  MapPin,
  Clock,
  Shield,
  Building,
  Calendar,
  Truck,
  Sun,
  MoonStar
} from "lucide-react";
import BentoBox from './BentoBox';
import CompactMetric from './CompactMetric';
import CompactChecklist from './CompactChecklist';
import CompactRecentActivity from './CompactRecentActivity';
import NotificationSystem from './NotificationSystem';
import CourierRequestModal from '../CourierRequestModal';
import { cn } from '@/lib/utils';

interface NewCorporateDashboardProps {
  corporate: {
    companyName: string;
    corporateId: string;
    email: string;
    contactNumber: string;
    registrationDate: string;
    lastLogin: string;
    isActive: boolean;
    billingType?: string;
    manager?: string;
    billingCycle?: string;
  };
  onNavigateToTab: (tab: string) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const NewCorporateDashboard: React.FC<NewCorporateDashboardProps> = ({
  corporate,
  onNavigateToTab,
  isDarkMode = false,
  onToggleDarkMode
}) => {
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);

  const handleRequestCourier = () => {
    setIsCourierModalOpen(true);
  };

  // Sample data for new corporate
  const gettingStartedItems = [
    {
      id: '1',
      title: 'Complete Company Profile',
      completed: true,
      action: () => onNavigateToTab('profile')
    },
    {
      id: '2',
      title: 'Review Your Pricing Plan',
      completed: false,
      action: () => onNavigateToTab('pricing')
    },
    {
      id: '3',
      title: 'Create Your First Shipment',
      completed: false,
      action: () => onNavigateToTab('booking')
    },
    {
      id: '4',
      title: 'Set Up Billing Information',
      completed: false,
      action: () => onNavigateToTab('settlement')
    }
  ];

  const notifications = [
    {
      id: '1',
      title: 'Welcome to OCL Corporate Portal',
      message: 'Your corporate account has been successfully activated.',
      type: 'success' as const,
      date: 'Today',
      isRead: false,
      priority: 'high' as const
    },
    {
      id: '2',
      title: 'Getting Started Guide',
      message: 'Check out our comprehensive guide to help you get started.',
      type: 'info' as const,
      date: 'Today',
      isRead: false,
      priority: 'medium' as const
    }
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'shipment' as const,
      title: 'Account Activated',
      description: 'Your corporate account is now ready',
      status: 'completed',
      time: '2 hours ago'
    },
    {
      id: '2',
      type: 'delivery' as const,
      title: 'Profile Setup',
      description: 'Company profile completed',
      status: 'completed',
      time: '1 hour ago'
    }
  ];

  const handleMarkAsRead = (id: string) => {
    // Handle marking notification as read
    console.log('Mark as read:', id);
  };

  const handleMarkAllAsRead = () => {
    // Handle marking all notifications as read
    console.log('Mark all as read');
  };

  return (
    <div className="h-full overflow-hidden">
      {/* Header with Notifications */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={cn(
            "text-2xl font-bold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Welcome, {corporate.companyName}!
          </h1>
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-slate-300" : "text-gray-600"
          )}>Your corporate account is active and ready</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
          <NotificationSystem
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            isDarkMode={isDarkMode}
          />
          {onToggleDarkMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDarkMode}
              className={cn(
                "flex items-center gap-2 rounded-full border transition",
                isDarkMode
                  ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                  : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
              )}
            >
              {isDarkMode ? (
                <>
                  <Sun size={14} />
                  <span className="text-xs font-medium">Light mode</span>
                </>
              ) : (
                <>
                  <MoonStar size={14} />
                  <span className="text-xs font-medium">Dark mode</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Bento Box Grid - 6x4 Grid */}
      <div className="grid grid-cols-6 grid-rows-4 gap-2 h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide scroll-smooth">
        {/* Row 1: Quick Actions (2x2) + Getting Started (2x1) + Account Info (1x1) + Help Support (1x1) */}
        <BentoBox title="Quick Actions" icon={Package} size="large" isDarkMode={isDarkMode}>
          <div className="space-y-3">
            <Button 
              className="w-full justify-start bg-blue-600 hover:bg-blue-700" 
              onClick={() => onNavigateToTab('booking')}
            >
              <Package className="h-4 w-4 mr-2" />
              Create First Shipment
            </Button>
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-start",
                isDarkMode && "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
              )}
              onClick={() => onNavigateToTab('pricing')}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              View Pricing & Zones
            </Button>
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-start",
                isDarkMode && "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
              )}
              onClick={() => onNavigateToTab('complaints')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-start",
                isDarkMode && "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
              )}
              onClick={() => onNavigateToTab('courier-complaints')}
            >
              <Truck className="h-4 w-4 mr-2" />
              Courier Complaints
            </Button>
          </div>
        </BentoBox>

        <BentoBox title="Getting Started" icon={CheckCircle} size="medium" isDarkMode={isDarkMode}>
          <CompactChecklist
            title="Setup Progress"
            items={gettingStartedItems}
          />
        </BentoBox>

        <BentoBox title="Account Info" icon={Shield} size="small" isDarkMode={isDarkMode}>
          <div className="space-y-2">
            <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Corporate ID</div>
            <div className={cn("text-sm font-mono font-medium", isDarkMode ? "text-slate-200" : "text-gray-900")}>{corporate.corporateId}</div>
            <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Billing Type</div>
            <div className={cn("text-sm", isDarkMode ? "text-slate-200" : "text-gray-900")}>{corporate.billingType || 'Monthly'}</div>
          </div>
        </BentoBox>

        <BentoBox title="Help & Support" icon={HelpCircle} size="small" isDarkMode={isDarkMode}>
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "w-full justify-start h-8 text-xs",
                isDarkMode && "text-slate-300 hover:bg-slate-800/60"
              )}
            >
              <BookOpen className="h-3 w-3 mr-2" />
              User Guide
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "w-full justify-start h-8 text-xs",
                isDarkMode && "text-slate-300 hover:bg-slate-800/60"
              )}
            >
              <HelpCircle className="h-3 w-3 mr-2" />
              FAQs
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "w-full justify-start h-8 text-xs",
                isDarkMode && "text-slate-300 hover:bg-slate-800/60"
              )}
            >
              <Phone className="h-3 w-3 mr-2" />
              Contact
            </Button>
          </div>
        </BentoBox>

        {/* Row 2: Recent Activity (2x1) + Company Details (2x1) + Quick Tips (2x1) */}
        <BentoBox title="Recent Activity" icon={Clock} size="medium" isDarkMode={isDarkMode}>
          <CompactRecentActivity
            title="Activity Feed"
            items={recentActivity}
          />
        </BentoBox>

        <BentoBox title="Company Details" icon={Building} size="medium" isDarkMode={isDarkMode}>
          <div className="space-y-3">
            <div>
              <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Company Name</div>
              <div className={cn("text-sm font-medium", isDarkMode ? "text-slate-200" : "text-gray-900")}>{corporate.companyName}</div>
            </div>
            <div>
              <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Email</div>
              <div className={cn("text-sm", isDarkMode ? "text-slate-200" : "text-gray-900")}>{corporate.email}</div>
            </div>
            <div>
              <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Contact</div>
              <div className={cn("text-sm", isDarkMode ? "text-slate-200" : "text-gray-900")}>{corporate.contactNumber}</div>
            </div>
            <div>
              <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Manager</div>
              <div className={cn("text-sm", isDarkMode ? "text-slate-200" : "text-gray-900")}>{corporate.manager || 'Not Assigned'}</div>
            </div>
            <div>
              <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>Last Login</div>
              <div className={cn("text-sm", isDarkMode ? "text-slate-200" : "text-gray-900")}>{new Date(corporate.lastLogin).toLocaleDateString()}</div>
            </div>
          </div>
        </BentoBox>

        <BentoBox title="Quick Tips" icon={ArrowRight} size="medium" isDarkMode={isDarkMode}>
          <div className="space-y-2">
            <div className={cn(
              "text-xs p-2 rounded shadow-sm",
              isDarkMode
                ? "text-blue-300 bg-blue-900/30"
                : "text-blue-600 bg-blue-50"
            )}>
              Complete your profile to unlock all features
            </div>
            <div className={cn(
              "text-xs p-2 rounded shadow-sm",
              isDarkMode
                ? "text-green-300 bg-green-900/30"
                : "text-green-600 bg-green-50"
            )}>
              Your corporate rates are pre-configured
            </div>
            <div className={cn(
              "text-xs p-2 rounded shadow-sm",
              isDarkMode
                ? "text-purple-300 bg-purple-900/30"
                : "text-purple-600 bg-purple-50"
            )}>
              Start with a test shipment to get familiar
            </div>
          </div>
        </BentoBox>

        {/* Row 3: Request Courier (2x1) + Analytics Preview (4x1) */}
        <BentoBox title="Quick Actions" icon={Truck} size="medium" isDarkMode={isDarkMode}>
          <div className="space-y-3">
            <Button
              onClick={() => handleRequestCourier()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Truck className="h-4 w-4 mr-2" />
              Request a Courier
            </Button>
            <div className={cn(
              "text-xs text-center",
              isDarkMode ? "text-slate-400" : "text-gray-500"
            )}>
              Need a courier boy for pickup? Click to request one.
            </div>
          </div>
        </BentoBox>

        <BentoBox title="Analytics Preview" icon={TrendingUp} size="large" isDarkMode={isDarkMode}>
          <div className="grid grid-cols-4 gap-3">
            <div className={cn(
              "text-center p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200",
              isDarkMode ? "bg-slate-700/50" : "bg-gray-50/50"
            )}>
              <div className={cn(
                "text-xl font-bold",
                isDarkMode ? "text-slate-400" : "text-gray-400"
              )}>0</div>
              <div className={cn(
                "text-xs",
                isDarkMode ? "text-slate-400" : "text-gray-500"
              )}>Total Shipments</div>
            </div>
            <div className={cn(
              "text-center p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200",
              isDarkMode ? "bg-slate-700/50" : "bg-gray-50/50"
            )}>
              <div className={cn(
                "text-xl font-bold",
                isDarkMode ? "text-slate-400" : "text-gray-400"
              )}>₹0</div>
              <div className={cn(
                "text-xs",
                isDarkMode ? "text-slate-400" : "text-gray-500"
              )}>Total Spent</div>
            </div>
            <div className={cn(
              "text-center p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200",
              isDarkMode ? "bg-slate-700/50" : "bg-gray-50/50"
            )}>
              <div className={cn(
                "text-xl font-bold",
                isDarkMode ? "text-slate-400" : "text-gray-400"
              )}>0%</div>
              <div className={cn(
                "text-xs",
                isDarkMode ? "text-slate-400" : "text-gray-500"
              )}>Success Rate</div>
            </div>
            <div className={cn(
              "text-center p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200",
              isDarkMode ? "bg-slate-700/50" : "bg-gray-50/50"
            )}>
              <div className={cn(
                "text-xl font-bold",
                isDarkMode ? "text-slate-400" : "text-gray-400"
              )}>0</div>
              <div className={cn(
                "text-xs",
                isDarkMode ? "text-slate-400" : "text-gray-500"
              )}>Active Routes</div>
            </div>
          </div>
          <div className="mt-3 text-center">
            <span className={cn(
              "text-xs px-3 py-1 rounded-full shadow-sm",
              isDarkMode
                ? "text-slate-400 bg-slate-800/50"
                : "text-gray-400 bg-gray-100/50"
            )}>
              📊 Analytics data will appear after your first shipment
            </span>
          </div>
        </BentoBox>
      </div>

      {/* Courier Request Modal */}
      <CourierRequestModal
        isOpen={isCourierModalOpen}
        onClose={() => setIsCourierModalOpen(false)}
        corporateName={corporate.companyName}
        corporateContact={corporate.contactNumber}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default NewCorporateDashboard;
