import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Check,
  X,
  Phone,
  User,
  Building,
  Mail,
  MapPin,
  Upload,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Minus,
  Calendar,
  Clock,
  Package,
  Plane,
  Truck,
  Train,
  Shield,
  FileText,
  Camera,
  DollarSign,
  IndianRupee,
  Edit3,
  ArrowRight,
  Search,
  XCircle,
  SquarePen,
  Globe,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import med2Image from '../../assets/med-2.png';

const IndianFlagIcon = ({ className = "w-6 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 225 150" className={className}>
    <rect width="225" height="150" fill="#FF9933" />
    <rect y="50" width="225" height="50" fill="#FFFFFF" />
    <rect y="100" width="225" height="50" fill="#138808" />
    <g transform="translate(112.5,75)">
      <circle r="20" fill="#000080" />
      <circle r="17.5" fill="#FFFFFF" />
      <circle r="3.5" fill="#000080" />
      {/* Simplified Chakra for small size */}
      {[...Array(24)].map((_, i) => (
        <rect key={i} width="1" height="17.5" x="-0.5" y="0" transform={`rotate(${i * 15})`} fill="#000080" />
      ))}
    </g>
  </svg>
);

const GstIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="3.5"
      y="5"
      width="17"
      height="14"
      rx="3"
      ry="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M3.5 9.5h17"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <text
      x="12"
      y="16.2"
      textAnchor="middle"
      fontSize="7"
      fontWeight="700"
      fill="currentColor"
      fontFamily="Segoe UI, Arial, sans-serif"
    >
      GST
    </text>
  </svg>
);

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

const formatIndianNumber = (input: string) => {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  const lastThree = digits.slice(-3);
  const otherDigits = digits.slice(0, -3);
  if (!otherDigits) return lastThree;
  const formattedOther = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${formattedOther},${lastThree}`;
};

const BookingSuccessAnimation: React.FC<{ consignmentNumber?: string | number | null }> = ({ consignmentNumber }) => {
  return (
    <div className="success-animation-overlay">
      <div className="success-animation-wrapper">
        <div className="success-animation-circle">
          <div className="success-animation-ring" />
          <svg
            className="success-animation-check"
            viewBox="0 0 52 52"
            aria-hidden="true"
          >
            <circle className="success-animation-check-circle" cx="26" cy="26" r="25" />
            <path
              className="success-animation-check-mark"
              fill="none"
              d="M16 26.5 22.5 33l13-13"
            />
          </svg>
        </div>
        <div className="success-animation-text">
          <p className="success-animation-heading">Booking Confirmed</p>
          {consignmentNumber && (
            <p className="success-animation-subtext">
              Consignment #{consignmentNumber}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom Radio Button Component
interface RadioButtonOption {
  value: string;
  label: string;
}

interface CustomRadioGroupProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioButtonOption[];
  required?: boolean;
  icon?: React.ReactNode;
  allowWrap?: boolean;
  justifyBetween?: boolean;
  showLabel?: boolean;
}

const CustomRadioGroup: React.FC<CustomRadioGroupProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  icon,
  allowWrap = false,
  justifyBetween = false,
  showLabel = true
}) => {
  const optionLayoutClasses = [
    'flex flex-wrap gap-x-6 gap-y-3 items-center',
    allowWrap ? 'md:flex-wrap' : 'md:flex-nowrap',
    !allowWrap && justifyBetween ? 'justify-between w-full' : 'justify-start'
  ].join(' ');

  return (
    <div className="space-y-3">
      {showLabel && (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/60 rounded-xl text-sm font-semibold text-blue-700 shadow-sm">
          {label}:
        </div>
      )}
      <div
        className={
          justifyBetween
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-y-3 gap-x-6 items-center'
            : optionLayoutClasses
        }
      >
        {options.map((option, index) => {
          const optionId = `${name}-${option.value}`;
          const isActive = value === option.value;
          return (
            <div
              key={option.value}
              className={`radio-wrapper-24 ${isActive ? 'active' : ''}`}
              onClick={() => onChange(option.value)}
            >
              <input
                type="radio"
                name={name}
                id={optionId}
                value={option.value}
                checked={isActive}
                onChange={(e) => onChange(e.target.value)}
              />
              <label htmlFor={optionId} className="ml-2">
                <span>{option.label}</span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Stepper Component
interface StepperProps {
  currentStep: number;
  steps: string[];
  completedSteps: boolean[];
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps, completedSteps }) => {
  return (
    <div className="w-full py-2 -mt-2 mb-10 flex justify-center">
      <div className="flex items-center justify-center max-w-[450px] w-full">
        <div className="flex items-center justify-center w-full">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`
                    w-[24px] h-[24px] rounded-full flex items-center justify-center text-[9px] font-bold
                    transition-all duration-300 border
                    ${completedSteps[index]
                      ? 'bg-green-500 text-white border-green-500'
                      : currentStep === index
                        ? 'bg-[#406ab9] text-white border-[#406ab9] shadow-md scale-110'
                        : 'bg-white text-gray-400 border-gray-300'
                    }
                  `}
                >
                  {completedSteps[index] ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                <span
                  className={`
                    absolute top-7 text-[10px] font-medium text-center whitespace-nowrap
                    ${currentStep === index ? 'text-[#406ab9] font-bold' : 'text-gray-400'}
                  `}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-[1.5px] mx-1 transition-all duration-300
                    ${completedSteps[index] ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </React.Fragment>
          ))}
        </div>
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
  placeholder?: string;
  hasValidationError?: boolean;
  validationErrorMessage?: string;
  compact?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
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
  placeholder = '',
  hasValidationError = false,
  validationErrorMessage = '',
  compact = false,
  onBlur,
  onFocus
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = isFocused || hasValue;
  // For date inputs, start as text to hide browser's placeholder until focus
  const [internalType, setInternalType] = useState(type === 'date' ? 'text' : type);

  // Keep internal type in sync if the original type prop changes
  useEffect(() => {
    setInternalType(type === 'date' ? 'text' : type);
  }, [type]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}
        <input
          type={internalType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            setIsFocused(true);
            if (type === 'date') {
              setInternalType('date');
            }
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (type === 'date' && !value) {
              setInternalType('text');
            }
            if (onBlur) onBlur(e);
          }}
          maxLength={maxLength}
          disabled={disabled}
          className={`
            w-full ${compact ? 'h-8' : 'h-9'} px-3 ${icon ? 'pl-10' : 'pl-3'} pr-3
            border rounded-xl bg-white/90 backdrop-blur-sm shadow-none transition-shadow
            transition-all duration-200 ease-in-out ${compact ? 'text-xs' : 'text-sm'}
            ${hasValidationError
              ? 'border-red-500 ring-2 ring-red-200'
              : isFocused
                ? 'border-[#406ab9] ring-2 ring-[#4ec0f7]/20 shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)]'
                : 'border-gray-300/60 hover:border-[#406ab9] hover:ring-2 hover:ring-[#4ec0f7]/20 hover:shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)]'
            }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
            focus:outline-none text-gray-700
          `}
          placeholder={shouldFloat ? (placeholder || "") : ""}
          aria-disabled={disabled}
        />

        <label
          className={`
            absolute ${shouldFloat ? 'left-3' : (icon ? 'left-10' : 'left-3')} 
            transition-all duration-200 ease-in-out
            pointer-events-none select-none
            ${shouldFloat
              ? 'top-0 -translate-y-1/2 text-[10px] bg-white px-1 text-[#406ab9] font-medium text-left'
              : compact
                ? 'top-1/2 -translate-y-1/2 text-xs text-[#64748b] text-left'
                : 'top-1/2 -translate-y-1/2 text-sm text-[#64748b] text-left'
            }
            ${isFocused && !hasValue ? 'text-[#406ab9]' : ''}
          `}
        >
          {label.trim().endsWith(':') ? label : `${label}:`}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* Validation Error Message */}
      {hasValidationError && validationErrorMessage && (
        <div className="mt-1">
          <div className="text-xs text-red-600">
            {validationErrorMessage}
          </div>
        </div>
      )}
    </div>
  );
};

// Floating Select Component
interface FloatingSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string, label: string }[];
  required?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  icon,
  disabled = false,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = isFocused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={`
            w-full h-9 px-3 ${icon ? 'pl-10' : 'pl-3'} pr-8
            border rounded-xl bg-white/90 backdrop-blur-sm text-sm shadow-none transition-shadow
            transition-all duration-200 ease-in-out
            ${isFocused
              ? 'border-[#406ab9] ring-2 ring-[#4ec0f7]/20 shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)]'
              : 'border-gray-300/60 hover:border-[#406ab9] hover:ring-2 hover:ring-[#4ec0f7]/20 hover:shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)]'
            }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
            focus:outline-none text-gray-700 appearance-none
          `}
        >
          <option value="" disabled hidden></option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label
          className={`
            absolute ${shouldFloat ? 'left-3' : (icon ? 'left-10' : 'left-3')}
            transition-all duration-200 ease-in-out
            pointer-events-none select-none
            ${shouldFloat
              ? 'top-0 -translate-y-1/2 text-[10px] bg-white px-1 text-[#406ab9] font-medium text-left'
              : 'top-1/2 -translate-y-1/2 text-sm text-[#64748b] text-left'
            }
            ${isFocused && !hasValue ? 'text-[#406ab9]' : ''}
          `}
        >
          {label.trim().endsWith(':') ? label : `${label}:`}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Floating Textarea Component
interface FloatingTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  className?: string;
}

const FloatingTextarea: React.FC<FloatingTextareaProps> = ({
  label,
  value,
  onChange,
  required = false,
  rows = 4,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = isFocused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={rows}
          className={`
            w-full px-3 pt-5 pb-3 text-sm
            border rounded-xl bg-white/90 backdrop-blur-sm resize-none shadow-none transition-shadow
            transition-all duration-200 ease-in-out
            ${isFocused
              ? 'border-[#406ab9] ring-2 ring-[#4ec0f7]/20 shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)]'
              : 'border-gray-300/60 hover:border-[#406ab9]/50 hover:shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)]'
            }
            focus:outline-none text-gray-700
          `}
          placeholder=""
        />
        <label
          className={`
            absolute left-3
            transition-all duration-200 ease-in-out
            pointer-events-none select-none
            ${shouldFloat
              ? 'top-0 -translate-y-1/2 text-[10px] bg-white px-1 text-blue-600 font-medium text-left'
              : 'top-6 text-sm text-gray-500 text-left'
            }
            ${isFocused && !hasValue ? 'text-blue-500' : ''}
          `}
        >
          {label.trim().endsWith(':') ? label : `${label}:`}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
    </div>
  );
};

// Upload Box Component
interface UploadBoxProps {
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

const UploadBox: React.FC<UploadBoxProps> = ({ label, files, onFilesChange, maxFiles = 5 }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        const fileType = (file as File).type;
        return fileType.startsWith('image/') || fileType === 'application/pdf';
      });

      // Limit to maxFiles
      const remainingSlots = maxFiles - files.length;
      const filesToAdd = validFiles.slice(0, remainingSlots);

      onFilesChange([...files, ...filesToAdd]);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div className="flex flex-col">
      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`
          bg-gradient-to-b from-blue-50/50 to-white
          border-2 border-dashed rounded-xl p-4
          transition-all duration-300 cursor-pointer
          border-gray-300 hover:border-blue-400 hover:bg-blue-50/70 hover:shadow-sm
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex items-center justify-center space-x-3">
          <Upload className="w-6 h-6 text-blue-600" />
          <div className="text-left">
            <p className="text-sm font-medium text-blue-700">{label}</p>
            <p className="text-xs text-gray-500">JPG, PNG, WEBP, PDF (Max {maxFiles} files)</p>
          </div>
        </div>
      </div>

      {/* Uploaded Files Gallery */}
      {files.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-blue-400 transition-all duration-200">
                  {file && (file as File).type?.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow-md"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface EditModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}

const EditModal: React.FC<EditModalProps> = ({ title, isOpen, onClose, onSave, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-5">{children}</div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-xl bg-[#406ab9] text-white font-semibold hover:bg-[#3059a0] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const MedicineBookingPanel: React.FC = () => {
  // State for stepper
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false, false, false, false]);

  // State for submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [consignmentNumber, setConsignmentNumber] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<'origin' | 'destination' | 'shipment' | 'invoice' | 'billing' | null>(null);

  // State for consignment availability check
  const [consignmentAvailable, setConsignmentAvailable] = useState<boolean | null>(null);
  const [consignmentCheckError, setConsignmentCheckError] = useState<string | null>(null);

  // State for step validation errors
  const [stepValidationError, setStepValidationError] = useState<string | null>(null);

  // Steps configuration
  const steps = ['Origin', 'Destination', 'Shipment', 'Invoice', 'Billing', 'Preview'];

  useEffect(() => {
    if (!showSuccessAnimation) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSuccessAnimation(false);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [showSuccessAnimation]);

  // State for origin data
  const [originData, setOriginData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    companyName: '',
    flatBuilding: '',
    locality: '',
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

  // State for destination data
  const [destinationData, setDestinationData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    companyName: '',
    flatBuilding: '',
    locality: '',
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

  // Pincode lookup states
  const [originAreas, setOriginAreas] = useState<string[]>([]);
  const [destinationAreas, setDestinationAreas] = useState<string[]>([]);
  const [originPinError, setOriginPinError] = useState<string | null>(null);
  const [destinationPinError, setDestinationPinError] = useState<string | null>(null);

  // GST validation states
  const [originGstError, setOriginGstError] = useState(false);
  const [destinationGstError, setDestinationGstError] = useState(false);

  // State for tabs (Origin)
  const [originActiveTab, setOriginActiveTab] = useState<'phone' | 'company'>('phone');
  
  // State for phone number verification (Origin)
  const [originMobileDigits, setOriginMobileDigits] = useState<string[]>(Array(10).fill(''));
  const [originUserFound, setOriginUserFound] = useState<boolean | null>(null);
  const [originUserAddresses, setOriginUserAddresses] = useState<any[]>([]);
  const [selectedOriginAddressId, setSelectedOriginAddressId] = useState<string | null>(null);
  const [originAddressDeliveryConfirmed, setOriginAddressDeliveryConfirmed] = useState(false);
  const [showOriginSummaryCard, setShowOriginSummaryCard] = useState(false);
  const [showOriginManualForm, setShowOriginManualForm] = useState(false);
  
  // State for company name (Origin)
  const [originCompanyNames, setOriginCompanyNames] = useState<string[]>([]);
  const [originCompanySearch, setOriginCompanySearch] = useState('');
  const [originSelectedCompany, setOriginSelectedCompany] = useState<string | null>(null);
  
  // State for OTP verification (Origin only)
  const [showOriginOtpPopup, setShowOriginOtpPopup] = useState(false);
  const [originOtpInput, setOriginOtpInput] = useState('');
  const [originOtpVerified, setOriginOtpVerified] = useState(false);
  const [showOriginOtpSuccess, setShowOriginOtpSuccess] = useState(false);
  const originOtpBoxCount = 6;
  const originOtpInputRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  // State for tabs (Destination)
  const [destinationActiveTab, setDestinationActiveTab] = useState<'phone' | 'company'>('phone');

  // State for phone number verification (Destination)
  const [destinationMobileDigits, setDestinationMobileDigits] = useState<string[]>(Array(10).fill(''));
  const [destinationUserFound, setDestinationUserFound] = useState<boolean | null>(null);
  const [destinationUserAddresses, setDestinationUserAddresses] = useState<any[]>([]);
  const [selectedDestinationAddressId, setSelectedDestinationAddressId] = useState<string | null>(null);
  const [destinationAddressDeliveryConfirmed, setDestinationAddressDeliveryConfirmed] = useState(false);
  const [showDestinationSummaryCard, setShowDestinationSummaryCard] = useState(false);
  const [showDestinationManualForm, setShowDestinationManualForm] = useState(false);
  
  // State for company name (Destination)
  const [destinationCompanyNames, setDestinationCompanyNames] = useState<string[]>([]);
  const [destinationCompanySearch, setDestinationCompanySearch] = useState('');
  const [destinationSelectedCompany, setDestinationSelectedCompany] = useState<string | null>(null);

  // Lookup helper to fetch past addresses by phone
  const fetchAddressesByPhone = async (phone: string, role: 'origin' | 'destination') => {
    try {
      console.log(`[MedicineBooking] Looking up ${role} addresses for phone: ${phone}`);
      const token = localStorage.getItem('medicineToken');
      const url = `/api/medicine/bookings/lookup?phone=${encodeURIComponent(phone)}&role=${role}`;
      console.log(`[MedicineBooking] Fetching from: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      console.log(`[MedicineBooking] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MedicineBooking] Lookup failed: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`[MedicineBooking] Lookup response:`, data);

      const addresses = Array.isArray(data.addresses) ? data.addresses : [];
      console.log(`[MedicineBooking] Found ${addresses.length} ${role} address(es)`);

      return addresses;
    } catch (e) {
      console.error('[MedicineBooking] Lookup request failed:', e);
      return [];
    }
  };

  // Fetch company names for a role
  const fetchCompanyNames = async (role: 'origin' | 'destination') => {
    try {
      console.log(`[MedicineBooking] Fetching company names for ${role}`);
      const token = localStorage.getItem('medicineToken');
      const url = `/api/medicine/bookings/company-names?role=${role}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        console.error(`[MedicineBooking] Failed to fetch company names: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const companyNames = Array.isArray(data.companyNames) ? data.companyNames.filter((name: string) => name && name.trim() !== '') : [];
      console.log(`[MedicineBooking] Found ${companyNames.length} company name(s) for ${role}`);
      return companyNames;
    } catch (e) {
      console.error('[MedicineBooking] Error fetching company names:', e);
      return [];
    }
  };

  // Lookup helper to fetch past addresses by company name
  const fetchAddressesByCompanyName = async (companyName: string, role: 'origin' | 'destination') => {
    try {
      console.log(`[MedicineBooking] Looking up ${role} addresses for company: ${companyName}`);
      const token = localStorage.getItem('medicineToken');
      const url = `/api/medicine/bookings/lookup?companyName=${encodeURIComponent(companyName)}&role=${role}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MedicineBooking] Lookup failed: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const addresses = Array.isArray(data.addresses) ? data.addresses : [];
      console.log(`[MedicineBooking] Found ${addresses.length} ${role} address(es) for company`);

      return addresses;
    } catch (e) {
      console.error('[MedicineBooking] Lookup request failed:', e);
      return [];
    }
  };

  // State for shipment data
  const [shipmentData, setShipmentData] = useState({
    natureOfConsignment: 'NON-DOX',
    services: 'Standard',
    mode: 'Surface',
    insurance: 'Consignor not insured the shipment',
    riskCoverage: 'Owner',
    dimensions: [{ length: '', breadth: '', height: '', unit: 'cm' }],
    actualWeight: '',
    perKgWeight: '',
    volumetricWeight: 0,
    chargeableWeight: 0
  });

  // State for package data
  const [packageData, setPackageData] = useState({
    totalPackages: '',
    materials: '',
    packageImages: [] as File[],
    contentDescription: ''
  });


  // State for invoice data
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    invoiceValue: '',
    invoiceImages: [] as File[],
    eWaybillNumber: '',
    acceptTerms: false,
    panCard: null as File | null,
    declarationForm: null as File | null
  });

  // State for bill data
  const [billData, setBillData] = useState({
    partyType: 'sender',
    billType: 'normal'
  });

  // State for details data
  const [detailsData, setDetailsData] = useState({
    freightCharge: '0.00',
    awbCharge: '0.00',
    localCollection: '0.00',
    doorDelivery: '0.00',
    loadingUnloading: '0.00',
    demurrageCharge: '0.00',
    ddaCharge: '0.00',
    hamaliCharge: '0.00',
    packingCharge: '0.00',
    otherCharge: '0.00',
    total: '0.00',
    fuelCharge: '0.00',
    fuelChargeType: 'percentage',
    gstAmount: '0.00',
    sgstAmount: '0.00',
    cgstAmount: '0.00',
    igstAmount: '0.00',
    grandTotal: '0.00'
  });

  // State for payment data
  const [paymentData, setPaymentData] = useState({
    mode: '',
    deliveryType: ''
  });
  const [isInvoiceValueFocused, setIsInvoiceValueFocused] = useState(false);

  // Handle step navigation
  const handleNextStep = async () => {
    // Clear previous validation error
    setStepValidationError(null);

    // Validate current step before proceeding
    let isValid = true;
    let errorMessage = '';

    switch (currentStep) {
      case 0: // Origin Details - mobile number/company name and address confirmation required
        const originMobileNumber = originMobileDigits.filter(digit => digit !== '').join('');
        const originFormsVisible = showOriginManualForm || showOriginSummaryCard || originUserFound === false;

        if (!originFormsVisible) {
          // Check if using phone number tab
          if (originActiveTab === 'phone') {
            if (originMobileNumber.length !== 10) {
              isValid = false;
              errorMessage = 'Please enter a valid 10-digit mobile number';
              break;
            }
            await lookupOriginUserInDatabase(originMobileNumber);
            return;
          } else if (originActiveTab === 'company') {
            // Check if company is selected
            if (!originSelectedCompany) {
              isValid = false;
              errorMessage = 'Please select a company name';
              break;
            }
            // Company selection already triggers address lookup, so check if we have results
            if (originUserFound === null) {
              // Still loading or not yet processed
              isValid = false;
              errorMessage = 'Please wait for address lookup to complete';
              break;
            }
            // If we reach here, company was selected and lookup completed
            // Continue to validation below
          }
        }

        // For origin, we just need a valid phone number/company and confirmed address (either selected or manually filled)
        // If user filled manual form, use the validation function which checks all required fields
        if (showOriginManualForm || originUserFound === false) {
          if (originActiveTab === 'phone' && originMobileNumber.length !== 10) {
            isValid = false;
            errorMessage = 'Please enter a valid 10-digit mobile number';
          } else if (originActiveTab === 'company' && !originSelectedCompany) {
            isValid = false;
            errorMessage = 'Please select a company name';
          } else if (!isOriginFormValid()) {
            isValid = false;
            errorMessage = 'Please fill all required fields in the Origin Details form';
          }
        } else {
          // If user selected an address, check if it's confirmed
          if (originActiveTab === 'phone' && originMobileNumber.length !== 10) {
            isValid = false;
            errorMessage = 'Please enter a valid 10-digit mobile number';
          } else if (originActiveTab === 'company' && !originSelectedCompany) {
            isValid = false;
            errorMessage = 'Please select a company name';
          } else if (!originAddressDeliveryConfirmed) {
            isValid = false;
            errorMessage = 'Please select and confirm a delivery address';
          }
        }
        break;

      case 1: // Destination Details - mobile number/company name and address confirmation required
        const destinationMobileNumber = destinationMobileDigits.filter(digit => digit !== '').join('');
        const destinationFormsVisible = showDestinationManualForm || showDestinationSummaryCard || destinationUserFound === false;

        if (!destinationFormsVisible) {
          // Check if using phone number tab
          if (destinationActiveTab === 'phone') {
            if (destinationMobileNumber.length !== 10) {
              isValid = false;
              errorMessage = 'Please enter a valid 10-digit mobile number';
              break;
            }
            await lookupDestinationUserInDatabase(destinationMobileNumber);
            return;
          } else if (destinationActiveTab === 'company') {
            // Check if company is selected
            if (!destinationSelectedCompany) {
              isValid = false;
              errorMessage = 'Please select a company name';
              break;
            }
            // Company selection already triggers address lookup, so check if we have results
            if (destinationUserFound === null) {
              // Still loading or not yet processed
              isValid = false;
              errorMessage = 'Please wait for address lookup to complete';
              break;
            }
            // If we reach here, company was selected and lookup completed
            // Continue to validation below
          }
        }

        // For destination, we just need a valid phone number/company and confirmed address (either selected or manually filled)
        // If user filled manual form, use the validation function which checks all required fields
        if (showDestinationManualForm || destinationUserFound === false) {
          if (destinationActiveTab === 'phone' && destinationMobileNumber.length !== 10) {
            isValid = false;
            errorMessage = 'Please enter a valid 10-digit mobile number';
          } else if (destinationActiveTab === 'company' && !destinationSelectedCompany) {
            isValid = false;
            errorMessage = 'Please select a company name';
          } else if (!isDestinationFormValid()) {
            isValid = false;
            errorMessage = 'Please fill all required fields in the Destination Details form';
          }
        } else {
          // If user selected an address, check if it's confirmed
          if (destinationActiveTab === 'phone' && destinationMobileNumber.length !== 10) {
            isValid = false;
            errorMessage = 'Please enter a valid 10-digit mobile number';
          } else if (destinationActiveTab === 'company' && !destinationSelectedCompany) {
            isValid = false;
            errorMessage = 'Please select a company name';
          } else if (!destinationAddressDeliveryConfirmed) {
            isValid = false;
            errorMessage = 'Please select and confirm a delivery address';
          }
        }
        break;

      case 2: // Shipment Details
        if (!shipmentData.natureOfConsignment) {
          isValid = false;
          errorMessage = 'Please select Nature of Consignment';
        } else if (!shipmentData.services) {
          isValid = false;
          errorMessage = 'Please select Services';
        } else if (!shipmentData.mode) {
          isValid = false;
          errorMessage = 'Please select Mode';
        } else if (!shipmentData.insurance) {
          isValid = false;
          errorMessage = 'Please select Insurance';
        } else if (!shipmentData.riskCoverage) {
          isValid = false;
          errorMessage = 'Please select Risk Coverage';
        } else if (!packageData.totalPackages) {
          isValid = false;
          errorMessage = 'Please enter Total Packages';
        } else if (!packageData.materials) {
          isValid = false;
          errorMessage = 'Please enter Materials';
        }
        break;

      case 3: // Invoice Information
        if (!invoiceData.invoiceNumber) {
          isValid = false;
          errorMessage = 'Please enter Invoice Number';
        } else if (!invoiceData.invoiceValue) {
          isValid = false;
          errorMessage = 'Please enter Invoice Value';
        } else if (parseFloat(invoiceData.invoiceValue) >= 50000 && !invoiceData.eWaybillNumber) {
          isValid = false;
          errorMessage = 'E-Waybill Number is required for invoice values above ₹50,000';
        } else if (!invoiceData.acceptTerms) {
          isValid = false;
          errorMessage = 'Please accept the Terms & Conditions';
        }
        break;

      case 4: // Billing Information
        if (!billData.partyType) {
          isValid = false;
          errorMessage = 'Please select Paid By';
        } else if (!billData.billType) {
          isValid = false;
          errorMessage = 'Please select Bill Type';
        }
        break;

      case 5: // Preview - no validation needed, user can submit
        break;

      default:
        isValid = true;
    }

    if (isValid && currentStep < steps.length - 1) {
      const newCompletedSteps = [...completedSteps];
      newCompletedSteps[currentStep] = true;
      setCompletedSteps(newCompletedSteps);
      setCurrentStep(currentStep + 1);
    } else if (!isValid) {
      // setStepValidationError(errorMessage);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle origin input changes
  const handleOriginChange = (field: string, value: string) => {
    setOriginData(prev => ({ ...prev, [field]: value }));
  };

  // Handle destination input changes
  const handleDestinationChange = (field: string, value: string) => {
    setDestinationData(prev => ({ ...prev, [field]: value }));
  };

  // Helper to parse backend pincode response into flat values
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

  // Auto-fill address data from pincode via backend
  const autoFillFromPincode = async (pincode: string, type: 'origin' | 'destination') => {
    try {
      if (type === 'origin') {
        setOriginPinError(null);
      } else {
        setDestinationPinError(null);
      }

      // Validate pincode format before making API call
      if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
        throw new Error('Invalid pincode format');
      }

      const { data } = await axios.get(`${API_BASE}/api/pincode/${pincode}`);
      if (!data) throw new Error('Invalid pincode');

      const parsed = parsePincodeResponse(data);
      const updateData = {
        city: parsed.city || '',
        district: parsed.district || '',
        state: parsed.state || ''
      };
      const areas: string[] = parsed.areas || [];

      if (type === 'origin') {
        setOriginData(prev => ({ ...prev, ...updateData }));
        setOriginAreas(areas);
      } else {
        setDestinationData(prev => ({ ...prev, ...updateData }));
        setDestinationAreas(areas);
      }
    } catch (err: any) {
      console.error(`Error fetching pincode data for ${type}:`, err);
      // Don't show error message for unserviceable pincodes
      // Just set empty areas array to show disabled dropdown
      if (type === 'origin') {
        setOriginPinError(null);
        setOriginAreas([]);
      } else {
        setDestinationPinError(null);
        setDestinationAreas([]);
      }
    }
  };

  // GST validation function
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
      } else if (i === 11) {
        // 12th character: Alphabet only
        if (/[A-Z]/.test(char)) {
          formattedValue += char;
        }
      } else if (i === 12) {
        // 13th character: Entity code (1-9, then A-Z)
        if (/[1-9A-Z]/.test(char)) {
          formattedValue += char;
        }
      } else if (i === 13) {
        // 14th character: Always Z
        formattedValue += 'Z';
      } else if (i === 14) {
        // 15th character: Checksum (can be number or alphabet)
        if (/[0-9A-Z]/.test(char)) {
          formattedValue += char;
        }
      }
    }

    return formattedValue;
  };

  // Handle shipment input changes
  const handleShipmentChange = (field: string, value: string) => {
    setShipmentData(prev => ({ ...prev, [field]: value }));
  };

  // Handle dimension changes
  const handleDimensionChange = (index: number, field: string, value: string) => {
    const newDimensions = [...shipmentData.dimensions];
    newDimensions[index] = { ...newDimensions[index], [field]: value };
    setShipmentData(prev => ({ ...prev, dimensions: newDimensions }));
  };

  // Handle package input changes
  const handlePackageChange = (field: string, value: string) => {
    setPackageData(prev => ({ ...prev, [field]: value }));
  };

  // Handle package file changes
  const handlePackageFileChange = (field: string, files: File[]) => {
    setPackageData(prev => ({ ...prev, [field]: files }));
  };

  // Handle invoice input changes
  const handleInvoiceChange = (field: string, value: string) => {
    if (field === 'invoiceValue') {
      // Remove .00 if present at the end, then remove all non-digit characters
      let cleanedValue = value.replace(/\.00$/, '').replace(/\D/g, '');
      setInvoiceData(prev => ({ ...prev, [field]: cleanedValue }));
      return;
    }
    if (field === 'eWaybillNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 12);
      setInvoiceData(prev => ({ ...prev, [field]: digitsOnly }));
      return;
    }
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  // Handle invoice file changes
  const handleInvoiceFileChange = (field: string, files: File[]) => {
    setInvoiceData(prev => ({ ...prev, [field]: files }));
  };

  // Handle single file upload for PAN Card and Declaration Form
  const handleSingleFileChange = (field: 'panCard' | 'declarationForm', file: File | null) => {
    setInvoiceData(prev => ({ ...prev, [field]: file }));
  };

  // Handle bill input changes
  const handleBillChange = (field: string, value: string) => {
    setBillData(prev => ({ ...prev, [field]: value }));
  };

  // Format price to 2 decimal places
  const formatPriceToTwoDecimals = (value: string): string => {
    if (!value || value === '') return '0.00';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0.00';
    return numValue.toFixed(2);
  }



  // Handle details input changes
  const handleDetailsChange = (field: string, value: string) => {
    // Allow user to type numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDetailsData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle price field blur to format to 2 decimal places
  const handlePriceBlur = (field: string, value: string) => {
    const formattedValue = formatPriceToTwoDecimals(value);
    setDetailsData(prev => ({ ...prev, [field]: formattedValue }));
  };

  // Handle payment input changes
  const handlePaymentChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  // Handle origin mobile digit change
  const handleOriginDigitChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^[0-9]*$/.test(value)) return; // Only allow numbers

    const newDigits = [...originMobileDigits];
    newDigits[index] = value;
    setOriginMobileDigits(newDigits);

    // Update origin data with mobile number
    const mobileNumber = newDigits.filter(digit => digit !== '').join('');
    setOriginData(prev => ({ ...prev, mobileNumber }));

    // Auto-focus next input
    if (value && index < 9) {
      const nextInput = document.getElementById(`origin-digit-${index + 1}`);
      nextInput?.focus();
    }

  };

  // Handle origin mobile digit key down
  const handleOriginDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !originMobileDigits[index] && index > 0) {
      const prevInput = document.getElementById(`origin-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Handle destination mobile digit change
  const handleDestinationDigitChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^[0-9]*$/.test(value)) return; // Only allow numbers

    const newDigits = [...destinationMobileDigits];
    newDigits[index] = value;
    setDestinationMobileDigits(newDigits);

    // Update destination data with mobile number
    const mobileNumber = newDigits.filter(digit => digit !== '').join('');
    setDestinationData(prev => ({ ...prev, mobileNumber }));

    // Auto-focus next input
    if (value && index < 9) {
      const nextInput = document.getElementById(`dest-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle destination mobile digit key down
  const handleDestinationDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !destinationMobileDigits[index] && index > 0) {
      const prevInput = document.getElementById(`dest-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Fetch company names when company tab is active
  useEffect(() => {
    if (originActiveTab === 'company' && originCompanyNames.length === 0) {
      fetchCompanyNames('origin').then(names => {
        setOriginCompanyNames(names);
      });
    }
  }, [originActiveTab]);

  useEffect(() => {
    if (destinationActiveTab === 'company' && destinationCompanyNames.length === 0) {
      fetchCompanyNames('destination').then(names => {
        setDestinationCompanyNames(names);
      });
    }
  }, [destinationActiveTab]);

  // Handle origin company name selection
  const handleOriginCompanySelect = async (companyName: string) => {
    setOriginSelectedCompany(companyName);
    setOriginCompanySearch('');
    const addresses = await fetchAddressesByCompanyName(companyName, 'origin');
    
    if (addresses.length > 0) {
      const address = addresses[0];
      setOriginUserFound(true);
      setOriginUserAddresses(addresses);
      setSelectedOriginAddressId(addresses[0].id);
      setShowOriginSummaryCard(true);
      setShowOriginManualForm(false);
      
      setOriginData(prev => ({
        ...prev,
        name: address.name || '',
        mobileNumber: address.mobileNumber || '',
        email: address.email || '',
        companyName: address.companyName || companyName,
        flatBuilding: address.flatBuilding || '',
        locality: address.locality || '',
        landmark: address.landmark || '',
        pincode: address.pincode || '',
        city: address.city || '',
        district: address.district || '',
        state: address.state || '',
        gstNumber: address.gstNumber || '',
        addressType: address.addressType || 'Home',
        website: address.website || '',
        anniversary: address.anniversary || '',
        birthday: address.birthday || '',
        alternateNumber: address.alternateNumber || '',
      }));
    } else {
      setOriginUserFound(false);
      setOriginUserAddresses([]);
      setShowOriginSummaryCard(false);
      setShowOriginManualForm(true);
      setOriginData(prev => ({
        ...prev,
        companyName: companyName,
      }));
    }
  };

  // Handle destination company name selection
  const handleDestinationCompanySelect = async (companyName: string) => {
    setDestinationSelectedCompany(companyName);
    setDestinationCompanySearch('');
    const addresses = await fetchAddressesByCompanyName(companyName, 'destination');
    
    if (addresses.length > 0) {
      const address = addresses[0];
      setDestinationUserFound(true);
      setDestinationUserAddresses(addresses);
      setSelectedDestinationAddressId(addresses[0].id);
      setShowDestinationSummaryCard(true);
      setShowDestinationManualForm(false);
      
      setDestinationData(prev => ({
        ...prev,
        name: address.name || '',
        mobileNumber: address.mobileNumber || '',
        email: address.email || '',
        companyName: address.companyName || companyName,
        flatBuilding: address.flatBuilding || '',
        locality: address.locality || '',
        landmark: address.landmark || '',
        pincode: address.pincode || '',
        city: address.city || '',
        district: address.district || '',
        state: address.state || '',
        gstNumber: address.gstNumber || '',
        addressType: address.addressType || 'Home',
        website: address.website || '',
        anniversary: address.anniversary || '',
        birthday: address.birthday || '',
        alternateNumber: address.alternateNumber || '',
      }));
    } else {
      setDestinationUserFound(false);
      setDestinationUserAddresses([]);
      setShowDestinationSummaryCard(false);
      setShowDestinationManualForm(true);
      setDestinationData(prev => ({
        ...prev,
        companyName: companyName,
      }));
    }
  };

  // Reset origin mobile input
  const resetOriginMobileInput = () => {
    setOriginMobileDigits(Array(10).fill(''));
    setOriginUserFound(null);
    setOriginUserAddresses([]);
    setSelectedOriginAddressId(null);
    setOriginAddressDeliveryConfirmed(false);
    setShowOriginSummaryCard(false);
    setShowOriginManualForm(false);
    setOriginData(prev => ({ ...prev, mobileNumber: '' }));
    // Reset OTP state
    setShowOriginOtpPopup(false);
    setOriginOtpInput('');
    setOriginOtpVerified(false);
    setShowOriginOtpSuccess(false);
    // Reset company selection
    setOriginSelectedCompany(null);
    setOriginCompanySearch('');
  };

  // Reset destination mobile input
  const resetDestinationMobileInput = () => {
    setDestinationMobileDigits(Array(10).fill(''));
    setDestinationUserFound(null);
    setDestinationUserAddresses([]);
    setSelectedDestinationAddressId(null);
    setDestinationAddressDeliveryConfirmed(false);
    setShowDestinationSummaryCard(false);
    setShowDestinationManualForm(false);
    setDestinationData(prev => ({ ...prev, mobileNumber: '' }));
    // Reset company selection
    setDestinationSelectedCompany(null);
    setDestinationCompanySearch('');
  };

  // Handle origin OTP send
  const handleSendOriginOtp = async (mobileNumber: string) => {
    if (mobileNumber.length === 10) {
      try {
        const response = await fetch('/api/otp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: mobileNumber
          })
        });

        const result = await response.json();
        
        if (result.success) {
          setShowOriginOtpPopup(true);
        } else {
          console.error('Failed to send OTP:', result.error);
        }
      } catch (error) {
        console.error('Error sending OTP:', error);
      }
    }
  };

  // Handle origin OTP verification
  const handleOriginOtpVerification = async (mobileNumber: string) => {
    if (originOtpInput.length !== 6) {
      return;
    }

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: mobileNumber,
          otp: originOtpInput
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setOriginOtpVerified(true);
        setShowOriginOtpSuccess(true);
        setShowOriginOtpPopup(false);
        // Now show the blank form
        setOriginUserFound(false);
        setOriginUserAddresses([]);
        setShowOriginSummaryCard(false);
        setShowOriginManualForm(true);
        
        // Hide success message after 2 seconds
        setTimeout(() => {
          setShowOriginOtpSuccess(false);
        }, 2000);
      } else {
        // Clear OTP input on failure
        setOriginOtpInput('');
        // Focus on first input
        setTimeout(() => {
          const firstInput = document.getElementById('origin-otp-0');
          firstInput?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      // Clear OTP input on error
      setOriginOtpInput('');
      setTimeout(() => {
        const firstInput = document.getElementById('origin-otp-0');
        firstInput?.focus();
      }, 100);
    }
  };

  // Helpers for OTP input boxes
  const setOriginOtpAtIndex = (index: number, digit: string) => {
    const padded = (originOtpInput + '      ').slice(0, originOtpBoxCount).split('');
    padded[index] = digit;
    const nextValue = padded.join('').replace(/\s/g, '');
    setOriginOtpInput(nextValue);
  };

  const handleOriginOtpBoxChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    if (!digit) return;
    setOriginOtpAtIndex(index, digit);
    const nextRef = originOtpInputRefs.current[index + 1];
    if (nextRef) nextRef.focus();
  };

  const handleOriginOtpBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentRef = originOtpInputRefs.current[index];
    if (e.key === 'Backspace') {
      const currentValuePresent = (originOtpInput[index] ?? '') !== '';
      if (currentValuePresent) {
        // clear current digit
        setOriginOtpAtIndex(index, '');
      } else if (index > 0) {
        const prevRef = originOtpInputRefs.current[index - 1];
        prevRef?.focus();
        setOriginOtpAtIndex(index - 1, '');
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      originOtpInputRefs.current[index - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === 'ArrowRight' && index < originOtpBoxCount - 1) {
      originOtpInputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handleOriginOtpPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, originOtpBoxCount);
    if (!text) return;
    setOriginOtpInput(text);
    // focus last filled box
    const focusIndex = Math.min(text.length, originOtpBoxCount) - 1;
    if (focusIndex >= 0) {
      setTimeout(() => originOtpInputRefs.current[focusIndex]?.focus(), 0);
    }
    e.preventDefault();
  };

  // Lookup origin user from database
  const lookupOriginUserInDatabase = async (mobileNumber: string) => {
    console.log(`[MedicineBooking] Looking up origin user for: ${mobileNumber}`);
    try {
      const addresses = await fetchAddressesByPhone(mobileNumber, 'origin');
      console.log(`[MedicineBooking] Origin lookup result:`, addresses);

      if (addresses.length > 0) {
        const address = addresses[0];
        console.log(`[MedicineBooking] Found origin address:`, address);

        setOriginUserFound(true);
        setOriginUserAddresses(addresses);
        setSelectedOriginAddressId(addresses[0].id);
        setShowOriginSummaryCard(true);
        setShowOriginManualForm(false);

        // Map the address data, preserving any existing 'area' field
        setOriginData(prev => ({
          ...prev,
          name: address.name || '',
          mobileNumber: address.mobileNumber || mobileNumber,
          email: address.email || '',
          companyName: address.companyName || '',
          flatBuilding: address.flatBuilding || '',
          locality: address.locality || '',
          landmark: address.landmark || '',
          pincode: address.pincode || '',
          city: address.city || '',
          district: address.district || '',
          state: address.state || '',
          gstNumber: address.gstNumber || '',
          addressType: address.addressType || 'Home',
          website: address.website || '',
          anniversary: address.anniversary || '',
          birthday: address.birthday || '',
          alternateNumber: address.alternateNumber || '',
          // Note: 'area' is not in the database, so we preserve the existing value
        }));

        console.log(`[MedicineBooking] Origin form autofilled successfully`);
      } else {
        console.log(`[MedicineBooking] No origin addresses found, showing OTP verification`);
        // Reset OTP state
        setOriginOtpInput('');
        setOriginOtpVerified(false);
        setShowOriginOtpSuccess(false);
        // Send OTP and show popup
        await handleSendOriginOtp(mobileNumber);
      }
    } catch (error) {
      console.error('[MedicineBooking] Error in origin lookup:', error);
      // Reset OTP state
      setOriginOtpInput('');
      setOriginOtpVerified(false);
      setShowOriginOtpSuccess(false);
      // Send OTP and show popup
      await handleSendOriginOtp(mobileNumber);
    }
  };

  // Lookup destination user from database
  const lookupDestinationUserInDatabase = async (mobileNumber: string) => {
    console.log(`[MedicineBooking] Looking up destination user for: ${mobileNumber}`);
    try {
      const addresses = await fetchAddressesByPhone(mobileNumber, 'destination');
      console.log(`[MedicineBooking] Destination lookup result:`, addresses);

      if (addresses.length > 0) {
        const address = addresses[0];
        console.log(`[MedicineBooking] Found destination address:`, address);

        setDestinationUserFound(true);
        setDestinationUserAddresses(addresses);
        setSelectedDestinationAddressId(addresses[0].id);
        setShowDestinationSummaryCard(true);
        setShowDestinationManualForm(false);

        // Map the address data, preserving any existing 'area' field
        setDestinationData(prev => ({
          ...prev,
          name: address.name || '',
          mobileNumber: address.mobileNumber || mobileNumber,
          email: address.email || '',
          companyName: address.companyName || '',
          flatBuilding: address.flatBuilding || '',
          locality: address.locality || '',
          landmark: address.landmark || '',
          pincode: address.pincode || '',
          city: address.city || '',
          district: address.district || '',
          state: address.state || '',
          gstNumber: address.gstNumber || '',
          addressType: address.addressType || 'Home',
          website: address.website || '',
          anniversary: address.anniversary || '',
          birthday: address.birthday || '',
          alternateNumber: address.alternateNumber || ''
          // Note: 'area' is not in the database, so we preserve the existing value
        }));

        console.log(`[MedicineBooking] Destination form autofilled successfully`);
      } else {
        console.log(`[MedicineBooking] No destination addresses found, showing manual form`);
        setDestinationUserFound(false);
        setDestinationUserAddresses([]);
        setShowDestinationSummaryCard(false);
        setShowDestinationManualForm(true);
      }
    } catch (error) {
      console.error('[MedicineBooking] Error in destination lookup:', error);
      setDestinationUserFound(false);
      setDestinationUserAddresses([]);
      setShowDestinationSummaryCard(false);
      setShowDestinationManualForm(true);
    }
  };

  // Handle origin address selection
  const handleOriginAddressSelect = (addressId: string) => {
    setSelectedOriginAddressId(addressId);
    setOriginAddressDeliveryConfirmed(false);

    // Update origin data with selected address
    const selectedAddress = originUserAddresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      setOriginData(prev => ({ ...prev, ...selectedAddress }));
    }
  };

  // Handle origin deliver here
  const handleOriginDeliverHere = () => {
    if (selectedOriginAddressId) {
      setOriginAddressDeliveryConfirmed(true);
    }
  };

  // Handle destination address selection
  const handleDestinationAddressSelect = (addressId: string) => {
    setSelectedDestinationAddressId(addressId);
    setDestinationAddressDeliveryConfirmed(false);

    // Update destination data with selected address
    const selectedAddress = destinationUserAddresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      setDestinationData(prev => ({ ...prev, ...selectedAddress }));
    }
  };

  // Handle destination deliver here
  const handleDestinationDeliverHere = () => {
    if (selectedDestinationAddressId) {
      setDestinationAddressDeliveryConfirmed(true);
    }
  };

  // Validate origin form - only check required fields
  const isOriginFormValid = () => {
    return (
      originData.name.trim() !== '' &&
      originData.mobileNumber.length === 10 &&
      originData.locality.trim() !== '' &&
      originData.pincode.trim() !== '' &&
      originData.area.trim() !== '' &&
      originData.city.trim() !== '' &&
      originData.district.trim() !== '' &&
      originData.state.trim() !== '' &&
      !originGstError // GST should be either empty or complete 15 digits
    );
  };

  // Validate destination form - only check required fields
  const isDestinationFormValid = () => {
    return (
      destinationData.name.trim() !== '' &&
      destinationData.mobileNumber.length === 10 &&
      destinationData.locality.trim() !== '' &&
      destinationData.pincode.trim() !== '' &&
      destinationData.area.trim() !== '' &&
      destinationData.city.trim() !== '' &&
      destinationData.district.trim() !== '' &&
      destinationData.state.trim() !== '' &&
      !destinationGstError // GST should be either empty or complete 15 digits
    );
  };

  // Clear validation error when step changes
  useEffect(() => {
    setStepValidationError(null);
    // Also clear submit error when navigating between steps
    setSubmitError(null);
  }, [currentStep]);

  // Clear submit error on component mount to prevent showing stale errors
  useEffect(() => {
    setSubmitError(null);
  }, []);

  // Clear submit error when user starts entering data in any form field
  useEffect(() => {
    // Clear error when user starts interacting with origin data
    const hasOriginData = originData.name || originData.mobileNumber || originData.locality || originData.pincode;
    if (hasOriginData && submitError) {
      setSubmitError(null);
    }
  }, [originData.name, originData.mobileNumber, originData.locality, originData.pincode, submitError]);

  useEffect(() => {
    // Clear error when user starts interacting with destination data
    const hasDestinationData = destinationData.name || destinationData.mobileNumber || destinationData.locality || destinationData.pincode;
    if (hasDestinationData && submitError) {
      setSubmitError(null);
    }
  }, [destinationData.name, destinationData.mobileNumber, destinationData.locality, destinationData.pincode, submitError]);

  useEffect(() => {
    // Clear error when user starts interacting with shipment data
    const hasShipmentData = shipmentData.natureOfConsignment || shipmentData.services || shipmentData.mode || packageData.totalPackages;
    if (hasShipmentData && submitError) {
      setSubmitError(null);
    }
  }, [shipmentData.natureOfConsignment, shipmentData.services, shipmentData.mode, packageData.totalPackages, submitError]);

  useEffect(() => {
    // Clear error when user starts interacting with invoice data
    const hasInvoiceData = invoiceData.invoiceNumber || invoiceData.invoiceValue;
    if (hasInvoiceData && submitError) {
      setSubmitError(null);
    }
  }, [invoiceData.invoiceNumber, invoiceData.invoiceValue, submitError]);

  // Effect to automatically set origin address delivery confirmation when manual form is valid
  useEffect(() => {
    if ((showOriginManualForm || originUserFound === false) && isOriginFormValid()) {
      setOriginAddressDeliveryConfirmed(true);
    } else if (originAddressDeliveryConfirmed && !isOriginFormValid()) {
      setOriginAddressDeliveryConfirmed(false);
    }
  }, [originData, showOriginManualForm, originUserFound]);

  // Effect to automatically set destination address delivery confirmation when manual form is valid
  useEffect(() => {
    if ((showDestinationManualForm || destinationUserFound === false) && isDestinationFormValid()) {
      setDestinationAddressDeliveryConfirmed(true);
    } else if (destinationAddressDeliveryConfirmed && !isDestinationFormValid()) {
      setDestinationAddressDeliveryConfirmed(false);
    }
  }, [destinationData, showDestinationManualForm, destinationUserFound]);


  // Calculate volumetric weight
  const calculateVolumetricWeight = () => {
    const { length, breadth, height, unit } = shipmentData.dimensions[0];
    if (length && breadth && height) {
      const l = parseFloat(length) || 0;
      const b = parseFloat(breadth) || 0;
      const h = parseFloat(height) || 0;
      const multiplier = unit === 'cm' ? 1 : (unit === 'mm' ? 0.1 : 100);
      const volWeight = (l * b * h * multiplier) / 5000;
      return parseFloat(volWeight.toFixed(2));
    }
    return 0;
  };

  // Calculate chargeable weight
  const calculateChargeableWeight = () => {
    const actualWeight = parseFloat(shipmentData.actualWeight) || 0;
    const volumetricWeight = calculateVolumetricWeight();
    return Math.max(actualWeight, volumetricWeight);
  };

  // Update weights when dimensions or actual weight change
  useEffect(() => {
    const volumetricWeight = calculateVolumetricWeight();
    const chargeableWeight = calculateChargeableWeight();

    setShipmentData(prev => ({
      ...prev,
      volumetricWeight,
      chargeableWeight
    }));
  }, [shipmentData.dimensions, shipmentData.actualWeight]);

  // Update freight charge when actual weight or per kg rate changes
  useEffect(() => {
    const actualWeight = parseFloat(shipmentData.actualWeight) || 0;
    const perKgRate = parseFloat(shipmentData.perKgWeight) || 0;
    const freightCharge = (actualWeight * perKgRate).toFixed(2);

    setDetailsData(prev => ({
      ...prev,
      freightCharge
    }));
  }, [shipmentData.actualWeight, shipmentData.perKgWeight]);

  // Check consignment availability on component mount
  useEffect(() => {
    const checkConsignmentAvailability = async () => {
      const medicineToken = localStorage.getItem('medicineToken');
      if (!medicineToken) {
        setConsignmentCheckError('Please login to check consignment availability');
        setConsignmentAvailable(false);
        return;
      }

      try {
        const response = await fetch('/api/medicine/consignment/assignments', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${medicineToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.hasAssignment) {
            const availableCount = data.summary?.availableCount || 0;
            setConsignmentAvailable(availableCount > 0);
            if (availableCount === 0) {
              setConsignmentCheckError('All consignment numbers have been used. Please contact admin to get more consignment numbers assigned.');
            } else {
              setConsignmentCheckError(null);
            }
          } else {
            setConsignmentAvailable(false);
            setConsignmentCheckError('No consignment numbers assigned to your account. Please contact admin to get consignment numbers assigned.');
          }
        } else {
          const errorData = await response.json();
          setConsignmentAvailable(false);
          setConsignmentCheckError(errorData.message || 'Failed to check consignment availability');
        }
      } catch (error: any) {
        console.error('Error checking consignment availability:', error);
        setConsignmentAvailable(false);
        setConsignmentCheckError('Failed to check consignment availability');
      }
    };

    checkConsignmentAvailability();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Step 1: Upload images first if there are any
      let packageImageUrls: any[] = [];
      let invoiceImageUrls: any[] = [];
      let panCardUrl: string | null = null;
      let declarationFormUrl: string | null = null;

      // Upload both package and invoice images together if there are any
      if ((packageData.packageImages && packageData.packageImages.length > 0) ||
        (invoiceData.invoiceImages && invoiceData.invoiceImages.length > 0) ||
        invoiceData.panCard || invoiceData.declarationForm) {
        const formData = new FormData();

        if (packageData.packageImages && packageData.packageImages.length > 0) {
          packageData.packageImages.forEach((file: File) => {
            formData.append('packageImages', file);
          });
        }

        if (invoiceData.invoiceImages && invoiceData.invoiceImages.length > 0) {
          invoiceData.invoiceImages.forEach((file: File) => {
            formData.append('invoiceImages', file);
          });
        }

        if (invoiceData.panCard) {
          formData.append('panCard', invoiceData.panCard);
        }

        if (invoiceData.declarationForm) {
          formData.append('declarationForm', invoiceData.declarationForm);
        }

        const uploadResponse = await fetch('/api/medicine/bookings/upload-images', {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.message || 'Failed to upload images');
        }

        const uploadData = await uploadResponse.json();
        if (uploadData.data?.packageImages) {
          packageImageUrls = uploadData.data.packageImages;
        }
        if (uploadData.data?.invoiceImages) {
          invoiceImageUrls = uploadData.data.invoiceImages;
        }
        if (uploadData.data?.panCard) {
          panCardUrl = uploadData.data.panCard;
        }
        if (uploadData.data?.declarationForm) {
          declarationFormUrl = uploadData.data.declarationForm;
        }
      }

      // Step 2: Prepare booking data
      const medicineToken = localStorage.getItem('medicineToken');
      const medicineInfo = localStorage.getItem('medicineInfo');
      let medicineUserId = null;

      if (medicineInfo) {
        try {
          const userInfo = JSON.parse(medicineInfo);
          medicineUserId = userInfo.id || null;
        } catch (e) {
          console.warn('Failed to parse medicine user info:', e);
        }
      }

      const bookingPayload = {
        medicineUserId,
        origin: originData,
        destination: destinationData,
        shipment: {
          ...shipmentData,
          volumetricWeight: shipmentData.volumetricWeight || 0,
          chargeableWeight: shipmentData.chargeableWeight || 0
        },
        package: {
          totalPackages: packageData.totalPackages,
          materials: packageData.materials || '',
          packageImages: packageImageUrls,
          contentDescription: packageData.contentDescription
        },
        invoice: {
          invoiceNumber: invoiceData.invoiceNumber,
          invoiceValue: invoiceData.invoiceValue,
          invoiceImages: invoiceImageUrls,
          eWaybillNumber: invoiceData.eWaybillNumber || '',
          acceptTerms: invoiceData.acceptTerms || false,
          panCard: panCardUrl,
          declarationForm: declarationFormUrl
        },
        billing: billData,
        charges: (() => {
          // Calculate all charge values as numbers
          const freightCharge = parseFloat(detailsData.freightCharge || '0.00');
          const awbCharge = parseFloat(detailsData.awbCharge || '0.00');
          const localCollection = parseFloat(detailsData.localCollection || '0.00');
          const doorDelivery = parseFloat(detailsData.doorDelivery || '0.00');
          const loadingUnloading = parseFloat(detailsData.loadingUnloading || '0.00');
          const demurrageCharge = parseFloat(detailsData.demurrageCharge || '0.00');
          const ddaCharge = parseFloat(detailsData.ddaCharge || '0.00');
          const hamaliCharge = parseFloat(detailsData.hamaliCharge || '0.00');
          const packingCharge = parseFloat(detailsData.packingCharge || '0.00');
          const otherCharge = parseFloat(detailsData.otherCharge || '0.00');
          const fuelCharge = parseFloat(detailsData.fuelCharge || '0.00');
          const sgstAmount = parseFloat(detailsData.sgstAmount || '0.00');
          const cgstAmount = parseFloat(detailsData.cgstAmount || '0.00');
          const igstAmount = parseFloat(detailsData.igstAmount || '0.00');
          const gstAmount = parseFloat(detailsData.gstAmount || '0.00');
          
          // Calculate grandTotal as sum of all charges
          // Use gstAmount if provided, otherwise use sum of SGST + CGST + IGST
          const totalGst = gstAmount > 0 ? gstAmount : (sgstAmount + cgstAmount + igstAmount);
          const grandTotal = freightCharge + awbCharge + localCollection + doorDelivery + 
                           loadingUnloading + demurrageCharge + ddaCharge + hamaliCharge + 
                           packingCharge + otherCharge + fuelCharge + totalGst;
          
          return {
            freightCharge: freightCharge.toFixed(2),
            awbCharge: awbCharge.toFixed(2),
            localCollection: localCollection.toFixed(2),
            doorDelivery: doorDelivery.toFixed(2),
            loadingUnloading: loadingUnloading.toFixed(2),
            demurrageCharge: demurrageCharge.toFixed(2),
            ddaCharge: ddaCharge.toFixed(2),
            hamaliCharge: hamaliCharge.toFixed(2),
            packingCharge: packingCharge.toFixed(2),
            otherCharge: otherCharge.toFixed(2),
            total: detailsData.total || '0.00',
            fuelCharge: fuelCharge.toFixed(2),
            fuelChargeType: detailsData.fuelChargeType || 'percentage',
            gstAmount: gstAmount.toFixed(2),
            sgstAmount: sgstAmount.toFixed(2),
            cgstAmount: cgstAmount.toFixed(2),
            igstAmount: igstAmount.toFixed(2),
            grandTotal: grandTotal.toFixed(2)
          };
        })(),
        payment: paymentData
      };

      // Step 3: Submit booking data
      const response = await fetch('/api/medicine/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(medicineToken && { 'Authorization': `Bearer ${medicineToken}` })
        },
        body: JSON.stringify(bookingPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create booking');
      }

      const result = await response.json();

      if (result.success && result.booking) {
        setBookingReference(result.booking.bookingReference);
        setConsignmentNumber(result.booking.consignmentNumber);
        setSubmitSuccess(true);
        setSubmitError(null);
        setShowSuccessAnimation(true);
        setShowSuccessPopup(true);

        // Update consignment availability after successful booking
        setConsignmentAvailable(prev => {
          // Decrement available count (approximate)
          return prev !== false; // Keep current state or true, but will be rechecked on next mount
        });
      } else {
        throw new Error('Booking created but no consignment number received');
      }
    } catch (error: any) {
      console.error('Error submitting booking:', error);
      // Normalize technical validation errors into a friendly message without backend internals
      const rawMessage = (error && error.message) ? String(error.message) : '';
      const looksLikeValidation =
        rawMessage.toLowerCase().includes('validation failed') ||
        rawMessage.toLowerCase().includes('path `');

      const friendlyMessage = looksLikeValidation
        ? 'Please complete the required fields before booking.'
        : (rawMessage || 'Failed to submit booking. Please try again.');

      setSubmitError(friendlyMessage);
      setShowSuccessAnimation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Origin Details
        return (
          <div className="p-6">

            {/* Phone Number / Company Name Input Section */}
            {!showOriginSummaryCard && !showOriginManualForm && (
              <div className="mb-6 flex flex-col items-center">
                <div className="w-full max-w-2xl">
                  <h3 className="text-lg font-semibold text-black mb-4">Sender / Consignor:</h3>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setOriginActiveTab('phone');
                        resetOriginMobileInput();
                      }}
                      className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                        originActiveTab === 'phone'
                          ? 'border-[#406ab9] text-[#406ab9]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Phone Number
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOriginActiveTab('company');
                        resetOriginMobileInput();
                      }}
                      className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                        originActiveTab === 'company'
                          ? 'border-[#406ab9] text-[#406ab9]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Company Name
                    </button>
                  </div>

                  {/* Phone Number Tab Content */}
                  {originActiveTab === 'phone' && (
                    <div className="flex flex-col items-center">
                      {/* Mobile Number Input Section with Country Code */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4 w-full">
                        {/* Country Code Card */}
                        <div className="flex items-center space-x-2 bg-white border-[1.5px] border-gray-200 rounded-xl px-4 py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.04)] h-[44px]">
                          <IndianFlagIcon className="w-7 h-5 rounded-sm shadow-sm" />
                          <span className="text-base font-semibold text-gray-700">+91</span>
                        </div>

                        {/* Mobile Number Input Boxes */}
                        <div className="flex gap-2 flex-wrap justify-center max-w-full">
                          {originMobileDigits.map((digit, index) => (
                            <input
                              key={index}
                              id={`origin-digit-${index}`}
                              type="text"
                              value={digit}
                              onChange={(e) => handleOriginDigitChange(index, e.target.value)}
                              onKeyDown={(e) => handleOriginDigitKeyDown(index, e)}
                              className="w-[44px] h-[44px] text-center text-lg font-semibold border-[1.5px] border-gray-200 rounded-xl bg-white focus:border-[#406ab9] focus:outline-none focus:ring-4 focus:ring-[#406ab9]/10 transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:border-gray-300 hover:shadow-[0_10px_20px_rgba(0,0,0,0.19),0_6px_6px_rgba(0,0,0,0.23)] focus:shadow-[0_10px_20px_rgba(0,0,0,0.19),0_6px_6px_rgba(0,0,0,0.23)] flex-shrink-0"
                              maxLength={1}
                            />
                          ))}
                        </div>
                      </div>

                      {originMobileDigits.filter(digit => digit !== '').join('').length === 10 && (
                        <div className="flex flex-col items-center gap-8">
                          <button
                            type="button"
                            onClick={resetOriginMobileInput}
                            className="text-sm text-[#64748b] hover:text-[#406ab9] underline transition-colors duration-200"
                          >
                            Change Number
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Company Name Tab Content */}
                  {originActiveTab === 'company' && (
                    <div className="space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={originCompanySearch}
                          onChange={(e) => setOriginCompanySearch(e.target.value)}
                          placeholder="Search company name..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-[#406ab9] focus:outline-none focus:ring-2 focus:ring-[#406ab9]/20 transition-all"
                        />
                      </div>

                      {/* Company Names List */}
                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl">
                        {originCompanyNames
                          .filter(name => 
                            name.toLowerCase().includes(originCompanySearch.toLowerCase())
                          )
                          .length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            {originCompanySearch ? 'No company found matching your search' : 'No company names available'}
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {originCompanyNames
                              .filter(name => 
                                name.toLowerCase().includes(originCompanySearch.toLowerCase())
                              )
                              .map((companyName, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleOriginCompanySelect(companyName)}
                                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                                    originSelectedCompany === companyName ? 'bg-blue-100' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">{companyName}</span>
                                    {originSelectedCompany === companyName && (
                                      <CheckCircle className="w-5 h-5 text-[#406ab9]" />
                                    )}
                                  </div>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {originSelectedCompany && (
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <div>
                            <p className="text-sm text-gray-600">Selected:</p>
                            <p className="font-semibold text-gray-900">{originSelectedCompany}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setOriginSelectedCompany(null);
                              setOriginUserFound(null);
                              setOriginUserAddresses([]);
                              setShowOriginSummaryCard(false);
                              setShowOriginManualForm(false);
                            }}
                            className="text-sm text-[#64748b] hover:text-[#406ab9] underline transition-colors duration-200"
                          >
                            Change
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
            }

            {/* Address Selection Card */}
            {
              showOriginSummaryCard && originUserAddresses.length > 0 && (
                <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)] p-0 overflow-hidden w-full max-w-3xl mx-auto">
                  <div className="bg-[#406ab9] text-white px-6 py-1 rounded-t-2xl">
                    <h4 className="font-semibold text-base">Select Delivery Address</h4>
                  </div>

                  {originUserAddresses.map((address) => {
                    const radioId = `origin-address-${address.id}`;
                    return (
                      <div
                        key={address.id}
                        className={`px-5 py-1.5 cursor-pointer transition-all duration-200 ${selectedOriginAddressId === address.id
                          ? '!bg-blue-50'
                          : '!bg-white hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-start space-x-2">
                          {/* Radio Button */}
                          <div className="mt-2">
                            <label htmlFor={radioId} className="relative block cursor-pointer group leading-none">
                              <input
                                id={radioId}
                                type="radio"
                                name="selectedOriginAddress"
                                checked={selectedOriginAddressId === address.id}
                                onChange={() => handleOriginAddressSelect(address.id)}
                                className="sr-only peer"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="block w-3.5 h-3.5 rounded-full bg-[#d1d7e3] transition-all duration-200 transform group-hover:scale-95 peer-checked:bg-[#5D9BFB] peer-checked:scale-[1.04]" />
                              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <span className="block w-1.5 h-1.5 rounded-full bg-white transition-transform duration-200 transform group-hover:scale-75 peer-checked:scale-50" />
                              </span>
                            </label>
                          </div>

                          {/* Address Content */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="font-bold text-[#1e293b] text-lg">{address.name}</div>
                              <span className="px-2 py-0.5 bg-white text-blue-700 text-xs font-medium rounded-sm border border-blue-200">
                                {address.addressType}
                              </span>
                            </div>

                            {/* Details Display */}
                            <div className="space-y-1 text-sm">
                              {/* Company Name */}
                              {address.companyName && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Building className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="text-gray-800 font-medium">{address.companyName}</span>
                                </div>
                              )}

                              {/* Address */}
                              <div className="flex items-start gap-2 text-xs">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">
                                  {address.locality}, {address.flatBuilding}
                                  {address.landmark && `, ${address.landmark}`}, {address.city}, {address.pincode} - ({address.state})
                                </span>
                              </div>

                              {/* Contact Info */}
                              <div className="flex items-center gap-2 flex-wrap text-gray-700 text-xs">
                                {/* Mobile */}
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="font-semibold">+91 {address.mobileNumber}</span>
                                </div>

                                {/* Email */}
                                {address.email && (
                                  <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{address.email}</span>
                                  </div>
                                )}

                                {/* GST */}
                                {address.gstNumber && (
                                  <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="font-mono">{address.gstNumber}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Deliver Here Button - Changed to Confirm Address and color change on click */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2">
                    <button
                      onClick={handleOriginDeliverHere}
                      disabled={!selectedOriginAddressId}
                      className={`block w-full md:w-[80%] lg:w-[65%] mx-auto py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 ${originAddressDeliveryConfirmed
                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                        : selectedOriginAddressId
                          ? 'bg-[#406ab9] text-white hover:bg-[#3059a0] shadow-sm'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      {originAddressDeliveryConfirmed ? 'Address Confirmed' : 'Confirm Address'}
                    </button>

                    {/* Add New Address Button */}
                    <button
                      onClick={() => {
                        setShowOriginManualForm(true);
                        setShowOriginSummaryCard(false);
                        setOriginAddressDeliveryConfirmed(false);
                        setSelectedOriginAddressId(null);
                        // Reset origin data except mobile number
                        setOriginData(prev => ({
                          ...prev,
                          name: '',
                          email: '',
                          companyName: '',
                          flatBuilding: '',
                          locality: '',
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
                        }));
                      }}
                      className="block w-full md:w-[80%] lg:w-[65%] mx-auto py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 bg-white text-[#406ab9] hover:bg-blue-50 shadow-sm text-center"
                    >
                      Add New Address
                    </button>
                  </div>
                </div>
              )
            }

            {/* Manual Form */}
            {
              (showOriginManualForm || originUserFound === false) && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <FloatingInput
                      label="Concern Name"
                      value={originData.name}
                      onChange={(value) => handleOriginChange('name', value)}
                      icon={<User className="h-4 w-4" />}
                      required
                    />

                    <FloatingInput
                      label="Company Name"
                      value={originData.companyName}
                      onChange={(value) => handleOriginChange('companyName', value)}
                      icon={<Building className="h-4 w-4" />}
                    />

                    <FloatingInput
                      label="Locality / Street"
                      value={originData.locality}
                      onChange={(value) => handleOriginChange('locality', value)}
                      required
                      icon={<Building className="h-4 w-4" />}
                    />

                    <FloatingInput
                      label="Building / Flat No."
                      value={originData.flatBuilding}
                      onChange={(value) => handleOriginChange('flatBuilding', value)}
                      icon={<Building className="h-4 w-4" />}
                      required
                    />

                    <FloatingInput
                      label="Landmark"
                      value={originData.landmark}
                      onChange={(value) => handleOriginChange('landmark', value)}
                      icon={<Building className="h-4 w-4" />}
                    />

                    <FloatingInput
                      label="GST"
                      value={originData.gstNumber}
                      onChange={(value) => {
                        const formattedGST = validateGSTFormat(value);
                        handleOriginChange('gstNumber', formattedGST);
                        if (formattedGST.length > 0 && formattedGST.length < 15) {
                          setOriginGstError(true);
                        } else {
                          setOriginGstError(false);
                        }
                      }}
                      maxLength={15}
                      icon={<GstIcon className="h-4 w-4 text-gray-400" />}
                      hasValidationError={originGstError}
                      validationErrorMessage={originGstError ? "Please complete the 15-digit GST number or leave it empty" : ""}
                    />

                    <FloatingInput
                      label="PINCode"
                      value={originData.pincode}
                      onChange={(value) => {
                        const pincode = value.replace(/\D/g, '').slice(0, 6);
                        handleOriginChange('pincode', pincode);
                        if (pincode.length === 6) {
                          autoFillFromPincode(pincode, 'origin');
                        } else {
                          setOriginAreas([]);
                          setOriginData(prev => ({ ...prev, area: '', city: '', state: '', district: '' }));
                        }
                      }}
                      type="tel"
                      required
                      maxLength={6}
                      icon={<MapPin className="h-4 w-4" />}
                      disabled={originGstError}
                    />

                    <FloatingInput
                      label="State"
                      value={originData.state}
                      onChange={(value) => handleOriginChange('state', value)}
                      disabled
                      icon={<MapPin className="h-4 w-4" />}
                    />

                    <FloatingInput
                      label="City"
                      value={originData.city}
                      onChange={(value) => handleOriginChange('city', value)}
                      disabled
                      icon={<MapPin className="h-4 w-4" />}
                    />

                    {originData.pincode.length === 6 ? (
                      <FloatingSelect
                        label="Area"
                        value={originData.area}
                        onChange={(value) => handleOriginChange('area', value)}
                        options={originAreas.length > 0 ? originAreas.map(area => ({ value: area, label: area })) : [{ value: 'not-serviceable', label: 'This pincode is not serviceable' }]}
                        required
                        disabled={originAreas.length === 0 || originGstError}
                        icon={<MapPin className="h-4 w-4" />}
                      />
                    ) : (
                      <div />
                    )}

                    <FloatingInput
                      label="Email"
                      value={originData.email}
                      onChange={(value) => handleOriginChange('email', value)}
                      icon={<Mail className="h-4 w-4" />}
                      type="email"
                    />

                    <FloatingInput
                      label="Website (Optional)"
                      value={originData.website}
                      onChange={(value) => handleOriginChange('website', value)}
                      icon={<Globe className="h-4 w-4" />}
                      type="url"
                    />

                    <FloatingInput
                      label="Anniversary"
                      value={originData.anniversary}
                      onChange={(value) => handleOriginChange('anniversary', value)}
                      type="date"
                      icon={<Calendar className="h-4 w-4" />}
                      placeholder="dd/mm/yyyy"
                    />

                    <FloatingInput
                      label="Birthday"
                      value={originData.birthday}
                      onChange={(value) => handleOriginChange('birthday', value)}
                      type="date"
                      icon={<Calendar className="h-4 w-4" />}
                      placeholder="dd/mm/yyyy"
                    />

                    <FloatingInput
                      label="Alternate Number"
                      value={originData.alternateNumber}
                      onChange={(value) => handleOriginChange('alternateNumber', value)}
                      type="tel"
                      icon={<Phone className="h-4 w-4" />}
                      className="md:col-span-2"
                    />
                  </div>

                  {/* Type of Address */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-[#1e293b]">
                      <MapPin className="w-4 h-4" />
                      <span>Type of Address</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 mt-1">
                      {['Home', 'Office', 'Other'].map((type) => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="originAddressType"
                            value={type}
                            checked={originData.addressType === type}
                            onChange={(e) => handleOriginChange('addressType', e.target.value)}
                            className="w-4 h-4 text-[#406ab9] focus:ring-[#4ec0f7] border-gray-300"
                          />
                          <span className="text-sm text-[#64748b]">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                </div>
              )
            }
          </div >
        );

      case 1: // Destination Details
        return (
          <div className="p-6">

            {/* Phone Number / Company Name Input Section */}
            {!showDestinationSummaryCard && !showDestinationManualForm && (
              <div className="mb-6 flex flex-col items-center">
                <div className="w-full max-w-2xl">
                  <h3 className="text-lg font-semibold text-black mb-4">Receiver / Consignee:</h3>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setDestinationActiveTab('phone');
                        resetDestinationMobileInput();
                      }}
                      className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                        destinationActiveTab === 'phone'
                          ? 'border-[#406ab9] text-[#406ab9]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Phone Number
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDestinationActiveTab('company');
                        resetDestinationMobileInput();
                      }}
                      className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                        destinationActiveTab === 'company'
                          ? 'border-[#406ab9] text-[#406ab9]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Company Name
                    </button>
                  </div>

                  {/* Phone Number Tab Content */}
                  {destinationActiveTab === 'phone' && (
                    <div className="flex flex-col items-center">
                      {/* Mobile Number Input Section with Country Code */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4 w-full">
                        {/* Country Code Card */}
                        <div className="flex items-center space-x-2 bg-white border-[1.5px] border-gray-200 rounded-xl px-4 py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.04)] h-[44px]">
                          <IndianFlagIcon className="w-7 h-5 rounded-sm shadow-sm" />
                          <span className="text-base font-semibold text-gray-700">+91</span>
                        </div>

                        {/* Mobile Number Input Boxes */}
                        <div className="flex gap-2 flex-wrap justify-center max-w-full">
                          {destinationMobileDigits.map((digit, index) => (
                            <input
                              key={index}
                              id={`dest-digit-${index}`}
                              type="text"
                              value={digit}
                              onChange={(e) => handleDestinationDigitChange(index, e.target.value)}
                              onKeyDown={(e) => handleDestinationDigitKeyDown(index, e)}
                              className="w-[44px] h-[44px] text-center text-lg font-semibold border-[1.5px] border-gray-200 rounded-xl bg-white focus:border-[#406ab9] focus:outline-none focus:ring-4 focus:ring-[#406ab9]/10 transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:border-gray-300 hover:shadow-[0_10px_20px_rgba(0,0,0,0.19),0_6px_6px_rgba(0,0,0,0.23)] focus:shadow-[0_10px_20px_rgba(0,0,0,0.19),0_6px_6px_rgba(0,0,0,0.23)] flex-shrink-0"
                              maxLength={1}
                            />
                          ))}
                        </div>
                      </div>

                      {destinationMobileDigits.filter(digit => digit !== '').join('').length === 10 && (
                        <div className="flex flex-col items-center gap-2">
                          <button
                            type="button"
                            onClick={resetDestinationMobileInput}
                            className="text-sm text-[#64748b] hover:text-[#406ab9] underline transition-colors duration-200"
                          >
                            Change Number
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Company Name Tab Content */}
                  {destinationActiveTab === 'company' && (
                    <div className="space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={destinationCompanySearch}
                          onChange={(e) => setDestinationCompanySearch(e.target.value)}
                          placeholder="Search company name..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-[#406ab9] focus:outline-none focus:ring-2 focus:ring-[#406ab9]/20 transition-all"
                        />
                      </div>

                      {/* Company Names List */}
                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl">
                        {destinationCompanyNames
                          .filter(name => 
                            name.toLowerCase().includes(destinationCompanySearch.toLowerCase())
                          )
                          .length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            {destinationCompanySearch ? 'No company found matching your search' : 'No company names available'}
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {destinationCompanyNames
                              .filter(name => 
                                name.toLowerCase().includes(destinationCompanySearch.toLowerCase())
                              )
                              .map((companyName, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleDestinationCompanySelect(companyName)}
                                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                                    destinationSelectedCompany === companyName ? 'bg-blue-100' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">{companyName}</span>
                                    {destinationSelectedCompany === companyName && (
                                      <CheckCircle className="w-5 h-5 text-[#406ab9]" />
                                    )}
                                  </div>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {destinationSelectedCompany && (
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <div>
                            <p className="text-sm text-gray-600">Selected:</p>
                            <p className="font-semibold text-gray-900">{destinationSelectedCompany}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDestinationSelectedCompany(null);
                              setDestinationUserFound(null);
                              setDestinationUserAddresses([]);
                              setShowDestinationSummaryCard(false);
                              setShowDestinationManualForm(false);
                            }}
                            className="text-sm text-[#64748b] hover:text-[#406ab9] underline transition-colors duration-200"
                          >
                            Change
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Address Selection Card */}
            {showDestinationSummaryCard && destinationUserAddresses.length > 0 && (
              <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-0 overflow-hidden">
                <div className="bg-[#406ab9] text-white px-6 py-3 rounded-t-2xl">
                  <h4 className="font-semibold text-lg">Select Delivery Address</h4>
                </div>

                {destinationUserAddresses.map((address) => (
                  <div
                    key={address.id}
                    className={`p-5 cursor-pointer transition-all duration-200 ${selectedDestinationAddressId === address.id
                      ? '!bg-green-50'
                      : '!bg-white hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-start space-x-2">
                      {/* Radio Button */}
                      <div className="mt-0.5">
                        <input
                          type="radio"
                          name="selectedDestinationAddress"
                          checked={selectedDestinationAddressId === address.id}
                          onChange={() => handleDestinationAddressSelect(address.id)}
                          className="w-4 h-4 text-[#406ab9] focus:ring-[#4ec0f7] border-gray-300 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Address Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-2">
                            <div className="font-bold text-[#1e293b] text-lg">{address.name}</div>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              {address.addressType}
                            </span>
                          </div>
                        </div>

                        {/* Details Display */}
                        <div className="space-y-1 text-sm">
                          {/* Company Name */}
                          {address.companyName && (
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 flex-shrink-0" />
                              <span className="text-gray-800 font-medium">{address.companyName}</span>
                            </div>
                          )}

                          {/* Address */}
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 text-xs">
                              {address.locality}, {address.flatBuilding}
                              {address.landmark && `, ${address.landmark}`}, {address.city}, {address.pincode} - ({address.state})
                            </span>
                          </div>

                          {/* Contact Info */}
                          <div className="flex items-center gap-2 flex-wrap text-gray-700 text-xs">
                            {/* Mobile */}
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-4 h-4 flex-shrink-0" />
                              <span className="font-semibold">+91 {address.mobileNumber}</span>
                            </div>

                            {/* Email */}
                            {address.email && (
                              <>
                                <span className="text-gray-400">•</span>
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-4 h-4 flex-shrink-0" />
                                  <span>{address.email}</span>
                                </div>
                              </>
                            )}

                            {/* GST */}
                            {address.gstNumber && (
                              <>
                                <span className="text-gray-400">•</span>
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 flex-shrink-0" />
                                  <span className="font-mono">{address.gstNumber}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Deliver Here Button - Changed to Confirm Address and color change on click */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2">
                  <button
                    onClick={handleDestinationDeliverHere}
                    disabled={!selectedDestinationAddressId}
                    className={`block w-full md:w-[80%] lg:w-[65%] mx-auto py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${destinationAddressDeliveryConfirmed
                      ? 'bg-green-500 text-white hover:bg-green-600 shadow-md' // Green when confirmed
                      : selectedDestinationAddressId
                        ? 'bg-[#406ab9] text-white hover:bg-[#3059a0] shadow-md' // Blue when selectable
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed' // Gray when disabled
                      }`}
                  >
                    {destinationAddressDeliveryConfirmed ? 'Address Confirmed' : 'Confirm Address'}
                  </button>

                  {/* Add New Address Button */}
                  <button
                    onClick={() => {
                      setShowDestinationManualForm(true);
                      setShowDestinationSummaryCard(false);
                      setDestinationAddressDeliveryConfirmed(false);
                      setSelectedDestinationAddressId(null);
                      // Reset destination data except mobile number
                      setDestinationData(prev => ({
                        ...prev,
                        name: '',
                        email: '',
                        companyName: '',
                        flatBuilding: '',
                        locality: '',
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
                      }));
                    }}
                    className="block w-full md:w-[80%] lg:w-[65%] mx-auto py-3 px-4 rounded-xl font-semibold transition-all duration-200 bg-white text-[#406ab9] hover:bg-blue-50 shadow-sm text-center"
                  >
                    Add New Address
                  </button>
                </div>
              </div>
            )}

            {/* Manual Form */}
            {(showDestinationManualForm || destinationUserFound === false) && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 items-start">
                  <FloatingInput
                    label="Concern Name"
                    value={destinationData.name}
                    onChange={(value) => handleDestinationChange('name', value)}
                    icon={<User className="h-4 w-4" />}
                    required
                  />

                  <FloatingInput
                    label="Company Name"
                    value={destinationData.companyName}
                    onChange={(value) => handleDestinationChange('companyName', value)}
                    icon={<Building className="h-4 w-4" />}
                  />

                  <FloatingInput
                    label="Locality / Street"
                    value={destinationData.locality}
                    onChange={(value) => handleDestinationChange('locality', value)}
                    required
                    icon={<Building className="h-4 w-4" />}
                  />

                  <FloatingInput
                    label="Building / Flat No."
                    value={destinationData.flatBuilding}
                    onChange={(value) => handleDestinationChange('flatBuilding', value)}
                    icon={<Building className="h-4 w-4" />}
                    required
                  />

                  <FloatingInput
                    label="Landmark"
                    value={destinationData.landmark}
                    onChange={(value) => handleDestinationChange('landmark', value)}
                    icon={<Building className="h-4 w-4" />}
                  />

                  <FloatingInput
                    label="GST"
                    value={destinationData.gstNumber}
                    onChange={(value) => {
                      const formattedGST = validateGSTFormat(value);
                      handleDestinationChange('gstNumber', formattedGST);
                      if (formattedGST.length > 0 && formattedGST.length < 15) {
                        setDestinationGstError(true);
                      } else {
                        setDestinationGstError(false);
                      }
                    }}
                    maxLength={15}
                    icon={<GstIcon className="h-4 w-4 text-gray-400" />}
                    hasValidationError={destinationGstError}
                    validationErrorMessage={destinationGstError ? "Please complete the 15-digit GST number or leave it empty" : ""}
                  />

                  <FloatingInput
                    label="PINCode"
                    value={destinationData.pincode}
                    onChange={(value) => {
                      const pincode = value.replace(/\D/g, '').slice(0, 6);
                      handleDestinationChange('pincode', pincode);
                      if (pincode.length === 6) {
                        autoFillFromPincode(pincode, 'destination');
                      } else {
                        setDestinationAreas([]);
                        setDestinationData(prev => ({ ...prev, area: '', city: '', state: '', district: '' }));
                      }
                    }}
                    type="tel"
                    required
                    maxLength={6}
                    icon={<MapPin className="h-4 w-4" />}
                    disabled={destinationGstError}
                  />

                  <FloatingInput
                    label="State"
                    value={destinationData.state}
                    onChange={(value) => handleDestinationChange('state', value)}
                    disabled
                    icon={<MapPin className="h-4 w-4" />}
                  />

                  <FloatingInput
                    label="City"
                    value={destinationData.city}
                    onChange={(value) => handleDestinationChange('city', value)}
                    disabled
                    icon={<MapPin className="h-4 w-4" />}
                  />

                  {destinationData.pincode.length === 6 ? (
                    <FloatingSelect
                      label="Area"
                      value={destinationData.area}
                      onChange={(value) => handleDestinationChange('area', value)}
                      options={destinationAreas.length > 0 ? destinationAreas.map(area => ({ value: area, label: area })) : [{ value: 'not-serviceable', label: 'This pincode is not serviceable' }]}
                      required
                      disabled={destinationAreas.length === 0 || destinationGstError}
                      icon={<MapPin className="h-4 w-4" />}
                    />
                  ) : (
                    <div />
                  )}

                  <FloatingInput
                    label="Email"
                    value={destinationData.email}
                    onChange={(value) => handleDestinationChange('email', value)}
                    icon={<Mail className="h-4 w-4" />}
                    type="email"
                  />

                  <FloatingInput
                    label="Website (Optional)"
                    value={destinationData.website}
                    onChange={(value) => handleDestinationChange('website', value)}
                    icon={<Globe className="h-4 w-4" />}
                    type="url"
                  />

                  <FloatingInput
                    label="Anniversary"
                    value={destinationData.anniversary}
                    onChange={(value) => handleDestinationChange('anniversary', value)}
                    type="date"
                    icon={<Calendar className="h-4 w-4" />}
                    placeholder="dd/mm/yyyy"
                  />

                  <FloatingInput
                    label="Birthday"
                    value={destinationData.birthday}
                    onChange={(value) => handleDestinationChange('birthday', value)}
                    type="date"
                    icon={<Calendar className="h-4 w-4" />}
                    placeholder="dd/mm/yyyy"
                  />

                  <FloatingInput
                    label="Alternate Number"
                    value={destinationData.alternateNumber}
                    onChange={(value) => handleDestinationChange('alternateNumber', value)}
                    type="tel"
                    icon={<Phone className="h-4 w-4" />}
                    className="md:col-span-2"
                  />
                </div>

                {/* Type of Address */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-[#1e293b]">
                    <MapPin className="w-4 h-4" />
                    <span>Type of Address</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 mt-1">
                    {['Home', 'Office', 'Other'].map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="destinationAddressType"
                          value={type}
                          checked={destinationData.addressType === type}
                          onChange={(e) => handleDestinationChange('addressType', e.target.value)}
                          className="w-4 h-4 text-[#406ab9] focus:ring-[#4ec0f7] border-gray-300"
                        />
                        <span className="text-sm text-[#64748b]">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2: // Shipment Details with package information
        return (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-y-6 gap-x-10 items-start">
              <CustomRadioGroup
                label="Nature of Consignment"
                name="natureOfConsignment"
                value={shipmentData.natureOfConsignment}
                onChange={(value) => handleShipmentChange('natureOfConsignment', value)}
                options={[
                  { value: 'NON-DOX', label: 'NON-DOX' },
                  { value: 'DOX', label: 'DOX' }
                ]}
                required
                icon={<FileText className="h-4 w-4" />}
              />

              <CustomRadioGroup
                label="Services"
                name="services"
                value={shipmentData.services}
                onChange={(value) => handleShipmentChange('services', value)}
                options={[
                  { value: 'Standard', label: 'Standard' },
                  { value: 'Priority', label: 'Priority' }
                ]}
                required
                icon={<Clock className="h-4 w-4" />}
              />

              <CustomRadioGroup
                label="Mode"
                name="mode"
                value={shipmentData.mode}
                onChange={(value) => handleShipmentChange('mode', value)}
                options={[
                  { value: 'Surface', label: 'Surface' },
                  { value: 'Air', label: 'Air' },
                  { value: 'Cargo', label: 'Cargo' }
                ]}
                required
                icon={<Globe className="h-4 w-4" />}
              />

              <CustomRadioGroup
                label="Risk Coverage"
                name="riskCoverage"
                value={shipmentData.riskCoverage}
                onChange={(value) => handleShipmentChange('riskCoverage', value)}
                options={[
                  { value: 'Owner', label: 'Owner' },
                  { value: 'Carrier', label: 'Carrier' }
                ]}
                required
                icon={<User className="h-4 w-4" />}
              />

              <div className="lg:col-span-2 space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/60 rounded-xl text-sm font-semibold text-blue-700 shadow-sm">
                  Insurance:
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-3 items-center pb-0">
                  {[
                    { value: 'Consignor not insured the shipment', label: 'Consignor not insured the shipment' },
                    { value: 'Consignor has insured the shipment', label: 'Consignor has insured the shipment' }
                  ].map((option, index) => {
                    const optionId = `insurance-${option.value}`;
                    const isActive = shipmentData.insurance === option.value;
                    return (
                      <div
                        key={option.value}
                        className={`radio-wrapper-24 ${isActive ? 'active' : ''}`}
                        onClick={() => handleShipmentChange('insurance', option.value)}
                      >
                        <input
                          type="radio"
                          name="insurance"
                          id={optionId}
                          value={option.value}
                          checked={isActive}
                          onChange={(e) => handleShipmentChange('insurance', e.target.value)}
                        />
                        <label htmlFor={optionId} className="ml-2">
                          <span>{option.label}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Package Information & Volumetric Section */}
              <div className="md:col-span-2 mt-6 space-y-5">
                {/* Total Packages & Materials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <FloatingInput
                    label="Total Packages"
                    value={packageData.totalPackages}
                    onChange={(value) => handlePackageChange('totalPackages', value)}
                    type="number"
                    required
                  />

                  <FloatingInput
                    label="Materials"
                    value={packageData.materials}
                    onChange={(value) => handlePackageChange('materials', value)}
                    required
                  />
                </div>

                {/* Content Description */}
                <div>
                  <div className="relative">
                    <FloatingTextarea
                      label="Content Description"
                      value={packageData.contentDescription}
                      onChange={(value) => {
                        if (value.length <= 100) {
                          handlePackageChange('contentDescription', value);
                        }
                      }}
                      rows={3}
                    />
                    <div className="absolute bottom-3 right-4 text-xs text-gray-400">
                      {packageData.contentDescription.length}/100
                    </div>
                  </div>
                </div>

                {/* Upload Package Documents */}
                <div>
                  <UploadBox
                    label="Upload Package Documents (Max 5)"
                    files={packageData.packageImages}
                    onFilesChange={(files) => handlePackageFileChange('packageImages', files)}
                    maxFiles={5}
                  />
                </div>

                {/* Volumetric Weight Section */}
                <div className="mt-4 space-y-3">
                  {/* Length, Breadth, Height, Unit */}
                  <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_80px] gap-3">
                    <FloatingInput
                      label="Length"
                      value={shipmentData.dimensions[0].length}
                      onChange={(value) => handleDimensionChange(0, 'length', value)}
                      type="number"
                    />
                    <FloatingInput
                      label="Breadth"
                      value={shipmentData.dimensions[0].breadth}
                      onChange={(value) => handleDimensionChange(0, 'breadth', value)}
                      type="number"
                    />
                    <FloatingInput
                      label="Height"
                      value={shipmentData.dimensions[0].height}
                      onChange={(value) => handleDimensionChange(0, 'height', value)}
                      type="number"
                    />
                    <div className="flex items-center justify-center h-9 px-4 rounded-xl border border-gray-300/60 bg-white/90 text-sm font-semibold text-gray-700">
                      cm
                    </div>
                  </div>

                  {/* Actual Weight & Per Kg */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FloatingInput
                      label="Actual Weight (Kg)"
                      value={shipmentData.actualWeight}
                      onChange={(value) => handleShipmentChange('actualWeight', value)}
                      type="number"
                      required
                    />
                    <FloatingInput
                      label="Per Kg Rate (₹)"
                      value={shipmentData.perKgWeight}
                      onChange={(value) => handleShipmentChange('perKgWeight', value)}
                      type="number"
                    />
                  </div>

                  {/* Volumetric / Actual / Chargeable */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3">
                      <div className="text-[11px] font-medium text-[#64748b] mb-1">
                        Volumetric
                      </div>
                      <div className="text-sm font-semibold text-[#2563eb]">
                        {shipmentData.volumetricWeight.toFixed(2)} Kg.
                      </div>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3">
                      <div className="text-[11px] font-medium text-[#64748b] mb-1">
                        Actual
                      </div>
                      <div className="text-sm font-semibold text-[#2563eb]">
                        {(parseFloat(shipmentData.actualWeight || '0') || 0).toFixed(2)} Kg.
                      </div>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3">
                      <div className="text-[11px] font-medium text-[#64748b] mb-1">
                        Chargeable
                      </div>
                      <div className="text-sm font-semibold text-[#2563eb]">
                        {shipmentData.chargeableWeight.toFixed(2)} Kg.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Modals */}

          </div>
        );

      case 3: // Invoice Information
        return (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <FloatingInput
                label="Invoice Number"
                value={invoiceData.invoiceNumber}
                onChange={(value) => handleInvoiceChange('invoiceNumber', value)}
                required
              />

              <FloatingInput
                label="Invoice Value (₹)"
                value={isInvoiceValueFocused 
                  ? formatIndianNumber(invoiceData.invoiceValue) 
                  : invoiceData.invoiceValue 
                    ? `${formatIndianNumber(invoiceData.invoiceValue)}.00`
                    : ''}
                onChange={(value) => handleInvoiceChange('invoiceValue', value)}
                type="text"
                required
                icon={<IndianRupee className="h-4 w-4" />}
                onFocus={() => {
                  setIsInvoiceValueFocused(true);
                }}
                onBlur={(e) => {
                  setIsInvoiceValueFocused(false);
                  // Ensure .00 is added on blur if there's a value
                  if (invoiceData.invoiceValue && !invoiceData.invoiceValue.includes('.')) {
                    // Value is already stored as digits only, no need to change it
                    // The display will show .00 automatically when not focused
                  }
                }}
              />

              {/* Show E-Waybill Number only if invoice value is 50000 or above */}
              {parseFloat(invoiceData.invoiceValue) >= 50000 && (
                <FloatingInput
                  label="E-Waybill Number (12 digits)"
                  value={invoiceData.eWaybillNumber}
                  onChange={(value) => handleInvoiceChange('eWaybillNumber', value)}
                  type="text"
                  maxLength={12}
                />
              )}

              <div className="md:col-span-2">
                <UploadBox
                  label="Upload Invoice Documents (Max 5)"
                  files={invoiceData.invoiceImages}
                  onFilesChange={(files) => handleInvoiceFileChange('invoiceImages', files)}
                  maxFiles={5}
                />
              </div>

              {/* PAN Card Upload */}
              <div className="md:col-span-2">
                <div className="flex flex-col">
                  <div
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/jpeg,image/jpg,image/png,image/webp,application/pdf';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0] || null;
                        handleSingleFileChange('panCard', file);
                      };
                      input.click();
                    }}
                    className={`
                      bg-gradient-to-b from-blue-50/50 to-white
                      border-2 border-dashed rounded-xl p-4
                      transition-all duration-300 cursor-pointer
                      border-gray-300 hover:border-blue-400 hover:bg-blue-50/70 hover:shadow-sm
                    `}
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <Upload className="w-6 h-6 text-blue-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-blue-700">PAN Card</p>
                        <p className="text-xs text-gray-500">JPG, PNG, WEBP, PDF - Auto-compressed</p>
                      </div>
                    </div>
                  </div>
                  {invoiceData.panCard && (
                    <div className="mt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative group">
                          <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-blue-400 transition-all duration-200">
                            {invoiceData.panCard.type?.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(invoiceData.panCard)}
                                alt={invoiceData.panCard.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          {/* Remove button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSingleFileChange('panCard', null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow-md"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Declaration Form Upload */}
              <div className="md:col-span-2">
                <div className="flex flex-col">
                  <div
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/jpeg,image/jpg,image/png,image/webp,application/pdf';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0] || null;
                        handleSingleFileChange('declarationForm', file);
                      };
                      input.click();
                    }}
                    className={`
                      bg-gradient-to-b from-blue-50/50 to-white
                      border-2 border-dashed rounded-xl p-4
                      transition-all duration-300 cursor-pointer
                      border-gray-300 hover:border-blue-400 hover:bg-blue-50/70 hover:shadow-sm
                    `}
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <Upload className="w-6 h-6 text-blue-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-blue-700">Declaration Form</p>
                        <p className="text-xs text-gray-500">JPG, PNG, WEBP, PDF - Auto-compressed</p>
                      </div>
                    </div>
                  </div>
                  {invoiceData.declarationForm && (
                    <div className="mt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative group">
                          <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-blue-400 transition-all duration-200">
                            {invoiceData.declarationForm.type?.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(invoiceData.declarationForm)}
                                alt={invoiceData.declarationForm.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          {/* Remove button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSingleFileChange('declarationForm', null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow-md"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="md:col-span-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoiceData.acceptTerms}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                    className="mt-1 w-4 h-4 text-[#406ab9] border-gray-300 rounded focus:ring-[#406ab9]"
                  />
                  <span className="text-sm text-gray-700">
                    I accept the{' '}
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Terms & Conditions
                    </a>
                    {' '}and confirm that all information is accurate.
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      case 4: // Billing Information
        return (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <CustomRadioGroup
                label="Paid By"
                name="partyType"
                value={billData.partyType}
                onChange={(value) => handleBillChange('partyType', value)}
                options={[
                  { value: 'sender', label: 'Sender' },
                  { value: 'recipient', label: 'Recipient' }
                ]}
                required
              />

              <div className="md:col-span-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/60 rounded-xl text-sm font-semibold text-blue-700 shadow-sm">
                  Bill Type:
                </div>
                <div className="mt-3 flex flex-wrap gap-6">
                  {[
                    { value: 'normal', label: 'Normal GST' },
                    { value: 'rcm', label: 'RCM (Reverse Charge Mechanism)' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="billType"
                        value={option.value}
                        checked={billData.billType === option.value}
                        onChange={() => setBillData(prev => ({ ...prev, billType: option.value }))}
                        className="w-4 h-4 text-[#406ab9] focus:ring-[#4ec0f7] border-gray-300"
                      />
                      <span className="text-gray-800">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5: // Preview - Review all entered information
        return (
          <div className="p-6">

            <div className="space-y-6">
              {/* Origin Details Preview */}
              <div className="bg-white rounded-lg p-4 shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,rgba(0,0,0,0.3)_0px_3px_7px_-3px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Origin Details
                  </h3>
                  <button
                    type="button"
                    className="text-[#406ab9] hover:text-[#3059a0] transition-colors p-1"
                    onClick={() => setEditingSection('origin')}
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500">
                  <div><span className="font-normal">Name:</span> {originData.name}</div>
                  <div><span className="font-normal">Mobile:</span> +91 {originData.mobileNumber}</div>
                  {originData.email && <div><span className="font-normal">Email:</span> {originData.email}</div>}
                  {originData.companyName && <div><span className="font-normal">Company:</span> {originData.companyName}</div>}
                  {originData.website && <div><span className="font-normal">Website:</span> {originData.website}</div>}
                  {originData.anniversary && <div><span className="font-normal">Anniversary:</span> {originData.anniversary}</div>}
                  {originData.birthday && <div><span className="font-normal">Birthday:</span> {originData.birthday}</div>}
                  <div className="md:col-span-2"><span className="font-normal">Address:</span> {originData.flatBuilding}, {originData.locality}, {originData.landmark && `${originData.landmark}, `}{originData.area}, {originData.city}, {originData.state} - {originData.pincode}</div>
                  {originData.gstNumber && <div><span className="font-normal">GST:</span> {originData.gstNumber}</div>}
                  {originData.alternateNumber && (
                    <div className="md:col-span-2"><span className="font-normal">Alternate Number:</span> +91 {originData.alternateNumber}</div>
                  )}
                  <div><span className="font-normal">Address Type:</span> {originData.addressType}</div>
                </div>
              </div>

              {/* Destination Details Preview */}
              <div className="bg-white rounded-lg p-4 shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,rgba(0,0,0,0.3)_0px_3px_7px_-3px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Destination Details
                  </h3>
                  <button
                    type="button"
                    className="text-[#406ab9] hover:text-[#3059a0] transition-colors p-1"
                    onClick={() => setEditingSection('destination')}
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500">
                  <div><span className="font-normal">Name:</span> {destinationData.name}</div>
                  <div><span className="font-normal">Mobile:</span> +91 {destinationData.mobileNumber}</div>
                  {destinationData.email && <div><span className="font-normal">Email:</span> {destinationData.email}</div>}
                  {destinationData.companyName && <div><span className="font-normal">Company:</span> {destinationData.companyName}</div>}
                  <div className="md:col-span-2"><span className="font-normal">Address:</span> {destinationData.flatBuilding}, {destinationData.locality}, {destinationData.landmark && `${destinationData.landmark}, `}{destinationData.area}, {destinationData.city}, {destinationData.state} - {destinationData.pincode}</div>
                  {destinationData.gstNumber && <div><span className="font-normal">GST:</span> {destinationData.gstNumber}</div>}
                  <div><span className="font-normal">Address Type:</span> {destinationData.addressType}</div>
                </div>
              </div>

              {/* Shipment Details Preview */}
              <div className="bg-white rounded-lg p-4 shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,rgba(0,0,0,0.3)_0px_3px_7px_-3px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Shipment & Package Details
                  </h3>
                  <button
                    type="button"
                    className="text-[#406ab9] hover:text-[#3059a0] transition-colors p-1"
                    onClick={() => setEditingSection('shipment')}
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500">
                  <div><span className="font-normal">Nature:</span> {shipmentData.natureOfConsignment}</div>
                  <div><span className="font-normal">Service:</span> {shipmentData.services}</div>
                  <div><span className="font-normal">Mode:</span> {shipmentData.mode}</div>
                  <div><span className="font-normal">Insurance:</span> {shipmentData.insurance}</div>
                  <div><span className="font-normal">Risk Coverage:</span> {shipmentData.riskCoverage}</div>
                  <div><span className="font-normal">Actual Weight:</span> {shipmentData.actualWeight} kg</div>
                  <div><span className="font-normal">Per Kg Rate:</span> ₹{shipmentData.perKgWeight ? parseFloat(shipmentData.perKgWeight).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</div>
                  <div><span className="font-normal">Volumetric Weight:</span> {shipmentData.volumetricWeight} kg</div>
                  <div><span className="font-normal">Chargeable Weight:</span> {shipmentData.chargeableWeight} kg</div>
                  <div><span className="font-normal">Total Packages:</span> {packageData.totalPackages}</div>
                  <div><span className="font-normal">Materials:</span> {packageData.materials}</div>
                  <div className="md:col-span-2"><span className="font-normal">Content Description:</span> {packageData.contentDescription}</div>
                  {shipmentData.actualWeight && shipmentData.perKgWeight && (
                    <div className="md:col-span-2 mt-2 pt-2 border-t border-blue-200">
                      <div className="text-sm text-gray-500">
                        <span className="font-normal">Freight Charge Calculation:</span> {shipmentData.actualWeight} kg × ₹{parseFloat(shipmentData.perKgWeight).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ₹{detailsData.freightCharge ? parseFloat(detailsData.freightCharge).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </div>
                    </div>
                  )}
                  {packageData.packageImages.length > 0 && (
                    <div className="md:col-span-2"><span className="font-normal">Package Images:</span> {packageData.packageImages.length} file(s) uploaded</div>
                  )}
                </div>
              </div>

              {/* Invoice Details Preview */}
              <div className="bg-white rounded-lg p-4 shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,rgba(0,0,0,0.3)_0px_3px_7px_-3px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoice Details
                  </h3>
                  <button
                    type="button"
                    className="text-[#406ab9] hover:text-[#3059a0] transition-colors p-1"
                    onClick={() => setEditingSection('invoice')}
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500">
                  <div><span className="font-normal">Invoice Number:</span> {invoiceData.invoiceNumber}</div>
                  <div><span className="font-normal">Invoice Value:</span> ₹{invoiceData.invoiceValue ? `${formatIndianNumber(invoiceData.invoiceValue)}.00` : '0.00'}</div>
                  {invoiceData.eWaybillNumber && <div><span className="font-normal">E-Waybill Number:</span> {invoiceData.eWaybillNumber}</div>}
                  {invoiceData.invoiceImages.length > 0 && (
                    <div className="md:col-span-2"><span className="font-normal">Invoice Images:</span> {invoiceData.invoiceImages.length} file(s) uploaded</div>
                  )}
                </div>
              </div>

              {/* Billing Details Preview */}
              <div className="bg-white rounded-lg p-4 shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,rgba(0,0,0,0.3)_0px_3px_7px_-3px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Billing Details
                  </h3>
                  <button
                    type="button"
                    className="text-[#406ab9] hover:text-[#3059a0] transition-colors p-1"
                    onClick={() => setEditingSection('billing')}
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500">
                  <div><span className="font-normal">Paid By:</span> {billData.partyType === 'sender' ? 'Sender' : 'Recipient'}</div>
                  <div><span className="font-normal">Bill Type:</span> {billData.billType === 'rcm' ? 'RCM (Reverse Charge Mechanism)' : 'Normal GST'}</div>
                  {detailsData.freightCharge && parseFloat(detailsData.freightCharge) > 0 && (
                    <div><span className="font-normal">Freight Charge:</span> ₹{parseFloat(detailsData.freightCharge).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Determine if we should show the next button
  const shouldShowNextButton = () => {
    if (currentStep === 5) {
      return false; // Don't show next button on preview page
    }
    return currentStep < 5;
  };

  // Don't highlight the first step until the origin form (summary or manual) is visible
  const shouldHighlightOriginStep = currentStep > 0 || showOriginSummaryCard || showOriginManualForm || originSelectedCompany !== null;
  const isSenderPhoneEntryPage = currentStep === 0 && !shouldHighlightOriginStep;
  const displayedCurrentStep = isSenderPhoneEntryPage ? -1 : currentStep;
  const shouldShowBackButton = currentStep > 0 || (currentStep === 0 && shouldHighlightOriginStep);

  const cardSizeClasses = 'max-w-[1200px] pt-[70px] pr-[80px] pb-[60px] pl-[80px]';

  const isCurrentStepReady = () => {
    switch (currentStep) {
      case 0:
      case 1:
        return true;
      case 2: {
        return Boolean(
          shipmentData.natureOfConsignment &&
          shipmentData.services &&
          shipmentData.mode &&
          shipmentData.insurance &&
          shipmentData.riskCoverage &&
          packageData.totalPackages &&
          packageData.materials &&
          packageData.packageImages.length > 0
        );
      }
      case 3: {
        const hasInvoiceNumber = Boolean(invoiceData.invoiceNumber);
        const hasInvoiceValue = Boolean(invoiceData.invoiceValue);
        const needsEway = parseFloat(invoiceData.invoiceValue || '0') >= 50000;
        const hasEway = invoiceData.eWaybillNumber.trim().length === 12;
        const hasAcceptedTerms = invoiceData.acceptTerms;
        return hasInvoiceNumber && hasInvoiceValue && (!needsEway || hasEway) && hasAcceptedTerms;
      }
      case 4:
        return Boolean(billData.partyType && billData.billType);
      default:
        return true;
    }
  };

  return (
    <div className="w-full py-[60px] px-4 relative flex items-center justify-center min-h-screen">
      {showSuccessAnimation && (
        <BookingSuccessAnimation consignmentNumber={consignmentNumber} />
      )}
      <div className={`w-full bg-white rounded-[20px] shadow-[0px_8px_24px_rgba(0,0,0,0.08)] ${cardSizeClasses} relative mx-auto`}>
        {/* Decorative Image */}
        <img
          src={med2Image}
          alt="Medicine Booking"
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-auto object-contain z-10 shadow-[0_25px_20px_-20px_rgba(0,0,0,0.45)]"
        />
        <div className="mb-[30px] text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#007BFF] to-[#3DDC97] bg-clip-text text-transparent">Medicine Booking</h1>
        </div>

        {/* Stepper */}
        <Stepper
          currentStep={displayedCurrentStep}
          steps={steps}
          completedSteps={completedSteps}
        />

        <form onSubmit={handleSubmit} className="space-y-[40px]">
          {/* Step Content */}
          {renderStepContent()}

          {/* Confirm Booking Buttons - shown on Preview step (step 5) */}
          {currentStep === 5 && (
            <div className="flex flex-col items-center pt-6 space-y-4">
              {/* Consignment availability warning */}
              {consignmentAvailable === false && consignmentCheckError && (
                <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-red-700 text-sm">{consignmentCheckError}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-8 py-3 bg-gray-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:bg-gray-600"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || submitSuccess || consignmentAvailable === false}
                  className={`px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center shadow-lg ${isSubmitting || submitSuccess || consignmentAvailable === false
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:from-green-600 hover:to-green-700'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Submission Error Message */}
          {submitError && (
            <div className="flex justify-center mt-4">
              <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Error Message */}
          {/* Global validation banner removed to avoid layout shifts */}

          {/* Navigation Buttons */}
          {currentStep !== 5 && (
            <div className="flex justify-center gap-4 pt-4">
              {/* Hide the back button only on the initial Sender/Consignor screen */}
              {shouldShowBackButton && (
                <button
                  type="button"
                  onClick={() => {
                    if (shouldHighlightOriginStep && currentStep === 0) {
                      resetOriginMobileInput();
                      return;
                    }
                    if (currentStep === 1 && (showDestinationManualForm || showDestinationSummaryCard)) {
                      resetDestinationMobileInput();
                      return;
                    }
                    handlePrevStep();
                  }}
                  className="px-6 py-2 border border-[#406ab9] text-[#406ab9] font-medium rounded-xl transition-all duration-200 flex items-center hover:bg-[#406ab9]/10 shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)]"
                >
                  Back
                </button>
              )}

              {shouldShowNextButton() && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNextStep();
                  }}
                  disabled={!isCurrentStepReady()}
                  className={`px-6 py-2 rounded-xl transition-all duration-200 flex items-center shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)] ${isCurrentStepReady()
                    ? 'bg-[#406ab9] text-white hover:bg-[#3059a0]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  Next
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          style={{ animation: 'fadeIn 0.3s ease-in-out' }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 relative"
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            {/* Animated Green Check Circle */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
                  style={{ animation: 'scaleIn 0.5s ease-out' }}
                >
                  <CheckCircle
                    className="w-12 h-12 text-green-500"
                    style={{ animation: 'fadeIn 0.7s ease-in-out 0.3s both' }}
                  />
                </div>
                <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-75"></div>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Successful!</h3>
              <p className="text-gray-600">
                Your booking has been confirmed successfully.
              </p>
              {consignmentNumber && (
                <p className="text-sm text-gray-500 mt-2">
                  Consignment Number: <span className="font-semibold text-gray-700">{consignmentNumber}</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSuccessPopup(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl transition-all duration-200 hover:bg-gray-200 shadow-lg"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessPopup(false);
                  // Reset form and go back to step 0
                  setCurrentStep(0);
                  setSubmitSuccess(false);
                  setConsignmentNumber(null);
                  setBookingReference(null);
                  // Reset all form data
                  setOriginData({
                    name: '',
                    mobileNumber: '',
                    email: '',
                    companyName: '',
                    flatBuilding: '',
                    locality: '',
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
                  setDestinationData({
                    name: '',
                    mobileNumber: '',
                    email: '',
                    companyName: '',
                    flatBuilding: '',
                    locality: '',
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
                  setPackageData({
                    totalPackages: '',
                    materials: '',
                    packageImages: [],
                    contentDescription: ''
                  });
                  setInvoiceData({
                    invoiceNumber: '',
                    invoiceValue: '',
                    invoiceImages: [],
                    eWaybillNumber: '',
                    acceptTerms: false,
                    panCard: null,
                    declarationForm: null
                  });
                  setShipmentData({
                    natureOfConsignment: 'NON-DOX',
                    services: 'Standard',
                    mode: 'Surface',
                    insurance: 'Consignor not insured the shipment',
                    riskCoverage: 'Owner',
                    dimensions: [{ length: '', breadth: '', height: '', unit: 'cm' }],
                    actualWeight: '',
                    perKgWeight: '',
                    volumetricWeight: 0,
                    chargeableWeight: 0
                  });
                  setOriginMobileDigits(Array(10).fill(''));
                  setDestinationMobileDigits(Array(10).fill(''));
                  setShowOriginSummaryCard(false);
                  setShowOriginManualForm(false);
                  setShowDestinationSummaryCard(false);
                  setShowDestinationManualForm(false);
                  setOriginUserFound(null);
                  setDestinationUserFound(null);
                  setCompletedSteps([false, false, false, false, false, false, false]);
                  // Reset OTP state
                  setShowOriginOtpPopup(false);
                  setOriginOtpInput('');
                  setOriginOtpVerified(false);
                  setShowOriginOtpSuccess(false);
                  // Reset company selection
                  setOriginActiveTab('phone');
                  setDestinationActiveTab('phone');
                  setOriginSelectedCompany(null);
                  setOriginCompanySearch('');
                  setOriginCompanyNames([]);
                  setDestinationSelectedCompany(null);
                  setDestinationCompanySearch('');
                  setDestinationCompanyNames([]);
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl transition-all duration-200 hover:from-green-600 hover:to-green-700 shadow-lg"
              >
                New Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modals - Moved to top level so they work on Preview step */}
      <EditModal
        title="Edit Origin Details"
        isOpen={editingSection === 'origin'}
        onClose={() => setEditingSection(null)}
        onSave={() => setEditingSection(null)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FloatingInput
            label="Concern Name"
            value={originData.name}
            onChange={(value) => handleOriginChange('name', value)}
            icon={<User className="h-4 w-4" />}
            required
          />
          <FloatingInput
            label="Company Name"
            value={originData.companyName}
            onChange={(value) => handleOriginChange('companyName', value)}
            icon={<Building className="h-4 w-4" />}
          />
          <FloatingInput
            label="Locality / Street"
            value={originData.locality}
            onChange={(value) => handleOriginChange('locality', value)}
            required
            icon={<Building className="h-4 w-4" />}
          />
          <FloatingInput
            label="Building / Flat No."
            value={originData.flatBuilding}
            onChange={(value) => handleOriginChange('flatBuilding', value)}
            icon={<Building className="h-4 w-4" />}
            required
          />
          <FloatingInput
            label="Landmark"
            value={originData.landmark}
            onChange={(value) => handleOriginChange('landmark', value)}
            icon={<MapPin className="h-4 w-4" />}
          />
          <FloatingInput
            label="GST"
            value={originData.gstNumber}
            onChange={(value) => {
              const formattedGST = validateGSTFormat(value);
              handleOriginChange('gstNumber', formattedGST);
              if (formattedGST.length > 0 && formattedGST.length < 15) {
                setOriginGstError(true);
              } else {
                setOriginGstError(false);
              }
            }}
            maxLength={15}
            icon={<GstIcon className="h-4 w-4 text-gray-400" />}
            hasValidationError={originGstError}
            validationErrorMessage={originGstError ? 'Please complete the 15-digit GST number or leave it empty' : ''}
          />
          <FloatingInput
            label="PINCode"
            value={originData.pincode}
            onChange={(value) => {
              const pincode = value.replace(/\D/g, '').slice(0, 6);
              handleOriginChange('pincode', pincode);
              if (pincode.length === 6) {
                autoFillFromPincode(pincode, 'origin');
              } else {
                setOriginAreas([]);
                setOriginData(prev => ({ ...prev, area: '', city: '', state: '', district: '' }));
              }
            }}
            type="tel"
            required
            maxLength={6}
            icon={<MapPin className="h-4 w-4" />}
          />
          <FloatingInput
            label="State"
            value={originData.state}
            onChange={(value) => handleOriginChange('state', value)}
            disabled
            icon={<MapPin className="h-4 w-4" />}
          />
          <FloatingInput
            label="City"
            value={originData.city}
            onChange={(value) => handleOriginChange('city', value)}
            disabled
            icon={<MapPin className="h-4 w-4" />}
          />
          {originData.pincode.length === 6 && (
            <FloatingSelect
              label="Area"
              value={originData.area}
              onChange={(value) => handleOriginChange('area', value)}
              options={
                originAreas.length > 0
                  ? originAreas.map(area => ({ value: area, label: area }))
                  : [{ value: 'not-serviceable', label: 'This pincode is not serviceable' }]
              }
              required
              disabled={originAreas.length === 0}
              icon={<MapPin className="h-4 w-4" />}
            />
          )}
          <FloatingInput
            label="Email"
            value={originData.email}
            onChange={(value) => handleOriginChange('email', value)}
            icon={<Mail className="h-4 w-4" />}
            type="email"
          />
          <FloatingInput
            label="Website (Optional)"
            value={originData.website}
            onChange={(value) => handleOriginChange('website', value)}
            type="url"
            icon={<Globe className="h-4 w-4" />}
          />
          <FloatingInput
            label="Anniversary"
            value={originData.anniversary}
            onChange={(value) => handleOriginChange('anniversary', value)}
            type="date"
            icon={<Calendar className="h-4 w-4" />}
            placeholder="dd/mm/yyyy"
          />
          <FloatingInput
            label="Birthday"
            value={originData.birthday}
            onChange={(value) => handleOriginChange('birthday', value)}
            type="date"
            icon={<Calendar className="h-4 w-4" />}
            placeholder="dd/mm/yyyy"
          />
          <FloatingInput
            label="Alternate Number"
            value={originData.alternateNumber}
            onChange={(value) => handleOriginChange('alternateNumber', value)}
            type="tel"
            icon={<Phone className="h-4 w-4" />}
            className="md:col-span-2"
          />
        </div>
        <CustomRadioGroup
          label="Address Type"
          name="originAddressType"
          value={originData.addressType}
          onChange={(value) => handleOriginChange('addressType', value)}
          options={[
            { value: 'Home', label: 'Home' },
            { value: 'Office', label: 'Office' },
            { value: 'Other', label: 'Other' }
          ]}
          allowWrap
        />
      </EditModal>

      <EditModal
        title="Edit Destination Details"
        isOpen={editingSection === 'destination'}
        onClose={() => setEditingSection(null)}
        onSave={() => setEditingSection(null)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FloatingInput
            label="Full Name"
            value={destinationData.name}
            onChange={(value) => handleDestinationChange('name', value)}
            icon={<User className="h-4 w-4" />}
            required
          />
          <FloatingInput
            label="Mobile Number"
            value={destinationData.mobileNumber}
            onChange={(value) => handleDestinationChange('mobileNumber', value)}
            icon={<Phone className="h-4 w-4" />}
            type="tel"
            required
          />
          <FloatingInput
            label="Email Address"
            value={destinationData.email}
            onChange={(value) => handleDestinationChange('email', value)}
            icon={<Mail className="h-4 w-4" />}
            type="email"
          />
          <FloatingInput
            label="Company Name"
            value={destinationData.companyName}
            onChange={(value) => handleDestinationChange('companyName', value)}
            icon={<Building className="h-4 w-4" />}
          />
          <FloatingInput
            label="Flat / Building"
            value={destinationData.flatBuilding}
            onChange={(value) => handleDestinationChange('flatBuilding', value)}
            icon={<Building className="h-4 w-4" />}
            required
          />
          <FloatingInput
            label="Locality / Street"
            value={destinationData.locality}
            onChange={(value) => handleDestinationChange('locality', value)}
            icon={<MapPin className="h-4 w-4" />}
            required
          />
          <FloatingInput
            label="Landmark"
            value={destinationData.landmark}
            onChange={(value) => handleDestinationChange('landmark', value)}
            icon={<MapPin className="h-4 w-4" />}
          />
          <FloatingInput
            label="GST Number"
            value={destinationData.gstNumber}
            onChange={(value) => {
              const formattedGST = validateGSTFormat(value);
              handleDestinationChange('gstNumber', formattedGST);
              if (formattedGST.length > 0 && formattedGST.length < 15) {
                setDestinationGstError(true);
              } else {
                setDestinationGstError(false);
              }
            }}
            maxLength={15}
            icon={<GstIcon className="h-4 w-4 text-gray-400" />}
            hasValidationError={destinationGstError}
            validationErrorMessage={destinationGstError ? 'Please complete the 15-digit GST number or leave it empty' : ''}
          />
          <FloatingInput
            label="PINCode"
            value={destinationData.pincode}
            onChange={(value) => {
              const pincode = value.replace(/\D/g, '').slice(0, 6);
              handleDestinationChange('pincode', pincode);
              if (pincode.length === 6) {
                autoFillFromPincode(pincode, 'destination');
              } else {
                setDestinationAreas([]);
                setDestinationData(prev => ({ ...prev, area: '', city: '', state: '', district: '' }));
              }
            }}
            type="tel"
            required
            maxLength={6}
            icon={<MapPin className="h-4 w-4" />}
          />
          <FloatingInput
            label="City"
            value={destinationData.city}
            onChange={(value) => handleDestinationChange('city', value)}
            icon={<MapPin className="h-4 w-4" />}
            disabled
          />
          <FloatingInput
            label="District"
            value={destinationData.district}
            onChange={(value) => handleDestinationChange('district', value)}
            icon={<MapPin className="h-4 w-4" />}
            disabled
          />
          <FloatingInput
            label="State"
            value={destinationData.state}
            onChange={(value) => handleDestinationChange('state', value)}
            icon={<MapPin className="h-4 w-4" />}
            disabled
          />
          {destinationData.pincode.length === 6 && (
            <FloatingSelect
              label="Area"
              value={destinationData.area}
              onChange={(value) => handleDestinationChange('area', value)}
              options={
                destinationAreas.length > 0
                  ? destinationAreas.map(area => ({ value: area, label: area }))
                  : [{ value: 'not-serviceable', label: 'This pincode is not serviceable' }]
              }
              required
              disabled={destinationAreas.length === 0}
              icon={<MapPin className="h-4 w-4" />}
            />
          )}
        </div>
        <CustomRadioGroup
          label="Address Type"
          name="destinationAddressType"
          value={destinationData.addressType}
          onChange={(value) => handleDestinationChange('addressType', value)}
          options={[
            { value: 'Home', label: 'Home' },
            { value: 'Office', label: 'Office' },
            { value: 'Other', label: 'Other' }
          ]}
          allowWrap
        />
      </EditModal>

      <EditModal
        title="Edit Shipment & Package"
        isOpen={editingSection === 'shipment'}
        onClose={() => setEditingSection(null)}
        onSave={() => setEditingSection(null)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CustomRadioGroup
            label="Nature of Consignment"
            name="editNature"
            value={shipmentData.natureOfConsignment}
            onChange={(value) => handleShipmentChange('natureOfConsignment', value)}
            options={[
              { value: 'NON-DOX', label: 'NON-DOX' },
              { value: 'DOX', label: 'DOX' }
            ]}
            allowWrap
          />
          <CustomRadioGroup
            label="Services"
            name="editServices"
            value={shipmentData.services}
            onChange={(value) => handleShipmentChange('services', value)}
            options={[
              { value: 'Standard', label: 'Standard' },
              { value: 'Priority', label: 'Priority' }
            ]}
            allowWrap
          />
          <CustomRadioGroup
            label="Mode"
            name="editMode"
            value={shipmentData.mode}
            onChange={(value) => handleShipmentChange('mode', value)}
            options={[
              { value: 'Surface', label: 'Surface' },
              { value: 'Air', label: 'Air' },
              { value: 'Cargo', label: 'Cargo' }
            ]}
            allowWrap
          />
          <CustomRadioGroup
            label="Risk Coverage"
            name="editRisk"
            value={shipmentData.riskCoverage}
            onChange={(value) => handleShipmentChange('riskCoverage', value)}
            options={[
              { value: 'Owner', label: 'Owner' },
              { value: 'Carrier', label: 'Carrier' }
            ]}
            allowWrap
          />
        </div>
        <div className="flex flex-wrap gap-4">
          {[
            { value: 'Consignor not insured the shipment', label: 'Consignor not insured the shipment' },
            { value: 'Consignor has insured the shipment', label: 'Consignor has insured the shipment' }
          ].map(option => {
            const optionId = `insurance-edit-${option.value}`;
            const isActive = shipmentData.insurance === option.value;
            return (
              <div key={option.value} className={`radio-wrapper-24 ${isActive ? 'active' : ''}`} onClick={() => handleShipmentChange('insurance', option.value)}>
                <input
                  type="radio"
                  name="editInsurance"
                  id={optionId}
                  value={option.value}
                  checked={isActive}
                  onChange={(e) => handleShipmentChange('insurance', e.target.value)}
                />
                <label htmlFor={optionId} className="ml-2">
                  <span>{option.label}</span>
                </label>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FloatingInput
            label="Total Packages"
            value={packageData.totalPackages}
            onChange={(value) => handlePackageChange('totalPackages', value)}
            type="number"
            required
          />
          <FloatingInput
            label="Materials"
            value={packageData.materials}
            onChange={(value) => handlePackageChange('materials', value)}
            required
          />
          <FloatingInput
            label="Actual Weight (Kg)"
            value={shipmentData.actualWeight}
            onChange={(value) => handleShipmentChange('actualWeight', value)}
            type="number"
            required
          />
          <FloatingInput
            label="Per Kg Rate (₹)"
            value={shipmentData.perKgWeight}
            onChange={(value) => handleShipmentChange('perKgWeight', value)}
            type="number"
          />
          {shipmentData.dimensions.map((dimension, index) => (
            <div key={index} className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
              <FloatingInput
                label="Length"
                value={dimension.length}
                onChange={(value) => handleDimensionChange(index, 'length', value)}
              />
              <FloatingInput
                label="Breadth"
                value={dimension.breadth}
                onChange={(value) => handleDimensionChange(index, 'breadth', value)}
              />
              <FloatingInput
                label="Height"
                value={dimension.height}
                onChange={(value) => handleDimensionChange(index, 'height', value)}
              />
              <FloatingSelect
                label="Unit"
                value={dimension.unit}
                onChange={(value) => handleDimensionChange(index, 'unit', value)}
                options={[
                  { value: 'cm', label: 'cm' },
                  { value: 'mm', label: 'mm' },
                  { value: 'in', label: 'in' }
                ]}
              />
            </div>
          ))}
        </div>
        <FloatingTextarea
          label="Content Description"
          value={packageData.contentDescription}
          onChange={(value) => handlePackageChange('contentDescription', value)}
          rows={3}
        />
        <UploadBox
          label="Package Images"
          files={packageData.packageImages}
          onFilesChange={(files) => handlePackageFileChange('packageImages', files)}
          maxFiles={5}
        />
      </EditModal>

      <EditModal
        title="Edit Invoice Details"
        isOpen={editingSection === 'invoice'}
        onClose={() => setEditingSection(null)}
        onSave={() => setEditingSection(null)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FloatingInput
            label="Invoice Number"
            value={invoiceData.invoiceNumber}
            onChange={(value) => handleInvoiceChange('invoiceNumber', value)}
            required
          />
          <FloatingInput
            label="Invoice Value (₹)"
            value={isInvoiceValueFocused 
              ? formatIndianNumber(invoiceData.invoiceValue) 
              : invoiceData.invoiceValue 
                ? `${formatIndianNumber(invoiceData.invoiceValue)}.00`
                : ''}
            onChange={(value) => handleInvoiceChange('invoiceValue', value)}
            icon={<IndianRupee className="h-4 w-4" />}
            required
            onFocus={() => setIsInvoiceValueFocused(true)}
            onBlur={() => setIsInvoiceValueFocused(false)}
          />
          {parseFloat(invoiceData.invoiceValue || '0') >= 50000 && (
            <FloatingInput
              label="E-Waybill Number"
              value={invoiceData.eWaybillNumber}
              onChange={(value) => handleInvoiceChange('eWaybillNumber', value)}
              maxLength={12}
            />
          )}
        </div>
        <UploadBox
          label="Invoice Documents"
          files={invoiceData.invoiceImages}
          onFilesChange={(files) => handleInvoiceFileChange('invoiceImages', files)}
          maxFiles={5}
        />
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={invoiceData.acceptTerms}
            onChange={(e) => setInvoiceData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
            className="rounded border-gray-300 text-[#406ab9] focus:ring-[#406ab9]"
          />
          I confirm that the invoice details are accurate.
        </label>
      </EditModal>

      <EditModal
        title="Edit Billing Details"
        isOpen={editingSection === 'billing'}
        onClose={() => setEditingSection(null)}
        onSave={() => setEditingSection(null)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CustomRadioGroup
            label="Paid By"
            name="editPartyType"
            value={billData.partyType}
            onChange={(value) => handleBillChange('partyType', value)}
            options={[
              { value: 'sender', label: 'Sender' },
              { value: 'recipient', label: 'Recipient' }
            ]}
            allowWrap
          />
          <CustomRadioGroup
            label="Bill Type"
            name="editBillType"
            value={billData.billType}
            onChange={(value) => handleBillChange('billType', value)}
            options={[
              { value: 'normal', label: 'Normal GST' },
              { value: 'rcm', label: 'RCM' }
            ]}
            allowWrap
          />
        </div>
      </EditModal>

      {/* Origin OTP Popup Modal */}
      {showOriginOtpPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" style={{ boxShadow: 'rgba(0, 0, 0, 0.56) 0px 22px 70px 4px' }}>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Mobile Number</h3>
            <p className="text-sm text-gray-600 mb-6">
              Enter the OTP sent to +91 {originMobileDigits.filter(digit => digit !== '').join('')}
            </p>
            
            <div className="space-y-6" onPaste={handleOriginOtpPaste}>
              <div className="flex items-center justify-center gap-1">
                {Array.from({ length: originOtpBoxCount }).map((_, i) => (
                  <input
                    key={i}
                    id={`origin-otp-${i}`}
                    ref={(el) => (originOtpInputRefs.current[i] = el)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={originOtpInput[i] ?? ''}
                    onChange={(e) => handleOriginOtpBoxChange(i, e.target.value)}
                    onKeyDown={(e) => handleOriginOtpBoxKeyDown(i, e)}
                    className="w-10 h-10 text-center text-lg font-semibold border border-gray-300 rounded-md outline-none shadow-[0_3px_0_rgba(0,0,0,0.15)] focus:border-gray-500 focus:shadow-[0_4px_0_rgba(0,0,0,0.2)]"
                  />
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const mobileNumber = originMobileDigits.filter(digit => digit !== '').join('');
                    handleOriginOtpVerification(mobileNumber);
                  }}
                  disabled={originOtpInput.length < 6}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-10 text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Verify OTP
                </button>
                <button
                  onClick={() => {
                    setShowOriginOtpPopup(false);
                    setOriginOtpInput('');
                  }}
                  className="flex-1 h-10 text-sm font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => {
                    const mobileNumber = originMobileDigits.filter(digit => digit !== '').join('');
                    handleSendOriginOtp(mobileNumber);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  Resend OTP
                </button>
              </div>
            </div>

            {/* OTP Success Message */}
            {showOriginOtpSuccess && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">Mobile Number Verified Successfully!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineBookingPanel;