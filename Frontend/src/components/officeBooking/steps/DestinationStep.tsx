/**
 * Destination Step Component
 * Matches BookNow.tsx design - Phone modal → Form modal → Preview modal
 */

import React, { useEffect } from 'react';
import { Phone, User, Building, Mail, MapPin, Globe, Calendar, Gift, Pencil, X } from 'lucide-react';
import { FloatingInput, FloatingSelect } from '../shared';
import { AddressData } from '../types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DestinationStepProps {
  data: AddressData;
  onChange: (data: AddressData) => void;
  onNext: () => void;
  onPrevious: () => void;
  destinationServiceable: boolean | null;
  destinationPincode: string;
  destinationAreas: string[];
  destinationMobileDigits: string[];
  onDestinationDigitChange: (index: number, value: string) => void;
  phoneModalOpen: boolean;
  formModalOpen: boolean;
  showPreviewInModal: boolean;
  phoneSearchResults: any[];
  selectedRecordIndex: number;
  onSelectRecord: (record: any) => void;
  onSetSelectedRecordIndex: (index: number) => void;
  onClosePhoneModal: () => void;
  onCloseFormModal: () => void;
  onOpenFormModal: () => void;
  onShowPreview: () => void;
  onHidePreview: () => void;
  onPincodeCheck?: (pincode: string) => Promise<void>;
  onPhoneSearch?: (phoneNumber: string) => Promise<void>;
  searchingPhone?: boolean;
  isFormComplete: boolean;
  onAlternateNumberChange: (index: number, value: string) => void;
  onAddAlternateNumber: () => void;
  onRemoveAlternateNumber: (index: number) => void;
  isDarkMode?: boolean;
}

const DestinationStep: React.FC<DestinationStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  destinationServiceable,
  destinationPincode,
  destinationAreas,
  destinationMobileDigits,
  onDestinationDigitChange,
  phoneModalOpen,
  formModalOpen,
  showPreviewInModal,
  phoneSearchResults,
  selectedRecordIndex,
  onSelectRecord,
  onSetSelectedRecordIndex,
  onClosePhoneModal,
  onCloseFormModal,
  onOpenFormModal,
  onShowPreview,
  onHidePreview,
  searchingPhone = false,
  isFormComplete,
  onAlternateNumberChange,
  onAddAlternateNumber,
  onRemoveAlternateNumber,
  isDarkMode = false
}) => {
  const addressTypeOptions = ['HOME', 'OFFICE', 'OTHERS'];
  const getDigitInputId = (index: number) => `destination-modal-digit-${index}`;

  const handleDestinationDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!destinationMobileDigits[index] && index > 0) {
        e.preventDefault();
        const prevInput = document.getElementById(getDigitInputId(index - 1));
        prevInput?.focus();
        const newDigits = [...destinationMobileDigits];
        newDigits[index - 1] = '';
        onDestinationDigitChange(index - 1, '');
      } else if (destinationMobileDigits[index]) {
        const newDigits = [...destinationMobileDigits];
        newDigits[index] = '';
        onDestinationDigitChange(index, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      const prevInput = document.getElementById(getDigitInputId(index - 1));
      prevInput?.focus();
    } else if (e.key === 'ArrowRight' && index < 9) {
      e.preventDefault();
      const nextInput = document.getElementById(getDigitInputId(index + 1));
      nextInput?.focus();
    }
  };

  const handleDestinationDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 10);
    const newDigits = Array(10).fill('');
    digits.split('').forEach((digit, i) => {
      if (i < 10) newDigits[i] = digit;
    });
    newDigits.forEach((digit, i) => {
      onDestinationDigitChange(i, digit);
    });
    
    const nextEmptyIndex = newDigits.findIndex(d => d === '');
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 9;
    setTimeout(() => {
      const nextInput = document.getElementById(getDigitInputId(focusIndex));
      nextInput?.focus();
    }, 0);
  };

  // Auto-focus first input when phone modal opens
  useEffect(() => {
    if (phoneModalOpen) {
      setTimeout(() => {
        const firstInput = document.getElementById(getDigitInputId(0));
        firstInput?.focus();
      }, 100);
    }
  }, [phoneModalOpen]);

  return (
    <div className={cn('space-y-6', isDarkMode ? 'text-slate-100' : '')}>

      {/* Phone Modal */}
      <Dialog open={phoneModalOpen} onOpenChange={() => {}}>
        <DialogContent 
          className={cn(
            "w-[98%] sm:w-full max-w-xl p-0 rounded-[15px] [&>button]:hidden overflow-hidden",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          )}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="p-3 sm:p-5">
            <DialogTitle className={cn(
              "text-sm sm:text-base font-bold mb-3 sm:mb-4 text-center sm:text-left",
              isDarkMode ? "text-slate-100" : "text-slate-900"
            )}>
              Enter Recipient Mobile Number
            </DialogTitle>
            
            <div className={cn(
              "flex items-center gap-1 p-1.5 sm:p-2 rounded-xl border-2 w-full",
              isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200"
            )}>
              {/* India Flag +91 */}
              <div className={cn(
                "flex items-center gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg flex-shrink-0",
                isDarkMode ? "bg-slate-700" : "bg-white"
              )}>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" viewBox="0 0 71.42 47.61">
                  <rect fill="#FF9933" width="71.42" height="15.87"/>
                  <rect y="15.87" fill="#FFFFFF" width="71.42" height="15.87"/>
                  <rect y="31.74" fill="#138808" width="71.42" height="15.87"/>
                  <circle fill="#000080" cx="35.71" cy="23.8" r="4.76"/>
                </svg>
                <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">+91</span>
              </div>
              
              <div className={cn(
                "h-5 sm:h-6 w-[1px] flex-shrink-0",
                isDarkMode ? "bg-slate-700" : "bg-slate-200"
              )} />
              
              {/* Phone Number Inputs - Scrollable wrapper */}
              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-0.5 min-w-max">
                  {destinationMobileDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={getDigitInputId(index)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => onDestinationDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleDestinationDigitKeyDown(index, e)}
                      onPaste={index === 0 ? handleDestinationDigitPaste : undefined}
                      onFocus={(e) => e.target.select()}
                      className={cn(
                        "h-7 sm:h-8 w-5 sm:w-6 rounded border-2 text-center text-[10px] sm:text-xs font-bold transition-all duration-200 flex-shrink-0",
                        "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200",
                        isDarkMode
                          ? digit
                            ? "border-blue-500 bg-blue-500/20 text-blue-200"
                            : "border-slate-600 bg-slate-800/80 text-slate-300 focus:ring-blue-500/30"
                          : digit
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-300 bg-white text-slate-700"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {searchingPhone && (
              <div className={cn(
                "flex items-center gap-2 mt-3 sm:mt-4 text-xs sm:text-sm",
                isDarkMode ? "text-blue-400" : "text-blue-600"
              )}>
                <div className="animate-spin">⏳</div>
                <span>Searching for address...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Modal */}
      <Dialog open={formModalOpen} onOpenChange={() => {}}>
        <DialogContent 
          className={cn(
            "w-[90%] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-[15px] [&>button]:hidden",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          )}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {!showPreviewInModal ? (
            <>
              <div className="px-6 pt-6 pb-2">
                <DialogTitle className={cn(
                  "text-xl font-bold",
                  isDarkMode ? "text-slate-100" : "text-slate-900"
                )}>
                  Recipient's (Consignee) Address :
                </DialogTitle>
              </div>

              <div className="px-5 py-5 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <FloatingInput
                    label="Concern Person :"
                    value={data.name}
                    onChange={(value) => onChange({ ...data, name: value })}
                    required
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="Mobile No. :"
                    value={`+91 ${destinationMobileDigits.join('')}`}
                    onChange={() => {}}
                    disabled
                    placeholder="We'll call this number to coordinate delivery."
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="Email ID :"
                    value={data.email}
                    onChange={(value) => onChange({ ...data, email: value })}
                    type="email"
                    className="md:col-span-2"
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="Company Name :"
                    value={data.companyName}
                    onChange={(value) => onChange({ ...data, companyName: value })}
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="GST No. :"
                    value={data.gstNumber}
                    onChange={(value) => onChange({ ...data, gstNumber: value })}
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="Building / Flat No. :"
                    value={data.flatBuilding}
                    onChange={(value) => onChange({ ...data, flatBuilding: value })}
                    required
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="Locality / Street :"
                    value={data.locality}
                    onChange={(value) => onChange({ ...data, locality: value })}
                    required
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="Landmark :"
                    value={data.landmark}
                    onChange={(value) => onChange({ ...data, landmark: value })}
                    className="md:col-span-2"
                    isDarkMode={isDarkMode}
                  />
                  {destinationPincode.length === 6 && destinationAreas.length > 0 ? (
                    <FloatingSelect
                      label="Area"
                      value={data.area}
                      onChange={(value) => onChange({ ...data, area: value })}
                      options={destinationAreas}
                      required
                      isDarkMode={isDarkMode}
                    />
                  ) : (
                    <FloatingInput
                      label="Area"
                      value={data.area}
                      onChange={(value) => onChange({ ...data, area: value })}
                      required
                      disabled
                      isDarkMode={isDarkMode}
                    />
                  )}
                  <FloatingInput
                    label="Pincode"
                    value={data.pincode}
                    onChange={() => {}}
                    disabled
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="City"
                    value={data.city}
                    onChange={() => {}}
                    disabled
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="State"
                    value={data.state}
                    onChange={() => {}}
                    disabled
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="District"
                    value={data.district}
                    onChange={() => {}}
                    disabled
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="Website :"
                    value={data.website || ''}
                    onChange={(value) => onChange({ ...data, website: value })}
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="BirthDay :"
                    value={data.birthday || ''}
                    onChange={(value) => onChange({ ...data, birthday: value })}
                    type="date"
                    isDarkMode={isDarkMode}
                  />
                  <FloatingInput
                    label="Anniversary :"
                    value={data.anniversary || ''}
                    onChange={(value) => onChange({ ...data, anniversary: value })}
                    type="date"
                    isDarkMode={isDarkMode}
                  />
                </div>

                {/* Save As Section */}
                <div className="pt-1">
                  <div className="flex flex-wrap gap-2">
                    {addressTypeOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => onChange({ ...data, addressType: option as 'Home' | 'Office' | 'Other' })}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all",
                          data.addressType === option
                            ? isDarkMode
                              ? "bg-slate-700 text-slate-100 border-2 border-slate-600"
                              : "bg-slate-200 text-slate-800 border-2 border-slate-300"
                            : isDarkMode
                              ? "bg-transparent text-slate-300 border-2 border-slate-700 hover:border-slate-600"
                              : "bg-white text-slate-700 border-2 border-slate-300 hover:border-slate-400"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alternate Numbers Section */}
                <div className="pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <div />
                    <button
                      type="button"
                      onClick={onAddAlternateNumber}
                      className={cn(
                        'h-7 rounded-md border border-dashed px-4 text-xs font-medium transition-colors flex items-center justify-center ml-auto',
                        isDarkMode
                          ? 'border-blue-500 text-blue-200 hover:bg-blue-500/20 hover:border-blue-400'
                          : 'border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-500'
                      )}
                    >
                      + Add Alternate Number
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(data.alternateNumbers || ['']).map((number, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <FloatingInput
                          label={`Alternate Number ${index + 1}`}
                          value={number}
                          onChange={(value) => onAlternateNumberChange(index, value)}
                          type="tel"
                          className="flex-1"
                          isDarkMode={isDarkMode}
                        />
                        {(data.alternateNumbers || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveAlternateNumber(index)}
                            className={cn(
                              'h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0 transition-colors',
                              isDarkMode
                                ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            )}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer with Full-Width Button */}
              <div className="px-6 pt-2 pb-5">
                <Button
                  type="button"
                  disabled={!isFormComplete}
                  onClick={() => {
                    if (isFormComplete) {
                      onShowPreview();
                    }
                  }}
                  className={cn(
                    "w-full h-12 rounded-md font-semibold text-base transition-all",
                    !isFormComplete
                      ? isDarkMode
                        ? "bg-slate-700/50 text-slate-400 cursor-not-allowed opacity-60"
                        : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
                      : isDarkMode
                        ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                        : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                  )}
                >
                  SAVE
                </Button>
              </div>
            </>
          ) : (
            // Preview Card View
            <div className="p-3 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={cn(
                    'text-xs sm:text-sm font-semibold',
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    Select Recipient Add :
                  </h3>
                  <button
                    type="button"
                    onClick={onHidePreview}
                    className={cn(
                      'p-1.5 rounded-md transition-colors flex-shrink-0',
                      isDarkMode
                        ? 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                        : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    )}
                  >
                    <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
                
                {/* Show multiple records if available */}
                {phoneSearchResults.length > 1 ? (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                    {phoneSearchResults.map((record, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          onSetSelectedRecordIndex(idx);
                          // Don't call onSelectRecord here - only update visual selection
                          // The record will be selected when CONFIRM is clicked
                        }}
                        className={cn(
                          'rounded-xl border overflow-hidden transition-all duration-300 p-2.5 sm:p-4 cursor-pointer',
                          selectedRecordIndex === idx
                            ? isDarkMode
                              ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                              : 'border-blue-500 bg-blue-50 shadow-lg'
                            : isDarkMode
                              ? 'border-slate-800/60 bg-slate-900/80 hover:border-slate-700'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-start gap-1.5 sm:gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            <div className={cn(
                              'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center',
                              selectedRecordIndex === idx
                                ? isDarkMode ? 'border-blue-400' : 'border-blue-500'
                                : isDarkMode ? 'border-slate-600' : 'border-slate-400'
                            )}>
                              {selectedRecordIndex === idx && (
                                <div className={cn(
                                  'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full',
                                  isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                                )} />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h4 className={cn(
                                'text-xs sm:text-sm font-semibold break-words',
                                isDarkMode ? 'text-slate-100' : 'text-slate-900'
                              )}>
                                {record.name || 'N/A'}
                              </h4>
                              {record.addressType && (
                                <span className={cn(
                                  'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium uppercase flex-shrink-0',
                                  isDarkMode
                                    ? 'bg-blue-500/20 text-blue-200'
                                    : 'bg-blue-100 text-blue-700'
                                )}>
                                  {record.addressType}
                                </span>
                              )}
                            </div>
                            
                            {record.companyName && (
                              <p className={cn(
                                'text-[10px] sm:text-xs break-words',
                                isDarkMode ? 'text-slate-400' : 'text-slate-600'
                              )}>
                                <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-1" />
                                {record.companyName}
                              </p>
                            )}
                            
                            <div className="flex items-start gap-1 sm:gap-1.5">
                              <MapPin className={cn(
                                'h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 flex-shrink-0',
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              )} />
                              <p className={cn(
                                'text-[10px] sm:text-xs leading-relaxed break-words',
                                isDarkMode ? 'text-slate-300' : 'text-slate-700'
                              )}>
                                {[
                                  record.flatBuilding,
                                  record.locality,
                                  record.area,
                                  record.city,
                                  record.state,
                                  record.pincode
                                ].filter(Boolean).join(', ')}
                                {record.landmark && ` (${record.landmark})`}
                              </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs">
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <Phone className={cn(
                                  'h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0',
                                  isDarkMode ? 'text-green-400' : 'text-green-600'
                                )} />
                                <span className={cn(
                                  'break-all',
                                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                )}>
                                  +91 {record.mobileNumber}
                                </span>
                              </div>
                              {record.email && (
                                <>
                                  <span className={cn(
                                    'hidden sm:inline',
                                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                  )}>
                                    •
                                  </span>
                                  <div className="flex items-center gap-1 sm:gap-1.5">
                                    <Mail className={cn(
                                      'h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0',
                                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                    )} />
                                    <span className={cn(
                                      'break-all',
                                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                    )}>
                                      {record.email}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Single address preview card
                  <div className={cn(
                    'rounded-xl border overflow-hidden transition-all duration-300 p-2.5 sm:p-4',
                    isDarkMode
                      ? 'border-slate-800/60 bg-slate-900/80'
                      : 'border-slate-200 bg-white'
                  )}>
                    <div className="flex items-start gap-1.5 sm:gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <div className={cn(
                          'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center',
                          isDarkMode ? 'border-blue-400' : 'border-blue-500'
                        )}>
                          <div className={cn(
                            'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full',
                            isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                          )} />
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className={cn(
                            'text-xs sm:text-sm font-semibold break-words',
                            isDarkMode ? 'text-slate-100' : 'text-slate-900'
                          )}>
                            {data.name || 'N/A'}
                          </h4>
                          {data.addressType && (
                            <span className={cn(
                              'px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium uppercase flex-shrink-0',
                              isDarkMode
                                ? 'bg-blue-500/20 text-blue-200'
                                : 'bg-blue-100 text-blue-700'
                            )}>
                              {data.addressType}
                            </span>
                          )}
                        </div>
                        
                        {data.companyName && (
                          <p className={cn(
                            'text-[10px] sm:text-xs break-words',
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          )}>
                            <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-1" />
                            {data.companyName}
                          </p>
                        )}
                        
                        <div className="flex items-start gap-1 sm:gap-1.5">
                          <MapPin className={cn(
                            'h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 flex-shrink-0',
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          )} />
                          <p className={cn(
                            'text-[10px] sm:text-xs leading-relaxed break-words',
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          )}>
                            {[
                              data.flatBuilding,
                              data.locality,
                              data.area,
                              data.city,
                              data.state,
                              data.pincode
                            ].filter(Boolean).join(', ')}
                            {data.landmark && ` (${data.landmark})`}
                          </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs">
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <Phone className={cn(
                              'h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0',
                              isDarkMode ? 'text-green-400' : 'text-green-600'
                            )} />
                            <span className={cn(
                              'break-all',
                              isDarkMode ? 'text-slate-300' : 'text-slate-700'
                            )}>
                              +91 {data.mobileNumber}
                            </span>
                          </div>
                          {data.email && (
                            <>
                              <span className={cn(
                                'hidden sm:inline',
                                isDarkMode ? 'text-slate-500' : 'text-slate-400'
                              )}>
                                •
                              </span>
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <Mail className={cn(
                                  'h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0',
                                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                )} />
                                <span className={cn(
                                  'break-all',
                                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                )}>
                                  {data.email}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Confirm Button */}
                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      if (phoneSearchResults.length > 0 && selectedRecordIndex >= 0) {
                        onSelectRecord(phoneSearchResults[selectedRecordIndex]);
                      }
                      onCloseFormModal();
                      onNext();
                    }}
                    className={cn(
                      "w-full h-12 rounded-md font-semibold text-base transition-all",
                      isDarkMode
                        ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                        : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                    )}
                  >
                    CONFIRM & CONTINUE
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onPrevious}
          className={cn(
            'px-6 py-2.5 rounded-xl font-medium transition-all duration-200',
            isDarkMode
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          )}
        >
          ← Previous Step
        </button>
        {isFormComplete && !formModalOpen && (
          <button
            onClick={onNext}
            className={cn(
              'px-6 py-2.5 rounded-xl font-medium transition-all duration-200',
              isDarkMode
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-[#406ab9] hover:bg-[#3059a0] text-white'
            )}
          >
            Next Step →
          </button>
        )}
      </div>
    </div>
  );
};

export default DestinationStep;
