import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Check, 
  X, 
  Phone, 
  User, 
  Building, 
  Mail, 
  MapPin,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  Package,
  Scale,
  Ruler,
  FileText,
  Image,
  Upload,
  XCircle,
  Plane,
  Train,
  Truck,
  Calendar,
  Eye,
  Cog,
  Book,
  CreditCard,
  Gift,
  Clock,
  Shirt,
  Monitor,
  Briefcase,
  FileCheck,
  Apple,
  Home,
  Laptop,
  Luggage,
  Heart,
  Pill,
  BookOpen,
  HardDrive,
  FileText as FileTextIcon,
  CreditCard as SimCardIcon,
  Dumbbell,
  PenTool,
  Candy,
  Gamepad2,
  Wallet,
  Smartphone,
  Lock,
  Plus,
  DollarSign,
  Download,
  Printer,
  Globe,
  Weight,
  Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserAuth } from '@/contexts/UserAuthContext';
import UserLogin from './UserLogin';

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
const VOLUMETRIC_DIVISOR = 5000; // Standard volumetric conversion factor (cm³ to kg)

// Package Type Options with Icons
const packageTypeOptions = [
  { value: 'Auto & Machine Parts', icon: Cog },
  { value: 'Books', icon: Book },
  { value: 'Cheque Book', icon: FileCheck },
  { value: 'Chocolates', icon: Candy },
  { value: 'Clothing (General)', icon: Shirt },
  { value: 'Computer Accessories', icon: Monitor },
  { value: 'Corporate Gifts', icon: Gift },
  { value: 'Credit / Debit Card', icon: CreditCard },
  { value: 'Documents', icon: FileText },
  { value: 'Dry Fruits', icon: Apple },
  { value: 'Household Goods', icon: Home },
  { value: 'Laptop', icon: Laptop },
  { value: 'Luggage / Travel Bag', icon: Luggage },
  { value: 'Medical Equipment', icon: Heart },
  { value: 'Medicines', icon: Pill },
  { value: 'Passport', icon: BookOpen },
  { value: 'Pen Drive', icon: HardDrive },
  { value: 'Promotional Material (Paper)', icon: FileTextIcon },
  { value: 'SIM Card', icon: SimCardIcon },
  { value: 'Sports', icon: Dumbbell },
  { value: 'Stationery Items', icon: PenTool },
  { value: 'Sweets', icon: Candy },
  { value: 'Toys', icon: Gamepad2 },
  { value: 'Wooden Box', icon: Box },
  { value: 'Carton Box', icon: Box },
  { value: 'Gunny bag', icon: Package },
  { value: 'Others', icon: Package }
];

// Helper functions for input sanitization
const sanitizeInteger = (value: string) => value.replace(/\D/g, '');

const sanitizeDecimal = (value: string) => {
  const numeric = value.replace(/[^0-9.]/g, '');
  const firstDotIndex = numeric.indexOf('.');
  if (firstDotIndex === -1) {
    return numeric;
  }
  const beforeDot = numeric.slice(0, firstDotIndex);
  const afterDot = numeric.slice(firstDotIndex + 1).replace(/\./g, '');
  return `${beforeDot}.${afterDot}`;
};

// Simple Input Component with Label Above
interface SimpleInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  helperText?: string;
  isDarkMode?: boolean;
}

const SimpleInput: React.FC<SimpleInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  className = '',
  placeholder = '',
  helperText,
  isDarkMode = false
}) => {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className={cn(
        "text-sm font-normal block",
        isDarkMode ? "text-slate-200" : "text-slate-700"
      )}>
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type === 'date' && !value ? 'text' : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full h-11 px-3 border rounded-md text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          isDarkMode
            ? disabled
              ? "bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed"
              : "bg-slate-800/60 border-slate-700 text-slate-100 focus:border-slate-600 focus:ring-slate-600/30"
            : disabled
              ? "bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-white border-slate-300 text-slate-900 focus:border-slate-500 focus:ring-slate-500/20"
        )}
      />
      {helperText && (
        <p className={cn(
          "text-xs",
          isDarkMode ? "text-slate-400" : "text-slate-500"
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
};

// Simple Select Component with Label Above
interface SimpleSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
  isDarkMode?: boolean;
  hideLabel?: boolean;
}

const SimpleSelect: React.FC<SimpleSelectProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  className = '',
  isDarkMode = false,
  hideLabel = false
}) => {
  return (
    <div className={cn("space-y-1.5 relative", className)}>
      {!hideLabel && (
      <label className={cn(
        "text-sm font-normal block",
        isDarkMode ? "text-slate-200" : "text-slate-700"
      )}>
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full h-11 px-3 pr-10 border rounded-md text-sm appearance-none transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          isDarkMode
            ? disabled
              ? "bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed"
              : "bg-slate-800/60 border-slate-700 text-slate-100 focus:border-slate-600 focus:ring-slate-600/30"
            : disabled
              ? "bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-white border-slate-300 text-slate-900 focus:border-slate-500 focus:ring-slate-500/20"
        )}
      >
        <option value="" disabled hidden></option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div className={cn(
        "absolute right-3 pointer-events-none",
        hideLabel ? "top-[14px]" : "top-[38px]"
      )}>
        <ChevronDown className={cn(
          "h-4 w-4",
          isDarkMode ? "text-slate-400" : "text-slate-500"
        )} />
      </div>
    </div>
  );
};

// Floating Label Input Component
interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  serviceabilityStatus?: 'available' | 'unavailable' | null;
  showInlineStatus?: boolean;
  addressInfo?: string;
  errorMessage?: string;
  placeholder?: string;
  hasValidationError?: boolean;
  validationErrorMessage?: string;
  isDarkMode?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
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
  serviceabilityStatus = null,
  showInlineStatus = false,
  addressInfo = '',
  errorMessage = '',
  placeholder = '',
  hasValidationError = false,
  validationErrorMessage = '',
  isDarkMode = false,
  onBlur,
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
    <div className={cn("relative", className)}>
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
          maxLength={maxLength}
          disabled={disabled}
          className={cn(
            "w-full h-10 px-3 rounded-xl transition-all duration-200 ease-in-out text-xs",
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
            "focus:outline-none"
          )}
          placeholder={placeholder || ""}
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
            isFocused && !hasValue && (isDarkMode ? "text-blue-400" : "text-blue-600")
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

// Floating Select Component
interface FloatingSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  isDarkMode?: boolean;
}

const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  icon,
  disabled = false,
  className = '',
  isDarkMode = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = isFocused || hasValue;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {icon && (
          <div className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 z-10",
            isDarkMode ? "text-slate-400" : "text-gray-400"
          )}>
            {icon}
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={cn(
            "w-full h-10 px-3 border rounded-xl transition-all duration-200 ease-in-out text-xs appearance-none",
            "shadow-[rgba(0,0,0,0.15)_0px_3px_3px_0px]",
            icon ? "pl-10" : "pl-3",
            "pr-8",
            isDarkMode 
              ? "bg-slate-800/60 border-slate-700 text-slate-100" 
              : "bg-white/90 border-gray-300/60 text-[#4B5563]",
            isFocused 
              ? isDarkMode
                ? "border-blue-500 border-[1px]"
                : "border-blue-500 border-[1px]"
              : isDarkMode
                ? "hover:border-blue-400/50"
                : "hover:border-blue-400/50",
            disabled && (isDarkMode ? "bg-slate-900/40 cursor-not-allowed" : "bg-gray-50 cursor-not-allowed"),
            "focus:outline-none"
          )}
        >
          <option value="" disabled hidden></option>
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className={cn("w-5 h-5", isDarkMode ? "text-slate-400" : "text-gray-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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
            isFocused && !hasValue && (isDarkMode ? "text-blue-400" : "text-blue-600")
          )}
        >
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
    </div>
  );
};

// Floating Select with Icons Component
interface FloatingSelectWithIconsProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; icon: React.ComponentType<any> }>;
  required?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  isDarkMode?: boolean;
}

const FloatingSelectWithIcons: React.FC<FloatingSelectWithIconsProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  icon,
  disabled = false,
  className = '',
  isDarkMode = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = isFocused || hasValue || isOpen;
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const SelectedIcon = selectedOption?.icon;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="relative">
        {icon && (
          <div className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 z-10",
            isDarkMode ? "text-slate-400" : "text-gray-400"
          )}>
            {icon}
          </div>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Don't close immediately to allow option click
              setTimeout(() => {
                if (!isOpen) {
                  setIsFocused(false);
                }
              }, 150);
            }}
            disabled={disabled}
            className={cn(
              "w-full h-10 px-3 border rounded-xl transition-all duration-200 ease-in-out text-sm text-left",
              icon ? "pl-10" : "pl-3",
              "pr-10",
              isDarkMode 
                ? "bg-slate-800/60 border-slate-700 text-slate-100" 
                : "bg-white/90 border-gray-300/60 text-slate-900",
              isFocused || isOpen
                ? isDarkMode
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg"
                  : "border-blue-500 ring-2 ring-blue-200 shadow-md"
                : isDarkMode
                  ? "hover:border-blue-400/50"
                  : "hover:border-blue-400/50 hover:shadow-sm",
              disabled && (isDarkMode ? "bg-slate-900/40 cursor-not-allowed" : "bg-gray-50 cursor-not-allowed"),
              "focus:outline-none"
            )}
          >
            <div className="flex items-center gap-2">
              {selectedOption && SelectedIcon && (
                <SelectedIcon className={cn("h-4 w-4 flex-shrink-0", isDarkMode ? "text-blue-400" : "text-blue-600")} />
              )}
              <span className={cn("truncate text-xs", isDarkMode ? "text-slate-100" : "text-[#4B5563]")}>{selectedOption?.value || ''}</span>
            </div>
          </button>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen ? "transform rotate-180" : "",
              isDarkMode ? "text-slate-400" : "text-gray-400"
            )} />
          </div>
        </div>
        
        {isOpen && (
          <div className={cn(
            "absolute z-50 w-full mt-1 border rounded-xl shadow-lg overflow-hidden",
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-200"
          )}>
            {/* Show exactly 7 items (7 * 40px = 280px) with scrolling for rest */}
            <div className="max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/50 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400/70">
              {options.map((option, index) => {
                const OptionIcon = option.icon;
                const isSelected = value === option.value;
                return (
                  <button
                    key={index}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent blur from firing before click
                    }}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setIsFocused(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2.5 text-left text-xs transition-colors flex items-center gap-2",
                      isSelected
                        ? isDarkMode
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-blue-50 text-blue-700"
                        : isDarkMode
                          ? "text-slate-200 hover:bg-slate-700"
                          : "text-[#4B5563] hover:bg-slate-50"
                    )}
                  >
                    <OptionIcon className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isSelected
                        ? isDarkMode ? "text-blue-300" : "text-blue-600"
                        : isDarkMode ? "text-slate-400" : "text-slate-500"
                    )} />
                    <span className="truncate">{option.value}</span>
                    {isSelected && (
                      <Check className={cn(
                        "h-4 w-4 ml-auto flex-shrink-0",
                        isDarkMode ? "text-blue-300" : "text-blue-600"
                      )} />
                    )}
                  </button>
                );
              })}
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
            isFocused && !hasValue && (isDarkMode ? "text-blue-400" : "text-blue-600")
          )}
        >
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
    </div>
  );
};

// Stepper Component
interface StepperProps {
  currentStep: number;
  steps: string[];
  completedSteps: boolean[];
  isDarkMode?: boolean;
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps, completedSteps, isDarkMode = false }) => {
  return (
    <div className="w-full py-1 sm:py-2">
      <div className="flex items-center justify-center overflow-x-hidden pb-1">
        <div className="flex items-center justify-center space-x-1 sm:space-x-1.5 md:space-x-2 max-w-fit mx-auto px-2">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center justify-center min-w-0">
                <div
                  className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-semibold transition-all duration-300 flex-shrink-0",
                    completedSteps[index] 
                      ? "bg-green-500 text-white" 
                      : currentStep === index 
                        ? isDarkMode
                          ? "bg-blue-500 text-white ring-2 ring-blue-400/20"
                          : "bg-blue-600 text-white ring-2 ring-blue-200"
                        : isDarkMode
                          ? "bg-slate-700 text-slate-300"
                          : "bg-gray-300 text-gray-600"
                  )}
                >
                  {/* Mobile: Always show number, Desktop: Show checkmark if completed */}
                  {completedSteps[index] ? (
                    <>
                      <span className="sm:hidden">{index + 1}</span>
                      <Check className="hidden sm:block w-2 h-2 sm:w-2.5 sm:h-2.5" />
                    </>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "hidden sm:block mt-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-medium text-center leading-tight whitespace-nowrap",
                    currentStep === index 
                      ? isDarkMode 
                        ? "text-blue-400 font-semibold" 
                        : "text-blue-600 font-semibold"
                      : isDarkMode 
                        ? "text-slate-400" 
                        : "text-gray-600"
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight 
                  strokeWidth={2.5}
                  className={cn(
                    "w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0 transition-all duration-300 md:-translate-y-3",
                    completedSteps[index] 
                      ? "text-green-500" 
                      : isDarkMode 
                        ? "text-slate-700" 
                        : "text-gray-300"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

interface BookNowProps {
  isDarkMode?: boolean;
}

interface ReviewSectionProps {
  title: string;
  icon?: React.ReactNode;
  isDarkMode: boolean;
  children: React.ReactNode;
}

interface ReviewFieldProps {
  label: string;
  value: React.ReactNode;
  isDarkMode: boolean;
  icon?: React.ReactNode;
  emphasize?: boolean;
}

interface ShipmentDetails {
  natureOfConsignment: string;
  insurance: string;
  riskCoverage: string;
  packagesCount: string;
  materials: string;
  others: string;
  description: string;
  declaredValue: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  insuranceCompanyName: string;
  insurancePolicyNumber: string;
  insurancePolicyDate: string;
  insuranceValidUpto: string;
  insurancePremiumAmount: string;
  insuranceDocumentName: string;
  insuranceDocument: File | null;
  declarationDocumentName: string;
  declarationDocument: File | null;
}

interface InsuranceFormState {
  companyName: string;
  policyNumber: string;
  policyDate: string;
  validUpto: string;
  premiumAmount: string;
  document: File | null;
  documentName: string;
}

interface BookingPaymentInfo {
  paymentStatus?: 'pending' | 'paid';
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ title, icon, isDarkMode, children }) => {
  return (
    <div
      className={cn(
        'rounded-xl sm:rounded-2xl border p-4 sm:p-5 transition-all duration-300',
        isDarkMode
          ? 'border-slate-800/70 bg-slate-900/70 shadow-[0_18px_40px_rgba(15,23,42,0.35)]'
          : 'border-slate-200/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]'
      )}
    >
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        {icon && (
          <div
            className={cn(
              'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl flex-shrink-0',
              isDarkMode ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-100 text-blue-600'
            )}
          >
            {icon}
          </div>
        )}
        <h4
          className={cn(
            'text-xs sm:text-sm font-semibold uppercase tracking-wide',
            isDarkMode ? 'text-slate-200' : 'text-slate-800'
          )}
        >
          {title}
        </h4>
      </div>
      <div className="grid gap-3 sm:gap-4">{children}</div>
    </div>
  );
};

const ReviewField: React.FC<ReviewFieldProps> = ({ label, value, icon, isDarkMode, emphasize = false }) => {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div
          className={cn(
            'mt-1 flex h-8 w-8 items-center justify-center rounded-lg',
            isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            'text-xs font-medium tracking-wide uppercase',
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          {label}
        </span>
        <div
          className={cn(
            'mt-1 text-sm leading-relaxed break-words',
            emphasize
              ? isDarkMode
                ? 'text-green-300 font-semibold'
                : 'text-green-600 font-semibold'
              : isDarkMode
                ? 'text-slate-200'
                : 'text-slate-800'
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
};

const BookNow: React.FC<BookNowProps> = ({ isDarkMode = false }) => {
  const { isAuthenticated, customer } = useUserAuth();
  
  // Door pickup charge constant (exclusive of GST)
  const DOOR_PICKUP_CHARGE = 100;
  const PICKUP_CHARGE_GST_RATE = 0.18; // 18% GST
  const PICKUP_CHARGE_GST = DOOR_PICKUP_CHARGE * PICKUP_CHARGE_GST_RATE; // ₹18
  const TOTAL_PICKUP_CHARGE = DOOR_PICKUP_CHARGE + PICKUP_CHARGE_GST; // ₹118
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false, false, false]);
  const steps = ['Serviceability', 'Address ', 'Shipment Details', 'Material Details', 'Shipping & Pricing', 'Preview'];

  // Serviceability states
  const [originPincode, setOriginPincode] = useState('');
  const [destinationPincode, setDestinationPincode] = useState('');
  const [originServiceable, setOriginServiceable] = useState<boolean | null>(null);
  const [destinationServiceable, setDestinationServiceable] = useState<boolean | null>(null);
  const [checkingOrigin, setCheckingOrigin] = useState(false);
  const [checkingDestination, setCheckingDestination] = useState(false);
  const [originAddressInfo, setOriginAddressInfo] = useState('');
  const [destinationAddressInfo, setDestinationAddressInfo] = useState('');
  const [originAreas, setOriginAreas] = useState<string[]>([]);
  const [destinationAreas, setDestinationAreas] = useState<string[]>([]);

  // Origin form states
  const [originMobileDigits, setOriginMobileDigits] = useState<string[]>(Array(10).fill(''));
  const [originData, setOriginData] = useState({
    mobileNumber: '',
    name: '',
    companyName: '',
    email: '',
    locality: '',
    flatBuilding: '',
    landmark: '',
    pincode: '',
    area: '',
    city: '',
    district: '',
    state: '',
    gstNumber: '',
    alternateNumbers: [''],
    addressType: 'Home',
    birthday: '',
    anniversary: '',
    website: '',
    otherAlternateNumber: '',
  });

  // Destination form states
  const [destinationMobileDigits, setDestinationMobileDigits] = useState<string[]>(Array(10).fill(''));
  const [destinationData, setDestinationData] = useState({
    mobileNumber: '',
    name: '',
    companyName: '',
    email: '',
    locality: '',
    flatBuilding: '',
    landmark: '',
    pincode: '',
    area: '',
    city: '',
    district: '',
    state: '',
    gstNumber: '',
    alternateNumbers: [''],
    addressType: 'Home',
    birthday: '',
    anniversary: '',
    website: '',
    otherAlternateNumber: '',
  });

  // Modal states
  const [phoneModalOpen, setPhoneModalOpen] = useState<{ type: 'origin' | 'destination' | null }>({ type: null });
  const [formModalOpen, setFormModalOpen] = useState<{ type: 'origin' | 'destination' | null }>({ type: null });
  const [showPreviewInModal, setShowPreviewInModal] = useState(false);
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number>(0);
  
  // Phone number search states
  const [phoneSearchResults, setPhoneSearchResults] = useState<any[]>([]);
  const [phoneSearchModalOpen, setPhoneSearchModalOpen] = useState<{ type: 'origin' | 'destination' | null; phoneNumber: string }>({ type: null, phoneNumber: '' });
  const [searchingPhone, setSearchingPhone] = useState(false);
  
  // Add another address states
  const [isAddingAnotherAddress, setIsAddingAnotherAddress] = useState(false);
  const [previousAddressData, setPreviousAddressData] = useState<any>(null);
  const [newAddressData, setNewAddressData] = useState<any>(null);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0); // 0 for previous, 1 for new
  const [shipmentDetails, setShipmentDetails] = useState<ShipmentDetails>({
    natureOfConsignment: '',
    insurance: '',
    riskCoverage: 'Owner',
    packagesCount: '',
    materials: '',
    others: '',
    description: '',
    declaredValue: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    insuranceCompanyName: '',
    insurancePolicyNumber: '',
    insurancePolicyDate: '',
    insuranceValidUpto: '',
    insurancePremiumAmount: '',
    insuranceDocumentName: '',
    insuranceDocument: null,
    declarationDocumentName: '',
    declarationDocument: null
  });
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [insuranceForm, setInsuranceForm] = useState<InsuranceFormState>({
    companyName: '',
    policyNumber: '',
    policyDate: '',
    validUpto: '',
    premiumAmount: '',
    document: null,
    documentName: ''
  });
  const [insuranceFormError, setInsuranceFormError] = useState<string>('');
  const [isPremiumAmountFocused, setIsPremiumAmountFocused] = useState(false);
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  
  // Checkout states
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null); // Store booking ID
  const [consignmentNumber, setConsignmentNumber] = useState<number | null>(null);
  const [awbNumber, setAwbNumber] = useState<string>('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [lastPaymentStatus, setLastPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [latestBookingSummary, setLatestBookingSummary] = useState<{
    bookingId: string;
    bookingReference: string;
    consignmentNumber: number | null;
  } | null>(null);
  const [pendingBookingPayload, setPendingBookingPayload] = useState<Record<string, any> | null>(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<any | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const invoiceContentRef = useRef<HTMLDivElement | null>(null);
  // Company details for invoice
  const COMPANY_DETAILS = {
    name: "Our Courier & Logistics",
    location: "Rehabari, Guwahati, Assam 781008",
    gstin: " 18AJRPG5984B1ZV",
    state: "Assam",
    stateCode: "18",
    phone: "+91 76360 96733",
    email: "info@oclservices.com",
    website: "www.oclservices.com",
  };

  // Helper function to calculate total pickup charge with GST
  const getTotalPickupCharge = (pickupCharge?: number): number => {
    if (pickupCharge !== undefined && pickupCharge !== null) {
      return pickupCharge + (pickupCharge * PICKUP_CHARGE_GST_RATE);
    }
    return TOTAL_PICKUP_CHARGE;
  };

  // Function to convert number to words (Indian format)
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero Rupees Only';
    
    const convertHundreds = (n: number): string => {
      let result = '';
      if (n > 99) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 19) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n > 9) {
        result += teens[n - 10] + ' ';
        return result.trim();
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result.trim();
    };
    
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    let result = '';
    let remaining = integerPart;
    
    if (remaining >= 10000000) {
      const crore = Math.floor(remaining / 10000000);
      result += convertHundreds(crore) + ' Crore ';
      remaining %= 10000000;
    }
    
    if (remaining >= 100000) {
      const lakh = Math.floor(remaining / 100000);
      result += convertHundreds(lakh) + ' Lakh ';
      remaining %= 100000;
    }
    
    if (remaining >= 1000) {
      const thousand = Math.floor(remaining / 1000);
      result += convertHundreds(thousand) + ' Thousand ';
      remaining %= 1000;
    }
    
    if (remaining > 0) {
      result += convertHundreds(remaining) + ' ';
    }
    
    result = result.trim() + ' Rupees';
    
    if (decimalPart > 0) {
      result += ' and ' + convertHundreds(decimalPart) + ' Paise';
    }
    
    return result + ' Only';
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getConsignmentValue = (reference?: string) => {
    if (!reference) return "";
    const digitsOnly = reference.replace(/[^0-9]/g, "");
    return digitsOnly || reference.trim();
  };

  const getBarcodeUrl = (reference?: string) => {
    const value = getConsignmentValue(reference) || "OCL";
    return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(value)}&translate-esc=on`;
  };

  const getInvoiceNumber = (booking: any) => {
    const createdDate = new Date(booking.createdAt || new Date());
    const currentYear = createdDate.getFullYear();
    const nextYear = currentYear + 1;
    const fiscalYear = `${String(currentYear).slice(-2)}-${String(nextYear).slice(-2)}`;

    const numericPart =
      booking.bookingReference?.replace(/\D/g, "") ||
      booking._id?.slice(-5) ||
      String(Date.now()).slice(-5);

    const serial = numericPart.slice(-5).padStart(5, "0");

    return `${fiscalYear}/${serial}`;
  };

  // Function to construct Booking object from current data
  const constructBookingForInvoice = () => {
    const now = new Date().toISOString();
    return {
      _id: latestBookingSummary?.bookingId || String(Date.now()),
      bookingReference: latestBookingSummary?.bookingReference || awbNumber || 'Awaiting assignment',
      status: 'confirmed' as const,
      paymentStatus: lastPaymentStatus === 'paid' ? 'paid' as const : 'unpaid' as const,
      origin: originData,
      destination: destinationData,
      shipment: {
        ...shipmentDetails,
        insuranceDocument: shipmentDetails.insuranceDocument ? (typeof shipmentDetails.insuranceDocument === 'string' ? shipmentDetails.insuranceDocument : '') : '',
        declarationDocument: shipmentDetails.declarationDocument ? (typeof shipmentDetails.declarationDocument === 'string' ? shipmentDetails.declarationDocument : '') : ''
      },
      packageImages: pendingBookingPayload?.packageImages || [],
      shippingMode: selectedMode || '',
      serviceType: selectedServiceType || '',
      calculatedPrice: calculatedPrice || 0,
      basePrice: pendingBookingPayload?.basePrice,
      gstAmount: pendingBookingPayload?.gstAmount,
      pickupCharge: pendingBookingPayload?.pickupCharge || DOOR_PICKUP_CHARGE,
      totalAmount: calculatedPrice ? calculatedPrice + getTotalPickupCharge(pendingBookingPayload?.pickupCharge) : getTotalPickupCharge(pendingBookingPayload?.pickupCharge),
      actualWeight: actualWeight || null,
      volumetricWeight: volumetricWeight || null,
      chargeableWeight: chargeableWeight || null,
      originServiceable: originServiceable,
      destinationServiceable: destinationServiceable,
      originAddressInfo: originAddressInfo,
      destinationAddressInfo: destinationAddressInfo,
      createdAt: now,
      updatedAt: now
    };
  };

  const handleDownloadInvoice = useCallback(async () => {
    if (!selectedInvoiceBooking || !invoiceContentRef.current) {
      return;
    }

    try {
      setDownloadingInvoice(true);
      const scale =
        typeof window !== "undefined"
          ? Math.min(window.devicePixelRatio || 2, 2)
          : 2;

      const canvas = await html2canvas(invoiceContentRef.current, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${selectedInvoiceBooking.bookingReference}.pdf`);
    } catch (err) {
      console.error("Error downloading invoice:", err);
    } finally {
      setDownloadingInvoice(false);
    }
  }, [selectedInvoiceBooking]);

  const handleViewInvoice = () => {
    const booking = constructBookingForInvoice();
    setSelectedInvoiceBooking(booking);
  };

  const navigateDashboardSection = (section: 'booknow' | 'mybooking') => {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('user-dashboard:navigate', { detail: { section } }));
      } catch (error) {
        console.warn('Failed to dispatch dashboard navigation event', error);
      }
    }
  };

  const handleViewMyBookings = () => {
    navigateDashboardSection('mybooking');
  };

  const handleStartNewBooking = () => {
    navigateDashboardSection('booknow');
    window.location.reload();
  };
  
  // Generate Order ID
  const generateOrderID = () => {
    const timestamp = Date.now();
    return `Order ID - ${timestamp}`;
  };
  
  const orderId = useMemo(() => generateOrderID(), [checkoutOpen]);

  // Cleanup object URL when component unmounts or preview closes
  useEffect(() => {
    return () => {
      if (documentPreviewUrl) {
        URL.revokeObjectURL(documentPreviewUrl);
      }
    };
  }, [documentPreviewUrl]);

  // Cleanup when preview dialog closes
  const handleClosePreview = () => {
    if (documentPreviewUrl) {
      URL.revokeObjectURL(documentPreviewUrl);
      setDocumentPreviewUrl(null);
    }
    setDocumentPreviewOpen(false);
  };

  const createBookingRecord = async (paymentInfo?: BookingPaymentInfo) => {
    if (!pendingBookingPayload) {
      alert('Booking details are not ready. Please review the preview step again.');
      return null;
    }

    setSavingBooking(true);
    try {
      const resolvedPaymentStatus = paymentInfo?.paymentStatus === 'paid' ? 'paid' : 'pending';
      const response = await fetch(`${API_BASE}/api/customer-booking/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pendingBookingPayload,
          paymentInfo: {
            paymentStatus: resolvedPaymentStatus,
            paymentMethod: paymentInfo?.paymentMethod || '',
            razorpayOrderId: paymentInfo?.razorpayOrderId || '',
            razorpayPaymentId: paymentInfo?.razorpayPaymentId || '',
            razorpaySignature: paymentInfo?.razorpaySignature || ''
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save booking');
      }

      const result = await response.json();

      setCurrentBookingId(result.data.bookingId);
      setConsignmentNumber(result.data.consignmentNumber || null);
      setAwbNumber(result.data.consignmentNumber ? String(result.data.consignmentNumber) : '');
      const bookingSummary = {
        bookingId: result.data.bookingId,
        bookingReference: result.data.bookingReference,
        consignmentNumber: result.data.consignmentNumber ?? null
      };
      setLatestBookingSummary(bookingSummary);
      setLastPaymentStatus(resolvedPaymentStatus);
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('online-booking:created', { detail: bookingSummary }));
        } catch (eventError) {
          console.warn('Failed to dispatch booking event', eventError);
        }
      }
      setPendingBookingPayload(null);
      const newCompleted = [...completedSteps];
      newCompleted[5] = true;
      setCompletedSteps(newCompleted);
      setOrderComplete(true);
      setCheckoutOpen(false);
      return result.data;
    } catch (error) {
      console.error('❌ Failed to save booking to database:', error);
      alert(error instanceof Error ? error.message : 'Failed to save booking. Please try again.');
      throw error;
    } finally {
      setSavingBooking(false);
    }
  };

  // Razorpay payment handler
  const handleRazorpayPayment = async () => {
    if (!pendingBookingPayload) {
      alert('Booking details are not ready. Please review the preview step again.');
      return;
    }

    try {
      setProcessingPayment(true);
      const totalAmount = pendingBookingPayload.calculatedPrice ? (pendingBookingPayload.calculatedPrice + TOTAL_PICKUP_CHARGE) : TOTAL_PICKUP_CHARGE;
      
      if (totalAmount <= 0) {
        alert('Invalid amount. Please check your booking details.');
        setProcessingPayment(false);
        return;
      }

      // Step 1: Create order on backend
      const orderResponse = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`
        }),
      });
      
      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }
      
      // Step 2: Initialize Razorpay Checkout
      const options = {
        key: 'rzp_test_RfwLbChhytqnt1', // Razorpay test key
        amount: orderData.amount, // Amount in paise
        currency: orderData.currency,
        name: 'OCL Courier',
        description: 'Shipment Payment',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Step 3: Verify payment on backend
            const verifyResponse = await fetch(`${API_BASE}/api/payment/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                bookingId: null,
              }),
            });
            
            const verifyResult = await verifyResponse.json();
            
            if (verifyResult.success) {
              await createBookingRecord({
                paymentStatus: 'paid',
                paymentMethod: 'razorpay',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });
            } else {
              throw new Error(verifyResult.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: originData.name || '',
          email: originData.email || '',
          contact: originData.mobileNumber || '',
        },
        theme: {
          color: '#10b981', // Green color
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled');
            setProcessingPayment(false);
          },
        },
      };
      
      // Load Razorpay script if not already loaded
      if (!(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const razorpay = new (window as any).Razorpay(options);
          razorpay.open();
        };
        script.onerror = () => {
          alert('Failed to load payment gateway. Please try again.');
          setProcessingPayment(false);
        };
        document.body.appendChild(script);
      } else {
        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setProcessingPayment(false);
    }
  };

  // Handle Pay Later option
  const handlePayLater = async () => {
    if (!pendingBookingPayload) {
      alert('Booking details are not ready. Please review the preview step again.');
      return;
    }

    try {
      await createBookingRecord({
        paymentStatus: 'pending',
        paymentMethod: 'pay_later'
      });
    } catch (error) {
      console.error('Pay later error:', error);
    }
  };

  const openInsuranceModal = () => {
    setInsuranceForm({
      companyName: shipmentDetails.insuranceCompanyName,
      policyNumber: shipmentDetails.insurancePolicyNumber,
      policyDate: shipmentDetails.insurancePolicyDate,
      validUpto: shipmentDetails.insuranceValidUpto,
      premiumAmount: shipmentDetails.insurancePremiumAmount,
      document: shipmentDetails.insuranceDocument,
      documentName: shipmentDetails.insuranceDocumentName
    });
    setInsuranceFormError('');
    setIsPremiumAmountFocused(false);
    setInsuranceModalOpen(true);
  };

  const handleInsuranceSelection = (value: string) => {
    if (value === 'With insurance') {
      setShipmentDetails((prev) => ({
        ...prev,
        insurance: value,
        riskCoverage: 'Carrier',
        packagesCount: '',
        materials: '',
        others: '',
        description: '',
        weight: '',
        length: '',
        width: '',
        height: ''
      }));
      openInsuranceModal();
      return;
    }

    setInsuranceModalOpen(false);
    setInsuranceFormError('');
    setInsuranceForm({
      companyName: '',
      policyNumber: '',
      policyDate: '',
      validUpto: '',
      premiumAmount: '',
      document: null,
      documentName: ''
    });
    setShipmentDetails((prev) => ({
      ...prev,
      insurance: value,
      riskCoverage: 'Owner',
      packagesCount: '',
      materials: '',
      others: '',
      description: '',
      weight: '',
      length: '',
      width: '',
      height: '',
      insuranceCompanyName: '',
      insurancePolicyNumber: '',
      insurancePolicyDate: '',
      insuranceValidUpto: '',
      insurancePremiumAmount: '',
      insuranceDocumentName: '',
      insuranceDocument: null
    }));
  };

  const handleInsuranceFormSave = () => {
    if (
      !insuranceForm.companyName.trim() ||
      !insuranceForm.policyNumber.trim() ||
      !insuranceForm.policyDate.trim() ||
      !insuranceForm.validUpto.trim() ||
      !insuranceForm.document
    ) {
      setInsuranceFormError('Please complete all required fields before saving.');
      return;
    }

    setShipmentDetails((prev) => ({
      ...prev,
      insurance: 'With insurance',
      insuranceCompanyName: insuranceForm.companyName.trim(),
      insurancePolicyNumber: insuranceForm.policyNumber.trim(),
      insurancePolicyDate: insuranceForm.policyDate,
      insuranceValidUpto: insuranceForm.validUpto,
      insurancePremiumAmount: insuranceForm.premiumAmount.trim(),
      insuranceDocument: insuranceForm.document,
      insuranceDocumentName: insuranceForm.documentName
    }));
    setInsuranceModalOpen(false);
    setInsuranceFormError('');
  };

  const handleInsuranceFormCancel = () => {
    // Cleanup preview URL if open
    if (documentPreviewUrl) {
      URL.revokeObjectURL(documentPreviewUrl);
      setDocumentPreviewUrl(null);
    }
    setDocumentPreviewOpen(false);

    const hasSavedInsurance =
      Boolean(shipmentDetails.insuranceCompanyName) ||
      Boolean(shipmentDetails.insurancePolicyNumber) ||
      Boolean(shipmentDetails.insurancePolicyDate) ||
      Boolean(shipmentDetails.insuranceDocument);

    if (!hasSavedInsurance) {
      setInsuranceForm({
        companyName: '',
        policyNumber: '',
        policyDate: '',
        validUpto: '',
        premiumAmount: '',
        document: null,
        documentName: ''
      });
      setShipmentDetails((prev) => ({
        ...prev,
        insurance: 'Without insurance',
        riskCoverage: 'Owner',
        packagesCount: '',
        materials: '',
        others: '',
        description: '',
        weight: '',
        length: '',
        width: '',
        height: '',
        insuranceCompanyName: '',
        insurancePolicyNumber: '',
        insurancePolicyDate: '',
        insurancePremiumAmount: '',
        insuranceDocumentName: '',
        insuranceDocument: null
      }));
    }

    setInsuranceModalOpen(false);
    setInsuranceFormError('');
  };
  
  const lengthValue = useMemo(() => parseFloat(shipmentDetails.length) || 0, [shipmentDetails.length]);
  const widthValue = useMemo(() => parseFloat(shipmentDetails.width) || 0, [shipmentDetails.width]);
  const heightValue = useMemo(() => parseFloat(shipmentDetails.height) || 0, [shipmentDetails.height]);
  const actualWeight = useMemo(() => parseFloat(shipmentDetails.weight) || 0, [shipmentDetails.weight]);
  const volumetricWeight = useMemo(() => {
    if (!lengthValue || !widthValue || !heightValue) {
      return 0;
    }
    const volume = lengthValue * widthValue * heightValue;
    if (!Number.isFinite(volume) || volume <= 0) {
      return 0;
    }
    const calculated = volume / VOLUMETRIC_DIVISOR;
    if (!Number.isFinite(calculated) || calculated <= 0) {
      return 0;
    }
    return parseFloat(calculated.toFixed(2));
  }, [heightValue, lengthValue, widthValue]);
  const chargeableWeight = useMemo(() => {
    const weight = Math.max(actualWeight, volumetricWeight);
    if (!Number.isFinite(weight) || weight <= 0) {
      return 0;
    }
    return parseFloat(weight.toFixed(2));
  }, [actualWeight, volumetricWeight]);
  const formattedVolumetricWeight = volumetricWeight > 0 ? volumetricWeight.toFixed(2) : null;
  const formattedActualWeight = actualWeight > 0 ? actualWeight.toFixed(2) : null;
  const formattedChargeableWeight = chargeableWeight > 0 ? chargeableWeight.toFixed(2) : null;
  const displayVolumetricWeight = formattedVolumetricWeight ? `${formattedVolumetricWeight} Kg.` : '0 Kg.';
  const displayActualWeight = formattedActualWeight ? `${formattedActualWeight} Kg.` : '0 Kg.';
  const displayChargeableWeight = formattedChargeableWeight ? `${formattedChargeableWeight} Kg.` : '0 Kg.';

  // Image upload states
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]); // S3 URLs for uploaded images
  const [uploadedInsuranceDocumentUrl, setUploadedInsuranceDocumentUrl] = useState<string | null>(null); // S3 URL for insurance document
  const [uploadedDeclarationDocumentUrl, setUploadedDeclarationDocumentUrl] = useState<string | null>(null); // S3 URL for declaration document
  const [savingBooking, setSavingBooking] = useState(false); // Loading state for saving booking
  
  // Track current section being worked on (origin or destination)
  const [currentSection, setCurrentSection] = useState<'origin' | 'destination'>('origin');

  // Shipping mode & pricing states
  const [selectedMode, setSelectedMode] = useState<'byAir' | 'byTrain' | 'byRoad' | ''>('');
  const [selectedServiceType, setSelectedServiceType] = useState<'standard' | 'priority' | ''>('');
  const [availableModes, setAvailableModes] = useState<{ byAir: boolean; byTrain: boolean; byRoad: boolean } | null>(null);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<{ standard: boolean; priority: boolean } | null>(null);
  const [customerPricing, setCustomerPricing] = useState<any>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  // Inline editing states for Preview step
  const [editingSection, setEditingSection] = useState<'origin' | 'destination' | 'shipment' | 'package' | 'shipping' | null>(null);

  useEffect(() => {
    if (originAreas.length > 0 && !originData.area) {
      setOriginData((prev) => ({ ...prev, area: originAreas[0] }));
    }
  }, [originAreas, originData.area]);

  useEffect(() => {
    if (destinationAreas.length > 0 && !destinationData.area) {
      setDestinationData((prev) => ({ ...prev, area: destinationAreas[0] }));
    }
  }, [destinationAreas, destinationData.area]);

  // Helper to parse backend pincode response
  const parsePincodeResponse = (data: any) => {
    try {
      if (!data || typeof data !== 'object') {
        return { state: '', city: '', district: '', areas: [] };
      }
      
      const state: string = data?.state || '';
      const citiesObj = data?.cities || {};
      const firstCityKey = citiesObj && Object.keys(citiesObj).length > 0 ? Object.keys(citiesObj)[0] : '';
      const city: string = firstCityKey || '';
      const districtsObj = firstCityKey ? citiesObj[firstCityKey]?.districts || {} : {};
      const firstDistrictKey = districtsObj && Object.keys(districtsObj).length > 0 ? Object.keys(districtsObj)[0] : '';
      const district: string = firstDistrictKey || '';
      const areasArr = firstDistrictKey ? districtsObj[firstDistrictKey]?.areas || [] : [];
      const areas: string[] = Array.isArray(areasArr) ? areasArr.map((a: any) => a?.name || '').filter(Boolean) : [];
      
      return { state, city, district, areas };
    } catch (error) {
      console.error('Error parsing pincode response:', error);
      return { state: '', city: '', district: '', areas: [] };
    }
  };

  // Check pincode serviceability
  const checkPincodeServiceability = async (pincode: string, type: 'origin' | 'destination') => {
    if (pincode.length !== 6) {
      if (type === 'origin') {
        setOriginServiceable(null);
        setOriginAddressInfo('');
      } else {
        setDestinationServiceable(null);
        setDestinationAddressInfo('');
      }
      return;
    }

    if (type === 'origin') {
      setCheckingOrigin(true);
    } else {
      setCheckingDestination(true);
    }

    try {
      const { data } = await axios.get(`${API_BASE}/api/pincode/${pincode}`);
      const isServiceable = !!data;
      const parsed = isServiceable ? parsePincodeResponse(data) : { state: '', city: '', district: '', areas: [] };

      if (type === 'origin') {
        setOriginServiceable(isServiceable);
        if (isServiceable) {
          setOriginData(prev => ({
            ...prev,
            pincode: pincode,
            city: parsed.city,
            district: parsed.district,
            state: parsed.state
          }));
          setOriginAreas(parsed.areas);
          setOriginAddressInfo(`${parsed.city}, ${parsed.state}`);
        } else {
          setOriginAreas([]);
          setOriginAddressInfo('');
        }
      } else {
        setDestinationServiceable(isServiceable);
        if (isServiceable) {
          setDestinationData(prev => ({
            ...prev,
            pincode: pincode,
            city: parsed.city,
            district: parsed.district,
            state: parsed.state
          }));
          setDestinationAreas(parsed.areas);
          setDestinationAddressInfo(`${parsed.city}, ${parsed.state}`);
        } else {
          setDestinationAreas([]);
          setDestinationAddressInfo('');
        }
      }
    } catch (e) {
      if (type === 'origin') {
        setOriginServiceable(false);
        setOriginAddressInfo('');
      } else {
        setDestinationServiceable(false);
        setDestinationAddressInfo('');
      }
    } finally {
      if (type === 'origin') {
        setCheckingOrigin(false);
      } else {
        setCheckingDestination(false);
      }
    }
  };

  // Handle origin pincode change
  const handleOriginPincodeChange = (value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 6) return;
    setOriginPincode(value);
    if (value.length === 6) {
      checkPincodeServiceability(value, 'origin');
    } else {
      setOriginServiceable(null);
      setOriginAddressInfo('');
      setOriginAreas([]);
    }
  };

  // Handle destination pincode change
  const handleDestinationPincodeChange = (value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 6) return;
    setDestinationPincode(value);
    if (value.length === 6) {
      checkPincodeServiceability(value, 'destination');
    } else {
      setDestinationServiceable(null);
      setDestinationAddressInfo('');
      setDestinationAreas([]);
    }
  };

  const getDigitInputId = (type: 'origin' | 'destination', index: number) => `${type}-modal-digit-${index}`;

  // Search by phone number
  const searchByPhoneNumber = async (phoneNumber: string, type: 'origin' | 'destination') => {
    if (phoneNumber.length !== 10) return;
    
    // Prevent duplicate searches for the same phone number
    if (phoneSearchModalOpen.type === type && phoneSearchModalOpen.phoneNumber === phoneNumber) {
      return;
    }
    
    try {
      setSearchingPhone(true);
      const response = await fetch(`${API_BASE}/api/customer-booking/search-by-phone?phoneNumber=${phoneNumber}&type=${type}`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Phone number found - show preview modal directly with records
        setPhoneSearchResults(data.data);
        setPhoneSearchModalOpen({ type, phoneNumber }); // Set this so we can track which type has results
        setSelectedRecordIndex(0); // Select first record by default
        // Auto-fill with first record (don't close modals, we'll handle that)
        handleSelectPhoneRecord(data.data[0], type, false);
        // Close phone modal and open form modal in preview mode
        setPhoneModalOpen({ type: null });
        setTimeout(() => {
          setFormModalOpen({ type });
          setShowPreviewInModal(true);
        }, 300);
      } else {
        // No results found - open blank form
        setPhoneSearchResults([]);
        setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
        // Close phone modal and open form modal
        setPhoneModalOpen({ type: null });
        setTimeout(() => {
          setFormModalOpen({ type });
        }, 300);
      }
    } catch (error) {
      console.error('Error searching by phone number:', error);
      // On error, open blank form
      setPhoneSearchResults([]);
      setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
      // Close phone modal and open form modal
      setPhoneModalOpen({ type: null });
      setTimeout(() => {
        setFormModalOpen({ type });
      }, 300);
    } finally {
      setSearchingPhone(false);
    }
  };

  // Auto-fill form with selected record (used internally, not for closing modals)
  const handleSelectPhoneRecord = (record: any, type: 'origin' | 'destination', closeModals: boolean = true) => {
    if (type === 'origin') {
      setOriginData(prev => ({
        ...prev,
        name: record.name || '',
        email: record.email || '',
        companyName: record.companyName || '',
        flatBuilding: record.flatBuilding || '',
        locality: record.locality || '',
        landmark: record.landmark || '',
        pincode: record.pincode || '',
        area: record.area || '',
        city: record.city || '',
        district: record.district || '',
        state: record.state || '',
        gstNumber: record.gstNumber || '',
        alternateNumbers: record.alternateNumbers || [''],
        addressType: record.addressType || 'Home',
        birthday: record.birthday || '',
        anniversary: record.anniversary || '',
        website: record.website || '',
        otherAlternateNumber: record.otherAlternateNumber || ''
      }));
      
      // Set pincode for serviceability check
      if (record.pincode) {
        setOriginPincode(record.pincode);
      }
    } else {
      setDestinationData(prev => ({
        ...prev,
        name: record.name || '',
        email: record.email || '',
        companyName: record.companyName || '',
        flatBuilding: record.flatBuilding || '',
        locality: record.locality || '',
        landmark: record.landmark || '',
        pincode: record.pincode || '',
        area: record.area || '',
        city: record.city || '',
        district: record.district || '',
        state: record.state || '',
        gstNumber: record.gstNumber || '',
        alternateNumbers: record.alternateNumbers || [''],
        addressType: record.addressType || 'Home',
        birthday: record.birthday || '',
        anniversary: record.anniversary || '',
        website: record.website || '',
        otherAlternateNumber: record.otherAlternateNumber || ''
      }));
      
      // Set pincode for serviceability check
      if (record.pincode) {
        setDestinationPincode(record.pincode);
      }
    }
    
    // Only close modals if explicitly requested (when called from search results modal)
    if (closeModals) {
      // Close the search modal and phone modal
      setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
      setPhoneSearchResults([]);
      setPhoneModalOpen({ type: null });
      
      // If origin is complete, automatically move to destination section
      if (type === 'origin') {
        setCurrentSection('destination');
      }
    }
  };

  // Handle origin mobile digit change
  const handleOriginDigitChange = (index: number, value: string) => {
    // Handle paste - if value is longer than 1, it might be a paste
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      const newDigits = Array(10).fill('');
      digits.split('').forEach((digit, i) => {
        if (i < 10) newDigits[i] = digit;
      });
      setOriginMobileDigits(newDigits);
      
      const mobileNumber = newDigits.filter(digit => digit !== '').join('');
      setOriginData(prev => ({ ...prev, mobileNumber }));
      
      // Focus the next empty input or the last one
      const nextEmptyIndex = newDigits.findIndex((d, i) => i >= index && d === '');
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(index + digits.length, 9);
      setTimeout(() => {
        const nextInput = document.getElementById(getDigitInputId('origin', focusIndex));
        nextInput?.focus();
      }, 0);
      return;
    }
    
    if (!/^[0-9]*$/.test(value)) return;
    
    const newDigits = [...originMobileDigits];
    newDigits[index] = value;
    setOriginMobileDigits(newDigits);
    
    if (value && index < 9) {
      setTimeout(() => {
        const nextInput = document.getElementById(getDigitInputId('origin', index + 1));
        nextInput?.focus();
      }, 0);
    }
    
    const mobileNumber = newDigits.filter(digit => digit !== '').join('');
    setOriginData(prev => ({ ...prev, mobileNumber }));
    
    // Trigger search when phone number is complete (10 digits)
    if (mobileNumber.length === 10) {
      searchByPhoneNumber(mobileNumber, 'origin');
    } else {
      // Clear search results if phone number is incomplete
      setPhoneSearchResults([]);
      setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
    }
  };

  const handleOriginDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!originMobileDigits[index] && index > 0) {
        e.preventDefault();
        const prevInput = document.getElementById(getDigitInputId('origin', index - 1));
        prevInput?.focus();
        // Clear previous digit
        const newDigits = [...originMobileDigits];
        newDigits[index - 1] = '';
        setOriginMobileDigits(newDigits);
        const mobileNumber = newDigits.filter(digit => digit !== '').join('');
        setOriginData(prev => ({ ...prev, mobileNumber }));
        
        // Clear search results if phone number becomes incomplete
        if (mobileNumber.length < 10) {
          setPhoneSearchResults([]);
          setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
        }
      } else if (originMobileDigits[index]) {
        // Clear current digit
        const newDigits = [...originMobileDigits];
        newDigits[index] = '';
        setOriginMobileDigits(newDigits);
        const mobileNumber = newDigits.filter(digit => digit !== '').join('');
        setOriginData(prev => ({ ...prev, mobileNumber }));
        
        // Clear search results if phone number becomes incomplete
        if (mobileNumber.length < 10) {
          setPhoneSearchResults([]);
          setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
        }
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      const prevInput = document.getElementById(getDigitInputId('origin', index - 1));
      prevInput?.focus();
    } else if (e.key === 'ArrowRight' && index < 9) {
      e.preventDefault();
      const nextInput = document.getElementById(getDigitInputId('origin', index + 1));
      nextInput?.focus();
    }
  };

  const handleOriginDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 10);
    const newDigits = Array(10).fill('');
    digits.split('').forEach((digit, i) => {
      if (i < 10) newDigits[i] = digit;
    });
    setOriginMobileDigits(newDigits);
    const mobileNumber = newDigits.filter(digit => digit !== '').join('');
    setOriginData(prev => ({ ...prev, mobileNumber }));
    
    // Trigger search when phone number is complete (10 digits)
    if (mobileNumber.length === 10) {
      searchByPhoneNumber(mobileNumber, 'origin');
    } else {
      // Clear search results if phone number is incomplete
      setPhoneSearchResults([]);
      setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
    }
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newDigits.findIndex(d => d === '');
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 9;
    setTimeout(() => {
      const nextInput = document.getElementById(getDigitInputId('origin', focusIndex));
      nextInput?.focus();
    }, 0);
  };

  // Handle destination mobile digit change
  const handleDestinationDigitChange = (index: number, value: string) => {
    // Handle paste - if value is longer than 1, it might be a paste
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      const newDigits = Array(10).fill('');
      digits.split('').forEach((digit, i) => {
        if (i < 10) newDigits[i] = digit;
      });
      setDestinationMobileDigits(newDigits);
      
      const mobileNumber = newDigits.filter(digit => digit !== '').join('');
      setDestinationData(prev => ({ ...prev, mobileNumber }));
      
      // Focus the next empty input or the last one
      const nextEmptyIndex = newDigits.findIndex((d, i) => i >= index && d === '');
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(index + digits.length, 9);
      setTimeout(() => {
        const nextInput = document.getElementById(getDigitInputId('destination', focusIndex));
        nextInput?.focus();
      }, 0);
      return;
    }
    
    if (!/^[0-9]*$/.test(value)) return;
    
    const newDigits = [...destinationMobileDigits];
    newDigits[index] = value;
    setDestinationMobileDigits(newDigits);
    
    if (value && index < 9) {
      setTimeout(() => {
        const nextInput = document.getElementById(getDigitInputId('destination', index + 1));
        nextInput?.focus();
      }, 0);
    }
    
    const mobileNumber = newDigits.filter(digit => digit !== '').join('');
    setDestinationData(prev => ({ ...prev, mobileNumber }));
    
    // Trigger search when phone number is complete (10 digits)
    if (mobileNumber.length === 10) {
      searchByPhoneNumber(mobileNumber, 'destination');
    } else {
      // Clear search results if phone number is incomplete
      setPhoneSearchResults([]);
      setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
    }
  };

  const handleDestinationDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!destinationMobileDigits[index] && index > 0) {
        e.preventDefault();
        const prevInput = document.getElementById(getDigitInputId('destination', index - 1));
        prevInput?.focus();
        // Clear previous digit
        const newDigits = [...destinationMobileDigits];
        newDigits[index - 1] = '';
        setDestinationMobileDigits(newDigits);
        const mobileNumber = newDigits.filter(digit => digit !== '').join('');
        setDestinationData(prev => ({ ...prev, mobileNumber }));
        
        // Clear search results if phone number becomes incomplete
        if (mobileNumber.length < 10) {
          setPhoneSearchResults([]);
          setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
        }
      } else if (destinationMobileDigits[index]) {
        // Clear current digit
        const newDigits = [...destinationMobileDigits];
        newDigits[index] = '';
        setDestinationMobileDigits(newDigits);
        const mobileNumber = newDigits.filter(digit => digit !== '').join('');
        setDestinationData(prev => ({ ...prev, mobileNumber }));
        
        // Clear search results if phone number becomes incomplete
        if (mobileNumber.length < 10) {
          setPhoneSearchResults([]);
          setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
        }
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      const prevInput = document.getElementById(getDigitInputId('destination', index - 1));
      prevInput?.focus();
    } else if (e.key === 'ArrowRight' && index < 9) {
      e.preventDefault();
      const nextInput = document.getElementById(getDigitInputId('destination', index + 1));
      nextInput?.focus();
    }
  };

  const handleDestinationDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 10);
    const newDigits = Array(10).fill('');
    digits.split('').forEach((digit, i) => {
      if (i < 10) newDigits[i] = digit;
    });
    setDestinationMobileDigits(newDigits);
    const mobileNumber = newDigits.filter(digit => digit !== '').join('');
    setDestinationData(prev => ({ ...prev, mobileNumber }));
    
    // Trigger search when phone number is complete (10 digits)
    if (mobileNumber.length === 10) {
      searchByPhoneNumber(mobileNumber, 'destination');
    } else {
      // Clear search results if phone number is incomplete
      setPhoneSearchResults([]);
      setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
    }
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newDigits.findIndex(d => d === '');
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 9;
    setTimeout(() => {
      const nextInput = document.getElementById(getDigitInputId('destination', focusIndex));
      nextInput?.focus();
    }, 0);
  };

  const handleAlternateNumberChange = (
    type: 'origin' | 'destination',
    index: number,
    value: string
  ) => {
    if (type === 'origin') {
      setOriginData((prev) => {
        const updated = [...(prev.alternateNumbers || [])];
        updated[index] = value;
        return { ...prev, alternateNumbers: updated };
      });
    } else {
      setDestinationData((prev) => {
        const updated = [...(prev.alternateNumbers || [])];
        updated[index] = value;
        return { ...prev, alternateNumbers: updated };
      });
    }
  };

  const addAlternateNumber = (type: 'origin' | 'destination') => {
    if (type === 'origin') {
      setOriginData((prev) => ({
        ...prev,
        alternateNumbers: [...(prev.alternateNumbers || []), ''],
      }));
    } else {
      setDestinationData((prev) => ({
        ...prev,
        alternateNumbers: [...(prev.alternateNumbers || []), ''],
      }));
    }
  };

  const removeAlternateNumber = (type: 'origin' | 'destination', index: number) => {
    if (type === 'origin') {
      setOriginData((prev) => {
        const updated = [...(prev.alternateNumbers || [])];
        updated.splice(index, 1);
        return { ...prev, alternateNumbers: updated.length ? updated : [''] };
      });
    } else {
      setDestinationData((prev) => {
        const updated = [...(prev.alternateNumbers || [])];
        updated.splice(index, 1);
        return { ...prev, alternateNumbers: updated.length ? updated : [''] };
      });
    }
  };

  const isOriginPhoneComplete = originData.mobileNumber.length === 10;
  const isDestinationPhoneComplete = destinationData.mobileNumber.length === 10;

  const isOriginFormComplete = isOriginPhoneComplete && [
    originData.name,
    originData.flatBuilding,
    originData.locality,
    originData.area,
    originData.city,
    originData.state,
  ].every((field) => field && String(field).trim().length > 0);

  const isDestinationFormComplete = isDestinationPhoneComplete && [
    destinationData.name,
    destinationData.flatBuilding,
    destinationData.locality,
    destinationData.area,
    destinationData.city,
    destinationData.state,
  ].every((field) => field && String(field).trim().length > 0);

  const canProceedAddresses = isOriginFormComplete && isDestinationFormComplete;

  const hasPackageBasics =
    shipmentDetails.packagesCount && String(shipmentDetails.packagesCount).trim().length > 0 &&
    shipmentDetails.materials && String(shipmentDetails.materials).trim().length > 0;
  const hasDeclaredValue = shipmentDetails.declaredValue && String(shipmentDetails.declaredValue).trim().length > 0;
  const hasDeclarationDocument = shipmentDetails.declarationDocument !== null;
  const hasDimensions =
    shipmentDetails.length && String(shipmentDetails.length).trim().length > 0 &&
    shipmentDetails.width && String(shipmentDetails.width).trim().length > 0 &&
    shipmentDetails.height && String(shipmentDetails.height).trim().length > 0;
  const hasActualWeight = shipmentDetails.weight && String(shipmentDetails.weight).trim().length > 0;

  const isPackageInfoComplete = Boolean(
    hasPackageBasics && 
    hasDeclaredValue && 
    hasDeclarationDocument && 
    (hasDimensions || hasActualWeight)
  );

  const canSaveInsuranceForm = Boolean(
    insuranceForm.companyName.trim() &&
    insuranceForm.policyNumber.trim() &&
    insuranceForm.policyDate.trim() &&
    insuranceForm.document
  );

  const requiresInsuranceDetails = shipmentDetails.insurance === 'With insurance';
  const hasInsuranceDetails = !requiresInsuranceDetails || (
    shipmentDetails.insuranceCompanyName.trim().length > 0 &&
    shipmentDetails.insurancePolicyNumber.trim().length > 0 &&
    shipmentDetails.insurancePolicyDate.trim().length > 0 &&
    shipmentDetails.insuranceDocument !== null
  );

  const isShipmentStepComplete = Boolean(
    shipmentDetails.natureOfConsignment &&
    shipmentDetails.insurance &&
    shipmentDetails.riskCoverage &&
    hasInsuranceDetails
  );

  const isPackageStepComplete = isPackageInfoComplete;

  const addressTypeOptions = ['HOME', 'OFFICE', 'OTHERS'];
  const natureOptions = [
    {
      value: 'DOX',
      title: 'Documents',
      description: 'Important papers, legal documents and lightweight document shipments.',
      icon: FileText
    },
    {
      value: 'NON-DOX',
      title: 'Parcel ',
      description: 'Merchandise, parcels, samples and any non-document consignments.',
      icon: Package
    }
  ];

  const insuranceOptions = [
    {
      value: 'Without insurance',
      title: 'Without Insurance',
      icon: Shield
    },
    {
      value: 'With insurance',
      title: 'With Insurance',
      description: 'Shipment Insurance is covered by the Consignor/Consignee.',
      icon: ShieldCheck
    }
  ];

  const riskCoverageOptions = [
    {
      value: 'Owner',
      title: 'Owner Risk',
      description: 'Consignor/Consignee agrees to bear any transit Damage, Lost etc.',
      icon: Shield
    },
    {
      value: 'Carrier',
      title: 'Carrier Risk',
      description: 'Carrier takes responsibility for transit risk as per policy.',
      icon: ShieldCheck
    }
  ];

  const renderAddressCard = (type: 'origin' | 'destination') => {
    const isOrigin = type === 'origin';
    const data = isOrigin ? originData : destinationData;
    const isFormComplete = isOrigin ? isOriginFormComplete : isDestinationFormComplete;
    const cardTitle = isOrigin ? 'Select Sender Address' : 'Select Recipient Address';
    
    // In step 5 (Review & Submit), show both origin and destination cards
    if (currentStep === 5) {
      // Show both cards in review step
      if (!isFormComplete) {
        return null;
      }
    } else {
      // In step 1, only show destination card when both are complete (for final preview)
      if (type === 'origin') {
        return null; // Don't show origin card at the end of step 1
      }
      
      // Only show destination preview card when both forms are complete
      if (!isDestinationFormComplete) {
        return null;
      }
    }
    
    // Show the minimized design for destination
    if (isFormComplete) {
    return (
      <div
        className={cn(
            'rounded-3xl border overflow-hidden transition-all duration-300 shadow-[0_25px_80px_rgba(15,23,42,0.15)]',
          isDarkMode
              ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90'
              : 'border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-blue-50/20'
          )}
        >
          {/* Header */}
          <div
              className={cn(
              'px-6 py-4 border-b',
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-500/20 via-blue-400/10 to-transparent border-slate-800/60' 
                : 'bg-gradient-to-r from-blue-50 via-blue-50/50 to-transparent border-slate-200/60'
            )}
          >
            <h3 className={cn(
              'text-base font-semibold uppercase tracking-wide',
              isDarkMode ? 'text-slate-200' : 'text-slate-800'
            )}>
                {cardTitle}
            </h3>
          </div>
          
          {/* Address Content */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Radio button and Name Section */}
              <div className="flex items-start gap-4">
                {/* Radio button placeholder */}
                <div className="mt-1 flex-shrink-0">
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    isDarkMode ? 'border-blue-500/50' : 'border-blue-400'
                  )}>
                    <div className={cn(
                      'w-2.5 h-2.5 rounded-full',
                      isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                    )} />
                  </div>
                </div>
                
                {/* Name and Address Type */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h4 className={cn(
                      'text-lg font-bold',
                      isDarkMode ? 'text-slate-100' : 'text-slate-900'
                    )}>
                    {data.name}
                    </h4>
                    {data.addressType && (
                      <span className={cn(
                        'px-3 py-1 rounded-none text-xs font-semibold uppercase',
                        isDarkMode
                          ? 'bg-blue-500/20 text-black border border-blue-400/30'
                          : 'bg-blue-100 text-black border border-blue-200'
                      )}>
                        {data.addressType}
                      </span>
                    )}
                  </div>
                  
                  {/* Company Name */}
                  {data.companyName && (
                    <p className={cn(
                      'text-sm font-medium mb-2',
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    )}>
                      <Building className="h-3.5 w-3.5 inline mr-1.5" />
                      {data.companyName}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Address Details */}
              <div className={cn(
                'p-4 rounded-xl border',
                isDarkMode 
                  ? 'bg-slate-800/40 border-slate-700/50' 
                  : 'bg-slate-50/80 border-slate-200/60'
              )}>
                <div className="space-y-3">
                  {/* Full Address */}
                  <div className="flex items-start gap-2">
                    <MapPin className={cn(
                      'h-4 w-4 mt-0.5 flex-shrink-0',
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    )} />
                    <div className="flex-1">
                      <p className={cn(
                        'text-sm leading-relaxed font-medium',
                        isDarkMode ? 'text-slate-200' : 'text-slate-800'
                      )}>
                        {data.flatBuilding}
                      </p>
                      <p className={cn(
                        'text-sm leading-relaxed',
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      )}>
                        {data.locality}, {data.area}
                      </p>
                      <p className={cn(
                        'text-sm leading-relaxed',
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      )}>
                        {data.city}, {data.district}, {data.state} - {data.pincode}
                      </p>
                      {data.landmark && (
                        <p className={cn(
                          'text-xs mt-1 italic',
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        )}>
                          Landmark: {data.landmark}
                </p>
              )}
            </div>
          </div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className={cn(
                'p-4 rounded-xl border',
                  isDarkMode
                  ? 'bg-slate-800/40 border-slate-700/50' 
                  : 'bg-slate-50/80 border-slate-200/60'
              )}>
                <div className="space-y-2.5">
                  {/* Primary Phone */}
                  <div className="flex items-center gap-2">
                    <Phone className={cn(
                      'h-4 w-4 flex-shrink-0',
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    )} />
                    <span className={cn(
                      'text-sm font-medium',
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    )}>
                      +91 {data.mobileNumber}
                    </span>
                  </div>
                  
                  {/* Email */}
                  {data.email && (
                    <div className="flex items-center gap-2">
                      <Mail className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      )} />
                      <span className={cn(
                        'text-sm',
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      )}>
                        {data.email}
                      </span>
                    </div>
                  )}
                  
                  {/* Alternate Numbers */}
                  {data.alternateNumbers && data.alternateNumbers.filter(num => num.trim()).length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className={cn(
                        'text-xs font-medium mb-1',
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      )}>
                        Alternate Numbers:
                      </p>
                      {data.alternateNumbers.filter(num => num.trim()).map((number, idx) => (
                        <div key={idx} className="flex items-center gap-2 pl-6">
                          <Phone className={cn(
                            'h-3.5 w-3.5 flex-shrink-0',
                            isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          )} />
                          <span className={cn(
                            'text-sm',
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          )}>
                            {number}
              </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Additional Details */}
              {(data.gstNumber || data.website || data.birthday || data.anniversary) && (
                <div className={cn(
                  'p-4 rounded-xl border',
                  isDarkMode 
                    ? 'bg-slate-800/40 border-slate-700/50' 
                    : 'bg-slate-50/80 border-slate-200/60'
                )}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* GST Number */}
                    {data.gstNumber && (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-xs font-medium',
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        )}>
                          GST:
                        </span>
                        <span className={cn(
                          'text-sm',
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        )}>
                          {data.gstNumber}
                        </span>
                      </div>
                    )}
                    
                    {/* Website */}
                    {data.website && (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-xs font-medium',
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        )}>
                          Website:
                        </span>
                        <a 
                          href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                className={cn(
                            'text-sm underline hover:opacity-80',
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          )}
                        >
                          {data.website}
                        </a>
                      </div>
                    )}
                    
                    {/* Birthday */}
                    {data.birthday && (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-xs font-medium',
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        )}>
                          Birthday:
              </span>
                        <span className={cn(
                          'text-sm',
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        )}>
                          {new Date(data.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                    
                    {/* Anniversary */}
                    {data.anniversary && (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-xs font-medium',
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        )}>
                          Anniversary:
                        </span>
                        <span className={cn(
                          'text-sm',
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        )}>
                          {new Date(data.anniversary).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    );
    }
    
    return null;
  };

  // Handle card click - open phone modal if phone not complete, else open form modal
  const handleCardClick = (type: 'origin' | 'destination') => {
    // Only allow clicking on the current section
    if (type === 'destination' && !isOriginFormComplete) {
      return; // Don't allow clicking destination until origin is complete
    }
    
    const isPhoneComplete = type === 'origin' ? isOriginPhoneComplete : isDestinationPhoneComplete;
    if (!isPhoneComplete) {
      setPhoneModalOpen({ type });
      setCurrentSection(type);
    } else {
      setFormModalOpen({ type });
      setCurrentSection(type);
    }
  };

  // Handle phone complete - close phone modal and open form modal
  // BUT only if there are no search results to show
  // Note: searchByPhoneNumber now handles opening the form modal when no results are found
  // This useEffect only handles the case when phone modal is opened manually (e.g., clicking card) 
  // and phone is already complete but search hasn't been triggered yet
  useEffect(() => {
    if (phoneModalOpen.type) {
      const isPhoneComplete = phoneModalOpen.type === 'origin' ? isOriginPhoneComplete : isDestinationPhoneComplete;
      if (isPhoneComplete) {
        // Don't auto-open form modal if we have search results to show
        const hasSearchResults = phoneSearchModalOpen.type === phoneModalOpen.type && phoneSearchResults.length > 0;
        
        // If phone is complete and no search results, trigger search
        // searchByPhoneNumber will handle opening form modal if no results found
        if (!hasSearchResults && !searchingPhone) {
          const phoneNumber = phoneModalOpen.type === 'origin' 
            ? originData.mobileNumber 
            : destinationData.mobileNumber;
          
          // Check if search was already done for this phone number
          const searchAlreadyDone = phoneSearchModalOpen.phoneNumber === phoneNumber && 
            phoneSearchModalOpen.type === phoneModalOpen.type;
          
          if (phoneNumber && phoneNumber.length === 10 && !searchAlreadyDone) {
            // Trigger search - it will handle opening form if no results
            searchByPhoneNumber(phoneNumber, phoneModalOpen.type);
          }
        }
      }
    }
  }, [isOriginPhoneComplete, isDestinationPhoneComplete, phoneModalOpen.type, phoneSearchModalOpen.type, phoneSearchModalOpen.phoneNumber, phoneSearchResults.length, searchingPhone, originData.mobileNumber, destinationData.mobileNumber]);

  // Auto-advance from origin to destination when origin form is complete (only for section tracking)
  useEffect(() => {
    if (isOriginFormComplete && currentSection === 'origin') {
      setCurrentSection('destination');
    }
  }, [isOriginFormComplete, currentSection]);

  // Auto-open origin phone modal when entering step 1 if origin phone is not complete
  useEffect(() => {
    if (currentStep === 1 && !isOriginPhoneComplete && !phoneModalOpen.type && !formModalOpen.type && !showPreviewInModal) {
      setTimeout(() => {
        setPhoneModalOpen({ type: 'origin' });
      }, 300);
    }
  }, [currentStep, isOriginPhoneComplete, phoneModalOpen.type, formModalOpen.type, showPreviewInModal]);

  // Auto-advance from step 1 to step 2 when destination form is completed
  useEffect(() => {
    if (currentStep === 1 && canProceedAddresses && !formModalOpen.type && !showPreviewInModal) {
      const newCompleted = [...completedSteps];
      newCompleted[1] = true;
      setCompletedSteps(newCompleted);
      setTimeout(() => {
        setCurrentStep(2);
      }, 500);
    }
  }, [currentStep, canProceedAddresses, formModalOpen.type, showPreviewInModal, completedSteps]);

  // Fetch pincode data with modes and customer pricing when entering step 4
  useEffect(() => {
    if (currentStep === 4 && destinationPincode.length === 6) {
      const fetchPincodeData = async () => {
        try {
          setLoadingPricing(true);
          const { data } = await axios.get(`${API_BASE}/api/pincode/${destinationPincode}`);
          if (data && data.modes) {
            setAvailableModes(data.modes);
            setAvailableServiceTypes({
              standard: data.standardAvailable || false,
              priority: data.priorityAvailable || false
            });
          }
        } catch (error) {
          console.error('Error fetching pincode data:', error);
        }
      };

      const fetchCustomerPricing = async () => {
        try {
          const { data } = await axios.get(`${API_BASE}/api/admin/customer-pricing/public`);
          if (data && data.success) {
            setCustomerPricing(data.data);
          }
        } catch (error) {
          console.error('Error fetching customer pricing:', error);
        } finally {
          setLoadingPricing(false);
        }
      };

      fetchPincodeData();
      fetchCustomerPricing();
    }
  }, [currentStep, destinationPincode]);

  // Calculate prices when service type, mode, or weight changes
  useEffect(() => {
    if (selectedServiceType && customerPricing && chargeableWeight > 0) {
      if (selectedServiceType === 'priority') {
        calculatePrices();
      } else if (selectedServiceType === 'standard' && selectedMode) {
        calculatePrices();
      } else {
        setCalculatedPrice(null);
      }
    } else {
      setCalculatedPrice(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceType, selectedMode, customerPricing, chargeableWeight, shipmentDetails.natureOfConsignment, destinationPincode]);

  // Helper function to determine route (Assam to NE or Assam to ROI)
  const determineRoute = (pincode: string): 'assamToNe' | 'assamToRoi' => {
    const pin = parseInt(pincode);
    
    // North East pincodes (Assam + other NE states)
    if ((pin >= 781000 && pin <= 788999) || // Assam
        (pin >= 790000 && pin <= 791999) || // Arunachal Pradesh
        (pin >= 793000 && pin <= 793999) || // Meghalaya
        (pin >= 795000 && pin <= 795999) || // Manipur
        (pin >= 796000 && pin <= 796999) || // Mizoram
        (pin >= 797000 && pin <= 797999) || // Nagaland
        (pin >= 737000 && pin <= 737999) || // Sikkim
        (pin >= 799000 && pin <= 799999)) { // Tripura
      return 'assamToNe';
    }
    
    // Rest of India
    return 'assamToRoi';
  };

  // Calculate prices based on service type
  const calculatePrices = () => {
    if (!selectedServiceType || !customerPricing || chargeableWeight <= 0) {
      return;
    }

    const weight = chargeableWeight;
    if (isNaN(weight) || weight <= 0) {
      return;
    }

    const isDox = shipmentDetails.natureOfConsignment === 'DOX';
    const route = determineRoute(destinationPincode);
    const routeKey: 'assamToNe' | 'assamToRoi' = route;
    let price = 0;

    if (selectedServiceType === 'priority') {
      // Priority Service (Unified - no modes, no DOX/NON DOX)
      // Convert weight to grams for calculation
      const weightInGrams = isDox ? weight * 1000 : weight * 1000; // Both in grams for priority
      
      if (weightInGrams > 100000) { // > 100kg
        setCalculatedPrice(null);
        return;
      }
      
      // Priority uses single base500gm rate per 500gm (same for both routes)
      // Handle both number (from API) and string (edge cases) formats
      const base500gmValue = customerPricing.priorityPricing?.base500gm;
      const pricePer500gm = typeof base500gmValue === 'number' 
        ? base500gmValue 
        : parseFloat(String(base500gmValue || 0)) || 0;
      
      // Always calculate price (even if 0, so user can see pricing needs to be configured)
      const units = Math.ceil(weightInGrams / 500);
      price = pricePer500gm * units;
    } else {
      // Standard Service - requires mode selection
      if (!selectedMode) {
        setCalculatedPrice(null);
        return;
      }

      const mode = selectedMode === 'byAir' ? 'air' : selectedMode === 'byTrain' ? 'train' : 'road';
      const weightInGrams = isDox ? weight * 1000 : weight * 1000; // Convert to grams
      const weightInKg = weight;

      if (isDox) {
        // Standard DOX pricing
        if (mode === 'train') {
          // Train uses per-kg rate only with 25kg minimum
          const minWeightKg = 25;
          const chargeableWeightKg = Math.max(weightInKg, minWeightKg);
          const pricePerKg = parseFloat(customerPricing.standardDox?.train?.[routeKey] || 0);
          price = pricePerKg * chargeableWeightKg;
        } else if (mode === 'road') {
          // Road uses weight slabs with 3kg (3000g) minimum
          const minWeightGrams = 3000;
          const chargeableWeightGrams = Math.max(weightInGrams, minWeightGrams);
          const doxMode = customerPricing.standardDox?.[mode];
          if (chargeableWeightGrams <= 250) {
            price = parseFloat(doxMode?.['01gm-250gm']?.[routeKey] || 0);
          } else if (chargeableWeightGrams <= 500) {
            price = parseFloat(doxMode?.['251gm-500gm']?.[routeKey] || 0);
          } else {
            const basePrice = parseFloat(doxMode?.['251gm-500gm']?.[routeKey] || 0);
            const additionalWeight = Math.ceil((chargeableWeightGrams - 500) / 500);
            const additionalPrice = parseFloat(doxMode?.add500gm?.[routeKey] || 0);
            price = basePrice + (additionalWeight * additionalPrice);
          }
        } else {
          // Air uses weight slabs (no minimum)
          const doxMode = customerPricing.standardDox?.[mode];
          if (weightInGrams <= 250) {
            price = parseFloat(doxMode?.['01gm-250gm']?.[routeKey] || 0);
          } else if (weightInGrams <= 500) {
            price = parseFloat(doxMode?.['251gm-500gm']?.[routeKey] || 0);
          } else {
            const basePrice = parseFloat(doxMode?.['251gm-500gm']?.[routeKey] || 0);
            const additionalWeight = Math.ceil((weightInGrams - 500) / 500);
            const additionalPrice = parseFloat(doxMode?.add500gm?.[routeKey] || 0);
            price = basePrice + (additionalWeight * additionalPrice);
          }
        }
      } else {
        // Standard NON DOX pricing
        if (mode === 'train') {
          // Train uses per-kg rate only with 25kg minimum
          const minWeight = 25;
          const chargeableWeightKg = Math.max(weightInKg, minWeight);
          const pricePerKg = parseFloat(customerPricing.standardNonDox?.train?.[routeKey] || 0);
          price = pricePerKg * chargeableWeightKg;
        } else if (mode === 'road') {
          // Road uses weight slabs with 3kg minimum
          const minWeight = 3;
          const chargeableWeightKg = Math.max(weightInKg, minWeight);
          const nonDoxMode = customerPricing.standardNonDox?.[mode];
          let pricePerKg = 0;
          
          if (chargeableWeightKg >= 1 && chargeableWeightKg <= 5) {
            pricePerKg = parseFloat(nonDoxMode?.['1kg-5kg']?.[routeKey] || 0);
          } else if (chargeableWeightKg > 5 && chargeableWeightKg <= 100) {
            pricePerKg = parseFloat(nonDoxMode?.['5kg-100kg']?.[routeKey] || 0);
          }
          
          price = pricePerKg * chargeableWeightKg;
        } else {
          // Air uses weight slabs (no minimum)
          const nonDoxMode = customerPricing.standardNonDox?.[mode];
          let pricePerKg = 0;
          
          if (weightInKg >= 1 && weightInKg <= 5) {
            pricePerKg = parseFloat(nonDoxMode?.['1kg-5kg']?.[routeKey] || 0);
          } else if (weightInKg > 5 && weightInKg <= 100) {
            pricePerKg = parseFloat(nonDoxMode?.['5kg-100kg']?.[routeKey] || 0);
          }
          
          price = pricePerKg * weightInKg;
        }
      }
    }

    setCalculatedPrice(price);
  };



  // Auto-focus first input when phone modal opens
  useEffect(() => {
    if (phoneModalOpen.type) {
      setTimeout(() => {
        const firstInput = document.getElementById(`${phoneModalOpen.type}-modal-digit-0`);
        firstInput?.focus();
      }, 100);
    }
  }, [phoneModalOpen.type]);

  // Upload images to S3
  const uploadImagesToS3 = async () => {
    try {
      setUploadingImages(true);
      const imageUrls: string[] = [];
      
      // Upload package images if any
      if (uploadedImages.length > 0) {
        const formData = new FormData();
        uploadedImages.forEach((file) => {
          formData.append('packageImages', file);
        });

        const response = await fetch(`${API_BASE}/api/upload/booknow/package-images`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to upload package images');
        }

        const result = await response.json();
        if (result.success && result.files) {
          result.files.forEach((file: any) => {
            imageUrls.push(file.url);
          });
        }
      }

      // Upload insurance document if exists
      let insuranceDocUrl: string | null = null;
      if (shipmentDetails.insuranceDocument) {
        const formData = new FormData();
        formData.append('insuranceDocument', shipmentDetails.insuranceDocument);

        const response = await fetch(`${API_BASE}/api/upload/booknow/insurance-document`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to upload insurance document');
        }

        const result = await response.json();
        if (result.success && result.file) {
          insuranceDocUrl = result.file.url;
        }
      }

      // Upload declaration document if exists
      let declarationDocUrl: string | null = null;
      if (shipmentDetails.declarationDocument) {
        const formData = new FormData();
        formData.append('declarationDocument', shipmentDetails.declarationDocument);

        const response = await fetch(`${API_BASE}/api/upload/booknow/declaration-document`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          // Try to parse as JSON, but handle HTML error pages
          let errorMessage = 'Failed to upload declaration document';
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } else {
              const text = await response.text();
              errorMessage = `Server error (${response.status}): ${response.statusText}. Please ensure the backend server is running and the route is available.`;
            }
          } catch (parseError) {
            errorMessage = `Server error (${response.status}): ${response.statusText}. Please ensure the backend server is running and the route is available.`;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        if (result.success && result.file) {
          declarationDocUrl = result.file.url;
        }
      }

      setUploadedImageUrls(imageUrls);
      setUploadedInsuranceDocumentUrl(insuranceDocUrl);
      setUploadedDeclarationDocumentUrl(declarationDocUrl);
      
      return { imageUrls, insuranceDocUrl, declarationDocUrl };
    } catch (error) {
      console.error('Error uploading images to S3:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload images. Please try again.');
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  // Navigate to next step
  const handleNextStep = async () => {
    if (currentStep === 0) {
      // Check if both pincodes are serviceable
      if (originServiceable === true && destinationServiceable === true) {
        // Check if user is authenticated
        if (!isAuthenticated) {
          setShowLoginDialog(true);
          return;
        }
        const newCompleted = [...completedSteps];
        newCompleted[0] = true;
        setCompletedSteps(newCompleted);
        setCurrentStep(1);
        // Reset to origin section when moving to address details step
        setCurrentSection('origin');
      }
    } else if (currentStep === 1) {
      if (canProceedAddresses) {
        const newCompleted = [...completedSteps];
        newCompleted[1] = true;
        setCompletedSteps(newCompleted);
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (isShipmentStepComplete) {
        const newCompleted = [...completedSteps];
        newCompleted[2] = true;
        setCompletedSteps(newCompleted);
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (isPackageStepComplete) {
        const newCompleted = [...completedSteps];
        newCompleted[3] = true;
        setCompletedSteps(newCompleted);
        setCurrentStep(4);
      }
    } else if (currentStep === 4) {
      if (selectedServiceType && (selectedServiceType === 'priority' || (selectedServiceType === 'standard' && selectedMode))) {
        const newCompleted = [...completedSteps];
        newCompleted[4] = true;
        setCompletedSteps(newCompleted);
        setCurrentStep(5);
      }
    } else if (currentStep === 5) {
      // Step 5 is Preview - Upload images to S3 and prepare booking payload for payment selection
      try {
        console.log('📦 Preparing booking payload from Preview step...');
        setSavingBooking(true);
        setOrderComplete(false);
        setCurrentBookingId(null);
        setConsignmentNumber(null);
        setAwbNumber('');
        setLatestBookingSummary(null);
        setPendingBookingPayload(null);

        // Step 1: Upload images to S3 first
        const { imageUrls = [], insuranceDocUrl = null, declarationDocUrl = null } = await uploadImagesToS3();
        console.log('✅ Images uploaded to S3:', {
          packageImages: imageUrls.length || uploadedImageUrls.length,
          insuranceDocument: insuranceDocUrl || uploadedInsuranceDocumentUrl ? 'Yes' : 'No',
          declarationDocument: declarationDocUrl || uploadedDeclarationDocumentUrl ? 'Yes' : 'No'
        });
        
        const resolvedPackageImages = imageUrls.length > 0 ? imageUrls : uploadedImageUrls;
        const resolvedInsuranceDocUrl = insuranceDocUrl || uploadedInsuranceDocumentUrl || '';
        const resolvedDeclarationDocUrl = declarationDocUrl || uploadedDeclarationDocumentUrl || '';

        const bookingPayload = {
          origin: {
            ...originData,
            alternateNumbers: originData.alternateNumbers.filter(num => num.trim() !== '')
          },
          destination: {
            ...destinationData,
            alternateNumbers: destinationData.alternateNumbers.filter(num => num.trim() !== '')
          },
          shipment: {
            ...shipmentDetails,
            insuranceDocument: resolvedInsuranceDocUrl,
            declarationDocument: resolvedDeclarationDocUrl
          },
          packageImages: resolvedPackageImages,
          shippingMode: selectedMode,
          serviceType: selectedServiceType,
          calculatedPrice: calculatedPrice,
          actualWeight: actualWeight > 0 ? actualWeight : null,
          volumetricWeight: volumetricWeight > 0 ? volumetricWeight : null,
          chargeableWeight: chargeableWeight > 0 ? chargeableWeight : null,
          originServiceable: originServiceable,
          destinationServiceable: destinationServiceable,
          originAddressInfo: originAddressInfo,
          destinationAddressInfo: destinationAddressInfo,
          onlineCustomerId: customer?._id || null
        };

        setPendingBookingPayload(bookingPayload);
        setCheckoutOpen(true);
      } catch (error) {
        console.error('❌ Failed to complete booking submission:', error);
        alert(error instanceof Error ? error.message : 'Failed to prepare booking. Please try again.');
      } finally {
        setSavingBooking(false);
      }
    }
  };

  // Navigate to previous step
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const shouldShowCheckoutDialog = checkoutOpen && !processingPayment;

  if (orderComplete) {
    return (
      <div className="space-y-6">
        <div className={cn(
          'rounded-2xl border p-6 text-center shadow-lg',
          isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
        )}>
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg mb-4">
              <CheckCircle className="h-14 w-14 text-white" />
            </div>
            <h2 className={cn('text-3xl font-bold mb-2', isDarkMode ? 'text-white' : 'text-slate-900')}>
              Booking Complete!
            </h2>
            <p className={cn('text-lg mb-2', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
              Your booking has been confirmed successfully
            </p>
            <p className={cn('text-sm', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
              Booking Reference: {latestBookingSummary?.bookingReference || awbNumber || 'Awaiting assignment'}
            </p>
            <p className={cn('text-sm', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
              Consignment #: {consignmentNumber ?? latestBookingSummary?.consignmentNumber ?? 'Awaiting assignment'}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-6 text-left">
            <div className={cn(
              'rounded-xl border p-4',
              isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
            )}>
              <h3 className={cn('font-semibold mb-2', isDarkMode ? 'text-white' : 'text-slate-900')}>
                From - Sender
              </h3>
              <p className={cn('text-sm', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
                <span className="font-medium">{originData.name || 'N/A'}</span><br />
                {originData.city || ''}, {originData.state || ''}<br />
                PIN: {originData.pincode || 'N/A'}<br />
                {originData.mobileNumber && <>Phone: {originData.mobileNumber}</>}
              </p>
            </div>
            <div className={cn(
              'rounded-xl border p-4',
              isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
            )}>
              <h3 className={cn('font-semibold mb-2', isDarkMode ? 'text-white' : 'text-slate-900')}>
                To - Recipient
              </h3>
              <p className={cn('text-sm', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
                <span className="font-medium">{destinationData.name || 'N/A'}</span><br />
                {destinationData.city || ''}, {destinationData.state || ''}<br />
                PIN: {destinationData.pincode || 'N/A'}<br />
                {destinationData.mobileNumber && <>Phone: {destinationData.mobileNumber}</>}
              </p>
            </div>
          </div>

          <div className={cn(
            'rounded-xl border p-4 mb-6 text-left',
            isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
          )}>
            <h3 className={cn('font-semibold mb-2', isDarkMode ? 'text-white' : 'text-slate-900')}>
              Shipment Summary
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className={cn(isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                <span>Service Type</span>
                <p className={cn('font-medium', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                  {selectedServiceType === 'priority' ? 'Priority' : 'Standard'}
                  {selectedMode && ` • ${selectedMode === 'byAir' ? 'Air' : selectedMode === 'byTrain' ? 'Train' : 'Road'}`}
                </p>
              </div>
              <div className={cn(isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                <span>Declared Weight</span>
                <p className={cn('font-medium', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                  {shipmentDetails.weight || chargeableWeight || '0'} kg
                </p>
              </div>
              <div className={cn(isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                <span>Chargeable Amount</span>
                <p className={cn('font-medium', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                  ₹{calculatedPrice ? (calculatedPrice + TOTAL_PICKUP_CHARGE).toFixed(2) : TOTAL_PICKUP_CHARGE.toFixed(2)}
                </p>
              </div>
              <div className={cn(isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                <span>Payment Status</span>
                <p className={cn('font-medium capitalize', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                  {lastPaymentStatus}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={handleViewMyBookings}
              className={cn(
                'px-6 py-3 text-base',
                isDarkMode ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              )}
            >
              Go to My Bookings
            </Button>
            <Button
              onClick={handleViewInvoice}
              variant="outline"
              className={cn(
                'px-6 py-3 text-base',
                isDarkMode
                  ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              )}
            >
              <FileText className="h-4 w-4 mr-2" />
              Invoice
            </Button>
            <Button
              onClick={handleStartNewBooking}
              variant="outline"
              className={cn(
                'px-6 py-3 text-base',
                isDarkMode
                  ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              )}
            >
              New Booking
            </Button>
          </div>
        </div>

        {/* Invoice Dialog */}
        <Dialog open={!!selectedInvoiceBooking} onOpenChange={(open) => !open && setSelectedInvoiceBooking(null)}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 border-0 shadow-none bg-white print:bg-white print:max-h-full print:overflow-visible [&>button]:hidden">
            <DialogHeader className={cn("sticky top-0 z-10 bg-white dark:bg-slate-900 p-4 print:hidden", isDarkMode ? "border-slate-700" : "border-slate-200")}>
              <div className="flex items-center justify-between">
                <DialogTitle className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-slate-900")}>
                  Invoice - {selectedInvoiceBooking?.bookingReference}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedInvoiceBooking) {
                        window.print();
                      }
                    }}
                    className={cn(
                      isDarkMode
                        ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadInvoice}
                    disabled={!selectedInvoiceBooking || downloadingInvoice}
                    className={cn(
                      isDarkMode
                        ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {downloadingInvoice ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Preparing
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogHeader>
            {selectedInvoiceBooking && (
              <div
                id="invoice-content"
                ref={invoiceContentRef}
                className={cn("p-6 print:p-3", isDarkMode ? "bg-slate-900 print:bg-white" : "bg-white")}
              >
                {/* Invoice Section - Compressed Design */}
                <div className="max-w-3xl mx-auto print:max-w-full">
                  <div className={cn(
                    'bg-white p-4 print:p-3',
                    isDarkMode ? 'bg-slate-800 print:bg-white' : 'bg-white'
                  )}>
                    {/* Header Section */}
                    <div className="mb-3 pb-2">
                      <div className="grid gap-4 sm:grid-cols-2 items-start">
                        <div className="flex items-start">
                          <img
                            src="/assets/ocl-logo.png"
                            alt="OCL Logo"
                            className="h-24 w-auto object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/ocl-logo.png';
                            }}
                          />
                        </div>
                        <div
                          className={cn(
                            "text-[10px] space-y-1.5",
                            isDarkMode ? "text-slate-200" : "text-slate-700"
                          )}
                        >
                          <div className="space-y-0.5 sm:text-right">
                            <p
                              className={cn(
                                "text-xs font-semibold",
                                isDarkMode ? "text-white" : "text-slate-900"
                              )}
                            >
                              Invoice Details
                            </p>
                            <p>Invoice No.: {getInvoiceNumber(selectedInvoiceBooking)}</p>
                            <p>Created: {formatShortDate(selectedInvoiceBooking.createdAt)}</p>
                          </div>
                          <div className="space-y-0.5 sm:text-right">
                            <p>
                              Consignment No.: {selectedInvoiceBooking.bookingReference || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "grid gap-4 mb-3 pb-2 sm:grid-cols-2 text-[10px]",
                        isDarkMode ? "text-slate-200" : "text-slate-700"
                      )}
                    >
                      <div className="space-y-0.5">
                        <p className={cn("text-xs font-semibold", isDarkMode ? "text-white" : "text-slate-900")}>
                          {COMPANY_DETAILS.name}
                        </p>
                        <p>{COMPANY_DETAILS.location}</p>
                        <p>GSTIN: {COMPANY_DETAILS.gstin}</p>
                        <p>State: {COMPANY_DETAILS.state} (Code: {COMPANY_DETAILS.stateCode})</p>
                      </div>
                      <div className="space-y-0.5 sm:text-right">
                        <p>Email: {COMPANY_DETAILS.email}</p>
                        <p>Phone: {COMPANY_DETAILS.phone}</p>
                        <p>Website: {COMPANY_DETAILS.website}</p>
                        <p>Contact: 03612637373, 8453994809</p>
                      </div>
                    </div>

                    {/* Sender and Recipient Section */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      {/* From Section */}
                      <div>
                        <div className="text-[10px] font-semibold text-slate-700 mb-1">From - Sender Information</div>
                        <div className="text-[10px] text-slate-600 leading-tight">
                          <div className="font-medium">{selectedInvoiceBooking.origin.name || 'N/A'}</div>
                          <div>{selectedInvoiceBooking.origin.flatBuilding || ''} {selectedInvoiceBooking.origin.locality || ''}</div>
                          <div>{selectedInvoiceBooking.origin.area || ''}, {selectedInvoiceBooking.origin.city || ''}, {selectedInvoiceBooking.origin.state || ''}</div>
                          <div>PIN: {selectedInvoiceBooking.origin.pincode || 'N/A'}</div>
                          {selectedInvoiceBooking.origin.mobileNumber && (
                            <div>Phone: {selectedInvoiceBooking.origin.mobileNumber}</div>
                          )}
                        </div>
                      </div>

                      {/* To Section */}
                      <div className="sm:text-right">
                        <div className="text-[10px] font-semibold text-slate-700 mb-1">To - Recipient Information</div>
                        <div className="text-[10px] text-slate-600 leading-tight">
                          <div className="font-medium">{selectedInvoiceBooking.destination.name || 'N/A'}</div>
                          <div>{selectedInvoiceBooking.destination.flatBuilding || ''} {selectedInvoiceBooking.destination.locality || ''}</div>
                          <div>{selectedInvoiceBooking.destination.area || ''}, {selectedInvoiceBooking.destination.city || ''}, {selectedInvoiceBooking.destination.state || ''}</div>
                          <div>PIN: {selectedInvoiceBooking.destination.pincode || 'N/A'}</div>
                          {selectedInvoiceBooking.destination.mobileNumber && (
                            <div>Phone: {selectedInvoiceBooking.destination.mobileNumber}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Shipment Details Section */}
                    <div className="mb-3 pb-2">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-[10px] text-slate-500 mb-0.5">Shipping mode</div>
                          <div className="text-[10px] font-semibold text-slate-700">
                            {selectedInvoiceBooking.serviceType === 'priority' ? 'Priority' : 'Standard'}
                            {selectedInvoiceBooking.shippingMode &&
                              ` - ${
                                selectedInvoiceBooking.shippingMode === 'byAir' || selectedInvoiceBooking.shippingMode === 'air'
                                  ? 'Air'
                                  : selectedInvoiceBooking.shippingMode === 'byTrain' || selectedInvoiceBooking.shippingMode === 'train'
                                  ? 'Train'
                                  : 'Road'
                              }`}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-slate-500 mb-0.5">Weight</div>
                          <div className="text-[10px] font-semibold text-slate-700">
                            {selectedInvoiceBooking.shipment.weight || '0'} kg
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 mb-0.5">Declared Value</div>
                          <div className="text-[10px] font-semibold text-slate-700">
                            ₹
                            {selectedInvoiceBooking.shipment.declaredValue
                              ? parseFloat(selectedInvoiceBooking.shipment.declaredValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : '0.00'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Barcode Section */}
                    <div className="mb-3 pb-2">
                      <div className="grid gap-4 sm:grid-cols-[1fr] items-center">
                        <div className="bg-slate-100 p-3 rounded flex items-center justify-center w-full" style={{ minHeight: '80px' }}>
                          <div className="text-center space-y-1.5 w-full">
                            <div className="text-[9px] text-slate-500">Barcode</div>
                            <img
                              src={getBarcodeUrl(selectedInvoiceBooking.bookingReference)}
                              alt={`Barcode for ${getConsignmentValue(selectedInvoiceBooking.bookingReference)}`}
                              className="mx-auto h-16 w-full object-contain mix-blend-multiply"
                              style={{ maxWidth: '100%' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bill To and Payment Details - Two Column Layout */}
                    <div className="mb-3 grid grid-cols-2 gap-4">
                      {/* Left Column - Bill To */}
                      <div>
                        <div className="text-[10px] font-semibold text-slate-700 mb-1">Bill To</div>
                        <div className="text-[10px] text-slate-600 leading-tight">
                          <div className="font-medium">{selectedInvoiceBooking.destination.name || 'N/A'}</div>
                          <div>Phone: {selectedInvoiceBooking.destination.mobileNumber || 'N/A'}</div>
                          <div>{selectedInvoiceBooking.destination.flatBuilding || ''} {selectedInvoiceBooking.destination.locality || ''}</div>
                          <div>{selectedInvoiceBooking.destination.area || ''}, {selectedInvoiceBooking.destination.city || ''}, {selectedInvoiceBooking.destination.state || ''}</div>
                          <div>PIN: {selectedInvoiceBooking.destination.pincode || 'N/A'}</div>
                        </div>
                      </div>

                      {/* Right Column - Payment Details */}
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-black">
                          <div>{selectedInvoiceBooking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</div>
                        </div>
                        {selectedInvoiceBooking.calculatedPrice !== null && selectedInvoiceBooking.calculatedPrice !== undefined && (
                          <div className="text-[18px] font-bold text-black mt-1">
                            <div>₹{(selectedInvoiceBooking.calculatedPrice ? selectedInvoiceBooking.calculatedPrice + getTotalPickupCharge(selectedInvoiceBooking.pickupCharge) : getTotalPickupCharge(selectedInvoiceBooking.pickupCharge)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Details - Price Breakdown */}
                    <div className="mb-3">
                      {/* Price Breakdown */}
                      {selectedInvoiceBooking.calculatedPrice !== null && selectedInvoiceBooking.calculatedPrice !== undefined && (
                        <div className="mt-2 pt-2">
                          <div className="text-[9px] text-slate-600 space-y-0.5">
                            {(() => {
                              // Use backend data if available, otherwise calculate
                              const basePrice = selectedInvoiceBooking.basePrice ?? (selectedInvoiceBooking.calculatedPrice / 1.18);
                              const pickupChargeBase = selectedInvoiceBooking.pickupCharge ?? DOOR_PICKUP_CHARGE;
                              const subtotal = basePrice + pickupChargeBase; // Base Price + Pickup Charge (both without GST)
                              const gstAmount = subtotal * 0.18; // GST on Subtotal
                              const totalAmount = subtotal + gstAmount; // Subtotal + GST
                              return (
                                <>
                                  <div className="flex justify-between">
                                    <span>Base Price:</span>
                                    <span>₹{basePrice.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Pickup Charge (excl. GST):</span>
                                    <span>₹{pickupChargeBase.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>GST (18%):</span>
                                    <span>₹{gstAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-black pt-0.5">
                                    <span>Total Amount:</span>
                                    <span>₹{totalAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-[9px] text-slate-600 italic pt-1">
                                    <span>Amount in Words:</span>
                                    <span className="text-right">{numberToWords(totalAmount)}</span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Item Description */}
                    <div className="mb-3">
                      <div className="text-[10px] font-semibold text-slate-700 mb-1">Item Description:</div>
                      <div className="text-[10px] text-slate-600">
                        {selectedInvoiceBooking.shipment.natureOfConsignment === 'DOX' ? 'Document' : selectedInvoiceBooking.shipment.natureOfConsignment === 'NON-DOX' ? 'Parcel' : selectedInvoiceBooking.shipment.natureOfConsignment || 'Document'}
                      </div>
                    </div>

                    {/* Disclaimers */}
                    <div className="mb-3 space-y-1">
                      <div className="text-[9px] text-slate-600 leading-tight">
                        Personal/Used goods, Not for Sale No Commercial Value.
                      </div>
                      <div className="text-[9px] text-slate-600 leading-tight">
                        Please note that the final charges may be subject to revision if the actual weight differs from the declared weight, or if any additional charges are applicable for the shipment. For any queries or updates, please contact us at{' '}
                        <a
                          href="mailto:info@oclservices.com"
                          className={cn(
                            "underline font-medium hover:opacity-80 transition-opacity",
                            isDarkMode ? "text-blue-300 hover:text-blue-200" : "text-blue-600 hover:text-blue-700"
                          )}
                        >
                          info@oclservices.com
                        </a>
                      </div>
                      <div className="text-[9px] text-slate-600 leading-tight">
                        Movement of content is subject to our list of Dangerous Goods and Prohibited Items.
                      </div>
                    </div>

                    {/* Computer Generated Invoice Note */}
                    <div className={cn(
                      "mb-3 p-2 rounded border",
                      isDarkMode 
                        ? "bg-yellow-500/10 border-yellow-500/30" 
                        : "bg-yellow-50 border-yellow-200"
                    )}>
                      <div className={cn(
                        "text-[9px] leading-tight",
                        isDarkMode ? "text-yellow-200" : "text-yellow-800"
                      )}>
                        <span className="font-bold">*</span> This is computer generated invoice and does not require official signature. Kindly notify us immediately in case you find any discrepancy in the details of transaction.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <Stepper 
        currentStep={currentStep} 
        steps={steps} 
        completedSteps={completedSteps}
        isDarkMode={isDarkMode}
      />

      {/* Step 0: Serviceability Check */}
      {currentStep === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 sm:mt-6"
        >
          <Card className={cn(
            "border-2 shadow-lg",
            isDarkMode
              ? "border-slate-700 bg-slate-900/60"
              : "border-slate-200 bg-white"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                "flex items-center gap-2 text-lg sm:text-xl",
              isDarkMode ? "text-slate-100" : "text-slate-900"
            )}>
                <MapPin className="w-5 h-5" />
              Check Serviceability : 
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Origin Pincode */}
            <div className="space-y-2">
              <FloatingInput
                label="Sender's Pin No."
                value={originPincode}
                onChange={handleOriginPincodeChange}
                type="text"
                required
                maxLength={6}
                icon={<MapPin className="w-4 h-4" />}
                serviceabilityStatus={originServiceable === true ? 'available' : originServiceable === false ? 'unavailable' : null}
                showInlineStatus={originPincode.length === 6}
                addressInfo={originAddressInfo}
                errorMessage="This area is not serviceable"
                isDarkMode={isDarkMode}
              />
              {checkingOrigin && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking serviceability...</span>
                </div>
              )}
            </div>

            {/* Destination Pincode */}
            <div className="space-y-2">
              <FloatingInput
                label="Recipient's Pin No."
                value={destinationPincode}
                onChange={handleDestinationPincodeChange}
                type="text"
                required
                maxLength={6}
                icon={<MapPin className="w-4 h-4" />}
                serviceabilityStatus={destinationServiceable === true ? 'available' : destinationServiceable === false ? 'unavailable' : null}
                showInlineStatus={destinationPincode.length === 6}
                addressInfo={destinationAddressInfo}
                errorMessage="This area is not serviceable"
                isDarkMode={isDarkMode}
              />
              {checkingDestination && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking serviceability...</span>
                </div>
              )}
            </div>
              </div>

              {/* Next Button */}
              <div className="flex justify-end pt-2 sm:pt-4">
            <Button
              onClick={handleNextStep}
              disabled={originServiceable !== true || destinationServiceable !== true}
              className={cn(
                "w-full sm:w-auto px-6",
                isDarkMode
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              )}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 1: Address Details */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-6"
        >
          <div>
            <h3 className={cn(
              "text-lg sm:text-xl font-semibold mb-2",
              isDarkMode ? "text-slate-100" : "text-slate-900"
            )}>
              Address Details
            </h3>
            <p className={cn(
              "text-xs sm:text-sm mb-4 sm:mb-6",
              isDarkMode ? "text-slate-400" : "text-slate-600"
            )}>
              Please fill in the origin and destination address details. Click on the address cards below to get started.
            </p>
          </div>

          {/* Show destination preview card when both forms are complete */}
          {isDestinationFormComplete && (
            <>
              {renderAddressCard('destination')}
              
              {/* Auto-advancing message */}
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing shipment details...</span>
              </div>
            </>
          )}

          {/* Show placeholder when forms are not complete */}
          {!isDestinationFormComplete && (
            <div className={cn(
              "rounded-2xl border p-6 sm:p-8 text-center",
              isDarkMode
                ? "border-slate-800/60 bg-slate-900/40"
                : "border-slate-200/70 bg-slate-50/50"
            )}>
              <MapPin className={cn(
                "w-12 h-12 mx-auto mb-4",
                isDarkMode ? "text-slate-400" : "text-slate-400"
              )} />
              <p className={cn(
                "text-sm font-medium mb-2",
                isDarkMode ? "text-slate-200" : "text-slate-700"
              )}>
                {!isOriginFormComplete 
                  ? "Please fill in the origin address details first"
                  : "Please fill in the destination address details"}
              </p>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-slate-400" : "text-slate-500"
              )}>
                The address forms will open automatically. If they don't, check the modals.
              </p>
            </div>
          )}
          
          <div className="flex justify-start pt-2">
            <Button
              onClick={handlePreviousStep}
              className={cn(
                'w-full sm:w-auto px-6',
                isDarkMode
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              )}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Shipment Details */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-6 md:space-y-8"
        >
          <div className="space-y-2">
            <h3
              className={cn(
                'text-lg sm:text-xl font-semibold',
                isDarkMode ? 'text-slate-100' : 'text-slate-900'
              )}
            >
            </h3>
            <p
              className={cn(
                'text-xs sm:text-sm',
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Nature of Consignment */}
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                  {natureOptions.map((option) => {
                    const isSelected = shipmentDetails.natureOfConsignment === option.value;
                    const IconComponent = option.icon;
                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() =>
                          setShipmentDetails({
                            natureOfConsignment: option.value,
                            insurance: '',
                            riskCoverage: 'Owner',
                            packagesCount: '',
                            materials: '',
                            others: '',
                            description: '',
                            declaredValue: '',
                            weight: '',
                            length: '',
                            width: '',
                            height: '',
                            insuranceCompanyName: '',
                            insurancePolicyNumber: '',
                            insurancePolicyDate: '',
                            insuranceValidUpto: '',
                            insurancePremiumAmount: '',
                            insuranceDocumentName: '',
                            insuranceDocument: null,
                            declarationDocumentName: '',
                            declarationDocument: null
                          })
                        }
                        className={cn(
                      'w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none',
                          isSelected
                            ? isDarkMode
                          ? 'border-blue-500 bg-blue-500/20 shadow-[0_8px_24px_rgba(59,130,246,0.25)]'
                          : 'border-blue-500 bg-blue-50/80 shadow-[0_8px_24px_rgba(59,130,246,0.15)]'
                            : isDarkMode
                              ? 'border-slate-700/60 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                              : 'border-slate-200 hover:border-blue-400/60 hover:bg-blue-50/60'
                        )}
                      >
                    <div className="flex items-start gap-2">
                          <div
                            className={cn(
                          'mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-xs transition-colors',
                              isSelected
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : isDarkMode
                                  ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                  : 'border-slate-300 text-transparent'
                            )}
                          >
                        <Check className="h-2.5 w-2.5" />
                          </div>
                      <div className="space-y-0.5">
                            <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                          <span className="inline-flex items-center gap-1.5">
                            {IconComponent && <IconComponent className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                                {option.title}
                              </span>
                            </p>
                            <p className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
            </div>

            {/* Insurance */}
            {shipmentDetails.natureOfConsignment && (
              <>
                <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                    {insuranceOptions.map((option) => {
                      const isSelected = shipmentDetails.insurance === option.value;
                      const IconComponent = option.icon;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => handleInsuranceSelection(option.value)}
                          className={cn(
                          'w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none',
                            isSelected
                              ? isDarkMode
                              ? 'border-blue-500 bg-blue-500/20 shadow-[0_8px_24px_rgba(59,130,246,0.25)]'
                              : 'border-blue-500 bg-blue-50/80 shadow-[0_8px_24px_rgba(59,130,246,0.15)]'
                              : isDarkMode
                                ? 'border-slate-700/60 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                                : 'border-slate-200 hover:border-blue-400/60 hover:bg-blue-50/60'
                          )}
                        >
                        <div className="flex items-start gap-2">
                            <div
                              className={cn(
                              'mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-xs transition-colors',
                                isSelected
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : isDarkMode
                                    ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                    : 'border-slate-300 text-transparent'
                              )}
                            >
                            <Check className="h-2.5 w-2.5" />
                            </div>
                          <div className="space-y-0.5">
                              <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                              <span className="inline-flex items-center gap-1.5">
                                {IconComponent && <IconComponent className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                                  {option.title}
                                </span>
                              </p>
                              <p className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              {shipmentDetails.insurance === 'With insurance' && (
                <div
                  className={cn(
                    'mt-3 rounded-xl border p-4 transition-all duration-300',
                    isDarkMode
                      ? 'border-blue-500 bg-slate-900/60 shadow-[0_8px_24px_rgba(59,130,246,0.25)]'
                      : 'border-blue-500 bg-white/80 shadow-[0_8px_24px_rgba(59,130,246,0.15)]'
                  )}
                >
                  <div className="flex items-start gap-3 mb-0.5">
                    <div>
                      <h5 style={{textDecoration:'underline'}}>
                      Preview
                      </h5>
                    </div>
                    <button
                      type="button"
                      onClick={openInsuranceModal}
                      className={cn(
                        'p-2 rounded-md transition-colors ml-auto',
                        isDarkMode
                          ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Company Name</span>
                      <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                        {shipmentDetails.insuranceCompanyName || 'Pending'}
                      </p>
                    </div>
                    <div>
                      <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Policy Number</span>
                      <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                        {shipmentDetails.insurancePolicyNumber || 'Pending'}
                      </p>
                    </div>
                    <div>
                      <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Policy Date</span>
                      <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                        {shipmentDetails.insurancePolicyDate || 'Pending'}
                      </p>
                    </div>
                    <div>
                      <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Policy Date Valid Upto</span>
                      <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                        {shipmentDetails.insuranceValidUpto || 'Pending'}
                      </p>
                    </div>
                    <div>
                      <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Premium Amount</span>
                      <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                        {shipmentDetails.insurancePremiumAmount
                          ? `${shipmentDetails.insurancePremiumAmount}`
                          : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Document</span>
                      <div className="flex items-center gap-1.5">
                        {shipmentDetails.insuranceDocument && (
                          <button
                            type="button"
                            onClick={() => {
                              if (shipmentDetails.insuranceDocument) {
                                const url = URL.createObjectURL(shipmentDetails.insuranceDocument);
                                setDocumentPreviewUrl(url);
                                setDocumentPreviewOpen(true);
                              }
                            }}
                            className={cn(
                              'p-1 rounded transition-colors flex-shrink-0',
                              isDarkMode
                                ? 'text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                                : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                            )}
                            title="Preview document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      <p className={cn('text-sm font-medium break-words', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                        {shipmentDetails.insuranceDocumentName || 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              )}
              </>
            )}

            {/* Risk Coverage */}
            {shipmentDetails.natureOfConsignment && shipmentDetails.insurance && (
              <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                    {riskCoverageOptions.map((option) => {
                      const isSelected = shipmentDetails.riskCoverage === option.value;
                      const IconComponent = option.icon;
                      const isDisabled = true; // Always disabled - risk coverage is auto-selected based on insurance
                      return (
                        <button
                          type="button"
                          key={option.value}
                          disabled={isDisabled}
                          onClick={() =>
                            setShipmentDetails((prev) => ({
                              ...prev,
                              riskCoverage: option.value,
                              packagesCount: '',
                              materials: '',
                              others: '',
                              description: '',
                              weight: '',
                              length: '',
                              width: '',
                              height: ''
                            }))
                          }
                          className={cn(
                        'w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none',
                            isDisabled
                              ? 'cursor-not-allowed opacity-60'
                              : '',
                            isSelected
                              ? isDarkMode
                            ? 'border-blue-500 bg-blue-500/20 shadow-[0_8px_24px_rgba(59,130,246,0.25)]'
                            : 'border-blue-500 bg-blue-50/80 shadow-[0_8px_24px_rgba(59,130,246,0.15)]'
                              : isDarkMode
                                ? 'border-slate-700/60 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                                : 'border-slate-200 hover:border-blue-400/60 hover:bg-blue-50/60'
                          )}
                        >
                      <div className="flex items-start gap-2">
                            <div
                              className={cn(
                            'mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-xs transition-colors',
                                isSelected
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : isDarkMode
                                    ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                    : 'border-slate-300 text-transparent'
                              )}
                            >
                          <Check className="h-2.5 w-2.5" />
                            </div>
                        <div className="space-y-0.5">
                              <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                            <span className="inline-flex items-center gap-1.5">
                              {IconComponent && <IconComponent className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                                  {option.title}
                                </span>
                              </p>
                              <p className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
              </div>
            )}
          </div>

          <div className="flex flex-row gap-3 sm:gap-4 pt-2 justify-between">
            <Button
              onClick={handlePreviousStep}
              className={cn(
                'w-auto px-6',
                isDarkMode
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              )}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={!isShipmentStepComplete}
              className={cn(
                'w-auto px-6',
                isDarkMode
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white',
                !isShipmentStepComplete && 'opacity-60 cursor-not-allowed'
              )}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Package & Images */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-6 md:space-y-8"
        >
          

          <div className="space-y-4 sm:space-y-6">
            {/* Package Information */}
            <div
              className={cn(
                'rounded-2xl sm:rounded-3xl  p-4 sm:p-6 transition-all duration-300',
                isDarkMode
                  ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
                  : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
              )}
            >
              <div className="space-y-4">
                <div className="space-y-4">
                  {/* No. of Packages and Materials - 2 column layout normally, 3 columns when Others is selected */}
                  <div className={cn(
                    "grid gap-3",
                    shipmentDetails.materials === 'Others' 
                      ? "grid-cols-1 md:grid-cols-3" 
                      : "grid-cols-1 md:grid-cols-2"
                  )}>
                    <FloatingInput
                      label="No. of Packages :"
                      value={shipmentDetails.packagesCount}
                      onChange={(value) =>
                        setShipmentDetails((prev) => ({ ...prev, packagesCount: sanitizeInteger(value) }))
                      }
                      type="text"
                      required
                      icon={<Package className="h-4 w-4" />}
                      isDarkMode={isDarkMode}
                    />
                    <FloatingSelectWithIcons
                      label="Package Type :"
                      value={shipmentDetails.materials}
                      onChange={(value) =>
                        setShipmentDetails((prev) => ({ 
                          ...prev, 
                          materials: value,
                          others: value === 'Others' ? prev.others : '' // Clear others if not Others
                        }))
                      }
                      options={packageTypeOptions}
                      required
                      icon={<Info className="h-4 w-4" />}
                      isDarkMode={isDarkMode}
                    />
                    {shipmentDetails.materials === 'Others' && (
                      <FloatingInput
                        label="Others - Specify :"
                        value={shipmentDetails.others}
                        onChange={(value) =>
                          setShipmentDetails((prev) => ({ ...prev, others: value }))
                        }
                        type="text"
                        required
                        isDarkMode={isDarkMode}
                      />
                    )}
                  </div>
                  
                  {/* Package Images - Show when both packagesCount and materials are filled, and if Others is selected, also require others field */}
                  {shipmentDetails.packagesCount && shipmentDetails.packagesCount.trim().length > 0 && 
                   shipmentDetails.materials && shipmentDetails.materials.trim().length > 0 &&
                   (shipmentDetails.materials !== 'Others' || (shipmentDetails.materials === 'Others' && shipmentDetails.others && shipmentDetails.others.trim().length > 0)) && (
                    <div
                        className={cn(
                        'rounded-xl  transition-all duration-300',
                          isDarkMode
                          ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
                          : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
                      )}
                    >
                      <div className="space-y-2">
            <div
              className={cn(
                            'flex flex-wrap items-center gap-2 rounded-md border p-2',
                isDarkMode
                              ? 'border-slate-700 bg-slate-800/50'
                              : 'border-slate-300 bg-slate-50'
                          )}
                        >
                  <input
                            id="package-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                            className="hidden"
                            onChange={(event) => {
                              const files = Array.from(event.target.files || []);
                      if (files.length + uploadedImages.length > 5) {
                        alert('Maximum 5 images allowed');
                        return;
                      }
                      const newFiles = [...uploadedImages, ...files];
                      setUploadedImages(newFiles);
                      
                      // Create previews for new files only
                      const newPreviews: string[] = [...imagePreviews];
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          newPreviews.push(reader.result as string);
                          if (newPreviews.length === newFiles.length) {
                            setImagePreviews(newPreviews);
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                  />
                  <label
                            htmlFor="package-image-upload"
                    className={cn(
                              'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isDarkMode
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            )}
                          >
                            Select Images
                          </label>
                          <div className="min-w-0 flex-1 text-xs">
                            <p className={cn('truncate', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                              {uploadedImages.length > 0 
                                ? `${uploadedImages.length} image${uploadedImages.length !== 1 ? 's' : ''} selected`
                                : 'No images selected'}
                            </p>
                            <p className={cn('text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                              Accepted formats: JPG, PNG. Max 5 images.
                      </p>
                    </div>
                          {uploadedImages.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedImages([]);
                                setImagePreviews([]);
                              }}
                              className={cn(
                                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                                isDarkMode
                                  ? 'bg-red-500/90 text-white hover:bg-red-600'
                                  : 'bg-red-500 text-white hover:bg-red-600'
                              )}
                            >
                              <XCircle className="w-3 h-3" />
                              Remove All
                            </button>
                          )}
                        </div>

                        {/* Image Previews Grid */}
                  {imagePreviews.length > 0 && (
                          <div className={cn(
                            "grid gap-2 mt-2",
                            imagePreviews.length === 3 ? "grid-cols-3" :
                            imagePreviews.length === 4 ? "grid-cols-4" :
                            "grid-cols-5"
                          )}>
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          className={cn(
                            'relative group rounded-lg overflow-hidden border',
                            isDarkMode ? 'border-slate-700' : 'border-slate-200'
                          )}
                        >
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                                  className="w-full h-16 object-cover cursor-pointer"
                                  onClick={() => {
                                    setDocumentPreviewUrl(preview);
                                    setDocumentPreviewOpen(true);
                                  }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = uploadedImages.filter((_, i) => i !== index);
                              const newPreviews = imagePreviews.filter((_, i) => i !== index);
                              setUploadedImages(newFiles);
                              setImagePreviews(newPreviews);
                            }}
                            className={cn(
                                    'absolute top-1 right-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                              isDarkMode
                                ? 'bg-red-500/80 text-white hover:bg-red-600'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            )}
                          >
                                  <XCircle className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDocumentPreviewUrl(preview);
                                    setDocumentPreviewOpen(true);
                                  }}
                                  className={cn(
                                    'absolute top-1 left-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                                    isDarkMode
                                      ? 'bg-blue-500/80 text-white hover:bg-blue-600'
                                      : 'bg-blue-500 text-white hover:bg-blue-600'
                                  )}
                                  title="Preview image"
                                >
                                  <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                      </div>
                    </div>
                  )}
                  
                  {/* Description and Declared Value - Two column layout */}
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <FloatingInput
                      label="Content Description :"
                      value={shipmentDetails.description}
                      onChange={(value) =>
                        setShipmentDetails((prev) => ({ ...prev, description: value }))
                      }
                      type="text"
                      className="w-full"
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="Declared Value (₹) :"
                      value={shipmentDetails.declaredValue}
                      onChange={(value) =>
                        setShipmentDetails((prev) => ({ ...prev, declaredValue: sanitizeDecimal(value) }))
                      }
                      type="text"
                      className="w-full"
                      isDarkMode={isDarkMode}
                      icon={<DollarSign className="h-4 w-4" />}
                      required={true}
                    />
                  </div>
                  
                  {/* Declaration Document Upload - Show when packagesCount, materials, and declaredValue are filled */}
                  {shipmentDetails.packagesCount && shipmentDetails.packagesCount.trim().length > 0 && 
                   shipmentDetails.materials && shipmentDetails.materials.trim().length > 0 &&
                   shipmentDetails.declaredValue && shipmentDetails.declaredValue.trim().length > 0 &&
                   (shipmentDetails.materials !== 'Others' || (shipmentDetails.materials === 'Others' && shipmentDetails.others && shipmentDetails.others.trim().length > 0)) && (
                    <div className={cn(
                      'rounded-xl border p-4 transition-all duration-300',
                      isDarkMode
                        ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
                        : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
                    )}>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className={cn('h-4 w-4', isDarkMode ? 'text-blue-400' : 'text-blue-600')} />
                        <label className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          Declaration Document <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          id="declaration-document-upload"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setShipmentDetails((prev) => ({
                                ...prev,
                                declarationDocument: file,
                                declarationDocumentName: file.name
                              }));
                            }
                          }}
                        />
                        <label
                          htmlFor="declaration-document-upload"
                          className={cn(
                            'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                            isDarkMode
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          )}
                        >
                          Select Document
                        </label>
                        <div className="min-w-0 flex-1 text-xs">
                          <p className={cn('truncate', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                            {shipmentDetails.declarationDocumentName || 'No document selected'}
                          </p>
                          <p className={cn('text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                            Accepted formats: PDF, JPG, PNG. Max 10MB.
                          </p>
                        </div>
                        {shipmentDetails.declarationDocument && (
                          <button
                            type="button"
                            onClick={() => {
                              setShipmentDetails((prev) => ({
                                ...prev,
                                declarationDocument: null,
                                declarationDocumentName: ''
                              }));
                              const input = document.getElementById('declaration-document-upload') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                            className={cn(
                              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                              isDarkMode
                                ? 'bg-red-500/90 text-white hover:bg-red-600'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            )}
                          >
                            <XCircle className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>
                      {shipmentDetails.declarationDocument && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (shipmentDetails.declarationDocument) {
                                const url = URL.createObjectURL(shipmentDetails.declarationDocument);
                                setDocumentPreviewUrl(url);
                                setDocumentPreviewOpen(true);
                              }
                            }}
                            className={cn(
                              'flex items-center gap-2 text-xs font-medium',
                              isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                            )}
                          >
                            <Eye className="w-3 h-3" />
                            Preview Document
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Length, Width, Height - 3 column layout */}
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    <FloatingInput
                      label="Length cm. :"
                      value={shipmentDetails.length}
                      onChange={(value) =>
                        setShipmentDetails((prev) => ({ ...prev, length: sanitizeDecimal(value) }))
                      }
                      type="text"
                    required={!hasActualWeight}
                      icon={<Ruler className="h-4 w-4" />}
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="Width cm. :"
                      value={shipmentDetails.width}
                      onChange={(value) =>
                        setShipmentDetails((prev) => ({ ...prev, width: sanitizeDecimal(value) }))
                      }
                      type="text"
                    required={!hasActualWeight}
                      icon={<Ruler className="h-4 w-4" />}
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="Height cm. :"
                      value={shipmentDetails.height}
                      onChange={(value) =>
                        setShipmentDetails((prev) => ({ ...prev, height: sanitizeDecimal(value) }))
                      }
                      type="text"
                    required={!hasActualWeight}
                      icon={<Ruler className="h-4 w-4" />}
                      isDarkMode={isDarkMode}
                    />
                </div>
                  
                  {/* Weight Inputs - Three column layout */}
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    {/* Volumetric Weight - Read-only */}
                    <FloatingInput
                      label="Volumetric Weight Kg. :"
                      value={formattedVolumetricWeight || ''}
                      onChange={() => {}}
                      type="text"
                      disabled={true}
                      icon={<Scale className="h-4 w-4" />}
                      isDarkMode={isDarkMode}
                    />
                    {/* Actual Weight - Editable */}
                    <FloatingInput
                      label="Actual Weight Kg. :"
                      value={shipmentDetails.weight}
                      onChange={(value) =>
                        setShipmentDetails((prev) => ({ ...prev, weight: sanitizeDecimal(value) }))
                      }
                      type="text"
                      required={!hasDimensions}
                      icon={<Scale className="h-4 w-4" />}
                      isDarkMode={isDarkMode}
                    />
                    {/* Chargeable Weight - Read-only */}
                    <div className={cn(
                      formattedChargeableWeight && parseFloat(formattedChargeableWeight) > 0
                        ? isDarkMode
                          ? 'bg-blue-500/20 shadow-[0_8px_24px_rgba(59,130,246,0.25)] rounded-xl p-1'
                          : 'bg-blue-50/80 shadow-[0_8px_24px_rgba(59,130,246,0.15)] rounded-xl p-1'
                        : ''
                    )}>
                      <FloatingInput
                        label="Chargeable Weight Kg. :"
                        value={formattedChargeableWeight || ''}
                        onChange={() => {}}
                        type="text"
                        disabled={true}
                        icon={<Scale className="h-4 w-4" />}
                        isDarkMode={isDarkMode}
                        noBorder={formattedChargeableWeight && parseFloat(formattedChargeableWeight) > 0}
                      />
                    </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          <div className="flex flex-row gap-3 sm:gap-4 pt-2 justify-between">
            <Button
              onClick={handlePreviousStep}
              className={cn(
                'w-auto px-6',
                isDarkMode
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              )}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={!isPackageStepComplete}
              className={cn(
                'w-auto px-6',
                isDarkMode
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white',
                !isPackageStepComplete && 'opacity-60 cursor-not-allowed'
              )}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Shipping Mode & Pricing */}
      {currentStep === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {loadingPricing ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Service Type Selection - Show First */}
              {availableServiceTypes && (
                <div
                  className={cn(
                    'rounded-xl p-4 transition-all duration-300',
                    isDarkMode
                      ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
                      : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
                  )}
                >
                  <div className="space-y-2">
                    <h4 className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                        Select Service Type
                      </h4>
                    <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                      {availableServiceTypes.standard && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedServiceType('standard');
                            setSelectedMode(''); // Reset mode when service type changes
                            setCalculatedPrice(null);
                          }}
                          className={cn(
                            'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                            selectedServiceType === 'standard'
                              ? isDarkMode
                                ? 'border-blue-500 bg-blue-500/20 shadow-[0_4px_12px_rgba(59,130,246,0.2)]'
                                : 'border-blue-500 bg-blue-50/80 shadow-[0_4px_12px_rgba(59,130,246,0.15)]'
                              : isDarkMode
                                ? 'border-slate-700/60 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                                : 'border-slate-200 hover:border-blue-400/60 hover:bg-blue-50/60'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'flex h-4 w-4 items-center justify-center rounded-full border text-xs transition-colors',
                                selectedServiceType === 'standard'
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : isDarkMode
                                    ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                    : 'border-slate-300 text-transparent'
                              )}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </div>
                              <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                              <span className="inline-flex items-center gap-1.5">
                                <Package className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                                  Standard
                                </span>
                              </p>
                          </div>
                        </button>
                      )}
                      {availableServiceTypes.priority && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedServiceType('priority');
                            setSelectedMode(''); // No mode needed for priority
                            setCalculatedPrice(null);
                          }}
                          className={cn(
                            'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                            String(selectedServiceType) === 'priority'
                              ? isDarkMode
                                ? 'border-blue-500 bg-blue-500/20 shadow-[0_4px_12px_rgba(59,130,246,0.2)]'
                                : 'border-blue-500 bg-blue-50/80 shadow-[0_4px_12px_rgba(59,130,246,0.15)]'
                              : isDarkMode
                                ? 'border-slate-700/60 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                                : 'border-slate-200 hover:border-blue-400/60 hover:bg-blue-50/60'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                  'flex h-4 w-4 items-center justify-center rounded-full border text-xs transition-colors',
                                String(selectedServiceType) === 'priority'
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : isDarkMode
                                    ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                    : 'border-slate-300 text-transparent'
                              )}
                            >
                                <Check className="h-2.5 w-2.5" />
                            </div>
                                <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                                <span className="inline-flex items-center gap-1.5">
                                  <ShieldCheck className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                                    Priority
                                  </span>
                                </p>
                            </div>
                                {calculatedPrice !== null && String(selectedServiceType) === 'priority' && (
                              <span className={cn('text-base font-bold', isDarkMode ? 'text-green-400' : 'text-green-600')}>
                                    ₹{calculatedPrice.toFixed(2)}
                                  </span>
                                )}
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mode Selection - Only show when Standard is selected */}
              {selectedServiceType === 'standard' && (
                <div
                  className={cn(
                    'rounded-xl p-4 transition-all duration-300',
                    isDarkMode
                      ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
                      : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
                  )}
                >
                  <div className="space-y-2">
                    <h4 className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                        Select Shipping Mode
                      </h4>
                    <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
                      {(!availableModes || availableModes.byAir) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMode('byAir');
                            setCalculatedPrice(null);
                          }}
                          className={cn(
                            'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                            selectedMode === 'byAir'
                              ? isDarkMode
                                ? 'border-blue-500 bg-blue-500/20 shadow-[0_4px_12px_rgba(59,130,246,0.2)]'
                                : 'border-blue-500 bg-blue-50/80 shadow-[0_4px_12px_rgba(59,130,246,0.15)]'
                              : isDarkMode
                                ? 'border-slate-700/60 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                                : 'border-slate-200 hover:border-blue-400/60 hover:bg-blue-50/60'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                  'flex h-4 w-4 items-center justify-center rounded-full border text-xs transition-colors',
                                selectedMode === 'byAir'
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : isDarkMode
                                    ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                    : 'border-slate-300 text-transparent'
                              )}
                            >
                                <Check className="h-2.5 w-2.5" />
                            </div>
                              <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                                <span className="inline-flex items-center gap-1.5">
                                  <Plane className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                                  Air
                                </span>
                              </p>
                            </div>
                            {selectedMode === 'byAir' && calculatedPrice !== null && (
                              <span className={cn('text-base font-bold', isDarkMode ? 'text-green-400' : 'text-green-600')}>
                                ₹{calculatedPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </button>
                      )}
                      {(!availableModes || availableModes.byTrain) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMode('byTrain');
                            setCalculatedPrice(null);
                          }}
                          className={cn(
                            'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                            selectedMode === 'byTrain'
                              ? isDarkMode
                                ? 'border-blue-500 bg-blue-500/20 shadow-[0_4px_12px_rgba(59,130,246,0.2)]'
                                : 'border-blue-500 bg-blue-50/80 shadow-[0_4px_12px_rgba(59,130,246,0.15)]'
                              : isDarkMode
                                ? 'border-slate-700/60 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                                : 'border-slate-200 hover:border-blue-400/60 hover:bg-blue-50/60'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                  'flex h-4 w-4 items-center justify-center rounded-full border text-xs transition-colors',
                                selectedMode === 'byTrain'
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : isDarkMode
                                    ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                    : 'border-slate-300 text-transparent'
                              )}
                            >
                                <Check className="h-2.5 w-2.5" />
                            </div>
                              <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                                <span className="inline-flex items-center gap-1.5">
                                  <Train className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                                  Train
                                </span>
                              </p>
                            </div>
                            {selectedMode === 'byTrain' && calculatedPrice !== null && (
                              <span className={cn('text-base font-bold', isDarkMode ? 'text-green-400' : 'text-green-600')}>
                                ₹{calculatedPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </button>
                      )}
                      {(!availableModes || availableModes.byRoad) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMode('byRoad');
                            setCalculatedPrice(null);
                          }}
                          className={cn(
                            'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                            selectedMode === 'byRoad'
                              ? isDarkMode
                                ? 'border-blue-500 bg-blue-500/20 shadow-[0_4px_12px_rgba(59,130,246,0.2)]'
                                : 'border-blue-500 bg-blue-50/80 shadow-[0_4px_12px_rgba(59,130,246,0.15)]'
                              : isDarkMode
                                ? 'border-slate-700/60 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                                : 'border-slate-200 hover:border-blue-400/60 hover:bg-blue-50/60'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                  'flex h-4 w-4 items-center justify-center rounded-full border text-xs transition-colors',
                                selectedMode === 'byRoad'
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : isDarkMode
                                    ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                    : 'border-slate-300 text-transparent'
                              )}
                            >
                                <Check className="h-2.5 w-2.5" />
                            </div>
                              <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                                <span className="inline-flex items-center gap-1.5">
                                  <Truck className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                                  Road
                                </span>
                              </p>
                            </div>
                            {selectedMode === 'byRoad' && calculatedPrice !== null && (
                              <span className={cn('text-base font-bold', isDarkMode ? 'text-green-400' : 'text-green-600')}>
                                ₹{calculatedPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Door Pickup Charge Note - Always visible for both Standard and Priority */}
              <div className={cn(
                'rounded-xl p-4 transition-all duration-300',
                isDarkMode
                  ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
                  : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
              )}>
                <div className="mt-0 pt-0">
                  <p className={cn('text-xs italic', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                    *Door pickup charge ₹100 (exclusive of GST) + 18% GST
                  </p>
                </div>
              </div>

                </div>
              )}

          <div className="flex flex-row gap-2 pt-2 justify-between">
            <Button
              onClick={handlePreviousStep}
              className={cn(
                'w-auto px-6',
                isDarkMode
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              )}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={!selectedServiceType || (selectedServiceType === 'standard' && !selectedMode)}
              className={cn(
                'w-auto px-6',
                isDarkMode
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white',
                (!selectedServiceType || (selectedServiceType === 'standard' && !selectedMode)) && 'opacity-60 cursor-not-allowed'
              )}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 5: Preview */}
      {currentStep === 5 && (() => {
        const finalPrice = calculatedPrice ?? 0;
        const totalWithPickup = finalPrice + TOTAL_PICKUP_CHARGE;
        const formattedPrice = finalPrice ? `₹${totalWithPickup.toFixed(2)}` : '—';
        const originAlternates = originData.alternateNumbers?.filter((num) => num.trim());
        const destinationAlternates = destinationData.alternateNumbers?.filter((num) => num.trim());
        const formatDate = (value: string) => {
          if (!value) return null;
          const parsed = new Date(value);
          if (Number.isNaN(parsed.getTime())) return null;
          return parsed.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        };
        const renderAddress = (data: typeof originData) => {
          const lines = [
            [data.flatBuilding, data.landmark].filter(Boolean).join(', '),
            [data.locality, data.area].filter(Boolean).join(', '),
            [data.city, data.state, data.pincode].filter(Boolean).join(', ')
          ].filter((line) => line);
          return lines.join(', ');
        };
        const modeLabelMap: Record<typeof selectedMode, string> = {
          byAir: 'Air',
          byTrain: 'Train',
          byRoad: 'Road',
          '': ''
        };
        const serviceLabel = selectedServiceType === 'priority' ? 'PRIORITY' : 'STANDARD';

        // Edit handlers - toggle inline editing
        const handleEditOrigin = () => {
          setEditingSection(editingSection === 'origin' ? null : 'origin');
        };

        const handleEditDestination = () => {
          setEditingSection(editingSection === 'destination' ? null : 'destination');
        };

        const handleEditShipment = () => {
          setEditingSection(editingSection === 'shipment' ? null : 'shipment');
        };

        const handleEditPackage = () => {
          setEditingSection(editingSection === 'package' ? null : 'package');
        };

        const handleEditShipping = () => {
          setEditingSection(editingSection === 'shipping' ? null : 'shipping');
        };

        // Save handlers for inline editing
        const handleSaveOrigin = () => {
          setEditingSection(null);
        };

        const handleSaveDestination = () => {
          setEditingSection(null);
        };

        const handleSaveShipment = () => {
          setEditingSection(null);
        };

        const handleSavePackage = () => {
          setEditingSection(null);
        };

        const handleSaveShipping = () => {
          setEditingSection(null);
        };

        const handleCancelEdit = () => {
          setEditingSection(null);
        };

        return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
        >
            <div className="space-y-2.5">
              {/* Origin Address */}
              <div className={cn(
                'rounded-lg border p-2.5 transition-all duration-200',
                isDarkMode
                  ? 'border-slate-800/50 bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-800/80 hover:border-blue-500/30'
                  : 'border-slate-200/60 bg-gradient-to-br from-slate-100/90 via-blue-50/70 to-slate-100/90 hover:border-blue-400/50'
              )}>
                <div className={cn(
                  'flex items-center justify-between mb-2',
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                )}>
                  <h4 className={cn(
                    'text-sm font-semibold flex items-center gap-1.5',
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    <MapPin className="h-3.5 w-3.5" />
                    Sender :
                  </h4>
                  <div className="flex items-center gap-2">
                    {originData.addressType && (
                      <span className={cn(
                        'text-xs font-semibold px-3 py-1.5 rounded-full border-2 shadow-sm',
                        'uppercase tracking-wide',
                        isDarkMode 
                          ? 'text-blue-300 bg-blue-500/20 border-blue-400/40 shadow-blue-500/10' 
                          : 'text-blue-700 bg-blue-50 border-blue-300 shadow-blue-200/50'
                      )}>
                        {originData.addressType}
                      </span>
                    )}
                  <button
                    onClick={handleEditOrigin}
              className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                isDarkMode
                        ? 'text-blue-300 hover:bg-blue-500/20'
                        : 'text-blue-600 hover:bg-blue-50'
                    )}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
            </div>
            </div>
                <div className="space-y-2 text-sm">
                  {/* Line 1: Company name, Concern person */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <p className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                      {originData.companyName || ''}
                    </p>
                    <p className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>{originData.name}</p>
                  </div>
                  
                  {/* Line 2: Address */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-3">
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{renderAddress(originData)}</p>
                    </div>
                </div>
                  
                  {/* Line 3: Phone, Email, Website */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>+91 {originData.mobileNumber}</p>
                    {originData.email && (
                      <a 
                        href={`mailto:${originData.email}`}
                        className={cn(
                          'text-[9px] sm:text-[10px] md:text-xs font-medium underline hover:opacity-80',
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        )}
                      >
                        {originData.email}
                      </a>
                    )}
                    {originData.website && (
                      <a 
                        href={originData.website.startsWith('http') ? originData.website : `https://${originData.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'text-[9px] sm:text-[10px] md:text-xs font-medium underline hover:opacity-80',
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        )}
                      >
                        {originData.website}
                      </a>
                    )}
                </div>
                  
                  {/* Line 4: GST, Birthday and Anniversary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {originData.gstNumber && (
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{originData.gstNumber}</p>
                    )}
                    {originData.birthday && (
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                        {formatDate(originData.birthday) || originData.birthday}
                      </p>
                    )}
                    {originData.anniversary && (
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                        {formatDate(originData.anniversary) || originData.anniversary}
                      </p>
                    )}
                  </div>
                  
                  {/* Alternate Numbers - if any */}
                  {originAlternates && originAlternates.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{originAlternates.join(', ')}</p>
                    </div>
                  )}
              </div>
            </div>

              {/* Origin Address Edit Dialog */}
              <Dialog open={editingSection === 'origin'} onOpenChange={(open) => !open && setEditingSection(null)}>
                <DialogContent className={cn(
                  'max-w-3xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                )}>
                  <DialogHeader>
                    <DialogTitle className={cn(isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                      Edit Sender :
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FloatingInput
                        label="Concern Person"
                        value={originData.name}
                        onChange={(value) => setOriginData((prev) => ({ ...prev, name: value }))}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <FloatingSelect
                        label="Address Type"
                        value={originData.addressType}
                        onChange={(value) => setOriginData((prev) => ({ ...prev, addressType: value }))}
                        options={addressTypeOptions}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Company Name"
                        value={originData.companyName}
                        onChange={(value) => setOriginData((prev) => ({ ...prev, companyName: value }))}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Phone"
                        value={`+91 ${originData.mobileNumber}`}
                        onChange={() => {}}
                        disabled
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Email"
                        value={originData.email}
                        onChange={(value) => setOriginData((prev) => ({ ...prev, email: value }))}
                        type="email"
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="GST Number"
                        value={originData.gstNumber}
                        onChange={(value) => setOriginData((prev) => ({ ...prev, gstNumber: value }))}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Flat, Building"
                        value={originData.flatBuilding}
                        onChange={(value) => setOriginData((prev) => ({ ...prev, flatBuilding: value }))}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Locality"
                        value={originData.locality}
                        onChange={(value) => setOriginData((prev) => ({ ...prev, locality: value }))}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Landmark"
                        value={originData.landmark}
                        onChange={(value) => setOriginData((prev) => ({ ...prev, landmark: value }))}
                        isDarkMode={isDarkMode}
                      />
                      {originAreas.length > 0 ? (
                        <FloatingSelect
                          label="Area"
                          value={originData.area}
                          onChange={(value) => setOriginData((prev) => ({ ...prev, area: value }))}
                          options={originAreas}
                          required
                          isDarkMode={isDarkMode}
                        />
                      ) : (
                        <FloatingInput
                          label="Area"
                          value={originData.area}
                          onChange={(value) => setOriginData((prev) => ({ ...prev, area: value }))}
                          required
                          isDarkMode={isDarkMode}
                        />
                      )}
                      <FloatingInput
                        label="District"
                        value={originData.district}
                        onChange={(_value) => {}}
                        disabled
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Website"
                        value={originData.website}
                        onChange={(value) => setOriginData((prev) => ({ ...prev, website: value }))}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Birthday"
                        value={originData.birthday}
                        onChange={(value) => setOriginData((prev) => ({ ...prev, birthday: value }))}
                        type="date"
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Anniversary"
                        value={originData.anniversary}
                        onChange={(value) => setOriginData((prev) => ({ ...prev, anniversary: value }))}
                        type="date"
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setEditingSection(null)}
              className={cn(
                isDarkMode
                          ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveOrigin}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Save Changes
                    </Button>
            </div>
                </DialogContent>
              </Dialog>

              {/* Destination Address */}
              <div className={cn(
                'rounded-lg border p-2.5 transition-all duration-200',
                isDarkMode
                  ? 'border-slate-800/50 bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-800/80 hover:border-blue-500/30'
                  : 'border-slate-200/60 bg-gradient-to-br from-slate-100/90 via-blue-50/70 to-slate-100/90 hover:border-blue-400/50'
              )}>
                <div className={cn(
                  'flex items-center justify-between mb-2',
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                )}>
                  <h4 className={cn(
                    'text-sm font-semibold flex items-center gap-1.5',
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    <MapPin className="h-3.5 w-3.5" />
                    Recipient :
                  </h4>
                  <div className="flex items-center gap-2">
                    {destinationData.addressType && (
                      <span className={cn(
                        'text-xs font-semibold px-3 py-1.5 rounded-full border-2 shadow-sm',
                        'uppercase tracking-wide',
                        isDarkMode 
                          ? 'text-blue-300 bg-blue-500/20 border-blue-400/40 shadow-blue-500/10' 
                          : 'text-blue-700 bg-blue-50 border-blue-300 shadow-blue-200/50'
                      )}>
                        {destinationData.addressType}
                      </span>
                    )}
                  <button
                    onClick={handleEditDestination}
              className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                isDarkMode
                        ? 'text-blue-300 hover:bg-blue-500/20'
                        : 'text-blue-600 hover:bg-blue-50'
                    )}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                </div>
                </div>
                <div className="space-y-2 text-sm">
                  {/* Line 1: Company name, Concern person */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <p className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                      {destinationData.companyName || ''}
                    </p>
                    <p className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>{destinationData.name}</p>
                </div>
                  
                  {/* Line 2: Address */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-3">
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{renderAddress(destinationData)}</p>
                </div>
                </div>
                  
                  {/* Line 3: Phone, Email, Website */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>+91 {destinationData.mobileNumber}</p>
                    {destinationData.email && (
                      <a 
                        href={`mailto:${destinationData.email}`}
                        className={cn(
                          'text-[9px] sm:text-[10px] md:text-xs font-medium underline hover:opacity-80',
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        )}
                      >
                        {destinationData.email}
                      </a>
                    )}
                    {destinationData.website && (
                      <a 
                        href={destinationData.website.startsWith('http') ? destinationData.website : `https://${destinationData.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'text-[9px] sm:text-[10px] md:text-xs font-medium underline hover:opacity-80',
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        )}
                      >
                        {destinationData.website}
                      </a>
                    )}
              </div>
                  
                  {/* Line 4: GST, Birthday and Anniversary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {destinationData.gstNumber && (
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{destinationData.gstNumber}</p>
                    )}
                    {destinationData.birthday && (
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                        {formatDate(destinationData.birthday) || destinationData.birthday}
                      </p>
                    )}
                    {destinationData.anniversary && (
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                        {formatDate(destinationData.anniversary) || destinationData.anniversary}
                      </p>
                    )}
                  </div>
                  
                  {/* Alternate Numbers - if any */}
                  {destinationAlternates && destinationAlternates.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{destinationAlternates.join(', ')}</p>
                  </div>
                  )}
                </div>
              </div>

              {/* Destination Address Edit Dialog */}
              <Dialog open={editingSection === 'destination'} onOpenChange={(open) => !open && setEditingSection(null)}>
                <DialogContent className={cn(
                  'max-w-3xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                )}>
                  <DialogHeader>
                    <DialogTitle className={cn(isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                      Edit Destination 
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FloatingInput
                        label="Concern Person"
                        value={destinationData.name}
                        onChange={(value) => setDestinationData((prev) => ({ ...prev, name: value }))}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <FloatingSelect
                        label="Address Type"
                        value={destinationData.addressType}
                        onChange={(value) => setDestinationData((prev) => ({ ...prev, addressType: value }))}
                        options={addressTypeOptions}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Company Name"
                        value={destinationData.companyName}
                        onChange={(value) => setDestinationData((prev) => ({ ...prev, companyName: value }))}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Phone"
                        value={`+91 ${destinationData.mobileNumber}`}
                        onChange={() => {}}
                        disabled
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Email"
                        value={destinationData.email}
                        onChange={(value) => setDestinationData((prev) => ({ ...prev, email: value }))}
                        type="email"
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="GST Number"
                        value={destinationData.gstNumber}
                        onChange={(value) => setDestinationData((prev) => ({ ...prev, gstNumber: value }))}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Flat, Building"
                        value={destinationData.flatBuilding}
                        onChange={(value) => setDestinationData((prev) => ({ ...prev, flatBuilding: value }))}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Locality"
                        value={destinationData.locality}
                        onChange={(value) => setDestinationData((prev) => ({ ...prev, locality: value }))}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Landmark"
                        value={destinationData.landmark}
                        onChange={(value) => setDestinationData((prev) => ({ ...prev, landmark: value }))}
                        isDarkMode={isDarkMode}
                      />
                      {destinationAreas.length > 0 ? (
                        <FloatingSelect
                          label="Area"
                          value={destinationData.area}
                          onChange={(value) => setDestinationData((prev) => ({ ...prev, area: value }))}
                          options={destinationAreas}
                          required
                          isDarkMode={isDarkMode}
                        />
                      ) : (
                        <FloatingInput
                          label="Area"
                          value={destinationData.area}
                          onChange={(value) => setDestinationData((prev) => ({ ...prev, area: value }))}
                          required
                          isDarkMode={isDarkMode}
                        />
                      )}
                      <FloatingInput
                        label="District"
                        value={destinationData.district}
                        onChange={(_value) => {}}
                        disabled
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Website"
                        value={destinationData.website}
                        onChange={(value) => setDestinationData((prev) => ({ ...prev, website: value }))}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Birthday"
                        value={destinationData.birthday}
                        onChange={(value) => setDestinationData((prev) => ({ ...prev, birthday: value }))}
                        type="date"
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Anniversary"
                        value={destinationData.anniversary}
                        onChange={(value) => setDestinationData((prev) => ({ ...prev, anniversary: value }))}
                        type="date"
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setEditingSection(null)}
              className={cn(
                isDarkMode
                          ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveDestination}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Shipment Details */}
              <div className={cn(
                'rounded-lg border p-2.5 transition-all duration-200',
                isDarkMode
                  ? 'border-slate-800/50 bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-800/80 hover:border-blue-500/30'
                  : 'border-slate-200/60 bg-gradient-to-br from-slate-100/90 via-blue-50/70 to-slate-100/90 hover:border-blue-400/50'
              )}>
                <div className={cn(
                  'flex items-center justify-between mb-2',
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                )}>
                  <h4 className={cn(
                    'text-sm font-semibold flex items-center gap-1.5',
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    <Package className="h-3.5 w-3.5" />
                    Shipment Details :
              </h4>
                  <button
                    onClick={handleEditShipment}
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                      isDarkMode
                        ? 'text-blue-300 hover:bg-blue-500/20'
                        : 'text-blue-600 hover:bg-blue-50'
                    )}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {/* Line 1: Nature, Insurance, Risk Coverage */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                        {shipmentDetails.natureOfConsignment === 'DOX' ? 'Document' : 
                         shipmentDetails.natureOfConsignment === 'NON-DOX' ? 'Parcel' : 
                         shipmentDetails.natureOfConsignment}
                      </p>
                </div>
                <div>
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{shipmentDetails.insurance}</p>
                </div>
                <div>
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{shipmentDetails.riskCoverage}</p>
                </div>
                  </div>
                  
                  {/* Line 2: Package, Material */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{shipmentDetails.packagesCount}</p>
                    </div>
                    <div>
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                        {shipmentDetails.materials}
                        {shipmentDetails.materials === 'Others' && shipmentDetails.others && ` (${shipmentDetails.others})`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Line 2.5: Description, Declared Value - Two column layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Content Description:</span>
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                        {shipmentDetails.description || '—'}
                      </p>
                    </div>
                    <div>
                      <span className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Declared Value:</span>
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                        {shipmentDetails.declaredValue ? `₹${parseFloat(shipmentDetails.declaredValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Line 3: Actual Weight, Volumetric Weight, Chargeable Weight */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <span className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Actual Weight:</span>
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{displayActualWeight}</p>
                    </div>
                    <div>
                      <span className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Volumetric Weight:</span>
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{displayVolumetricWeight}</p>
                    </div>
                    <div>
                      <span className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Chargeable Weight:</span>
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-blue-300' : 'text-blue-600')}>{displayChargeableWeight}</p>
                    </div>
                  </div>
                  
                  {/* Insurance Details - if applicable */}
                {shipmentDetails.insurance === 'With insurance' && (
                    <div className={cn(
                      "space-y-2 pt-2 border-t",
                      isDarkMode ? "border-slate-700/30" : "border-slate-300/30"
                    )}>
                      {/* Line 1: Company, Policy Number, Premium Amount */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                          <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                        {shipmentDetails.insuranceCompanyName || 'Pending'}
                      </p>
                    </div>
                    <div>
                          <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                        {shipmentDetails.insurancePolicyNumber || 'Pending'}
                      </p>
                    </div>
                    <div>
                          <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                            {shipmentDetails.insurancePremiumAmount || 'Not provided'}
                      </p>
                    </div>
                      </div>
                      
                      {/* Line 2: Policy Date, Policy Valid Upto, Document */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                          <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                            {shipmentDetails.insurancePolicyDate || 'Pending'}
                      </p>
                    </div>
                    <div>
                          <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                            {shipmentDetails.insuranceValidUpto || 'Pending'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                            <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium break-words', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                        {shipmentDetails.insuranceDocumentName || 'Pending'}
                      </p>
                        {shipmentDetails.insuranceDocument && (
                          <button
                            type="button"
                            onClick={() => {
                              if (shipmentDetails.insuranceDocument) {
                                const url = URL.createObjectURL(shipmentDetails.insuranceDocument);
                                setDocumentPreviewUrl(url);
                                setDocumentPreviewOpen(true);
                              }
                            }}
                            className={cn(
                              'p-1 rounded transition-colors flex-shrink-0',
                              isDarkMode
                                ? 'text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                                : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                            )}
                            title="Preview document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                  )}
              </div>
            </div>

              {/* Shipment Details Edit Dialog */}
              <Dialog open={editingSection === 'shipment'} onOpenChange={(open) => !open && setEditingSection(null)}>
                <DialogContent className={cn(
                  'max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                )}>
                  <DialogHeader>
                    <DialogTitle className={cn(isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                      Edit Shipment Details
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FloatingSelect
                        label="Nature of Consignment"
                        value={shipmentDetails.natureOfConsignment === 'DOX' ? 'Document' : 
                               shipmentDetails.natureOfConsignment === 'NON-DOX' ? 'Parcel' : 
                               shipmentDetails.natureOfConsignment}
                        onChange={(value) => {
                          const actualValue = value === 'Document' ? 'DOX' : value === 'Parcel' ? 'NON-DOX' : value;
                          setShipmentDetails((prev) => ({ ...prev, natureOfConsignment: actualValue }));
                        }}
                        options={['Document', 'Parcel']}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <FloatingSelect
                        label="Insurance"
                        value={shipmentDetails.insurance}
                        onChange={(value) => handleInsuranceSelection(value)}
                        options={insuranceOptions.map(opt => opt.value)}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <FloatingSelect
                        label="Risk Coverage"
                        value={shipmentDetails.riskCoverage}
                        onChange={(value) => setShipmentDetails((prev) => ({ ...prev, riskCoverage: value }))}
                        options={riskCoverageOptions.map(opt => opt.value)}
                        required
                        disabled={true}
                        isDarkMode={isDarkMode}
                      />
                      
                      {/* Insurance Details - shown when insurance is "With insurance" */}
                      {shipmentDetails.insurance === 'With insurance' && (
                        <>
                          <FloatingInput
                            label="Insurance Company Name"
                            value={shipmentDetails.insuranceCompanyName}
                            onChange={(value) => setShipmentDetails((prev) => ({ ...prev, insuranceCompanyName: value }))}
                            required
                            isDarkMode={isDarkMode}
                          />
                          <FloatingInput
                            label="Policy Number"
                            value={shipmentDetails.insurancePolicyNumber}
                            onChange={(value) => setShipmentDetails((prev) => ({ ...prev, insurancePolicyNumber: value }))}
                            required
                            isDarkMode={isDarkMode}
                          />
                          <FloatingInput
                            label="Policy Date"
                            type="date"
                            value={shipmentDetails.insurancePolicyDate}
                            onChange={(value) => setShipmentDetails((prev) => ({ ...prev, insurancePolicyDate: value }))}
                            required
                            isDarkMode={isDarkMode}
                          />
                          <FloatingInput
                            label="Policy Valid Upto"
                            type="date"
                            value={shipmentDetails.insuranceValidUpto}
                            onChange={(value) => setShipmentDetails((prev) => ({ ...prev, insuranceValidUpto: value }))}
                            required
                            isDarkMode={isDarkMode}
                          />
                          <FloatingInput
                            label="Premium Amount"
                            value={shipmentDetails.insurancePremiumAmount}
                            onChange={(value) => setShipmentDetails((prev) => ({ ...prev, insurancePremiumAmount: value }))}
                            isDarkMode={isDarkMode}
                          />
                          <div className="md:col-span-2">
                            <label
                              className={cn(
                                'text-xs font-normal block mb-2',
                                isDarkMode ? 'text-slate-200' : 'text-slate-700'
                              )}
                            >
                              Upload Policy Document :<span className="text-red-500 ml-1">*</span>
                            </label>
                            <div
                              className={cn(
                                'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                                isDarkMode
                                  ? 'border-slate-700 bg-slate-800/40 hover:border-blue-500/50'
                                  : 'border-slate-300 bg-slate-50 hover:border-blue-400'
                              )}
                            >
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                id="insurance-document-edit"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setShipmentDetails((prev) => ({
                                      ...prev,
                                      insuranceDocument: file,
                                      insuranceDocumentName: file.name
                                    }));
                                  }
                                }}
                              />
                              <label
                                htmlFor="insurance-document-edit"
                                className="cursor-pointer"
                              >
                                {shipmentDetails.insuranceDocumentName ? (
                                  <p className={cn('text-sm', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                                    {shipmentDetails.insuranceDocumentName}
                                  </p>
                                ) : (
                                  <p className={cn('text-sm', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                    Click to upload document
                                  </p>
                                )}
                              </label>
                            </div>
                          </div>
                        </>
                      )}
                      <FloatingInput
                        label="No. of Packages"
                        value={shipmentDetails.packagesCount}
                        onChange={(value) => setShipmentDetails((prev) => ({ ...prev, packagesCount: sanitizeInteger(value) }))}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <div className="md:col-span-2">
                        <FloatingSelect
                          label="Package Type"
                        value={shipmentDetails.materials}
                          onChange={(value) => setShipmentDetails((prev) => ({ 
                            ...prev, 
                            materials: value,
                            others: value === 'Others' ? prev.others : ''
                          }))}
                          options={packageTypeOptions.map(opt => opt.value)}
                        required
                        isDarkMode={isDarkMode}
                      />
                      </div>
                      {shipmentDetails.materials === 'Others' && (
                        <FloatingInput
                          label="Others - Specify"
                          value={shipmentDetails.others}
                          onChange={(value) => setShipmentDetails((prev) => ({ ...prev, others: value }))}
                          required
                          isDarkMode={isDarkMode}
                          className="md:col-span-2"
                        />
                      )}
                      <FloatingInput
                        label="Length (cm)"
                        value={shipmentDetails.length}
                        onChange={(value) => setShipmentDetails((prev) => ({ ...prev, length: sanitizeDecimal(value) }))}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Width (cm)"
                        value={shipmentDetails.width}
                        onChange={(value) => setShipmentDetails((prev) => ({ ...prev, width: sanitizeDecimal(value) }))}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Height (cm)"
                        value={shipmentDetails.height}
                        onChange={(value) => setShipmentDetails((prev) => ({ ...prev, height: sanitizeDecimal(value) }))}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Actual Weight (kg)"
                        value={shipmentDetails.weight}
                        onChange={(value) => setShipmentDetails((prev) => ({ ...prev, weight: sanitizeDecimal(value) }))}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Content Description"
                        value={shipmentDetails.description}
                        onChange={(value) => setShipmentDetails((prev) => ({ ...prev, description: value }))}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingInput
                        label="Declared Value (₹)"
                        value={shipmentDetails.declaredValue}
                        onChange={(value) => setShipmentDetails((prev) => ({ ...prev, declaredValue: sanitizeDecimal(value) }))}
                        isDarkMode={isDarkMode}
                        icon={<DollarSign className="h-4 w-4" />}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setEditingSection(null)}
                className={cn(
                  isDarkMode
                          ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveShipment}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

            {imagePreviews.length > 0 && (
                <div className={cn(
                  'rounded-lg border p-2.5 transition-all duration-200',
                  isDarkMode
                    ? 'border-slate-800/50 bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-800/80 hover:border-blue-500/30'
                    : 'border-slate-200/60 bg-gradient-to-br from-slate-100/90 via-blue-50/70 to-slate-100/90 hover:border-blue-400/50'
                )}>
                  <div className={cn(
                    'flex items-center justify-between mb-2',
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    <h4 className={cn(
                      'text-sm font-semibold flex items-center gap-1.5',
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    )}>
                      <Image className="h-3.5 w-3.5" />
                  Package Images :
                </h4>
                    <button
                      onClick={handleEditPackage}
                      className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                        isDarkMode
                          ? 'text-blue-300 hover:bg-blue-500/20'
                          : 'text-blue-600 hover:bg-blue-50'
                      )}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  </div>
                  <div className={cn(
                    "grid gap-2",
                    imagePreviews.length === 3 ? "grid-cols-3" :
                    imagePreviews.length === 4 ? "grid-cols-4" :
                    "grid-cols-5"
                  )}>
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className={cn(
                          'overflow-hidden rounded border',
                        isDarkMode ? 'border-slate-700' : 'border-slate-200'
                      )}
                    >
                      <img
                        src={preview}
                          alt={`Package ${index + 1}`}
                          className="h-16 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Package Images Edit Dialog */}
            <Dialog open={editingSection === 'package'} onOpenChange={(open) => !open && setEditingSection(null)}>
              <DialogContent className={cn(
                'max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              )}>
                <DialogHeader>
                  <DialogTitle className={cn(isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                    Edit Package Images
                  </DialogTitle>
                  <DialogDescription className={cn(isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                    (Maximum 5 images)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div
                    className={cn(
                      'flex flex-wrap items-center gap-2 rounded-md border p-2',
                      isDarkMode
                        ? 'border-slate-700 bg-slate-800/50'
                        : 'border-slate-300 bg-slate-50'
                    )}
                  >
                  <input
                    id="image-upload-edit"
                      type="file"
                    accept="image/*"
                    multiple
                      className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length + uploadedImages.length > 5) {
                        alert('Maximum 5 images allowed');
                        return;
                      }
                      const newFiles = [...uploadedImages, ...files];
                      setUploadedImages(newFiles);
                      
                      const newPreviews: string[] = [...imagePreviews];
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          newPreviews.push(reader.result as string);
                          if (newPreviews.length === newFiles.length) {
                            setImagePreviews(newPreviews);
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                  />
                  <label
                    htmlFor="image-upload-edit"
                    className={cn(
                        'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isDarkMode
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                    )}
                  >
                      Select Images
                  </label>
                    <div className="min-w-0 flex-1 text-xs">
                      <p className={cn('truncate', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                        {uploadedImages.length > 0 
                          ? `${uploadedImages.length} image${uploadedImages.length !== 1 ? 's' : ''} selected`
                          : 'No images selected'}
                      </p>
                      <p className={cn('text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                        Accepted formats: JPG, PNG. Max 5 images.
                      </p>
                    </div>
                    {uploadedImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImages([]);
                          setImagePreviews([]);
                        }}
                        className={cn(
                          'rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                          isDarkMode
                            ? 'bg-red-500/90 text-white hover:bg-red-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        )}
                      >
                        <XCircle className="w-3 h-3" />
                        Remove All
                      </button>
                    )}
                  </div>

                  {/* Image Previews Grid */}
                  {imagePreviews.length > 0 && (
                    <div className={cn(
                      "grid gap-2 mt-2",
                      imagePreviews.length === 3 ? "grid-cols-3" :
                      imagePreviews.length === 4 ? "grid-cols-4" :
                      "grid-cols-5"
                    )}>
                    {imagePreviews.map((preview, index) => (
                      <div
                        key={index}
                        className={cn(
                            'relative group rounded-lg overflow-hidden border',
                          isDarkMode ? 'border-slate-700' : 'border-slate-200'
                        )}
                      >
                        <img
                          src={preview}
                          alt={`Package ${index + 1}`}
                          className="h-24 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = uploadedImages.filter((_, i) => i !== index);
                            const newPreviews = imagePreviews.filter((_, i) => i !== index);
                            setUploadedImages(newFiles);
                            setImagePreviews(newPreviews);
                          }}
                          className={cn(
                            'absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                            isDarkMode
                              ? 'bg-red-500/80 text-white hover:bg-red-600'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          )}
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
          </div>
                    ))}
                  </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setEditingSection(null)}
                    className={cn(
                      isDarkMode
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePackage}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

              {/* Shipping & Pricing */}
              <div className={cn(
                'rounded-lg border p-2.5 transition-all duration-200',
                isDarkMode
                  ? 'border-slate-800/50 bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-800/80 hover:border-blue-500/30'
                  : 'border-slate-200/60 bg-gradient-to-br from-slate-100/90 via-blue-50/70 to-slate-100/90 hover:border-blue-400/50'
              )}>
                <div className={cn(
                  'flex items-center justify-between mb-2',
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                )}>
                  <h4 className={cn(
                    'text-sm font-semibold flex items-center gap-1.5',
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    <Truck className="h-3.5 w-3.5" />
                    Pricing :
                  </h4>
                  <button
                    onClick={handleEditShipping}
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                      isDarkMode
                        ? 'text-blue-300 hover:bg-blue-500/20'
                        : 'text-blue-600 hover:bg-blue-50'
                    )}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm items-center">
                  <div className="flex items-center">
                    <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{modeLabelMap[selectedMode]}</p>
                  </div>
                  <div className="flex items-center">
                    <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{serviceLabel}</p>
                  </div>
                  <div className="flex items-center">
                    <p className={cn('text-lg font-bold', isDarkMode ? 'text-green-400' : 'text-green-600')}>{formattedPrice}</p>
                  </div>
                </div>
              </div>

              {/* Shipping & Pricing Edit Dialog */}
              <Dialog open={editingSection === 'shipping'} onOpenChange={(open) => !open && setEditingSection(null)}>
                <DialogContent className={cn(
                  'max-w-md max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                )}>
                  <DialogHeader>
                    <DialogTitle className={cn(isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                      Edit Shipping & Pricing
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-3">
                    <div className="grid grid-cols-1 gap-3">
                      <FloatingSelect
                        label="Shipping Mode"
                        value={selectedMode === 'byAir' ? 'By Air' : selectedMode === 'byTrain' ? 'By Train' : selectedMode === 'byRoad' ? 'By Road' : selectedMode}
                        onChange={(value) => {
                          const actualValue = value === 'By Air' ? 'byAir' : value === 'By Train' ? 'byTrain' : value === 'By Road' ? 'byRoad' : value;
                          setSelectedMode(actualValue as 'byAir' | 'byTrain' | 'byRoad');
                          setSelectedServiceType(''); // Reset service type when mode changes
                        }}
                        options={[
                          ...(availableModes?.byAir ? ['By Air'] : []),
                          ...(availableModes?.byTrain ? ['By Train'] : []),
                          ...(availableModes?.byRoad ? ['By Road'] : [])
                        ]}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <FloatingSelect
                        label="Service Type"
                        value={selectedServiceType === 'priority' ? 'PRIORITY' : selectedServiceType === 'standard' ? 'STANDARD' : selectedServiceType}
                        onChange={(value) => {
                          const actualValue = value === 'PRIORITY' ? 'priority' : value === 'STANDARD' ? 'standard' : value;
                          setSelectedServiceType(actualValue as 'standard' | 'priority');
                        }}
                        options={[
                          ...(availableServiceTypes?.standard ? ['STANDARD'] : []),
                          ...(availableServiceTypes?.priority ? ['PRIORITY'] : [])
                        ]}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <div className={cn(
                        'p-3 rounded-lg border flex items-center gap-2',
                        isDarkMode
                          ? 'border-slate-700 bg-slate-800/50'
                          : 'border-slate-200 bg-slate-50'
                      )}>
                        <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Price:</span>
                        <p className={cn('text-base font-bold', isDarkMode ? 'text-green-400' : 'text-green-600')}>{formattedPrice}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditingSection(null)}
                      className={cn(
                        isDarkMode
                          ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveShipping}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
          </div>

            <div className="flex flex-row gap-3 sm:gap-4 pt-2 justify-between">
            <Button
              onClick={handlePreviousStep}
              className={cn(
                'w-auto px-6',
                isDarkMode
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              )}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={uploadingImages || savingBooking}
              className={cn(
                'w-auto px-6',
                isDarkMode
                  ? 'bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {uploadingImages ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading Images...
                </>
              ) : savingBooking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Booking...
                </>
              ) : (
                <>
                  Submit Booking
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
        );
      })()}

      {/* Insurance Modal */}
      <Dialog
        open={insuranceModalOpen}
        onOpenChange={(open) => {
          if (open) {
            setInsuranceModalOpen(true);
          } else {
            handleInsuranceFormCancel();
          }
        }}
      >
        <DialogContent
          className={cn(
            'max-w-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          )}
        >
          <DialogHeader>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <FloatingInput
              label="Company Name :"
              value={insuranceForm.companyName}
              onChange={(value) => {
                setInsuranceForm((prev) => ({ ...prev, companyName: value }));
                if (insuranceFormError) setInsuranceFormError('');
              }}
              required
              isDarkMode={isDarkMode}
            />
            <FloatingInput
              label="Policy No. :"
              value={insuranceForm.policyNumber}
              onChange={(value) => {
                setInsuranceForm((prev) => ({ ...prev, policyNumber: value }));
                if (insuranceFormError) setInsuranceFormError('');
              }}
              required
              isDarkMode={isDarkMode}
            />
            <FloatingInput
              label="Policy Date :"
              type="date"
              value={insuranceForm.policyDate}
              onChange={(value) => {
                setInsuranceForm((prev) => ({ ...prev, policyDate: value }));
                if (insuranceFormError) setInsuranceFormError('');
              }}
              required
              isDarkMode={isDarkMode}
            />
            <FloatingInput
              label="Policy Date Valid Upto :"
              type="date"
              value={insuranceForm.validUpto}
              onChange={(value) => {
                setInsuranceForm((prev) => ({ ...prev, validUpto: value }));
                if (insuranceFormError) setInsuranceFormError('');
              }}
              required
              isDarkMode={isDarkMode}
            />
            <div className="relative">
              <div className="relative">
                {isPremiumAmountFocused && (
                  <div className={cn(
                    "absolute left-3 top-1/2 transform -translate-y-1/2 z-10 text-sm font-medium",
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  )}>
                    ₹
                  </div>
                )}
                <input
                  type="text"
                  value={insuranceForm.premiumAmount}
                  onChange={(e) => {
                    const value = sanitizeDecimal(e.target.value);
                    setInsuranceForm((prev) => ({ ...prev, premiumAmount: value }));
                  }}
                  onFocus={() => setIsPremiumAmountFocused(true)}
                  onBlur={(e) => {
                    setIsPremiumAmountFocused(false);
                    // Add .00 if number doesn't have decimal places
                    const value = insuranceForm.premiumAmount.trim();
                    if (value && !value.includes('.')) {
                      setInsuranceForm((prev) => ({ ...prev, premiumAmount: `${value}.00` }));
                    }
                  }}
                  className={cn(
                    "w-full h-10 border rounded-xl transition-all duration-200 ease-in-out text-xs",
                    isPremiumAmountFocused ? "pl-8" : "pl-3",
                    "pr-3",
                    isDarkMode 
                      ? "bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-400" 
                      : "bg-white/90 border-gray-300/60 text-[#4B5563] placeholder:text-[#4B5563]",
                    isPremiumAmountFocused 
                      ? isDarkMode
                        ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg"
                        : "border-blue-500 ring-2 ring-blue-200 shadow-md"
                      : isDarkMode
                        ? "hover:border-blue-400/50"
                        : "hover:border-blue-400/50 hover:shadow-sm",
                    "focus:outline-none"
                  )}
                  placeholder=""
                />
                <label
                  className={cn(
                    "absolute transition-all duration-200 ease-in-out pointer-events-none select-none",
                    isPremiumAmountFocused ? "left-8" : "left-4",
                    (isPremiumAmountFocused || insuranceForm.premiumAmount.length > 0)
                      ? "top-0 -translate-y-1/2 text-xs px-2"
                      : "top-1/2 -translate-y-1/2 text-xs",
                    (isPremiumAmountFocused || insuranceForm.premiumAmount.length > 0)
                      ? isDarkMode 
                        ? "bg-slate-900 text-blue-400" 
                        : "bg-white text-blue-600"
                      : isDarkMode 
                        ? "text-slate-400" 
                        : "text-gray-500",
                    isPremiumAmountFocused && insuranceForm.premiumAmount.length === 0 && (isDarkMode ? "text-blue-400" : "text-blue-600")
                  )}
                >
                  Premium Amount :
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label
                className={cn(
                  'text-xs font-normal block',
                  isDarkMode ? 'text-slate-200' : 'text-slate-700'
                )}
              >
                Upload Policy Document :<span className="text-red-500 ml-1">*</span>
              </label>
              <div
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-md border p-3',
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800/50'
                    : 'border-slate-300 bg-slate-50'
                )}
              >
                <input
                  id="insurance-document-upload"
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setInsuranceForm((prev) => ({
                      ...prev,
                      document: file,
                      documentName: file ? file.name : ''
                    }));
                    if (insuranceFormError) setInsuranceFormError('');
                  }}
                />
                <label
                  htmlFor="insurance-document-upload"
                  className={cn(
                    'cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    isDarkMode
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  )}
                >
                  Select File
                </label>
                <div className="min-w-0 flex-1 text-sm">
                  <p className={cn('truncate', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                    {insuranceForm.documentName || 'No file selected !'}
                  </p>
                  <p className={cn('text-xs', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                    Accepted formats: PDF, JPG, PNG.
                  </p>
                </div>
                {insuranceForm.document && (
                  <>
                  <button
                    type="button"
                    onClick={() => {
                        if (insuranceForm.document) {
                          const url = URL.createObjectURL(insuranceForm.document);
                          setDocumentPreviewUrl(url);
                          setDocumentPreviewOpen(true);
                        }
                      }}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2',
                        isDarkMode
                          ? 'bg-blue-500/90 text-white hover:bg-blue-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      )}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (documentPreviewUrl) {
                          URL.revokeObjectURL(documentPreviewUrl);
                          setDocumentPreviewUrl(null);
                        }
                        setDocumentPreviewOpen(false);
                      setInsuranceForm((prev) => ({
                        ...prev,
                        document: null,
                        documentName: ''
                      }));
                    }}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isDarkMode
                        ? 'bg-red-500/90 text-white hover:bg-red-600'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    )}
                  >
                    Remove
                  </button>
                  </>
                )}
              </div>
            </div>
            {insuranceFormError && (
              <p className={cn('text-sm', isDarkMode ? 'text-red-400' : 'text-red-600')}>
                {insuranceFormError}
              </p>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={handleInsuranceFormCancel}
              className={cn(
                isDarkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              )}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInsuranceFormSave}
              disabled={!canSaveInsuranceForm}
              className={cn(
                'text-white',
                canSaveInsuranceForm
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-blue-300 cursor-not-allowed'
              )}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={documentPreviewOpen} onOpenChange={handleClosePreview}>
        <DialogContent className={cn(
          'max-w-4xl max-h-[90vh] overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        )}>
          <DialogHeader>
            <DialogTitle className={cn(isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
              Preview
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[70vh] overflow-auto">
            {documentPreviewUrl && (() => {
              const document = insuranceForm.document || shipmentDetails.insuranceDocument;
              // Check if it's a document (File object) or an image URL string
              if (document) {
                // It's a document file
                return document.type === 'application/pdf' ? (
                  <iframe
                    src={documentPreviewUrl}
                    className="w-full h-[600px] border rounded-lg"
                    title="Document Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center">
                    <img
                      src={documentPreviewUrl}
                      alt="Document Preview"
                      className="max-w-full max-h-[600px] object-contain rounded-lg"
                    />
                  </div>
                );
              } else {
                // It's an image URL string (from imagePreviews)
                return (
                  <div className="flex items-center justify-center">
                    <img
                      src={documentPreviewUrl}
                      alt="Image Preview"
                      className="max-w-full max-h-[600px] object-contain rounded-lg"
                    />
                  </div>
                );
              }
            })()}
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={handleClosePreview}
              className={cn(
                isDarkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              )}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Modal */}
      <Dialog open={phoneModalOpen.type !== null} onOpenChange={() => {}}>
        <DialogContent 
          className={cn(
            "w-[95vw] sm:w-auto max-w-[400px] sm:max-w-[460px] md:max-w-[530px] [&>button]:hidden px-3 sm:px-4 md:px-4 py-3 sm:py-4 md:py-5 mx-auto rounded-2xl sm:rounded-xl md:rounded-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          )}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="pb-0 px-0">
            <DialogTitle className={cn(
              "text-sm sm:text-base md:text-lg font-semibold text-left leading-tight mb-0",
              isDarkMode ? "text-slate-100" : "text-slate-900"
            )}>
              {phoneModalOpen.type === 'origin' ? 'Sender' : 'Recipient'} - Phone No.
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-start gap-0.5 sm:gap-2 md:gap-1.5 px-0 py-1.5 sm:py-3 md:py-2 w-full overflow-hidden">
                {/* Country Code */}
                <div className={cn(
                  "flex items-center justify-center gap-1 h-8 sm:h-11 md:h-10 w-auto sm:w-auto md:w-auto px-1.5 sm:px-2 md:px-2.5 rounded-md border-2 transition-all duration-200 flex-shrink-0",
                  isDarkMode
                    ? "border-slate-700 bg-slate-800/60 text-slate-300"
                    : "border-slate-200 bg-slate-50 text-slate-700 shadow-sm"
                )}>
                  <svg 
                    className="w-3 h-2 sm:w-4 sm:h-3 md:w-5 md:h-3.5 flex-shrink-0" 
                    viewBox="0 0 122.88 85.48" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <style>{`.st0{fill:#128807;}.st1{fill:#FF9933;}.st2{fill:#FFFFFF;}.st3{fill:#000088;}`}</style>
                    <path className="st1" d="M6.71,0h109.46c3.7,0.02,6.71,3.05,6.71,6.75v71.98c0,3.71-3.04,6.75-6.75,6.75l-109.42,0 C3.02,85.46,0,82.43,0,78.73V6.75C0,3.05,3.01,0.02,6.71,0L6.71,0z"/>
                    <polygon className="st2" points="0,28.49 122.88,28.49 122.88,56.99 0,56.99 0,28.49"/>
                    <path className="st0" d="M0,56.99h122.88v21.74c0,3.71-3.04,6.75-6.75,6.75l-109.42,0C3.02,85.46,0,82.43,0,78.73V56.99L0,56.99z"/>
                    <path className="st3" d="M72.84,42.74c0-6.3-5.1-11.4-11.4-11.4s-11.4,5.1-11.4,11.4c0,6.29,5.1,11.4,11.4,11.4 S72.84,49.04,72.84,42.74L72.84,42.74z"/>
                    <path className="st2" d="M71.41,42.74c0-5.51-4.46-9.97-9.97-9.97s-9.97,4.46-9.97,9.97c0,5.51,4.46,9.97,9.97,9.97 S71.41,48.25,71.41,42.74L71.41,42.74z"/>
                    <path className="st3" d="M63.43,42.74c0-1.1-0.89-2-1.99-2s-1.99,0.89-1.99,2c0,1.1,0.89,1.99,1.99,1.99S63.43,43.84,63.43,42.74 L63.43,42.74z"/>
                    <path className="st3" d="M71.82,44.11c0.04-0.27-0.16-0.52-0.43-0.56c-0.27-0.04-0.52,0.16-0.56,0.43s0.16,0.52,0.43,0.56 C71.54,44.57,71.79,44.38,71.82,44.11L71.82,44.11z"/>
                    <polygon className="st3" points="61.44,52.71 61.78,46.73 61.44,43.88 61.1,46.73 61.44,52.71"/>
                    <path d="M71.11,46.75c0.11-0.25-0.02-0.55-0.27-0.65c-0.25-0.11-0.55,0.02-0.65,0.27c-0.11,0.25,0.02,0.55,0.27,0.65 C70.72,47.12,71.01,47,71.11,46.75L71.11,46.75z"/>
                    <polygon points="58.86,52.37 60.74,46.68 61.15,43.84 60.08,46.51 58.86,52.37"/>
                    <path d="M69.75,49.12c0.17-0.22,0.13-0.53-0.09-0.7c-0.22-0.17-0.53-0.13-0.7,0.09c-0.17,0.22-0.13,0.53,0.09,0.7 C69.27,49.38,69.58,49.33,69.75,49.12L69.75,49.12z"/>
                    <polygon points="56.45,51.38 59.74,46.37 60.87,43.73 59.15,46.02 56.45,51.38"/>
                    <path d="M67.81,51.05c0.22-0.17,0.26-0.48,0.09-0.7c-0.17-0.22-0.48-0.26-0.7-0.09c-0.22,0.17-0.26,0.48-0.09,0.7 C67.28,51.17,67.6,51.22,67.81,51.05L67.81,51.05z"/>
                    <polygon points="54.39,49.79 58.86,45.8 60.63,43.55 58.38,45.32 54.39,49.79"/>
                    <path d="M65.45,52.42c0.25-0.11,0.38-0.4,0.27-0.65c-0.11-0.25-0.4-0.38-0.65-0.27c-0.25,0.1-0.38,0.4-0.27,0.65 C64.9,52.4,65.19,52.52,65.45,52.42L65.45,52.42z"/>
                    <polygon points="52.8,47.73 58.16,45.03 60.45,43.31 57.81,44.44 52.8,47.73"/>
                    <path d="M62.81,53.12c0.27-0.04,0.46-0.29,0.43-0.56c-0.04-0.27-0.29-0.46-0.56-0.43c-0.27,0.04-0.46,0.29-0.43,0.56 C62.28,52.97,62.53,53.16,62.81,53.12L62.81,53.12z"/>
                    <polygon points="51.81,45.32 57.68,44.1 60.34,43.04 57.5,43.44 51.81,45.32"/>
                    <path d="M60.07,53.12c0.27,0.04,0.52-0.16,0.56-0.43c0.04-0.27-0.16-0.52-0.43-0.56c-0.27-0.04-0.52,0.16-0.56,0.43 C59.61,52.84,59.8,53.09,60.07,53.12L60.07,53.12z"/>
                    <polygon points="51.47,42.74 57.45,43.08 60.3,42.74 57.45,42.4 51.47,42.74"/>
                    <path d="M57.43,52.42c0.25,0.11,0.55-0.02,0.65-0.27s-0.02-0.55-0.27-0.65c-0.25-0.11-0.55,0.02-0.65,0.27 C57.06,52.02,57.18,52.31,57.43,52.42L57.43,52.42z"/>
                    <polygon points="51.81,40.16 57.5,42.04 60.34,42.45 57.68,41.38 51.81,40.16"/>
                    <path d="M55.06,51.05c0.22,0.17,0.53,0.13,0.7-0.09c0.17-0.22,0.13-0.53-0.09-0.7c-0.22-0.17-0.53-0.13-0.7,0.09 C54.81,50.57,54.85,50.88,55.06,51.05L55.06,51.05z"/>
                    <polygon points="52.8,37.75 57.81,41.04 60.45,42.17 58.16,40.45 52.8,37.75"/>
                    <path d="M53.13,49.12c0.17,0.22,0.48,0.26,0.7,0.09c0.22-0.17,0.26-0.48,0.09-0.7c-0.17-0.22-0.48-0.26-0.7-0.09 C53.01,48.58,52.96,48.9,53.13,49.12L53.13,49.12z"/>
                    <polygon points="54.39,35.69 58.38,40.16 60.63,41.94 58.86,39.68 54.39,35.69"/>
                    <path d="M51.76,46.75c0.11,0.25,0.4,0.38,0.65,0.27c0.25-0.11,0.38-0.4,0.27-0.65c-0.11-0.25-0.4-0.38-0.65-0.27 C51.78,46.2,51.66,46.49,51.76,46.75L51.76,46.75z"/>
                    <polygon points="56.45,34.1 59.15,39.46 60.87,41.75 59.74,39.12 56.45,34.1"/>
                    <path d="M51.06,44.11c0.04,0.27,0.29,0.46,0.56,0.43c0.27-0.04,0.46-0.29,0.43-0.56c-0.04-0.27-0.29-0.46-0.56-0.43 C51.21,43.58,51.02,43.83,51.06,44.11L51.06,44.11z"/>
                    <polygon points="58.86,33.11 60.08,38.98 61.15,41.64 60.74,38.8 58.86,33.11"/>
                    <path d="M51.06,41.37c-0.04,0.27,0.16,0.52,0.43,0.56c0.27,0.04,0.52-0.16,0.56-0.43c0.04-0.27-0.16-0.52-0.43-0.56 C51.34,40.91,51.09,41.1,51.06,41.37L51.06,41.37z"/>
                    <polygon points="61.44,32.77 61.1,38.75 61.44,41.6 61.78,38.75 61.44,32.77"/>
                    <path d="M51.77,38.73c-0.11,0.25,0.02,0.55,0.27,0.65c0.25,0.1,0.55-0.02,0.65-0.27c0.11-0.25-0.02-0.55-0.27-0.65 C52.16,38.36,51.87,38.48,51.77,38.73L51.77,38.73z"/>
                    <polygon points="64.02,33.11 62.14,38.8 61.73,41.64 62.8,38.98 64.02,33.11"/>
                    <path d="M53.13,36.37c-0.17,0.22-0.13,0.53,0.09,0.7c0.22,0.17,0.53,0.13,0.7-0.09c0.17-0.22,0.13-0.53-0.09-0.7 C53.61,36.11,53.3,36.15,53.13,36.37L53.13,36.37z"/>
                    <polygon points="66.43,34.1 63.14,39.12 62.01,41.75 63.73,39.46 66.43,34.1"/>
                    <path d="M55.07,34.43c-0.22,0.17-0.26,0.48-0.09,0.7c0.17,0.22,0.48,0.26,0.7,0.09c0.22-0.17,0.26-0.48,0.09-0.7 S55.28,34.27,55.07,34.43L55.07,34.43z"/>
                    <polygon points="68.49,35.69 64.02,39.68 62.25,41.94 64.5,40.16 68.49,35.69"/>
                    <path d="M57.43,33.07c-0.25,0.11-0.37,0.4-0.27,0.65c0.11,0.25,0.4,0.38,0.65,0.27c0.25-0.11,0.38-0.4,0.27-0.65 C57.98,33.08,57.69,32.96,57.43,33.07L57.43,33.07z"/>
                    <polygon points="70.08,37.75 64.72,40.45 62.43,42.17 65.07,41.04 70.08,37.75"/>
                    <path d="M60.07,32.36c-0.27,0.04-0.46,0.29-0.43,0.56c0.04,0.27,0.29,0.46,0.56,0.43c0.27-0.04,0.47-0.29,0.43-0.56 C60.6,32.52,60.35,32.32,60.07,32.36L60.07,32.36z"/>
                    <polygon points="71.07,40.16 65.2,41.38 62.54,42.45 65.38,42.04 71.07,40.16"/>
                    <path d="M62.81,32.36c-0.27-0.04-0.52,0.16-0.56,0.43c-0.04,0.27,0.16,0.52,0.43,0.56c0.27,0.04,0.52-0.16,0.56-0.43 C63.27,32.65,63.08,32.39,62.81,32.36L62.81,32.36z"/>
                    <polygon points="71.41,42.74 65.43,42.4 62.58,42.74 65.43,43.08 71.41,42.74"/>
                    <path d="M65.45,33.07c-0.25-0.11-0.55,0.02-0.65,0.27c-0.11,0.25,0.02,0.55,0.27,0.65c0.25,0.1,0.55-0.02,0.65-0.27 C65.82,33.46,65.7,33.17,65.45,33.07L65.45,33.07z"/>
                    <polygon points="71.07,45.32 65.38,43.44 62.54,43.04 65.2,44.1 71.07,45.32"/>
                    <path d="M67.81,34.43c-0.22-0.17-0.53-0.13-0.7,0.09c-0.17,0.22-0.13,0.53,0.09,0.7c0.22,0.17,0.53,0.13,0.7-0.09 C68.07,34.91,68.03,34.6,67.81,34.43L67.81,34.43z"/>
                    <polygon points="70.08,47.73 65.07,44.44 62.43,43.31 64.72,45.03 70.08,47.73"/>
                    <path d="M69.75,36.37c-0.17-0.22-0.48-0.26-0.7-0.09s-0.26,0.48-0.09,0.7c0.17,0.22,0.48,0.26,0.7,0.09 C69.87,36.9,69.92,36.58,69.75,36.37L69.75,36.37z"/>
                    <polygon points="68.49,49.79 64.5,45.32 62.25,43.55 64.02,45.8 68.49,49.79"/>
                    <path d="M71.12,38.73c-0.11-0.25-0.4-0.38-0.65-0.27s-0.38,0.4-0.27,0.65c0.11,0.25,0.4,0.37,0.65,0.27 C71.1,39.28,71.22,38.99,71.12,38.73L71.12,38.73z"/>
                    <polygon points="66.43,51.38 63.73,46.02 62.01,43.73 63.14,46.37 66.43,51.38"/>
                    <path d="M71.82,41.37c-0.04-0.27-0.29-0.46-0.56-0.43c-0.27,0.04-0.46,0.29-0.43,0.56c0.04,0.27,0.29,0.46,0.56,0.43 C71.67,41.9,71.86,41.65,71.82,41.37L71.82,41.37z"/>
                    <polygon points="64.02,52.37 62.8,46.51 61.73,43.84 62.14,46.68 64.02,52.37"/>
                  </svg>
                  <span className="text-[10px] sm:text-base md:text-base font-bold">+91</span>
                </div>
                
                {/* Divider */}
                <div className={cn(
                  "h-6 sm:h-9 md:h-8 w-[1px] flex-shrink-0",
                  isDarkMode ? "bg-slate-700" : "bg-slate-200"
                )} />
                
                {/* Phone Number Inputs */}
                <div className="flex items-center gap-0.5 sm:gap-1.5 md:gap-1 flex-shrink-0 overflow-hidden">
                  {(phoneModalOpen.type === 'origin' ? originMobileDigits : destinationMobileDigits).map((digit, index) => (
                    <input
                      key={index}
                      id={`${phoneModalOpen.type}-modal-digit-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        if (phoneModalOpen.type === 'origin') {
                          handleOriginDigitChange(index, e.target.value);
                        } else {
                          handleDestinationDigitChange(index, e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (phoneModalOpen.type === 'origin') {
                          handleOriginDigitKeyDown(index, e);
                        } else {
                          handleDestinationDigitKeyDown(index, e);
                        }
                      }}
                      onPaste={(e) => {
                        if (phoneModalOpen.type === 'origin') {
                          handleOriginDigitPaste(e);
                        } else {
                          handleDestinationDigitPaste(e);
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className={cn(
                        "h-8 sm:h-11 md:h-10 w-7 sm:w-10 md:w-9 rounded-md border-2 text-center text-[10px] sm:text-base md:text-base font-bold transition-all duration-200 flex-shrink-0",
                        "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200",
                        isDarkMode
                          ? digit
                            ? "border-blue-500 bg-blue-500/20 text-blue-200"
                            : "border-slate-600 bg-slate-800/80 text-slate-300 focus:ring-blue-500/30"
                          : digit
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-300 bg-white text-slate-700"
                      )}
                    />
                  ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Form Modal */}
      <Dialog open={formModalOpen.type !== null} onOpenChange={() => {}}>
        <DialogContent 
          className={cn(
            "w-[90%] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-[15px] [&>button]:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          )}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {!showPreviewInModal ? (
            <>
          {/* Simple Header */}
          <div className="px-6 pt-6 pb-2">
            <DialogTitle className={cn(
              "text-xl font-bold",
              isDarkMode ? "text-slate-100" : "text-slate-900"
            )}>
              {formModalOpen.type === 'origin' ? "Sender's (Consigner)" : "Recipent's ( Consignee )" } Address : 
            </DialogTitle>
          </div>

          <div className="px-5 py-5 space-y-3">
            {formModalOpen.type && (() => {
              const isOrigin = formModalOpen.type === 'origin';
              const data = isOrigin ? originData : destinationData;
              const areas = isOrigin ? originAreas : destinationAreas;
              const pincodeValue = isOrigin ? originPincode : destinationPincode;
              
              return (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FloatingInput
                      label="Concern Person :"
                      value={data.name}
                      onChange={(value) =>
                        isOrigin
                          ? setOriginData((prev) => ({ ...prev, name: value }))
                          : setDestinationData((prev) => ({ ...prev, name: value }))
                      }
                      required
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="Mobile No. :"
                      value={`+91 ${isOrigin ? originMobileDigits.join('') : destinationMobileDigits.join('')}`}
                      onChange={() => {}}
                      disabled
                      placeholder="We'll call this number to coordinate delivery."
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="Email ID :"
                      value={data.email}
                      onChange={(value) =>
                        isOrigin
                          ? setOriginData((prev) => ({ ...prev, email: value }))
                          : setDestinationData((prev) => ({ ...prev, email: value }))
                      }
                      type="email"
                      className="md:col-span-2"
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="Company Name :"
                      value={data.companyName}
                      onChange={(value) =>
                        isOrigin
                          ? setOriginData((prev) => ({ ...prev, companyName: value }))
                          : setDestinationData((prev) => ({ ...prev, companyName: value }))
                      }
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="GST No. :"
                      value={data.gstNumber}
                      onChange={(value) =>
                        isOrigin
                          ? setOriginData((prev) => ({ ...prev, gstNumber: value }))
                          : setDestinationData((prev) => ({ ...prev, gstNumber: value }))
                      }
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="Building / Flat No. :"
                      value={data.flatBuilding}
                      onChange={(value) =>
                        isOrigin
                          ? setOriginData((prev) => ({ ...prev, flatBuilding: value }))
                          : setDestinationData((prev) => ({ ...prev, flatBuilding: value }))
                      }
                      required
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="Locality / Street :"
                      value={data.locality}
                      onChange={(value) =>
                        isOrigin
                          ? setOriginData((prev) => ({ ...prev, locality: value }))
                          : setDestinationData((prev) => ({ ...prev, locality: value }))
                      }
                      required
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="Landmark :"
                      value={data.landmark}
                      onChange={(value) =>
                        isOrigin
                          ? setOriginData((prev) => ({ ...prev, landmark: value }))
                          : setDestinationData((prev) => ({ ...prev, landmark: value }))
                      }
                      className="md:col-span-2"
                      isDarkMode={isDarkMode}
                    />
                    {pincodeValue.length === 6 && areas.length > 0 ? (
                      <FloatingSelect
                        label="Area"
                        value={data.area}
                        onChange={(value) =>
                          isOrigin
                            ? setOriginData((prev) => ({ ...prev, area: value }))
                            : setDestinationData((prev) => ({ ...prev, area: value }))
                        }
                        options={areas}
                        required
                        isDarkMode={isDarkMode}
                      />
                    ) : (
                      <FloatingInput
                        label="Area"
                        value={data.area}
                        onChange={(value) =>
                          isOrigin
                            ? setOriginData((prev) => ({ ...prev, area: value }))
                            : setDestinationData((prev) => ({ ...prev, area: value }))
                        }
                        required
                        disabled
                        isDarkMode={isDarkMode}
                      />
                    )}
                    <FloatingInput
                      label="Pincode"
                      value={data.pincode}
                      onChange={(_value) => {}}
                      disabled
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="City"
                      value={data.city}
                      onChange={(_value) => {}}
                      disabled
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="State"
                      value={data.state}
                      onChange={(_value) => {}}
                      disabled
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="District"
                      value={data.district}
                      onChange={(_value) => {}}
                      disabled
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="Website :"
                      value={data.website}
                      onChange={(value) =>
                        isOrigin
                          ? setOriginData((prev) => ({ ...prev, website: value }))
                          : setDestinationData((prev) => ({ ...prev, website: value }))
                      }
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="BirthDay :"
                      value={data.birthday}
                      onChange={(value) =>
                        isOrigin
                          ? setOriginData((prev) => ({ ...prev, birthday: value }))
                          : setDestinationData((prev) => ({ ...prev, birthday: value }))
                      }
                      type="date"
                      isDarkMode={isDarkMode}
                    />
                    <FloatingInput
                      label="Anniversary :"
                      value={data.anniversary}
                      onChange={(value) =>
                        isOrigin
                          ? setOriginData((prev) => ({ ...prev, anniversary: value }))
                          : setDestinationData((prev) => ({ ...prev, anniversary: value }))
                      }
                      type="date"
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  {/* Save As Section */}
                  <div className="pt-1">
                    <div className="flex flex-wrap gap-2">
                      {addressTypeOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            isOrigin
                              ? setOriginData((prev) => ({ ...prev, addressType: option }))
                              : setDestinationData((prev) => ({ ...prev, addressType: option }))
                          }
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all",
                            data.addressType === option
                              ? isDarkMode
                                ? "bg-slate-700 text-slate-100 border-2 border-slate-600"
                                : "bg-slate-200 text-slate-800 border-2 border-slate-300"
                              : isDarkMode
                                ? "bg-transparent text-slate-300 border-2 border-slate-700 hover:border-slate-600"
                                : "bg-white text-slate-700 border-2 border-slate-300 hover:border-slate-400"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Alternate Numbers Section */}
            {formModalOpen.type && (() => {
              const isOrigin = formModalOpen.type === 'origin';
              const data = isOrigin ? originData : destinationData;

              return (
                <div className="pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <div />
                    {/* Push to right: justify-end and border styles for button */}
                    <button
                      type="button"
                      onClick={() => addAlternateNumber(formModalOpen.type!)}
                      className={cn(
                        'h-7 rounded-md border border-dashed px-4 text-xs font-medium transition-colors flex items-center justify-center ml-auto',
                        isDarkMode
                          ? 'border-blue-500 text-blue-200 hover:bg-blue-500/20 hover:border-blue-400'
                          : 'border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-500'
                      )}
                      style={{ minWidth: 'fit-content' }}
                    >
                      + Add Alternate Number
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(data.alternateNumbers || ['']).map((number, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <FloatingInput
                          label={`Alternate Number ${index + 1}`}
                          value={number}
                          onChange={(value) => handleAlternateNumberChange(formModalOpen.type!, index, value)}
                          type="tel"
                          className="flex-1"
                          isDarkMode={isDarkMode}
                        />
                        {(data.alternateNumbers || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAlternateNumber(formModalOpen.type!, index)}
                            className={cn(
                              'h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0 transition-colors',
                              isDarkMode
                                ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            )}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Footer with Full-Width Button */}
          <div className="px-6 pt-2 pb-5">
            <Button
              type="button"
              disabled={formModalOpen.type === 'origin' ? !isOriginFormComplete : !isDestinationFormComplete}
              onClick={() => {
                const currentType = formModalOpen.type;
                const isFormComplete = currentType === 'origin' ? isOriginFormComplete : isDestinationFormComplete;
                
                if (isFormComplete) {
                  // If in "add another address" mode, save new address and show two previews
                  if (isAddingAnotherAddress && previousAddressData) {
                    const currentData = currentType === 'origin' ? originData : destinationData;
                    setNewAddressData({ ...currentData });
                    setShowPreviewInModal(true);
                  } else {
                    // Normal flow - show preview card in modal
                  setShowPreviewInModal(true);
                  }
                }
              }}
              className={cn(
                "w-full h-12 rounded-md font-semibold text-base transition-all",
                formModalOpen.type === 'origin' ? !isOriginFormComplete : !isDestinationFormComplete
                  ? isDarkMode
                    ? "bg-slate-700/50 text-slate-400 cursor-not-allowed opacity-60"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
                  : isDarkMode
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                    : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
              )}
            >
              {formModalOpen.type === 'origin' ? "SAVE " : 'SAVE '}
            </Button>
          </div>
            </>
          ) : (
            // Preview Card View
            <div className="p-3 sm:p-6">
              {formModalOpen.type && (() => {
                const isOrigin = formModalOpen.type === 'origin';
                const data = isOrigin ? originData : destinationData;
                const cardTitle = isOrigin ? 'Select Sender Add :' : 'Select Recipient Add :';
                const hasMultipleRecords = phoneSearchResults.length > 1 && phoneSearchModalOpen.type === formModalOpen.type;
                
                return (
                  <div className="space-y-2 sm:space-y-3">
                    {/* Title - Outside the box */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={cn(
                        'text-xs sm:text-sm font-semibold',
                        isDarkMode ? 'text-slate-200' : 'text-slate-800'
                      )}>
                        {cardTitle}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPreviewInModal(false);
                        }}
                        className={cn(
                          'p-1.5 rounded-md transition-colors flex-shrink-0',
                          isDarkMode
                            ? 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                            : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        )}
                      >
                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                    
                    {/* Show two address cards if in "add another address" mode */}
                    {isAddingAnotherAddress && previousAddressData && newAddressData ? (
                      <div className="space-y-3 max-h-[50vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {/* Previous Address Card */}
                        <div
                          onClick={() => {
                            setSelectedAddressIndex(0);
                            // Update the form data with previous address
                            if (formModalOpen.type === 'origin') {
                              setOriginData({ ...previousAddressData });
                              if (previousAddressData.pincode) {
                                setOriginPincode(previousAddressData.pincode);
                              }
                            } else {
                              setDestinationData({ ...previousAddressData });
                              if (previousAddressData.pincode) {
                                setDestinationPincode(previousAddressData.pincode);
                              }
                            }
                          }}
                          className={cn(
                            'rounded-xl border overflow-hidden transition-all duration-300 p-2.5 sm:p-4 cursor-pointer',
                            selectedAddressIndex === 0
                              ? isDarkMode
                                ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                                : 'border-blue-500 bg-blue-50 shadow-lg'
                              : isDarkMode
                                ? 'border-slate-800/60 bg-slate-900/80 hover:border-slate-700'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                          )}
                        >
                          <div className="flex items-start gap-1.5 sm:gap-3">
                            {/* Radio button */}
                            <div className="mt-0.5 flex-shrink-0">
                              <div className={cn(
                                'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center',
                                selectedAddressIndex === 0
                                  ? isDarkMode ? 'border-blue-400' : 'border-blue-500'
                                  : isDarkMode ? 'border-slate-600' : 'border-slate-400'
                              )}>
                                {selectedAddressIndex === 0 && (
                                  <div className={cn(
                                    'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full',
                                    isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                                  )} />
                                )}
                              </div>
                            </div>
                            
                            {/* Details */}
                            <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                              {/* Name and Type */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h4 className={cn(
                                  'text-xs sm:text-sm font-semibold break-words',
                                  isDarkMode ? 'text-slate-100' : 'text-slate-900'
                                )}>
                                  {previousAddressData.name || 'N/A'}
                                </h4>
                                {previousAddressData.addressType && (
                                  <span className={cn(
                                    'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium uppercase flex-shrink-0',
                                    isDarkMode
                                      ? 'bg-blue-500/20 text-blue-200'
                                      : 'bg-blue-100 text-blue-700'
                                  )}>
                                    {previousAddressData.addressType}
                                  </span>
                                )}
                              </div>
                              
                              {/* Company */}
                              {previousAddressData.companyName && (
                                <p className={cn(
                                  'text-[10px] sm:text-xs break-words',
                                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                )}>
                                  <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-1" />
                                  {previousAddressData.companyName}
                                </p>
                              )}
                              
                              {/* Address */}
                              <div className="flex items-start gap-1 sm:gap-1.5">
                                <MapPin className={cn(
                                  'h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 flex-shrink-0',
                                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                )} />
                                <p className={cn(
                                  'text-[10px] sm:text-xs leading-relaxed break-words',
                                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                )}>
                                  {[
                                    previousAddressData.flatBuilding,
                                    previousAddressData.locality,
                                    previousAddressData.area,
                                    previousAddressData.city,
                                    previousAddressData.state,
                                    previousAddressData.pincode
                                  ].filter(Boolean).join(', ')}
                                  {previousAddressData.landmark && ` (${previousAddressData.landmark})`}
                                </p>
                              </div>
                              
                              {/* Contact */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs">
                                <div className="flex items-center gap-1 sm:gap-1.5">
                                  <Phone className={cn(
                                    'h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0',
                                    isDarkMode ? 'text-green-400' : 'text-green-600'
                                  )} />
                                  <span className={cn(
                                    'break-all',
                                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                  )}>
                                    +91 {previousAddressData.mobileNumber}
                                  </span>
                                </div>
                                {previousAddressData.email && (
                                  <>
                                    <span className={cn(
                                      'hidden sm:inline',
                                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                    )}>
                                      •
                                    </span>
                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                      <Mail className={cn(
                                        'h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0',
                                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                      )} />
                                      <span className={cn(
                                        'break-all',
                                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                      )}>
                                        {previousAddressData.email}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              {/* Additional Info */}
                              {(previousAddressData.gstNumber || previousAddressData.website || previousAddressData.alternateNumbers?.filter((n: string) => n.trim()).length > 0) && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs pt-1">
                                  {previousAddressData.gstNumber && (
                                    <span className={cn(
                                      'break-words',
                                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                    )}>
                                      GST: <span className={cn(isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{previousAddressData.gstNumber}</span>
                                    </span>
                                  )}
                                  {previousAddressData.website && (
                                    <>
                                      {previousAddressData.gstNumber && <span className={cn('hidden sm:inline', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>•</span>}
                                      <a 
                                        href={previousAddressData.website.startsWith('http') ? previousAddressData.website : `https://${previousAddressData.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                          'underline hover:opacity-80 break-all',
                                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                        )}
                                      >
                                        {previousAddressData.website}
                                      </a>
                                    </>
                                  )}
                                  {previousAddressData.alternateNumbers && previousAddressData.alternateNumbers.filter((n: string) => n.trim()).length > 0 && (
                                    <>
                                      {(previousAddressData.gstNumber || previousAddressData.website) && <span className={cn('hidden sm:inline', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>•</span>}
                                      <span className={cn(
                                        'break-words',
                                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                      )}>
                                        Alt: {previousAddressData.alternateNumbers.filter((n: string) => n.trim()).join(', ')}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* New Address Card */}
                        <div
                          onClick={() => {
                            setSelectedAddressIndex(1);
                            // Update the form data with new address
                            if (formModalOpen.type === 'origin') {
                              setOriginData({ ...newAddressData });
                              if (newAddressData.pincode) {
                                setOriginPincode(newAddressData.pincode);
                              }
                            } else {
                              setDestinationData({ ...newAddressData });
                              if (newAddressData.pincode) {
                                setDestinationPincode(newAddressData.pincode);
                              }
                            }
                          }}
                          className={cn(
                            'rounded-xl border overflow-hidden transition-all duration-300 p-2.5 sm:p-4 cursor-pointer',
                            selectedAddressIndex === 1
                              ? isDarkMode
                                ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                                : 'border-blue-500 bg-blue-50 shadow-lg'
                              : isDarkMode
                                ? 'border-slate-800/60 bg-slate-900/80 hover:border-slate-700'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                          )}
                        >
                          <div className="flex items-start gap-1.5 sm:gap-3">
                            {/* Radio button */}
                            <div className="mt-0.5 flex-shrink-0">
                              <div className={cn(
                                'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center',
                                selectedAddressIndex === 1
                                  ? isDarkMode ? 'border-blue-400' : 'border-blue-500'
                                  : isDarkMode ? 'border-slate-600' : 'border-slate-400'
                              )}>
                                {selectedAddressIndex === 1 && (
                                  <div className={cn(
                                    'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full',
                                    isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                                  )} />
                                )}
                              </div>
                            </div>
                            
                            {/* Details */}
                            <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                              {/* Name and Type */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h4 className={cn(
                                  'text-xs sm:text-sm font-semibold break-words',
                                  isDarkMode ? 'text-slate-100' : 'text-slate-900'
                                )}>
                                  {newAddressData.name || 'N/A'}
                                </h4>
                                {newAddressData.addressType && (
                                  <span className={cn(
                                    'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium uppercase flex-shrink-0',
                                    isDarkMode
                                      ? 'bg-blue-500/20 text-blue-200'
                                      : 'bg-blue-100 text-blue-700'
                                  )}>
                                    {newAddressData.addressType}
                                  </span>
                                )}
                              </div>
                              
                              {/* Company */}
                              {newAddressData.companyName && (
                                <p className={cn(
                                  'text-[10px] sm:text-xs break-words',
                                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                )}>
                                  <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-1" />
                                  {newAddressData.companyName}
                                </p>
                              )}
                              
                              {/* Address */}
                              <div className="flex items-start gap-1 sm:gap-1.5">
                                <MapPin className={cn(
                                  'h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 flex-shrink-0',
                                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                )} />
                                <p className={cn(
                                  'text-[10px] sm:text-xs leading-relaxed break-words',
                                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                )}>
                                  {[
                                    newAddressData.flatBuilding,
                                    newAddressData.locality,
                                    newAddressData.area,
                                    newAddressData.city,
                                    newAddressData.state,
                                    newAddressData.pincode
                                  ].filter(Boolean).join(', ')}
                                  {newAddressData.landmark && ` (${newAddressData.landmark})`}
                                </p>
                              </div>
                              
                              {/* Contact */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs">
                                <div className="flex items-center gap-1 sm:gap-1.5">
                                  <Phone className={cn(
                                    'h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0',
                                    isDarkMode ? 'text-green-400' : 'text-green-600'
                                  )} />
                                  <span className={cn(
                                    'break-all',
                                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                  )}>
                                    +91 {newAddressData.mobileNumber}
                                  </span>
                                </div>
                                {newAddressData.email && (
                                  <>
                                    <span className={cn(
                                      'hidden sm:inline',
                                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                    )}>
                                      •
                                    </span>
                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                      <Mail className={cn(
                                        'h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0',
                                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                      )} />
                                      <span className={cn(
                                        'break-all',
                                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                      )}>
                                        {newAddressData.email}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              {/* Additional Info */}
                              {(newAddressData.gstNumber || newAddressData.website || newAddressData.alternateNumbers?.filter((n: string) => n.trim()).length > 0) && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs pt-1">
                                  {newAddressData.gstNumber && (
                                    <span className={cn(
                                      'break-words',
                                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                    )}>
                                      GST: <span className={cn(isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{newAddressData.gstNumber}</span>
                                    </span>
                                  )}
                                  {newAddressData.website && (
                                    <>
                                      {newAddressData.gstNumber && <span className={cn('hidden sm:inline', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>•</span>}
                                      <a 
                                        href={newAddressData.website.startsWith('http') ? newAddressData.website : `https://${newAddressData.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                          'underline hover:opacity-80 break-all',
                                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                        )}
                                      >
                                        {newAddressData.website}
                                      </a>
                                    </>
                                  )}
                                  {newAddressData.alternateNumbers && newAddressData.alternateNumbers.filter((n: string) => n.trim()).length > 0 && (
                                    <>
                                      {(newAddressData.gstNumber || newAddressData.website) && <span className={cn('hidden sm:inline', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>•</span>}
                                      <span className={cn(
                                        'break-words',
                                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                      )}>
                                        Alt: {newAddressData.alternateNumbers.filter((n: string) => n.trim()).join(', ')}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : hasMultipleRecords ? (
                      <div className="space-y-3 max-h-[50vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {phoneSearchResults.map((record, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              setSelectedRecordIndex(index);
                              handleSelectPhoneRecord(record, formModalOpen.type!, false);
                            }}
                            className={cn(
                              'rounded-xl border overflow-hidden transition-all duration-300 p-2.5 sm:p-4 cursor-pointer',
                              selectedRecordIndex === index
                                ? isDarkMode
                                  ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                                  : 'border-blue-500 bg-blue-50 shadow-lg'
                                : isDarkMode
                                  ? 'border-slate-800/60 bg-slate-900/80 hover:border-slate-700'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                            )}
                          >
                            <div className="flex items-start gap-1.5 sm:gap-3">
                              {/* Radio button */}
                              <div className="mt-0.5 flex-shrink-0">
                                <div className={cn(
                                  'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center',
                                  selectedRecordIndex === index
                                    ? isDarkMode ? 'border-blue-400' : 'border-blue-500'
                                    : isDarkMode ? 'border-slate-600' : 'border-slate-400'
                                )}>
                                  {selectedRecordIndex === index && (
                                    <div className={cn(
                                      'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full',
                                      isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                                    )} />
                                  )}
                                </div>
                              </div>
                              
                              {/* Details */}
                              <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                                {/* Name and Type */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <h4 className={cn(
                                    'text-xs sm:text-sm font-semibold break-words',
                                    isDarkMode ? 'text-slate-100' : 'text-slate-900'
                                  )}>
                                    {record.name || 'N/A'}
                                  </h4>
                                  {record.addressType && (
                                    <span className={cn(
                                      'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium uppercase flex-shrink-0',
                                      isDarkMode
                                        ? 'bg-blue-500/20 text-blue-200'
                                        : 'bg-blue-100 text-blue-700'
                                    )}>
                                      {record.addressType}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Company */}
                                {record.companyName && (
                                  <p className={cn(
                                    'text-[10px] sm:text-xs break-words',
                                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                  )}>
                                    <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-1" />
                                    {record.companyName}
                                  </p>
                                )}
                                
                                {/* Address */}
                                <div className="flex items-start gap-1 sm:gap-1.5">
                                  <MapPin className={cn(
                                    'h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 flex-shrink-0',
                                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                  )} />
                                  <p className={cn(
                                    'text-[10px] sm:text-xs leading-relaxed break-words',
                                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                  )}>
                                    {[
                                      record.flatBuilding,
                                      record.locality,
                                      record.area,
                                      record.city,
                                      record.state,
                                      record.pincode
                                    ].filter(Boolean).join(', ')}
                                    {record.landmark && ` (${record.landmark})`}
                                  </p>
                                </div>
                                
                                {/* Contact */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs">
                                  <div className="flex items-center gap-1 sm:gap-1.5">
                                    <Phone className={cn(
                                      'h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0',
                                      isDarkMode ? 'text-green-400' : 'text-green-600'
                                    )} />
                                    <span className={cn(
                                      'break-all',
                                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                    )}>
                                      +91 {phoneSearchModalOpen.phoneNumber}
                                    </span>
                                  </div>
                                  {record.email && (
                                    <>
                                      <span className={cn(
                                        'hidden sm:inline',
                                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                      )}>
                                        •
                                      </span>
                                      <div className="flex items-center gap-1 sm:gap-1.5">
                                        <Mail className={cn(
                                          'h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0',
                                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                        )} />
                                        <span className={cn(
                                          'break-all',
                                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                        )}>
                                          {record.email}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                
                                {/* Additional Info */}
                                {(record.gstNumber || record.website || record.alternateNumbers?.filter((n: string) => n.trim()).length > 0) && (
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs pt-1">
                                    {record.gstNumber && (
                                      <span className={cn(
                                        'break-words',
                                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                      )}>
                                        GST: <span className={cn(isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{record.gstNumber}</span>
                                      </span>
                                    )}
                                    {record.website && (
                                      <>
                                        {record.gstNumber && <span className={cn('hidden sm:inline', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>•</span>}
                                        <a 
                                          href={record.website.startsWith('http') ? record.website : `https://${record.website}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={cn(
                                            'underline hover:opacity-80 break-all',
                                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                          )}
                                        >
                                          {record.website}
                                        </a>
                                      </>
                                    )}
                                    {record.alternateNumbers && record.alternateNumbers.filter((n: string) => n.trim()).length > 0 && (
                                      <>
                                        {(record.gstNumber || record.website) && <span className={cn('hidden sm:inline', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>•</span>}
                                        <span className={cn(
                                          'break-words',
                                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                        )}>
                                          Alt: {record.alternateNumbers.filter((n: string) => n.trim()).join(', ')}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Single Address Content - Box Design */
                      <div
                        className={cn(
                          'rounded-xl border overflow-hidden transition-all duration-300 p-2.5 sm:p-4',
                          isDarkMode
                            ? 'border-slate-800/60 bg-slate-900/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
                            : 'border-slate-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.25)]'
                        )}
                      >
                        <div className="flex items-start gap-1.5 sm:gap-3">
                          {/* Radio button */}
                          <div className="mt-0.5 flex-shrink-0">
                            <div className={cn(
                              'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center',
                              isDarkMode ? 'border-blue-500/50' : 'border-blue-400'
                            )}>
                              <div className={cn(
                                'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full',
                                isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                              )} />
                            </div>
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                            {/* Name and Type */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h4 className={cn(
                                'text-xs sm:text-sm font-semibold break-words',
                                isDarkMode ? 'text-slate-100' : 'text-slate-900'
                              )}>
                                {data.name}
                              </h4>
                              {data.addressType && (
                                <span className={cn(
                                  'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium uppercase flex-shrink-0',
                                  isDarkMode
                                    ? 'bg-blue-500/20 text-blue-200'
                                    : 'bg-blue-100 text-blue-700'
                                )}>
                                  {data.addressType}
                                </span>
                              )}
                            </div>
                            
                            {/* Company */}
                            {data.companyName && (
                              <p className={cn(
                                'text-[10px] sm:text-xs break-words',
                                isDarkMode ? 'text-slate-400' : 'text-slate-600'
                              )}>
                                <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-1" />
                                {data.companyName}
                              </p>
                            )}
                            
                            {/* Address */}
                            <div className="flex items-start gap-1 sm:gap-1.5">
                              <MapPin className={cn(
                                'h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 flex-shrink-0',
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              )} />
                              <p className={cn(
                                'text-[10px] sm:text-xs leading-relaxed break-words',
                                isDarkMode ? 'text-slate-300' : 'text-slate-700'
                              )}>
                                {data.flatBuilding}, {data.locality}, {data.area}, {data.city}, {data.state} - {data.pincode}
                                {data.landmark && ` (${data.landmark})`}
                              </p>
                            </div>
                            
                            {/* Contact */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs">
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <Phone className={cn(
                                  'h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0',
                                  isDarkMode ? 'text-green-400' : 'text-green-600'
                                )} />
                                <span className={cn(
                                  'break-all',
                                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                )}>
                                  +91 {data.mobileNumber}
                                </span>
                              </div>
                              {data.email && (
                                <>
                                  <span className={cn(
                                    'hidden sm:inline',
                                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                  )}>
                                    •
                                  </span>
                                  <div className="flex items-center gap-1 sm:gap-1.5">
                                    <Mail className={cn(
                                      'h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0',
                                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                    )} />
                                    <span className={cn(
                                      'break-all',
                                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                    )}>
                                      {data.email}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            {/* Additional Info - Inline */}
                            {(data.gstNumber || data.website || data.alternateNumbers?.filter(n => n.trim()).length > 0) && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs pt-1">
                                {data.gstNumber && (
                                  <span className={cn(
                                    'break-words',
                                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                  )}>
                                    GST: <span className={cn(isDarkMode ? 'text-slate-300' : 'text-slate-700')}>{data.gstNumber}</span>
                                  </span>
                                )}
                                {data.website && (
                                  <>
                                    {data.gstNumber && <span className={cn('hidden sm:inline', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>•</span>}
                                    <a 
                                      href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                        'underline hover:opacity-80 break-all',
                                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                      )}
                                    >
                                      {data.website}
                                    </a>
                                  </>
                                )}
                                {data.alternateNumbers && data.alternateNumbers.filter(n => n.trim()).length > 0 && (
                                  <>
                                    {(data.gstNumber || data.website) && <span className={cn('hidden sm:inline', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>•</span>}
                                    <span className={cn(
                                      'break-words',
                                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                    )}>
                                      Alt: {data.alternateNumbers.filter(n => n.trim()).join(', ')}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons - Compact */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      {/* Show "Add Another Address" button if phone number was found or if form is complete, but not when already showing two addresses */}
                      {!isAddingAnotherAddress && ((phoneSearchResults.length > 0 && phoneSearchModalOpen.type === formModalOpen.type) || 
                        (formModalOpen.type && (formModalOpen.type === 'origin' ? isOriginFormComplete : isDestinationFormComplete))) && (
                        <Button
                          type="button"
                          onClick={() => {
                            const currentType = formModalOpen.type;
                            if (!currentType) return;
                            
                            // Save current address data as previous
                            const currentData = currentType === 'origin' ? originData : destinationData;
                            setPreviousAddressData({ ...currentData });
                            
                            // Clear the form but keep necessary fields like pincode and location details
                            const emptyData = {
                              mobileNumber: currentData.mobileNumber, // Keep phone number
                              name: '',
                              companyName: '',
                              email: '',
                              locality: '',
                              flatBuilding: '',
                              landmark: '',
                              pincode: currentData.pincode || '', // Keep pincode
                              area: currentData.area || '', // Keep area
                              city: currentData.city || '', // Keep city
                              district: currentData.district || '', // Keep district
                              state: currentData.state || '', // Keep state
                              gstNumber: '',
                              alternateNumbers: [''],
                              addressType: 'Home',
                              birthday: '',
                              anniversary: '',
                              website: '',
                              otherAlternateNumber: '',
                            };
                            
                            if (currentType === 'origin') {
                              setOriginData(emptyData);
                              // Keep pincode if it exists
                              if (currentData.pincode) {
                                setOriginPincode(currentData.pincode);
                              }
                            } else {
                              setDestinationData(emptyData);
                              // Keep pincode if it exists
                              if (currentData.pincode) {
                                setDestinationPincode(currentData.pincode);
                              }
                            }
                            
                            // Set add another address mode
                            setIsAddingAnotherAddress(true);
                            setNewAddressData(null);
                            setSelectedAddressIndex(0);
                            
                            // Clear search results and show blank form
                            setPhoneSearchResults([]);
                            setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
                            setShowPreviewInModal(false);
                          }}
                          variant="outline"
                          className={cn(
                            "h-9 sm:h-10 rounded-md text-xs sm:text-sm font-medium",
                            isDarkMode
                              ? "border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                              : "border-blue-500 bg-blue-50 hover:bg-blue-100 text-blue-600"
                          )}
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                          Add Another Address
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => {
                          const currentType = formModalOpen.type;
                          
                          // If in "add another address" mode, apply the selected address
                          if (isAddingAnotherAddress && previousAddressData && newAddressData) {
                            const selectedData = selectedAddressIndex === 0 ? previousAddressData : newAddressData;
                            
                            if (currentType === 'origin') {
                              setOriginData({ ...selectedData });
                              if (selectedData.pincode) {
                                setOriginPincode(selectedData.pincode);
                              }
                            } else {
                              setDestinationData({ ...selectedData });
                              if (selectedData.pincode) {
                                setDestinationPincode(selectedData.pincode);
                              }
                            }
                            
                            // Reset add another address mode
                            setIsAddingAnotherAddress(false);
                            setPreviousAddressData(null);
                            setNewAddressData(null);
                            setSelectedAddressIndex(0);
                          }
                          
                          // Clear phone search results when continuing
                          setPhoneSearchResults([]);
                          setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
                          setFormModalOpen({ type: null });
                          setShowPreviewInModal(false);
                          
                          // If origin form is saved and complete, automatically move to destination
                          if (currentType === 'origin' && isOriginFormComplete) {
                            setCurrentSection('destination');
                            // Auto-open destination phone modal if phone is not complete
                            if (!isDestinationPhoneComplete && currentStep === 1) {
                              setTimeout(() => {
                                setPhoneModalOpen({ type: 'destination' });
                              }, 500);
                            }
                          }
                        }}
                        className={cn(
                          "flex-1 h-9 sm:h-10 rounded-md text-xs sm:text-sm font-medium",
                          isDarkMode
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                        )}
                      >
                        {formModalOpen.type === 'origin' ? 'Continue' : 'Done'}
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog
        open={shouldShowCheckoutDialog}
        onOpenChange={(open) => {
          if (!processingPayment) {
            setCheckoutOpen(open);
          }
        }}
      >
        <DialogContent className={cn(
          'w-[95vw] sm:w-[92vw] max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl border shadow-2xl p-0 [&>button]:hidden',
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        )}>
          <div className="flex h-full flex-col">
            <div
              className={cn(
                'flex items-start justify-between gap-3 px-4 sm:px-8 py-3 sm:py-5 border-b',
                isDarkMode
                  ? 'border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900'
                  : 'border-slate-100 bg-gradient-to-r from-blue-50 via-white to-purple-50'
              )}
            >
              <div className="space-y-0.5 sm:space-y-1">
                <p className={cn(
                  'text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-semibold',
                  isDarkMode ? 'text-blue-400' : 'text-blue-500'
                )}>
                  Booking
                </p>
                <div>
                  <h2 className={cn(
                    'text-base sm:text-2xl font-semibold',
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  )}>
                    {orderComplete ? 'Booking completed' : 'Booking confirmed'}
                  </h2>
                  <p className={cn(
                    'text-xs sm:text-sm mt-0.5 sm:mt-1',
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  )}>
                    {orderComplete ? 'You are all set.' : 'Choose how you would like to complete your payment.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close checkout"
                disabled={processingPayment}
                onClick={() => {
                  if (!processingPayment) {
                    setCheckoutOpen(false);
                  }
                }}
                className={cn(
                  'rounded-full p-1.5 sm:p-2 transition-colors',
                  processingPayment && 'opacity-40 cursor-not-allowed',
                  isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                )}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {orderComplete ? (
                <div className="space-y-4 sm:space-y-6">
                  <div className={cn(
                    'rounded-xl sm:rounded-2xl border p-4 sm:p-6 text-center shadow-sm',
                    isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-white'
                  )}>
                    <div className={cn(
                      'mx-auto mb-4 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg'
                    )}>
                      <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                    </div>
                    <h3 className={cn('text-xl sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-slate-900')}>
                      Booking Complete!
                    </h3>
                    <p className={cn('text-xs sm:text-sm mt-1.5 sm:mt-2', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                      Reference: <span className="font-semibold">{latestBookingSummary?.bookingReference || awbNumber || 'Awaiting assignment'}</span>
                    </p>
                    <p className={cn('text-xs sm:text-sm', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                      Consignment #: <span className="font-semibold">{consignmentNumber ?? latestBookingSummary?.consignmentNumber ?? 'Awaiting assignment'}</span>
                    </p>
                    <div className={cn(
                      'mt-4 sm:mt-6 rounded-lg sm:rounded-xl border p-3 sm:p-4 text-left',
                      isDarkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-100 bg-slate-50'
                    )}>
                      <h4 className={cn('font-semibold mb-2 sm:mb-3 text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-slate-900')}>What's next?</h4>
                      <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        {['You will receive a confirmation email shortly', 'Track your shipment in the "My Booking" section', 'Invoice will be emailed within 7 days'].map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                            <span className={cn(isDarkMode ? 'text-slate-300' : 'text-slate-600')}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mt-3 sm:mt-4">
                      <Button
                        onClick={() => {
                          setCheckoutOpen(false);
                          setOrderComplete(false);
                        }}
                        className={cn(
                          'px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full',
                          isDarkMode ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                        )}
                      >
                        Close
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleViewMyBookings}
                        className={cn(
                          'px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full',
                          isDarkMode ? 'border-slate-700 text-slate-100 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        Go to My Bookings
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-5">
                  <div className={cn(
                    'rounded-xl sm:rounded-2xl border p-4 sm:p-6 shadow-sm',
                    isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-white'
                  )}>
                    <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg">
                        <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <div>
                        <h3 className={cn('text-lg sm:text-xl font-semibold', isDarkMode ? 'text-white' : 'text-slate-900')}>
                          Booking Confirmed
                        </h3>
                        <p className={cn('text-xs sm:text-sm mt-0.5 sm:mt-1', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                          Your booking has been created successfully. Choose a payment option to finish.
                        </p>
                      </div>
                    </div>
                    {(latestBookingSummary || consignmentNumber || awbNumber) && (
                      <div className={cn(
                        'mt-4 sm:mt-5 rounded-lg sm:rounded-xl border px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm',
                        isDarkMode ? 'border-slate-700 bg-slate-900/70 text-slate-200' : 'border-slate-100 bg-slate-50 text-slate-700'
                      )}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400">Consignment #</span>
                          <span className="font-semibold text-xs sm:text-sm">{consignmentNumber ?? latestBookingSummary?.consignmentNumber ?? 'Assigning...'}</span>
                        </div>
                        <div className="mt-1.5 sm:mt-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400">Booking Ref</span>
                          <span className="font-semibold text-xs sm:text-sm">{latestBookingSummary?.bookingReference || awbNumber || 'Assigning...'}</span>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 sm:mt-5 grid gap-3 sm:gap-4 sm:grid-cols-2">
                      <div className={cn(
                        'rounded-lg sm:rounded-xl border p-3 sm:p-4 text-xs sm:text-sm',
                        isDarkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-100 bg-slate-50'
                      )}>
                        <p className={cn('text-[10px] sm:text-xs uppercase tracking-wider mb-1.5 sm:mb-2', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>Amount Payable</p>
                        <p className={cn('text-xl sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-slate-900')}>
                          ₹{calculatedPrice ? (calculatedPrice + TOTAL_PICKUP_CHARGE).toFixed(2) : TOTAL_PICKUP_CHARGE.toFixed(2)}
                        </p>
                        <p className={cn('text-[10px] sm:text-xs mt-0.5 sm:mt-1', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                          Inclusive of pickup & GST
                        </p>
                      </div>
                      <div className={cn(
                        'rounded-lg sm:rounded-xl border p-3 sm:p-4 text-xs sm:text-sm space-y-1',
                        isDarkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-100 bg-slate-50'
                      )}>
                        <p className={cn('text-[10px] sm:text-xs uppercase tracking-wider', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>Contact</p>
                        <p className={cn('text-sm sm:text-base font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-800')}>
                          +91 {originData.mobileNumber || '—'}
                        </p>
                        <p className={cn('text-[10px] sm:text-xs', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                          Need help? <a href="mailto:info@oclservices.com" className="underline">info@oclservices.com</a>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <Button
                      onClick={handleRazorpayPayment}
                      disabled={processingPayment || savingBooking || !pendingBookingPayload}
                      className={cn(
                        'w-full rounded-xl sm:rounded-2xl py-3 sm:py-4 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 transition-all',
                        isDarkMode
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-white disabled:bg-emerald-500/40'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-emerald-500/40'
                      )}
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                          Pay Now — ₹{calculatedPrice ? (calculatedPrice + TOTAL_PICKUP_CHARGE).toFixed(2) : TOTAL_PICKUP_CHARGE.toFixed(2)}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handlePayLater}
                      disabled={savingBooking || processingPayment || !pendingBookingPayload}
                      variant="outline"
                      className={cn(
                        'w-full rounded-xl sm:rounded-2xl py-3 sm:py-4 text-sm sm:text-base font-semibold flex items-center justify-center gap-2',
                        isDarkMode
                          ? 'border-slate-700 text-slate-100 hover:bg-slate-800'
                          : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                      )}
                    >
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                      Pay Later (Confirm Booking)
                    </Button>
                  </div>
                  <p className={cn('text-[10px] sm:text-xs text-center', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                    <span className="font-medium">Secure payments</span> powered by Razorpay • 256-bit SSL
                  </p>
                </div>
              )}
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-md p-0 border-0 bg-transparent">
          <UserLogin
            isDarkMode={isDarkMode}
            onLoginSuccess={() => {
              setShowLoginDialog(false);
              // Proceed to next step after login
              const newCompleted = [...completedSteps];
              newCompleted[0] = true;
              setCompletedSteps(newCompleted);
              setCurrentStep(1);
              setCurrentSection('origin');
            }}
            onCancel={() => setShowLoginDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookNow;