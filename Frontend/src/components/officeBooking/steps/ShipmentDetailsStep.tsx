/**
 * Shipment Details Step Component (Step 2)
 * Matches BookNow.tsx design - Nature, Insurance, Risk Coverage
 */

import React, { useState } from 'react';
import { FileText, Package, Shield, ShieldCheck, Check, Pencil, Eye, XCircle, Plane, Train, Truck } from 'lucide-react';
import { ShipmentData } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '../shared';
import { cn } from '@/lib/utils';

interface ShipmentDetailsStepProps {
  data: ShipmentData;
  onChange: (data: ShipmentData) => void;
  onNext: () => void;
  onPrevious: () => void;
  isDarkMode?: boolean;
}

const natureOptions = [
  {
    value: 'DOX',
    title: 'Documents',
    description: 'Important papers, legal documents and lightweight document shipments.',
    icon: FileText
  },
  {
    value: 'NON-DOX',
    title: 'Parcel ',
    description: 'Merchandise, parcels, samples and any non-document consignments.',
    icon: Package
  }
];

const insuranceOptions = [
  {
    value: 'Without insurance',
    title: 'Without Insurance',
    icon: Shield
  },
  {
    value: 'With insurance',
    title: 'With Insurance',
    description: 'Shipment Insurance is covered by the Consignor/Consignee.',
    icon: ShieldCheck
  }
];

const riskCoverageOptions = [
  {
    value: 'Owner',
    title: 'Owner Risk',
    description: 'Consignor/Consignee agrees to bear any transit Damage, Lost etc.',
    icon: Shield
  },
  {
    value: 'Carrier',
    title: 'Carrier Risk',
    description: 'Carrier takes responsibility for transit risk as per policy.',
    icon: ShieldCheck
  }
];

interface InsuranceFormState {
  companyName: string;
  policyNumber: string;
  policyDate: string;
  validUpto: string;
  premiumAmount: string;
  document: File | null;
  documentName: string;
}

const ShipmentDetailsStep: React.FC<ShipmentDetailsStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  isDarkMode = false
}) => {
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [insuranceForm, setInsuranceForm] = useState<InsuranceFormState>({
    companyName: data.insuranceCompanyName || '',
    policyNumber: data.insurancePolicyNumber || '',
    policyDate: data.insurancePolicyDate || '',
    validUpto: data.insuranceValidUpto || '',
    premiumAmount: data.insurancePremiumAmount || '',
    document: data.insuranceDocument || null,
    documentName: data.insuranceDocumentName || ''
  });
  const [insuranceFormError, setInsuranceFormError] = useState<string>('');
  const [isPremiumAmountFocused, setIsPremiumAmountFocused] = useState(false);
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);

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

  const openInsuranceModal = () => {
    setInsuranceForm({
      companyName: data.insuranceCompanyName || '',
      policyNumber: data.insurancePolicyNumber || '',
      policyDate: data.insurancePolicyDate || '',
      validUpto: data.insuranceValidUpto || '',
      premiumAmount: data.insurancePremiumAmount || '',
      document: data.insuranceDocument || null,
      documentName: data.insuranceDocumentName || ''
    });
    setInsuranceFormError('');
    setIsPremiumAmountFocused(false);
    setInsuranceModalOpen(true);
  };

  const handleInsuranceSelection = (value: string) => {
    if (value === 'With insurance') {
      onChange({
        ...data,
        insurance: value,
        riskCoverage: 'Carrier'
      });
      openInsuranceModal();
      return;
    }

    setInsuranceModalOpen(false);
    setInsuranceFormError('');
    setInsuranceForm({
      companyName: '',
      policyNumber: '',
      policyDate: '',
      validUpto: '',
      premiumAmount: '',
      document: null,
      documentName: ''
    });
    onChange({
      ...data,
      insurance: value,
      riskCoverage: 'Owner',
      insuranceCompanyName: '',
      insurancePolicyNumber: '',
      insurancePolicyDate: '',
      insuranceValidUpto: '',
      insurancePremiumAmount: '',
      insuranceDocument: null,
      insuranceDocumentName: ''
    });
  };

  const handleInsuranceFormSave = () => {
    if (
      !insuranceForm.companyName.trim() ||
      !insuranceForm.policyNumber.trim() ||
      !insuranceForm.policyDate.trim() ||
      !insuranceForm.validUpto.trim() ||
      !insuranceForm.document
    ) {
      setInsuranceFormError('Please complete all required fields before saving.');
      return;
    }

    onChange({
      ...data,
      insurance: 'With insurance',
      insuranceCompanyName: insuranceForm.companyName.trim(),
      insurancePolicyNumber: insuranceForm.policyNumber.trim(),
      insurancePolicyDate: insuranceForm.policyDate,
      insuranceValidUpto: insuranceForm.validUpto,
      insurancePremiumAmount: insuranceForm.premiumAmount.trim(),
      insuranceDocument: insuranceForm.document,
      insuranceDocumentName: insuranceForm.documentName
    });
    setInsuranceModalOpen(false);
    setInsuranceFormError('');
  };

  const handleInsuranceFormCancel = () => {
    if (documentPreviewUrl) {
      URL.revokeObjectURL(documentPreviewUrl);
      setDocumentPreviewUrl(null);
    }
    setDocumentPreviewOpen(false);

    const hasSavedInsurance =
      Boolean(data.insuranceCompanyName) ||
      Boolean(data.insurancePolicyNumber) ||
      Boolean(data.insurancePolicyDate) ||
      Boolean(data.insuranceDocument);

    if (!hasSavedInsurance) {
      setInsuranceForm({
        companyName: '',
        policyNumber: '',
        policyDate: '',
        validUpto: '',
        premiumAmount: '',
        document: null,
        documentName: ''
      });
      onChange({
        ...data,
        insurance: 'Without insurance',
        riskCoverage: 'Owner',
        insuranceCompanyName: '',
        insurancePolicyNumber: '',
        insurancePolicyDate: '',
        insuranceValidUpto: '',
        insurancePremiumAmount: '',
        insuranceDocument: null,
        insuranceDocumentName: ''
      });
    }
    setInsuranceModalOpen(false);
    setInsuranceFormError('');
  };

  const requiresInsuranceDetails = data.insurance === 'With insurance';
  const hasInsuranceDetails = !requiresInsuranceDetails || (
    (data.insuranceCompanyName || '').trim().length > 0 &&
    (data.insurancePolicyNumber || '').trim().length > 0 &&
    (data.insurancePolicyDate || '').trim().length > 0 &&
    data.insuranceDocument !== null
  );

  const isShipmentStepComplete = Boolean(
    data.natureOfConsignment &&
    data.insurance &&
    data.riskCoverage &&
    hasInsuranceDetails &&
    data.services &&
    (data.services === 'Priority' || (data.services === 'Standard' && data.mode))
  );

  return (
    <div className={cn('space-y-4 sm:space-y-6 md:space-y-8', isDarkMode ? 'text-slate-100' : '')}>
      <div className="space-y-4 sm:space-y-6">
        {/* Nature of Consignment */}
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
          {natureOptions.map((option) => {
            const isSelected = data.natureOfConsignment === option.value;
            const IconComponent = option.icon;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() =>
                  onChange({
                    ...data,
                    natureOfConsignment: option.value,
                    insurance: '',
                    riskCoverage: 'Owner',
                    insuranceCompanyName: '',
                    insurancePolicyNumber: '',
                    insurancePolicyDate: '',
                    insuranceValidUpto: '',
                    insurancePremiumAmount: '',
                    insuranceDocument: null,
                    insuranceDocumentName: ''
                  })
                }
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
                  <div className="space-y-0.5">
                    <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                      <span className="inline-flex items-center gap-1.5">
                        {IconComponent && <IconComponent className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                        {option.title}
                      </span>
                    </p>
                    <p className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Insurance */}
        {data.natureOfConsignment && (
          <>
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
              {insuranceOptions.map((option) => {
                const isSelected = data.insurance === option.value;
                const IconComponent = option.icon;
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => handleInsuranceSelection(option.value)}
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
                      <div className="space-y-0.5">
                        <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                          <span className="inline-flex items-center gap-1.5">
                            {IconComponent && <IconComponent className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                            {option.title}
                          </span>
                        </p>
                        {option.description && (
                          <p className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {data.insurance === 'With insurance' && (
              <div
                className={cn(
                  'mt-3 rounded-xl border p-4 transition-all duration-300',
                  isDarkMode
                    ? 'border-blue-500 bg-slate-900/60 shadow-[0_8px_24px_rgba(59,130,246,0.25)]'
                    : 'border-blue-500 bg-white/80 shadow-[0_8px_24px_rgba(59,130,246,0.15)]'
                )}
              >
                <div className="flex items-start gap-3 mb-0.5">
                  <div>
                    <h5 style={{textDecoration:'underline'}}>
                      Preview
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={openInsuranceModal}
                    className={cn(
                      'p-2 rounded-md transition-colors ml-auto',
                      isDarkMode
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <div>
                    <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Company Name</span>
                    <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                      {data.insuranceCompanyName || 'Pending'}
                    </p>
                  </div>
                  <div>
                    <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Policy Number</span>
                    <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                      {data.insurancePolicyNumber || 'Pending'}
                    </p>
                  </div>
                  <div>
                    <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Policy Date</span>
                    <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                      {data.insurancePolicyDate || 'Pending'}
                    </p>
                  </div>
                  <div>
                    <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Policy Date Valid Upto</span>
                    <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                      {data.insuranceValidUpto || 'Pending'}
                    </p>
                  </div>
                  <div>
                    <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Premium Amount</span>
                    <p className={cn('text-sm font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                      {data.insurancePremiumAmount
                        ? `${data.insurancePremiumAmount}`
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <span className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Document</span>
                    <div className="flex items-center gap-1.5">
                      {data.insuranceDocument && (
                        <button
                          type="button"
                          onClick={() => {
                            if (data.insuranceDocument) {
                              const url = URL.createObjectURL(data.insuranceDocument);
                              setDocumentPreviewUrl(url);
                              setDocumentPreviewOpen(true);
                            }
                          }}
                          className={cn(
                            'p-1 rounded transition-colors flex-shrink-0',
                            isDarkMode
                              ? 'text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                              : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                          )}
                          title="Preview document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <p className={cn('text-sm font-medium break-words', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                        {data.insuranceDocumentName || 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Risk Coverage */}
        {data.natureOfConsignment && data.insurance && (
          <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
            {riskCoverageOptions.map((option) => {
              const isSelected = data.riskCoverage === option.value;
              const IconComponent = option.icon;
              const isDisabled = true; // Always disabled - risk coverage is auto-selected based on insurance
              return (
                <button
                  type="button"
                  key={option.value}
                  disabled={isDisabled}
                  className={cn(
                    'w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none',
                    isDisabled
                      ? 'cursor-not-allowed opacity-60'
                      : '',
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
                    <div className="space-y-0.5">
                      <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                        <span className="inline-flex items-center gap-1.5">
                          {IconComponent && <IconComponent className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                          {option.title}
                        </span>
                      </p>
                      <p className={cn('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Service Type Selection */}
        {data.natureOfConsignment && data.insurance && data.riskCoverage && (
          <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...data,
                  services: 'Standard',
                  mode: 'Air' // Default mode when selecting Standard
                });
              }}
              className={cn(
                'w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none',
                data.services === 'Standard'
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
                    data.services === 'Standard'
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : isDarkMode
                        ? 'border-slate-600 bg-slate-700/50 text-transparent'
                        : 'border-slate-300 text-transparent'
                  )}
                >
                  <Check className="h-2.5 w-2.5" />
                </div>
                <div className="space-y-0.5">
                  <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                    <span className="inline-flex items-center gap-1.5">
                      {Package && <Package className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                      Standard
                    </span>
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...data,
                  services: 'Priority',
                  mode: 'Air' // Reset mode when selecting Priority
                });
              }}
              className={cn(
                'w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none',
                data.services === 'Priority'
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
                    data.services === 'Priority'
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : isDarkMode
                        ? 'border-slate-600 bg-slate-700/50 text-transparent'
                        : 'border-slate-300 text-transparent'
                  )}
                >
                  <Check className="h-2.5 w-2.5" />
                </div>
                <div className="space-y-0.5">
                  <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                    <span className="inline-flex items-center gap-1.5">
                      {ShieldCheck && <ShieldCheck className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                      Priority
                    </span>
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Mode Selection - Only show when Standard is selected */}
        {data.services === 'Standard' && (
          <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                onChange({ ...data, mode: 'Air' });
              }}
              className={cn(
                'w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none',
                data.mode === 'Air'
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
                    data.mode === 'Air'
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : isDarkMode
                        ? 'border-slate-600 bg-slate-700/50 text-transparent'
                        : 'border-slate-300 text-transparent'
                  )}
                >
                  <Check className="h-2.5 w-2.5" />
                </div>
                <div className="space-y-0.5">
                  <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                    <span className="inline-flex items-center gap-1.5">
                      {Plane && <Plane className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                      Air
                    </span>
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ ...data, mode: 'Train' });
              }}
              className={cn(
                'w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none',
                data.mode === 'Train'
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
                    data.mode === 'Train'
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : isDarkMode
                        ? 'border-slate-600 bg-slate-700/50 text-transparent'
                        : 'border-slate-300 text-transparent'
                  )}
                >
                  <Check className="h-2.5 w-2.5" />
                </div>
                <div className="space-y-0.5">
                  <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                    <span className="inline-flex items-center gap-1.5">
                      {Train && <Train className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                      Train
                    </span>
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ ...data, mode: 'Surface' });
              }}
              className={cn(
                'w-full text-left rounded-xl border px-3 py-3 transition-all duration-200 focus:outline-none',
                data.mode === 'Surface'
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
                    data.mode === 'Surface'
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : isDarkMode
                        ? 'border-slate-600 bg-slate-700/50 text-transparent'
                        : 'border-slate-300 text-transparent'
                  )}
                >
                  <Check className="h-2.5 w-2.5" />
                </div>
                <div className="space-y-0.5">
                  <p className={cn('text-sm font-semibold', isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                    <span className="inline-flex items-center gap-1.5">
                      {Truck && <Truck className={cn('h-3.5 w-3.5', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />}
                      Road
                    </span>
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Insurance Modal */}
      <Dialog
        open={insuranceModalOpen}
        onOpenChange={(open) => {
          if (open) {
            setInsuranceModalOpen(true);
          } else {
            handleInsuranceFormCancel();
          }
        }}
      >
        <DialogContent
          className={cn(
            'max-w-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          )}
        >
          <DialogHeader>
            <DialogTitle className={cn(isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
              Insurance Details
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <FloatingInput
              label="Company Name :"
              value={insuranceForm.companyName}
              onChange={(value) => {
                setInsuranceForm((prev) => ({ ...prev, companyName: value }));
                if (insuranceFormError) setInsuranceFormError('');
              }}
              required
              isDarkMode={isDarkMode}
            />
            <FloatingInput
              label="Policy No. :"
              value={insuranceForm.policyNumber}
              onChange={(value) => {
                setInsuranceForm((prev) => ({ ...prev, policyNumber: value }));
                if (insuranceFormError) setInsuranceFormError('');
              }}
              required
              isDarkMode={isDarkMode}
            />
            <FloatingInput
              label="Policy Date :"
              type="date"
              value={insuranceForm.policyDate}
              onChange={(value) => {
                setInsuranceForm((prev) => ({ ...prev, policyDate: value }));
                if (insuranceFormError) setInsuranceFormError('');
              }}
              required
              isDarkMode={isDarkMode}
            />
            <FloatingInput
              label="Policy Date Valid Upto :"
              type="date"
              value={insuranceForm.validUpto}
              onChange={(value) => {
                setInsuranceForm((prev) => ({ ...prev, validUpto: value }));
                if (insuranceFormError) setInsuranceFormError('');
              }}
              required
              isDarkMode={isDarkMode}
            />
            <div className="relative">
              <div className="relative">
                {isPremiumAmountFocused && (
                  <div className={cn(
                    "absolute left-3 top-1/2 transform -translate-y-1/2 z-10 text-sm font-medium",
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  )}>
                    ₹
                  </div>
                )}
                <input
                  type="text"
                  value={insuranceForm.premiumAmount}
                  onChange={(e) => {
                    const value = sanitizeDecimal(e.target.value);
                    setInsuranceForm((prev) => ({ ...prev, premiumAmount: value }));
                  }}
                  onFocus={() => setIsPremiumAmountFocused(true)}
                  onBlur={(e) => {
                    setIsPremiumAmountFocused(false);
                    const value = insuranceForm.premiumAmount.trim();
                    if (value && !value.includes('.')) {
                      setInsuranceForm((prev) => ({ ...prev, premiumAmount: `${value}.00` }));
                    }
                  }}
                  className={cn(
                    "w-full h-10 border rounded-xl transition-all duration-200 ease-in-out text-xs",
                    isPremiumAmountFocused ? "pl-8" : "pl-3",
                    "pr-3",
                    isDarkMode 
                      ? "bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-400" 
                      : "bg-white/90 border-gray-300/60 text-[#4B5563] placeholder:text-[#4B5563]",
                    isPremiumAmountFocused 
                      ? isDarkMode
                        ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg"
                        : "border-blue-500 ring-2 ring-blue-200 shadow-md"
                      : isDarkMode
                        ? "hover:border-blue-400/50"
                        : "hover:border-blue-400/50 hover:shadow-sm",
                    "focus:outline-none"
                  )}
                  placeholder=""
                />
                <label
                  className={cn(
                    "absolute transition-all duration-200 ease-in-out pointer-events-none select-none",
                    isPremiumAmountFocused ? "left-8" : "left-4",
                    (isPremiumAmountFocused || insuranceForm.premiumAmount.length > 0)
                      ? "top-0 -translate-y-1/2 text-xs px-2"
                      : "top-1/2 -translate-y-1/2 text-xs",
                    (isPremiumAmountFocused || insuranceForm.premiumAmount.length > 0)
                      ? isDarkMode 
                        ? "bg-slate-900 text-blue-400" 
                        : "bg-white text-blue-600"
                      : isDarkMode 
                        ? "text-slate-400" 
                        : "text-gray-500",
                    isPremiumAmountFocused && insuranceForm.premiumAmount.length === 0 && (isDarkMode ? "text-blue-400" : "text-blue-600")
                  )}
                >
                  Premium Amount :
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label
                className={cn(
                  'text-xs font-normal block',
                  isDarkMode ? 'text-slate-200' : 'text-slate-700'
                )}
              >
                Upload Policy Document :<span className="text-red-500 ml-1">*</span>
              </label>
              <div
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-md border p-3',
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800/50'
                    : 'border-slate-300 bg-slate-50'
                )}
              >
                <input
                  id="insurance-document-upload"
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setInsuranceForm((prev) => ({
                      ...prev,
                      document: file,
                      documentName: file ? file.name : ''
                    }));
                    if (insuranceFormError) setInsuranceFormError('');
                  }}
                />
                <label
                  htmlFor="insurance-document-upload"
                  className={cn(
                    'cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    isDarkMode
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  )}
                >
                  Select File
                </label>
                <div className="min-w-0 flex-1 text-sm">
                  <p className={cn('truncate', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                    {insuranceForm.documentName || 'No file selected !'}
                  </p>
                  <p className={cn('text-xs', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                    Accepted formats: PDF, JPG, PNG.
                  </p>
                </div>
                {insuranceForm.document && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (insuranceForm.document) {
                          const url = URL.createObjectURL(insuranceForm.document);
                          setDocumentPreviewUrl(url);
                          setDocumentPreviewOpen(true);
                        }
                      }}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2',
                        isDarkMode
                          ? 'bg-blue-500/90 text-white hover:bg-blue-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      )}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInsuranceForm((prev) => ({
                          ...prev,
                          document: null,
                          documentName: ''
                        }));
                        const input = document.getElementById('insurance-document-upload') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2',
                        isDarkMode
                          ? 'bg-red-500/90 text-white hover:bg-red-600'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      )}
                    >
                      <XCircle className="w-4 h-4" />
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
            {insuranceFormError && (
              <div className={cn(
                'text-sm p-3 rounded-md',
                isDarkMode ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-red-50 text-red-600 border border-red-200'
              )}>
                {insuranceFormError}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={handleInsuranceFormCancel}
              className={cn(
                isDarkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              )}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInsuranceFormSave}
              className={cn(
                isDarkMode
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              )}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview Modal */}
      {documentPreviewOpen && documentPreviewUrl && (
        <Dialog open={documentPreviewOpen} onOpenChange={setDocumentPreviewOpen}>
          <DialogContent className={cn(
            'max-w-4xl max-h-[90vh] overflow-y-auto',
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          )}>
            <div className="relative">
              {documentPreviewUrl.endsWith('.pdf') ? (
                <iframe
                  src={documentPreviewUrl}
                  className="w-full h-[80vh] rounded-lg"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={documentPreviewUrl}
                  alt="Document Preview"
                  className="w-full h-auto rounded-lg"
                />
              )}
              <button
                onClick={() => {
                  if (documentPreviewUrl) {
                    URL.revokeObjectURL(documentPreviewUrl);
                    setDocumentPreviewUrl(null);
                  }
                  setDocumentPreviewOpen(false);
                }}
                className={cn(
                  'absolute top-4 right-4 p-2 rounded-full transition-colors',
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-white hover:bg-gray-100 text-gray-600'
                )}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-row gap-3 sm:gap-4 pt-2 justify-between">
        <Button
          onClick={onPrevious}
          className={cn(
            'w-auto px-6',
            isDarkMode
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          )}
        >
          ← Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={!isShipmentStepComplete}
          className={cn(
            'w-auto px-6',
            isDarkMode
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white',
            !isShipmentStepComplete && 'opacity-60 cursor-not-allowed'
          )}
        >
          Next →
        </Button>
      </div>
    </div>
  );
};

export default ShipmentDetailsStep;
