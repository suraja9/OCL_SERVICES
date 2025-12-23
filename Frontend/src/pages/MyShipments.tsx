import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Package, Clock, CheckCircle, XCircle, Truck, Calendar, MapPin, ShoppingCart, ClipboardCheck, Home, Navigation } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Shipment {
  id: string;
  trackingNumber: string;
  recipientName: string;
  destination: string;
  status: "in-transit" | "delivered" | "pending" | "cancelled";
  shipmentDate: string;
  estimatedDelivery: string;
  service: string;
  weight: string;
  amount: number;
}

const MyShipments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const viewMode = searchParams.get('view') || 'cards';
  const progressOnly = viewMode === 'progress';
  const [activeTab, setActiveTab] = useState("all");
  const [currentStep, setCurrentStep] = useState(0);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [movementHistory, setMovementHistory] = useState<any[]>([]);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [isLoadingMovementHistory, setIsLoadingMovementHistory] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [selectedStepKey, setSelectedStepKey] = useState<string | null>(null);
  const trackingNumber = searchParams.get('number');
  const trackingType = searchParams.get('type');
  const isUndelivered = trackingData?.status === 'undelivered';
  
  // Handle search button click
  const handleSearch = () => {
    if (searchTerm.trim()) {
      // Update URL with tracking number and set view to progress
      const newParams = new URLSearchParams();
      newParams.set('view', 'progress');
      newParams.set('type', 'awb');
      newParams.set('number', searchTerm.trim());
      setSearchParams(newParams);
      // Reset selected step when searching new number
      setSelectedStepKey(null);
    }
  };
  
  // Handle Enter key in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Updated tracker steps to match the 5 required steps
  const trackerSteps = [
    { key: 'booked', title: 'Booked', icon: ShoppingCart },
    { key: 'received_at_ocl', title: 'Received at OCL', icon: Home },
    { key: 'in_transit', title: 'In Transit', icon: Truck },
    { key: 'out_for_delivery', title: 'Out for Delivery', icon: Navigation },
    { key: 'delivered', title: 'Delivered', icon: CheckCircle }
  ] as const;

  // Map API step key to step index
  const getStepIndexFromKey = (stepKey: string): number => {
    const index = trackerSteps.findIndex(step => step.key === stepKey);
    return index >= 0 ? index : 0;
  };

  // Sync searchTerm with trackingNumber from URL
  useEffect(() => {
    if (progressOnly && trackingNumber) {
      setSearchTerm(trackingNumber);
    }
  }, [progressOnly, trackingNumber]);

  // Fetch tracking data when in progress mode
  useEffect(() => {
    if (progressOnly && trackingNumber) {
      setIsLoadingTracking(true);
      setTrackingError(null);
      
      const fetchTrackingData = async () => {
        try {
          const endpoint = `/api/tracking/${trackingNumber}`;
          
          const response = await fetch(endpoint);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.trackingSummary) {
              setTrackingData(data.data);
              const stepKey = data.data.trackingSummary.metadata?.currentStepKey || 'booked';
              const stepIndex = getStepIndexFromKey(stepKey);
              setCurrentStep(stepIndex);
              // Automatically set the current step as active to show step details
              setSelectedStepKey(stepKey);
            } else {
              setTrackingError('Shipment not found. Please check the tracking number.');
              setTrackingData(null);
              setSelectedStepKey(null);
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            setTrackingError(errorData.error || 'Failed to fetch tracking information.');
            setTrackingData(null);
            setSelectedStepKey(null);
          }
        } catch (error) {
          console.error('Tracking error:', error);
          setTrackingError('An error occurred while tracking your shipment.');
          setTrackingData(null);
          setSelectedStepKey(null);
        } finally {
          setIsLoadingTracking(false);
        }
      };
      
      fetchTrackingData();
    }
  }, [progressOnly, trackingNumber, trackingType]);

  // Fetch movement history separately from dedicated endpoint
  useEffect(() => {
    if (progressOnly && trackingNumber) {
      setIsLoadingMovementHistory(true);
      
      const fetchMovementHistory = async () => {
        try {
          const endpoint = `/api/tracking/${trackingNumber}/movement-history`;
          
          const response = await fetch(endpoint);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.movementHistory) {
              setMovementHistory(data.data.movementHistory);
            } else {
              setMovementHistory([]);
            }
          } else {
            setMovementHistory([]);
          }
        } catch (error) {
          console.error('Movement history error:', error);
          setMovementHistory([]);
        } finally {
          setIsLoadingMovementHistory(false);
        }
      };
      
      fetchMovementHistory();
    } else {
      setMovementHistory([]);
    }
  }, [progressOnly, trackingNumber]);

  // No auto-animation - use real data from API

  // No shipments list needed for progress-only view
  const shipments: Shipment[] = [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in-transit":
        return <Truck className="h-4 w-4 text-blue-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-transit":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusAccent = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-[#28A745]";
      case "in-transit":
        return "bg-[#007BFF]";
      case "pending":
        return "bg-[#FFC107]";
      case "cancelled":
        return "bg-[#DC3545]";
      default:
        return "bg-gray-300";
    }
  };

  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      const matchesSearch = shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           shipment.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           shipment.destination.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeTab === "all") return matchesSearch;
      return matchesSearch && shipment.status === activeTab;
    });
  }, [shipments, searchTerm, activeTab]);

  const cardStagger = {
    hidden: { opacity: 0, y: 18 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.06 * i } })
  };

  const detailLine = {
    hidden: { opacity: 0, y: 8 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.1 * i } })
  };

  const totalSteps = trackerSteps.length;
  const barLeft = `${(0.5 / totalSteps) * 100}%`;
  const barWidth = `${((totalSteps - 1) / totalSteps) * 100}%`;
  const fillWidth = `${(currentStep / (totalSteps - 1)) * 100}%`;

  // Check if we're on a blank tracking page (no tracking number)
  // Show only search bar when there's no tracking number to display
  const isBlankTrackingPage = !trackingNumber;

  return (
    <div className="min-h-screen relative" style={{ background: "linear-gradient(135deg, #FFF9F3 0%, #F3F6FB 100%)" }}>
      <Navbar />
      {/* ultra subtle texture overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

      <motion.div className="relative container mx-auto px-4 pt-24 pb-16" initial={{ opacity: 0, y: 16, filter: 'blur(3px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.6 }}>
        {/* Header - Only show if not blank tracking page */}
        {!isBlankTrackingPage && (
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 18, letterSpacing: "0.02em" }}
          animate={{ opacity: 1, y: 0, letterSpacing: "0.06em" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h1 className="mt-8 text-4xl md:text-5xl font-bold mb-3 tracking-wide bg-gradient-to-r from-[#002E33] to-[#034A53] bg-clip-text text-transparent">
          
          </h1>
          
        </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div
          className={isBlankTrackingPage ? "flex flex-col items-center justify-center pt-16 pb-16" : "mb-8"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {isBlankTrackingPage && (
            <div className="text-center mb-8 w-full max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-wide bg-gradient-to-r from-[#002E33] to-[#034A53] bg-clip-text text-transparent">
                Track Your Shipment
              </h2>
              <p className="text-base text-[#3d4a5a]/70 max-w-xl mx-auto">
                Enter your consignment number below to track your shipment status in real-time
              </p>
            </div>
          )}
            <div className={`flex flex-col md:flex-row gap-4 ${isBlankTrackingPage ? 'w-full max-w-2xl' : 'mb-6'}`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#002E33]/60 z-10 pointer-events-none" />
              <Input
                placeholder={isBlankTrackingPage || progressOnly ? "Enter consignment number..." : "Search by tracking number, recipient, or destination..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-11 pr-10 rounded-[14px] border-none bg-white/60 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.05)] focus-visible:ring-2 focus-visible:ring-[#FDBD4E]"
                style={{ boxShadow: "rgba(0, 0, 0, 0.16) 0px 8px 16px, rgba(0, 0, 0, 0.20) 0px 4px 4px" }}
              />
              {searchTerm && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 h-6 w-6 rounded-full grid place-items-center text-[#5b6a76] hover:text-[#002E33] hover:bg-black/5"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSearch}
              className="inline-flex items-center justify-center rounded-[14px] px-6 py-2.5 text-white shadow-md bg-gradient-to-r from-[#FE9F16] to-[#FDBD4E] hover:brightness-110 focus:outline-none"
              style={{ boxShadow: "rgba(0, 0, 0, 0.16) 0px 8px 16px, rgba(0, 0, 0, 0.20) 0px 4px 4px" }}
            >
              <motion.span whileTap={{ scale: 0.95 }} className="inline-flex items-center">
                <Search className="h-4 w-4 mr-2" /> Search
              </motion.span>
            </motion.button>
          </div>

          {/* Shipment Tracker - Only show for progress-only view (AWB/Ref) */}
          {progressOnly && (
          <div className="mb-8" style={{ background: '#FFF9F3', borderRadius: 12, boxShadow: 'rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.05) 0px 8px 32px', padding: '14px 25px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div className="mb-2 md:mb-2 mb-6">
              <div className="text-[14px] font-semibold" style={{ color: '#1B1B1B' }}>Consignment Delivery Status :</div>
              <div className="text-[11px]" style={{ color: '#333333' }}>
                Consignment No. : {trackingData?.trackingSummary?.metadata?.consignmentNumber || trackingNumber || 'N/A'}
              </div>
            </div>
            {isLoadingTracking && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FD9C13]"></div>
                <p className="mt-4 text-sm text-[#6b7280]">Loading tracking information...</p>
              </div>
            )}
            
            {trackingError && (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <p className="text-sm text-red-600 font-medium">{trackingError}</p>
                <p className="text-xs text-[#6b7280] mt-2">Please check the tracking number and try again.</p>
              </div>
            )}
            
            {!isLoadingTracking && !trackingError && trackingData?.trackingSummary && (
            <div className="flex items-start justify-between relative md:mt-0 mt-8 md:pt-[14px] pt-8" style={{ gap: 32, paddingBottom: 14 }}>
              {(() => {
                const summary = trackingData.trackingSummary;
                const currentStepKey = summary.metadata?.currentStepKey || 'booked';
                const currentStepIndex = getStepIndexFromKey(currentStepKey);
                // Calculate progress fill: from start (0%) to center of current step
                // If currentStepIndex is 0, fill should be 0%
                // If currentStepIndex is last step, fill should be 100%
                const progressFill = currentStepIndex === 0 
                  ? '0%' 
                  : `${(currentStepIndex / (trackerSteps.length - 1)) * 100}%`;
                
                return (
                  <>
                    {/* Single continuous progress bar from center of first to center of last icon */}
                    <div className="absolute md:top-[88px] top-[136px]" style={{ left: barLeft, width: barWidth }}>
                      <div className="h-2 w-full rounded-md" style={{ background: '#E0E0E0', boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.06)' }} />
                      <div className="h-2 rounded-md transition-all duration-300" style={{ background: '#FDA11E', position: 'relative', top: -8, width: progressFill, maxWidth: '100%' }} />
                    </div>

                    {/* Overlay: ticks aligned on the same baseline as the progress bar */}
                    <div className="absolute md:top-[92px] top-[140px]" style={{ left: barLeft, width: barWidth, height: 0, pointerEvents: 'none' }}>
                      {trackerSteps.map((step, index) => {
                        const stepDetail = summary.steps?.find((s: any) => s.key === step.key);
                        const isDone = stepDetail?.completed || index <= currentStepIndex;
                        const activeStepKey = selectedStepKey ?? currentStepKey;
                        const isActive = step.key === activeStepKey;
                        return (
                          <div key={step.key} className="absolute" style={{ left: `${(index / (totalSteps - 1)) * 100}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                            {isActive ? (
                              <div className="h-5 w-5 rounded-md border-2 flex items-center justify-center" style={{ 
                                background: 'linear-gradient(135deg, #FFF9F3 0%, #FFE8CC 100%)',
                                borderColor: '#FF8C00',
                                boxShadow: '0 2px 4px rgba(255, 140, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                              }}>
                                <Truck className="h-3.5 w-3.5" style={{ color: '#FF6B00', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }} strokeWidth={2.8} />
                              </div>
                            ) : (
                              <div className={`h-3.5 w-3.5 rounded-[3px] border ${isDone ? 'bg-[#FDA11E] border-[#FDA11E]' : 'bg-white border-[#D6D6D6]'}`}>
                                {isDone ? (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="absolute top-0.5 left-0.5">
                                    <path d="M20 6L9 17l-5-5"/>
                                  </svg>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {trackerSteps.map((step, index) => {
                      const Icon = step.icon;
                      const stepDetail = summary.steps?.find((s: any) => s.key === step.key);
                      const isDone = stepDetail?.completed || index <= currentStepIndex;
                      const activeStepKey = selectedStepKey ?? currentStepKey;
                      const isActive = step.key === activeStepKey;
                      // Only allow clicking steps that are at or before the current step
                      // Steps after current step should not be clickable
                      const canSelect = index <= currentStepIndex && (stepDetail?.timestamp || stepDetail?.fields?.length > 0);

                      const stepLabel =
                        isUndelivered && step.key === 'delivered'
                          ? 'Not delivered'
                          : (stepDetail?.title || step.title);
                      
                      return (
                        <div key={step.key} className="flex-1 flex flex-col items-center text-center relative">
                          {/* Icon and Text grouped together with slight space */}
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              disabled={!canSelect}
                              onClick={() => {
                                if (!canSelect) return;
                                // Toggle: if clicking the same step, deselect it
                                if (selectedStepKey === step.key) {
                                  setSelectedStepKey(null);
                                } else {
                                  setSelectedStepKey(step.key);
                                }
                              }}
                              className={`relative z-10 grid place-items-center h-8 w-8 rounded-full border-2 transition-all ${
                                !canSelect ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-110'
                              }`}
                              style={{
                                background: isActive
                                  ? '#FDA11E'
                                  : '#FFFFFF',
                                borderColor: isActive
                                  ? '#FDA11E'
                                  : (isDone ? '#FDA11E' : '#D6D6D6'),
                                color: isActive
                                  ? '#FFFFFF'
                                  : (isDone ? '#FDA11E' : '#BDBDBD')
                              }}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </button>
                            <div className="mt-0.5 text-[11px] font-medium" style={{ 
                              color: isActive 
                                ? '#FDA11E' 
                                : (isDone ? '#1B1B1B' : '#333333'),
                              fontWeight: isActive ? 700 : 500
                            }}>{stepLabel}</div>
                          </div>
                          
                          {/* Clean gap between title and progress bar */}
                          <div className="md:h-6 h-10" />
                          {/* gap where the bar and ticks layer sits */}
                          <div className="h-0" />
                          {/* Clean gap between bar and date */}
                          <div className="h-6" />
                          
                          {/* Date */}
                          <div className="text-[9px]" style={{ color: '#333333' }}>
                            {stepDetail?.timestamp 
                              ? (() => {
                                  const date = new Date(stepDetail.timestamp);
                                  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
                                })()
                              : stepDetail?.completed 
                                ? 'Pending update'
                                : 'Pending'
                            }
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
            )}
          </div>
          )}

          {/* Step Details Card - Show when a step is clicked */}
          {progressOnly && trackingData?.trackingSummary && selectedStepKey && (() => {
            const activeStepDetail = trackingData.trackingSummary.steps?.find((s: any) => s.key === selectedStepKey);
            const activeStep = trackerSteps.find(s => s.key === selectedStepKey);
            
            if (!activeStepDetail) return null;

            const activeStepTitle =
              isUndelivered && selectedStepKey === 'delivered'
                ? 'Not delivered'
                : (activeStep?.title || 'Step Details');
            
            const formatFieldValue = (field: any) => {
              if (!field.value) return 'Not available';
              if (field.format === 'datetime') {
                const date = new Date(field.value);
                return date.toLocaleDateString(undefined, { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
              }
              return field.value;
            };
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[16px] p-5 md:p-6 border border-black/5 mb-8"
                style={{ 
                  background: '#FFF9F3', 
                  boxShadow: 'rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.05) 0px 8px 32px' 
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = activeStep?.icon || Package;
                      return <Icon className="h-5 w-5" style={{ color: '#FDA11E' }} />;
                    })()}
                    <h3 className="text-lg font-semibold" style={{ color: '#1B1B1B' }}>
                      {activeStepTitle}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedStepKey(null)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                
                {activeStepDetail.description && (
                  <p className="text-sm mb-4" style={{ color: '#333333' }}>
                    {activeStepDetail.description}
                  </p>
                )}
                
                {activeStepDetail.fields && activeStepDetail.fields.length > 0 ? (() => {
                  // Filter out fields based on step
                  const filteredFields = activeStepDetail.fields.filter((field: any) => {
                    const labelLower = (field.label || '').toLowerCase();
                    
                    // Booked state: Remove Route, Service Type, Package Count, and Weight (already in Shipment Details)
                    if (selectedStepKey === 'booked') {
                      if (labelLower.includes('route') || 
                          labelLower.includes('service type') || 
                          labelLower.includes('package count') || 
                          labelLower.includes('weight')) {
                        return false;
                      }
                    }
                    
                    // Received state: Remove courier assigned
                    if (selectedStepKey === 'received_at_ocl') {
                      if (labelLower.includes('courier') && labelLower.includes('assign')) {
                        return false;
                      }
                    }
                    
                    // In-transit state: Remove movement updates
                    if (selectedStepKey === 'in_transit') {
                      if (labelLower.includes('movement') || labelLower.includes('update')) {
                        return false;
                      }
                    }
                    
                    // Out for delivery: Remove agent phone and payment-related fields
                    if (selectedStepKey === 'out_for_delivery') {
                      if ((labelLower.includes('agent') && labelLower.includes('phone')) ||
                          labelLower.includes('payment') || 
                          labelLower.includes('collect')) {
                        return false;
                      }
                    }
                    
                    // Remove "Payment Collected" from delivered step
                    if (selectedStepKey === 'delivered' && (labelLower.includes('payment') || labelLower.includes('collected'))) {
                      return false;
                    }
                    
                    return true;
                  });
                  
                  return filteredFields.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {filteredFields.map((field: any, index: number) => (
                        <div key={index}>
                          <div className="text-xs text-gray-600 mb-0.5 uppercase tracking-wide">
                            {field.label}
                          </div>
                          <div className="text-sm font-medium" style={{ color: '#1B1B1B' }}>
                            {formatFieldValue(field)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">
                      No additional details available for this step yet.
                    </p>
                  );
                })() : (
                  <p className="text-sm text-gray-500 mb-4">
                    No additional details available for this step yet.
                  </p>
                )}

                {/* Separator */}
                <div className="border-t border-gray-200/50 my-4"></div>

                {/* Shipment Details Section */}
                <div className="text-sm font-semibold mb-3" style={{ color: '#1B1B1B' }}>Shipment Details</div>
                {/* Route, Service Type, Package Count in 3 columns on desktop, Route full width + 2 columns on mobile */}
                {trackingData.trackingSummary.metadata.routeSummary && (
                  <div className="text-left mb-3 md:hidden">
                    <div className="text-xs text-gray-600 mb-0.5">Route</div>
                    <div className="text-sm font-medium" style={{ color: '#1B1B1B' }}>{trackingData.trackingSummary.metadata.routeSummary}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  {trackingData.trackingSummary.metadata.routeSummary && (
                    <div className="text-left hidden md:block">
                      <div className="text-xs text-gray-600 mb-0.5">Route</div>
                      <div className="text-sm font-medium" style={{ color: '#1B1B1B' }}>{trackingData.trackingSummary.metadata.routeSummary}</div>
                    </div>
                  )}
                  {trackingData.trackingSummary.metadata.serviceType && (
                    <div className="text-left">
                      <div className="text-xs text-gray-600 mb-0.5">Service Type</div>
                      <div className="text-sm font-medium" style={{ color: '#1B1B1B' }}>{trackingData.trackingSummary.metadata.serviceType}</div>
                    </div>
                  )}
                  {trackingData.trackingSummary.metadata.packageCount && (
                    <div className="text-left">
                      <div className="text-xs text-gray-600 mb-0.5">Package Count</div>
                      <div className="text-sm font-medium" style={{ color: '#1B1B1B' }}>{trackingData.trackingSummary.metadata.packageCount}</div>
                    </div>
                  )}
                </div>
                {/* Other details in 2 column layout */}
                {trackingData.trackingSummary.metadata.estimatedDelivery && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-600 mb-0.5">Estimated Delivery</div>
                      <div className="text-sm font-medium" style={{ color: '#1B1B1B' }}>
                        {new Date(trackingData.trackingSummary.metadata.estimatedDelivery).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* Movement History Section */}
          {progressOnly && movementHistory && movementHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[16px] p-5 md:p-6 border border-black/5 mb-8"
              style={{ 
                background: '#FFF9F3', 
                boxShadow: 'rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.05) 0px 8px 32px' 
              }}
            >
              <div className="text-sm font-semibold mb-4" style={{ color: '#1B1B1B' }}>
                Movement History
              </div>
              {isLoadingMovementHistory ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#FD9C13]"></div>
                  <p className="mt-2 text-xs text-[#6b7280]">Loading movement history...</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {movementHistory.map((event: any, index: number) => {
                    const formatDateLabel = (timestamp: string | null) => {
                      if (!timestamp) return "Pending";
                      const date = new Date(timestamp);
                      return `${date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} • ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
                    };

                    return (
                      <div key={`${event.status}-${event.timestamp || index}`} className="flex flex-col">
                        <div className="flex items-start gap-2">
                          <span
                            className="h-2 w-2 rounded-full mt-1 flex-shrink-0"
                            style={{ background: '#FDA11E' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold" style={{ color: '#1B1B1B' }}>
                              {event.label}
                            </p>
                            {event.location && (
                              <p className="text-[10px]" style={{ color: '#6b7280' }}>{event.location}</p>
                            )}
                            <p className="text-[10px]" style={{ color: '#6b7280' }}>
                              {event.timestamp ? formatDateLabel(event.timestamp) : "Pending"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {!progressOnly && !isBlankTrackingPage && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="relative grid w-full grid-cols-5 bg-transparent">
              {(["all","delivered","in-transit","pending","cancelled"] as const).map((tab) => (
                <TabsTrigger key={tab} value={tab} className="group relative rounded-md px-4 py-2 text-[#1a2b34] data-[state=active]:text-[#FFB320] transition-transform data-[state=active]:font-semibold hover:scale-[1.03]">
                  <span className="capitalize">{tab === "in-transit" ? "In Transit" : tab}</span>
                  <span className="pointer-events-none absolute left-0 -bottom-1 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-[#FE9F16] to-[#FDBD4E] transition-transform duration-300 group-hover:scale-x-100" />
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="relative h-1 mt-1">
              <motion.div
                key={activeTab}
                layoutId="tab-underline"
                className="h-1 rounded-full bg-gradient-to-r from-[#FE9F16] to-[#FDBD4E]"
              />
            </div>

            <TabsContent value={activeTab} className="mt-6">
              {filteredShipments.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <img src={"/assets/pickup-truck-icon.jpg"} alt="No shipments" className="mx-auto h-24 w-24 object-contain opacity-90 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-[#002E33]">No shipments found. Try changing filters.</h3>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="grid gap-6">
                    {filteredShipments.map((shipment, index) => (
                      <motion.div key={shipment.id} custom={index} variants={cardStagger} initial="hidden" animate="show">
                        <Card className="relative rounded-[18px] overflow-hidden border border-black/5 bg-gradient-to-br from-white to-[#FDFDFD] transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01]" style={{ boxShadow: "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px" }}>
                          <div className={`absolute left-0 top-0 h-full w-1.5 ${getStatusAccent(shipment.status)}`} />
                          <CardHeader className="pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <CardTitle className="text-xl font-bold text-[#002E33] flex items-center gap-2">
                                  {getStatusIcon(shipment.status)}
                                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                                    {shipment.trackingNumber}
                                  </motion.span>
                                </CardTitle>
                                <p className="text-[#3d4a5a]/70">To: {shipment.recipientName}</p>
                              </div>
                              <Badge className={`${getStatusColor(shipment.status)} capitalize rounded-[3px] h-[29px] leading-[29px] px-3 border pointer-events-none select-none shadow-[rgba(255,255,255,.6)_0_1px_0_inset]`}> 
                                {shipment.status.replace('-', ' ')}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                              <motion.div className="flex items-center gap-3" custom={0} variants={detailLine} initial="hidden" animate="show">
                                <MapPin className="h-5 w-5 text-[#034A53]/70" />
                                <div>
                                  <p className="text-sm text-[#3d4a5a]/70">Destination</p>
                                  <p className="font-medium text-[#002E33]">{shipment.destination}</p>
                                </div>
                              </motion.div>
                              <motion.div className="flex items-center gap-3" custom={1} variants={detailLine} initial="hidden" animate="show">
                                <Calendar className="h-5 w-5 text-[#034A53]/70" />
                                <div>
                                  <p className="text-sm text-[#3d4a5a]/70">Shipped Date</p>
                                  <p className="font-medium text-[#002E33]">{new Date(shipment.shipmentDate).toLocaleDateString()}</p>
                                </div>
                              </motion.div>
                              <motion.div className="flex items-center gap-3" custom={2} variants={detailLine} initial="hidden" animate="show">
                                <Clock className="h-5 w-5 text-[#034A53]/70" />
                                <div>
                                  <p className="text-sm text-[#3d4a5a]/70">Est. Delivery</p>
                                  <p className="font-medium text-[#002E33]">{new Date(shipment.estimatedDelivery).toLocaleDateString()}</p>
                                </div>
                              </motion.div>
                              <motion.div className="flex items-center gap-3" custom={3} variants={detailLine} initial="hidden" animate="show">
                                <Package className="h-5 w-5 text-[#034A53]/70" />
                                <div>
                                  <p className="text-sm text-[#3d4a5a]/70">Service</p>
                                  <p className="font-medium text-[#002E33]">{shipment.service}</p>
                                </div>
                              </motion.div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between mt-6 pt-4 border-t border-black/5">
                              <div className="flex items-center gap-6 mb-4 md:mb-0">
                                <span className="text-sm text-[#3d4a5a]/70">
                                  Weight: <span className="font-medium text-[#002E33]">{shipment.weight}</span>
                                </span>
                                <span className="text-sm text-[#3d4a5a]/70">
                                  Amount: <span className="font-medium text-[#002E33]">₹{shipment.amount}</span>
                                </span>
                              </div>

                              <div className="flex gap-3">
                                <motion.button 
                                  whileHover={{ scale: 1.02, borderColor: '#FDA11E' }} 
                                  whileTap={{ scale: 0.98 }} 
                                  className="rounded-md px-4 py-2 bg-white border shadow transition-all duration-200 hover:text-[#FDA11E]"
                                  style={{ color: '#1B1B1B', borderColor: 'rgba(0, 0, 0, 0.1)' }}
                                >
                                  Track Details
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.02, backgroundColor: '#FE9F16' }} 
                                  whileTap={{ scale: 0.98 }} 
                                  className="rounded-md px-4 py-2 text-white shadow transition-all duration-200"
                                  style={{ background: '#FDA11E' }}
                                >
                                  Download Receipt
                                </motion.button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </TabsContent>
          </Tabs>
          )}
        </motion.div>
      </motion.div>

      <Footer />
    </div>
  );
};

export default MyShipments;
