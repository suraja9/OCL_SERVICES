/**
 * Material Details Step Component (Step 3)
 * Matches BookNow.tsx design - Package info, images, dimensions, weight, declaration
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, Info, FileText, Ruler, Scale, Eye, XCircle, 
  Cog, Book, FileCheck, Candy, Shirt, Monitor, Gift, CreditCard,
  Apple, Home, Laptop, Luggage, Heart, Pill, BookOpen, HardDrive,
  Dumbbell, PenTool, Gamepad2
} from 'lucide-react';
import { UploadData } from '../types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FloatingInput, FloatingSelectWithIcons } from '../shared';
import { cn } from '@/lib/utils';

const VOLUMETRIC_DIVISOR = 5000;

const packageTypeOptions = [
  { value: 'Auto & Machine Parts', icon: Cog },
  { value: 'Books', icon: Book },
  { value: 'Cheque Book', icon: FileCheck },
  { value: 'Chocolates', icon: Candy },
  { value: 'Clothing (General)', icon: Shirt },
  { value: 'Computer Accessories', icon: Monitor },
  { value: 'Corporate Gifts', icon: Gift },
  { value: 'Credit / Debit Card', icon: CreditCard },
  { value: 'Documents', icon: FileText },
  { value: 'Dry Fruits', icon: Apple },
  { value: 'Household Goods', icon: Home },
  { value: 'Laptop', icon: Laptop },
  { value: 'Luggage / Travel Bag', icon: Luggage },
  { value: 'Medical Equipment', icon: Heart },
  { value: 'Medicines', icon: Pill },
  { value: 'Passport', icon: BookOpen },
  { value: 'Pen Drive', icon: HardDrive },
  { value: 'Promotional Material (Paper)', icon: FileText },
  { value: 'SIM Card', icon: CreditCard },
  { value: 'Sports', icon: Dumbbell },
  { value: 'Stationery Items', icon: PenTool },
  { value: 'Sweets', icon: Candy },
  { value: 'Toys', icon: Gamepad2 },
  { value: 'Others', icon: Package }
];

interface MaterialDetailsStepProps {
  uploadData: UploadData;
  onUploadDataChange: (data: UploadData) => void;
  onNext: () => void;
  onPrevious: () => void;
  isChargeableFixed: boolean;
  onChargeableFixedChange: (fixed: boolean) => void;
  isDarkMode?: boolean;
}

const MaterialDetailsStep: React.FC<MaterialDetailsStepProps> = ({
  uploadData,
  onUploadDataChange,
  onNext,
  onPrevious,
  isChargeableFixed,
  onChargeableFixedChange,
  isDarkMode = false
}) => {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);

  const sanitizeInteger = (value: string) => value.replace(/\D/g, '');
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

  // Calculate weights
  const lengthValue = useMemo(() => parseFloat(uploadData.length || '0') || 0, [uploadData.length]);
  const widthValue = useMemo(() => parseFloat(uploadData.width || '0') || 0, [uploadData.width]);
  const heightValue = useMemo(() => parseFloat(uploadData.height || '0') || 0, [uploadData.height]);
  const actualWeight = useMemo(() => parseFloat(uploadData.weight || '0') || 0, [uploadData.weight]);
  
  const volumetricWeight = useMemo(() => {
    if (!lengthValue || !widthValue || !heightValue) {
      return 0;
    }
    const volume = lengthValue * widthValue * heightValue;
    if (!Number.isFinite(volume) || volume <= 0) {
      return 0;
    }
    const calculated = volume / VOLUMETRIC_DIVISOR;
    if (!Number.isFinite(calculated) || calculated <= 0) {
      return 0;
    }
    return parseFloat(calculated.toFixed(2));
  }, [heightValue, lengthValue, widthValue]);
  
  const chargeableWeight = useMemo(() => {
    const weight = Math.max(actualWeight, volumetricWeight);
    if (!Number.isFinite(weight) || weight <= 0) {
      return 0;
    }
    return parseFloat(weight.toFixed(2));
  }, [actualWeight, volumetricWeight]);
  
  const formattedVolumetricWeight = volumetricWeight > 0 ? volumetricWeight.toFixed(2) : null;
  const formattedChargeableWeight = chargeableWeight > 0 ? chargeableWeight.toFixed(2) : null;

  const hasDimensions = lengthValue > 0 && widthValue > 0 && heightValue > 0;
  const hasActualWeight = actualWeight > 0;

  // Update image previews when packageImages change
  useEffect(() => {
    const newPreviews: string[] = [];
    uploadData.packageImages.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === uploadData.packageImages.length) {
          setImagePreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
    if (uploadData.packageImages.length === 0) {
      setImagePreviews([]);
    }
  }, [uploadData.packageImages]);

  const hasPackageBasics =
    uploadData.totalPackages && String(uploadData.totalPackages).trim().length > 0 &&
    uploadData.materials && String(uploadData.materials).trim().length > 0;
  const isPackageInfoComplete = Boolean(
    hasPackageBasics && 
    (hasDimensions || hasActualWeight) &&
    (uploadData.materials !== 'Others' || (uploadData.materials === 'Others' && uploadData.others && uploadData.others.trim().length > 0))
  );

  return (
    <div className={cn('space-y-4 sm:space-y-6 md:space-y-8', isDarkMode ? 'text-slate-100' : '')}>
      <div className={cn(
        'rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-300',
        isDarkMode
          ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
          : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
      )}>
        <div className="space-y-4">
          {/* No. of Packages and Materials */}
          <div className={cn(
            "grid gap-3",
            uploadData.materials === 'Others' 
              ? "grid-cols-1 md:grid-cols-3" 
              : "grid-cols-1 md:grid-cols-2"
          )}>
            <FloatingInput
              label="No. of Packages :"
              value={uploadData.totalPackages}
              onChange={(value) =>
                onUploadDataChange({ ...uploadData, totalPackages: sanitizeInteger(value) })
              }
              type="text"
              required
              icon={<Package className="h-4 w-4" />}
              isDarkMode={isDarkMode}
            />
            <FloatingSelectWithIcons
              label="Package Type :"
              value={uploadData.materials}
              onChange={(value) =>
                onUploadDataChange({ 
                  ...uploadData, 
                  materials: value,
                  others: value === 'Others' ? uploadData.others : '' // Clear others if not Others
                })
              }
              options={packageTypeOptions}
              required
              icon={<Info className="h-4 w-4" />}
              isDarkMode={isDarkMode}
            />
            {uploadData.materials === 'Others' && (
              <FloatingInput
                label="Others - Specify :"
                value={uploadData.others || ''}
                onChange={(value) =>
                  onUploadDataChange({ ...uploadData, others: value })
                }
                type="text"
                required
                isDarkMode={isDarkMode}
              />
            )}
          </div>
          
          {/* Package Images - Show when both packagesCount and materials are filled */}
          {uploadData.totalPackages && uploadData.totalPackages.trim().length > 0 && 
           uploadData.materials && uploadData.materials.trim().length > 0 &&
           (uploadData.materials !== 'Others' || (uploadData.materials === 'Others' && uploadData.others && uploadData.others.trim().length > 0)) && (
            <div className={cn(
              'rounded-xl transition-all duration-300',
              isDarkMode
                ? 'border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80'
                : 'border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50/30'
            )}>
              <div className="space-y-2">
                <div className={cn(
                  'flex flex-wrap items-center gap-2 rounded-md border p-2',
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800/50'
                    : 'border-slate-300 bg-slate-50'
                )}>
                  <input
                    id="package-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []);
                      if (files.length + uploadData.packageImages.length > 5) {
                        alert('Maximum 5 images allowed');
                        return;
                      }
                      const newFiles = [...uploadData.packageImages, ...files];
                      onUploadDataChange({ ...uploadData, packageImages: newFiles });
                    }}
                  />
                  <label
                    htmlFor="package-image-upload"
                    className={cn(
                      'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isDarkMode
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    )}
                  >
                    Select Images
                  </label>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className={cn('truncate', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                      {uploadData.packageImages.length > 0 
                        ? `${uploadData.packageImages.length} image${uploadData.packageImages.length !== 1 ? 's' : ''} selected`
                        : 'No images selected'}
                    </p>
                    <p className={cn('text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                      Accepted formats: JPG, PNG. Max 5 images.
                    </p>
                  </div>
                  {uploadData.packageImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onUploadDataChange({ ...uploadData, packageImages: [] });
                        setImagePreviews([]);
                      }}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                        isDarkMode
                          ? 'bg-red-500/90 text-white hover:bg-red-600'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      )}
                    >
                      <XCircle className="w-3 h-3" />
                      Remove All
                    </button>
                  )}
                </div>

                {/* Image Previews Grid */}
                {imagePreviews.length > 0 && (
                  <div className={cn(
                    "grid gap-2 mt-2",
                    imagePreviews.length === 3 ? "grid-cols-3" :
                    imagePreviews.length === 4 ? "grid-cols-4" :
                    "grid-cols-5"
                  )}>
                    {imagePreviews.map((preview, index) => (
                      <div
                        key={index}
                        className={cn(
                          'relative group rounded-lg overflow-hidden border',
                          isDarkMode ? 'border-slate-700' : 'border-slate-200'
                        )}
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-16 object-cover cursor-pointer"
                          onClick={() => {
                            setDocumentPreviewUrl(preview);
                            setDocumentPreviewOpen(true);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = uploadData.packageImages.filter((_, i) => i !== index);
                            const newPreviews = imagePreviews.filter((_, i) => i !== index);
                            onUploadDataChange({ ...uploadData, packageImages: newFiles });
                            setImagePreviews(newPreviews);
                          }}
                          className={cn(
                            'absolute top-1 right-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                            isDarkMode
                              ? 'bg-red-500/80 text-white hover:bg-red-600'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          )}
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentPreviewUrl(preview);
                            setDocumentPreviewOpen(true);
                          }}
                          className={cn(
                            'absolute top-1 left-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                            isDarkMode
                              ? 'bg-blue-500/80 text-white hover:bg-blue-600'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          )}
                          title="Preview image"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Description */}
          <div>
            <FloatingInput
              label="Content Description :"
              value={uploadData.contentDescription || ''}
              onChange={(value) =>
                onUploadDataChange({ ...uploadData, contentDescription: value })
              }
              type="text"
              className="w-full"
              isDarkMode={isDarkMode}
            />
          </div>
          
          {/* Dimensions Section */}
          <div className={cn('grid gap-3 grid-cols-1 sm:grid-cols-4', isChargeableFixed && 'opacity-50')}>
            <FloatingInput
              label="Length"
              value={uploadData.length || ''}
              onChange={(value) =>
                onUploadDataChange({ ...uploadData, length: sanitizeDecimal(value) })
              }
              type="text"
              required={!hasActualWeight}
              disabled={isChargeableFixed}
              isDarkMode={isDarkMode}
            />
            <FloatingInput
              label="Breadth"
              value={uploadData.width || ''}
              onChange={(value) =>
                onUploadDataChange({ ...uploadData, width: sanitizeDecimal(value) })
              }
              type="text"
              required={!hasActualWeight}
              disabled={isChargeableFixed}
              isDarkMode={isDarkMode}
            />
            <FloatingInput
              label="Height"
              value={uploadData.height || ''}
              onChange={(value) =>
                onUploadDataChange({ ...uploadData, height: sanitizeDecimal(value) })
              }
              type="text"
              required={!hasActualWeight}
              disabled={isChargeableFixed}
              isDarkMode={isDarkMode}
            />
            {/* Unit Display */}
            <div className={cn(
              'flex items-center justify-center rounded-xl border px-4',
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                : 'bg-white/90 border-gray-300 text-gray-600'
            )}>
              <span className="text-sm font-medium">cm</span>
            </div>
          </div>
          
          {/* Weight Inputs Section */}
          <div className={cn('grid gap-3 grid-cols-1 sm:grid-cols-2', isChargeableFixed && 'opacity-50')}>
            <FloatingInput
              label="Actual Weight (Kg.)"
              value={uploadData.weight || ''}
              onChange={(value) =>
                onUploadDataChange({ ...uploadData, weight: sanitizeDecimal(value) })
              }
              type="text"
              required={!hasDimensions}
              icon={<Scale className="h-4 w-4" />}
              disabled={isChargeableFixed}
              isDarkMode={isDarkMode}
            />
            <FloatingInput
              label="Per Kg."
              value={uploadData.perKgWeight || ''}
              onChange={(value) =>
                onUploadDataChange({ ...uploadData, perKgWeight: sanitizeDecimal(value) })
              }
              type="text"
              icon={<Scale className="h-4 w-4" />}
              disabled={isChargeableFixed}
              isDarkMode={isDarkMode}
            />
          </div>
          
          {/* Weight Results Display */}
          <div className="grid grid-cols-4 gap-2">
            {/* Volumetric Display */}
            <div className={cn(
              'rounded-xl py-2 px-2.5 border',
              isDarkMode
                ? 'bg-slate-800 border-blue-500/50'
                : 'bg-white border-blue-200',
              isChargeableFixed && 'opacity-50'
            )}>
              <div className={cn('text-xs mb-0.5', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>
                Volumetric
              </div>
              <div className={cn('text-sm font-semibold', isDarkMode ? 'text-blue-400' : 'text-blue-600')}>
                {formattedVolumetricWeight ? `${formattedVolumetricWeight} Kg.` : '0 Kg.'}
              </div>
            </div>
            
            {/* Actual Display */}
            <div className={cn(
              'rounded-xl py-2 px-2.5 border',
              isDarkMode
                ? 'bg-slate-800 border-blue-500/50'
                : 'bg-white border-blue-200',
              isChargeableFixed && 'opacity-50'
            )}>
              <div className={cn('text-xs mb-0.5', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>
                Actual
              </div>
              <div className={cn('text-sm font-semibold', isDarkMode ? 'text-blue-400' : 'text-blue-600')}>
                {uploadData.weight ? `${parseFloat(uploadData.weight) || 0} Kg.` : '0 Kg.'}
              </div>
            </div>
            
            {/* Chargeable Display */}
            <div className={cn(
              'rounded-xl py-2 px-2.5 border',
              formattedChargeableWeight && parseFloat(formattedChargeableWeight) > 0
                ? isDarkMode
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-blue-50 border-blue-400'
                : isDarkMode
                  ? 'bg-slate-800 border-blue-500/50'
                  : 'bg-white border-blue-200',
              isChargeableFixed && 'opacity-50'
            )}>
              <div className={cn('text-xs mb-0.5 font-medium', isDarkMode ? 'text-slate-300' : 'text-gray-700')}>
                Chargeable
              </div>
              <div className={cn('text-sm font-bold', isDarkMode ? 'text-blue-300' : 'text-blue-700')}>
                {formattedChargeableWeight ? `${formattedChargeableWeight} Kg.` : '0 Kg.'}
              </div>
            </div>
            
            {/* Chargeable Fix Button */}
            <button
              onClick={() => onChargeableFixedChange(!isChargeableFixed)}
              className={cn(
                'rounded-xl py-2 px-2.5 border-2 transition-all duration-200',
                isDarkMode
                  ? isChargeableFixed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-green-500 hover:border-green-500 hover:text-white'
                  : isChargeableFixed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-green-500 hover:border-green-500 hover:text-white'
              )}
            >
              <div className="text-xs font-medium mb-0.5">Chargeable</div>
              <div className="text-sm font-bold">Fix</div>
            </button>
          </div>
        </div>
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
          disabled={!isPackageInfoComplete}
          className={cn(
            'w-auto px-6',
            isDarkMode
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white',
            !isPackageInfoComplete && 'opacity-60 cursor-not-allowed'
          )}
        >
          Next →
        </Button>
      </div>
    </div>
  );
};

export default MaterialDetailsStep;

