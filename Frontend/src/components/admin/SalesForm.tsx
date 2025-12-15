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
  CheckCircle,
  AlertCircle,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  required = false
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
  fullAddress: string;

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
  uploadedImage: File | null;
}

const SalesForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    concernPersonName: '',
    designation: '',
    phoneNumber: '',
    emailAddress: '',
    alternatePhoneNumber: '',
    website: '',
    fullAddress: '',
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
    uploadedImage: null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    // For phone number, only allow digits and limit to 10
    if (field === 'phoneNumber') {
      const digitsOnly = value.replace(/\D/g, ''); // Remove all non-digit characters
      const limitedValue = digitsOnly.slice(0, 10); // Limit to 10 digits
      setFormData(prev => ({ ...prev, [field]: limitedValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      setFormData(prev => ({ ...prev, uploadedImage: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, uploadedImage: null }));
    setImagePreview(null);
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
    if (!formData.fullAddress.trim()) newErrors.fullAddress = 'Full address is required';

    // Section 2 validation
    if (!formData.typeOfBusiness.trim()) newErrors.typeOfBusiness = 'Type of business is required';
    if (!formData.typeOfShipments.trim()) newErrors.typeOfShipments = 'Type of shipments is required';
    if (!formData.averageShipmentVolume.trim()) newErrors.averageShipmentVolume = 'Average shipment volume is required';
    if (!formData.mostFrequentRoutes.trim()) newErrors.mostFrequentRoutes = 'Most frequent routes is required';
    if (!formData.weightRange.trim()) newErrors.weightRange = 'Weight range is required';
    if (!formData.packingRequired) newErrors.packingRequired = 'Please select if packing is required';

    // Section 3 validation
    if (!formData.existingLogisticsPartners.trim()) newErrors.existingLogisticsPartners = 'Existing logistics partners is required';
    if (!formData.currentIssues.trim()) newErrors.currentIssues = 'Current issues is required';

    // Section 4 validation
    if (!formData.vehiclesNeededPerMonth.trim()) newErrors.vehiclesNeededPerMonth = 'Vehicles needed per month is required';
    if (!formData.typeOfVehicleRequired.trim()) newErrors.typeOfVehicleRequired = 'Type of vehicle required is required';

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

    setIsSubmitting(true);

    try {
      // TODO: Implement API call when backend is ready
      console.log('Form Data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: "Sales form submitted successfully!",
      });

      // Reset form
      setFormData({
        companyName: '',
        concernPersonName: '',
        designation: '',
        phoneNumber: '',
        emailAddress: '',
        alternatePhoneNumber: '',
        website: '',
        fullAddress: '',
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
        uploadedImage: null,
      });
      setImagePreview(null);
      setErrors({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">

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

            <FloatingLabelTextarea
              id="fullAddress"
              value={formData.fullAddress}
              onChange={(value) => handleInputChange('fullAddress', value)}
              placeholder="Full Address"
              error={errors.fullAddress}
              required
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingSelect
                label="Type of Business / Industry"
                value={formData.typeOfBusiness}
                onChange={(value) => handleInputChange('typeOfBusiness', value)}
                options={['E-commerce', 'Manufacturing', 'Retail', 'Wholesale', 'Pharmaceutical', 'Textiles', 'Electronics', 'Food & Beverages', 'Automotive', 'Other']}
                error={errors.typeOfBusiness}
                required
              />

              <FloatingSelect
                label="Type of Shipments"
                value={formData.typeOfShipments}
                onChange={(value) => handleInputChange('typeOfShipments', value)}
                options={['Documents', 'Parcels', 'Bulk Cargo', 'Fragile Items', 'Perishable Goods', 'Hazardous Materials', 'Mixed', 'Other']}
                error={errors.typeOfShipments}
                required
              />

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
                options={['0-5 kg', '5-10 kg', '10-25 kg', '25-50 kg', '50-100 kg', '100-500 kg', '500 kg+', 'Mixed']}
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

              <FloatingSelect
                label="Type of Vehicle Required"
                value={formData.typeOfVehicleRequired}
                onChange={(value) => handleInputChange('typeOfVehicleRequired', value)}
                options={['Tata Ace', 'Bolero', 'Pickup', '14ft', '17ft', '19ft', 'Container', 'Mixed', 'Other']}
                error={errors.typeOfVehicleRequired}
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Upload Image (Business Card / Shop Image / Company Photo)
              </Label>
              {!imagePreview ? (
                <div className={cn(
                  "border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-6 text-center transition-all duration-200",
                  "border-gray-300/60 hover:border-blue-400/50 hover:shadow-sm",
                  "bg-white/50"
                )}>
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
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
                      PNG, JPG, JPEG up to 5MB
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-xs h-auto max-h-20 rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-3">
                    <div
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(imagePreview, '_blank')}
                      title="View image"
                    >
                      <Eye className="h-5 w-5 text-blue-500 drop-shadow-lg" />
                    </div>
                    <div
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={removeImage}
                      title="Remove image"
                    >
                      <X className="h-5 w-5 text-blue-500 drop-shadow-lg" />
                    </div>
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
          <Button
            type="button"
            onClick={() => {
              setFormData({
                companyName: '',
                concernPersonName: '',
                designation: '',
                phoneNumber: '',
                emailAddress: '',
                alternatePhoneNumber: '',
                website: '',
                fullAddress: '',
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
                uploadedImage: null,
              });
              setImagePreview(null);
              setErrors({});
            }}
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
  );
};

export default SalesForm;
