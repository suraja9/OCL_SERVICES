import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Package,
  Upload,
  FileText,
  CheckCircle,
  Copy,
  AlertCircle,
  Loader2,
  Building,
  Phone,
  Mail,
  Calendar,
  Truck,
  DollarSign,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Navigation,
  ChevronRight,
  User,
  Globe,
  Info,
  Scale,
  Ruler,
  Eye,
  XCircle,
  Pencil,
  Check,
  ShieldCheck,
  Plane,
  Train
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUploadWithPreview, uploadFiles, validateFile, compressImage, UploadedFileData } from "./upload";
import { cn } from "@/lib/utils";

// Package Type Options
const packageTypeOptions = [
  'Auto & Machine Parts',
  'Books',
  'Cheque Book',
  'Chocolates',
  'Clothing (General)',
  'Computer Accessories',
  'Corporate Gifts',
  'Credit / Debit Card',
  'Documents',
  'Dry Fruits',
  'Household Goods',
  'Laptop',
  'Luggage / Travel Bag',
  'Medical Equipment',
  'Medicines',
  'Passport',
  'Pen Drive',
  'Promotional Material (Paper)',
  'SIM Card',
  'Sports',
  'Stationery Items',
  'Sweets',
  'Toys',
  'Others'
];

// Helper functions for input sanitization
const sanitizeInteger = (value: string) => value.replace(/\D/g, '');
const sanitizeDecimal = (value: string) => {
  // Allow digits and one decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

// Volumetric weight calculation constant
const VOLUMETRIC_DIVISOR = 5000; // Standard volumetric conversion factor (cm³ to kg)

// Floating Label Input Component
interface FloatingLabelInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  maxLength?: number;
  className?: string;
  icon?: React.ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  isDarkMode?: boolean;
  inputPlaceholder?: string; // Placeholder to show inside input when focused
}

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(undefined);
  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  const updateTriggerWidth = () => {
    if (wrapperRef.current) {
      setTriggerWidth(wrapperRef.current.offsetWidth);
    }
  };

  useEffect(() => {
    updateTriggerWidth();
    if (isFocused) {
      // Update width when dropdown opens
      const timeout = setTimeout(updateTriggerWidth, 0);
      return () => clearTimeout(timeout);
    }
  }, [isFocused]);

  useEffect(() => {
    // Update width on window resize
    const handleResize = () => {
      updateTriggerWidth();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      {icon && (
        <div className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 z-1", isDarkMode ? "text-slate-400" : "text-gray-400")}>
          {icon}
        </div>
      )}
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        onOpenChange={(open) => setIsFocused(open)}
      >
        <SelectTrigger 
          className={cn(
          "w-full h-10 min-h-[40px] px-3 border rounded-xl transition-all duration-200 ease-in-out text-xs appearance-none",
          icon ? "pl-10" : "pl-3",
          "pr-8",
          isDarkMode 
            ? disabled
              ? "bg-slate-900/40 border-slate-700 text-slate-500 cursor-not-allowed"
              : "bg-slate-800/60 border-slate-700 text-slate-100 focus:border-blue-500"
            : disabled
              ? "bg-gray-50 border-gray-300/60 text-gray-500 cursor-not-allowed"
              : "bg-white/90 border-gray-300/60 text-[#4B5563] focus:border-blue-500",
          !disabled && isDarkMode && "hover:border-blue-400/50",
          !disabled && !isDarkMode && "hover:border-blue-400/50",
          "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none font-normal",
          className
        )} style={{ fontFamily: '"Value Serif Pro Regular", serif !important', fontWeight: '400 !important' }}>
          <SelectValue placeholder="" />
        </SelectTrigger>
        <SelectContent 
          className={cn(
          "z-50 mt-1 border rounded-xl shadow-lg overflow-hidden max-h-[300px] overflow-y-auto",
          isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-300"
        )} 
        style={{ 
          fontFamily: '"Value Serif Pro Regular", serif !important',
          width: triggerWidth ? `${triggerWidth}px` : 'var(--radix-select-trigger-width)'
        }}>
          {options.map((option, index) => (
            <SelectItem 
              key={index} 
              value={option}
              className={cn(
                "text-xs px-3 py-2 cursor-pointer transition-colors",
                isDarkMode 
                  ? "text-slate-100 hover:bg-slate-700 focus:bg-slate-700" 
                  : "text-[#4B5563] hover:bg-slate-50"
              )}
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Label
        className={cn(
          "absolute transition-all duration-200 ease-in-out pointer-events-none select-none",
          icon ? "left-12" : "left-4",
          isFloating
            ? "top-0 -translate-y-1/2 text-xs px-2"
            : "top-1/2 -translate-y-1/2 text-xs",
          isFloating
            ? isDarkMode 
              ? "bg-slate-900 text-blue-400" 
              : "bg-white text-blue-600"
            : isDarkMode 
              ? "text-slate-400" 
              : "text-gray-500",
          isFocused && !hasValue && (isDarkMode ? "text-blue-400" : "text-blue-600")
        )}
        style={{ fontFamily: '"Value Serif Pro Regular", serif !important' }}
      >
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
    </div>
  );
};

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  className = "",
  icon,
  error,
  required = false,
  disabled = false,
  isDarkMode = false,
  inputPlaceholder
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  // For date inputs, use text type when not focused and empty to hide browser placeholder
  const [internalType, setInternalType] = useState(type === 'date' ? 'text' : type);
  const isFloating = isFocused || hasValue;
  
  // Update internal type when value changes (for date inputs) - if value exists, use date type
  useEffect(() => {
    if (type === 'date' && hasValue) {
      setInternalType('date');
    }
  }, [hasValue, type]);

  return (
    <div className="relative">
      {icon && (
        <div className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 z-1", isDarkMode ? "text-slate-400" : "text-gray-400")}>
          {icon}
        </div>
      )}
      <Input
        id={id}
        type={internalType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setIsFocused(true);
          if (type === 'date') {
            setInternalType('date');
          }
        }}
        onBlur={() => {
          setIsFocused(false);
          if (type === 'date' && !value) {
            setInternalType('text');
          }
        }}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          "w-full h-10 px-3 rounded-xl transition-all duration-200 ease-in-out text-xs",
          "border",
          icon ? "pl-10" : "pl-3",
          "pr-3",
          isDarkMode 
            ? "bg-slate-800/60 text-slate-100 placeholder:text-slate-400" 
            : "bg-white/90 text-[#4B5563] placeholder:text-[#4B5563]",
          isDarkMode ? "border-slate-700" : "border-gray-300/60",
          error
            ? "border-red-500"
            : isFocused
              ? isDarkMode
                ? "border-blue-500"
                : "border-blue-400"
              : isDarkMode
                ? "hover:border-blue-400/50"
                : "hover:border-blue-400/50",
          disabled && (isDarkMode ? "bg-slate-900/40 cursor-not-allowed" : "bg-gray-50 cursor-not-allowed"),
          "focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none font-normal",
          className
        )}
        style={{ fontFamily: '"Value Serif Pro Regular", serif !important', fontWeight: 400 }}
        placeholder={inputPlaceholder && isFloating && !hasValue ? inputPlaceholder : ""}
      />
      <Label
        htmlFor={id}
        className={cn(
          "absolute transition-all duration-200 ease-in-out pointer-events-none select-none z-10",
          icon ? "left-12" : "left-4",
          isFloating
            ? "top-0 -translate-y-1/2 text-xs px-2"
            : "top-1/2 -translate-y-1/2 text-xs",
          isFloating
            ? isDarkMode 
              ? "bg-slate-900 text-blue-400" 
              : "bg-white text-blue-600"
            : isDarkMode 
              ? "text-slate-400" 
              : "text-gray-500",
          isFocused && !hasValue && (isDarkMode ? "text-blue-400" : "text-blue-600")
        )}
        style={{ fontFamily: '"Value Serif Pro Regular", serif !important' }}
      >
        {placeholder} {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {error && (
        <p className={cn("text-xs mt-1", isDarkMode ? "text-red-300" : "text-red-600")}>{error}</p>
      )}
    </div>
  );
};

interface CorporateBookingData {
  // Origin data
  originData: {
    useCurrentAddress: boolean;
    mobileNumber: string;
    name: string;
    companyName: string;
    email: string;
    locality: string;
    flatBuilding: string;
    landmark: string;
    pincode: string;
    area: string;
    city: string;
    district: string;
    state: string;
    gstNumber: string;
    alternateNumbers: string[];
    addressType: string;
    birthday: string;
    anniversary: string;
    otherAlternateNumber: string;
    showOtherAlternateNumber: boolean;
    website: string;
  };

  // Destination data
  destinationData: {
    mobileNumber: string;
    name: string;
    companyName: string;
    email: string;
    locality: string;
    flatBuilding: string;
    landmark: string;
    pincode: string;
    area: string;
    city: string;
    district: string;
    state: string;
    gstNumber: string;
    alternateNumbers: string[];
    addressType: string;
    website: string;
    anniversary: string;
    birthday: string;
  };

  // Shipment data
  shipmentData: {
    natureOfConsignment: string;
    services: string;
    mode: string;
    insurance: string;
    riskCoverage: string;
    packagesCount: string;
    packageType: string;
    others: string;
    contentDescription: string;
    declaredValue: string;
    dimensions: Array<{
      length: string;
      breadth: string;
      height: string;
      unit: string;
    }>;
    actualWeight: string;
    volumetricWeight: number;
    chargeableWeight: number;
    totalPackages: string;
    materials: string;
    packageImages: File[];
    uploadedFiles: UploadedFileData[];
    description: string;
    specialInstructions: string;
  };

  // Invoice data
  invoiceData: {
    billingAddress: string;
    paymentMethod: string;
    terms: string;
    calculatedPrice: number;
    gst: number;
    finalPrice: number;
    serviceType: string;
    location: string;
    transportMode: string;
    chargeableWeight: number;
  };

  // Payment data
  paymentData: {
    paymentType: 'FP' | 'TP' | ''; // FP = Freight Paid, TP = To Pay, '' = Not selected
  };
}

interface CorporateBookingPanelProps {
  isDarkMode?: boolean;
}

const CorporateBookingPanel: React.FC<CorporateBookingPanelProps> = ({ isDarkMode = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [corporateInfo, setCorporateInfo] = useState<any>(null);
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [previousDestinations, setPreviousDestinations] = useState<any[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [selectedDestinationIndex, setSelectedDestinationIndex] = useState<number | null>(null);
  const [isLookingUpPhone, setIsLookingUpPhone] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [destinationAreas, setDestinationAreas] = useState<string[]>([]);
  const [isLoadingPincode, setIsLoadingPincode] = useState(false);
  const [isLoadingDestinationPincode, setIsLoadingDestinationPincode] = useState(false);
  const [pricingData, setPricingData] = useState<any>(null);
  const [isBookingComplete, setIsBookingComplete] = useState(false);
  const [bookingReference, setBookingReference] = useState<string>('');

  // Origin addresses management
  const [originAddresses, setOriginAddresses] = useState<any[]>([]);
  const [selectedOriginAddressId, setSelectedOriginAddressId] = useState<string>('default');
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddressData, setNewAddressData] = useState<any>({
    name: '',
    companyName: '',
    email: '',
    mobileNumber: '',
    locality: '',
    flatBuilding: '',
    landmark: '',
    pincode: '',
    area: '',
    city: '',
    district: '',
    state: '',
    gstNumber: '',
    addressType: 'Home',
    website: '',
    anniversary: '',
    birthday: '',
    alternateNumber: ''
  });

  // Consignment assignment states
  const [consignmentCheck, setConsignmentCheck] = useState<{
    hasAssignment: boolean | null;
    assignments: any[];
    summary: any;
    message: string;
    isLoading: boolean;
  }>({
    hasAssignment: null,
    assignments: [],
    summary: null,
    message: '',
    isLoading: true
  });

  // Consignment finished popup state
  const [showConsignmentFinishedPopup, setShowConsignmentFinishedPopup] = useState(false);

  // Preview/edit state
  const [editingSection, setEditingSection] = useState<'origin' | 'destination' | 'shipment' | 'package' | null>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      bookingData.shipmentData.packageImages.forEach(file => {
        if (file.type.startsWith('image/')) {
          URL.revokeObjectURL(URL.createObjectURL(file));
        }
      });
    };
  }, []);

  // GST validation states
  const [originGstError, setOriginGstError] = useState(false);
  const [destinationGstError, setDestinationGstError] = useState(false);

  // Mobile number validation states
  const [originMobileError, setOriginMobileError] = useState(false);
  const [destinationMobileError, setDestinationMobileError] = useState(false);

  // Website validation states
  const [newAddressWebsiteError, setNewAddressWebsiteError] = useState(false);
  const [destinationWebsiteError, setDestinationWebsiteError] = useState(false);

  const { toast } = useToast();

  // GST validation function (from office dashboard)
  const validateGSTFormat = (value: string) => {
    // Remove any non-alphanumeric characters
    let cleanValue = value.replace(/[^A-Z0-9]/g, '').toUpperCase();

    // Limit to 15 characters
    cleanValue = cleanValue.slice(0, 15);

    // Apply GST format rules
    let formattedValue = '';

    for (let i = 0; i < cleanValue.length; i++) {
      const char = cleanValue[i];

      if (i < 2) {
        // First 2 digits: State code (numbers only)
        if (/[0-9]/.test(char)) {
          formattedValue += char;
        }
      } else if (i < 7) {
        // Next 5 characters: Alphabets only (positions 2-6)
        if (/[A-Z]/.test(char)) {
          formattedValue += char;
        }
      } else if (i < 11) {
        // Next 4 characters: Numbers only (positions 7-10)
        if (/[0-9]/.test(char)) {
          formattedValue += char;
        }
      } else if (i < 13) {
        // Next 2 characters: Alphabets only (positions 11-12)
        if (/[A-Z]/.test(char)) {
          formattedValue += char;
        }
      } else {
        // Last 3 characters: Numbers only (positions 13-15)
        if (/[0-9]/.test(char)) {
          formattedValue += char;
        }
      }
    }

    return formattedValue;
  };

  // Mobile number validation function
  const validateMobileNumber = (value: string) => {
    // Remove any non-digit characters
    const cleanValue = value.replace(/\D/g, '');

    // Check if it's a valid 10-digit Indian mobile number
    if (cleanValue.length === 10) {
      const firstDigit = cleanValue[0];
      // Indian mobile numbers start with 6, 7, 8, or 9
      return ['6', '7', '8', '9'].includes(firstDigit);
    }

    return false;
  };

  // Website validation function
  const validateWebsite = (value: string) => {
    // If empty, it's valid (optional field)
    if (!value || value.trim() === '') {
      return true;
    }

    // Remove leading/trailing whitespace
    const trimmedValue = value.trim();

    // Basic URL pattern validation
    // Accepts: http://, https://, or domain names without protocol
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    
    // Also check for localhost and IP addresses
    const localhostPattern = /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?([\/\w \.-]*)*\/?$/i;
    
    // Check if it matches URL pattern or localhost pattern
    if (urlPattern.test(trimmedValue) || localhostPattern.test(trimmedValue)) {
      return true;
    }

    // Check for minimum domain requirements (at least 3 characters, contains a dot)
    if (trimmedValue.length >= 3 && trimmedValue.includes('.')) {
      // Check if it's a valid domain format
      const domainParts = trimmedValue.replace(/^https?:\/\//i, '').split('.');
      if (domainParts.length >= 2 && domainParts.every(part => part.length > 0)) {
        return true;
      }
    }

    return false;
  };

  // Check consignment assignment on component mount
  useEffect(() => {
    const checkConsignmentAssignment = async () => {
      try {
        const token = localStorage.getItem('corporateToken');
        if (!token) return;

        const response = await fetch('/api/corporate/consignment/check', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        setConsignmentCheck({
          hasAssignment: data.hasAssignment,
          assignments: data.assignments || [],
          summary: data.summary || null,
          message: data.message,
          isLoading: false
        });

        if (!data.hasAssignment) {
          toast({
            title: "Consignment Assignment Required",
            description: data.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Consignment Status",
            description: data.message,
          });
        }
      } catch (error) {
        console.error('Error checking consignment assignment:', error);
        setConsignmentCheck({
          hasAssignment: false,
          assignments: [],
          summary: null,
          message: 'Failed to check consignment assignment status',
          isLoading: false
        });
        toast({
          title: "Error",
          description: "Failed to check consignment assignment status",
          variant: "destructive",
        });
      }
    };

    checkConsignmentAssignment();
  }, []);

  // Load corporate pricing data
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const token = localStorage.getItem('corporateToken');
        const response = await fetch('/api/corporate/pricing', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPricingData(data.pricing);
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error);
      }
    };

    fetchPricingData();
  }, []);

  // Helper functions for pincode classification
  const isAssamPincode = (pincode: string) => {
    const pin = parseInt(pincode);
    return pin >= 780000 && pin <= 788999;
  };

  const isNorthEastPincode = (pincode: string) => {
    const pin = parseInt(pincode);
    return pin >= 790000 && pin <= 799999;
  };

  // Location classification function
  const classifyLocation = (pincode: string, byAir: boolean = false) => {
    if (isAssamPincode(pincode)) {
      return 'assam';
    } else if (isNorthEastPincode(pincode)) {
      return byAir ? 'neByAirAgtImp' : 'neBySurface';
    } else {
      return 'restOfIndia';
    }
  };

  // Calculate corporate pricing
  const calculateCorporatePrice = () => {
    if (!pricingData || !bookingData.destinationData.pincode || chargeableWeight <= 0) {
      return;
    }

    const weight = chargeableWeight; // Use chargeableWeight from useMemo
    const isPriority = bookingData.shipmentData.services === 'Priority';
    const isAir = bookingData.shipmentData.mode === 'Air';
    const natureOfConsignment = bookingData.shipmentData.natureOfConsignment;

    let price = 0;
    let location = '';
    let transportMode = '';
    let finalChargeableWeight = weight;
    let isMinimumWeightApplied = false;

    // Check if this is reverse pricing (only when using different address, not default corporate address)
    if (!bookingData.originData.useCurrentAddress && natureOfConsignment === 'NON-DOX') {
      // Reverse pricing logic
      const minChargeableWeights = {
        'Road': 500,
        'Surface': 100,
        'Air': 25
      };

      const modeKey = bookingData.shipmentData.mode === 'Air' ? 'Air' :
                     bookingData.shipmentData.mode === 'Surface' ? 'Surface' : 'Road';

      finalChargeableWeight = Math.max(weight, minChargeableWeights[modeKey as keyof typeof minChargeableWeights]);
      isMinimumWeightApplied = finalChargeableWeight > weight;

      if (isAssamPincode(bookingData.destinationData.pincode)) {
        location = 'Assam';
        const deliveryType = isPriority ? 'priority' : 'normal';
        const transportKey = bookingData.shipmentData.mode === 'Air' ? 'byFlight' :
                           bookingData.shipmentData.mode === 'Surface' ? 'byTrain' : 'byRoad';
        const pricePerKg = parseFloat(pricingData.reversePricing.toAssam[transportKey as keyof typeof pricingData.reversePricing.toAssam][deliveryType as keyof typeof pricingData.reversePricing.toAssam.byRoad]) || 0;
        price = pricePerKg * finalChargeableWeight;
        transportMode = transportKey;
      } else if (isNorthEastPincode(bookingData.destinationData.pincode)) {
        location = 'North East';
        const deliveryType = isPriority ? 'priority' : 'normal';
        const transportKey = bookingData.shipmentData.mode === 'Air' ? 'byFlight' :
                           bookingData.shipmentData.mode === 'Surface' ? 'byTrain' : 'byRoad';
        const pricePerKg = parseFloat(pricingData.reversePricing.toNorthEast[transportKey as keyof typeof pricingData.reversePricing.toNorthEast][deliveryType as keyof typeof pricingData.reversePricing.toNorthEast.byRoad]) || 0;
        price = pricePerKg * finalChargeableWeight;
        transportMode = transportKey;
      } else {
        // Not applicable for reverse pricing
        return;
      }
    } else {
      // Normal pricing logic
      location = classifyLocation(bookingData.destinationData.pincode, isAir);

      if (natureOfConsignment === 'DOX') {
        // DOX pricing logic
        if (isPriority) {
          // Priority Service pricing
          if (weight <= 500) {
            price = parseFloat(pricingData.priorityPricing['01gm-500gm'][location as keyof typeof pricingData.priorityPricing['01gm-500gm']]) || 0;
          } else {
            // For weights above 500gm, use base price + additional 500gm charges
            const basePrice = parseFloat(pricingData.priorityPricing['01gm-500gm'][location as keyof typeof pricingData.priorityPricing['01gm-500gm']]) || 0;
            const additionalWeight = Math.ceil((weight - 500) / 500);
            const additionalPrice = parseFloat(pricingData.priorityPricing.add500gm[location as keyof typeof pricingData.priorityPricing.add500gm]) || 0;
            price = basePrice + (additionalWeight * additionalPrice);
          }
        } else {
          // Standard Service pricing
          if (weight <= 250) {
            price = parseFloat(pricingData.doxPricing['01gm-250gm'][location as keyof typeof pricingData.doxPricing['01gm-250gm']]) || 0;
          } else if (weight <= 500) {
            price = parseFloat(pricingData.doxPricing['251gm-500gm'][location as keyof typeof pricingData.doxPricing['251gm-500gm']]) || 0;
          } else {
            // For weights above 500gm, use base price + additional 500gm charges
            const basePrice = parseFloat(pricingData.doxPricing['251gm-500gm'][location as keyof typeof pricingData.doxPricing['251gm-500gm']]) || 0;
            const additionalWeight = Math.ceil((weight - 500) / 500);
            const additionalPrice = parseFloat(pricingData.doxPricing.add500gm[location as keyof typeof pricingData.doxPricing.add500gm]) || 0;
            price = basePrice + (additionalWeight * additionalPrice);
          }
        }
      } else {
        // NON-DOX pricing logic (per kg)
        if (isAir) {
          const pricePerKg = parseFloat(pricingData.nonDoxAirPricing[location as keyof typeof pricingData.nonDoxAirPricing]) || 0;
          price = pricePerKg * weight;
        } else {
          const pricePerKg = parseFloat(pricingData.nonDoxSurfacePricing[location as keyof typeof pricingData.nonDoxSurfacePricing]) || 0;
          price = pricePerKg * weight;
        }
      }
    }

    const gst = price * 0.18;
    const finalPrice = price + gst;

    setBookingData(prev => ({
      ...prev,
      invoiceData: {
        ...prev.invoiceData,
        calculatedPrice: price,
        gst: gst,
        finalPrice: finalPrice,
        serviceType: natureOfConsignment,
        location: location,
        transportMode: transportMode || bookingData.shipmentData.mode,
        chargeableWeight: finalChargeableWeight
      }
    }));
  };

  const [bookingData, setBookingData] = useState<CorporateBookingData>({
    originData: {
      useCurrentAddress: true,
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
      addressType: 'Corporate',
      birthday: '',
      anniversary: '',
      otherAlternateNumber: '',
      showOtherAlternateNumber: false,
      website: ''
    },
    destinationData: {
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
      website: '',
      anniversary: '',
      birthday: ''
    },
    shipmentData: {
      natureOfConsignment: '',
      services: '',
      mode: '',
      insurance: 'Without insurance',
      riskCoverage: 'Owner',
      packagesCount: '',
      packageType: '',
      others: '',
      contentDescription: '',
      declaredValue: '',
      dimensions: [{ length: '', breadth: '', height: '', unit: 'cm' }],
      actualWeight: '',
      volumetricWeight: 0,
      chargeableWeight: 0,
      totalPackages: '',
      materials: '',
      packageImages: [],
      uploadedFiles: [],
      description: '',
      specialInstructions: ''
    },
    invoiceData: {
      billingAddress: '',
      paymentMethod: 'Corporate Credit',
      terms: '',
      calculatedPrice: 0,
      gst: 0,
      finalPrice: 0,
      serviceType: '',
      location: '',
      transportMode: '',
      chargeableWeight: 0
    },
    paymentData: {
      paymentType: '' as 'FP' | 'TP' | '' // No default - user must select
    }
  });

  // Weight calculations using useMemo (matching BookNow.tsx structure)
  const firstDimension = bookingData.shipmentData.dimensions[0] || { length: '', breadth: '', height: '', unit: 'cm' };
  const lengthValue = useMemo(() => {
    const val = parseFloat(firstDimension.length) || 0;
    // Convert to cm if unit is inches
    return firstDimension.unit === 'in' ? val * 2.54 : val;
  }, [firstDimension.length, firstDimension.unit]);
  
  const widthValue = useMemo(() => {
    const val = parseFloat(firstDimension.breadth) || 0;
    // Convert to cm if unit is inches
    return firstDimension.unit === 'in' ? val * 2.54 : val;
  }, [firstDimension.breadth, firstDimension.unit]);
  
  const heightValue = useMemo(() => {
    const val = parseFloat(firstDimension.height) || 0;
    // Convert to cm if unit is inches
    return firstDimension.unit === 'in' ? val * 2.54 : val;
  }, [firstDimension.height, firstDimension.unit]);
  
  const actualWeight = useMemo(() => parseFloat(bookingData.shipmentData.actualWeight) || 0, [bookingData.shipmentData.actualWeight]);
  
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
  const formattedChargeableWeight = chargeableWeight > 0 ? chargeableWeight.toFixed(2) : null;

  // Calculate price when relevant fields change
  useEffect(() => {
    if (currentStep >= 3 && pricingData) {
      calculateCorporatePrice();
    }
  }, [
    bookingData.originData.pincode,
    bookingData.destinationData.pincode,
    bookingData.shipmentData.actualWeight,
    bookingData.shipmentData.natureOfConsignment,
    bookingData.shipmentData.services,
    bookingData.shipmentData.mode,
    pricingData,
    currentStep,
    chargeableWeight
  ]);

  // Load corporate information on component mount
  useEffect(() => {
    const fetchCorporateProfile = async () => {
      try {
        const token = localStorage.getItem('corporateToken');
        if (!token) return;

        // Fetch full corporate profile from API
        const response = await fetch('/api/corporate/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const corporateData = data.corporate;
        setCorporateInfo(corporateData);

        // If corporate data doesn't have complete city information, try to fetch from pincode
        if (corporateData.pin && (!corporateData.city || !corporateData.state)) {
          try {
            const pincodeResponse = await fetch(`/api/pincode/${corporateData.pin}/simple`);
            if (pincodeResponse.ok) {
              const pincodeData = await pincodeResponse.json();
              // Update corporate data with pincode information
              const updatedCorporateData = {
                ...corporateData,
                city: corporateData.city || pincodeData.city,
                state: corporateData.state || pincodeData.state,
                locality: corporateData.locality || pincodeData.district
              };
              setCorporateInfo(updatedCorporateData);
              corporateData.city = updatedCorporateData.city;
              corporateData.state = updatedCorporateData.state;
              corporateData.locality = updatedCorporateData.locality;
            }
          } catch (pincodeError) {
            console.error('Error fetching pincode data:', pincodeError);
          }
        }

        // Pre-fill origin data with corporate information
        setBookingData(prev => ({
          ...prev,
          originData: {
            ...prev.originData,
            name: corporateData.companyName || '',
            companyName: corporateData.companyName || '',
            email: corporateData.email || '',
            mobileNumber: corporateData.contactNumber || '',
            pincode: corporateData.pin || '',
            city: corporateData.city || '',
            state: corporateData.state || '',
            locality: corporateData.companyAddress || '',
              flatBuilding: corporateData.flatNumber || '',
              landmark: corporateData.landmark || '',
              area: corporateData.locality || '',
              gstNumber: corporateData.gstNumber || '',
            addressType: 'Corporate',
            useCurrentAddress: true
          }
        }));
        // Set default address as selected
        setSelectedOriginAddressId('default');
        } else {
          // Fallback to localStorage if API fails
          const storedCorporateInfo = localStorage.getItem('corporateInfo');
          if (storedCorporateInfo) {
            const corporateData = JSON.parse(storedCorporateInfo);
            setCorporateInfo(corporateData);

            // Pre-fill origin data with corporate information from localStorage
            setBookingData(prev => ({
              ...prev,
              originData: {
                ...prev.originData,
                name: corporateData.companyName || '',
                companyName: corporateData.companyName || '',
                email: corporateData.email || '',
                mobileNumber: corporateData.contactNumber || '',
                pincode: corporateData.pin || '',
                city: corporateData.city || '',
                state: corporateData.state || '',
                locality: corporateData.companyAddress || '',
                flatBuilding: corporateData.flatNumber || '',
                landmark: corporateData.landmark || '',
                area: corporateData.locality || '',
                gstNumber: corporateData.gstNumber || '',
                addressType: 'Corporate',
                useCurrentAddress: true
              }
            }));
            setSelectedOriginAddressId('default');
          }
        }
      } catch (error) {
        console.error('Error fetching corporate profile:', error);
        // Fallback to localStorage
        const storedCorporateInfo = localStorage.getItem('corporateInfo');
        if (storedCorporateInfo) {
          try {
            const corporateData = JSON.parse(storedCorporateInfo);
            setCorporateInfo(corporateData);

            // Pre-fill origin data with corporate information from localStorage
            setBookingData(prev => ({
              ...prev,
              originData: {
                ...prev.originData,
                name: corporateData.companyName || '',
                companyName: corporateData.companyName || '',
                email: corporateData.email || '',
                mobileNumber: corporateData.contactNumber || '',
                pincode: corporateData.pin || '',
                city: corporateData.city || '',
                state: corporateData.state || '',
                locality: corporateData.companyAddress || '',
                flatBuilding: corporateData.flatNumber || '',
                landmark: corporateData.landmark || '',
                area: corporateData.locality || '',
                gstNumber: corporateData.gstNumber || '',
                addressType: 'Corporate',
                useCurrentAddress: true
              }
            }));
            setSelectedOriginAddressId('default');
          } catch (parseError) {
            console.error('Error parsing stored corporate info:', parseError);
          }
        }
      }
    };

    fetchCorporateProfile();
  }, []);

  // Pincode lookup function
  const lookupPincode = async (pincode: string, type: 'origin' | 'destination', preserveArea?: string) => {
    if (!pincode || pincode.length !== 6) return;

    if (type === 'origin') {
      setIsLoadingPincode(true);
    } else {
      setIsLoadingDestinationPincode(true);
    }

    try {
      const response = await fetch(`/api/pincode/${pincode}/simple`);
      if (response.ok) {
        const data = await response.json();

        if (type === 'origin') {
          // Update newAddressData if we're in add address form mode
          if (showAddAddressForm) {
            setNewAddressData(prev => ({
              ...prev,
              state: data.state || '',
              city: data.city || '',
              district: data.district || '',
              area: ''
            }));
          } else {
            // Update bookingData for selected address
          setBookingData(prev => ({
            ...prev,
            originData: {
              ...prev.originData,
              state: data.state || '',
              city: data.city || '',
              district: data.district || '',
              area: ''
            }
          }));
          }
          setAvailableAreas(data.areas || []);
        } else {
          // Preserve area value if provided (from auto-fill) or if it already exists in state
          setBookingData(prev => {
            const areaToPreserve = preserveArea || prev.destinationData.area;
            return {
              ...prev,
              destinationData: {
                ...prev.destinationData,
                state: data.state || '',
                city: data.city || '',
                district: data.district || '',
                area: areaToPreserve || '' // Keep existing area if it exists
              }
            };
          });
          
          // Include preserved area in the areas list if it's not already there
          const areasList = data.areas || [];
          const areaToPreserve = preserveArea || bookingData.destinationData.area;
          if (areaToPreserve && !areasList.includes(areaToPreserve)) {
            setDestinationAreas([areaToPreserve, ...areasList]);
          } else {
            setDestinationAreas(areasList);
          }
        }
      } else {
        toast({
          title: "Pincode Not Found",
          description: "The entered pincode is not serviceable in our database.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error looking up pincode:', error);
      toast({
        title: "Error",
        description: "Failed to lookup pincode. Please try again.",
        variant: "destructive"
      });
    } finally {
      if (type === 'origin') {
        setIsLoadingPincode(false);
      } else {
        setIsLoadingDestinationPincode(false);
      }
    }
  };

  // Handle pincode change
  const handlePincodeChange = (pincode: string, type: 'origin' | 'destination') => {
    const numericPincode = pincode.replace(/\D/g, '').slice(0, 6);

    if (type === 'origin') {
      setBookingData(prev => ({
        ...prev,
        originData: { ...prev.originData, pincode: numericPincode }
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        destinationData: { ...prev.destinationData, pincode: numericPincode }
      }));
    }

    if (numericPincode.length === 6) {
      lookupPincode(numericPincode, type);
    }
  };

  // Handle file upload with compression and validation
  const handleFileUpload = async (files: File[]) => {
    try {
      // Validate files
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
          toast({
            title: "Invalid File",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }
      }

      // Compress images
      const compressedFiles = await Promise.all(
        files.map(file => compressImage(file))
      );

      // Upload to server
      const uploadResult = await uploadFiles(compressedFiles);
      
      if (uploadResult.success) {
        setBookingData(prev => ({
          ...prev,
          shipmentData: {
            ...prev.shipmentData,
            packageImages: [...prev.shipmentData.packageImages, ...compressedFiles],
            uploadedFiles: [...prev.shipmentData.uploadedFiles, ...uploadResult.files]
          }
        }));

        toast({
          title: "Files Uploaded",
          description: `${uploadResult.files.length} file(s) uploaded successfully`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    }
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    // Clean up object URL to prevent memory leaks
    const fileToRemove = bookingData.shipmentData.packageImages[index];
    if (fileToRemove && fileToRemove.type.startsWith('image/')) {
      URL.revokeObjectURL(URL.createObjectURL(fileToRemove));
    }

    setBookingData(prev => ({
      ...prev,
      shipmentData: {
        ...prev.shipmentData,
        packageImages: prev.shipmentData.packageImages.filter((_, i) => i !== index),
        uploadedFiles: prev.shipmentData.uploadedFiles.filter((_, i) => i !== index)
      }
    }));
  };

  // Handle adding new address
  const handleAddNewAddress = () => {
    // Validate new address form
    const newErrors: Record<string, string> = {};
    if (!newAddressData.name) newErrors.newAddressName = 'Name is required';
    if (!newAddressData.email) newErrors.newAddressEmail = 'Email is required';
    // Mobile number is optional, but if provided, validate it
    if (newAddressData.mobileNumber && !validateMobileNumber(newAddressData.mobileNumber)) {
      newErrors.newAddressMobileNumber = 'Please enter a valid 10-digit mobile number';
    }
    if (!newAddressData.pincode) newErrors.newAddressPincode = 'Pincode is required';
    if (newAddressData.pincode.length === 6 && !newAddressData.area) newErrors.newAddressArea = 'Area is required';
    if (!newAddressData.locality) newErrors.newAddressLocality = 'Locality is required';
    if (!newAddressData.flatBuilding) newErrors.newAddressFlatBuilding = 'Flat/Building is required';
    if (newAddressData.gstNumber && newAddressData.gstNumber.length > 0 && newAddressData.gstNumber.length < 15) {
      newErrors.newAddressGstNumber = 'Please complete the 15-digit GST number or leave it empty';
    }
    if (newAddressData.website && newAddressData.website.trim() !== '' && !validateWebsite(newAddressData.website)) {
      newErrors.newAddressWebsite = 'Please enter a valid website URL (e.g., example.com or https://example.com)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Add new address to the list
    const addressId = `address-${Date.now()}`;
    // Use alternateNumber as mobileNumber if mobileNumber is not provided
    const addressData = {
      ...newAddressData,
      mobileNumber: newAddressData.mobileNumber || newAddressData.alternateNumber || ''
    };
    const newAddress = {
      id: addressId,
      ...addressData
    };
    setOriginAddresses(prev => [...prev, newAddress]);
    setSelectedOriginAddressId(addressId);
    
    // Update booking data with selected address
    setBookingData(prev => ({
      ...prev,
      originData: {
        ...prev.originData,
        ...addressData,
        useCurrentAddress: false
      }
    }));

    // Reset form
    setNewAddressData({
      name: '',
      companyName: '',
      email: '',
      mobileNumber: '',
      locality: '',
      flatBuilding: '',
      landmark: '',
      pincode: '',
      area: '',
      city: '',
      district: '',
      state: '',
      gstNumber: '',
      addressType: 'Home',
      website: '',
      anniversary: '',
      birthday: '',
      alternateNumber: ''
    });
    setShowAddAddressForm(false);
    setErrors({});
    
    toast({
      title: "Address Added",
      description: "New address has been added successfully.",
    });
  };

  // Handle address selection via radio
  const handleAddressSelect = (addressId: string) => {
    setSelectedOriginAddressId(addressId);
    // Close the add address form when a saved address is selected
    setShowAddAddressForm(false);
    
    if (addressId === 'default' && corporateInfo) {
      // Use default corporate address
      setBookingData(prev => ({
        ...prev,
        originData: {
          ...prev.originData,
          useCurrentAddress: true,
          name: corporateInfo.companyName || '',
          companyName: corporateInfo.companyName || '',
          email: corporateInfo.email || '',
          mobileNumber: corporateInfo.contactNumber || '',
          pincode: corporateInfo.pin || '',
          city: corporateInfo.city || '',
          state: corporateInfo.state || '',
          locality: corporateInfo.companyAddress || '',
          flatBuilding: corporateInfo.flatNumber || '',
          landmark: corporateInfo.landmark || '',
          area: corporateInfo.locality || '',
          gstNumber: corporateInfo.gstNumber || '',
          addressType: 'Corporate'
        }
      }));
    } else {
      // Use selected alternative address
      const selectedAddress = originAddresses.find(addr => addr.id === addressId);
      if (selectedAddress) {
        setBookingData(prev => ({
          ...prev,
          originData: {
            ...prev.originData,
            useCurrentAddress: false,
            ...selectedAddress
          }
        }));
      }
    }
  };

  // Validation function
  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      // Origin validation - check if address is selected
      if (!selectedOriginAddressId) {
        newErrors.originAddress = 'Please select an address';
      } else if (showAddAddressForm) {
        // Only validate new address form if it's being added
        // If a saved address is selected (selectedOriginAddressId exists), skip form validation
        if (!newAddressData.name) newErrors.newAddressName = 'Name is required';
        if (!newAddressData.email) newErrors.newAddressEmail = 'Email is required';
        // Mobile number is optional, but if provided, validate it
        if (newAddressData.mobileNumber && !validateMobileNumber(newAddressData.mobileNumber)) {
          newErrors.newAddressMobileNumber = 'Please enter a valid 10-digit mobile number';
        }
        if (!newAddressData.pincode) newErrors.newAddressPincode = 'Pincode is required';
        if (newAddressData.pincode.length === 6 && !newAddressData.area) newErrors.newAddressArea = 'Area is required';
        if (!newAddressData.locality) newErrors.newAddressLocality = 'Locality is required';
        if (!newAddressData.flatBuilding) newErrors.newAddressFlatBuilding = 'Flat/Building is required';
        if (newAddressData.gstNumber && newAddressData.gstNumber.length > 0 && newAddressData.gstNumber.length < 15) {
          newErrors.newAddressGstNumber = 'Please complete the 15-digit GST number or leave it empty';
        }
        if (newAddressData.website && newAddressData.website.trim() !== '' && !validateWebsite(newAddressData.website)) {
          newErrors.newAddressWebsite = 'Please enter a valid website URL (e.g., example.com or https://example.com)';
        }
      }
      // If a saved address is selected (selectedOriginAddressId exists and showAddAddressForm is false), validation passes
    } else if (currentStep === 2) {
      // Destination validation
      if (!bookingData.destinationData.name) newErrors.destinationName = 'Name is required';
      if (!bookingData.destinationData.email) newErrors.destinationEmail = 'Email is required';
        if (!bookingData.destinationData.mobileNumber) newErrors.destinationMobileNumber = 'Mobile number is required';
        else if (!validateMobileNumber(bookingData.destinationData.mobileNumber)) newErrors.destinationMobileNumber = 'Please enter a valid 10-digit mobile number';
      if (!bookingData.destinationData.pincode) newErrors.destinationPincode = 'Pincode is required';
        if (bookingData.destinationData.pincode.length === 6 && !bookingData.destinationData.area) newErrors.destinationArea = 'Area is required';
      if (!bookingData.destinationData.locality) newErrors.destinationLocality = 'Locality is required';
      if (!bookingData.destinationData.flatBuilding) newErrors.destinationFlatBuilding = 'Flat/Building is required';
        if (bookingData.destinationData.gstNumber && bookingData.destinationData.gstNumber.length > 0 && bookingData.destinationData.gstNumber.length < 15) {
          newErrors.destinationGstNumber = 'Please complete the 15-digit GST number or leave it empty';
        }
        if (bookingData.destinationData.website && bookingData.destinationData.website.trim() !== '' && !validateWebsite(bookingData.destinationData.website)) {
          newErrors.destinationWebsite = 'Please enter a valid website URL (e.g., example.com or https://example.com)';
        }
    } else if (currentStep === 3) {
      // Shipment validation (package details only)
      if (!bookingData.shipmentData.packagesCount) newErrors.packagesCount = 'No. of Packages is required';
      if (!bookingData.shipmentData.packageType) newErrors.packageType = 'Package Type is required';
      if (bookingData.shipmentData.packageType === 'Others' && !bookingData.shipmentData.others) {
        newErrors.others = 'Please specify the package type';
      }
      if (!bookingData.shipmentData.declaredValue) newErrors.declaredValue = 'Declared Value is required';
      if (!bookingData.shipmentData.actualWeight) newErrors.actualWeight = 'Weight is required';
      if (bookingData.shipmentData.packageImages.length === 0) newErrors.packageImages = 'At least one document is required';
    } else if (currentStep === 4) {
      // Service selection and payment validation
      if (!bookingData.shipmentData.natureOfConsignment) newErrors.natureOfConsignment = 'Nature of consignment is required';
      if (!bookingData.shipmentData.services) newErrors.services = 'Service is required';
      if (bookingData.shipmentData.services === 'Standard' && !bookingData.shipmentData.mode) {
        newErrors.mode = 'Mode is required';
      }
      if (!bookingData.paymentData.paymentType) newErrors.paymentType = 'Payment type is required';
    } else if (currentStep === 5) {
      // Preview step - no validation needed, just review
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  // Handle phone number lookup
  const handlePhoneLookup = async (phone: string) => {
    setIsLookingUpPhone(true);
    try {
      console.log('=== PHONE LOOKUP DEBUG ===');
      console.log('Searching for phone:', phone);

      // Clean the search phone number
      const cleanSearchPhone = phone.replace(/\D/g, '');
      console.log('Clean search phone:', cleanSearchPhone);

      // Get authentication token
      const token = localStorage.getItem('corporateToken');
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication required');
      }

      // Call API to fetch previous destinations
      const response = await fetch(`/api/corporate/destinations/phone/${cleanSearchPhone}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch destinations');
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (result.success && result.data && result.data.length > 0) {
        console.log(`Found ${result.data.length} previous destinations`);
        setPreviousDestinations(result.data);
        setSelectedDestinationIndex(null); // Reset selection when new destinations are loaded
        setCountdown(null); // Clear countdown when destinations are found
        return result.data;
      } else {
        console.log('No previous destinations found');
        setPreviousDestinations([]);
        setCountdown(null); // Clear countdown - no auto-redirect
        
        return [];
      }
    } catch (error) {
      console.error('Error looking up phone number:', error);
      setPreviousDestinations([]);
      
      // Show error toast
      toast({
        title: "Lookup Failed",
        description: "Failed to search for previous destinations. Please try again.",
        variant: "destructive"
      });
      
      return [];
    } finally {
      setIsLookingUpPhone(false);
      console.log('=== END PHONE LOOKUP DEBUG ===');
    }
  };

  // Handle destination selection and auto-fill
  const handleDestinationSelect = async (destination: any) => {
    setSelectedDestination(destination);
    setCountdown(null); // Clear countdown when destination is selected
    setBookingData(prev => ({
      ...prev,
      destinationData: {
        name: destination.name,
        companyName: destination.companyName,
        email: destination.email,
        mobileNumber: destination.mobileNumber,
        locality: destination.locality,
        flatBuilding: destination.flatBuilding,
        landmark: destination.landmark,
        pincode: destination.pincode,
        area: destination.area,
        city: destination.city,
        district: destination.district,
        state: destination.state,
        gstNumber: destination.gstNumber,
        addressType: destination.addressType,
        alternateNumbers: destination.alternateNumbers || [],
        website: destination.website || '',
        anniversary: destination.anniversary || '',
        birthday: destination.birthday || ''
      }
    }));

    // Trigger pincode lookup to populate destinationAreas for the dropdown
    // Pass the area value to preserve it during lookup
    if (destination.pincode && destination.pincode.length === 6) {
      await lookupPincode(destination.pincode, 'destination', destination.area);
    }

    // Close the popup and proceed directly to shipment step (skip destination form)
    setShowPhonePopup(false);
    setCountdown(null); // Clear countdown when popup is closed
    setCurrentStep(3);

    toast({
      title: "Destination Auto-filled",
      description: "Selected destination address has been filled automatically. Proceeding to shipment details.",
    });
  };

  // Handle phone popup submission
  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive"
      });
      return;
    }

    const destinations = await handlePhoneLookup(phoneNumber);

    if (destinations.length > 0) {
      // Destinations found - modal will show selection options
      // User will select from the modal and click "Done"
    } else {
      // No previous data found, go to destination step for manual entry
      toast({
        title: "No Previous Data Found",
        description: "No previous destinations found for this phone number. Please enter manually.",
      });

      setShowPhonePopup(false);
      setCountdown(null); // Clear countdown when popup is closed
      setCurrentStep(2); // Go to destination step
    }
  };

  // Handle next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep === 1) {
        // After origin, show phone popup
        setShowPhonePopup(true);
      } else {
        setCurrentStep(prev => Math.min(prev + 1, 5)); // Allow going to step 5 (Preview)
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    // Check if consignments are available before proceeding
    if (consignmentCheck.hasAssignment && consignmentCheck.summary?.availableCount === 0) {
      setShowConsignmentFinishedPopup(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('corporateToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare booking data for API with calculated weights
      const bookingPayload = {
        originData: bookingData.originData,
        destinationData: bookingData.destinationData,
        shipmentData: {
          ...bookingData.shipmentData,
          volumetricWeight: volumetricWeight, // Include calculated volumetric weight
          chargeableWeight: chargeableWeight, // Include calculated chargeable weight
          uploadedFiles: bookingData.shipmentData.uploadedFiles // Include uploaded file references
        },
        invoiceData: {
          ...bookingData.invoiceData,
          chargeableWeight: chargeableWeight // Ensure chargeable weight is in invoice data too
        },
        paymentData: bookingData.paymentData, // Include payment data with paymentType
        bookingDate: new Date().toISOString(),
        status: 'booked',
        paymentStatus: 'unpaid'
      };

      // Log payload for debugging
      console.log('📤 Sending booking payload:', {
        hasOriginData: !!bookingPayload.originData,
        hasDestinationData: !!bookingPayload.destinationData,
        hasShipmentData: !!bookingPayload.shipmentData,
        hasInvoiceData: !!bookingPayload.invoiceData,
        hasPaymentData: !!bookingPayload.paymentData,
        originName: bookingPayload.originData?.name,
        destinationName: bookingPayload.destinationData?.name
      });

      try {
        const response = await fetch('/api/corporate/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingPayload)
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Server returned an invalid response. Please try again.');
        }

        if (!response.ok) {
          const errorData = await response.json();
          // Check if it's a consignment finished error
          if (errorData.error && errorData.error.includes('All consignment numbers have been used')) {
            setShowConsignmentFinishedPopup(true);
            return;
          }
          throw new Error(errorData.error || errorData.message || 'Failed to submit booking');
        }

        const result = await response.json();

        // Validate response
        if (!result.success) {
          throw new Error(result.error || result.message || 'Booking submission failed');
        }

        if (!result.consignmentNumber) {
          console.error('Response missing consignmentNumber:', result);
          throw new Error('Server response missing consignment number');
        }

        console.log('✅ Booking submitted successfully:', {
          bookingReference: result.bookingReference,
          consignmentNumber: result.consignmentNumber,
          success: result.success
        });

        toast({
          title: "Booking Submitted",
          description: `Your shipment has been booked successfully! Consignment Number: ${result.consignmentNumber}`,
        });

        // Dispatch event to notify other components about consignment usage update
        const corporateId = localStorage.getItem('corporateId');
        if (corporateId) {
          const event = new CustomEvent('consignmentUsageUpdated', {
            detail: {
              corporateId: corporateId,
              assignmentType: 'corporate',
              consignmentNumber: result.consignmentNumber,
              bookingReference: result.bookingReference || result.consignmentNumber
            }
          });
          window.dispatchEvent(event);
          console.log('Dispatched consignmentUsageUpdated event for corporate:', corporateId);
        }

        // Set completion state
        setIsBookingComplete(true);
        setBookingReference(result.bookingReference || result.consignmentNumber || `OCL-${Date.now().toString().slice(-8)}`);

      } catch (apiError) {
        // Log the actual error for debugging
        console.error('API Error when submitting booking:', apiError);
        console.error('Error details:', {
          message: apiError instanceof Error ? apiError.message : String(apiError),
          stack: apiError instanceof Error ? apiError.stack : undefined
        });
        
        // Show error to user instead of silently falling back to localStorage
        throw new Error(apiError instanceof Error ? apiError.message : 'Failed to submit booking to server. Please check your connection and try again.');
      }

    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle new booking
  const handleNewBooking = () => {
    setIsBookingComplete(false);
      setCurrentStep(1);
    setBookingReference('');
      setBookingData({
        originData: {
          useCurrentAddress: true,
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
        addressType: 'Corporate',
        birthday: '',
        anniversary: '',
        otherAlternateNumber: '',
        showOtherAlternateNumber: false,
        website: ''
        },
        destinationData: {
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
        website: '',
        anniversary: '',
        birthday: ''
        },
        shipmentData: {
        natureOfConsignment: '',
        services: '',
        mode: '',
        insurance: 'Without insurance',
        riskCoverage: 'Owner',
        packagesCount: '',
        packageType: '',
        others: '',
        contentDescription: '',
        declaredValue: '',
        dimensions: [{ length: '', breadth: '', height: '', unit: 'cm' }],
        actualWeight: '',
        volumetricWeight: 0,
        chargeableWeight: 0,
        totalPackages: '',
        materials: '',
        packageImages: [],
        uploadedFiles: [],
          description: '',
        specialInstructions: ''
        },
        invoiceData: {
          billingAddress: '',
        paymentMethod: 'Corporate Credit',
        terms: '',
        calculatedPrice: 0,
        gst: 0,
        finalPrice: 0,
        serviceType: '',
        location: '',
        transportMode: '',
        chargeableWeight: 0
      },
      paymentData: {
        paymentType: '' as 'FP' | 'TP' | '' // No default - user must select
      }
    });
  };

  // Handle track progress
  const handleTrackProgress = () => {
    // Navigate to tracking page or open tracking modal
      toast({
      title: "Track Progress",
      description: `Tracking reference: ${bookingReference}`,
      });
  };

  const handleCopyConsignment = async () => {
    if (!bookingReference) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(bookingReference);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = bookingReference;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      toast({
        title: "Copied",
        description: "Consignment number copied to clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy consignment number:', error);
      toast({
        title: "Copy failed",
        description: "Unable to copy the consignment number. Please copy it manually.",
        variant: "destructive",
      });
    }
  };

  const steps = [
    { number: 1, title: 'Company', icon: <MapPin className="h-5 w-5" /> },
    { number: 2, title: 'Receiver', icon: <Truck className="h-5 w-5" /> },
    { number: 3, title: 'Shipment', icon: <Package className="h-5 w-5" /> }
  ];

  // Show completion overview if booking is complete
  if (isBookingComplete) {
    return (
      <div className={cn(
        "min-h-screen flex items-start justify-center p-3 sm:p-4",
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50"
      )} style={{ fontFamily: '"Value Serif Pro Regular", serif' }}>
        <div className="max-w-md w-full mt-6 sm:mt-8">
          {/* Success Card */}
          <Card className={cn(
            "border-0 shadow-2xl backdrop-blur-sm",
            isDarkMode
              ? "bg-gradient-to-br from-slate-800 via-slate-800/90 to-slate-900"
              : "bg-gradient-to-br from-white via-slate-50/50 to-green-50/30"
          )}>
            <CardContent className="p-4 sm:p-6 md:p-8 text-center">
              {/* Success Icon */}
              <div className="mb-6">
                <div className={cn(
                  "mx-auto w-20 h-20 rounded-full flex items-center justify-center shadow-lg",
                  isDarkMode
                    ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30"
                    : "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30"
                )}>
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
              </div>

              {/* Success Message */}
              <div className="mb-4 sm:mb-6 md:mb-8">
                <h1 className={cn("text-2xl sm:text-3xl font-bold mb-2", isDarkMode ? "text-slate-100" : "text-slate-800")}>Booking Successful!</h1>
              </div>

              {/* Booking Confirmed Section */}
              <div className="mb-4 sm:mb-6 md:mb-8">
                <div className={cn(
                  "rounded-xl p-4 sm:p-5 md:p-6 border transition-all duration-200",
                  isDarkMode
                    ? "bg-gradient-to-br from-green-900/30 via-emerald-900/20 to-green-900/30 border-green-700/60"
                    : "bg-gradient-to-br from-green-50/90 via-emerald-50/70 to-green-50/90 border-green-200/60"
                )} style={!isDarkMode ? { boxShadow: 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px' } : {}}>
                  <div className={cn(
                    "backdrop-blur-sm rounded-lg p-3 sm:p-4 border shadow-sm",
                    isDarkMode
                      ? "bg-slate-800/80 border-green-700/50"
                      : "bg-white/80 border-green-200/50"
                  )}>
                    <p className={cn("text-xs sm:text-sm mb-2", isDarkMode ? "text-slate-300" : "text-slate-600")}>Consignment No. : </p>
                    <div className="relative">
                      <p className={cn(
                        "text-xl sm:text-2xl font-bold font-mono break-all text-center pr-8",
                        isDarkMode ? "text-green-400" : "text-green-700"
                      )}>{bookingReference}</p>
                      <button
                        type="button"
                        onClick={handleCopyConsignment}
                        className={cn(
                          "absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full p-2 transition-all duration-200",
                          isDarkMode
                            ? "bg-slate-800/80 text-green-300 hover:bg-slate-700"
                            : "bg-white text-green-600 hover:bg-green-50"
                        )}
                        aria-label="Copy consignment number"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className={cn("text-xs mt-3", isDarkMode ? "text-green-400" : "text-green-600")}>
                    📱 Please save this Consignment No. for tracking your shipment
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleNewBooking}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 h-12 text-lg font-semibold"
              >
                Create New Booking
                <Plus className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ fontFamily: '"Value Serif Pro Regular", serif' }}>
      <div className="w-full lg:max-w-[50%] mx-auto px-0 sm:px-0 md:px-0 pt-8 sm:pt-12 md:pt-16 lg:pt-20">
        {/* Available Consignment - Center aligned */}
        {currentStep === 1 && consignmentCheck.hasAssignment && consignmentCheck.summary && (
          <div className="w-full py-2 sm:py-3 md:py-4">
            <div className="flex justify-center">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className={cn("text-sm sm:text-base font-medium", isDarkMode ? "text-slate-300" : "text-slate-600")} style={isDarkMode ? {fontSize: '14px', color: '#cbd5e1'} : {fontSize: '14px', color: 'black'}}>Available Consignment Notes :</span>
                <span className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-sm sm:text-base font-semibold text-white bg-green-600 rounded-full">{consignmentCheck.summary.availableCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          {/* Disable form if no consignment assignment */}
          {!consignmentCheck.hasAssignment ? (
          <div className={cn(
            "rounded-2xl border p-6 sm:p-8 text-center",
            isDarkMode
              ? "border-slate-800/60 bg-slate-900/60"
              : "border-slate-200/70 bg-slate-50/50"
          )}>
              <div className={cn("p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-sm", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
                <Package className={cn("h-8 w-8", isDarkMode ? "text-slate-400" : "text-slate-400")} />
              </div>
            <h3 className={cn("text-lg font-semibold mb-2", isDarkMode ? "text-slate-200" : "text-slate-600")}>Booking Not Available</h3>
              <p className={cn(isDarkMode ? "text-slate-400" : "text-slate-500")}>Please contact your admin to get consignment numbers assigned before making bookings.</p>
            </div>
          ) : (
            <>
              {/* Step 1: Origin */}
              {currentStep === 1 && (
              <div className={cn(
                'rounded-xl sm:rounded-2xl border p-4 sm:p-5 transition-all duration-300',
                isDarkMode
                  ? 'border-slate-800/70 bg-slate-900/70 shadow-[0_18px_40px_rgba(15,23,42,0.35)]'
                  : 'border-slate-200/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]'
              )}>
                <div className="space-y-4">
                  {/* Title Section */}
                <div>
                  <h3 className={cn(
                    "text-base font-semibold mb-3",
                    isDarkMode ? "text-slate-100" : "text-slate-900"
                  )}>
                    Select Sender Add:
                  </h3>
                  </div>

                  {/* Address Selection with Radio Buttons */}
                  <div className="space-y-3">
                    {/* Default Corporate Address - Radio Option */}
                    {corporateInfo && (
                      <div 
                        className={cn(
                          "rounded-lg p-4 cursor-pointer",
                          isDarkMode
                            ? 'bg-blue-500/10'
                            : 'bg-blue-50'
                        )}
                        onClick={() => handleAddressSelect('default')}
                      >
                        <div className="flex items-start gap-3">
                          {/* Radio Button */}
                          <div className="mt-0.5 flex-shrink-0">
                                <div className={cn(
                              'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                                  selectedOriginAddressId === 'default'
                                ? isDarkMode ? 'border-blue-400 bg-blue-400' : 'border-blue-500 bg-blue-500'
                                    : isDarkMode ? 'border-slate-600' : 'border-gray-300'
                                )}>
                                  {selectedOriginAddressId === 'default' && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                                  )}
                                </div>
                              </div>
                              
                          {/* Address Content */}
                          <div className="flex-1 min-w-0">
                            {/* Company Name */}
                                  <h4 className={cn(
                              'text-sm font-semibold mb-1',
                                    isDarkMode ? 'text-slate-100' : 'text-slate-900'
                                  )}>
                                    {corporateInfo.companyName || 'Company Name'}
                                  </h4>
                            
                            {/* Concern Person Name */}
                            {bookingData.originData.name && (
                              <p className={cn("text-xs mb-1", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                                {bookingData.originData.name}
                                  </p>
                                )}
                            
                            {/* Address */}
                            <div className="flex items-start gap-1.5 mb-1">
                              <MapPin className={cn("h-3.5 w-3.5 flex-shrink-0 mt-0.5", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                              <span className={cn("text-xs leading-relaxed", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                      {corporateInfo.flatNumber && `${corporateInfo.flatNumber}, `}
                                      {corporateInfo.companyAddress || ''}
                                {corporateInfo.locality && `, ${corporateInfo.locality}`}
                                {corporateInfo.area && `, ${corporateInfo.area}`}
                                {corporateInfo.city && `, ${corporateInfo.city}`}
                                {corporateInfo.district && `, ${corporateInfo.district}`}
                                {corporateInfo.state && `, ${corporateInfo.state}`}
                                {corporateInfo.pin && ` ${corporateInfo.pin}`}
                              </span>
                            </div>
                            
                            {/* Phone, Email, and GST - Same Line */}
                            {(corporateInfo.contactNumber || corporateInfo.email || corporateInfo.gstNumber) && (
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                {corporateInfo.contactNumber && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone className={cn("h-3.5 w-3.5 flex-shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                                    <span className={cn("text-xs", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                      +91 {corporateInfo.contactNumber}
                                    </span>
                                  </div>
                                )}
                                {corporateInfo.email && (
                                  <div className="flex items-center gap-1.5">
                                    <Mail className={cn("h-3.5 w-3.5 flex-shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                                    <span className={cn("text-xs", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                      {corporateInfo.email}
                                    </span>
                                  </div>
                                )}
                                {corporateInfo.gstNumber && (
                                  <div className="flex items-center gap-1.5">
                                    <Building className={cn("h-3.5 w-3.5 flex-shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                                    <span className={cn("text-xs", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                      {corporateInfo.gstNumber}
                                    </span>
                                  </div>
                                )}
                                  </div>
                                )}
                                
                                {/* Website */}
                                {corporateInfo.website && (
                              <div className="flex items-center gap-1.5">
                                <Globe className={cn("h-3.5 w-3.5 flex-shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                                    <a 
                                      href={corporateInfo.website.startsWith('http') ? corporateInfo.website : `https://${corporateInfo.website}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                    'text-xs underline',
                                        isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                      )}
                                  onClick={(e) => e.stopPropagation()}
                                    >
                                      {corporateInfo.website}
                                    </a>
                                  </div>
                                )}
                              </div>
                          
                          {/* Address Type Badge */}
                          <Badge className={cn(
                            "text-[10px] font-medium px-2 py-0.5 h-fit flex-shrink-0 rounded-none",
                            "bg-white text-black border-0 hover:bg-white hover:text-black"
                          )}>
                            {(corporateInfo.addressType || 'CORPORATE').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Alternative Addresses - Radio Options */}
                    {originAddresses.map((address) => (
                      <div
                        key={address.id}
                        className={cn(
                          "rounded-lg p-4 cursor-pointer",
                          isDarkMode
                            ? 'bg-blue-500/10'
                            : 'bg-blue-50'
                        )}
                        onClick={() => handleAddressSelect(address.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Radio Button */}
                          <div className="mt-0.5 flex-shrink-0">
                                <div className={cn(
                              'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                                  selectedOriginAddressId === address.id
                                ? isDarkMode ? 'border-blue-400 bg-blue-400' : 'border-blue-500 bg-blue-500'
                                    : isDarkMode ? 'border-slate-600' : 'border-gray-300'
                                )}>
                                  {selectedOriginAddressId === address.id && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                                  )}
                                </div>
                              </div>
                              
                          {/* Address Content */}
                          <div className="flex-1 min-w-0">
                            {/* Company Name */}
                            {address.companyName ? (
                                  <h4 className={cn(
                                'text-sm font-semibold mb-1',
                                isDarkMode ? 'text-slate-100' : 'text-slate-900'
                              )}>
                                {address.companyName}
                              </h4>
                            ) : (
                              <h4 className={cn(
                                'text-sm font-semibold mb-1',
                                    isDarkMode ? 'text-slate-100' : 'text-slate-900'
                                  )}>
                                    {address.name || 'Address'}
                                  </h4>
                            )}
                            
                            {/* Concern Person Name */}
                            {address.companyName && address.name && (
                              <p className={cn("text-xs mb-1", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                                {address.name}
                                  </p>
                                )}
                            
                            {/* Address */}
                            <div className="flex items-start gap-1.5 mb-1">
                              <MapPin className={cn("h-3.5 w-3.5 flex-shrink-0 mt-0.5", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                              <span className={cn("text-xs leading-relaxed", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                      {address.flatBuilding}
                                {address.locality && `, ${address.locality}`}
                                {address.area && `, ${address.area}`}
                                {address.city && `, ${address.city}`}
                                {address.district && `, ${address.district}`}
                                {address.state && `, ${address.state}`}
                                {address.pincode && ` ${address.pincode}`}
                              </span>
                            </div>
                            
                            {/* Phone, Email, and GST - Same Line */}
                            {(address.mobileNumber || address.email || address.gstNumber) && (
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                {address.mobileNumber && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone className={cn("h-3.5 w-3.5 flex-shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                                    <span className={cn("text-xs", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                      +91 {address.mobileNumber}
                                    </span>
                                  </div>
                                )}
                                {address.email && (
                                  <div className="flex items-center gap-1.5">
                                    <Mail className={cn("h-3.5 w-3.5 flex-shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                                    <span className={cn("text-xs", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                      {address.email}
                                    </span>
                                  </div>
                                )}
                                {address.gstNumber && (
                                  <div className="flex items-center gap-1.5">
                                    <Building className={cn("h-3.5 w-3.5 flex-shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                                    <span className={cn("text-xs", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                      {address.gstNumber}
                                    </span>
                                  </div>
                                )}
                                  </div>
                                )}
                                
                                {/* Website */}
                                {address.website && (
                              <div className="flex items-center gap-1.5">
                                <Globe className={cn("h-3.5 w-3.5 flex-shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                                    <a 
                                      href={address.website.startsWith('http') ? address.website : `https://${address.website}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                    'text-xs underline',
                                        isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                      )}
                                  onClick={(e) => e.stopPropagation()}
                                    >
                                      {address.website}
                                    </a>
                                  </div>
                                )}
                              </div>
                          
                          {/* Address Type Badge */}
                          <Badge className={cn(
                            "text-[10px] font-medium px-2 py-0.5 h-fit flex-shrink-0",
                            isDarkMode
                              ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          )}>
                            {(address.addressType || 'HOME').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {/* Add Another Address Button */}
                    {!showAddAddressForm && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                        onClick={() => {
                          setShowAddAddressForm(true);
                          setSelectedOriginAddressId(''); // Clear selection when adding new
                        }}
                        className={cn(
                          "w-full text-xs h-9 border-0",
                          isDarkMode
                            ? "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
                            : "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
                        )}
                      >
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Add Another Address
                    </Button>
                    )}

                    {/* Address Selection Error */}
                    {errors.originAddress && (
                      <p className={cn("text-xs mt-2", isDarkMode ? "text-red-400" : "text-red-600")}>{errors.originAddress}</p>
                    )}
                  </div>

                {/* Add New Address Form - Only show when showAddAddressForm is true */}
                {showAddAddressForm && (
                  <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <MapPin className={cn("h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0", isDarkMode ? "text-blue-400" : "text-blue-600")} />
                      <h4 className={cn("text-sm sm:text-base font-semibold", isDarkMode ? "text-blue-300" : "text-blue-800")}>
                              Enter New Address 
                            </h4>
                          </div>
                    {/* Row 1: Concern Name* + Company Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FloatingLabelInput
                        id="newAddressName"
                        value={newAddressData.name}
                        onChange={(value) => setNewAddressData(prev => ({ ...prev, name: value }))}
                        placeholder="Concern Name"
                        icon={<User className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={errors.newAddressName}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <FloatingLabelInput
                        id="newAddressCompany"
                        value={newAddressData.companyName}
                        onChange={(value) => setNewAddressData(prev => ({ ...prev, companyName: value }))}
                        placeholder="Company Name"
                        icon={<Building className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {/* Row 2: Locality / Street* + Building / Flat No.* */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FloatingLabelInput
                        id="newAddressLocality"
                        value={newAddressData.locality}
                        onChange={(value) => setNewAddressData(prev => ({ ...prev, locality: value }))}
                        placeholder="Locality / Street"
                        icon={<Navigation className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={errors.newAddressLocality}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <FloatingLabelInput
                        id="newAddressFlatBuilding"
                        value={newAddressData.flatBuilding}
                        onChange={(value) => setNewAddressData(prev => ({ ...prev, flatBuilding: value }))}
                        isDarkMode={isDarkMode}
                        placeholder="Building / Flat No."
                        icon={<Building className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={errors.newAddressFlatBuilding}
                        required
                      />
                    </div>

                    {/* Row 3: Landmark + GST */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FloatingLabelInput
                        id="newAddressLandmark"
                        value={newAddressData.landmark}
                        onChange={(value) => setNewAddressData(prev => ({ ...prev, landmark: value }))}
                        placeholder="Landmark"
                        icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingLabelInput
                        id="newAddressGstNumber"
                        value={newAddressData.gstNumber}
                        onChange={(value) => {
                          const formattedGST = validateGSTFormat(value);
                          setNewAddressData(prev => ({ ...prev, gstNumber: formattedGST }));
                        }}
                        placeholder="GST"
                        maxLength={15}
                        icon={<Building className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={errors.newAddressGstNumber}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {/* Row 4: PINCode* + State */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <FloatingLabelInput
                      id="newAddressPincode"
                      value={newAddressData.pincode}
                      onChange={(value) => {
                        const numericPincode = value.replace(/\D/g, '').slice(0, 6);
                        setNewAddressData(prev => ({ ...prev, pincode: numericPincode }));
                        if (numericPincode.length === 6) {
                          lookupPincode(numericPincode, 'origin');
                        }
                      }}
                        placeholder="PINCode"
                      maxLength={6}
                      icon={isLoadingPincode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />
                      )}
                      error={errors.newAddressPincode}
                      required
                      isDarkMode={isDarkMode}
                    />
                      <FloatingLabelInput
                        id="newAddressState"
                        value={newAddressData.state}
                        onChange={(value) => setNewAddressData(prev => ({ ...prev, state: value }))}
                        placeholder="State"
                        icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {newAddressData.pincode.length === 6 && (
                      <div>
                        <FloatingSelect
                          label="Area"
                          value={newAddressData.area}
                          onChange={(value) => setNewAddressData(prev => ({ ...prev, area: value }))}
                          options={availableAreas.length > 0 ? availableAreas : ['This pincode is not serviceable']}
                          required
                          disabled={availableAreas.length === 0}
                          icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                          isDarkMode={isDarkMode}
                        />
                        {errors.newAddressArea && (
                          <p className={cn("text-sm mt-1", isDarkMode ? "text-red-400" : "text-red-600")}>{errors.newAddressArea}</p>
                        )}
                      </div>
                    )}

                    {/* Row 5: City + Email* */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FloatingLabelInput
                        id="newAddressCity"
                        value={newAddressData.city}
                        onChange={(value) => setNewAddressData(prev => ({ ...prev, city: value }))}
                        placeholder="City"
                        icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingLabelInput
                        id="newAddressEmail"
                        value={newAddressData.email}
                        onChange={(value) => setNewAddressData(prev => ({ ...prev, email: value }))}
                        placeholder="Email"
                        type="email"
                        icon={<Mail className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={errors.newAddressEmail}
                        required
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {/* Row 6: Website (Optional) + Anniversary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FloatingLabelInput
                        id="newAddressWebsite"
                        value={newAddressData.website}
                        onChange={(value) => {
                          setNewAddressData(prev => ({ ...prev, website: value }));
                          // Validate website in real-time
                          if (value.trim() !== '' && !validateWebsite(value)) {
                            setNewAddressWebsiteError(true);
                          } else {
                            setNewAddressWebsiteError(false);
                          }
                        }}
                        placeholder="Website (Optional)"
                        icon={<Globe className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={errors.newAddressWebsite || (newAddressWebsiteError ? 'Please enter a valid website URL (e.g., example.com or https://example.com)' : '')}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingLabelInput
                        id="newAddressAnniversary"
                        value={newAddressData.anniversary}
                        onChange={(value) => setNewAddressData(prev => ({ ...prev, anniversary: value }))}
                        placeholder="Anniversary"
                        type="date"
                        inputPlaceholder="dd-mm-yyyy"
                        icon={<Calendar className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {/* Row 7: Birthday + Alternate Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FloatingLabelInput
                        id="newAddressBirthday"
                        value={newAddressData.birthday}
                        onChange={(value) => setNewAddressData(prev => ({ ...prev, birthday: value }))}
                        placeholder="Birthday"
                        type="date"
                        inputPlaceholder="dd-mm-yyyy"
                        icon={<Calendar className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingLabelInput
                        id="newAddressAlternateNumber"
                        value={newAddressData.alternateNumber}
                        onChange={(value) => {
                          const cleanValue = value.replace(/\D/g, '').slice(0, 10);
                          setNewAddressData(prev => ({ ...prev, alternateNumber: cleanValue }));
                        }}
                        placeholder="Alternate Number"
                        type="tel"
                        maxLength={10}
                        icon={<Phone className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className={cn("text-sm font-medium", isDarkMode ? "text-slate-200" : "text-gray-900")}>
                        Address Type :
                      </Label>
                      <div className="flex flex-wrap gap-6 sm:gap-8">
                        {['Corporate', 'Home', 'Office', 'Warehouse'].map((type) => (
                          <div key={type} className="flex items-center space-x-2.5">
                            <input
                              type="radio"
                              id={`newAddressType-${type}`}
                              name="newAddressType"
                              value={type}
                              checked={newAddressData.addressType === type}
                              onChange={(e) => setNewAddressData(prev => ({ ...prev, addressType: e.target.value }))}
                              className="sr-only"
                            />
                            <Label
                              htmlFor={`newAddressType-${type}`}
                              className={cn(
                                "flex items-center cursor-pointer",
                                isDarkMode ? "text-slate-300" : "text-gray-700"
                              )}
                            >
                              <span className={cn(
                                "inline-block rounded-full border-2 mr-1.5 transition-all",
                                newAddressData.addressType === type
                                  ? isDarkMode
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-blue-600 bg-blue-600"
                                  : isDarkMode
                                    ? "border-slate-500 bg-transparent"
                                    : "border-gray-400 bg-transparent",
                                "w-3.5 h-3.5"
                              )}>
                                {newAddressData.addressType === type && (
                                  <span className={cn(
                                    "block rounded-full",
                                    isDarkMode ? "bg-white" : "bg-white",
                                    "w-2 h-2 m-0.5"
                                  )} />
                                )}
                              </span>
                              <span className="text-sm font-normal">{type}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submit and Cancel Buttons for New Address */}
                    <div className="flex gap-3 sm:gap-4 pt-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddAddressForm(false);
                          setNewAddressData({
                            name: '',
                            companyName: '',
                            email: '',
                            mobileNumber: '',
                            locality: '',
                            flatBuilding: '',
                            landmark: '',
                            pincode: '',
                            area: '',
                            city: '',
                            district: '',
                            state: '',
                            gstNumber: '',
                            addressType: 'Home',
                            website: '',
                            anniversary: '',
                            birthday: '',
                            alternateNumber: ''
                          });
                          setErrors({});
                          // Restore previous selection
                          if (corporateInfo && originAddresses.length === 0) {
                            setSelectedOriginAddressId('default');
                            handleAddressSelect('default');
                          } else if (originAddresses.length > 0) {
                            setSelectedOriginAddressId(originAddresses[0].id);
                            handleAddressSelect(originAddresses[0].id);
                          }
                        }}
                        className={cn(
                          "px-4 py-2 border",
                          isDarkMode 
                            ? "border-blue-500/30 text-blue-300 bg-transparent" 
                            : "border-blue-300/30 text-blue-700 bg-transparent"
                        )}
                        style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddNewAddress}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200"
                        style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
                      >
                        Add Address
                      </Button>
                    </div>
                  </div>
                )}
                </div>
              </div>
              )}

              {/* Step 2: Destination */}
              {currentStep === 2 && (
              <div className={cn(
                'rounded-xl sm:rounded-2xl border p-4 sm:p-5 transition-all duration-300',
                isDarkMode
                  ? 'border-slate-800/70 bg-slate-900/70 shadow-[0_18px_40px_rgba(15,23,42,0.35)]'
                  : 'border-slate-200/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]'
              )}>
                <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <MapPin className={cn("h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0", isDarkMode ? "text-blue-400" : "text-blue-600")} />
                  <h3 className={cn(
                    "text-sm sm:text-base font-semibold",
                    isDarkMode ? "text-blue-300" : "text-blue-800"
                  )}>
                    Receiver Address
                  </h3>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {/* Row 1: Concern Name* + Company Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FloatingLabelInput
                        id="destinationName"
                        value={bookingData.destinationData.name}
                        onChange={(value) => setBookingData(prev => ({
                          ...prev,
                          destinationData: { ...prev.destinationData, name: value }
                        }))}
                        placeholder="Concern Name"
                        icon={<User className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={errors.destinationName}
                        required
                        isDarkMode={isDarkMode}
                      />
                      <FloatingLabelInput
                        id="destinationCompany"
                        value={bookingData.destinationData.companyName}
                        onChange={(value) => setBookingData(prev => ({
                          ...prev,
                          destinationData: { ...prev.destinationData, companyName: value }
                        }))}
                        placeholder="Company Name"
                        icon={<Building className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {/* Row 2: Locality / Street* + Building / Flat No.* */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FloatingLabelInput
                        id="destinationLocality"
                        value={bookingData.destinationData.locality}
                        onChange={(value) => setBookingData(prev => ({
                          ...prev,
                          destinationData: { ...prev.destinationData, locality: value }
                        }))}
                        placeholder="Locality / Street"
                        isDarkMode={isDarkMode}
                        icon={<Navigation className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={errors.destinationLocality}
                        required
                      />
                      <FloatingLabelInput
                        id="destinationFlatBuilding"
                        value={bookingData.destinationData.flatBuilding}
                        onChange={(value) => setBookingData(prev => ({
                          ...prev,
                          destinationData: { ...prev.destinationData, flatBuilding: value }
                        }))}
                        placeholder="Building / Flat No."
                        icon={<Building className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={errors.destinationFlatBuilding}
                        required
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {/* Row 3: Landmark + GST */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FloatingLabelInput
                        id="destinationLandmark"
                        value={bookingData.destinationData.landmark}
                        onChange={(value) => setBookingData(prev => ({
                          ...prev,
                          destinationData: { ...prev.destinationData, landmark: value }
                        }))}
                        placeholder="Landmark"
                        icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingLabelInput
                        id="destinationGstNumber"
                        value={bookingData.destinationData.gstNumber}
                        onChange={(value) => {
                          const formattedGST = validateGSTFormat(value);
                          setBookingData(prev => ({
                            ...prev,
                            destinationData: { ...prev.destinationData, gstNumber: formattedGST }
                          }));
                          // Validate GST: if partially filled (1-14 chars), show error
                          if (formattedGST.length > 0 && formattedGST.length < 15) {
                            setDestinationGstError(true);
                          } else {
                            setDestinationGstError(false);
                          }
                        }}
                        placeholder="GST"
                        maxLength={15}
                        icon={<Building className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={destinationGstError ? 'Please complete the 15-digit GST number or leave it empty' : ''}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {/* Row 4: PINCode* + State */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <FloatingLabelInput
                      id="destinationPincode"
                      value={bookingData.destinationData.pincode}
                      onChange={(value) => handlePincodeChange(value, 'destination')}
                        placeholder="PINCode"
                      maxLength={6}
                      icon={isLoadingDestinationPincode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />
                      )}
                      error={errors.destinationPincode}
                      required
                      isDarkMode={isDarkMode}
                    />
                      <FloatingLabelInput
                        id="destinationState"
                        value={bookingData.destinationData.state}
                        onChange={(value) => setBookingData(prev => ({
                          ...prev,
                          destinationData: { ...prev.destinationData, state: value }
                        }))}
                        placeholder="State"
                        icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {bookingData.destinationData.pincode.length === 6 && (
                      <div>
                        <FloatingSelect
                          label="Area"
                          value={bookingData.destinationData.area}
                          onChange={(value) => setBookingData(prev => ({
                            ...prev,
                            destinationData: { ...prev.destinationData, area: value }
                          }))}
                          options={
                            (() => {
                              const currentArea = bookingData.destinationData.area;
                              if (destinationAreas.length > 0) {
                                // Include current area in the list if it's not already there
                                if (currentArea && !destinationAreas.includes(currentArea)) {
                                  return [currentArea, ...destinationAreas];
                                }
                                return destinationAreas;
                              } else if (currentArea) {
                                // If no areas from API but we have a current area, show it
                                return [currentArea];
                              } else {
                                return ['This pincode is not serviceable'];
                              }
                            })()
                          }
                          required
                          disabled={destinationAreas.length === 0 && !bookingData.destinationData.area}
                          icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                          isDarkMode={isDarkMode}
                        />
                        {errors.destinationArea && (
                          <p className={cn("text-sm mt-1", isDarkMode ? "text-red-400" : "text-red-600")}>{errors.destinationArea}</p>
                        )}
                      </div>
                    )}

                    {/* Row 5: City + Email* */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FloatingLabelInput
                        id="destinationCity"
                        value={bookingData.destinationData.city}
                        onChange={(value) => setBookingData(prev => ({
                          ...prev,
                          destinationData: { ...prev.destinationData, city: value }
                        }))}
                        placeholder="City"
                        icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingLabelInput
                        id="destinationEmail"
                        value={bookingData.destinationData.email}
                        onChange={(value) => setBookingData(prev => ({
                          ...prev,
                          destinationData: { ...prev.destinationData, email: value }
                        }))}
                        placeholder="Email"
                        type="email"
                        icon={<Mail className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={errors.destinationEmail}
                        required
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {/* Row 6: Website (Optional) + Mobile Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FloatingLabelInput
                        id="destinationWebsite"
                        value={bookingData.destinationData.website}
                        onChange={(value) => {
                          setBookingData(prev => ({
                          ...prev,
                          destinationData: { ...prev.destinationData, website: value }
                          }));
                          // Validate website in real-time
                          if (value.trim() !== '' && !validateWebsite(value)) {
                            setDestinationWebsiteError(true);
                          } else {
                            setDestinationWebsiteError(false);
                          }
                        }}
                        placeholder="Website (Optional)"
                        icon={<Globe className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={errors.destinationWebsite || (destinationWebsiteError ? 'Please enter a valid website URL (e.g., example.com or https://example.com)' : '')}
                        isDarkMode={isDarkMode}
                      />
                      <FloatingLabelInput
                        id="destinationMobileNumber"
                        value={bookingData.destinationData.mobileNumber}
                        onChange={(value) => {
                          const cleanValue = value.replace(/\D/g, '').slice(0, 10);
                          setBookingData(prev => ({
                            ...prev,
                            destinationData: { ...prev.destinationData, mobileNumber: cleanValue }
                          }));
                          // Clear error when 10 digits are entered
                          if (cleanValue.length === 10) {
                            setDestinationMobileError(false);
                          }
                        }}
                        placeholder="Mobile Number"
                        type="tel"
                        maxLength={10}
                        icon={<Phone className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                        error={errors.destinationMobileNumber}
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className={cn("text-sm font-medium", isDarkMode ? "text-slate-200" : "text-gray-900")}>
                        Address Type
                      </Label>
                      <div className="flex flex-wrap gap-6 sm:gap-8">
                        {['Home', 'Office', 'Warehouse', 'Others'].map((type) => (
                          <div key={type} className="flex items-center space-x-2.5">
                            <input
                              type="radio"
                              id={`destinationAddressType-${type}`}
                              name="destinationAddressType"
                              value={type}
                              checked={bookingData.destinationData.addressType === type}
                              onChange={(e) => setBookingData(prev => ({
                                ...prev,
                                destinationData: { ...prev.destinationData, addressType: e.target.value }
                              }))}
                              className="sr-only"
                            />
                            <Label
                              htmlFor={`destinationAddressType-${type}`}
                              className={cn(
                                "flex items-center cursor-pointer",
                                isDarkMode ? "text-slate-300" : "text-gray-700"
                              )}
                            >
                              <span className={cn(
                                "inline-block rounded-full border-2 mr-1.5 transition-all",
                                bookingData.destinationData.addressType === type
                                  ? isDarkMode
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-blue-600 bg-blue-600"
                                  : isDarkMode
                                    ? "border-slate-500 bg-transparent"
                                    : "border-gray-400 bg-transparent",
                                "w-3.5 h-3.5"
                              )}>
                                {bookingData.destinationData.addressType === type && (
                                  <span className={cn(
                                    "block rounded-full",
                                    isDarkMode ? "bg-white" : "bg-white",
                                    "w-2 h-2 m-0.5"
                                  )} />
                                )}
                              </span>
                              <span className="text-sm font-normal">{type}</span>
                            </Label>
                          </div>
                        ))}
                    </div>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Step 3: Shipment Details */}
              {currentStep === 3 && (
                <div className={cn(
                  'rounded-xl sm:rounded-2xl border p-4 sm:p-5 transition-all duration-300',
                  isDarkMode
                    ? 'border-slate-800/70 bg-slate-900/70 shadow-[0_18px_40px_rgba(15,23,42,0.35)]'
                    : 'border-slate-200/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]'
                )}>
                  <div className="space-y-4 sm:space-y-6 md:space-y-8">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Package Information - Show directly without conditional check */}
                      <div
                        className={cn(
                          '',
                          isDarkMode
                            ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
                            : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
                        )}
                      >
                        <div className="space-y-4">
                          {/* No. of Packages and Package Type - 2 column layout normally, 3 columns when Others is selected */}
                          <div className={cn(
                            "grid gap-3",
                            bookingData.shipmentData.packageType === 'Others' 
                              ? "grid-cols-1 md:grid-cols-3" 
                              : "grid-cols-1 md:grid-cols-2"
                          )}>
                        <FloatingLabelInput
                          id="packagesCount"
                          value={bookingData.shipmentData.packagesCount}
                          onChange={(value) => setBookingData(prev => ({
                            ...prev,
                            shipmentData: { ...prev.shipmentData, packagesCount: sanitizeInteger(value) }
                          }))}
                          placeholder="No. of Packages :"
                          type="text"
                          icon={<Package className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                          error={errors.packagesCount}
                          required
                          isDarkMode={isDarkMode}
                        />
                        <FloatingSelect
                          label="Package Type :"
                          value={bookingData.shipmentData.packageType}
                          onChange={(value) => setBookingData(prev => ({
                            ...prev,
                            shipmentData: { 
                              ...prev.shipmentData, 
                              packageType: value,
                              others: value === 'Others' ? prev.shipmentData.others : ''
                            }
                          }))}
                          options={packageTypeOptions}
                          required
                          icon={<Info className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                          isDarkMode={isDarkMode}
                        />
                        {bookingData.shipmentData.packageType === 'Others' && (
                          <FloatingLabelInput
                            id="others"
                            value={bookingData.shipmentData.others}
                            onChange={(value) => setBookingData(prev => ({
                              ...prev,
                              shipmentData: { ...prev.shipmentData, others: value }
                            }))}
                            placeholder="Others - Specify :"
                            type="text"
                            error={errors.others}
                            required
                            isDarkMode={isDarkMode}
                          />
                        )}
                        </div>

                        {/* Package Images - Show when both packagesCount and packageType are filled, and if Others is selected, also require others field (matching BookNow.tsx) */}
                        {bookingData.shipmentData.packagesCount && bookingData.shipmentData.packagesCount.trim().length > 0 && 
                         bookingData.shipmentData.packageType && bookingData.shipmentData.packageType.trim().length > 0 &&
                         (bookingData.shipmentData.packageType !== 'Others' || (bookingData.shipmentData.packageType === 'Others' && bookingData.shipmentData.others && bookingData.shipmentData.others.trim().length > 0)) && (
                          <div
                            className={cn(
                              'rounded-xl border transition-all duration-300',
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
                                  accept="image/*,.pdf"
                                  multiple
                                  className="hidden"
                                  onChange={(event) => {
                                    const files = Array.from(event.target.files || []);
                                    if (files.length + bookingData.shipmentData.packageImages.length > 5) {
                                      toast({
                                        title: "Maximum Files Exceeded",
                                        description: "Maximum 5 files allowed",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    handleFileUpload(files);
                                  }}
                                />
                                <label
                                  htmlFor="package-image-upload"
                                  className={cn(
                                    'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                    'bg-blue-500 text-white hover:bg-blue-600'
                                  )}
                                >
                                  Select Images
                                </label>
                                <div className="min-w-0 flex-1 text-xs">
                                  <p className={cn('truncate', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                                    {bookingData.shipmentData.packageImages.length > 0 
                                      ? `${bookingData.shipmentData.packageImages.length} image${bookingData.shipmentData.packageImages.length !== 1 ? 's' : ''} selected`
                                      : 'No images selected'}
                                  </p>
                                  <p className={cn('text-[10px]', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                    Accepted formats: JPG, PNG, PDF. Max 5 files.
                                  </p>
                                </div>
                                {bookingData.shipmentData.packageImages.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBookingData(prev => ({
                              ...prev,
                                        shipmentData: {
                                          ...prev.shipmentData,
                                          packageImages: [],
                                          uploadedFiles: []
                                        }
                                      }));
                                    }}
                                    className={cn(
                                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                                      'bg-red-500 text-white hover:bg-red-600'
                                    )}
                                  >
                                    <XCircle className="w-3 h-3" />
                                    Remove All
                                  </button>
                                )}
                              </div>

                              {/* Image Previews Grid */}
                              {bookingData.shipmentData.packageImages.length > 0 && (
                                <div className={cn(
                                  "grid gap-2 mt-2",
                                  bookingData.shipmentData.packageImages.length === 3 ? "grid-cols-3" :
                                  bookingData.shipmentData.packageImages.length === 4 ? "grid-cols-4" :
                                  "grid-cols-5"
                                )}>
                                  {bookingData.shipmentData.packageImages.map((file, index) => {
                                    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
                                    return (
                                      <div
                                        key={index}
                                        className={cn(
                                          'relative group rounded-lg overflow-hidden border',
                                          isDarkMode ? 'border-slate-700' : 'border-slate-200'
                                        )}
                                      >
                                        {preview ? (
                                          <>
                                            <img
                                              src={preview}
                                              alt={`Preview ${index + 1}`}
                                              className="w-full h-16 object-cover cursor-pointer"
                                              onClick={() => {
                                                const url = URL.createObjectURL(file);
                                                window.open(url, '_blank');
                                              }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                            <button
                                              type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const url = URL.createObjectURL(file);
                                                  window.open(url, '_blank');
                                              }}
                                              className={cn(
                                                  'text-white hover:text-blue-300 transition-colors'
                                              )}
                                                title="Preview image"
                                            >
                                                <Eye className="w-6 h-6" />
                                            </button>
                                            <button
                                              type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  removeFile(index);
                                              }}
                                              className={cn(
                                                  'text-white hover:text-red-300 transition-colors'
                                              )}
                                            >
                                                <XCircle className="w-6 h-6" />
                                            </button>
                                            </div>
                                          </>
                                        ) : (
                                          <div className={cn("w-full h-16 flex items-center justify-center", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
                                            <FileText className={cn("w-6 h-6", isDarkMode ? "text-slate-500" : "text-slate-400")} />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {errors.packageImages && (
                          <p className={cn("text-sm mt-2", isDarkMode ? "text-red-400" : "text-red-600")}>{errors.packageImages}</p>
                        )}

                          {/* Content Description and Declared Value - Two column layout */}
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                            <FloatingLabelInput
                              id="contentDescription"
                              value={bookingData.shipmentData.contentDescription}
                              onChange={(value) => setBookingData(prev => ({
                                ...prev,
                                shipmentData: { ...prev.shipmentData, contentDescription: value }
                              }))}
                              placeholder="Content Description :"
                              type="text"
                              icon={<FileText className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                              isDarkMode={isDarkMode}
                            />
                            <FloatingLabelInput
                              id="declaredValue"
                              value={bookingData.shipmentData.declaredValue}
                              onChange={(value) => setBookingData(prev => ({
                                ...prev,
                                shipmentData: { ...prev.shipmentData, declaredValue: sanitizeDecimal(value) }
                              }))}
                              placeholder="Declared Value (₹) :"
                              type="text"
                              icon={<DollarSign className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                              error={errors.declaredValue}
                              required
                              isDarkMode={isDarkMode}
                            />
                          </div>

                    {/* Length, Width, Height - 3 column layout (matching BookNow.tsx) */}
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                        <FloatingLabelInput
                        id="length"
                        value={firstDimension.length}
                              onChange={(value) => {
                                const newDimensions = [...bookingData.shipmentData.dimensions];
                          newDimensions[0] = { ...newDimensions[0], length: sanitizeDecimal(value) };
                                setBookingData(prev => ({
                                  ...prev,
                                  shipmentData: { ...prev.shipmentData, dimensions: newDimensions }
                                }));
                              }}
                        placeholder="Length cm. :"
                        type="text"
                        icon={<Ruler className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                            <FloatingLabelInput
                        id="width"
                        value={firstDimension.breadth}
                              onChange={(value) => {
                                const newDimensions = [...bookingData.shipmentData.dimensions];
                          newDimensions[0] = { ...newDimensions[0], breadth: sanitizeDecimal(value) };
                                setBookingData(prev => ({
                                  ...prev,
                                  shipmentData: { ...prev.shipmentData, dimensions: newDimensions }
                                }));
                              }}
                        placeholder="Width cm. :"
                        type="text"
                        icon={<Ruler className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                            <FloatingLabelInput
                        id="height"
                        value={firstDimension.height}
                              onChange={(value) => {
                                const newDimensions = [...bookingData.shipmentData.dimensions];
                          newDimensions[0] = { ...newDimensions[0], height: sanitizeDecimal(value) };
                                setBookingData(prev => ({
                                  ...prev,
                                  shipmentData: { ...prev.shipmentData, dimensions: newDimensions }
                                }));
                              }}
                        placeholder="Height cm. :"
                        type="text"
                        icon={<Ruler className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                            </div>
                    
                    {/* Weight Inputs - Three column layout (matching BookNow.tsx) */}
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                      {/* Volumetric Weight - Read-only */}
                      <FloatingLabelInput
                        id="volumetricWeight"
                        value={formattedVolumetricWeight || ''}
                        onChange={() => {}}
                        placeholder="Volumetric Weight Kg. :"
                        type="text"
                        disabled={true}
                        icon={<Scale className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                      {/* Actual Weight - Editable */}
                      <FloatingLabelInput
                        id="actualWeight"
                        value={bookingData.shipmentData.actualWeight}
                        onChange={(value) => setBookingData(prev => ({
                          ...prev,
                          shipmentData: { ...prev.shipmentData, actualWeight: sanitizeDecimal(value) }
                        }))}
                        placeholder="Actual Weight Kg. :"
                        type="text"
                        icon={<Scale className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        error={errors.actualWeight}
                        required
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
                        <FloatingLabelInput
                          id="chargeableWeight"
                          value={formattedChargeableWeight || ''}
                          onChange={() => {}}
                          placeholder="Chargeable Weight Kg. :"
                          type="text"
                          disabled={true}
                          icon={<Scale className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                          isDarkMode={isDarkMode}
                        />
                      </div>
                      </div>

                      {/* Special Instructions - Matching other inputs design */}
                      <FloatingLabelInput
                        id="specialInstructions"
                        value={bookingData.shipmentData.specialInstructions}
                        onChange={(value) => setBookingData(prev => ({
                          ...prev,
                          shipmentData: { ...prev.shipmentData, specialInstructions: value }
                        }))}
                        placeholder="Special Instructions (Optional)"
                        type="text"
                        icon={<Info className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                        isDarkMode={isDarkMode}
                      />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Service Selection & Payment Options */}
              {currentStep === 4 && (
                <div className={cn(
                  'rounded-xl sm:rounded-2xl border p-4 sm:p-5 transition-all duration-300',
                  isDarkMode
                    ? 'border-slate-800/70 bg-slate-900/70 shadow-[0_18px_40px_rgba(15,23,42,0.35)]'
                    : 'border-slate-200/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]'
                )}>
                  <div className="space-y-4 sm:space-y-6">
                  {/* Nature of Consignment Selection */}
                  <div
                    className={cn(
                      'rounded-xl p-4 transition-all duration-300',
                      isDarkMode
                        ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
                        : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
                    )}
                  >
                    <div className="space-y-2">
                      <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setBookingData(prev => ({
                            ...prev,
                            shipmentData: { 
                              ...prev.shipmentData, 
                              natureOfConsignment: 'DOX',
                              services: '', // Clear service when nature changes
                              mode: '' // Clear mode when nature changes
                            }
                          }))}
                          className={cn(
                            'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                            bookingData.shipmentData.natureOfConsignment === 'DOX'
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
                                bookingData.shipmentData.natureOfConsignment === 'DOX'
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : isDarkMode
                                    ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                    : 'border-slate-300 text-transparent'
                              )}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </div>
                            <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                              DOX (Documents)
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookingData(prev => ({
                            ...prev,
                            shipmentData: { 
                              ...prev.shipmentData, 
                              natureOfConsignment: 'NON-DOX',
                              services: '', // Clear service when nature changes
                              mode: '' // Clear mode when nature changes
                            }
                          }))}
                          className={cn(
                            'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                            bookingData.shipmentData.natureOfConsignment === 'NON-DOX'
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
                                bookingData.shipmentData.natureOfConsignment === 'NON-DOX'
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : isDarkMode
                                    ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                    : 'border-slate-300 text-transparent'
                              )}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </div>
                            <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                              NON-DOX (Parcels)
                            </p>
                          </div>
                        </button>
                      </div>
                      {errors.natureOfConsignment && (
                        <p className={cn("text-sm mt-2", isDarkMode ? "text-red-400" : "text-red-600")}>{errors.natureOfConsignment}</p>
                      )}
                    </div>
                  </div>

                  {/* Service Type Selection - Show only after nature is selected */}
                  {bookingData.shipmentData.natureOfConsignment && (
                    <div
                      className={cn(
                        'rounded-xl p-4 transition-all duration-300',
                        isDarkMode
                          ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
                          : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
                      )}
                    >
                      <div className="space-y-2">
                        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setBookingData(prev => ({
                              ...prev,
                              shipmentData: { 
                                ...prev.shipmentData, 
                                services: 'Standard',
                                mode: '' // Clear mode when service changes
                              }
                            }))}
                            className={cn(
                              'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                              bookingData.shipmentData.services === 'Standard'
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
                                  bookingData.shipmentData.services === 'Standard'
                                    ? 'border-blue-500 bg-blue-500 text-white'
                                    : isDarkMode
                                      ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                      : 'border-slate-300 text-transparent'
                                )}
                              >
                                <Check className="h-2.5 w-2.5" />
                              </div>
                              <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                                <span className="inline-flex items-center gap-1.5">
                                  <Package className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                                  Standard
                                </span>
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingData(prev => ({
                              ...prev,
                              shipmentData: { 
                                ...prev.shipmentData, 
                                services: 'Priority',
                                mode: '' // Clear mode when switching to Priority
                              }
                            }))}
                            className={cn(
                              'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                              bookingData.shipmentData.services === 'Priority'
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
                                  bookingData.shipmentData.services === 'Priority'
                                    ? 'border-blue-500 bg-blue-500 text-white'
                                    : isDarkMode
                                      ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                      : 'border-slate-300 text-transparent'
                                )}
                              >
                                <Check className="h-2.5 w-2.5" />
                              </div>
                              <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                                <span className="inline-flex items-center gap-1.5">
                                  <ShieldCheck className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                                  Priority
                                </span>
                              </p>
                            </div>
                          </button>
                        </div>
                        {errors.services && (
                          <p className={cn("text-sm mt-2", isDarkMode ? "text-red-400" : "text-red-600")}>{errors.services}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode Selection - Show only when Standard service is selected */}
                  {bookingData.shipmentData.services === 'Standard' && bookingData.shipmentData.natureOfConsignment && (
                    <div
                      className={cn(
                        'rounded-xl p-4 transition-all duration-300',
                        isDarkMode
                          ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
                          : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
                      )}
                    >
                      <div className="space-y-2">
                        <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
                          <button
                            type="button"
                            onClick={() => setBookingData(prev => ({
                              ...prev,
                              shipmentData: { ...prev.shipmentData, mode: 'Air' }
                            }))}
                            className={cn(
                              'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                              bookingData.shipmentData.mode === 'Air'
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
                                  bookingData.shipmentData.mode === 'Air'
                                    ? 'border-blue-500 bg-blue-500 text-white'
                                    : isDarkMode
                                      ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                      : 'border-slate-300 text-transparent'
                                )}
                              >
                                <Check className="h-2.5 w-2.5" />
                              </div>
                              <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                                <span className="inline-flex items-center gap-1.5">
                                  <Plane className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                                  Air
                                </span>
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingData(prev => ({
                              ...prev,
                              shipmentData: { ...prev.shipmentData, mode: 'Surface' }
                            }))}
                            className={cn(
                              'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                              bookingData.shipmentData.mode === 'Surface'
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
                                  bookingData.shipmentData.mode === 'Surface'
                                    ? 'border-blue-500 bg-blue-500 text-white'
                                    : isDarkMode
                                      ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                      : 'border-slate-300 text-transparent'
                                )}
                              >
                                <Check className="h-2.5 w-2.5" />
                              </div>
                              <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                                <span className="inline-flex items-center gap-1.5">
                                  <Train className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                                  Surface
                                </span>
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingData(prev => ({
                              ...prev,
                              shipmentData: { ...prev.shipmentData, mode: 'Road' }
                            }))}
                            className={cn(
                              'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                              bookingData.shipmentData.mode === 'Road'
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
                                  bookingData.shipmentData.mode === 'Road'
                                    ? 'border-blue-500 bg-blue-500 text-white'
                                    : isDarkMode
                                      ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                      : 'border-slate-300 text-transparent'
                                )}
                              >
                                <Check className="h-2.5 w-2.5" />
                              </div>
                              <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                                <span className="inline-flex items-center gap-1.5">
                                  <Truck className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                                  Road
                                </span>
                              </p>
                            </div>
                          </button>
                        </div>
                        {errors.mode && (
                          <p className={cn("text-sm mt-2", isDarkMode ? "text-red-400" : "text-red-600")}>{errors.mode}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Options - Show only after all previous selections are made */}
                  {bookingData.shipmentData.natureOfConsignment && 
                   bookingData.shipmentData.services && 
                   (bookingData.shipmentData.services === 'Priority' || (bookingData.shipmentData.services === 'Standard' && bookingData.shipmentData.mode)) && (
                    <div
                      className={cn(
                        'rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-300',
                        isDarkMode
                          ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
                          : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
                      )}
                    >
                      <div className="space-y-2">
                        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setBookingData(prev => ({
                              ...prev,
                              paymentData: { ...prev.paymentData, paymentType: 'FP' }
                            }))}
                            className={cn(
                              'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                              bookingData.paymentData.paymentType === 'FP'
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
                                  bookingData.paymentData.paymentType === 'FP'
                                    ? 'border-blue-500 bg-blue-500 text-white'
                                    : isDarkMode
                                      ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                      : 'border-slate-300 text-transparent'
                                )}
                              >
                                <Check className="h-2.5 w-2.5" />
                              </div>
                              <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                                <span className="inline-flex items-center gap-1.5">
                                  <CreditCard className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                                  FP
                                </span>
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingData(prev => ({
                              ...prev,
                              paymentData: { ...prev.paymentData, paymentType: 'TP' }
                            }))}
                            className={cn(
                              'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none',
                              bookingData.paymentData.paymentType === 'TP'
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
                                  bookingData.paymentData.paymentType === 'TP'
                                    ? 'border-blue-500 bg-blue-500 text-white'
                                    : isDarkMode
                                      ? 'border-slate-600 bg-slate-700/50 text-transparent'
                                      : 'border-slate-300 text-transparent'
                                )}
                              >
                                <Check className="h-2.5 w-2.5" />
                              </div>
                              <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                                <span className="inline-flex items-center gap-1.5">
                                  <CreditCard className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                                  TP
                                </span>
                              </p>
                            </div>
                          </button>
                        </div>

                        {errors.paymentType && (
                          <p className={cn("text-sm mt-2", isDarkMode ? "text-red-400" : "text-red-600")}>{errors.paymentType}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                  </div>
              )}

              {/* Step 5: Preview/Review */}
              {currentStep === 5 && (() => {
                const renderAddress = (data: { flatBuilding?: string; landmark?: string; locality?: string; area?: string; city?: string; state?: string; pincode?: string }) => {
                  const lines = [
                    [data.flatBuilding, data.landmark].filter(Boolean).join(', '),
                    [data.locality, data.area].filter(Boolean).join(', '),
                    [data.city, data.state, data.pincode].filter(Boolean).join(', ')
                  ].filter((line) => line);
                  return lines.join(', ');
                };

                return (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Origin Address */}
                    <div className={cn(
                      'rounded-lg border overflow-hidden transition-all duration-200 shadow-sm',
                      isDarkMode
                        ? 'border-slate-700/50 bg-slate-800/50'
                        : 'border-slate-200 bg-white'
                    )}>
                      <div className={cn(
                        'flex items-center justify-between mb-1.5 px-3 py-1.5',
                        'bg-blue-600'
                      )}>
                        <h4 className={cn(
                          'text-sm font-semibold flex items-center gap-1.5 text-white'
                        )}>
                          <MapPin className="h-3.5 w-3.5 text-white" />
                          Origin Details
                        </h4>
                        <button
                          onClick={() => setEditingSection('origin')}
                          className={cn(
                            'flex items-center justify-center p-1 rounded-md transition-colors',
                            'text-white hover:bg-blue-700/50'
                          )}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs p-4 pt-2">
                        {/* Left Column */}
                        <div className="space-y-1">
                          <div className="flex">
                            <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Name:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>{bookingData.originData.name || '—'}</span>
                        </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Email:</span>
                            <span className="flex-1">
                              {bookingData.originData.email ? (
                            <a 
                              href={`mailto:${bookingData.originData.email}`}
                              className={cn(
                                    'hover:opacity-80',
                                    isDarkMode ? 'text-slate-200' : 'text-gray-900'
                              )}
                            >
                              {bookingData.originData.email}
                            </a>
                              ) : (
                                <span className={cn(isDarkMode ? 'text-slate-200' : 'text-gray-900')}>—</span>
                              )}
                            </span>
                          </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Address:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>
                              {renderAddress(bookingData.originData) || '—'}
                            </span>
                          </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Address Type:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>{bookingData.originData.addressType || '—'}</span>
                          </div>
                          {bookingData.originData.gstNumber && (
                            <div className="flex">
                              <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>GST:</span>
                              <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>{bookingData.originData.gstNumber}</span>
                            </div>
                          )}
                        </div>
                        {/* Right Column */}
                        <div className="space-y-1">
                          <div className="flex">
                            <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Mobile:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>
                              {bookingData.originData.mobileNumber ? `+91 ${bookingData.originData.mobileNumber}` : '—'}
                            </span>
                          </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Company:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>{bookingData.originData.companyName || '—'}</span>
                          </div>
                          {bookingData.originData.website && (
                            <div className="flex">
                              <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Website:</span>
                              <span className="flex-1">
                            <a 
                              href={bookingData.originData.website.startsWith('http') ? bookingData.originData.website : `https://${bookingData.originData.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                    'underline hover:opacity-80',
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              )}
                            >
                              {bookingData.originData.website}
                            </a>
                              </span>
                            </div>
                          )}
                          {bookingData.originData.alternateNumbers && bookingData.originData.alternateNumbers.length > 0 && (
                            <div className="flex">
                              <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Alternate:</span>
                              <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>
                                +91 {bookingData.originData.alternateNumbers[0]}
                              </span>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>

                    {/* Destination Address */}
                    <div className={cn(
                      'rounded-lg border overflow-hidden transition-all duration-200 shadow-sm',
                      isDarkMode
                        ? 'border-slate-700/50 bg-slate-800/50'
                        : 'border-slate-200 bg-white'
                    )}>
                      <div className={cn(
                        'flex items-center justify-between mb-1.5 px-3 py-1.5',
                        'bg-blue-600'
                      )}>
                        <h4 className={cn(
                          'text-sm font-semibold flex items-center gap-1.5 text-white'
                        )}>
                          <MapPin className="h-3.5 w-3.5 text-white" />
                          Destination Details
                        </h4>
                        <button
                          onClick={() => setEditingSection('destination')}
                          className={cn(
                            'flex items-center justify-center p-1 rounded-md transition-colors',
                            'text-white hover:bg-blue-700/50'
                          )}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs p-4 pt-2">
                        {/* Left Column */}
                        <div className="space-y-1">
                          <div className="flex">
                            <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Name:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>{bookingData.destinationData.name || '—'}</span>
                         </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Email:</span>
                            <span className="flex-1">
                              {bookingData.destinationData.email ? (
                            <a 
                              href={`mailto:${bookingData.destinationData.email}`}
                              className={cn(
                                    'hover:opacity-80',
                                    isDarkMode ? 'text-slate-200' : 'text-gray-900'
                              )}
                            >
                              {bookingData.destinationData.email}
                            </a>
                              ) : (
                                <span className={cn(isDarkMode ? 'text-slate-200' : 'text-gray-900')}>—</span>
                              )}
                            </span>
                          </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Address:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>
                              {renderAddress(bookingData.destinationData) || '—'}
                            </span>
                          </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Address Type:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>{bookingData.destinationData.addressType || '—'}</span>
                          </div>
                          {bookingData.destinationData.gstNumber && (
                            <div className="flex">
                              <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>GST:</span>
                              <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>{bookingData.destinationData.gstNumber}</span>
                            </div>
                          )}
                        </div>
                        {/* Right Column */}
                        <div className="space-y-1">
                          <div className="flex">
                            <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Mobile:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>
                              {bookingData.destinationData.mobileNumber ? `+91 ${bookingData.destinationData.mobileNumber}` : '—'}
                            </span>
                          </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Company:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>{bookingData.destinationData.companyName || '—'}</span>
                          </div>
                          {bookingData.destinationData.website && (
                            <div className="flex">
                              <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Website:</span>
                              <span className="flex-1">
                            <a 
                              href={bookingData.destinationData.website.startsWith('http') ? bookingData.destinationData.website : `https://${bookingData.destinationData.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                    'underline hover:opacity-80',
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              )}
                            >
                              {bookingData.destinationData.website}
                            </a>
                              </span>
                            </div>
                          )}
                          {bookingData.destinationData.alternateNumbers && bookingData.destinationData.alternateNumbers.length > 0 && (
                            <div className="flex">
                              <span className={cn('font-medium min-w-[100px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Alternate:</span>
                              <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>
                                +91 {bookingData.destinationData.alternateNumbers[0]}
                              </span>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>

                    {/* Shipment Details */}
                    <div className={cn(
                      'rounded-lg border overflow-hidden transition-all duration-200 shadow-sm',
                      isDarkMode
                        ? 'border-slate-700/50 bg-slate-800/50'
                        : 'border-slate-200 bg-white'
                    )}>
                      <div className={cn(
                        'flex items-center justify-between mb-1.5 px-3 py-1.5',
                        'bg-blue-600'
                      )}>
                        <h4 className={cn(
                          'text-sm font-semibold flex items-center gap-1.5 text-white'
                        )}>
                          <Package className="h-3.5 w-3.5 text-white" />
                          Shipment Details
                        </h4>
                        <button
                          onClick={() => setEditingSection('shipment')}
                          className={cn(
                            'flex items-center justify-center p-1 rounded-md transition-colors',
                            'text-white hover:bg-blue-700/50'
                          )}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs p-4 pt-2">
                        {/* Left Column */}
                        <div className="space-y-1">
                          <div className="flex">
                            <span className={cn('font-medium min-w-[140px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Type:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>
                              {bookingData.shipmentData.natureOfConsignment === 'DOX' ? 'Document' : 
                               bookingData.shipmentData.natureOfConsignment === 'NON-DOX' ? 'Parcel' : 
                               bookingData.shipmentData.natureOfConsignment || '—'}
                            </span>
                          </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[140px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Service:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>{bookingData.shipmentData.services || '—'}</span>
                          </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[140px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Packages:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>
                              {bookingData.shipmentData.packagesCount ? `${bookingData.shipmentData.packagesCount} package${parseInt(bookingData.shipmentData.packagesCount) > 1 ? 's' : ''}` : '—'}
                            </span>
                          </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[140px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Declared Value:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>
                              {bookingData.shipmentData.declaredValue ? `₹${parseFloat(bookingData.shipmentData.declaredValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                            </span>
                        </div>
                          </div>
                        {/* Right Column */}
                        <div className="space-y-2.5">
                          <div className="flex">
                            <span className={cn('font-medium min-w-[140px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Mode:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>{bookingData.shipmentData.mode || '—'}</span>
                          </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[140px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Package Type:</span>
                            <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>
                              {bookingData.shipmentData.packageType}
                              {bookingData.shipmentData.packageType === 'Others' && bookingData.shipmentData.others && ` (${bookingData.shipmentData.others})`}
                              {!bookingData.shipmentData.packageType && '—'}
                            </span>
                          </div>
                          <div className="flex">
                            <span className={cn('font-medium min-w-[140px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Chargeable Weight:</span>
                            <span className={cn('flex-1 font-medium', isDarkMode ? 'text-blue-300' : 'text-blue-600')}>
                              {formattedChargeableWeight ? `${formattedChargeableWeight} kg` : '—'}
                            </span>
                          </div>
                          {bookingData.shipmentData.contentDescription && (
                            <div className="flex">
                              <span className={cn('font-medium min-w-[140px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Content:</span>
                              <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>{bookingData.shipmentData.contentDescription}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Payment */}
                    <div className={cn(
                      'rounded-lg border overflow-hidden transition-all duration-200 shadow-sm',
                      isDarkMode
                        ? 'border-slate-700/50 bg-slate-800/50'
                        : 'border-slate-200 bg-white'
                    )}>
                      <div className={cn(
                        'flex items-center justify-between mb-1.5 px-3 py-1.5',
                        'bg-blue-600'
                      )}>
                        <h4 className={cn(
                          'text-sm font-semibold flex items-center gap-1.5 text-white'
                        )}>
                          <Truck className="h-3.5 w-3.5 text-white" />
                          Pricing & Payment
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs p-4 pt-2">
                        <div className="flex">
                          <span className={cn('font-medium min-w-[140px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Payment Type:</span>
                          <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>
                            {bookingData.paymentData.paymentType === 'FP' ? 'FP (Include in Settlement)' : 
                             bookingData.paymentData.paymentType === 'TP' ? 'TP (Exclude from Settlement)' : 
                             'Not Selected'}
                          </span>
                        </div>
                        <div className="flex">
                          <span className={cn('font-medium min-w-[140px]', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Service & Location:</span>
                          <span className={cn('flex-1', isDarkMode ? 'text-slate-200' : 'text-gray-900')}>
                            {bookingData.invoiceData.serviceType && bookingData.invoiceData.location 
                              ? `${bookingData.invoiceData.serviceType} - ${bookingData.invoiceData.location}`
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* Navigation Buttons */}
          {consignmentCheck.hasAssignment && (
          <div className="flex flex-row justify-between gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={cn(
                  "flex items-center justify-center h-8 sm:h-10 px-2 sm:px-4 md:px-6 transition-all duration-200 text-xs sm:text-sm md:text-base flex-1 sm:flex-none sm:w-auto",
                  isDarkMode
                    ? "border-slate-700/60 hover:border-blue-500/50 hover:bg-blue-500/20 text-slate-300 hover:text-slate-100 disabled:border-slate-800 disabled:text-slate-600"
                    : "border-slate-300/60 hover:border-blue-400/60 hover:bg-blue-50/50 text-slate-700 hover:text-slate-900"
                )}
              >
                <span className="text-xs sm:text-sm md:text-base">Previous</span>
              </Button>

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center justify-center gap-1 sm:gap-2 h-8 sm:h-10 px-2 sm:px-4 md:px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 text-xs sm:text-sm md:text-base flex-1 sm:flex-none sm:w-auto"
                >
                  <span className="text-xs sm:text-sm md:text-base">{currentStep === 1 ? 'Continue' : 'Next'}</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-1 sm:gap-2 h-8 sm:h-10 px-2 sm:px-4 md:px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 text-xs sm:text-sm md:text-base flex-1 sm:flex-none sm:w-auto"
                >
                  {isSubmitting ? (
                    <span className="text-xs sm:text-sm md:text-base">Submitting...</span>
                  ) : (
                    <span className="text-xs sm:text-sm md:text-base">Complete</span>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

          {/* Phone Number Popup */}
      <Dialog open={showPhonePopup} onOpenChange={setShowPhonePopup}>
        <DialogContent 
          className={cn(
            "w-[90vw] max-w-2xl rounded-xl sm:rounded-2xl border max-h-[85vh] overflow-y-auto p-4 sm:p-5 transition-all duration-300",
            isDarkMode
              ? "border-slate-800/70 bg-slate-900/70 shadow-[0_18px_40px_rgba(15,23,42,0.35)]"
              : "border-slate-200/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
          )}
        >
          <DialogHeader className="px-0 pb-2">
            <DialogTitle className={cn("text-sm sm:text-base font-medium flex items-center justify-between", isDarkMode ? "text-slate-100" : "text-gray-800")}>
              {previousDestinations.length > 0 ? (
                <>
                  <span>Select Recipient Add :</span>
                </>
              ) : (
                <span className="w-full text-center">Enter Recipient's Mobile No.</span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 px-0">
            {/* Interactive 10-Block Phone Input - Only show when no destinations found */}
            {previousDestinations.length === 0 && (
            <div className="flex flex-row justify-center items-center gap-2">
              {/* Indian Flag and Country Code */}
              <div className={cn(
                "flex items-center justify-center gap-1 px-2.5 py-2 border rounded-lg shadow-sm flex-shrink-0",
                isDarkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-gray-300"
              )}>
                <img 
                  src="/src/Icon-images/flag.png" 
                  alt="Indian Flag" 
                  className="w-4 h-4 object-contain"
                />
                <span className={cn("text-sm font-medium", isDarkMode ? "text-slate-100" : "text-slate-800")}>+91</span>
              </div>
              
              {/* Phone Number Input Blocks */}
              <div className="grid grid-cols-10 gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={phoneNumber[index] || ''}
                      onChange={async (e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 1) {
                          const newPhone = phoneNumber.split('');
                          newPhone[index] = value;
                          const updatedPhone = newPhone.join('');

                          setPhoneNumber(updatedPhone);
                          setCountdown(null); // Clear countdown when phone number changes

                          // Auto-focus next input
                          if (value && index < 9) {
                            const nextInput = document.getElementById(`phone-block-${index + 1}`);
                            nextInput?.focus();
                          }

                          // Auto-lookup when 10 digits are entered
                          if (updatedPhone.length === 10) {
                            await handlePhoneLookup(updatedPhone);
                            // Show modal with destination selection options
                          } else {
                            // Clear previous results if phone number is incomplete
                            setPreviousDestinations([]);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !phoneNumber[index] && index > 0) {
                          const prevInput = document.getElementById(`phone-block-${index - 1}`);
                          prevInput?.focus();
                        }
                      }}
                      onKeyUp={async (e) => {
                        // Handle paste functionality
                        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
                          setTimeout(async () => {
                            const target = e.target as HTMLInputElement;
                            const pastedValue = target.value.replace(/\D/g, '').slice(0, 10);
                            if (pastedValue.length > 1) {
                              setPhoneNumber(pastedValue);
                              setCountdown(null); // Clear countdown when phone number changes
                              if (pastedValue.length === 10) {
                                await handlePhoneLookup(pastedValue);
                                // Show modal with destination selection options
                              }
                            }
                          }, 10);
                        }
                      }}
                      id={`phone-block-${index}`}
                      className={cn(
                        "w-6 h-8 sm:w-7 sm:h-9 border rounded-md text-center text-sm transition-all focus:outline-none focus:ring-0",
                        index < phoneNumber.length
                          ? isDarkMode
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
                          : isDarkMode
                            ? 'border-slate-700 bg-slate-800 text-slate-400'
                            : 'border-gray-300 bg-white text-gray-500',
                        isLookingUpPhone && 'opacity-50 cursor-not-allowed'
                      )}
                      style={{ fontFamily: '"Value Serif Pro Regular", serif !important', fontWeight: '400 !important' }}
                      disabled={isLookingUpPhone}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
            </div>
            )}

            {/* Status Messages - Only show when no destinations found */}
            {previousDestinations.length === 0 && (
              <>
            {isLookingUpPhone ? (
              <div className={cn(
                "p-3 rounded-lg border",
                isDarkMode
                  ? "bg-blue-500/20 border-blue-500/50"
                  : "bg-blue-50 border-blue-200"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "animate-spin rounded-full h-4 w-4 border-2 border-t-transparent",
                    isDarkMode ? "border-blue-400" : "border-blue-600"
                  )}></div>
                  <p className={cn("text-sm", isDarkMode ? "text-blue-300" : "text-blue-800")}>Searching...</p>
                </div>
              </div>
                ) : phoneNumber.length === 10 ? (
                  <div className="flex justify-center pt-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowPhonePopup(false);
                        setCountdown(null);
                        setCurrentStep(2);
                      }}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-200"
                      style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
                    >
                      Continue
                    </Button>
                </div>
                ) : null}
              </>
            )}

            {/* Destination Selection Cards - Show when destinations found */}
            {previousDestinations.length > 0 && (
              <div className="space-y-3">
                {/* Destination Selection Cards */}
                <div className="space-y-2 max-h-[55vh] overflow-y-auto">
                  {previousDestinations.map((destination, index) => (
                    <div
                      key={index}
                      className={cn(
                        "border-2 rounded-lg p-3 shadow-md transition-all duration-200 cursor-pointer",
                        selectedDestinationIndex === index
                          ? isDarkMode
                            ? 'border-blue-500 bg-blue-500/20 shadow-lg'
                            : 'border-blue-500 bg-blue-50/50 shadow-lg'
                          : isDarkMode
                            ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => setSelectedDestinationIndex(index)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Radio Button */}
                        <div className="mt-0.5 flex-shrink-0">
                          <div className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                            selectedDestinationIndex === index
                              ? isDarkMode ? 'border-blue-400 bg-blue-400' : 'border-blue-500 bg-blue-500'
                              : isDarkMode ? 'border-slate-600' : 'border-gray-300'
                          )}>
                            {selectedDestinationIndex === index && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                        </div>
                        
                        {/* Address Content */}
                        <div className="flex-1 min-w-0">
                          {/* Company Name */}
                          {destination.companyName ? (
                            <h4 className={cn(
                              'text-sm font-medium mb-1',
                              isDarkMode ? 'text-slate-100' : 'text-slate-900'
                            )}>
                              {destination.companyName}
                            </h4>
                          ) : (
                            <h4 className={cn(
                              'text-sm font-medium mb-1',
                              isDarkMode ? 'text-slate-100' : 'text-slate-900'
                            )}>
                              {destination.name || 'Recipient'}
                            </h4>
                          )}

                          {/* Concern Person Name */}
                          {destination.companyName && destination.name && (
                            <p className={cn("text-xs mb-1", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                              {destination.name}
                            </p>
                          )}

                          {/* Address */}
                          <div className="flex items-start gap-1.5 mb-1">
                            <MapPin className={cn("h-3.5 w-3.5 flex-shrink-0 mt-0.5", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                            <span className={cn("text-xs leading-relaxed", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                              {destination.flatBuilding && `${destination.flatBuilding}, `}
                              {destination.locality || ''}
                              {destination.landmark && `, ${destination.landmark}`}
                              {destination.area && `, ${destination.area}`}
                              {destination.city && `, ${destination.city}`}
                              {destination.state && `, ${destination.state}`}
                              {destination.pincode && ` ${destination.pincode}`}
                            </span>
                          </div>

                          {/* Phone, Email, and GST - Same Line */}
                          {(destination.mobileNumber || destination.email || destination.gstNumber) && (
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              {destination.mobileNumber && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className={cn("h-3.5 w-3.5 flex-shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                                  <span className={cn("text-xs", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                    +91 {destination.mobileNumber}
                                  </span>
                                </div>
                              )}
                              {destination.email && (
                                <div className="flex items-center gap-1.5">
                                  <Mail className={cn("h-3.5 w-3.5 flex-shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                                  <span className={cn("text-xs", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                    {destination.email}
                                  </span>
                                </div>
                              )}
                              {destination.gstNumber && (
                                <div className="flex items-center gap-1.5">
                                  <Building className={cn("h-3.5 w-3.5 flex-shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                                  <span className={cn("text-xs", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                    {destination.gstNumber}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Website */}
                          {destination.website && (
                            <div className="flex items-center gap-1.5">
                              <Globe className={cn("h-3.5 w-3.5 flex-shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                              <a 
                                href={destination.website.startsWith('http') ? destination.website : `https://${destination.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  'text-xs underline',
                                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                )}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {destination.website}
                              </a>
                            </div>
                          )}
                        </div>
                          
                          {/* Address Type Badge */}
                          <Badge className={cn(
                            "text-[10px] font-medium px-2 py-0.5 h-fit flex-shrink-0",
                            isDarkMode
                              ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          )}>
                            {(destination.addressType || 'HOME').toUpperCase()}
                          </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className={cn("flex items-center justify-between gap-2 pt-2 border-t", isDarkMode ? "border-slate-700" : "border-gray-200")}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPhonePopup(false);
                      setCountdown(null);
                      setCurrentStep(2);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 transition-all duration-200 text-xs h-8",
                      isDarkMode
                        ? "bg-blue-500/20 border-blue-400 text-blue-400 hover:bg-blue-500/30 hover:border-blue-300"
                        : "bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 hover:border-blue-500"
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Another Address
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (selectedDestinationIndex !== null) {
                        handleDestinationSelect(previousDestinations[selectedDestinationIndex]);
                      } else {
                        toast({
                          title: "Please Select",
                          description: "Please select a destination address to continue.",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 text-xs h-8 px-4"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>

      {/* Consignment Finished Popup */}
      <Dialog open={showConsignmentFinishedPopup} onOpenChange={setShowConsignmentFinishedPopup}>
        <DialogContent className={cn(
          "w-[95vw] sm:max-w-md border",
          isDarkMode
            ? "bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border-slate-800/60"
            : "bg-gradient-to-br from-white via-slate-50/50 to-red-50/30 border-slate-200/60"
        )}>
          <DialogHeader>
            <DialogTitle className={cn("flex items-center text-base sm:text-lg", isDarkMode ? "text-red-400" : "text-red-600")}>
              <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              Consignment Numbers Finished
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 sm:py-4">
            <div className="text-center">
              <div className={cn("p-3 sm:p-4 rounded-full w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center shadow-sm", isDarkMode ? "bg-red-900/50" : "bg-red-100")}>
                <Package className={cn("h-6 w-6 sm:h-8 sm:w-8", isDarkMode ? "text-red-400" : "text-red-500")} />
              </div>
              <h3 className={cn("text-base sm:text-lg font-semibold mb-2", isDarkMode ? "text-slate-100" : "text-slate-800")}>
                All Consignment Numbers Used
              </h3>
              <p className={cn("text-sm sm:text-base mb-3 sm:mb-4 px-2", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                You have used all your assigned consignment numbers. Please contact your admin to get more consignment numbers assigned before making new bookings.
              </p>
              <div className={cn(
                "rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4 shadow-sm border",
                isDarkMode
                  ? "bg-gradient-to-br from-yellow-900/30 via-yellow-900/20 to-amber-900/30 border-yellow-700/60"
                  : "bg-gradient-to-br from-yellow-50/90 via-yellow-50/70 to-amber-50/90 border-yellow-200/60"
              )}>
                <p className={cn("text-xs sm:text-sm", isDarkMode ? "text-yellow-300" : "text-yellow-800")}>
                  <strong>Note:</strong> You cannot complete this booking until new consignment numbers are assigned to your account.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowConsignmentFinishedPopup(false)}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/30 hover:shadow-xl transition-all duration-200 text-sm sm:text-base h-10 sm:h-10"
            >
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Origin Address Dialog */}
      <Dialog open={editingSection === 'origin'} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className={cn(
          "w-[90vw] max-w-4xl rounded-xl sm:rounded-2xl border max-h-[90vh] overflow-y-auto p-4 sm:p-5 transition-all duration-300",
          isDarkMode
            ? "border-slate-800/70 bg-slate-900/70 shadow-[0_18px_40px_rgba(15,23,42,0.35)]"
            : "border-slate-200/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
        )}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg font-semibold flex items-center gap-2", isDarkMode ? "text-slate-100" : "text-slate-900")}>
              <MapPin className="h-5 w-5" />
              Edit Sender Address
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Origin Address Form - Same as Step 1 */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <MapPin className={cn("h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0", isDarkMode ? "text-blue-400" : "text-blue-600")} />
                <h4 className={cn("text-sm sm:text-base font-semibold", isDarkMode ? "text-blue-300" : "text-blue-800")}>
                  Sender Address
                </h4>
              </div>

              {/* Row 1: Concern Name* + Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editOriginName"
                  value={bookingData.originData.name}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    originData: { ...prev.originData, name: value }
                  }))}
                  placeholder="Concern Name"
                  icon={<User className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  required
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editOriginCompany"
                  value={bookingData.originData.companyName}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    originData: { ...prev.originData, companyName: value }
                  }))}
                  placeholder="Company Name"
                  icon={<Building className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Row 2: Locality / Street* + Building / Flat No.* */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editOriginLocality"
                  value={bookingData.originData.locality}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    originData: { ...prev.originData, locality: value }
                  }))}
                  placeholder="Locality / Street"
                  icon={<Navigation className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  required
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editOriginFlatBuilding"
                  value={bookingData.originData.flatBuilding}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    originData: { ...prev.originData, flatBuilding: value }
                  }))}
                  placeholder="Building / Flat No."
                  icon={<Building className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  required
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Row 3: Landmark + GST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editOriginLandmark"
                  value={bookingData.originData.landmark}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    originData: { ...prev.originData, landmark: value }
                  }))}
                  placeholder="Landmark"
                  icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editOriginGstNumber"
                  value={bookingData.originData.gstNumber}
                  onChange={(value) => {
                    const formattedGST = validateGSTFormat(value);
                    setBookingData(prev => ({
                      ...prev,
                      originData: { ...prev.originData, gstNumber: formattedGST }
                    }));
                  }}
                  placeholder="GST"
                  maxLength={15}
                  icon={<Building className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Row 4: PINCode* + State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editOriginPincode"
                  value={bookingData.originData.pincode}
                  onChange={(value) => {
                    const numericPincode = value.replace(/\D/g, '').slice(0, 6);
                    setBookingData(prev => ({
                      ...prev,
                      originData: { ...prev.originData, pincode: numericPincode }
                    }));
                    if (numericPincode.length === 6) {
                      lookupPincode(numericPincode, 'origin');
                    }
                  }}
                  placeholder="PINCode"
                  maxLength={6}
                  icon={isLoadingPincode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />
                  )}
                  required
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editOriginState"
                  value={bookingData.originData.state}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    originData: { ...prev.originData, state: value }
                  }))}
                  placeholder="State"
                  icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
              </div>

              {bookingData.originData.pincode.length === 6 && (
                <div>
                  <FloatingSelect
                    label="Area"
                    value={bookingData.originData.area}
                    onChange={(value) => setBookingData(prev => ({
                      ...prev,
                      originData: { ...prev.originData, area: value }
                    }))}
                    options={availableAreas.length > 0 ? availableAreas : ['This pincode is not serviceable']}
                    required
                    disabled={availableAreas.length === 0}
                    icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}

              {/* Row 5: City + Email* */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editOriginCity"
                  value={bookingData.originData.city}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    originData: { ...prev.originData, city: value }
                  }))}
                  placeholder="City"
                  icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editOriginEmail"
                  value={bookingData.originData.email}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    originData: { ...prev.originData, email: value }
                  }))}
                  placeholder="Email"
                  type="email"
                  icon={<Mail className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  required
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Row 6: Website (Optional) + Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editOriginWebsite"
                  value={bookingData.originData.website || ''}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    originData: { ...prev.originData, website: value }
                  }))}
                  placeholder="Website (Optional)"
                  icon={<Globe className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editOriginMobileNumber"
                  value={bookingData.originData.mobileNumber}
                  onChange={(value) => {
                    const cleanValue = value.replace(/\D/g, '').slice(0, 10);
                    setBookingData(prev => ({
                      ...prev,
                      originData: { ...prev.originData, mobileNumber: cleanValue }
                    }));
                  }}
                  placeholder="Mobile Number"
                  type="tel"
                  maxLength={10}
                  icon={<Phone className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Address Type */}
              <div className="space-y-3">
                <Label className={cn("text-sm font-medium", isDarkMode ? "text-slate-200" : "text-gray-900")}>
                  Address Type :
                </Label>
                <div className="flex flex-wrap gap-6 sm:gap-8">
                  {['Corporate', 'Home', 'Office', 'Warehouse'].map((type) => (
                    <div key={type} className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        id={`editOriginType-${type}`}
                        name="editOriginType"
                        value={type}
                        checked={bookingData.originData.addressType === type}
                        onChange={(e) => setBookingData(prev => ({
                          ...prev,
                          originData: { ...prev.originData, addressType: e.target.value }
                        }))}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`editOriginType-${type}`}
                        className={cn(
                          "flex items-center cursor-pointer",
                          isDarkMode ? "text-slate-300" : "text-gray-700"
                        )}
                      >
                        <span className={cn(
                          "inline-block rounded-full border-2 mr-1.5 transition-all",
                          bookingData.originData.addressType === type
                            ? isDarkMode
                              ? "border-blue-500 bg-blue-500"
                              : "border-blue-600 bg-blue-600"
                            : isDarkMode
                              ? "border-slate-500 bg-transparent"
                              : "border-gray-400 bg-transparent",
                          "w-3.5 h-3.5"
                        )}>
                          {bookingData.originData.addressType === type && (
                            <span className={cn(
                              "block rounded-full",
                              isDarkMode ? "bg-white" : "bg-white",
                              "w-2 h-2 m-0.5"
                            )} />
                          )}
                        </span>
                        <span className="text-sm font-normal">{type}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingSection(null)}
              className={cn(
                "px-4 py-2 border",
                isDarkMode 
                  ? "border-blue-500/30 text-blue-300 bg-transparent" 
                  : "border-blue-300/30 text-blue-700 bg-transparent"
              )}
              style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                // Validate required fields
                if (!bookingData.originData.name || !bookingData.originData.email || !bookingData.originData.pincode || !bookingData.originData.locality || !bookingData.originData.flatBuilding) {
                  toast({
                    title: "Validation Error",
                    description: "Please fill all required fields",
                    variant: "destructive"
                  });
                  return;
                }
                setEditingSection(null);
                toast({
                  title: "Updated",
                  description: "Sender address has been updated successfully.",
                });
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200"
              style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Destination Address Dialog */}
      <Dialog open={editingSection === 'destination'} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className={cn(
          "w-[90vw] max-w-4xl rounded-xl sm:rounded-2xl border max-h-[90vh] overflow-y-auto p-4 sm:p-5 transition-all duration-300",
          isDarkMode
            ? "border-slate-800/70 bg-slate-900/70 shadow-[0_18px_40px_rgba(15,23,42,0.35)]"
            : "border-slate-200/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
        )}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg font-semibold flex items-center gap-2", isDarkMode ? "text-slate-100" : "text-slate-900")}>
              <MapPin className="h-5 w-5" />
              Edit Recipient Address
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Destination Address Form - Same as Step 2 */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <MapPin className={cn("h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0", isDarkMode ? "text-blue-400" : "text-blue-600")} />
                <h4 className={cn("text-sm sm:text-base font-semibold", isDarkMode ? "text-blue-300" : "text-blue-800")}>
                  Receiver Address
                </h4>
              </div>

              {/* Row 1: Concern Name* + Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editDestinationName"
                  value={bookingData.destinationData.name}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    destinationData: { ...prev.destinationData, name: value }
                  }))}
                  placeholder="Concern Name"
                  icon={<User className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  required
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editDestinationCompany"
                  value={bookingData.destinationData.companyName}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    destinationData: { ...prev.destinationData, companyName: value }
                  }))}
                  placeholder="Company Name"
                  icon={<Building className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Row 2: Locality / Street* + Building / Flat No.* */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editDestinationLocality"
                  value={bookingData.destinationData.locality}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    destinationData: { ...prev.destinationData, locality: value }
                  }))}
                  placeholder="Locality / Street"
                  icon={<Navigation className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  required
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editDestinationFlatBuilding"
                  value={bookingData.destinationData.flatBuilding}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    destinationData: { ...prev.destinationData, flatBuilding: value }
                  }))}
                  placeholder="Building / Flat No."
                  icon={<Building className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  required
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Row 3: Landmark + GST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editDestinationLandmark"
                  value={bookingData.destinationData.landmark}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    destinationData: { ...prev.destinationData, landmark: value }
                  }))}
                  placeholder="Landmark"
                  icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editDestinationGstNumber"
                  value={bookingData.destinationData.gstNumber}
                  onChange={(value) => {
                    const formattedGST = validateGSTFormat(value);
                    setBookingData(prev => ({
                      ...prev,
                      destinationData: { ...prev.destinationData, gstNumber: formattedGST }
                    }));
                  }}
                  placeholder="GST"
                  maxLength={15}
                  icon={<Building className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Row 4: PINCode* + State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editDestinationPincode"
                  value={bookingData.destinationData.pincode}
                  onChange={(value) => {
                    const numericPincode = value.replace(/\D/g, '').slice(0, 6);
                    setBookingData(prev => ({
                      ...prev,
                      destinationData: { ...prev.destinationData, pincode: numericPincode }
                    }));
                    if (numericPincode.length === 6) {
                      lookupPincode(numericPincode, 'destination');
                    }
                  }}
                  placeholder="PINCode"
                  maxLength={6}
                  icon={isLoadingDestinationPincode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />
                  )}
                  required
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editDestinationState"
                  value={bookingData.destinationData.state}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    destinationData: { ...prev.destinationData, state: value }
                  }))}
                  placeholder="State"
                  icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
              </div>

              {bookingData.destinationData.pincode.length === 6 && (
                <div>
                  <FloatingSelect
                    label="Area"
                    value={bookingData.destinationData.area}
                    onChange={(value) => setBookingData(prev => ({
                      ...prev,
                      destinationData: { ...prev.destinationData, area: value }
                    }))}
                    options={
                      (() => {
                        const currentArea = bookingData.destinationData.area;
                        if (destinationAreas.length > 0) {
                          if (currentArea && !destinationAreas.includes(currentArea)) {
                            return [currentArea, ...destinationAreas];
                          }
                          return destinationAreas;
                        } else if (currentArea) {
                          return [currentArea];
                        } else {
                          return ['This pincode is not serviceable'];
                        }
                      })()
                    }
                    required
                    disabled={destinationAreas.length === 0 && !bookingData.destinationData.area}
                    icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}

              {/* Row 5: City + Email* */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editDestinationCity"
                  value={bookingData.destinationData.city}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    destinationData: { ...prev.destinationData, city: value }
                  }))}
                  placeholder="City"
                  icon={<MapPin className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editDestinationEmail"
                  value={bookingData.destinationData.email}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    destinationData: { ...prev.destinationData, email: value }
                  }))}
                  placeholder="Email"
                  type="email"
                  icon={<Mail className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  required
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Row 6: Website (Optional) + Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editDestinationWebsite"
                  value={bookingData.destinationData.website || ''}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    destinationData: { ...prev.destinationData, website: value }
                  }))}
                  placeholder="Website (Optional)"
                  icon={<Globe className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editDestinationMobileNumber"
                  value={bookingData.destinationData.mobileNumber}
                  onChange={(value) => {
                    const cleanValue = value.replace(/\D/g, '').slice(0, 10);
                    setBookingData(prev => ({
                      ...prev,
                      destinationData: { ...prev.destinationData, mobileNumber: cleanValue }
                    }));
                  }}
                  placeholder="Mobile Number"
                  type="tel"
                  maxLength={10}
                  icon={<Phone className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Address Type */}
              <div className="space-y-3">
                <Label className={cn("text-sm font-medium", isDarkMode ? "text-slate-200" : "text-gray-900")}>
                  Address Type :
                </Label>
                <div className="flex flex-wrap gap-6 sm:gap-8">
                  {['Home', 'Office', 'Warehouse', 'Others'].map((type) => (
                    <div key={type} className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        id={`editDestinationType-${type}`}
                        name="editDestinationType"
                        value={type}
                        checked={bookingData.destinationData.addressType === type}
                        onChange={(e) => setBookingData(prev => ({
                          ...prev,
                          destinationData: { ...prev.destinationData, addressType: e.target.value }
                        }))}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`editDestinationType-${type}`}
                        className={cn(
                          "flex items-center cursor-pointer",
                          isDarkMode ? "text-slate-300" : "text-gray-700"
                        )}
                      >
                        <span className={cn(
                          "inline-block rounded-full border-2 mr-1.5 transition-all",
                          bookingData.destinationData.addressType === type
                            ? isDarkMode
                              ? "border-blue-500 bg-blue-500"
                              : "border-blue-600 bg-blue-600"
                            : isDarkMode
                              ? "border-slate-500 bg-transparent"
                              : "border-gray-400 bg-transparent",
                          "w-3.5 h-3.5"
                        )}>
                          {bookingData.destinationData.addressType === type && (
                            <span className={cn(
                              "block rounded-full",
                              isDarkMode ? "bg-white" : "bg-white",
                              "w-2 h-2 m-0.5"
                            )} />
                          )}
                        </span>
                        <span className="text-sm font-normal">{type}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingSection(null)}
              className={cn(
                "px-4 py-2 border",
                isDarkMode 
                  ? "border-blue-500/30 text-blue-300 bg-transparent" 
                  : "border-blue-300/30 text-blue-700 bg-transparent"
              )}
              style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                // Validate required fields
                if (!bookingData.destinationData.name || !bookingData.destinationData.email || !bookingData.destinationData.pincode || !bookingData.destinationData.locality || !bookingData.destinationData.flatBuilding) {
                  toast({
                    title: "Validation Error",
                    description: "Please fill all required fields",
                    variant: "destructive"
                  });
                  return;
                }
                setEditingSection(null);
                toast({
                  title: "Updated",
                  description: "Recipient address has been updated successfully.",
                });
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200"
              style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shipment Details Dialog */}
      <Dialog open={editingSection === 'shipment'} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className={cn(
          "w-[90vw] max-w-4xl rounded-xl sm:rounded-2xl border max-h-[90vh] overflow-y-auto p-4 sm:p-5 transition-all duration-300",
          isDarkMode
            ? "border-slate-800/70 bg-slate-900/70 shadow-[0_18px_40px_rgba(15,23,42,0.35)]"
            : "border-slate-200/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
        )}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg font-semibold flex items-center gap-2", isDarkMode ? "text-slate-100" : "text-slate-900")}>
              <Package className="h-5 w-5" />
              Edit Shipment Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Shipment Details Form - Same as Step 3 */}
            <div className="space-y-3 sm:space-y-4">
              {/* No. of Packages and Package Type */}
              <div className={cn(
                "grid gap-3",
                bookingData.shipmentData.packageType === 'Others' 
                  ? "grid-cols-1 md:grid-cols-3" 
                  : "grid-cols-1 md:grid-cols-2"
              )}>
                <FloatingLabelInput
                  id="editPackagesCount"
                  value={bookingData.shipmentData.packagesCount}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    shipmentData: { ...prev.shipmentData, packagesCount: sanitizeInteger(value) }
                  }))}
                  placeholder="No. of Packages :"
                  type="text"
                  icon={<Package className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  required
                  isDarkMode={isDarkMode}
                />
                <FloatingSelect
                  label="Package Type :"
                  value={bookingData.shipmentData.packageType}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    shipmentData: { 
                      ...prev.shipmentData, 
                      packageType: value,
                      others: value === 'Others' ? prev.shipmentData.others : ''
                    }
                  }))}
                  options={packageTypeOptions}
                  required
                  icon={<Info className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
                {bookingData.shipmentData.packageType === 'Others' && (
                  <FloatingLabelInput
                    id="editOthers"
                    value={bookingData.shipmentData.others}
                    onChange={(value) => setBookingData(prev => ({
                      ...prev,
                      shipmentData: { ...prev.shipmentData, others: value }
                    }))}
                    placeholder="Specify Package Type"
                    icon={<Info className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                    required
                    isDarkMode={isDarkMode}
                  />
                )}
              </div>

              {/* Content Description and Declared Value */}
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <FloatingLabelInput
                  id="editContentDescription"
                  value={bookingData.shipmentData.contentDescription}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    shipmentData: { ...prev.shipmentData, contentDescription: value }
                  }))}
                  placeholder="Content Description"
                  icon={<FileText className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editDeclaredValue"
                  value={bookingData.shipmentData.declaredValue}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    shipmentData: { ...prev.shipmentData, declaredValue: sanitizeDecimal(value) }
                  }))}
                  placeholder="Declared Value (₹)"
                  type="text"
                  icon={<DollarSign className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  required
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editLength"
                  value={firstDimension.length}
                  onChange={(value) => {
                    const newDimensions = [...bookingData.shipmentData.dimensions];
                    newDimensions[0] = { ...newDimensions[0], length: sanitizeDecimal(value) };
                    setBookingData(prev => ({
                      ...prev,
                      shipmentData: { ...prev.shipmentData, dimensions: newDimensions }
                    }));
                  }}
                  placeholder="Length cm."
                  type="text"
                  icon={<Ruler className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editWidth"
                  value={firstDimension.breadth}
                  onChange={(value) => {
                    const newDimensions = [...bookingData.shipmentData.dimensions];
                    newDimensions[0] = { ...newDimensions[0], breadth: sanitizeDecimal(value) };
                    setBookingData(prev => ({
                      ...prev,
                      shipmentData: { ...prev.shipmentData, dimensions: newDimensions }
                    }));
                  }}
                  placeholder="Width cm."
                  type="text"
                  icon={<Ruler className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editHeight"
                  value={firstDimension.height}
                  onChange={(value) => {
                    const newDimensions = [...bookingData.shipmentData.dimensions];
                    newDimensions[0] = { ...newDimensions[0], height: sanitizeDecimal(value) };
                    setBookingData(prev => ({
                      ...prev,
                      shipmentData: { ...prev.shipmentData, dimensions: newDimensions }
                    }));
                  }}
                  placeholder="Height cm."
                  type="text"
                  icon={<Ruler className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Weights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="editVolumetricWeight"
                  value={bookingData.shipmentData.volumetricWeight.toString()}
                  onChange={(value) => {
                    const numValue = parseFloat(sanitizeDecimal(value)) || 0;
                    setBookingData(prev => ({
                      ...prev,
                      shipmentData: { ...prev.shipmentData, volumetricWeight: numValue }
                    }));
                  }}
                  placeholder="Volumetric Weight Kg."
                  type="text"
                  icon={<Scale className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editActualWeight"
                  value={bookingData.shipmentData.actualWeight}
                  onChange={(value) => setBookingData(prev => ({
                    ...prev,
                    shipmentData: { ...prev.shipmentData, actualWeight: sanitizeDecimal(value) }
                  }))}
                  placeholder="Actual Weight Kg."
                  type="text"
                  icon={<Scale className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  required
                  isDarkMode={isDarkMode}
                />
                <FloatingLabelInput
                  id="editChargeableWeight"
                  value={bookingData.shipmentData.chargeableWeight.toString()}
                  onChange={(value) => {
                    const numValue = parseFloat(sanitizeDecimal(value)) || 0;
                    setBookingData(prev => ({
                      ...prev,
                      shipmentData: { ...prev.shipmentData, chargeableWeight: numValue }
                    }));
                  }}
                  placeholder="Chargeable Weight Kg."
                  type="text"
                  icon={<Scale className="h-4 w-4 text-gray-500" strokeWidth={2.5} />}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Special Instructions */}
              <Textarea
                value={bookingData.shipmentData.specialInstructions}
                onChange={(e) => setBookingData(prev => ({
                  ...prev,
                  shipmentData: { ...prev.shipmentData, specialInstructions: e.target.value }
                }))}
                placeholder="Special Instructions (Optional)"
                className={cn(
                  "min-h-[80px] resize-none",
                  isDarkMode
                    ? "bg-slate-800/60 border-slate-700 text-slate-100"
                    : "bg-white/90 border-gray-300 text-gray-900"
                )}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingSection(null)}
              className={cn(
                "px-4 py-2 border",
                isDarkMode 
                  ? "border-blue-500/30 text-blue-300 bg-transparent" 
                  : "border-blue-300/30 text-blue-700 bg-transparent"
              )}
              style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                // Validate required fields
                if (!bookingData.shipmentData.packagesCount || !bookingData.shipmentData.packageType || !bookingData.shipmentData.declaredValue || !bookingData.shipmentData.actualWeight) {
                  toast({
                    title: "Validation Error",
                    description: "Please fill all required fields",
                    variant: "destructive"
                  });
                  return;
                }
                setEditingSection(null);
                toast({
                  title: "Updated",
                  description: "Shipment details have been updated successfully.",
                });
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200"
              style={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default CorporateBookingPanel;