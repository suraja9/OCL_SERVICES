import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Package, 
  MapPin, 
  Calendar, 
  ChevronDown,
  Loader2
} from 'lucide-react';

interface ConsignmentSuggestion {
  consignmentNumber: string;
  destination: string;
  bookingDate: string;
  status: string;
}

interface ConsignmentSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: ConsignmentSuggestion) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  isDarkMode?: boolean;
  initialSuggestions?: ConsignmentSuggestion[]; // Pre-loaded consignment suggestions
}

const ConsignmentSuggestions: React.FC<ConsignmentSuggestionsProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Enter consignment number",
  label = "Consignment Number",
  required = false,
  className = "",
  isDarkMode = false,
  initialSuggestions = []
}) => {
  const [suggestions, setSuggestions] = useState<ConsignmentSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter initial suggestions when user types
  useEffect(() => {
    if (initialSuggestions.length > 0) {
      if (searchTerm.length > 0) {
        // Filter initial suggestions based on search term
        const filtered = initialSuggestions.filter(suggestion =>
          suggestion.consignmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          suggestion.destination.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSuggestions(filtered);
        setIsOpen(isFocused && filtered.length > 0);
      } else {
        // Show all initial suggestions when no search term (if focused)
        setSuggestions(initialSuggestions);
        setIsOpen(isFocused);
      }
    } else if (searchTerm.length > 0) {
      // Fallback to API search if no initial suggestions
      const timeoutId = setTimeout(() => {
        fetchSuggestions(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [searchTerm, initialSuggestions, isFocused]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (search: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('corporateToken');
      const response = await fetch(
        `/api/courier-complaints/consignment-suggestions?search=${encodeURIComponent(search)}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    // Show all suggestions when focused - either filtered or all initial suggestions
    if (initialSuggestions.length > 0) {
      if (searchTerm.length > 0) {
        // Filter based on search term
        const filtered = initialSuggestions.filter(suggestion =>
          suggestion.consignmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          suggestion.destination.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSuggestions(filtered);
        setIsOpen(filtered.length > 0);
      } else {
        // Show all initial suggestions when focused with no search term
        setSuggestions(initialSuggestions);
        setIsOpen(true);
      }
    } else if (searchTerm.length > 0 && suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay to allow click events on chevron to fire first
    setTimeout(() => {
      // Check if focus moved to dropdown or chevron
      if (
        !dropdownRef.current?.contains(document.activeElement) &&
        !inputRef.current?.contains(document.activeElement)
      ) {
        setIsFocused(false);
        setIsOpen(false);
      }
    }, 200);
  };

  const handleSuggestionClick = (suggestion: ConsignmentSuggestion) => {
    onChange(suggestion.consignmentNumber);
    onSelect(suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return <Badge variant="default" className="text-xs">Delivered</Badge>;
      case 'in transit':
      case 'active':
        return <Badge variant="secondary" className="text-xs">In Transit</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const isLabelFloating = isFocused || value.length > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Label 
          htmlFor="consignment-input" 
          className={cn(
            "absolute left-3 transition-all duration-200 pointer-events-none",
            isLabelFloating
              ? cn(
                  "top-0 text-xs px-1 -translate-y-1/2",
                  isDarkMode
                    ? "text-slate-400 bg-slate-800/60"
                    : "text-gray-500 bg-white"
                )
              : cn(
                  "top-1/2 -translate-y-1/2 text-xs",
                  isDarkMode ? "text-slate-300" : "text-gray-700"
                )
          )}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          ref={inputRef}
          id="consignment-input"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder=""
          className={cn(
            "w-full h-7 pr-10 py-0 border-[1px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none transition-all duration-200 rounded-lg",
            isDarkMode
              ? cn(
                  "bg-slate-700/50 text-slate-200 placeholder:text-slate-400",
                  isFocused
                    ? "border-blue-500 focus:border-blue-400 shadow-[0_2px_8px_rgba(59,130,246,0.15),0_4px_12px_rgba(59,130,246,0.1)]"
                    : "border-slate-600 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.05)]"
                )
              : cn(
                  isFocused
                    ? "border-blue-500 focus:border-blue-600 shadow-[0_2px_8px_rgba(59,130,246,0.15),0_4px_12px_rgba(59,130,246,0.1)]"
                    : "border-gray-300 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.05)]"
                )
          )}
        />
        <div 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 cursor-pointer"
          onClick={() => {
            if (!isLoading) {
              if (isOpen) {
                setIsOpen(false);
              } else {
                handleInputFocus();
              }
            }
          }}
        >
          {isLoading ? (
            <Loader2 className={cn(
              "h-4 w-4 animate-spin",
              isDarkMode ? "text-slate-400" : "text-gray-400"
            )} />
          ) : (
            <ChevronDown className={cn(
              "h-4 w-4",
              isDarkMode ? "text-slate-400" : "text-gray-400"
            )} />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 w-full mt-1 backdrop-blur-sm rounded-lg shadow-2xl border-0 max-h-60 overflow-y-auto",
            isDarkMode
              ? "bg-slate-800/95 border-slate-700/50"
              : "bg-white/95"
          )}
        >
          {suggestions.length === 0 && !isLoading ? (
            <div className={cn(
              "p-2 text-center text-xs",
              isDarkMode ? "text-slate-400" : "text-gray-500"
            )}>
              No consignments found
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <div
                key={suggestion.consignmentNumber}
                className={cn(
                  "p-3 cursor-pointer border-b last:border-b-0 transition-colors duration-200",
                  isDarkMode
                    ? cn(
                        "border-slate-700/50",
                        index === selectedIndex
                          ? "bg-blue-900/30 hover:bg-blue-900/40"
                          : "hover:bg-slate-700/50"
                      )
                    : cn(
                        "border-gray-100/50",
                        index === selectedIndex
                          ? "bg-blue-50"
                          : "hover:bg-blue-50/50"
                      )
                )}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <Package className={cn(
                        "h-3 w-3",
                        isDarkMode ? "text-blue-400" : "text-blue-600"
                      )} />
                      <span className={cn(
                        "font-medium text-sm",
                        isDarkMode ? "text-slate-200" : "text-gray-900"
                      )}>
                        {suggestion.consignmentNumber}
                      </span>
                    </div>
                    <div className={cn(
                      "flex items-center gap-3 text-xs",
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    )}>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{suggestion.destination}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(suggestion.bookingDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-2">
                    {getStatusBadge(suggestion.status)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ConsignmentSuggestions;
