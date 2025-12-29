import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  Briefcase, 
  Upload, 
  X,
  AlertCircle,
  Eye,
  MapPin,
  CheckCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
}

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
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = isFocused || hasValue;
  const hasValidationError = !!error;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {icon && (
          <div className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 z-10",
            "text-gray-400"
          )}>
            {icon}
          </div>
        )}
        <input
          type={type === 'date' && !isFocused && !hasValue ? 'text' : type}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          disabled={disabled}
          className={cn(
            "w-full h-10 px-3 rounded-xl transition-all duration-200 ease-in-out text-xs",
            "border",
            icon ? "pl-10" : "pl-3",
            hasValidationError ? "pr-10" : "pr-3",
            "bg-white/90 text-[#4B5563] placeholder:text-[#4B5563]",
            "border-gray-300/60",
            hasValidationError
              ? "border-red-500"
              : isFocused
                ? "border-blue-500"
                : "hover:border-blue-400/50",
            disabled && "bg-gray-50 cursor-not-allowed opacity-50",
            "focus:outline-none"
          )}
          placeholder=""
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
              ? "bg-white text-blue-600"
              : "text-gray-500",
            isFocused && !hasValue && "text-blue-600"
          )}
        >
          {placeholder}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      
      {hasValidationError && error && (
        <div className="mt-1">
          <div className="text-xs text-red-600">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

// Floating Label Textarea Component
interface FloatingLabelTextareaProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  error?: string;
  required?: boolean;
  rows?: number;
}

const FloatingLabelTextarea: React.FC<FloatingLabelTextareaProps> = ({
  id,
  value,
  onChange,
  placeholder,
  className = "",
  error,
  required = false,
  rows = 4
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = isFocused || hasValue;
  const hasValidationError = !!error;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={rows}
          className={cn(
            "w-full px-3 pt-3 pb-2 rounded-xl transition-all duration-200 ease-in-out text-xs resize-none",
            "border",
            hasValidationError ? "pr-10" : "pr-3",
            "bg-white/90 text-[#4B5563] placeholder:text-[#4B5563]",
            "border-gray-300/60",
            hasValidationError
              ? "border-red-500"
              : isFocused
                ? "border-blue-500"
                : "hover:border-blue-400/50",
            "focus:outline-none"
          )}
          placeholder=""
        />
        
        {hasValidationError && (
          <div className="absolute right-3 top-3 z-10">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
        
        <label
          className={cn(
            "absolute transition-all duration-200 ease-in-out pointer-events-none select-none",
            "left-4",
            shouldFloat
              ? "top-0 -translate-y-1/2 text-xs px-2"
              : "top-3 text-xs",
            shouldFloat
              ? "bg-white text-blue-600"
              : "text-gray-500",
            isFocused && !hasValue && "text-blue-600"
          )}
        >
          {placeholder}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      
      {hasValidationError && error && (
        <div className="mt-1">
          <div className="text-xs text-red-600">
            {error}
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
  options: string[];
  required?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  error?: string;
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
  error
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldFloat = isFocused || hasValue;
  const hasValidationError = !!error;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {icon && (
          <div className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 z-10",
            "text-gray-400"
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
            icon ? "pl-10" : "pl-3",
            "pr-8",
            "bg-white/90 border-gray-300/60 text-[#4B5563]",
            hasValidationError
              ? "border-red-500"
              : isFocused
                ? "border-blue-500"
                : "hover:border-blue-400/50",
            disabled && "bg-gray-50 cursor-not-allowed",
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
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {hasValidationError && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2 z-10">
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
              ? "bg-white text-blue-600"
              : "text-gray-500",
            isFocused && !hasValue && "text-blue-600"
          )}
        >
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      
      {hasValidationError && error && (
        <div className="mt-1">
          <div className="text-xs text-red-600">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

interface FormData {
  // Section 1: Company & Contact Information
  companyName: string;
  concernPersonName: string;
  designation: string;
  phoneNumber: string;
  emailAddress: string;
  alternatePhoneNumber: string;
  website: string;
  // Address fields (replacing fullAddress)
  locality: string;
  buildingFlatNo: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
  area: string;

  // Section 2: Business & Shipment Details
  typeOfBusiness: string;
  typeOfShipments: string;
  averageShipmentVolume: string;
  mostFrequentRoutes: string;
  weightRange: string;
  packingRequired: string;

  // Section 3: Current Logistics Setup
  existingLogisticsPartners: string;
  currentIssues: string;

  // Section 4: Vehicle Requirements
  vehiclesNeededPerMonth: string;
  typeOfVehicleRequired: string;

  // Section 5: Attachments
  uploadedImages: File[];
}

const SalesForm = () => {
  const { toast } = useToast();
  const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
  
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    concernPersonName: '',
    designation: '',
    phoneNumber: '',
    emailAddress: '',
    alternatePhoneNumber: '',
    website: '',
    locality: '',
    buildingFlatNo: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
    area: '',
    typeOfBusiness: '',
    typeOfShipments: '',
    averageShipmentVolume: '',
    mostFrequentRoutes: '',
    weightRange: '',
    packingRequired: '',
    existingLogisticsPartners: '',
    currentIssues: '',
    vehiclesNeededPerMonth: '',
    typeOfVehicleRequired: '',
    uploadedImages: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [imagePreviews, setImagePreviews] = useState<Array<{ file: File; preview: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [isLoadingPincode, setIsLoadingPincode] = useState(false);
  const [customTypeOfBusiness, setCustomTypeOfBusiness] = useState<string>('');
  const [customTypeOfShipments, setCustomTypeOfShipments] = useState<string>('');
  const [customTypeOfVehicleRequired, setCustomTypeOfVehicleRequired] = useState<string>('');
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [submittedByName, setSubmittedByName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    // For phone number, only allow digits and limit to 10
    if (field === 'phoneNumber') {
      const digitsOnly = value.replace(/\D/g, ''); // Remove all non-digit characters
      const limitedValue = digitsOnly.slice(0, 10); // Limit to 10 digits
      setFormData(prev => ({ ...prev, [field]: limitedValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Clear custom values when switching away from "Other"
      if (field === 'typeOfBusiness' && value !== 'Other') {
        setCustomTypeOfBusiness('');
      }
      if (field === 'typeOfShipments' && value !== 'Other') {
        setCustomTypeOfShipments('');
      }
      if (field === 'typeOfVehicleRequired' && value !== 'Others') {
        setCustomTypeOfVehicleRequired('');
      }
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    // Validate each file
    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} - Invalid file type`);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} - File too large (max 5MB)`);
        return;
      }

      validFiles.push(file);
    });

    // Show error for invalid files
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid files",
        description: invalidFiles.join(', '),
        variant: "destructive"
      });
    }

    if (validFiles.length === 0) return;

    // Add valid files to form data
    setFormData(prev => ({ 
      ...prev, 
      uploadedImages: [...prev.uploadedImages, ...validFiles]
    }));

    // Create previews for new files
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, { file, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input to allow selecting the same files again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.uploadedImages];
      newImages.splice(index, 1);
      return { ...prev, uploadedImages: newImages };
    });
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  // Function to lookup pincode and auto-fill state, city, and areas
  const lookupPincode = async (pincode: string) => {
    if (!pincode || pincode.length !== 6) {
      return;
    }

    setIsLoadingPincode(true);
    try {
      const response = await fetch(`${API_BASE}/api/pincode/${pincode}/simple`);
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          state: data.state || '',
          city: data.city || '',
          area: '' // Reset area when pincode changes
        }));
        setAvailableAreas(data.areas || []);
        
        toast({
          title: "Pincode Found",
          description: `City: ${data.city}, State: ${data.state}`,
        });
      } else {
        // Clear fields if pincode not found
        setFormData(prev => ({
          ...prev,
          state: '',
          city: '',
          area: ''
        }));
        setAvailableAreas([]);
        toast({
          title: "Pincode Not Found",
          description: "The entered pincode is not found in our database.",
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
      setIsLoadingPincode(false);
    }
  };

  // Handle pincode change with number-only restriction
  const handlePincodeChange = (pincode: string) => {
    // Only allow digits and limit to 6 characters
    const numericPincode = pincode.replace(/\D/g, '').slice(0, 6);

    setFormData(prev => ({
      ...prev,
      pincode: numericPincode
    }));

    if (numericPincode.length === 6) {
      lookupPincode(numericPincode);
    } else {
      // Clear fields if pincode is incomplete
      setFormData(prev => ({
        ...prev,
        state: '',
        city: '',
        area: ''
      }));
      setAvailableAreas([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Section 1 validation
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.concernPersonName.trim()) newErrors.concernPersonName = 'Concern person name is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    }
    if (!formData.emailAddress.trim()) {
      newErrors.emailAddress = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address';
    }
    // Address validation
    if (!formData.locality.trim()) newErrors.locality = 'Locality is required';
    if (!formData.buildingFlatNo.trim()) newErrors.buildingFlatNo = 'Building/Flat No is required';
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';

    // Section 2 validation
    if (!formData.typeOfBusiness.trim()) {
      newErrors.typeOfBusiness = 'Type of business is required';
    } else if (formData.typeOfBusiness === 'Other' && !customTypeOfBusiness.trim()) {
      newErrors.typeOfBusiness = 'Please specify the type of business';
    }
    if (!formData.typeOfShipments.trim()) {
      newErrors.typeOfShipments = 'Type of shipments is required';
    } else if (formData.typeOfShipments === 'Other' && !customTypeOfShipments.trim()) {
      newErrors.typeOfShipments = 'Please specify the type of shipments';
    }
    if (!formData.averageShipmentVolume.trim()) newErrors.averageShipmentVolume = 'Average shipment volume is required';
    if (!formData.mostFrequentRoutes.trim()) newErrors.mostFrequentRoutes = 'Most frequent routes is required';
    if (!formData.weightRange.trim()) newErrors.weightRange = 'Weight range is required';
    if (!formData.packingRequired) newErrors.packingRequired = 'Please select if packing is required';

    // Section 3 validation
    if (!formData.existingLogisticsPartners.trim()) newErrors.existingLogisticsPartners = 'Existing logistics partners is required';
    if (!formData.currentIssues.trim()) newErrors.currentIssues = 'Current issues is required';

    // Section 4 validation
    if (!formData.vehiclesNeededPerMonth.trim()) newErrors.vehiclesNeededPerMonth = 'Vehicles needed per month is required';
    if (!formData.typeOfVehicleRequired.trim()) {
      newErrors.typeOfVehicleRequired = 'Type of vehicle required is required';
    } else if (formData.typeOfVehicleRequired === 'Others' && !customTypeOfVehicleRequired.trim()) {
      newErrors.typeOfVehicleRequired = 'Please specify the type of vehicle';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive"
      });
      return;
    }

    // Show name dialog instead of submitting directly
    setNameDialogOpen(true);
  };

  const handleFinalSubmit = async () => {
    // Validate name
    if (!submittedByName.trim()) {
      setNameError('Please enter your name');
      return;
    }

    setNameError('');
    setNameDialogOpen(false);
    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitFormData = new FormData();
      
      // Append all form fields
      submitFormData.append('companyName', formData.companyName.trim());
      submitFormData.append('concernPersonName', formData.concernPersonName.trim());
      submitFormData.append('designation', formData.designation.trim());
      submitFormData.append('phoneNumber', formData.phoneNumber.trim());
      submitFormData.append('emailAddress', formData.emailAddress.trim().toLowerCase());
      submitFormData.append('alternatePhoneNumber', formData.alternatePhoneNumber?.trim() || '');
      submitFormData.append('website', formData.website?.trim() || '');
      
      // Append structured address fields
      submitFormData.append('locality', formData.locality.trim());
      submitFormData.append('buildingFlatNo', formData.buildingFlatNo.trim());
      submitFormData.append('landmark', formData.landmark?.trim() || '');
      submitFormData.append('pincode', formData.pincode.trim());
      submitFormData.append('city', formData.city.trim());
      submitFormData.append('state', formData.state.trim());
      submitFormData.append('area', formData.area?.trim() || '');
      
      // Also send fullAddress for backward compatibility (backend will generate if not provided)
      const fullAddressParts = [
        formData.locality.trim(),
        formData.buildingFlatNo.trim(),
        formData.landmark.trim(),
        formData.area.trim(),
        formData.city.trim(),
        formData.state.trim(),
        formData.pincode.trim()
      ].filter(part => part.length > 0);
      const fullAddress = fullAddressParts.join(', ');
      submitFormData.append('fullAddress', fullAddress);
      // Use custom value if "Other" is selected, otherwise use the selected value
      const typeOfBusinessValue = formData.typeOfBusiness === 'Other' && customTypeOfBusiness.trim() 
        ? customTypeOfBusiness.trim() 
        : formData.typeOfBusiness.trim();
      const typeOfShipmentsValue = formData.typeOfShipments === 'Other' && customTypeOfShipments.trim() 
        ? customTypeOfShipments.trim() 
        : formData.typeOfShipments.trim();
      submitFormData.append('typeOfBusiness', typeOfBusinessValue);
      submitFormData.append('typeOfShipments', typeOfShipmentsValue);
      submitFormData.append('averageShipmentVolume', formData.averageShipmentVolume.trim());
      submitFormData.append('mostFrequentRoutes', formData.mostFrequentRoutes.trim());
      submitFormData.append('weightRange', formData.weightRange.trim());
      submitFormData.append('packingRequired', formData.packingRequired.toLowerCase());
      submitFormData.append('existingLogisticsPartners', formData.existingLogisticsPartners.trim());
      submitFormData.append('currentIssues', formData.currentIssues.trim());
      submitFormData.append('vehiclesNeededPerMonth', formData.vehiclesNeededPerMonth.trim());
      // Use custom value if "Others" is selected, otherwise use the selected value
      const typeOfVehicleRequiredValue = formData.typeOfVehicleRequired === 'Others' && customTypeOfVehicleRequired.trim() 
        ? customTypeOfVehicleRequired.trim() 
        : formData.typeOfVehicleRequired.trim();
      submitFormData.append('typeOfVehicleRequired', typeOfVehicleRequiredValue);
      
      // Append submitted by name
      submitFormData.append('submittedByName', submittedByName.trim());
      
      // Append image files if exist
      formData.uploadedImages.forEach((image, index) => {
        submitFormData.append('uploadedImages', image);
      });

      const response = await fetch(`${API_BASE}/api/sales-form`, {
        method: 'POST',
        body: submitFormData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to submit form');
      }

      // Show success dialog
      setSuccessDialogOpen(true);

      // Reset form
      setFormData({
        companyName: '',
        concernPersonName: '',
        designation: '',
        phoneNumber: '',
        emailAddress: '',
        alternatePhoneNumber: '',
        website: '',
        locality: '',
        buildingFlatNo: '',
        landmark: '',
        pincode: '',
        city: '',
        state: '',
        area: '',
        typeOfBusiness: '',
        typeOfShipments: '',
        averageShipmentVolume: '',
        mostFrequentRoutes: '',
        weightRange: '',
        packingRequired: '',
        existingLogisticsPartners: '',
        currentIssues: '',
        vehiclesNeededPerMonth: '',
        typeOfVehicleRequired: '',
        uploadedImages: [],
      });
      setAvailableAreas([]);
      setImagePreviews([]);
      setErrors({});
      setCustomTypeOfBusiness('');
      setCustomTypeOfShipments('');
      setCustomTypeOfVehicleRequired('');
      setSubmittedByName('');
    } catch (error: any) {
      console.error('Error submitting sales form:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      concernPersonName: '',
      designation: '',
      phoneNumber: '',
      emailAddress: '',
      alternatePhoneNumber: '',
      website: '',
      locality: '',
      buildingFlatNo: '',
      landmark: '',
      pincode: '',
      city: '',
      state: '',
      area: '',
      typeOfBusiness: '',
      typeOfShipments: '',
      averageShipmentVolume: '',
      mostFrequentRoutes: '',
      weightRange: '',
      packingRequired: '',
      existingLogisticsPartners: '',
      currentIssues: '',
      vehiclesNeededPerMonth: '',
      typeOfVehicleRequired: '',
      uploadedImages: [],
    });
    setImagePreviews([]);
    setErrors({});
    setAvailableAreas([]);
    setCustomTypeOfBusiness('');
    setCustomTypeOfShipments('');
    setCustomTypeOfVehicleRequired('');
    setSubmittedByName('');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-20 max-w-6xl">

        <div className="w-full space-y-4 sm:space-y-6 bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="pt-4 sm:pt-6 space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <FloatingLabelInput
                  id="companyName"
                  value={formData.companyName}
                  onChange={(value) => handleInputChange('companyName', value)}
                  placeholder="Company Name"
                  icon={<Building2 className="h-4 w-4" />}
                  error={errors.companyName}
                  required
                />

                <FloatingLabelInput
                  id="concernPersonName"
                  value={formData.concernPersonName}
                  onChange={(value) => handleInputChange('concernPersonName', value)}
                  placeholder="Concern Person Name"
                  icon={<User className="h-4 w-4" />}
                  error={errors.concernPersonName}
                  required
                />

                <FloatingLabelInput
                  id="designation"
                  value={formData.designation}
                  onChange={(value) => handleInputChange('designation', value)}
                  placeholder="Designation"
                  icon={<Briefcase className="h-4 w-4" />}
                  error={errors.designation}
                  required
                />

                <FloatingLabelInput
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(value) => handleInputChange('phoneNumber', value)}
                  placeholder="Phone Number"
                  type="tel"
                  maxLength={10}
                  icon={<Phone className="h-4 w-4" />}
                  error={errors.phoneNumber}
                  required
                />

                <FloatingLabelInput
                  id="emailAddress"
                  value={formData.emailAddress}
                  onChange={(value) => handleInputChange('emailAddress', value)}
                  placeholder="Email Address"
                  type="email"
                  icon={<Mail className="h-4 w-4" />}
                  error={errors.emailAddress}
                  required
                />

                <FloatingLabelInput
                  id="alternatePhoneNumber"
                  value={formData.alternatePhoneNumber}
                  onChange={(value) => handleInputChange('alternatePhoneNumber', value)}
                  placeholder="Alternate Phone Number (Optional)"
                  type="tel"
                  icon={<Phone className="h-4 w-4" />}
                />

                <FloatingLabelInput
                  id="website"
                  value={formData.website}
                  onChange={(value) => handleInputChange('website', value)}
                  placeholder="Website (Optional)"
                  type="url"
                  icon={<Globe className="h-4 w-4" />}
                />
              </div>

              {/* Address Fields */}
              <div className="space-y-3 sm:space-y-4">
                <FloatingLabelInput
                  id="locality"
                  value={formData.locality}
                  onChange={(value) => handleInputChange('locality', value)}
                  placeholder="Locality / Street"
                  icon={<MapPin className="h-4 w-4" />}
                  error={errors.locality}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <FloatingLabelInput
                    id="buildingFlatNo"
                    value={formData.buildingFlatNo}
                    onChange={(value) => handleInputChange('buildingFlatNo', value)}
                    placeholder="Building / Flat No"
                    icon={<Building2 className="h-4 w-4" />}
                    error={errors.buildingFlatNo}
                    required
                  />
                  <FloatingLabelInput
                    id="landmark"
                    value={formData.landmark}
                    onChange={(value) => handleInputChange('landmark', value)}
                    placeholder="Landmark (Optional)"
                    icon={<MapPin className="h-4 w-4" />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <FloatingLabelInput
                    id="pincode"
                    value={formData.pincode}
                    onChange={handlePincodeChange}
                    placeholder="PIN Code"
                    type="tel"
                    maxLength={6}
                    icon={<MapPin className="h-4 w-4" />}
                    error={errors.pincode}
                    required
                    className={isLoadingPincode ? 'opacity-50' : ''}
                  />
                  <FloatingLabelInput
                    id="city"
                    value={formData.city}
                    onChange={(value) => handleInputChange('city', value)}
                    placeholder="City"
                    icon={<MapPin className="h-4 w-4" />}
                    error={errors.city}
                    required
                    disabled={isLoadingPincode}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <FloatingLabelInput
                    id="state"
                    value={formData.state}
                    onChange={(value) => handleInputChange('state', value)}
                    placeholder="State"
                    icon={<MapPin className="h-4 w-4" />}
                    error={errors.state}
                    required
                    disabled={isLoadingPincode}
                  />
                  <div className="relative">
                    <Select
                      value={formData.area}
                      onValueChange={(value) => handleInputChange('area', value)}
                      disabled={availableAreas.length === 0 || isLoadingPincode}
                    >
                      <SelectTrigger className="w-full h-10 bg-white/90 border-gray-300/60 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAreas.map((area, index) => (
                          <SelectItem key={index} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label
                      className={`absolute transition-all duration-200 ease-in-out pointer-events-none select-none left-4 ${
                        formData.area
                          ? 'top-0 -translate-y-1/2 text-xs px-2 bg-white text-blue-600'
                          : 'top-1/2 -translate-y-1/2 text-xs text-gray-500'
                      }`}
                    >
                      Area {availableAreas.length === 0 && formData.pincode.length === 6 && '(Optional)'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FloatingSelect
                    label="Type of Business / Industry"
                    value={formData.typeOfBusiness}
                    onChange={(value) => handleInputChange('typeOfBusiness', value)}
                    options={['E-commerce', 'Manufacturing', 'Retail', 'Wholesale', 'Pharmaceutical', 'Textiles', 'Electronics', 'Food & Beverages', 'Automotive', 'Other']}
                    error={errors.typeOfBusiness}
                    required
                  />
                  {formData.typeOfBusiness === 'Other' && (
                    <div className="mt-3">
                      <FloatingLabelInput
                        id="customTypeOfBusiness"
                        value={customTypeOfBusiness}
                        onChange={(value) => {
                          setCustomTypeOfBusiness(value);
                          if (errors.typeOfBusiness) {
                            setErrors(prev => ({ ...prev, typeOfBusiness: undefined }));
                          }
                        }}
                        placeholder="Please specify type of business"
                        error={errors.typeOfBusiness}
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <FloatingSelect
                    label="Type of Shipments"
                    value={formData.typeOfShipments}
                    onChange={(value) => handleInputChange('typeOfShipments', value)}
                    options={['Documents', 'Parcels', 'Bulk Cargo', 'Fragile Items', 'Perishable Goods', 'Hazardous Materials', 'Mixed', 'Other']}
                    error={errors.typeOfShipments}
                    required
                  />
                  {formData.typeOfShipments === 'Other' && (
                    <div className="mt-3">
                      <FloatingLabelInput
                        id="customTypeOfShipments"
                        value={customTypeOfShipments}
                        onChange={(value) => {
                          setCustomTypeOfShipments(value);
                          if (errors.typeOfShipments) {
                            setErrors(prev => ({ ...prev, typeOfShipments: undefined }));
                          }
                        }}
                        placeholder="Please specify type of shipments"
                        error={errors.typeOfShipments}
                        required
                      />
                    </div>
                  )}
                </div>

                <FloatingLabelInput
                  id="averageShipmentVolume"
                  value={formData.averageShipmentVolume}
                  onChange={(value) => handleInputChange('averageShipmentVolume', value)}
                  placeholder="Average Shipment Volume Per Month"
                  error={errors.averageShipmentVolume}
                  required
                />

                <FloatingLabelInput
                  id="mostFrequentRoutes"
                  value={formData.mostFrequentRoutes}
                  onChange={(value) => handleInputChange('mostFrequentRoutes', value)}
                  placeholder="Most Frequent Routes (From–To)"
                  error={errors.mostFrequentRoutes}
                  required
                />

                <FloatingSelect
                  label="Weight Range of Shipments"
                  value={formData.weightRange}
                  onChange={(value) => handleInputChange('weightRange', value)}
                  options={['0-5 Kg.', '5-10 Kg.', '10-25 Kg.', '25-50 Kg.', '50-100 Kg.', '100-500 Kg.', '500 Kg. +', 'Mixed']}
                  error={errors.weightRange}
                  required
                />

                <div>
                  <style>{`
                    #packing-yes,
                    #packing-no {
                      width: 0.75rem !important;
                      height: 0.75rem !important;
                      min-width: 0.75rem !important;
                      min-height: 0.75rem !important;
                    }
                    #packing-yes svg,
                    #packing-no svg {
                      width: 0.375rem !important;
                      height: 0.375rem !important;
                    }
                  `}</style>
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Packing Required? <span className="text-red-500">*</span>
                    </Label>
                    <RadioGroup
                      value={formData.packingRequired}
                      onValueChange={(value) => handleInputChange('packingRequired', value)}
                      className="flex gap-4 sm:gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="packing-yes" className="!h-3 !w-3" />
                        <Label htmlFor="packing-yes" className="cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="packing-no" className="!h-3 !w-3" />
                        <Label htmlFor="packing-no" className="cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {errors.packingRequired && (
                    <p className="text-sm text-red-600 mt-1">{errors.packingRequired}</p>
                  )}
                </div>
              </div>

              <FloatingLabelTextarea
                id="existingLogisticsPartners"
                value={formData.existingLogisticsPartners}
                onChange={(value) => handleInputChange('existingLogisticsPartners', value)}
                placeholder="Existing Logistics Partners"
                error={errors.existingLogisticsPartners}
                required
                rows={3}
              />

              <FloatingLabelTextarea
                id="currentIssues"
                value={formData.currentIssues}
                onChange={(value) => handleInputChange('currentIssues', value)}
                placeholder="Current Issues / Pain Points (late deliveries, high cost, poor pickup, damage, no tracking, etc.)"
                error={errors.currentIssues}
                required
                rows={4}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingLabelInput
                  id="vehiclesNeededPerMonth"
                  value={formData.vehiclesNeededPerMonth}
                  onChange={(value) => handleInputChange('vehiclesNeededPerMonth', value)}
                  placeholder="Vehicles Needed Per Month"
                  error={errors.vehiclesNeededPerMonth}
                  required
                />

                <div>
                  <FloatingSelect
                    label="Type of Vehicle Required"
                    value={formData.typeOfVehicleRequired}
                    onChange={(value) => handleInputChange('typeOfVehicleRequired', value)}
                    options={['Tata Ace', 'Pickup Van', '407 Truck','14ft','17ft','1109 Truck', '20ft','22ft','Container','Trailer', 'Mixed', 'Others']}
                    error={errors.typeOfVehicleRequired}
                    required
                  />
                  {formData.typeOfVehicleRequired === 'Others' && (
                    <div className="mt-3">
                      <FloatingLabelInput
                        id="customTypeOfVehicleRequired"
                        value={customTypeOfVehicleRequired}
                        onChange={(value) => {
                          setCustomTypeOfVehicleRequired(value);
                          if (errors.typeOfVehicleRequired) {
                            setErrors(prev => ({ ...prev, typeOfVehicleRequired: undefined }));
                          }
                        }}
                        placeholder="Please specify type of vehicle"
                        error={errors.typeOfVehicleRequired}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Upload Images (Business Card / Shop Image / Company Photo)
                </Label>
                <div className={cn(
                  "border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-6 text-center transition-all duration-200",
                  "border-gray-300/60 hover:border-blue-400/50 hover:shadow-sm",
                  "bg-white/50"
                )}>
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    <span className="text-xs sm:text-sm text-gray-600">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      PNG, JPG, JPEG up to 5MB each (Multiple images allowed)
                    </span>
                  </label>
                </div>
                
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imagePreviews.map((item, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={item.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <div
                            className="cursor-pointer p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                            onClick={() => window.open(item.preview, '_blank')}
                            title="View image"
                          >
                            <Eye className="h-4 w-4 text-blue-500" />
                          </div>
                          <div
                            className="cursor-pointer p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                            onClick={() => removeImage(index)}
                            title="Remove image"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
              <Button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto bg-white text-gray-900 border-0 hover:bg-white hover:text-gray-900 shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-w-[120px] bg-blue-500 text-white border-0 hover:bg-blue-500 hover:text-white shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Submitting...
                  </>
                ) : (
                  'Submit Form'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Name Input Dialog */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Your Name</DialogTitle>
            <DialogDescription>
              Please enter your name to submit the form.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="submittedByName">Your Name</Label>
              <Input
                id="submittedByName"
                value={submittedByName}
                onChange={(e) => {
                  setSubmittedByName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="Enter your name"
                className={nameError ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && submittedByName.trim()) {
                    handleFinalSubmit();
                  }
                }}
              />
              {nameError && (
                <p className="text-sm text-red-600">{nameError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNameDialogOpen(false);
                  setSubmittedByName('');
                  setNameError('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={!submittedByName.trim()}
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog with Animation */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-8">
          <style>{`
            @keyframes scale-in {
              0% {
                transform: scale(0);
                opacity: 0;
              }
              50% {
                transform: scale(1.2);
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
            .animate-scale-in {
              animation: scale-in 0.5s ease-out;
            }
            @keyframes fade-in-up {
              0% {
                opacity: 0;
                transform: translateY(20px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fade-in-up {
              animation: fade-in-up 0.6s ease-out;
            }
          `}</style>
          <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in-up">
            {/* Animated Check Circle */}
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-green-100 rounded-full p-4">
                <CheckCircle className="h-16 w-16 text-green-600 animate-scale-in" />
              </div>
            </div>
            
            {/* Success Message */}
            <div className="text-center space-y-2">
              <DialogTitle className="text-2xl font-bold text-green-600">
                Success!
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600">
                Your sales form has been submitted successfully!
              </DialogDescription>
            </div>

            {/* Close Button */}
            <Button
              onClick={() => setSuccessDialogOpen(false)}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default SalesForm;

