import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  date: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationSystemProps {
  notifications: DashboardNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  isDarkMode?: boolean;
  onNotificationClick?: (notification: DashboardNotification) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  isDarkMode = false,
  onNotificationClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className={cn("h-4 w-4", isDarkMode ? "text-orange-400" : "text-orange-600")} />;
      case 'success':
        return <CheckCircle className={cn("h-4 w-4", isDarkMode ? "text-green-400" : "text-green-600")} />;
      case 'alert':
        return <AlertCircle className={cn("h-4 w-4", isDarkMode ? "text-red-400" : "text-red-600")} />;
      default:
        return <Info className={cn("h-4 w-4", isDarkMode ? "text-blue-400" : "text-blue-600")} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-orange-500';
      default:
        return 'border-l-blue-500';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationSelect = (notification: DashboardNotification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onNotificationClick?.(notification);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <Button
      style={{marginRight: '20px'}}
        variant="ghost"
        size="sm"
        className={cn(
          "relative p-2 rounded-full transition",
          isDarkMode
            ? "hover:bg-slate-800/60"
            : "hover:bg-gray-100"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={cn("h-5 w-5", isDarkMode ? "text-slate-300" : "text-gray-600")} />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute right-0 top-12 w-80 backdrop-blur-sm rounded-lg shadow-xl z-50 max-h-96 overflow-hidden",
          isDarkMode
            ? "bg-slate-900/95 border border-slate-700/60"
            : "bg-white/95"
        )}>
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-4 border-b",
            isDarkMode ? "border-slate-700/60" : "border-gray-100"
          )}>
            <h3 className={cn(
              "font-semibold",
              isDarkMode ? "text-slate-200" : "text-gray-900"
            )}>Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onMarkAllAsRead}
                  className={cn(
                    "text-xs transition",
                    isDarkMode
                      ? "text-blue-400 hover:text-blue-300 hover:bg-slate-800/60"
                      : "text-blue-600 hover:text-blue-800"
                  )}
                >
                  Mark all read
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "p-1 transition",
                  isDarkMode && "hover:bg-slate-800/60 text-slate-300"
                )}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className={cn("h-8 w-8 mx-auto mb-2", isDarkMode ? "text-slate-500" : "text-gray-400")} />
                <p className={cn("text-sm", isDarkMode ? "text-slate-400" : "text-gray-500")}>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationSelect(notification)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleNotificationSelect(notification);
                    }
                  }}
                  className={cn(
                    "p-4 border-l-4 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2",
                    getPriorityColor(notification.priority),
                    notification.isRead
                      ? isDarkMode ? "bg-slate-800/30" : "bg-gray-50/50"
                      : isDarkMode ? "bg-slate-800/50" : "bg-white",
                    isDarkMode ? "hover:bg-slate-800/70 focus:ring-slate-600/40" : "hover:bg-gray-50/80 focus:ring-blue-200"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={cn(
                          "text-sm font-medium",
                          notification.isRead
                            ? isDarkMode ? "text-slate-400" : "text-gray-600"
                            : isDarkMode ? "text-slate-200" : "text-gray-900"
                        )}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            isDarkMode ? "bg-blue-400" : "bg-blue-600"
                          )} />
                        )}
                      </div>
                      <p className={cn(
                        "text-xs mb-2",
                        notification.isRead
                          ? isDarkMode ? "text-slate-500" : "text-gray-500"
                          : isDarkMode ? "text-slate-300" : "text-gray-700"
                      )}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-xs",
                          isDarkMode ? "text-slate-500" : "text-gray-400"
                        )}>
                          {notification.date}
                        </span>
                        {!notification.isRead && (
                          <span
                            className={cn(
                              "text-xs font-medium",
                              isDarkMode ? "text-blue-300" : "text-blue-600"
                            )}
                          >
                            View details
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
