/**
 * Serviceability Step Component
 * First step of the office booking flow - Check pincode serviceability
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader2, ArrowRight } from 'lucide-react';
import { FloatingInput } from '../shared';
import { cn } from '@/lib/utils';

interface ServiceabilityStepProps {
  originPincode: string;
  destinationPincode: string;
  onOriginPincodeChange: (value: string) => void;
  onDestinationPincodeChange: (value: string) => void;
  originServiceable: boolean | null;
  destinationServiceable: boolean | null;
  checkingOrigin: boolean;
  checkingDestination: boolean;
  originAddressInfo: string;
  destinationAddressInfo: string;
  onNext: () => void;
  isDarkMode?: boolean;
}

const ServiceabilityStep: React.FC<ServiceabilityStepProps> = ({
  originPincode,
  destinationPincode,
  onOriginPincodeChange,
  onDestinationPincodeChange,
  originServiceable,
  destinationServiceable,
  checkingOrigin,
  checkingDestination,
  originAddressInfo,
  destinationAddressInfo,
  onNext,
  isDarkMode = false
}) => {
  const canProceed = originServiceable === true && destinationServiceable === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      

      <div className={cn(
        "rounded-2xl border-2 shadow-lg p-6 sm:p-8",
        isDarkMode
          ? "border-slate-700 bg-slate-900/60"
          : "border-slate-200 bg-white"
      )}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Origin Pincode */}
          <div className="space-y-2">
            <FloatingInput
              label="Sender's Pin No."
              value={originPincode}
              onChange={onOriginPincodeChange}
              type="text"
              required
              maxLength={6}
              icon={<MapPin className="w-4 h-4" />}
              serviceabilityStatus={originServiceable === true ? 'available' : originServiceable === false ? 'unavailable' : null}
              showInlineStatus={originPincode.length === 6}
              addressInfo={originAddressInfo}
              errorMessage="This area is not serviceable"
              isDarkMode={isDarkMode}
            />
            {checkingOrigin && (
              <div className={cn(
                "flex items-center gap-2 text-xs sm:text-sm",
                isDarkMode ? "text-blue-400" : "text-blue-600"
              )}>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking serviceability...</span>
              </div>
            )}
          </div>

          {/* Destination Pincode */}
          <div className="space-y-2">
            <FloatingInput
              label="Recipient's Pin No."
              value={destinationPincode}
              onChange={onDestinationPincodeChange}
              type="text"
              required
              maxLength={6}
              icon={<MapPin className="w-4 h-4" />}
              serviceabilityStatus={destinationServiceable === true ? 'available' : destinationServiceable === false ? 'unavailable' : null}
              showInlineStatus={destinationPincode.length === 6}
              addressInfo={destinationAddressInfo}
              errorMessage="This area is not serviceable"
              isDarkMode={isDarkMode}
            />
            {checkingDestination && (
              <div className={cn(
                "flex items-center gap-2 text-xs sm:text-sm",
                isDarkMode ? "text-blue-400" : "text-blue-600"
              )}>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking serviceability...</span>
              </div>
            )}
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-4 sm:pt-6">
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={cn(
              "px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-md",
              canProceed
                ? isDarkMode
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-[#406ab9] hover:bg-[#3059a0] text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            Next Step →
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceabilityStep;

