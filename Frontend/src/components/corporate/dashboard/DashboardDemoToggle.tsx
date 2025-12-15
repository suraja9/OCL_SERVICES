import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardDemoToggleProps {
  isNewCorporate: boolean;
  onToggle: () => void;
  isDarkMode?: boolean;
}

const DashboardDemoToggle: React.FC<DashboardDemoToggleProps> = ({
  isNewCorporate,
  onToggle,
  isDarkMode = false
}) => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={cn(
        "rounded-lg shadow-lg border p-3 backdrop-blur-sm transition-colors",
        isDarkMode
          ? "bg-slate-900/90 border-slate-700/60"
          : "bg-white border-gray-200"
      )}>
        <div className="flex items-center space-x-3">
          <div className="text-sm">
            <span className={cn(
              isDarkMode ? "text-slate-300" : "text-gray-600"
            )}>Demo Mode:</span>
            <Badge 
              variant={isNewCorporate ? "secondary" : "default"} 
              className={cn(
                "ml-2",
                isDarkMode && isNewCorporate && "bg-slate-700 text-slate-200",
                isDarkMode && !isNewCorporate && "bg-blue-600 text-white"
              )}
            >
              {isNewCorporate ? "New Corporate" : "Active Corporate"}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onToggle}
            className={cn(
              "flex items-center space-x-1 transition",
              isDarkMode
                ? "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
                : ""
            )}
          >
            {isNewCorporate ? (
              <>
                <Eye className="h-3 w-3" />
                <span>Show Active</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3" />
                <span>Show New</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardDemoToggle;
