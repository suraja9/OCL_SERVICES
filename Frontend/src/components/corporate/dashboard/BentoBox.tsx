import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoBoxProps {
  title: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  headerAction?: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'full' | 'xlarge';
  isDarkMode?: boolean;
}

const BentoBox: React.FC<BentoBoxProps> = ({
  title,
  children,
  icon: Icon,
  className = '',
  headerAction,
  size = 'medium',
  isDarkMode = false
}) => {
  const sizeClasses: Record<NonNullable<BentoBoxProps['size']>, string> = {
    small: 'col-span-1 sm:col-span-1 lg:col-span-1 row-span-1',
    medium: 'col-span-1 sm:col-span-2 lg:col-span-2 row-span-1',
    large: 'col-span-1 sm:col-span-2 lg:col-span-2 row-span-1 sm:row-span-2',
    wide: 'col-span-1 sm:col-span-2 lg:col-span-3 row-span-1',
    tall: 'col-span-1 sm:col-span-1 lg:col-span-1 row-span-1 sm:row-span-2',
    xlarge: 'col-span-1 sm:col-span-2 lg:col-span-3 row-span-1 sm:row-span-2',
    full: 'col-span-1 sm:col-span-2 lg:col-span-6 row-span-1'
  };

  return (
    <Card className={cn(
      sizeClasses[size],
      className,
      "border-0 shadow-md hover:shadow-xl transition-all duration-200 backdrop-blur-sm overflow-hidden",
      isDarkMode 
        ? "bg-slate-800/60 border-slate-700/50" 
        : "bg-white/80"
    )}>
      <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
        <CardTitle className={cn(
          "flex items-center justify-between text-xs sm:text-sm font-medium",
          isDarkMode ? "text-slate-200" : "text-gray-900"
        )}>
          <div className="flex items-center space-x-2">
            {Icon && (
              <Icon className={cn(
                "h-3 w-3 sm:h-4 sm:w-4",
                isDarkMode ? "text-slate-300" : "text-gray-600"
              )} />
            )}
            <span>{title}</span>
          </div>
          {headerAction}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4">
        {children}
      </CardContent>
    </Card>
  );
};

export default BentoBox;

