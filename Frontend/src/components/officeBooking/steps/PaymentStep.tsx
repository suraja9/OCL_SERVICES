/**
 * Payment Step Component
 * Seventh step of the office booking flow - Select payment method and delivery type
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, Truck, Building, CheckCircle, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { PaymentData } from '../types';
import { cn } from '@/lib/utils';

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
  const handlePaymentModeChange = (mode: string) => {
    onChange({ ...data, modeOfPayment: mode });
  };

  const handleDeliveryTypeChange = (deliveryType: 'FP' | 'TP') => {
    onChange({ ...data, paymentType: deliveryType });
  };

  const isStepValid = () => {
    return !!(data.modeOfPayment && data.paymentType);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Payment Method Selection */}
      <div className="space-y-3 sm:space-y-4">
        

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

