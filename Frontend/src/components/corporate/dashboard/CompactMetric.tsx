import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactMetricProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'green' | 'orange' | 'red' | 'blue' | 'purple';
  size?: 'small' | 'medium';
  isDarkMode?: boolean;
}

const CompactMetric: React.FC<CompactMetricProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  color = 'default',
  size = 'medium',
  isDarkMode = false
}) => {
  const colorConfig = isDarkMode ? {
    default: {
      bg: 'bg-gradient-to-br from-slate-800/60 to-slate-700/60',
      iconBg: 'bg-slate-700/60',
      iconColor: 'text-slate-300',
      valueColor: 'text-slate-100',
      border: 'border-slate-600/50'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-900/30 to-emerald-900/30',
      iconBg: 'bg-green-800/40',
      iconColor: 'text-green-300',
      valueColor: 'text-green-200',
      border: 'border-green-700/50'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-900/30 to-amber-900/30',
      iconBg: 'bg-orange-800/40',
      iconColor: 'text-orange-300',
      valueColor: 'text-orange-200',
      border: 'border-orange-700/50'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-900/30 to-rose-900/30',
      iconBg: 'bg-red-800/40',
      iconColor: 'text-red-300',
      valueColor: 'text-red-200',
      border: 'border-red-700/50'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30',
      iconBg: 'bg-blue-800/40',
      iconColor: 'text-blue-300',
      valueColor: 'text-blue-200',
      border: 'border-blue-700/50'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-900/30 to-violet-900/30',
      iconBg: 'bg-purple-800/40',
      iconColor: 'text-purple-300',
      valueColor: 'text-purple-200',
      border: 'border-purple-700/50'
    }
  } : {
    default: {
      bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      valueColor: 'text-gray-800',
      border: 'border-gray-200'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-800',
      border: 'border-green-200'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      valueColor: 'text-orange-800',
      border: 'border-orange-200'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-rose-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      valueColor: 'text-red-800',
      border: 'border-red-200'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-800',
      border: 'border-blue-200'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-800',
      border: 'border-purple-200'
    }
  };

  const config = colorConfig[color];
  const textSize = size === 'small' ? 'text-sm sm:text-base' : 'text-lg sm:text-xl';
  const iconSize = size === 'small' ? 'h-3 w-3 sm:h-4 sm:w-4' : 'h-3 w-3 sm:h-4 sm:w-4';

  return (
    <div className={`relative overflow-hidden rounded-lg border ${config.border} ${config.bg} p-2 sm:p-3 shadow-sm hover:shadow-md transition-all duration-200 group`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-12 h-12 bg-current rounded-full -translate-y-6 translate-x-6"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 bg-current rounded-full translate-y-4 -translate-x-4"></div>
      </div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-1.5 rounded-md ${config.iconBg} group-hover:scale-110 transition-transform duration-200`}>
            <Icon className={`${iconSize} ${config.iconColor}`} />
          </div>
          {trend && (
            <div className="flex items-center space-x-1">
              {trend.isPositive ? (
                <TrendingUp className={cn("h-3 w-3", isDarkMode ? "text-green-400" : "text-green-600")} />
              ) : (
                <TrendingDown className={cn("h-3 w-3", isDarkMode ? "text-red-400" : "text-red-600")} />
              )}
              <span className={cn(
                "text-xs font-medium",
                trend.isPositive 
                  ? isDarkMode ? "text-green-400" : "text-green-600"
                  : isDarkMode ? "text-red-400" : "text-red-600"
              )}>
                {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-0.5">
          <div className={`${textSize} font-bold ${config.valueColor} group-hover:scale-105 transition-transform duration-200`}>
            {value}
          </div>
          <div className={cn(
            "text-xs font-medium opacity-80 leading-tight",
            isDarkMode ? "text-slate-400" : "text-gray-600"
          )}>
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactMetric;
