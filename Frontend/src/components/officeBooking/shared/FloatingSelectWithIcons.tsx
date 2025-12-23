/**
 * FloatingSelectWithIcons Component
 * Reusable floating label select component with icons
 * Design matches BookNow.tsx
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FloatingSelectWithIconsProps {
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
              "shadow-[rgba(0,0,0,0.15)_0px_3px_3px_0px]",
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
            <div className="max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/50 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400/70">
              {options.map((option, index) => {
                const OptionIcon = option.icon;
                const isSelected = value === option.value;
                return (
                  <button
                    key={index}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
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

export default FloatingSelectWithIcons;

