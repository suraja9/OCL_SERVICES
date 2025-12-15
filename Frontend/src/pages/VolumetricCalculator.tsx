import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info, Loader2, RefreshCw } from "lucide-react";
import { calculateVolumetricWeight, type VolumetricCalcResult } from "@/utils/calc";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const VolumetricCalculator = () => {
  const [dimensions, setDimensions] = useState({
    length: "",
    width: "", 
    height: "",
    actualWeight: ""
  });
  const [volumetricWeight, setVolumetricWeight] = useState<number | null>(null);
  const [result, setResult] = useState<VolumetricCalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-calculate volumetric weight when length, width, height are filled
  useEffect(() => {
    const { length, width, height } = dimensions;
    
    if (length && width && height) {
      const lengthNum = parseFloat(length);
      const widthNum = parseFloat(width);
      const heightNum = parseFloat(height);
      
      if (lengthNum > 0 && widthNum > 0 && heightNum > 0) {
        const volWeight = (lengthNum * widthNum * heightNum) / 5000;
        setVolumetricWeight(Math.round(volWeight * 100) / 100);
      } else {
        setVolumetricWeight(null);
      }
    } else {
      setVolumetricWeight(null);
    }
  }, [dimensions.length, dimensions.width, dimensions.height]);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { length, width, height, actualWeight } = dimensions;
    
    if (!length || !width || !height || !actualWeight) {
      toast({
        title: "Please fill all fields",
        description: "All dimensions and actual weight are required",
        variant: "destructive",
      });
      return;
    }

    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(actualWeight);

    if (lengthNum <= 0 || widthNum <= 0 || heightNum <= 0 || weightNum <= 0) {
      toast({
        title: "Invalid values",
        description: "All values must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Brief loading animation
    await new Promise(resolve => setTimeout(resolve, 400));

    const calcResult = calculateVolumetricWeight(lengthNum, widthNum, heightNum, weightNum);
    setResult(calcResult);
    setLoading(false);
    
    toast({
      title: "Calculation completed!",
      description: `Chargeable weight: ${calcResult.chargeableWeight} kg`,
    });
  };

  const handleInputChange = (field: keyof typeof dimensions) => (value: string) => {
    setDimensions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRefresh = () => {
    setDimensions({
      length: "",
      width: "",
      height: "",
      actualWeight: ""
    });
    setVolumetricWeight(null);
    setResult(null);
    setLoading(false);
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
          padding: 0 4px;
          transition: all 0.2s ease;
          pointer-events: none;
          font-family: 'Value Serif Pro Bold', serif;
          font-weight: 400;
          z-index: 1;
        }

        .floating-label-wrapper.focused .floating-label,
        .floating-label-wrapper.has-value .floating-label {
          color: #FDA11E;
          font-size: 11px;
          top: 0;
          transform: translateY(-50%);
          font-weight: 500;
        }

        .floating-input {
          width: 100%;
          border: 1.5px solid #EAEAEA;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          font-family: 'Value Serif Pro Bold', serif;
          font-weight: 400;
          background: #FFFFFF;
          transition: all 0.2s ease;
        }

        .floating-input:focus {
          outline: none;
          border-color: #FDA11E;
          box-shadow: 0px 0px 0px 3px rgba(253, 161, 30, 0.1);
        }

        .floating-input::placeholder {
          color: transparent;
        }

        .floating-input:read-only {
          background: #F8F9FB;
          cursor: default;
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
          border-radius: 10px;
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
          padding: 0;
          position: relative;
          text-align: center;
          text-transform: none;
          transition: box-shadow 280ms cubic-bezier(.4, 0, .2, 1), opacity 15ms linear 30ms, transform 270ms cubic-bezier(0, 0, .2, 1) 0ms, background-color 280ms cubic-bezier(.4, 0, .2, 1);
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
          width: 100%;
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

        .info-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid #0B2E4E;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #0B2E4E;
          background: transparent;
        }

        .info-icon:hover {
          background: #0B2E4E;
          color: white;
        }
      `}</style>
      <div 
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#F8F9FB" }}
      >
      <Navbar />
        
        <div className="flex-1 flex items-center justify-center pt-20 pb-16">
          <div className="w-full max-w-[900px] px-4 py-12">
            {/* Single Compact Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-white rounded-2xl p-6 md:p-8"
              style={{
                boxShadow: "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px",
              }}
            >
              {/* Header */}
              <div 
                className="flex items-start justify-between p-6 rounded-t-2xl mb-6"
                style={{
                  background: "linear-gradient(to bottom, #0B2E4E, #FFFFFF)",
                  marginLeft: "-32px",
                  marginRight: "-32px",
                  marginTop: "-32px",
                  paddingTop: "20px",
                  paddingBottom: "24px",
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center relative"
                    style={{ 
                      background: "#FFD700",
                      boxShadow: "0px 4px 12px rgba(255, 215, 0, 0.4), 0px 2px 6px rgba(0, 0, 0, 0.1)"
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg relative z-10"
                      style={{ background: "#FFD700" }}
                    >
                      <svg 
                        className="w-8 h-8" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect x="4" y="6" width="16" height="12" rx="2" fill="#0B2E4E"/>
                        <rect x="6" y="8" width="12" height="8" rx="1" fill="#FDA11E"/>
                        <line x1="12" y1="8" x2="12" y2="16" stroke="#FFFFFF" strokeWidth="1.5"/>
                        <line x1="6" y1="12" x2="18" y2="12" stroke="#FFFFFF" strokeWidth="1.5"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <h1 
                      className="text-2xl font-semibold"
                      style={{ 
                        fontFamily: "'Value Serif Pro Bold', serif",
                        fontWeight: 600,
                        color: "#000000"
                      }}
                    >
            Volumetric Weight Calculator
          </h1>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="info-icon">
                            <Info className="w-3.5 h-3.5" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="max-w-[280px] p-4"
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #EDEDED",
                            borderRadius: "10px",
                            boxShadow: "0px 4px 16px rgba(0,0,0,0.08)",
                            fontSize: "13px",
                            lineHeight: "1.5",
                            color: "#0B2E4E",
                            fontFamily: "'Value Serif Pro Bold', serif",
                          }}
                        >
                          <div className="space-y-2">
                    <div>
                              <strong style={{ fontFamily: "'Value Serif Pro Bold', serif" }}>
                                Volumetric Weight Formula:
                              </strong>
                              <div className="mt-1" style={{ color: "#FDA11E", fontFamily: "'Value Serif Pro Bold', monospace" }}>
                                (Length × Width × Height) ÷ 5000
                              </div>
                            </div>
                            <div className="text-xs" style={{ color: "#666" }}>
                              The higher value between actual weight and volumetric weight is used to calculate shipping charges.
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-white/50"
                  style={{
                    color: "#FFFFFF",
                  }}
                  title="Refresh form"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCalculate} className="space-y-5">
                {/* First Row: Length, Width, Height, Volumetric Weight (display) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`floating-label-wrapper ${focusedField === "length" ? "focused" : ""} ${dimensions.length ? "has-value" : ""}`}>
                    <label className="floating-label">Length (cm)</label>
                      <Input
                        id="length"
                        type="number"
                      placeholder="Length (cm)"
                        value={dimensions.length}
                      onChange={(e) => handleInputChange("length")(e.target.value)}
                      className="floating-input"
                        min="0"
                        step="0.1"
                        required
                      onFocus={() => setFocusedField("length")}
                      onBlur={() => setFocusedField(null)}
                      />
                    </div>
                  <div className={`floating-label-wrapper ${focusedField === "width" ? "focused" : ""} ${dimensions.width ? "has-value" : ""}`}>
                    <label className="floating-label">Width (cm)</label>
                      <Input
                        id="width"
                        type="number"
                      placeholder="Width (cm)"
                        value={dimensions.width}
                      onChange={(e) => handleInputChange("width")(e.target.value)}
                      className="floating-input"
                        min="0"
                        step="0.1"
                        required
                      onFocus={() => setFocusedField("width")}
                      onBlur={() => setFocusedField(null)}
                      />
                    </div>
                  <div className={`floating-label-wrapper ${focusedField === "height" ? "focused" : ""} ${dimensions.height ? "has-value" : ""}`}>
                    <label className="floating-label">Height (cm)</label>
                      <Input
                        id="height"
                        type="number"
                      placeholder="Height (cm)"
                        value={dimensions.height}
                      onChange={(e) => handleInputChange("height")(e.target.value)}
                      className="floating-input"
                        min="0"
                        step="0.1"
                        required
                      onFocus={() => setFocusedField("height")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                  <div className={`floating-label-wrapper ${volumetricWeight !== null ? "has-value" : ""}`}>
                    <label className="floating-label">Volumetric Weight (kg)</label>
                    <Input
                      type="text"
                      value={volumetricWeight !== null ? volumetricWeight.toFixed(2) : ""}
                      className="floating-input"
                      readOnly
                      placeholder="Volumetric Weight (kg)"
                      />
                    </div>
                  </div>
                  
                {/* Second Row: Actual Weight + Calculate Button */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`floating-label-wrapper md:col-span-2 ${focusedField === "actualWeight" ? "focused" : ""} ${dimensions.actualWeight ? "has-value" : ""}`}>
                    <label className="floating-label">Actual Weight (kg)</label>
                    <Input
                      id="actualWeight"
                      type="number"
                      placeholder="Actual Weight (kg)"
                      value={dimensions.actualWeight}
                      onChange={(e) => handleInputChange("actualWeight")(e.target.value)}
                      className="floating-input"
                      min="0"
                      step="0.1"
                      required
                      onFocus={() => setFocusedField("actualWeight")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                  <div className="flex items-center">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="button-17 w-full"
                      style={{
                        backgroundColor: "#FDA21F",
                        color: "#FFFFFF",
                        height: "48px",
                        minHeight: "48px",
                        maxHeight: "48px",
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
                </div>

                {/* Output Box */}
                <AnimatePresence>
                  {result && (
          <motion.div
                      id="calculation-results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="mt-6 p-5 rounded-xl"
                    style={{
                        background: "linear-gradient(135deg, #FFF6E5 0%, #FFF9F0 100%)",
                        boxShadow: "0px 4px 12px rgba(253, 161, 30, 0.15)",
                        border: "1px solid rgba(253, 161, 30, 0.1)",
                    }}
                  >
                      <div className="text-center">
                      <div
                          className="text-3xl md:text-4xl font-bold mb-2"
                        style={{
                            fontFamily: "'Value Serif Pro Bold', serif",
                            fontWeight: 700,
                            color: "#FDA11E"
                          }}
                        >
                          {result.chargeableWeight} kg
                        </div>
                        <div
                          className="text-base font-semibold mb-3"
                          style={{
                            fontFamily: "'Value Serif Pro Bold', serif",
                            fontWeight: 600,
                            color: "#0B2E4E"
                          }}
                        >
                          Chargeable Weight
                        </div>
                        <div
                          className="text-sm"
                          style={{
                            fontFamily: "'Value Serif Pro Bold', serif",
                            fontWeight: 400,
                            color: "#6B7280",
                            lineHeight: "1.5"
                          }}
                        >
                          Chargeable weight is determined by whichever is higher — actual or volumetric weight.
                      </div>
                      </div>
              </motion.div>
            )}
                </AnimatePresence>
              </form>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
    </>
  );
};

export default VolumetricCalculator;
