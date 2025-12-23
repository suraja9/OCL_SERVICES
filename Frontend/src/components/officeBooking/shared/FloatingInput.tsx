/**
 * FloatingInput Component
 * Reusable floating label input component
 * Design matches BookNow.tsx
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  disabledHoverDanger?: boolean;
  serviceabilityStatus?: 'available' | 'unavailable' | null;
  showInlineStatus?: boolean;
  addressInfo?: string;
  errorMessage?: string;
  placeholder?: string;
  hasValidationError?: boolean;
  validationErrorMessage?: string;
  compact?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isDarkMode?: boolean;
  noBorder?: boolean;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  maxLength,
  icon,
  disabled = false,
  className = '',
  disabledHoverDanger = false,
  serviceabilityStatus = null,
  showInlineStatus = false,
  addressInfo = '',
  errorMessage = '',
  placeholder = '',
  hasValidationError = false,
  validationErrorMessage = '',
  compact = false,
  onBlur,
  onKeyDown,
  isDarkMode = false,
  noBorder = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = isFocused || hasValue;

  const getStatusDisplay = () => {
    if (!showInlineStatus || !serviceabilityStatus) return null;
    
    if (serviceabilityStatus === 'available') {
      return {
        text: 'Available',
        bgColor: isDarkMode ? 'bg-green-500/20' : 'bg-green-100',
        textColor: isDarkMode ? 'text-green-300' : 'text-green-700',
        icon: <CheckCircle className="w-3 h-3" />
      };
    } else {
      return {
        text: 'Not Available', 
        bgColor: isDarkMode ? 'bg-red-500/20' : 'bg-red-100',
        textColor: isDarkMode ? 'text-red-300' : 'text-red-700',
        icon: <X className="w-3 h-3" />
      };
    }
  };

  const statusDisplay = getStatusDisplay();
  const hasInlineStatus = showInlineStatus && serviceabilityStatus;

  return (
    <div className={cn("relative", className, disabled && disabledHoverDanger ? 'group' : '')}>
      <div className="relative">
        {icon && (
          <div className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 z-10",
            isDarkMode ? "text-slate-400" : "text-gray-400"
          )}>
            {icon}
          </div>
        )}
        <input
          type={type === 'date' && !isFocused && !hasValue ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          onKeyDown={onKeyDown}
          maxLength={maxLength}
          disabled={disabled}
          className={cn(
            "w-full", compact ? "h-8" : "h-10", "px-3 rounded-xl transition-all duration-200 ease-in-out",
            compact ? "text-xs" : "text-xs",
            "shadow-[rgba(0,0,0,0.15)_0px_3px_3px_0px]",
            !noBorder && "border",
            icon ? "pl-10" : "pl-3",
            hasInlineStatus || hasValidationError ? "pr-10" : "pr-3",
            isDarkMode 
              ? "bg-slate-800/60 text-slate-100 placeholder:text-slate-400" 
              : "bg-white/90 text-[#4B5563] placeholder:text-[#4B5563]",
            !noBorder && (isDarkMode ? "border-slate-700" : "border-gray-300/60"),
            hasValidationError
              ? "border-red-500 ring-2 ring-red-200"
              : isFocused && !noBorder
                ? isDarkMode
                  ? "border-blue-500 border-[1px]"
                  : "border-blue-500 border-[1px]"
                : !noBorder && (isDarkMode
                  ? "hover:border-blue-400/50"
                  : "hover:border-blue-400/50"),
            disabled && (isDarkMode ? "bg-slate-900/40 cursor-not-allowed" : "bg-gray-50 cursor-not-allowed"),
            disabled && disabledHoverDanger && !isDarkMode && "group-hover:border-red-500 group-hover:bg-red-50",
            "focus:outline-none"
          )}
          placeholder={placeholder || ""}
          aria-disabled={disabled}
          title={disabled && disabledHoverDanger ? 'Pincode is Non-Serviceable' : undefined}
        />
        
        {hasValidationError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
        
        {hasInlineStatus && statusDisplay && !hasValidationError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
            <div className={cn(
              "flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium",
              statusDisplay.bgColor,
              statusDisplay.textColor
            )}>
              {statusDisplay.icon}
              <span>{statusDisplay.text}</span>
            </div>
          </div>
        )}
        
        <label
          className={cn(
            "absolute transition-all duration-200 ease-in-out pointer-events-none select-none",
            icon ? "left-12" : "left-4",
            shouldFloat
              ? "top-0 -translate-y-1/2 text-xs px-2"
              : "top-1/2 -translate-y-1/2 text-xs",
            shouldFloat
              ? isDarkMode 
                ? "bg-slate-900 text-blue-400" 
                : "bg-white text-blue-600"
              : isDarkMode 
                ? "text-slate-400" 
                : "text-gray-500",
            isFocused && !hasValue && (isDarkMode ? "text-blue-400" : "text-blue-600"),
            disabled && disabledHoverDanger && !isDarkMode && "group-hover:text-red-600"
          )}
        >
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      
      {showInlineStatus && serviceabilityStatus && (
        <div className="mt-1">
          {serviceabilityStatus === 'available' && addressInfo && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-1 justify-end pr-3"
            >
              <div className={cn(
                "text-xs",
                isDarkMode ? "text-slate-300" : "text-slate-700"
              )}>
                {addressInfo}
              </div>
            </motion.div>
          )}
          
          {serviceabilityStatus === 'unavailable' && errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-1 justify-end pr-3"
            >
              <div className={cn(
                "text-xs px-2 py-1 rounded border",
                isDarkMode 
                  ? "text-red-300 bg-red-500/20 border-red-500/40" 
                  : "text-red-600 bg-red-50 border-red-200"
              )}>
                {errorMessage}
              </div>
            </motion.div>
          )}
        </div>
      )}
      
      {hasValidationError && validationErrorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1"
        >
          <div className="text-xs text-red-600">
            {validationErrorMessage}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FloatingInput;

