/**
 * Payment Step Component
 * Seventh step of the office booking flow - Select payment method and delivery type
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, Truck, Building, CheckCircle, Check, ArrowLeft, ArrowRight, Package, PackageCheck, User, Phone, MapPin, X, Loader2 } from 'lucide-react';
import { PaymentData } from '../types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { API_BASE } from '../utils/constants';

interface PaymentStepProps {
  data: PaymentData;
  onChange: (data: PaymentData) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
  isDarkMode?: boolean;
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
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting = false,
  submitError = null,
  isDarkMode = false
}) => {
  const [showCourierBoyDialog, setShowCourierBoyDialog] = useState(false);
  const [courierBoys, setCourierBoys] = useState<CourierBoy[]>([]);
  const [loadingCourierBoys, setLoadingCourierBoys] = useState(false);
  const [selectedCourierBoyId, setSelectedCourierBoyId] = useState<string | null>(data.courierBoyId || null);

  // Fetch OCL courier boys when dialog opens
  useEffect(() => {
    if (showCourierBoyDialog && courierBoys.length === 0) {
      fetchOCLCourierBoys();
    }
  }, [showCourierBoyDialog]);

  const fetchOCLCourierBoys = async () => {
    try {
      setLoadingCourierBoys(true);
      const officeToken = localStorage.getItem('officeToken');
      const response = await fetch(`${API_BASE}/api/office/courier-boys/ocl`, {
        headers: {
          'Authorization': `Bearer ${officeToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCourierBoys(result.data || []);
        }
      } else {
        console.error('Failed to fetch OCL courier boys');
      }
    } catch (error) {
      console.error('Error fetching OCL courier boys:', error);
    } finally {
      setLoadingCourierBoys(false);
    }
  };

  const handlePaymentModeChange = (mode: string) => {
    onChange({ ...data, modeOfPayment: mode });
  };

  const handleDeliveryTypeChange = (deliveryType: 'FP' | 'TP') => {
    onChange({ ...data, paymentType: deliveryType });
  };

  const handleCurrentStatusChange = (status: 'booked' | 'picked') => {
    if (status === 'picked') {
      // Open courier boy selection dialog
      setShowCourierBoyDialog(true);
    } else {
      // If changing to 'booked', clear courier boy selection
      onChange({ ...data, currentStatus: status, courierBoyId: undefined });
      setSelectedCourierBoyId(null);
    }
  };

  const handleCourierBoySelect = (courierBoyId: string) => {
    setSelectedCourierBoyId(courierBoyId);
    onChange({ ...data, currentStatus: 'picked', courierBoyId });
    setShowCourierBoyDialog(false);
  };

  const isStepValid = () => {
    // Payment mode and type are required
    if (!data.modeOfPayment || !data.paymentType) {
      return false;
    }
    
    // If currentStatus is 'picked', courierBoyId must be selected
    if (data.currentStatus === 'picked' && !data.courierBoyId) {
      return false;
    }
    
    // currentStatus is optional, but if it's 'picked', courierBoyId is required
    return true;
  };

  const paymentOptions = [
    {
      value: 'Cash',
      title: 'Cash',
      icon: DollarSign
    },
    {
      value: 'To Pay',
      title: 'To Pay',
      icon: CreditCard
    }
  ];

  const deliveryOptions = [
    {
      value: 'FP' as const,
      title: 'Godown Delivery',
      icon: Building
    },
    {
      value: 'TP' as const,
      title: 'Door Delivery',
      icon: Truck
    }
  ];

  const currentStatusOptions = [
    {
      value: 'booked' as const,
      title: 'Booked',
      icon: Package
    },
    {
      value: 'picked' as const,
      title: 'Picked',
      icon: PackageCheck
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Payment Method Selection */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className={cn('text-base font-semibold', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
          Payment Mode
        </h3>
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
          {paymentOptions.map((option) => {
            const isSelected = data.modeOfPayment === option.value;
            const IconComponent = option.icon;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => handlePaymentModeChange(option.value)}
                className={cn(
                  'w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none',
                  isSelected
                    ? isDarkMode
                      ? 'border-blue-500 bg-blue-500/20 shadow-[0_8px_24px_rgba(59,130,246,0.25)]'
                      : 'border-blue-500 bg-blue-50/80 shadow-[0_8px_24px_rgba(59,130,246,0.15)]'
                    : isDarkMode
                      ? 'border-slate-700/60 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                      : 'border-slate-200 hover:border-blue-400/60 hover:bg-blue-50/60'
                )}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      'mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-xs transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : isDarkMode
                          ? 'border-slate-600 bg-slate-700/50 text-transparent'
                          : 'border-slate-300 text-transparent'
                    )}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </div>
                  <div className="flex-1">
                    <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                      <span className="inline-flex items-center gap-1.5">
                        {IconComponent && <IconComponent className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                        {option.title}
                      </span>
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Delivery Type Section */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className={cn('text-base font-semibold', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
          Delivery Type
        </h3>
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
          {deliveryOptions.map((option) => {
            const isSelected = data.paymentType === option.value;
            const IconComponent = option.icon;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => handleDeliveryTypeChange(option.value)}
                className={cn(
                  'w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none',
                  isSelected
                    ? isDarkMode
                      ? 'border-blue-500 bg-blue-500/20 shadow-[0_8px_24px_rgba(59,130,246,0.25)]'
                      : 'border-blue-500 bg-blue-50/80 shadow-[0_8px_24px_rgba(59,130,246,0.15)]'
                    : isDarkMode
                      ? 'border-slate-700/60 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                      : 'border-slate-200 hover:border-blue-400/60 hover:bg-blue-50/60'
                )}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      'mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-xs transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : isDarkMode
                          ? 'border-slate-600 bg-slate-700/50 text-transparent'
                          : 'border-slate-300 text-transparent'
                    )}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </div>
                  <div className="flex-1">
                    <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                      <span className="inline-flex items-center gap-1.5">
                        {IconComponent && <IconComponent className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                        {option.title}
                      </span>
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Status Section */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className={cn('text-base font-semibold', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
          CurrentStatus
        </h3>
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
          {currentStatusOptions.map((option) => {
            const isSelected = data.currentStatus === option.value;
            const IconComponent = option.icon;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => handleCurrentStatusChange(option.value)}
                className={cn(
                  'w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none',
                  isSelected
                    ? isDarkMode
                      ? 'border-blue-500 bg-blue-500/20 shadow-[0_8px_24px_rgba(59,130,246,0.25)]'
                      : 'border-blue-500 bg-blue-50/80 shadow-[0_8px_24px_rgba(59,130,246,0.15)]'
                    : isDarkMode
                      ? 'border-slate-700/60 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                      : 'border-slate-200 hover:border-blue-400/60 hover:bg-blue-50/60'
                )}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      'mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-xs transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : isDarkMode
                          ? 'border-slate-600 bg-slate-700/50 text-transparent'
                          : 'border-slate-300 text-transparent'
                    )}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </div>
                  <div className="flex-1">
                    <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                      <span className="inline-flex items-center gap-1.5">
                        {IconComponent && <IconComponent className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                        {option.title}
                      </span>
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Show selected courier boy if picked */}
        {data.currentStatus === 'picked' && data.courierBoyId && (
          <div className={cn(
            'mt-2 p-2.5 rounded-lg border',
            isDarkMode
              ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/40 shadow-sm'
              : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 shadow-sm'
          )}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className={cn(
                  'p-1.5 rounded-md flex-shrink-0',
                  isDarkMode ? 'bg-blue-500/30' : 'bg-blue-100'
                )}>
                  <User className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-300' : 'text-blue-600')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-semibold truncate', isDarkMode ? 'text-blue-200' : 'text-blue-800')}>
                    {courierBoys.find(cb => cb._id === data.courierBoyId)?.fullName || 'Selected Courier Boy'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone className={cn('h-3 w-3', isDarkMode ? 'text-blue-400' : 'text-blue-600')} />
                    <p className={cn('text-[10px] truncate', isDarkMode ? 'text-blue-300/80' : 'text-blue-700')}>
                      {courierBoys.find(cb => cb._id === data.courierBoyId)?.phone || ''}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onChange({ ...data, currentStatus: undefined, courierBoyId: undefined });
                  setSelectedCourierBoyId(null);
                }}
                className={cn(
                  'p-1.5 rounded-md hover:bg-opacity-20 transition-colors flex-shrink-0',
                  isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'
                )}
              >
                <X className={cn('h-3.5 w-3.5', isDarkMode ? 'text-red-400' : 'text-red-600')} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Courier Boy Selection Dialog */}
      <Dialog open={showCourierBoyDialog} onOpenChange={setShowCourierBoyDialog}>
        <DialogContent className={cn(
          'max-w-lg max-h-[70vh] overflow-y-auto p-0',
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'
        )}>
          <DialogHeader className={cn(
            'p-4 border-b rounded-t-lg',
            isDarkMode 
              ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-slate-700' 
              : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-gray-200'
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                'p-1.5 rounded-md',
                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
              )}>
                <User className={cn('h-4 w-4', isDarkMode ? 'text-blue-400' : 'text-blue-600')} />
              </div>
              <DialogTitle className={cn('text-base font-semibold', isDarkMode ? 'text-slate-200' : 'text-slate-900')}>
                Select OCL Courier Boy
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="p-4">
            {loadingCourierBoys ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : courierBoys.length === 0 ? (
              <div className={cn('text-center py-8 text-sm', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                <p>No OCL courier boys available</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {courierBoys.map((courierBoy, index) => {
                  const isSelected = selectedCourierBoyId === courierBoy._id;
                  // Alternate colors for visual variety
                  const colorVariants = [
                    { border: 'border-blue-500', bg: 'bg-blue-50', hover: 'hover:border-blue-400 hover:bg-blue-50/80', icon: 'text-blue-600' },
                    { border: 'border-cyan-500', bg: 'bg-cyan-50', hover: 'hover:border-cyan-400 hover:bg-cyan-50/80', icon: 'text-cyan-600' },
                    { border: 'border-indigo-500', bg: 'bg-indigo-50', hover: 'hover:border-indigo-400 hover:bg-indigo-50/80', icon: 'text-indigo-600' },
                    { border: 'border-purple-500', bg: 'bg-purple-50', hover: 'hover:border-purple-400 hover:bg-purple-50/80', icon: 'text-purple-600' }
                  ];
                  const colors = colorVariants[index % colorVariants.length];
                  
                  return (
                    <button
                      key={courierBoy._id}
                      type="button"
                      onClick={() => handleCourierBoySelect(courierBoy._id)}
                      className={cn(
                        'w-full text-left p-2.5 rounded-lg border transition-all duration-200',
                        isSelected
                          ? isDarkMode
                            ? `${colors.border} bg-blue-500/20 shadow-md`
                            : `${colors.border} ${colors.bg} shadow-md`
                          : isDarkMode
                            ? 'border-slate-700 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                            : `border-gray-200 bg-white ${colors.hover}`
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-full border flex-shrink-0 transition-all',
                            isSelected
                              ? isDarkMode
                                ? 'border-blue-500 bg-blue-500 shadow-sm'
                                : `${colors.border} bg-blue-500 shadow-sm`
                              : isDarkMode
                                ? 'border-slate-600 bg-slate-700'
                                : 'border-gray-300 bg-white'
                          )}>
                            {isSelected && (
                              <Check className="h-2.5 w-2.5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h3 className={cn(
                                'font-semibold text-xs leading-tight',
                                isSelected
                                  ? isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                  : isDarkMode ? 'text-slate-200' : 'text-gray-800'
                              )}>
                                {courierBoy.fullName}
                              </h3>
                            </div>
                            <div className={cn(
                              'text-[10px] mt-0.5 leading-tight space-y-0.5',
                              isDarkMode ? 'text-slate-400' : 'text-gray-600'
                            )}>
                              <div className="flex items-center gap-1">
                                <Phone className={cn('h-3 w-3', isSelected && !isDarkMode ? colors.icon : '')} />
                                <span>{courierBoy.phone}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className={cn('h-3 w-3', isSelected && !isDarkMode ? colors.icon : '')} />
                                <span className="truncate">{courierBoy.area}, {courierBoy.locality} - {courierBoy.pincode}</span>
                              </div>
                              {courierBoy.vehicleType && (
                                <div className="text-[10px] flex items-center gap-1">
                                  <Truck className={cn('h-3 w-3', isSelected && !isDarkMode ? colors.icon : '')} />
                                  <span>
                                    <span className="font-medium">Vehicle:</span> {courierBoy.vehicleType}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Message */}
      {submitError && (
        <div className={`p-4 rounded-xl border ${
          isDarkMode
            ? 'bg-red-500/10 border-red-500/50'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                Error submitting booking
              </h3>
              <div className={`mt-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                <p>{submitError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-row gap-2 pt-2 justify-between">
        <button
          onClick={onPrevious}
          className={cn(
            'w-auto px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center',
            isDarkMode
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          )}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!isStepValid() || isSubmitting}
          className={cn(
            'w-auto px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center',
            isDarkMode
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white',
            (!isStepValid() || isSubmitting) && 'opacity-60 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              Complete Booking
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default PaymentStep;

