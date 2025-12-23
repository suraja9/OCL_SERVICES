/**
 * FloatingTextarea Component
 * Reusable floating label textarea component
 */

import React, { useState } from 'react';

export interface FloatingTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  className?: string;
  isDarkMode?: boolean;
}

const FloatingTextarea: React.FC<FloatingTextareaProps> = ({
  label,
  value,
  onChange,
  required = false,
  rows = 4,
  className = '',
  isDarkMode = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = isFocused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        rows={rows}
        className={`
          w-full px-3 py-2 pt-6
          border rounded-xl text-sm
          transition-all duration-200 ease-in-out
          resize-none
          ${isDarkMode
            ? 'bg-slate-800/60 border-slate-700 text-slate-100'
            : 'bg-white/90 backdrop-blur-sm'
          }
          ${isFocused 
            ? isDarkMode
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-[0_4px_8px_rgba(0,0,0,0.1)]'
              : 'border-[#406ab9] ring-2 ring-[#4ec0f7]/20 shadow-[0_4px_8px_rgba(0,0,0,0.1)]'
            : isDarkMode
              ? 'border-slate-700 hover:border-blue-400/50'
              : 'border-gray-300/60 hover:border-[#406ab9]/50 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)]'
          }
          focus:outline-none ${isDarkMode ? 'text-slate-100' : 'text-[#1e293b]'}
        `}
        style={{ fontFamily: 'Calibri, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important' }}
      />
      <label
        className={`
          absolute left-4
          transition-all duration-200 ease-in-out
          pointer-events-none select-none
          ${shouldFloat
            ? `top-0 -translate-y-1/2 text-xs px-2 ${isDarkMode ? 'bg-slate-900 text-blue-400' : 'bg-white text-[#406ab9]'} font-medium`
            : `top-3 text-base ${isDarkMode ? 'text-slate-400' : 'text-[#64748b]'}`
          }
          ${isFocused && !hasValue ? (isDarkMode ? 'text-blue-400' : 'text-[#406ab9]') : ''}
        `}
        style={{ fontFamily: 'Calibri, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important' }}
      >
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    </div>
  );
};

export default FloatingTextarea;

