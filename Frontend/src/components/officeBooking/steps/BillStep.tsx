/**
 * Bill Step Component
 * Fifth step of the office booking flow - Select billing party and details
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building, Phone, MapPin, FileText, CheckCircle } from 'lucide-react';
import { FloatingInput, FloatingSelect } from '../shared';
import { BillData, OtherPartyDetails } from '../types';

interface BillStepProps {
  data: BillData;
  onChange: (data: BillData) => void;
  onNext: () => void;
  onPrevious: () => void;
  originData: any; // For auto-filling sender data
  destinationData: any; // For auto-filling recipient data
  onPincodeLookup?: (pincode: string) => Promise<{ area?: string; city?: string; district?: string; state?: string }>;
  isDarkMode?: boolean;
}

const BillStep: React.FC<BillStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  originData,
  destinationData,
  onPincodeLookup,
  isDarkMode = false
}) => {
  const [otherPartyAreas, setOtherPartyAreas] = useState<string[]>([]);
  const [otherPartyGstError, setOtherPartyGstError] = useState(false);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

  const handleFieldChange = (field: keyof BillData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleOtherPartyChange = (field: keyof OtherPartyDetails, value: any) => {
    onChange({
      ...data,
      otherPartyDetails: {
        ...data.otherPartyDetails,
        [field]: value
      }
    });
    
    // Clear GST error when field changes
    if (field === 'gstNumber') {
      setOtherPartyGstError(false);
    }
  };

  const handlePartyTypeChange = (partyType: 'sender' | 'recipient' | 'other') => {
    handleFieldChange('partyType', partyType);
  };

  const handlePincodeChange = async (value: string) => {
    const pincode = value.replace(/\D/g, '').slice(0, 6);
    handleOtherPartyChange('pincode', pincode);
    
    if (pincode.length === 6 && onPincodeLookup) {
      setIsCheckingPincode(true);
      try {
        const pincodeData = await onPincodeLookup(pincode);
        if (pincodeData) {
          handleOtherPartyChange('state', pincodeData.state || '');
          handleOtherPartyChange('city', pincodeData.city || '');
          handleOtherPartyChange('district', pincodeData.district || '');
          if (pincodeData.area) {
            setOtherPartyAreas([pincodeData.area]);
            handleOtherPartyChange('area', pincodeData.area);
          }
        }
      } catch (error) {
        console.error('Pincode lookup error:', error);
      } finally {
        setIsCheckingPincode(false);
      }
    }
  };

  // GST validation function - validates and formats input
  const validateGSTFormat = (value: string): string => {
    // Convert to uppercase first, then remove any non-alphanumeric characters
    let cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Limit to 15 characters
    cleanValue = cleanValue.slice(0, 15);
    
    // Apply GST format rules - filter characters based on position
    let formattedValue = '';
    
    for (let i = 0; i < cleanValue.length; i++) {
      const char = cleanValue[i];
      
      if (i < 2) {
        // First 2 positions: State code (numbers only)
        if (/[0-9]/.test(char)) {
          formattedValue += char;
        }
      } else if (i < 7) {
        // Positions 2-6: First part of PAN (letters only)
        if (/[A-Z]/.test(char)) {
          formattedValue += char;
        }
      } else if (i < 11) {
        // Positions 7-10: Second part of PAN (numbers only)
        if (/[0-9]/.test(char)) {
          formattedValue += char;
        }
      } else if (i === 11) {
        // Position 11: Third part of PAN (letter only)
        if (/[A-Z]/.test(char)) {
          formattedValue += char;
        }
      } else if (i === 12) {
        // Position 12: Registration number (1-9 or A-Z)
        if (/[1-9A-Z]/.test(char)) {
          formattedValue += char;
        }
      } else if (i === 13) {
        // Position 13: Default letter (always Z)
        if (char === 'Z') {
          formattedValue += char;
        }
      } else if (i === 14) {
        // Position 14: Checksum (number or letter)
        if (/[0-9A-Z]/.test(char)) {
          formattedValue += char;
        }
      }
    }
    
    return formattedValue;
  };

  const handleGSTChange = (value: string) => {
    const formattedGST = validateGSTFormat(value);
    handleOtherPartyChange('gstNumber', formattedGST);
    
    // Validate GST: if partially filled (1-14 chars), show error
    if (formattedGST.length > 0 && formattedGST.length < 15) {
      setOtherPartyGstError(true);
    } else {
      setOtherPartyGstError(false);
    }
  };

  const handleNext = () => {
    if (!data.partyType || !data.billType) {
      return;
    }
    
    // If "other" is selected, validate other party details
    if (data.partyType === 'other') {
      const otherParty = data.otherPartyDetails;
      if (!otherParty.concernName || !otherParty.companyName || !otherParty.phoneNumber ||
          !otherParty.pincode || !otherParty.area || !otherParty.locality || 
          !otherParty.flatBuilding || !otherParty.gstNumber) {
        return;
      }
      
      // Check GST error
      if (otherPartyGstError) {
        return;
      }
    }
    
    onNext();
  };

  const showOtherPartyForm = data.partyType === 'other';

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-slate-100' : ''}`}>
      

      {/* Party Selection */}
      <div>
        <label className={`block text-sm font-normal mb-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
          Bill to
        </label>
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { value: 'sender', label: 'Sender' },
            { value: 'recipient', label: 'Recipient' },
            { value: 'other', label: 'Other' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handlePartyTypeChange(value as 'sender' | 'recipient' | 'other')}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                isDarkMode
                  ? data.partyType === value
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-slate-800/60 border border-slate-700 text-slate-300 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/50'
                  : data.partyType === value
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white/90 border border-gray-300/60 text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {data.partyType && data.partyType !== 'other' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              isDarkMode
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-blue-50 text-blue-600'
            }`}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Selected: {data.partyType.charAt(0).toUpperCase() + data.partyType.slice(1)}
            </div>
          </motion.div>
        )}
      </div>

      {/* Other Party Details Form */}
      <AnimatePresence>
        {showOtherPartyForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label className={`block text-sm font-normal mb-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              Other Party Details
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                label="Concern Name"
                value={data.otherPartyDetails.concernName}
                onChange={(value) => handleOtherPartyChange('concernName', value)}
                required
                icon={<User className="w-4 h-4" />}
                isDarkMode={isDarkMode}
              />

              <FloatingInput
                label="Company Name"
                value={data.otherPartyDetails.companyName}
                onChange={(value) => handleOtherPartyChange('companyName', value)}
                required
                icon={<Building className="w-4 h-4" />}
                isDarkMode={isDarkMode}
              />

              <FloatingInput
                label="Phone No."
                value={data.otherPartyDetails.phoneNumber}
                onChange={(value) => handleOtherPartyChange('phoneNumber', value.replace(/\D/g, '').slice(0, 10))}
                type="tel"
                maxLength={10}
                required
                icon={<Phone className="w-4 h-4" />}
                isDarkMode={isDarkMode}
              />

              <FloatingInput
                label="PINCode"
                value={data.otherPartyDetails.pincode}
                onChange={handlePincodeChange}
                type="tel"
                maxLength={6}
                required
                disabled={isCheckingPincode}
                icon={<MapPin className="w-4 h-4" />}
                isDarkMode={isDarkMode}
              />

              <FloatingInput
                label="State"
                value={data.otherPartyDetails.state}
                onChange={(value) => handleOtherPartyChange('state', value)}
                disabled
                icon={<MapPin className="w-4 h-4" />}
                isDarkMode={isDarkMode}
              />

              <FloatingInput
                label="City"
                value={data.otherPartyDetails.city}
                onChange={(value) => handleOtherPartyChange('city', value)}
                disabled
                icon={<MapPin className="w-4 h-4" />}
                isDarkMode={isDarkMode}
              />

              <FloatingInput
                label="District"
                value={data.otherPartyDetails.district}
                onChange={(value) => handleOtherPartyChange('district', value)}
                disabled
                icon={<MapPin className="w-4 h-4" />}
                isDarkMode={isDarkMode}
              />

              <FloatingSelect
                label="Area"
                value={data.otherPartyDetails.area}
                onChange={(value) => handleOtherPartyChange('area', value)}
                options={otherPartyAreas.length > 0 ? otherPartyAreas : ['Select Area']}
                required
                disabled={otherPartyAreas.length === 0}
                icon={<MapPin className="w-4 h-4" />}
                isDarkMode={isDarkMode}
              />

              <FloatingInput
                label="Locality / Street"
                value={data.otherPartyDetails.locality}
                onChange={(value) => handleOtherPartyChange('locality', value)}
                required
                icon={<MapPin className="w-4 h-4" />}
                isDarkMode={isDarkMode}
              />

              <FloatingInput
                label="Building / Flat No."
                value={data.otherPartyDetails.flatBuilding}
                onChange={(value) => handleOtherPartyChange('flatBuilding', value)}
                required
                icon={<Building className="w-4 h-4" />}
                isDarkMode={isDarkMode}
              />

              <FloatingInput
                label="Landmark"
                value={data.otherPartyDetails.landmark}
                onChange={(value) => handleOtherPartyChange('landmark', value)}
                icon={<MapPin className="w-4 h-4" />}
                isDarkMode={isDarkMode}
              />

              <FloatingInput
                label="GST"
                value={data.otherPartyDetails.gstNumber}
                onChange={handleGSTChange}
                maxLength={15}
                required
                icon={<FileText className="w-4 h-4" />}
                hasValidationError={otherPartyGstError}
                validationErrorMessage={otherPartyGstError ? "Please complete the 15-digit GST number or leave it empty" : ""}
                isDarkMode={isDarkMode}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bill Type */}
      <div>
        <label className={`block text-sm font-normal mb-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
          Bill Type
        </label>
        <FloatingSelect
          label="Select Bill Type"
          value={data.billType === 'normal' ? 'GST Bill' : data.billType === 'rcm' ? 'RCM Bill' : ''}
          onChange={(value) => {
            const billTypeValue = value === 'GST Bill' ? 'normal' : value === 'RCM Bill' ? 'rcm' : '';
            handleFieldChange('billType', billTypeValue);
          }}
          options={['GST Bill', 'RCM Bill']}
          required
          isDarkMode={isDarkMode}
        />
        {data.billType && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              isDarkMode
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-blue-50 text-blue-600'
            }`}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Selected: {data.billType === 'normal' ? 'GST Bill' : 'RCM Bill'}
            </div>
          </motion.div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onPrevious}
          className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-slate-800/60 border border-slate-700 hover:bg-slate-700 text-slate-100'
              : 'bg-white/90 border border-slate-300 hover:bg-slate-50 text-slate-700'
          }`}
        >
          ← Previous Step
        </button>
        <button
          onClick={handleNext}
          disabled={!data.partyType || !data.billType || (showOtherPartyForm && (otherPartyGstError || !data.otherPartyDetails.concernName || !data.otherPartyDetails.companyName || !data.otherPartyDetails.phoneNumber || !data.otherPartyDetails.pincode || !data.otherPartyDetails.area || !data.otherPartyDetails.locality || !data.otherPartyDetails.flatBuilding || !data.otherPartyDetails.gstNumber))}
          className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
            !data.partyType || !data.billType || (showOtherPartyForm && (otherPartyGstError || !data.otherPartyDetails.concernName || !data.otherPartyDetails.companyName || !data.otherPartyDetails.phoneNumber || !data.otherPartyDetails.pincode || !data.otherPartyDetails.area || !data.otherPartyDetails.locality || !data.otherPartyDetails.flatBuilding || !data.otherPartyDetails.gstNumber))
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } shadow-md`}
        >
          Next Step →
        </button>
      </div>
    </div>
  );
};

export default BillStep;

