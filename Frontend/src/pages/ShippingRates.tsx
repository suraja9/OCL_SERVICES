import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Download, Loader2, RefreshCw, Phone, ArrowLeft } from "lucide-react";
import { calculateShippingRate, calculateVolumetricWeight } from "@/utils/calc";
import ratesData from "@/data/rates.json";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface RateCalculation {
  baseAmount: number;
  fuelSurcharge: number;
  subtotal: number;
  gst: number;
  total: number;
  zone: string;
  service: string;
  deliveryDays: string;
}

const ShippingRates = () => {
  const [formData, setFormData] = useState({
    fromPincode: "",
    toPincode: "",
    length: "",
    breadth: "",
    height: "",
    actualWeight: "",
    serviceType: "standard",
    zone: "national" // Default zone, can be auto-determined from pincodes
  });
  const [volumetricWeight, setVolumetricWeight] = useState<number | null>(null);
  const [chargeableWeight, setChargeableWeight] = useState<number | null>(null);
  const [calculation, setCalculation] = useState<RateCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("standard");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-calculate volumetric weight when dimensions are filled
  useEffect(() => {
    const { length, breadth, height } = formData;
    
    if (length && breadth && height) {
      const lengthNum = parseFloat(length);
      const breadthNum = parseFloat(breadth);
      const heightNum = parseFloat(height);
      
      if (lengthNum > 0 && breadthNum > 0 && heightNum > 0) {
        const volWeight = (lengthNum * breadthNum * heightNum) / 5000;
        setVolumetricWeight(Math.round(volWeight * 100) / 100);
      } else {
        setVolumetricWeight(null);
      }
    } else {
      setVolumetricWeight(null);
    }
  }, [formData.length, formData.breadth, formData.height]);

  // Auto-calculate chargeable weight when both weights are available
  useEffect(() => {
    if (volumetricWeight !== null && formData.actualWeight) {
      const actualWeightNum = parseFloat(formData.actualWeight);
      if (actualWeightNum > 0) {
        const chargeable = Math.max(actualWeightNum, volumetricWeight);
        setChargeableWeight(Math.round(chargeable * 100) / 100);
      } else {
        setChargeableWeight(null);
      }
    } else {
      setChargeableWeight(null);
    }
  }, [volumetricWeight, formData.actualWeight]);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromPincode || !formData.toPincode || !formData.length || !formData.breadth || !formData.height || !formData.actualWeight || !formData.serviceType) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!chargeableWeight || chargeableWeight <= 0) {
      toast({
        title: "Invalid weight values",
        description: "Please ensure all dimensions and actual weight are valid",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setShowSuccess(false);
    
    try {
      // Show spinner for 0.4s
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const result = calculateShippingRate(chargeableWeight, formData.zone, formData.serviceType, ratesData);
      
      setCalculation(result);
      setSelectedServiceType(formData.serviceType);
      setShowSuccess(true);
      
      toast({
        title: "Rate calculated successfully!",
        description: `Total amount: ₹${result.total}`,
      });
    } catch (error) {
      toast({
        title: "Calculation failed",
        description: "Please check your inputs and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const exportQuote = () => {
    if (!calculation) return;
    
    const quoteData = {
      quote: {
        fromPincode: formData.fromPincode,
        toPincode: formData.toPincode,
        dimensions: {
          length: formData.length,
          breadth: formData.breadth,
          height: formData.height
        },
        volumetricWeight: volumetricWeight,
        actualWeight: formData.actualWeight,
        chargeableWeight: chargeableWeight,
        serviceType: formData.serviceType,
        zone: calculation.zone,
        deliveryDays: calculation.deliveryDays
      },
      breakdown: calculation,
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const blob = new Blob([JSON.stringify(quoteData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipping-quote-${formData.fromPincode}-${formData.toPincode}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Quote exported!",
      description: "Shipping quote saved to downloads",
    });
  };

  const handleServiceTypeChange = (serviceType: string) => {
    setSelectedServiceType(serviceType);
    setFormData(prev => ({ ...prev, serviceType }));
    // Recalculate if calculation exists
    if (calculation && chargeableWeight) {
      const result = calculateShippingRate(chargeableWeight, formData.zone, serviceType, ratesData);
      setCalculation(result);
    }
  };

  const handleRefresh = () => {
    setFormData({
      fromPincode: "",
      toPincode: "",
      length: "",
      breadth: "",
      height: "",
      actualWeight: "",
      serviceType: "standard",
      zone: "national"
    });
    setVolumetricWeight(null);
    setChargeableWeight(null);
    setCalculation(null);
    setLoading(false);
    setShowSuccess(false);
    setSelectedServiceType("standard");
    toast({
      title: "Form reset",
      description: "All fields have been cleared.",
    });
  };

  return (
    <>
      <style>{`
        .floating-label-wrapper {
          position: relative;
          margin-bottom: 0;
        }

        .floating-label {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          color: #9CA3AF;
          background: #FFFFFF;
          padding: 0 6px;
          transition: all 0.2s ease;
          pointer-events: none;
          font-family: 'Value Serif Pro Bold', serif;
          font-weight: 400;
          z-index: 1;
          white-space: nowrap;
        }

        .floating-label-wrapper.focused .floating-label,
        .floating-label-wrapper.has-value .floating-label {
          color: #FDA11E;
          font-size: 11px;
          top: 0;
          transform: translateY(-50%);
          font-weight: 500;
          background: #FFFFFF;
        }

        .floating-input {
          width: 100%;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          font-family: 'Value Serif Pro Bold', serif;
          font-weight: 400;
          background: #FFFFFF;
          transition: all 0.2s ease;
          color: #0B2E4E;
        }

        .floating-input:hover {
          border-color: #D1D5DB;
        }

        .floating-input:focus {
          outline: none;
          border-color: #FDA11E;
          box-shadow: none;
          background: #FFFFFF;
        }

        .floating-input::placeholder {
          color: transparent;
        }

        .floating-input:read-only {
          background: #F9FAFB;
          border-color: #E5E7EB;
          cursor: default;
          color: #6B7280;
        }

        .floating-input:read-only:focus {
          border-color: #E5E7EB;
          box-shadow: none;
        }

        /* Remove spinner controls from number inputs */
        .floating-input[type="number"]::-webkit-inner-spin-button,
        .floating-input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .floating-input[type="number"] {
          -moz-appearance: textfield;
        }

        .button-17 {
          align-items: center;
          appearance: none;
          background-color: #FDA21F;
          border-radius: 24px;
          border-style: none;
          box-shadow: rgba(0, 0, 0, .2) 0 3px 5px -1px, rgba(0, 0, 0, .14) 0 6px 10px 0, rgba(0, 0, 0, .12) 0 1px 18px 0;
          box-sizing: border-box;
          color: #FFFFFF;
          cursor: pointer;
          display: inline-flex;
          fill: currentcolor;
          font-family: 'Value Serif Pro Bold', serif;
          font-size: 14px;
          font-weight: 400;
          height: 48px;
          justify-content: center;
          letter-spacing: .25px;
          line-height: normal;
          max-width: 100%;
          overflow: visible;
          padding: 2px 24px;
          position: relative;
          text-align: center;
          text-transform: none;
          transition: box-shadow 280ms cubic-bezier(.4, 0, .2, 1), opacity 15ms linear 30ms, transform 270ms cubic-bezier(0, 0, .2, 1) 0ms, background-color 280ms cubic-bezier(.4, 0, .2, 1);
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
          width: auto;
          will-change: transform, opacity;
          z-index: 0;
        }

        .button-17:hover:not(:disabled) {
          background: #FFB84D;
          color: #FFFFFF;
          box-shadow: rgba(60, 64, 67, .3) 0 2px 3px 0, rgba(60, 64, 67, .15) 0 6px 10px 4px;
        }

        .button-17:active:not(:disabled) {
          box-shadow: rgba(60, 64, 67, .3) 0 4px 4px 0, rgba(60, 64, 67, .15) 0 8px 12px 6px;
          outline: none;
        }

        .button-17:focus:not(:disabled) {
          outline: none;
          border: 2px solid #4285f4;
          box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
        }

        .button-17:not(:disabled) {
          box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
        }

        .button-17:disabled {
          box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
          opacity: 0.6;
        }

        .button-17-export {
          align-items: center;
          appearance: none;
          background-color: transparent;
          border-radius: 24px;
          border: 1.5px solid #EAEAEA;
          box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
          box-sizing: border-box;
          color: #0B2E4E;
          cursor: pointer;
          display: inline-flex;
          fill: currentcolor;
          font-family: 'Value Serif Pro Bold', serif;
          font-size: 14px;
          font-weight: 500;
          height: auto;
          justify-content: center;
          letter-spacing: .25px;
          line-height: normal;
          max-width: 100%;
          overflow: visible;
          padding: 8px 16px;
          position: relative;
          text-align: center;
          text-transform: none;
          transition: box-shadow 280ms cubic-bezier(.4, 0, .2, 1), opacity 15ms linear 30ms, transform 270ms cubic-bezier(0, 0, .2, 1) 0ms, background-color 280ms cubic-bezier(.4, 0, .2, 1), border-color 280ms cubic-bezier(.4, 0, .2, 1);
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
          width: auto;
          will-change: transform, opacity;
          z-index: 0;
        }

        .button-17-export:hover:not(:disabled) {
          background: #FDA11E;
          color: #0B2E4E;
          border-color: #FDA11E;
          box-shadow: rgba(60, 64, 67, .3) 0 2px 3px 0, rgba(60, 64, 67, .15) 0 6px 10px 4px;
        }

        .button-17-export:active:not(:disabled) {
          box-shadow: rgba(60, 64, 67, .3) 0 4px 4px 0, rgba(60, 64, 67, .15) 0 8px 12px 6px;
          outline: none;
        }

        .button-17-export:focus:not(:disabled) {
          outline: none;
          border: 2px solid #4285f4;
          box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
        }

        .button-17-export:not(:disabled) {
          box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
        }

        .button-17-export:disabled {
          box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
          opacity: 0.6;
        }

        .button-17-call {
          align-items: center;
          appearance: none;
          background-color: #FDA21F;
          border-radius: 20px;
          border-style: none;
          box-shadow: rgba(0, 0, 0, .2) 0 2px 4px -1px, rgba(0, 0, 0, .14) 0 4px 6px 0, rgba(0, 0, 0, .12) 0 1px 12px 0;
          box-sizing: border-box;
          color: #FFFFFF;
          cursor: pointer;
          display: inline-flex;
          fill: currentcolor;
          font-family: 'Value Serif Pro Bold', serif;
          font-size: 12px;
          font-weight: 500;
          height: 36px;
          justify-content: center;
          letter-spacing: .25px;
          line-height: normal;
          max-width: 100%;
          overflow: visible;
          padding: 6px 16px;
          position: relative;
          text-align: center;
          text-transform: none;
          transition: box-shadow 280ms cubic-bezier(.4, 0, .2, 1), opacity 15ms linear 30ms, transform 270ms cubic-bezier(0, 0, .2, 1) 0ms, background-color 280ms cubic-bezier(.4, 0, .2, 1);
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
          width: auto;
          will-change: transform, opacity;
          z-index: 0;
        }

        .button-17-call:hover {
          background-color: #FFFFFF;
          color: #3c4043;
          box-shadow: rgba(60, 64, 67, .3) 0 2px 3px 0, rgba(60, 64, 67, .15) 0 6px 10px 4px;
        }

        .button-17-call:active {
          box-shadow: 0 4px 4px 0 rgb(60 64 67 / 30%), 0 8px 12px 6px rgb(60 64 67 / 15%);
          outline: none;
        }

        .button-17-contact {
          align-items: center;
          appearance: none;
          background-color: #FFFFFF;
          border-radius: 20px;
          border-style: none;
          box-shadow: rgba(0, 0, 0, .2) 0 2px 4px -1px, rgba(0, 0, 0, .14) 0 4px 6px 0, rgba(0, 0, 0, .12) 0 1px 12px 0;
          box-sizing: border-box;
          color: #3c4043;
          cursor: pointer;
          display: inline-flex;
          fill: currentcolor;
          font-family: 'Value Serif Pro Bold', serif;
          font-size: 12px;
          font-weight: 500;
          height: 36px;
          justify-content: center;
          letter-spacing: .25px;
          line-height: normal;
          max-width: 100%;
          overflow: visible;
          padding: 6px 16px;
          position: relative;
          text-align: center;
          text-transform: none;
          transition: box-shadow 280ms cubic-bezier(.4, 0, .2, 1), opacity 15ms linear 30ms, transform 270ms cubic-bezier(0, 0, .2, 1) 0ms, background-color 280ms cubic-bezier(.4, 0, .2, 1);
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
          width: auto;
          will-change: transform, opacity;
          z-index: 0;
        }

        .button-17-contact:hover {
          background-color: #FDA21F;
          color: #FFFFFF;
          box-shadow: rgba(60, 64, 67, .3) 0 2px 3px 0, rgba(60, 64, 67, .15) 0 6px 10px 4px;
        }

        .button-17-contact:active {
          box-shadow: 0 4px 4px 0 rgb(60 64 67 / 30%), 0 8px 12px 6px rgb(60 64 67 / 15%);
          outline: none;
        }

        /* Hide refresh button on desktop */
        @media (min-width: 768px) {
          .refresh-button-mobile {
            display: none !important;
          }
        }

        /* Reduce service selector size on mobile */
        @media (max-width: 767px) {
          .service-selector-container {
            min-height: 32px !important;
            padding: 3px !important;
          }
          .service-selector-button {
            padding: 4px 6px !important;
          }
          .service-selector-text {
            font-size: 11px !important;
            line-height: 1.1 !important;
          }
        }

        /* Style buttons for mobile view */
        @media (max-width: 767px) {
          .refresh-button-mobile.button-17,
          .button-17[type="submit"] {
            width: auto !important;
            padding-left: 32px !important;
            padding-right: 32px !important;
            min-width: 120px;
          }

          /* Rate breakdown card - remove horizontal offset on mobile */
          .rate-breakdown-card {
            margin-left: auto !important;
            margin-right: auto !important;
          }
        }

        /* Fix rate breakdown card positioning on mobile */
        @media (max-width: 767px) {
          /* Remove form card horizontal shift on mobile */
          .form-card {
            transform: translateX(0) !important;
            x: 0 !important;
          }
          
          /* Remove horizontal slide animation from rate breakdown card on mobile */
          #rate-breakdown {
            transform: translateX(0) !important;
            x: 0 !important;
          }
          
          /* Ensure the parent flex container stacks vertically on mobile */
          .flex.gap-6 {
            flex-direction: column !important;
            align-items: center !important;
          }

          /* Reduce size and center service type header box on mobile */
          .service-type-header-box {
            width: fit-content !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 24px !important;
            padding-right: 24px !important;
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }

          .service-type-header-box span {
            font-size: 12px !important;
          }
        }
      `}</style>
      <div 
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#F8F9FB" }}
      >
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center pt-20 pb-16">
        <div className={`w-full px-4 py-12 ${calculation ? 'max-w-[1200px]' : 'max-w-[950px]'}`}>
          <div className={`flex ${calculation ? 'gap-6 items-center flex-wrap md:flex-nowrap' : 'justify-center'}`}>
            {/* Calculate Shipping Rate Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                x: calculation && !isMobile ? "-15%" : 0
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={`bg-white rounded-2xl p-6 overflow-hidden form-card ${calculation ? 'w-full md:w-[55%]' : 'w-full max-w-[950px]'}`}
              style={{
                boxShadow: "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px",
              }}
            >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-6 rounded-t-2xl mb-6"
            style={{
              background: "#FFFFFF",
              marginLeft: "-24px",
              marginRight: "-24px",
              marginTop: "-24px",
              paddingTop: "20px",
              paddingBottom: "24px",
            }}
          >
            <h1 
              className="text-2xl font-semibold flex-1"
              style={{ 
                fontFamily: "'Value Serif Pro Bold', serif",
                fontWeight: 600,
                color: "#000000"
              }}
            >
              Calculate Shipping Price:
            </h1>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 flex-shrink-0 refresh-button-header hidden md:block"
              style={{
                color: "#4a4a4a",
              }}
              title="Refresh form"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleCalculate} className="mt-8 space-y-4">
            {/* From/To Pincode Row */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <div className={`floating-label-wrapper ${focusedField === "fromPincode" ? "focused" : ""} ${formData.fromPincode ? "has-value" : ""}`}>
                <label className="floating-label">From Pincode</label>
                <Input
                  id="fromPincode"
                  type="text"
                  placeholder="From Pincode"
                  value={formData.fromPincode}
                  onChange={(e) => handleInputChange("fromPincode")(e.target.value)}
                  maxLength={6}
                  required
                  className="floating-input"
                  onFocus={() => setFocusedField("fromPincode")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              <div className={`floating-label-wrapper ${focusedField === "toPincode" ? "focused" : ""} ${formData.toPincode ? "has-value" : ""}`}>
                <label className="floating-label">To Pincode</label>
                <Input
                  id="toPincode"
                  type="text"
                  placeholder="To Pincode"
                  value={formData.toPincode}
                  onChange={(e) => handleInputChange("toPincode")(e.target.value)}
                  maxLength={6}
                  required
                  className="floating-input"
                  onFocus={() => setFocusedField("toPincode")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            {/* Dimensions Row: Length, Breadth, Height */}
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
              <div className={`floating-label-wrapper ${focusedField === "length" ? "focused" : ""} ${formData.length ? "has-value" : ""}`}>
                <label className="floating-label"><span className="md:hidden">L (cm)</span><span className="hidden md:inline">Length (cm)</span></label>
                <Input
                  id="length"
                  type="number"
                  placeholder="L (cm)"
                  value={formData.length}
                  onChange={(e) => handleInputChange("length")(e.target.value)}
                  min="0"
                  step="0.1"
                  required
                  className="floating-input"
                  onFocus={() => setFocusedField("length")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              <div className={`floating-label-wrapper ${focusedField === "breadth" ? "focused" : ""} ${formData.breadth ? "has-value" : ""}`}>
                <label className="floating-label"><span className="md:hidden">B (cm)</span><span className="hidden md:inline">Breadth (cm)</span></label>
                <Input
                  id="breadth"
                  type="number"
                  placeholder="B (cm)"
                  value={formData.breadth}
                  onChange={(e) => handleInputChange("breadth")(e.target.value)}
                  min="0"
                  step="0.1"
                  required
                  className="floating-input"
                  onFocus={() => setFocusedField("breadth")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              <div className={`floating-label-wrapper ${focusedField === "height" ? "focused" : ""} ${formData.height ? "has-value" : ""}`}>
                <label className="floating-label"><span className="md:hidden">H (cm)</span><span className="hidden md:inline">Height (cm)</span></label>
                <Input
                  id="height"
                  type="number"
                  placeholder="H (cm)"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height")(e.target.value)}
                  min="0"
                  step="0.1"
                  required
                  className="floating-input"
                  onFocus={() => setFocusedField("height")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            {/* Weight Row: Actual Weight, Volumetric Weight, Chargeable Weight */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className={`floating-label-wrapper ${focusedField === "actualWeight" ? "focused" : ""} ${formData.actualWeight ? "has-value" : ""}`}>
                <label className="floating-label">Actual Weight (kg)</label>
                <Input
                  id="actualWeight"
                  type="number"
                  placeholder="Actual Weight (kg)"
                  value={formData.actualWeight}
                  onChange={(e) => handleInputChange("actualWeight")(e.target.value)}
                  min="0"
                  step="0.1"
                  required
                  className="floating-input"
                  onFocus={() => setFocusedField("actualWeight")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              <div className={`floating-label-wrapper ${volumetricWeight !== null ? "has-value" : ""}`}>
                <label className="floating-label"><span className="md:hidden">Vol. Weight (kg)</span><span className="hidden md:inline">Volumetric Weight (kg)</span></label>
                <Input
                  type="text"
                  value={volumetricWeight !== null ? volumetricWeight.toFixed(2) : ""}
                  className="floating-input"
                  readOnly
                  placeholder="Vol. Weight (kg)"
                />
              </div>
              <div className={`floating-label-wrapper ${chargeableWeight !== null ? "has-value" : ""} col-span-2 md:col-span-1`}>
                <label className="floating-label">Chargeable Weight (kg)</label>
                <Input
                  type="text"
                  value={chargeableWeight !== null ? chargeableWeight.toFixed(2) : ""}
                  className="floating-input"
                  readOnly
                  placeholder="Chargeable Weight (kg)"
                />
              </div>
            </div>

            {/* Service Type Selector */}
            <div 
              className="relative flex mb-4 p-1 rounded-full service-selector-container"
              style={{ 
                backgroundColor: "#E5E7EB",
                minHeight: "48px",
              }}
            >
              {(() => {
                const filteredServices = Object.entries(ratesData.serviceTypes).filter(([key]) => key !== "express");
                
                return filteredServices.map(([key, service], index) => {
                  const isSelected = formData.serviceType === key;
                  
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleInputChange("serviceType")(key)}
                      className="flex-1 relative z-10 py-2 px-4 rounded-full transition-all duration-200 service-selector-button"
                      style={{
                        fontFamily: "'Value Serif Pro Bold', serif",
                      }}
                    >
                      <span className="flex items-center justify-center">
                        <span
                          className="service-selector-text"
                          style={{
                            fontSize: "16px",
                            fontWeight: isSelected ? "600" : "400",
                            color: isSelected ? "#FFFFFF" : "#6B7280",
                            lineHeight: "1.3",
                          }}
                        >
                          {key === "standard" ? "STANDARD SERVICE" : "PRIORITY SERVICE"}
                        </span>
                      </span>
                    </button>
                  );
                });
              })()}
              {(() => {
                const filteredServices = Object.entries(ratesData.serviceTypes).filter(([k]) => k !== "express");
                const selectedIndex = filteredServices.findIndex(([key]) => key === formData.serviceType);
                const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
                const optionWidth = 100 / filteredServices.length;
                
                return (
                  <motion.div
                    layoutId="serviceSelectorForm"
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      backgroundColor: "#0B2E4E",
                      boxShadow: "0px 2px 8px rgba(11, 46, 78, 0.2)",
                      zIndex: 1,
                    }}
                    initial={{
                      width: `${optionWidth}%`,
                      left: `${safeIndex * optionWidth}%`,
                    }}
                    animate={{
                      width: `${optionWidth}%`,
                      left: `${safeIndex * optionWidth}%`,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                );
              })()}
                  </div>

            <div className="flex justify-center md:justify-center gap-3 flex-row">
              <button
                type="button"
                onClick={handleRefresh}
                className="button-17 refresh-button-mobile"
                style={{
                  backgroundColor: "#6B7280",
                  color: "#FFFFFF",
                }}
              >
                Refresh
              </button>
              <Button
                type="submit"
                disabled={loading}
                className="button-17"
                style={{
                  backgroundColor: "#FDA21F",
                  color: "#FFFFFF",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculating...
                  </span>
                ) : (
                  "Calculate"
                )}
              </Button>
            </div>
                </form>
          </motion.div>

            {/* Rate Breakdown Card */}
            <AnimatePresence>
            {calculation && (
              <motion.div
                  id="rate-breakdown"
                  initial={{ opacity: 0, y: 20, x: isMobile ? 0 : 50 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    x: 0,
                    scale: [0.95, 1],
                    boxShadow: [
                      "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px",
                      "rgba(50, 50, 93, 0.35) 0px 15px 30px -5px, rgba(0, 0, 0, 0.4) 0px 10px 20px -8px",
                      "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px"
                    ]
                  }}
                  exit={{ opacity: 0, y: 20, x: isMobile ? 0 : 50 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: "easeInOut",
                    scale: {
                      times: [0, 0.5, 1],
                      duration: 0.6
                    },
                    boxShadow: {
                      times: [0, 0.5, 1],
                      duration: 0.6
                    }
                  }}
                  className="bg-white rounded-2xl w-full md:w-[40%] rate-breakdown-card"
                  style={{
                    boxShadow: "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px",
                    padding: "16px 20px",
                  }}
                >
              {/* Service Type Display */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-4"
              >
                  <div 
                    className="w-full py-3 px-4 rounded-full text-center service-type-header-box"
                    style={{ 
                      backgroundColor: "#0B2E4E",
                    boxShadow: "0px 2px 8px rgba(11, 46, 78, 0.2)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#FFFFFF",
                      lineHeight: "1.3",
                    }}
                  >
                    {selectedServiceType === "standard" ? "STANDARD SERVICE" : "PRIORITY SERVICE"}
                  </span>
                </div>
              </motion.div>

              {/* Rate Summary */}
              <div className="space-y-2.5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex justify-between items-center py-1.5"
                >
                  <span 
                    className="text-sm"
                    style={{ 
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontWeight: 400,
                      color: "#6B7280"
                    }}
                  >
                    Base Rate
                  </span>
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontWeight: 500,
                      color: "#0B2E4E"
                    }}
                  >
                    ₹{calculation.baseAmount.toFixed(2)}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex justify-between items-center py-1.5"
                >
                  <span 
                    className="text-sm"
                    style={{ 
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontWeight: 400,
                      color: "#6B7280"
                    }}
                  >
                    Fuel Surcharge
                  </span>
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontWeight: 500,
                      color: "#0B2E4E"
                    }}
                  >
                    ₹{calculation.fuelSurcharge.toFixed(2)}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-between items-center py-1.5"
                >
                  <span 
                    className="text-sm"
                    style={{ 
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontWeight: 400,
                      color: "#6B7280"
                    }}
                  >
                    Subtotal
                  </span>
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontWeight: 500,
                      color: "#0B2E4E"
                    }}
                  >
                    ₹{calculation.subtotal.toFixed(2)}
                  </span>
                </motion.div>

                <div className="border-t border-gray-200 my-2.5" />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex justify-between items-center py-1.5"
                >
                  <span 
                    className="text-sm"
                    style={{ 
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontWeight: 400,
                      color: "#6B7280"
                    }}
                  >
                    GST (18%)
                  </span>
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontWeight: 500,
                      color: "#0B2E4E"
                    }}
                  >
                    ₹{calculation.gst.toFixed(2)}
                  </span>
                </motion.div>

                <div className="border-t border-gray-200 my-2.5" />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-between items-center py-2"
                >
                  <span 
                    className="text-lg font-semibold"
                    style={{ 
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontWeight: 600,
                      color: "#0B2E4E"
                    }}
                  >
                    Total Amount
                  </span>
                  <span 
                    className="text-2xl font-bold"
                    style={{ 
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontWeight: 700,
                      color: "#FDA11E"
                    }}
                  >
                    ₹{calculation.total.toFixed(2)}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="mt-4 pt-3"
                >
                  <p
                    className="text-xs text-center mb-3"
                    style={{ 
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontWeight: 400,
                      color: "#9CA3AF",
                      lineHeight: "1.4"
                    }}
                  >
                    Want the best rates and faster service?
                    <p>Call us directly and let's get your shipment moving.</p>
                  </p>
                  <div className="flex justify-center">
                    <a
                      href="tel:+918453994809"
                      className="button-17-call"
                      style={{
                        textDecoration: "none",
                        gap: "6px",
                      }}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call Now
                    </a>
                  </div>
                </motion.div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </div>

      <Footer />
    </div>
    </>
  );
};

export default ShippingRates;