import React from 'react';
import { Package, Truck, CheckCircle, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecentActivityItem {
  id: string;
  type: 'shipment' | 'delivery' | 'payment' | 'complaint';
  title: string;
  description: string;
  status: string;
  time: string;
}

interface CompactRecentActivityProps {
  title: string;
  items: RecentActivityItem[];
  onViewAll?: () => void;
  isDarkMode?: boolean;
}

const CompactRecentActivity: React.FC<CompactRecentActivityProps> = ({
  title,
  items,
  onViewAll,
  isDarkMode = false
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'shipment':
        return <Package className={cn("h-3 w-3", isDarkMode ? "text-blue-400" : "text-blue-600")} />;
      case 'delivery':
        return <Truck className={cn("h-3 w-3", isDarkMode ? "text-green-400" : "text-green-600")} />;
      case 'payment':
        return <CheckCircle className={cn("h-3 w-3", isDarkMode ? "text-purple-400" : "text-purple-600")} />;
      case 'complaint':
        return <Clock className={cn("h-3 w-3", isDarkMode ? "text-orange-400" : "text-orange-600")} />;
      default:
        return <Package className={cn("h-3 w-3", isDarkMode ? "text-slate-400" : "text-gray-600")} />;
    }
  };

  const getStatusColor = (status: string) => {
    if (isDarkMode) {
      switch (status.toLowerCase()) {
        case 'delivered':
        case 'completed':
          return 'bg-green-900/30 text-green-300';
        case 'in transit':
        case 'processing':
          return 'bg-blue-900/30 text-blue-300';
        case 'booked':
          return 'bg-purple-900/30 text-purple-300';
        case 'pending':
          return 'bg-yellow-900/30 text-yellow-300';
        case 'failed':
        case 'cancelled':
          return 'bg-red-900/30 text-red-300';
        default:
          return 'bg-slate-700/50 text-slate-300';
      }
    } else {
      switch (status.toLowerCase()) {
        case 'delivered':
        case 'completed':
          return 'bg-green-100 text-green-800';
        case 'in transit':
        case 'processing':
          return 'bg-blue-100 text-blue-800';
        case 'booked':
          return 'bg-purple-100 text-purple-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'failed':
        case 'cancelled':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-medium", isDarkMode ? "text-slate-300" : "text-gray-700")}>{title}</span>
        {onViewAll && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onViewAll}
            className={cn(
              "h-5 px-2 text-xs",
              isDarkMode && "text-slate-300 hover:bg-slate-800/60"
            )}
          >
            <Eye className="h-3 w-3 mr-1" />
            View All
          </Button>
        )}
      </div>

      {/* Activity items */}
      <div className="space-y-1">
        {items.length === 0 ? (
          <div className="text-center py-4">
            <Package className={cn("h-6 w-6 mx-auto mb-1", isDarkMode ? "text-slate-500" : "text-gray-400")} />
            <p className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>No recent activity</p>
          </div>
        ) : (
          items.slice(0, 4).map((item) => (
            <div key={item.id} className={cn(
              "flex items-center space-x-2 p-1.5 rounded shadow-sm hover:shadow-md transition-all duration-200",
              isDarkMode ? "bg-slate-800/50" : "bg-gray-50"
            )}>
              <div className="flex-shrink-0">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={cn("text-xs font-medium truncate", isDarkMode ? "text-slate-200" : "text-gray-900")}>
                    {item.title}
                  </p>
                  <Badge className={`${getStatusColor(item.status)} text-xs px-1.5 py-0.5`}>
                    {item.status}
                  </Badge>
                </div>
                <p className={cn("text-xs truncate", isDarkMode ? "text-slate-300" : "text-gray-600")}>
                  {item.description}
                </p>
                <p className={cn("text-xs", isDarkMode ? "text-slate-500" : "text-gray-400")}>
                  {item.time}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompactRecentActivity;
