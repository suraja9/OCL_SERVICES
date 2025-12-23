/**
 * FloatingSelect Component
 * Reusable floating label select component
 * Design matches BookNow.tsx
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface FloatingSelectProps {
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

export default FloatingSelect;

