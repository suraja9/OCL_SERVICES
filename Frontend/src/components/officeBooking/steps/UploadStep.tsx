/**
 * Upload Step Component
 * Fourth step of the office booking flow - Upload documents and invoice information
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Eye, XCircle, AlertCircle, IndianRupee } from 'lucide-react';
import { FloatingInput } from '../shared';
import { UploadData } from '../types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { compressAndConvertToWebP } from '@/utils/imageCompression';

interface UploadStepProps {
  data: UploadData;
  onChange: (data: UploadData) => void;
  onNext: () => void;
  onPrevious: () => void;
  isDarkMode?: boolean;
}

const UploadStep: React.FC<UploadStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  isDarkMode = false
}) => {
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [invoiceImagePreviews, setInvoiceImagePreviews] = useState<string[]>([]);
  const [panImagePreviews, setPanImagePreviews] = useState<string[]>([]);
  const [declarationImagePreviews, setDeclarationImagePreviews] = useState<string[]>([]);

  const handleFieldChange = (field: keyof UploadData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const parseInvoiceValue = (value: string): number => {
    const numValue = value.replace(/[^\d.]/g, '');
    return parseFloat(numValue) || 0;
  };

  const formatIndianNumber = (value: string): string => {
    const numValue = value.replace(/[^\d.]/g, '');
    if (!numValue) return '';
    const parts = numValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Generate image previews when files change
  useEffect(() => {
    const generatePreviews = async (files: File[], setPreviews: (previews: string[]) => void) => {
      const newPreviews: string[] = [];
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          const promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          newPreviews.push(await promise);
        } else {
          // For PDFs, we'll use a placeholder
          newPreviews.push('');
        }
      }
      setPreviews(newPreviews);
    };

    generatePreviews(data.invoiceImages, setInvoiceImagePreviews);
    generatePreviews(data.panImages, setPanImagePreviews);
    generatePreviews(data.declarationImages, setDeclarationImagePreviews);
  }, [data.invoiceImages, data.panImages, data.declarationImages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'invoiceImages' | 'panImages' | 'declarationImages') => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const maxFiles = field === 'invoiceImages' ? 10 : 5; // Invoice can have more
      
      // Process images: compress and convert to WebP
      const processedFiles: File[] = [];
      for (const file of files) {
        try {
          if (file.type.startsWith('image/')) {
            const processedFile = await compressAndConvertToWebP(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
            processedFiles.push(processedFile);
          } else {
            // PDF files, keep as is
            processedFiles.push(file);
          }
        } catch (error: any) {
          console.error(`Error processing ${file.name}:`, error);
          // Still add the file even if compression fails
          processedFiles.push(file);
        }
      }
      
      const newImages = [...data[field], ...processedFiles];
      handleFieldChange(field, newImages.slice(0, maxFiles));
    }
  };

  const removeImage = (index: number, field: 'invoiceImages' | 'panImages' | 'declarationImages') => {
    const newImages = data[field].filter((_, i) => i !== index);
    handleFieldChange(field, newImages);
  };

  const handleEWaybillDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    const newDigits = [...(data.eWaybillDigits || Array(12).fill(''))];
    newDigits[index] = digit;
    handleFieldChange('eWaybillDigits', newDigits);

    // Auto-focus next input
    if (digit && index < 11) {
      const nextInput = document.getElementById(`ewaybill-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleEWaybillKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !data.eWaybillDigits?.[index] && index > 0) {
      const prevInput = document.getElementById(`ewaybill-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleNext = () => {
    // Check if at least one upload has files
    const hasAnyUpload = data.invoiceImages.length > 0 || 
                        data.panImages.length > 0 || 
                        data.declarationImages.length > 0;
    
    if (!hasAnyUpload || !data.acceptTerms) {
      return;
    }
    
    // Check E-Waybill if invoice value >= 50000
    if (parseInvoiceValue(data.invoiceValue) >= 50000) {
      const eWaybillComplete = data.eWaybillDigits?.every(d => d !== '') && data.eWaybillDigits?.length === 12;
      if (!eWaybillComplete) {
        return;
      }
    }
    
    onNext();
  };

  const renderUploadBox = (
    label: string,
    field: 'invoiceImages' | 'panImages' | 'declarationImages',
    disabled: boolean = false,
    maxFiles: number = 5
  ) => {
    const files = data[field];
    const previews = field === 'invoiceImages' ? invoiceImagePreviews : 
                     field === 'panImages' ? panImagePreviews : 
                     declarationImagePreviews;
    
    return (
      <div
        className={cn(
          'rounded-none transition-all duration-300',
          isDarkMode
            ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
            : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
        )}
      >
        <div className="space-y-2 p-3 sm:p-4">
          <h4 className={cn(
            'text-xs sm:text-sm font-semibold mb-2',
            isDarkMode ? 'text-slate-200' : 'text-slate-800'
          )}>
            {label}
          </h4>
          <div className={cn(
            'flex flex-wrap items-center gap-2 rounded-md border p-2',
            isDarkMode
              ? 'border-slate-700 bg-slate-800/50'
              : 'border-slate-300 bg-slate-50'
          )}>
            <input
              id={`${field}-input`}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, field)}
              disabled={disabled}
            />
            <label
              htmlFor={`${field}-input`}
              className={cn(
                'cursor-pointer rounded-md px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium transition-colors',
                disabled ? 'opacity-50 cursor-not-allowed' : '',
                isDarkMode
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              )}
            >
              Select Files
            </label>
            <div className="min-w-0 flex-1 text-xs">
              <p className={cn('truncate', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                {files.length > 0
                  ? `${files.length} file${files.length !== 1 ? 's' : ''} selected`
                  : 'No files selected'}
              </p>
              <p className={cn('text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                Accepted formats: JPG, PNG, PDF. Max {maxFiles} files.
              </p>
            </div>
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  handleFieldChange(field, []);
                  if (field === 'invoiceImages') setInvoiceImagePreviews([]);
                  if (field === 'panImages') setPanImagePreviews([]);
                  if (field === 'declarationImages') setDeclarationImagePreviews([]);
                }}
                className={cn(
                  'rounded-md px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium transition-colors flex items-center gap-1 sm:gap-1.5',
                  isDarkMode
                    ? 'bg-red-500/90 text-white hover:bg-red-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                )}
              >
                <XCircle className="w-3 h-3" />
                <span className="hidden sm:inline">Remove All</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}
          </div>

          {/* File Previews Grid */}
          {files.length > 0 && (
            <div className={cn(
              "grid gap-1.5 sm:gap-2 mt-2",
              files.length === 1 ? "grid-cols-1" :
              files.length === 2 ? "grid-cols-2" :
              files.length === 3 ? "grid-cols-2 sm:grid-cols-3" :
              files.length === 4 ? "grid-cols-2 sm:grid-cols-4" :
              "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
            )}>
              {files.map((file, index) => {
                const preview = previews[index];
                const isImage = file.type.startsWith('image/');
                
                return (
                  <div
                    key={index}
                    className={cn(
                      'relative group rounded-lg overflow-hidden border',
                      isDarkMode ? 'border-slate-700' : 'border-slate-200'
                    )}
                  >
                    {isImage && preview ? (
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-14 sm:h-16 object-cover cursor-pointer"
                        onClick={() => {
                          setDocumentPreviewUrl(preview);
                          setDocumentPreviewOpen(true);
                        }}
                      />
                    ) : (
                      <div className="w-full h-14 sm:h-16 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                        <FileText className={cn('w-5 h-5 sm:w-6 sm:h-6', isDarkMode ? 'text-slate-400' : 'text-slate-500')} />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index, field)}
                      className={cn(
                        'absolute top-0.5 right-0.5 sm:top-1 sm:right-1 p-0.5 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity',
                        isDarkMode
                          ? 'bg-red-500/80 text-white hover:bg-red-600'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      )}
                    >
                      <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                    {isImage && preview && (
                      <button
                        type="button"
                        onClick={() => {
                          setDocumentPreviewUrl(preview);
                          setDocumentPreviewOpen(true);
                        }}
                        className={cn(
                          'absolute top-0.5 left-0.5 sm:top-1 sm:left-1 p-0.5 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity',
                          isDarkMode
                            ? 'bg-blue-500/80 text-white hover:bg-blue-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        )}
                        title="Preview image"
                      >
                        <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const invoiceValue = parseInvoiceValue(data.invoiceValue);
  const showEWaybill = invoiceValue >= 50000;
  
  // Check if at least one upload has files
  const hasAnyUpload = data.invoiceImages.length > 0 || 
                       data.panImages.length > 0 || 
                       data.declarationImages.length > 0;
  
  // Check E-Waybill validation
  const eWaybillValid = !showEWaybill || (data.eWaybillDigits && data.eWaybillDigits.every(d => d !== '') && data.eWaybillDigits.length === 12);
  
  // Determine if next button should be disabled
  const isNextDisabled = !hasAnyUpload || !data.acceptTerms || !eWaybillValid;

  return (
    <div className={`space-y-3 sm:space-y-4 md:space-y-6 ${isDarkMode ? 'text-slate-100' : ''}`}>
    

      {/* Invoice Information */}
      <div className={`${data.packageImages.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className={`block text-base sm:text-lg font-semibold mb-2 sm:mb-3 md:mb-4 ${isDarkMode ? 'text-slate-200' : 'text-blue-700'}`}>
          Invoice Information
          {data.packageImages.length === 0 && (
            <span className="ml-1 sm:ml-2 text-xs text-red-600 font-normal">(Upload package images first)</span>
          )}
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <FloatingInput
            label="Invoice Number"
            value={data.invoiceNumber}
            onChange={(value) => handleFieldChange('invoiceNumber', value)}
            required
            disabled={data.packageImages.length === 0}
            icon={<FileText className="w-4 h-4" />}
            isDarkMode={isDarkMode}
          />

          <FloatingInput
            label="Declared Value (₹)"
            value={data.invoiceValue}
            onChange={(value) => handleFieldChange('invoiceValue', formatIndianNumber(value))}
            type="text"
            required
            disabled={data.packageImages.length === 0}
            icon={<IndianRupee className="w-4 h-4" />}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* E-Waybill - Conditional */}
        {showEWaybill && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-yellow-500/10 border-yellow-500/50'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-center mb-2 sm:mb-3">
              <AlertCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                E-Waybill Required (12 digits)
              </span>
            </div>
            <div className="flex gap-1 sm:gap-1.5 flex-wrap justify-center sm:justify-start">
              {(data.eWaybillDigits || Array(12).fill('')).map((digit, index) => (
                <input
                  key={index}
                  id={`ewaybill-digit-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleEWaybillDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleEWaybillKeyDown(index, e)}
                  disabled={data.packageImages.length === 0}
                  className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-center text-xs sm:text-sm font-semibold border-2 rounded-lg sm:rounded-xl transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-slate-800 border-yellow-500/50 text-slate-100 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30'
                      : 'bg-white border-yellow-300 text-gray-800 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  maxLength={1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Upload Documents */}
      <div className={`${data.packageImages.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex flex-col gap-0">
          {renderUploadBox('Invoice Image', 'invoiceImages', data.packageImages.length === 0, 10)}
          {renderUploadBox('PAN Card', 'panImages', data.packageImages.length === 0, 5)}
          {renderUploadBox('Declaration Form', 'declarationImages', data.packageImages.length === 0, 5)}
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className={`${data.packageImages.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className={`flex items-start space-x-2 sm:space-x-3 rounded-lg sm:rounded-xl py-2 sm:py-3 px-3 sm:px-4 ${
          isDarkMode ? 'bg-slate-800/60' : 'bg-white'
        }`}>
          <input
            type="checkbox"
            id="acceptTerms"
            checked={data.acceptTerms}
            onChange={(e) => handleFieldChange('acceptTerms', e.target.checked)}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 flex-shrink-0"
            required
            disabled={data.packageImages.length === 0}
          />
          <label htmlFor="acceptTerms" className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
            I accept the{' '}
            <a href="#" className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
              Terms & Conditions
            </a>
            {' '}and confirm that all information is accurate.
          </label>
        </div>
        {!data.acceptTerms && (
          <p className={`text-xs mt-1 sm:mt-2 ml-6 sm:ml-7 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            * Required to proceed
          </p>
        )}
      </div>

      {/* Document Preview Modal */}
      {documentPreviewOpen && documentPreviewUrl && (
        <Dialog open={documentPreviewOpen} onOpenChange={setDocumentPreviewOpen}>
          <DialogContent className={cn(
            'max-w-4xl max-h-[90vh] overflow-y-auto',
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          )}>
            <div className="relative">
              {documentPreviewUrl.endsWith('.pdf') || documentPreviewUrl.includes('application/pdf') ? (
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
      <div className="flex justify-between pt-3 sm:pt-4 gap-2">
        <button
          onClick={onPrevious}
          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          <span className="hidden sm:inline">← Previous Step</span>
          <span className="sm:hidden">← Back</span>
        </button>
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={cn(
            'px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base font-medium transition-all duration-200 shadow-md',
            isNextDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isDarkMode
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-[#406ab9] hover:bg-[#3059a0] text-white'
          )}
        >
          <span className="hidden sm:inline">Next Step →</span>
          <span className="sm:hidden">Next →</span>
        </button>
      </div>
    </div>
  );
};

export default UploadStep;