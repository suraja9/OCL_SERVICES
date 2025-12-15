import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MedicineSidebar from '../../components/medicine/MedicineSidebar';
import { cn } from '@/lib/utils';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  Loader2,
  AlertCircle,
  RefreshCw,
  Package,
  Weight,
  FileText,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';

interface MedicineUserInfo {
  id: string;
  name: string;
  email: string;
}

interface CourierBoy {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  area: string;
  pincode: string;
  locality: string;
  building: string;
  vehicleType: string;
  licenseNumber: string;
  profilePhotoUrl?: string;
}

interface AssignmentFormData {
  customerName: string;
  phoneNumber: string;
  bookingAddress: string;
  numberOfPackages: string;
  approxWeight: string;
  specialInstruction: string;
}

// Floating Input Component
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
  isDarkMode?: boolean;
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
        <input
          type={type === 'date' && !isFocused && !hasValue ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          disabled={disabled}
          className={cn(
            "w-full h-10 px-3 rounded-xl transition-all duration-200 ease-in-out text-xs border",
            icon ? "pl-10" : "pl-3",
            hasValidationError ? "pr-10" : "pr-3",
            isDarkMode 
              ? "bg-slate-800/60 text-slate-100 placeholder:text-slate-400 border-slate-700" 
              : "bg-white/90 text-[#4B5563] placeholder:text-[#4B5563] border-gray-300/60",
            hasValidationError
              ? "border-red-500 ring-2 ring-red-200"
              : isFocused
                ? isDarkMode
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg"
                  : "border-blue-500 ring-2 ring-blue-200 shadow-md"
                : isDarkMode
                  ? "hover:border-blue-400/50"
                  : "hover:border-blue-400/50 hover:shadow-sm",
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
      
      {hasValidationError && validationErrorMessage && (
        <div className="mt-1">
          <div className="text-xs text-red-500">
            {validationErrorMessage}
          </div>
        </div>
      )}
    </div>
  );
};

// Floating Textarea Component
interface FloatingTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  rows?: number;
  hasValidationError?: boolean;
  validationErrorMessage?: string;
  isDarkMode?: boolean;
}

const FloatingTextarea: React.FC<FloatingTextareaProps> = ({
  label,
  value,
  onChange,
  required = false,
  icon,
  disabled = false,
  className = '',
  placeholder = '',
  rows = 3,
  hasValidationError = false,
  validationErrorMessage = '',
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
            "absolute left-3 top-3 z-10",
            isDarkMode ? "text-slate-400" : "text-gray-400"
          )}>
            {icon}
          </div>
        )}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          rows={rows}
          className={cn(
            "w-full px-3 pt-3 pb-2 rounded-xl transition-all duration-200 ease-in-out text-xs border resize-none",
            icon ? "pl-10" : "pl-3",
            isDarkMode 
              ? "bg-slate-800/60 text-slate-100 placeholder:text-slate-400 border-slate-700" 
              : "bg-white/90 text-[#4B5563] placeholder:text-[#4B5563] border-gray-300/60",
            hasValidationError
              ? "border-red-500 ring-2 ring-red-200"
              : isFocused
                ? isDarkMode
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg"
                  : "border-blue-500 ring-2 ring-blue-200 shadow-md"
                : isDarkMode
                  ? "hover:border-blue-400/50"
                  : "hover:border-blue-400/50 hover:shadow-sm",
            disabled && (isDarkMode ? "bg-slate-900/40 cursor-not-allowed" : "bg-gray-50 cursor-not-allowed"),
            "focus:outline-none"
          )}
          placeholder={placeholder || ""}
        />
        
        <label
          className={cn(
            "absolute transition-all duration-200 ease-in-out pointer-events-none select-none",
            icon ? "left-12" : "left-4",
            shouldFloat
              ? "top-0 -translate-y-1/2 text-xs px-2"
              : "top-3 text-xs",
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
      
      {hasValidationError && validationErrorMessage && (
        <div className="mt-1">
          <div className="text-xs text-red-500">
            {validationErrorMessage}
          </div>
        </div>
      )}
    </div>
  );
};

const MedicineAssignPickup: React.FC = () => {
  const [user, setUser] = useState<MedicineUserInfo | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem('medicineDarkMode');
    return savedDarkMode === 'true';
  });
  const [courierBoys, setCourierBoys] = useState<CourierBoy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourierBoy, setSelectedCourierBoy] = useState<CourierBoy | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [formData, setFormData] = useState<AssignmentFormData>({
    customerName: '',
    phoneNumber: '',
    bookingAddress: '',
    numberOfPackages: '',
    approxWeight: '',
    specialInstruction: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<AssignmentFormData>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('medicineToken');
    const info = localStorage.getItem('medicineInfo');
    if (!token || !info) {
      navigate('/medicine');
      return;
    }
    try {
      setUser(JSON.parse(info));
    } catch {
      navigate('/medicine');
      return;
    }
  }, [navigate]);

  // Fetch courier boys
  useEffect(() => {
    if (user) {
      fetchCourierBoys();
    }
  }, [user]);

  const fetchCourierBoys = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('medicineToken');
      if (!token) {
        navigate('/medicine');
        return;
      }

      const response = await fetch('/api/medicine/courier-boys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setCourierBoys(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch courier boys');
      }
    } catch (error: any) {
      console.error('Error fetching courier boys:', error);
      setError(error.message || 'Failed to fetch courier boys');
    } finally {
      setIsLoading(false);
    }
  };

  // Persist dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('medicineDarkMode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    localStorage.removeItem('medicineToken');
    localStorage.removeItem('medicineInfo');
    navigate('/medicine');
  };

  const handleAssignClick = (courierBoy: CourierBoy) => {
    setSelectedCourierBoy(courierBoy);
    setFormData({
      customerName: '',
      phoneNumber: '',
      bookingAddress: '',
      numberOfPackages: '',
      approxWeight: '',
      specialInstruction: ''
    });
    setFormErrors({});
    setIsAssignModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAssignModalOpen(false);
    setSelectedCourierBoy(null);
    setFormData({
      customerName: '',
      phoneNumber: '',
      bookingAddress: '',
      numberOfPackages: '',
      approxWeight: '',
      specialInstruction: ''
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<AssignmentFormData> = {};
    
    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      errors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.bookingAddress.trim()) {
      errors.bookingAddress = 'Booking address is required';
    }
    
    if (!formData.numberOfPackages.trim()) {
      errors.numberOfPackages = 'Number of packages is required';
    } else if (isNaN(Number(formData.numberOfPackages)) || Number(formData.numberOfPackages) <= 0) {
      errors.numberOfPackages = 'Please enter a valid number';
    }
    
    if (!formData.approxWeight.trim()) {
      errors.approxWeight = 'Approximate weight is required';
    } else if (isNaN(Number(formData.approxWeight)) || Number(formData.approxWeight) <= 0) {
      errors.approxWeight = 'Please enter a valid weight';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!selectedCourierBoy) {
      setError('No courier boy selected');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const token = localStorage.getItem('medicineToken');
      if (!token) {
        navigate('/medicine');
        return;
      }

      const response = await fetch('/api/medicine/courier-boys/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courierBoyId: selectedCourierBoy._id,
          customerDetails: {
            customerName: formData.customerName.trim(),
            phoneNumber: formData.phoneNumber,
            bookingAddress: formData.bookingAddress.trim(),
            numberOfPackages: formData.numberOfPackages,
            approxWeight: formData.approxWeight,
            specialInstruction: formData.specialInstruction.trim()
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        // Success - close modal and show success message
        handleCloseModal();
        // Optionally refresh the courier boys list
        await fetchCourierBoys();
        // You can add a toast notification here if you have one
        alert('Pickup assigned successfully!');
      } else {
        setError(data.error || data.message || 'Failed to assign pickup');
      }
    } catch (error: any) {
      console.error('Error assigning pickup:', error);
      setError(error.message || 'Failed to assign pickup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sanitizePhoneNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  const sanitizeInteger = (value: string) => {
    return value.replace(/\D/g, '');
  };

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

  return (
    <div className={cn(
      "flex h-screen w-screen overflow-hidden transition-colors",
      isDarkMode ? "bg-slate-950" : "bg-gray-100"
    )}>
      <MedicineSidebar 
        user={user} 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
      />
      <main className={cn(
        `${isSidebarCollapsed ? 'ml-16 w-[calc(100vw-4rem)]' : 'ml-80 w-[calc(100vw-20rem)]'} h-screen overflow-y-auto p-6 transition-all duration-300 ease-in-out`,
        isDarkMode ? "bg-slate-950" : "bg-gray-100"
      )}>
        <div className={cn(
          "rounded-2xl shadow-[0_20px_50px_rgba(16,24,40,0.08)] border p-6 min-h-[calc(100vh-3rem)]",
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-lg",
                isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
              )}>
                <User className={cn(
                  "h-6 w-6",
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                )} />
              </div>
              <div>
                <h1 className={cn(
                  "text-2xl font-bold",
                  isDarkMode ? "text-gray-100" : "text-gray-800"
                )}>
                  Assign Pickup - Courier Boys
                </h1>
                <p className={cn(
                  "text-sm",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  Available Medicine courier boys for pickup assignment
                </p>
              </div>
            </div>
            <button
              onClick={fetchCourierBoys}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                isDarkMode 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
              Refresh
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className={cn(
              "mb-4 rounded-lg p-4 flex items-center gap-2",
              isDarkMode ? "bg-red-900/30 border border-red-800" : "bg-red-50 border border-red-200"
            )}>
              <AlertCircle className={cn(
                "h-5 w-5",
                isDarkMode ? "text-red-400" : "text-red-600"
              )} />
              <p className={cn(
                "text-sm",
                isDarkMode ? "text-red-400" : "text-red-700"
              )}>
                {error}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={cn(
                "h-8 w-8 animate-spin",
                isDarkMode ? "text-blue-400" : "text-blue-600"
              )} />
            </div>
          ) : (
            <>
              {/* Courier Boys Grid */}
              {courierBoys.length === 0 ? (
                <div className="text-center py-12">
                  <User className={cn(
                    "h-12 w-12 mx-auto mb-4",
                    isDarkMode ? "text-gray-600" : "text-gray-400"
                  )} />
                  <p className={cn(
                    "text-lg",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>
                    No courier boys found
                  </p>
                  <p className={cn(
                    "text-sm mt-2",
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  )}>
                    There are no approved Medicine courier boys available at the moment
                  </p>
                </div>
              ) : (
                <div className={cn(
                  "rounded-lg border overflow-hidden",
                  isDarkMode ? "border-slate-700" : "border-gray-200"
                )}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={cn(
                          "border-b",
                          isDarkMode ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200"
                        )}>
                          <th className={cn(
                            "px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider",
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            Courier Boy
                          </th>
                          <th className={cn(
                            "px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider",
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            Contact
                          </th>
                          <th className={cn(
                            "px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider",
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            Address
                          </th>
                          <th className={cn(
                            "px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider",
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            Vehicle
                          </th>
                          <th className={cn(
                            "px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider",
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className={cn(
                        "divide-y",
                        isDarkMode ? "divide-slate-700" : "divide-gray-200"
                      )}>
                        {courierBoys.map((courierBoy) => (
                          <tr
                            key={courierBoy._id}
                            className={cn(
                              "transition-colors hover:bg-opacity-50",
                              isDarkMode 
                                ? "bg-slate-800 hover:bg-slate-700" 
                                : "bg-white hover:bg-gray-50"
                            )}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {courierBoy.profilePhotoUrl ? (
                                  <img
                                    src={courierBoy.profilePhotoUrl}
                                    alt={courierBoy.fullName}
                                    className="w-12 h-12 rounded-full object-cover border-2"
                                    style={{ borderColor: isDarkMode ? '#475569' : '#e5e7eb' }}
                                  />
                                ) : (
                                  <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center",
                                    isDarkMode ? "bg-slate-700" : "bg-gray-100"
                                  )}>
                                    <User className={cn(
                                      "h-6 w-6",
                                      isDarkMode ? "text-gray-400" : "text-gray-400"
                                    )} />
                                  </div>
                                )}
                                <div>
                                  <div className={cn(
                                    "text-sm font-semibold",
                                    isDarkMode ? "text-gray-100" : "text-gray-900"
                                  )}>
                                    {courierBoy.fullName}
                                  </div>
                                  {courierBoy.licenseNumber && (
                                    <div className={cn(
                                      "text-xs mt-1",
                                      isDarkMode ? "text-gray-500" : "text-gray-500"
                                    )}>
                                      License: {courierBoy.licenseNumber}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Phone className={cn(
                                    "h-4 w-4",
                                    isDarkMode ? "text-gray-500" : "text-gray-400"
                                  )} />
                                  <span className={cn(
                                    "text-sm",
                                    isDarkMode ? "text-gray-300" : "text-gray-700"
                                  )}>
                                    {courierBoy.phone}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className={cn(
                                    "h-4 w-4",
                                    isDarkMode ? "text-gray-500" : "text-gray-400"
                                  )} />
                                  <span className={cn(
                                    "text-sm truncate max-w-[200px]",
                                    isDarkMode ? "text-gray-300" : "text-gray-700"
                                  )}>
                                    {courierBoy.email}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-2 max-w-[250px]">
                                <MapPin className={cn(
                                  "h-4 w-4 flex-shrink-0 mt-0.5",
                                  isDarkMode ? "text-gray-500" : "text-gray-400"
                                )} />
                                <div>
                                  <div className={cn(
                                    "text-sm",
                                    isDarkMode ? "text-gray-300" : "text-gray-700"
                                  )}>
                                    {courierBoy.locality}, {courierBoy.building}
                                  </div>
                                  <div className={cn(
                                    "text-xs mt-1",
                                    isDarkMode ? "text-gray-500" : "text-gray-500"
                                  )}>
                                    {courierBoy.area} - {courierBoy.pincode}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Car className={cn(
                                  "h-4 w-4",
                                  isDarkMode ? "text-gray-500" : "text-gray-400"
                                )} />
                                <span className={cn(
                                  "text-sm",
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                )}>
                                  {courierBoy.vehicleType}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleAssignClick(courierBoy)}
                                className={cn(
                                  "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                                  "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2",
                                  isDarkMode
                                    ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                                    : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                                )}
                              >
                                Assign
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Assign Pickup Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className={cn(
          "max-w-xl max-h-[90vh] overflow-y-auto p-5 pt-8",
          isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"
        )}>
          <div className="space-y-4">
            {/* Customer Name */}
            <FloatingInput
              label="Customer Name"
              value={formData.customerName}
              onChange={(value) => setFormData({ ...formData, customerName: value })}
              required
              hasValidationError={!!formErrors.customerName}
              validationErrorMessage={formErrors.customerName}
              isDarkMode={isDarkMode}
            />

            {/* Phone Number */}
            <FloatingInput
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={(value) => setFormData({ ...formData, phoneNumber: sanitizePhoneNumber(value) })}
              required
              maxLength={10}
              icon={<Phone className="h-4 w-4" />}
              hasValidationError={!!formErrors.phoneNumber}
              validationErrorMessage={formErrors.phoneNumber}
              isDarkMode={isDarkMode}
            />

            {/* Booking Address */}
            <FloatingTextarea
              label="Booking Address"
              value={formData.bookingAddress}
              onChange={(value) => setFormData({ ...formData, bookingAddress: value })}
              required
              icon={<MapPin className="h-4 w-4" />}
              rows={2}
              hasValidationError={!!formErrors.bookingAddress}
              validationErrorMessage={formErrors.bookingAddress}
              isDarkMode={isDarkMode}
            />

            {/* Number of Packages and Approx Weight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Number of Packages */}
              <FloatingInput
                label="No. of Packages"
                value={formData.numberOfPackages}
                onChange={(value) => setFormData({ ...formData, numberOfPackages: sanitizeInteger(value) })}
                required
                icon={<Package className="h-4 w-4" />}
                hasValidationError={!!formErrors.numberOfPackages}
                validationErrorMessage={formErrors.numberOfPackages}
                isDarkMode={isDarkMode}
              />

              {/* Approx Weight */}
              <FloatingInput
                label="Approx Weight (kg)"
                value={formData.approxWeight}
                onChange={(value) => setFormData({ ...formData, approxWeight: sanitizeDecimal(value) })}
                required
                icon={<Weight className="h-4 w-4" />}
                hasValidationError={!!formErrors.approxWeight}
                validationErrorMessage={formErrors.approxWeight}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Special Instruction */}
            <FloatingTextarea
              label="Special Instruction"
              value={formData.specialInstruction}
              onChange={(value) => setFormData({ ...formData, specialInstruction: value })}
              icon={<FileText className="h-4 w-4" />}
              rows={2}
              isDarkMode={isDarkMode}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <button
              onClick={handleCloseModal}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2",
                isDarkMode
                  ? "bg-slate-700 text-slate-200 hover:bg-slate-600 focus:ring-slate-500"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleFormSubmit}
              disabled={isSubmitting}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isDarkMode
                  ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                  : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 inline-block animate-spin mr-2" />
                  Assigning...
                </>
              ) : (
                'Assign Pickup'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicineAssignPickup;

