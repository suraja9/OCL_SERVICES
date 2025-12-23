/**
 * Details Step Component
 * Sixth step of the office booking flow - Enter charges and pricing details
 */

import React, { useState, useEffect } from 'react';
import { FileText, IndianRupee, ChevronRight } from 'lucide-react';
import { DetailsData, BillData, ShipmentData, UploadData } from '../types';

interface DetailsStepProps {
  data: DetailsData;
  onChange: (data: DetailsData) => void;
  onNext: () => void;
  onPrevious: () => void;
  billData: BillData;
  originData: any;
  destinationData: any;
  shipmentData: ShipmentData;
  uploadData: UploadData;
  isChargeableFixed?: boolean;
  isDarkMode?: boolean;
}

const DetailsStep: React.FC<DetailsStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  billData,
  originData,
  destinationData,
  shipmentData,
  uploadData,
  isChargeableFixed = false,
  isDarkMode = false
}) => {
  const [showCustomFuelCharge, setShowCustomFuelCharge] = useState(false);

  // Format Indian number system
  const formatIndianNumber = (value: string): string => {
    const numValue = value.replace(/[^\d.]/g, '');
    if (!numValue) return '';
    const parts = numValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const formatIndianNumberWithDecimals = (value: string): string => {
    const numValue = parseFloat(value.replace(/,/g, '')) || 0;
    return numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    return parseFloat(value.replace(/,/g, '')) || 0;
  };

  const handleChargeChange = (field: keyof DetailsData, value: string) => {
    const formatted = formatIndianNumber(value);
    onChange({ ...data, [field]: formatted });
  };

  const handleChargeBlur = (field: keyof DetailsData, value: string) => {
    const formatted = formatIndianNumberWithDecimals(value);
    onChange({ ...data, [field]: formatted });
  };

  // Get selected party state for GST calculation
  const getSelectedPartyState = (): string => {
    if (billData.partyType === 'sender') {
      return originData?.state || '';
    } else if (billData.partyType === 'recipient') {
      return destinationData?.state || '';
    } else if (billData.partyType === 'other') {
      return billData.otherPartyDetails?.state || '';
    }
    return '';
  };

  // Auto-calculate totals and GST
  useEffect(() => {
    // Calculate sum of all charges (excluding fuel)
    const freight = parseFormattedNumber(data.freightCharge);
    const awb = parseFormattedNumber(data.awbCharge);
    const pickup = parseFormattedNumber(data.pickupCharge);
    const localCollection = parseFormattedNumber(data.localCollection);
    const doorDelivery = parseFormattedNumber(data.doorDelivery);
    const loadingUnloading = parseFormattedNumber(data.loadingUnloading);
    const demurrage = parseFormattedNumber(data.demurrageCharge);
    const dda = parseFormattedNumber(data.ddaCharge);
    const hamali = parseFormattedNumber(data.hamaliCharge);
    const packing = parseFormattedNumber(data.packingCharge);
    const other = parseFormattedNumber(data.otherCharge);

    let subtotal = freight + awb + pickup + localCollection + doorDelivery + loadingUnloading + demurrage + dda + hamali + packing + other;

    // Calculate fuel charge
    let fuelAmount = 0;
    if (data.fuelCharge) {
      const fuelPercentage = parseFloat(data.fuelCharge);
      if (!isNaN(fuelPercentage) && fuelPercentage > 0) {
        fuelAmount = (subtotal * fuelPercentage) / 100;
      }
    }

    const totalWithFuel = subtotal + fuelAmount;
    const formattedTotal = totalWithFuel > 0 ? formatIndianNumberWithDecimals(totalWithFuel.toString()) : '';

    // Calculate GST - only for normal GST, not for RCM
    let sgst = 0;
    let cgst = 0;
    let igst = 0;

    if (billData.billType === 'normal') {
      const selectedPartyState = getSelectedPartyState();
      
      if (selectedPartyState.toLowerCase() === 'assam') {
        // Assam: CGST (9%) + SGST (9%)
        cgst = totalWithFuel * 0.09;
        sgst = totalWithFuel * 0.09;
        igst = 0;
      } else {
        // Other states: IGST (18%)
        igst = totalWithFuel * 0.18;
        cgst = 0;
        sgst = 0;
      }
    } else if (billData.billType === 'rcm') {
      // RCM: No GST calculation
      sgst = 0;
      cgst = 0;
      igst = 0;
    }

    const formattedSGST = sgst > 0 ? formatIndianNumberWithDecimals(sgst.toString()) : '';
    const formattedCGST = cgst > 0 ? formatIndianNumberWithDecimals(cgst.toString()) : '';
    const formattedIGST = igst > 0 ? formatIndianNumberWithDecimals(igst.toString()) : '';

    // Calculate Grand Total
    const grandTotalValue = totalWithFuel + sgst + cgst + igst;
    const formattedGrandTotal = grandTotalValue > 0 ? formatIndianNumberWithDecimals(grandTotalValue.toString()) : '';

    // Update state only if values changed (to prevent infinite loops)
    if (data.total !== formattedTotal ||
        data.sgstAmount !== formattedSGST ||
        data.cgstAmount !== formattedCGST ||
        data.igstAmount !== formattedIGST ||
        data.grandTotal !== formattedGrandTotal) {
      onChange({
        ...data,
        total: formattedTotal,
        sgstAmount: formattedSGST,
        cgstAmount: formattedCGST,
        igstAmount: formattedIGST,
        grandTotal: formattedGrandTotal
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data.freightCharge,
    data.awbCharge,
    data.localCollection,
    data.doorDelivery,
    data.loadingUnloading,
    data.demurrageCharge,
    data.ddaCharge,
    data.hamaliCharge,
    data.packingCharge,
    data.otherCharge,
    data.fuelCharge,
    billData.billType,
    billData.partyType,
    originData?.state,
    destinationData?.state,
    billData.otherPartyDetails?.state
  ]);

  // Calculate chargeable weight from dimensions or actual weight
  const calculateChargeableWeight = (): number => {
    const VOLUMETRIC_DIVISOR = 5000;
    const lengthValue = parseFloat(uploadData.length || '0') || 0;
    const widthValue = parseFloat(uploadData.width || '0') || 0;
    const heightValue = parseFloat(uploadData.height || '0') || 0;
    const actualWeight = parseFloat(uploadData.weight || '0') || 0;
    
    // Calculate volumetric weight
    let volumetricWeight = 0;
    if (lengthValue > 0 && widthValue > 0 && heightValue > 0) {
      const volume = lengthValue * widthValue * heightValue;
      if (Number.isFinite(volume) && volume > 0) {
        volumetricWeight = parseFloat((volume / VOLUMETRIC_DIVISOR).toFixed(2));
      }
    }
    
    // Chargeable weight is max of actual and volumetric
    const chargeableWeight = Math.max(actualWeight, volumetricWeight);
    return Number.isFinite(chargeableWeight) && chargeableWeight > 0 ? chargeableWeight : 0;
  };

  // Auto-calculate freight charge from perKgWeight if available
  useEffect(() => {
    if (isChargeableFixed) {
      // When chargeable fix is active, freight charge should be blank and editable
      // Only clear if it's auto-calculated (has a value but perKgWeight exists)
      if (uploadData.perKgWeight && data.freightCharge) {
        // Check if the current value matches an auto-calculated value
        const perKgRate = parseFormattedNumber(uploadData.perKgWeight);
        const chargeableWeight = calculateChargeableWeight();
        if (!isNaN(perKgRate) && perKgRate > 0 && chargeableWeight > 0) {
          const calculatedFreight = perKgRate * chargeableWeight;
          const formattedFreight = formatIndianNumberWithDecimals(calculatedFreight.toString());
          // Only clear if it matches the auto-calculated value
          if (data.freightCharge === formattedFreight) {
            onChange({ ...data, freightCharge: '' });
          }
        }
      }
    } else if (uploadData.perKgWeight) {
      // When chargeable fix is NOT active, auto-calculate freight charge
      const perKgRate = parseFormattedNumber(uploadData.perKgWeight);
      const chargeableWeight = calculateChargeableWeight();
      
      if (!isNaN(perKgRate) && perKgRate > 0 && chargeableWeight > 0) {
        const calculatedFreight = perKgRate * chargeableWeight;
        const formattedFreight = formatIndianNumberWithDecimals(calculatedFreight.toString());
        if (data.freightCharge !== formattedFreight) {
          onChange({ ...data, freightCharge: formattedFreight });
        }
      } else if (data.freightCharge) {
        // Clear freight charge if perKgRate or chargeableWeight is invalid
        onChange({ ...data, freightCharge: '' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadData.perKgWeight, uploadData.length, uploadData.width, uploadData.height, uploadData.weight, isChargeableFixed]);

  const handleFuelChargeChange = (value: string) => {
    if (value === 'other') {
      setShowCustomFuelCharge(true);
      onChange({ ...data, fuelCharge: '', fuelChargeType: 'custom' });
    } else {
      setShowCustomFuelCharge(false);
      onChange({ ...data, fuelCharge: value, fuelChargeType: 'percentage' });
    }
  };

  const handleNext = () => {
    onNext();
  };

  const fuelAmount = (() => {
    const subtotal = parseFormattedNumber(data.freightCharge) +
      parseFormattedNumber(data.awbCharge) +
      parseFormattedNumber(data.pickupCharge) +
      parseFormattedNumber(data.localCollection) +
      parseFormattedNumber(data.doorDelivery) +
      parseFormattedNumber(data.loadingUnloading) +
      parseFormattedNumber(data.demurrageCharge) +
      parseFormattedNumber(data.ddaCharge) +
      parseFormattedNumber(data.hamaliCharge) +
      parseFormattedNumber(data.packingCharge) +
      parseFormattedNumber(data.otherCharge);
    
    if (data.fuelCharge) {
      const fuelPercentage = parseFloat(data.fuelCharge);
      if (!isNaN(fuelPercentage) && fuelPercentage > 0) {
        return (subtotal * fuelPercentage) / 100;
      }
    }
    return 0;
  })();

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-slate-100' : ''}`}>
      

      {/* Charges Grid */}
      <div className="space-y-0.5">
        {/* Freight Charge */}
        <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
          <label className={`text-sm font-normal w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Freight Charge
            {uploadData.perKgWeight && !isChargeableFixed && (
              <span className={`ml-2 text-xs font-normal ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                (Auto-calculated)
              </span>
            )}
          </label>
          <input
            type="text"
            value={data.freightCharge}
            onChange={(e) => handleChargeChange('freightCharge', e.target.value)}
            onBlur={(e) => handleChargeBlur('freightCharge', e.target.value)}
            placeholder="0.00"
            disabled={uploadData.perKgWeight && !isChargeableFixed}
            className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl transition-all border ${
              isDarkMode
                ? uploadData.perKgWeight && !isChargeableFixed
                  ? 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                : uploadData.perKgWeight && !isChargeableFixed
                  ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-white/90 border-gray-300/60 text-slate-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
        </div>

        {/* AWB Charge */}
        <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
          <label className={`text-sm font-normal w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            AWB Charge
          </label>
          <input
            type="text"
            value={data.awbCharge}
            onChange={(e) => handleChargeChange('awbCharge', e.target.value)}
            onBlur={(e) => handleChargeBlur('awbCharge', e.target.value)}
            placeholder="0.00"
            className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl transition-all border ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                : 'bg-white/90 border-gray-300/60 text-slate-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Pickup Charge */}
        <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
          <label className={`text-sm font-normal w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Pickup Charge
          </label>
          <input
            type="text"
            value={data.pickupCharge}
            onChange={(e) => handleChargeChange('pickupCharge', e.target.value)}
            onBlur={(e) => handleChargeBlur('pickupCharge', e.target.value)}
            placeholder="0.00"
            className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl transition-all border ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                : 'bg-white/90 border-gray-300/60 text-slate-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Local Collection */}
        <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
          <label className={`text-sm font-normal w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Local Collection
          </label>
          <input
            type="text"
            value={data.localCollection}
            onChange={(e) => handleChargeChange('localCollection', e.target.value)}
            onBlur={(e) => handleChargeBlur('localCollection', e.target.value)}
            placeholder="0.00"
            className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl transition-all border ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                : 'bg-white/90 border-gray-300/60 text-slate-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Door Delivery */}
        <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
          <label className={`text-sm font-normal w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Door Delivery
          </label>
          <input
            type="text"
            value={data.doorDelivery}
            onChange={(e) => handleChargeChange('doorDelivery', e.target.value)}
            onBlur={(e) => handleChargeBlur('doorDelivery', e.target.value)}
            placeholder="0.00"
            className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl transition-all border ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                : 'bg-white/90 border-gray-300/60 text-slate-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Loading & Unloading */}
        <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
          <label className={`text-sm font-normal w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Loading & Unloading
          </label>
          <input
            type="text"
            value={data.loadingUnloading}
            onChange={(e) => handleChargeChange('loadingUnloading', e.target.value)}
            onBlur={(e) => handleChargeBlur('loadingUnloading', e.target.value)}
            placeholder="0.00"
            className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl transition-all border ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                : 'bg-white/90 border-gray-300/60 text-slate-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Demurrage Charge */}
        <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
          <label className={`text-sm font-normal w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Demurrage Charge
          </label>
          <input
            type="text"
            value={data.demurrageCharge}
            onChange={(e) => handleChargeChange('demurrageCharge', e.target.value)}
            onBlur={(e) => handleChargeBlur('demurrageCharge', e.target.value)}
            placeholder="0.00"
            className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl transition-all border ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                : 'bg-white/90 border-gray-300/60 text-slate-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
        </div>

        {/* DDA Charge */}
        <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
          <label className={`text-sm font-normal w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            ODA Charge
          </label>
          <input
            type="text"
            value={data.ddaCharge}
            onChange={(e) => handleChargeChange('ddaCharge', e.target.value)}
            onBlur={(e) => handleChargeBlur('ddaCharge', e.target.value)}
            placeholder="0.00"
            className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl transition-all border ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                : 'bg-white/90 border-gray-300/60 text-slate-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Hamali Charge */}
        <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
          <label className={`text-sm font-normal w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Hamali Charge
          </label>
          <input
            type="text"
            value={data.hamaliCharge}
            onChange={(e) => handleChargeChange('hamaliCharge', e.target.value)}
            onBlur={(e) => handleChargeBlur('hamaliCharge', e.target.value)}
            placeholder="0.00"
            className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl transition-all border ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                : 'bg-white/90 border-gray-300/60 text-slate-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Packing Charge */}
        <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
          <label className={`text-sm font-normal w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Packing Charge
          </label>
          <input
            type="text"
            value={data.packingCharge}
            onChange={(e) => handleChargeChange('packingCharge', e.target.value)}
            onBlur={(e) => handleChargeBlur('packingCharge', e.target.value)}
            placeholder="0.00"
            className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl transition-all border ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                : 'bg-white/90 border-gray-300/60 text-slate-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Other Charge */}
        <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
          <label className={`text-sm font-normal w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Other Charge
          </label>
          <input
            type="text"
            value={data.otherCharge}
            onChange={(e) => handleChargeChange('otherCharge', e.target.value)}
            onBlur={(e) => handleChargeBlur('otherCharge', e.target.value)}
            placeholder="0.00"
            className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl transition-all border ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-100 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                : 'bg-white/90 border-gray-300/60 text-slate-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Total (before fuel) */}
        <div className={`flex items-center justify-between gap-1`}>
          <label className={`text-sm font-semibold w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            Total
          </label>
          <input
            type="text"
            value={(() => {
              const subtotal = parseFormattedNumber(data.freightCharge) +
                parseFormattedNumber(data.awbCharge) +
                parseFormattedNumber(data.pickupCharge) +
                parseFormattedNumber(data.localCollection) +
                parseFormattedNumber(data.doorDelivery) +
                parseFormattedNumber(data.loadingUnloading) +
                parseFormattedNumber(data.demurrageCharge) +
                parseFormattedNumber(data.ddaCharge) +
                parseFormattedNumber(data.hamaliCharge) +
                parseFormattedNumber(data.packingCharge) +
                parseFormattedNumber(data.otherCharge);
              return subtotal > 0 ? formatIndianNumberWithDecimals(subtotal.toString()) : '0.00';
            })()}
            readOnly
            placeholder="0.00"
            className={`w-1/2 h-10 px-3 text-right text-sm font-semibold rounded-xl cursor-not-allowed transition-all border ${
              isDarkMode
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                : 'bg-blue-50 border-blue-200 text-slate-800'
            }`}
          />
        </div>

        {/* Fuel Charge */}
        <div className="flex items-center gap-1">
          <label className={`text-sm font-normal w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Fuel Charge
          </label>
          <div className="w-1/2 flex items-center gap-4">
            {!showCustomFuelCharge ? (
              <div className="relative w-1/2">
                <select
                  value={data.fuelCharge}
                  onChange={(e) => handleFuelChargeChange(e.target.value)}
                  className={`w-full h-10 px-3 pr-10 border rounded-xl text-sm transition-all cursor-pointer appearance-none ${
                    isDarkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-100 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      : 'bg-white/90 border-gray-300/60 text-slate-900 hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                >
                  <option value="">Select %</option>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="10">10%</option>
                  <option value="15">15%</option>
                  <option value="20">20%</option>
                  <option value="other">Other</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <ChevronRight className={`w-4 h-4 rotate-90 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={data.fuelCharge}
                onChange={(e) => onChange({ ...data, fuelCharge: e.target.value })}
                placeholder="Enter %"
                className={`w-1/2 h-10 px-3 border rounded-xl text-sm transition-all ${
                  isDarkMode
                    ? 'bg-slate-800/60 border-slate-700 text-slate-100 hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'bg-white/90 border-gray-300/60 text-slate-900 hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
            )}
            
            {/* Fuel Charge Amount Display */}
            <input
              type="text"
              value={fuelAmount > 0 ? formatIndianNumberWithDecimals(fuelAmount.toString()) : '0.00'}
              readOnly
              placeholder="0.00"
              className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl cursor-not-allowed transition-all border ${
                isDarkMode
                  ? 'bg-slate-800/40 border-slate-700 text-slate-400'
                  : 'bg-slate-100 border-slate-300 text-slate-500'
              }`}
            />
          </div>
        </div>
        
        {/* Total with Fuel Charge */}
        <div className={`flex items-center justify-between gap-1`}>
          <label className={`text-sm font-semibold w-1/2 py-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            Total (with Fuel)
          </label>
          <input
            type="text"
            value={data.total || '0.00'}
            readOnly
            placeholder="0.00"
            className={`w-1/2 h-10 px-3 text-right cursor-not-allowed transition-all text-sm font-semibold rounded-xl border ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                : 'bg-gray-50 border-gray-200 text-slate-800'
            }`}
          />
        </div>

        {/* GST Section - Only show for Normal GST, not for RCM */}
        {billData.billType === 'normal' && (
          <>
            <div className={`flex items-center gap-3`}>
              <label className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                GST
              </label>
            </div>
            {/* SGST */}
            <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
              <div className="flex items-center gap-2 w-1/2 py-1">
                <label className={`text-sm font-normal ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  SGST
                </label>
                <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  (9%)
                </span>
              </div>
              <input
                type="text"
                value={data.sgstAmount || '0.00'}
                readOnly
                placeholder="0.00"
                className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl cursor-not-allowed transition-all border ${
                  isDarkMode
                    ? 'bg-slate-800/40 border-slate-700 text-slate-400'
                    : 'bg-slate-100 border-slate-300 text-slate-500'
                }`}
              />
            </div>

            {/* CGST */}
            <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
              <div className="flex items-center gap-2 w-1/2 py-1">
                <label className={`text-sm font-normal ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  CGST
                </label>
                <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  (9%)
                </span>
              </div>
              <input
                type="text"
                value={data.cgstAmount || '0.00'}
                readOnly
                placeholder="0.00"
                className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl cursor-not-allowed transition-all border ${
                  isDarkMode
                    ? 'bg-slate-800/40 border-slate-700 text-slate-400'
                    : 'bg-slate-100 border-slate-300 text-slate-500'
                }`}
              />
            </div>

            {/* IGST */}
            <div className={`flex items-center justify-between gap-1 ${isDarkMode ? '' : ''}`}>
              <div className="flex items-center gap-2 w-1/2 py-1">
                <label className={`text-sm font-normal ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  IGST
                </label>
                <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  (18%)
                </span>
              </div>
              <input
                type="text"
                value={data.igstAmount || '0.00'}
                readOnly
                placeholder="0.00"
                className={`w-1/2 h-10 px-3 text-right text-sm rounded-xl cursor-not-allowed transition-all border ${
                  isDarkMode
                    ? 'bg-slate-800/40 border-slate-700 text-slate-400'
                    : 'bg-slate-100 border-slate-300 text-slate-500'
                }`}
              />
            </div>
          </>
        )}

        {/* Grand Total */}
        <div className={`pt-0.5 pb-0.5`}>
          <div className="flex items-center justify-between gap-1">
            <label className={`text-base font-bold w-1/2 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Grand Total
            </label>
            <input
              type="text"
              value={data.grandTotal || '0.00'}
              readOnly
              placeholder="0.00"
              className={`w-1/2 h-12 px-4 rounded-xl text-right text-base font-bold cursor-not-allowed shadow-sm transition-all border ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-500/20 to-green-500/20 border-blue-500/30 text-blue-300'
                  : 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 text-blue-600'
              }`}
            />
          </div>
        </div>
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
          className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white shadow-md`}
        >
          Next Step →
        </button>
      </div>
    </div>
  );
};

export default DetailsStep;

