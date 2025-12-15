import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Search, FileText, Filter, Eye, Mail, Send, Shield, Smartphone, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import invoicesData from "@/data/invoices.json";
import flagIcon from "@/Icon-images/flag.png";
import verIcon from "@/assets/ver.png";

interface Invoice {
  id: string;
  awb: string;
  date: string;
  amount: number;
  status: string;
  recipient: string;
  destination: string;
  dueDate: string;
}

const ViewBills = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const { toast } = useToast();
  
  // Verification state
  const [isVerified, setIsVerified] = useState(false);
  const [verificationInput, setVerificationInput] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationType, setVerificationType] = useState<"mobile" | "email">("mobile");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Only load invoices after verification
    if (isVerified) {
    // TODO: Replace with Supabase call
    setInvoices(invoicesData.invoices);
    setFilteredInvoices(invoicesData.invoices);
    }
  }, [isVerified]);
  
  // Send OTP function
  const handleSendOtp = async () => {
    if (!verificationInput.trim()) {
      toast({
        title: "Input Required",
        description: `Please enter your ${verificationType === "mobile" ? "mobile number" : "email address"}`,
        variant: "destructive"
      });
      return;
    }
    
    // Validate mobile number format (10 digits)
    if (verificationType === "mobile") {
      const cleanPhone = verificationInput.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        toast({
          title: "Invalid Mobile Number",
          description: "Please enter a valid 10-digit mobile number",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Validate email format
    if (verificationType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(verificationInput)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive"
        });
        return;
      }
    }
    
    setIsVerifying(true);
    try {
      const endpoint = verificationType === "mobile" 
        ? "/api/otp/send" 
        : "/api/otp/send-email"; // Assuming email OTP endpoint exists
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          verificationType === "mobile" 
            ? { phoneNumber: verificationInput.replace(/\D/g, '') }
            : { email: verificationInput }
        ),
      });
      
      const data = await response.json();
      
      if (data.success || response.ok) {
        setOtpSent(true);
        setOtpDigits(["", "", "", "", "", ""]);
        setOtp("");
        // Focus first OTP input after popup appears
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 350);
        toast({
          title: "OTP Sent",
          description: `OTP has been sent to your ${verificationType === "mobile" ? "mobile number" : "email"}`,
        });
      } else {
        throw new Error(data.error || "Failed to send OTP");
      }
    } catch (error: any) {
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle OTP digit change
  const handleOtpDigitChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);
    
    // Update the full OTP string
    const fullOtp = newOtpDigits.join("");
    setOtp(fullOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace in OTP inputs
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otpDigits.join("").length === 6) {
      handleVerifyOtp();
    }
  };

  // Resend OTP function
  const handleResendOtp = async () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setOtp("");
    await handleSendOtp();
  };
  
  // Verify OTP function
  const handleVerifyOtp = async () => {
    const fullOtp = otpDigits.join("");
    if (!fullOtp.trim() || fullOtp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive"
      });
      return;
    }
    
    setIsVerifying(true);
    try {
      const endpoint = verificationType === "mobile"
        ? "/api/otp/verify"
        : "/api/otp/verify-email"; // Assuming email OTP endpoint exists
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          verificationType === "mobile"
            ? { 
                phoneNumber: verificationInput.replace(/\D/g, ''),
                otp: fullOtp 
              }
            : { 
                email: verificationInput,
                otp: fullOtp 
              }
        ),
      });
      
      const data = await response.json();
      
      if (data.success || data.verified) {
        // Close popup with animation
        setOtpSent(false);
        setOtpDigits(["", "", "", "", "", ""]);
        setOtp("");
        // Small delay to allow close animation
        setTimeout(() => {
          setIsVerified(true);
          toast({
            title: "Verification Successful",
            description: "You can now view your Bills",
          });
        }, 300);
      } else {
        throw new Error(data.error || "Invalid OTP");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired OTP. Please try again.",
        variant: "destructive"
      });
      // Clear OTP on failure
      setOtpDigits(["", "", "", "", "", ""]);
      setOtp("");
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    let filtered = invoices;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.awb.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.recipient.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(invoice => 
        invoice.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Date filter (simplified for demo)
    if (dateFilter && dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "7days":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "90days":
          filterDate.setDate(now.getDate() - 90);
          break;
        default:
          filterDate.setFullYear(now.getFullYear() - 1);
      }
      
      filtered = filtered.filter(invoice => 
        new Date(invoice.date) >= filterDate
      );
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter, dateFilter]);

  const handleDownload = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoice-pdf/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('corporateToken')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download Started",
          description: `Downloading invoice ${invoiceId}...`,
        });
      } else {
        throw new Error('Failed to generate invoice');
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download invoice",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-50 text-green-700 border-green-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "overdue":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-soft flex flex-col relative">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-16">
        <AnimatePresence mode="wait">
          {!isVerified ? (
            // Verification Card
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 md:px-8"
              style={{ paddingTop: "2vh" }}
            >
              <div
                className="w-full max-w-md bg-white rounded-2xl p-6 md:p-8 relative"
                style={{
                  border: "1px solid #e5e7eb",
                  boxShadow: "rgba(0, 0, 0, 0.07) 0px 1px 2px, rgba(0, 0, 0, 0.07) 0px 2px 4px, rgba(0, 0, 0, 0.07) 0px 4px 8px, rgba(0, 0, 0, 0.07) 0px 8px 16px, rgba(0, 0, 0, 0.07) 0px 16px 32px, rgba(0, 0, 0, 0.07) 0px 32px 64px",
                  borderRadius: "16px",
                }}
              >
                {/* Floating Icon - Halfway Outside Top Border */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="absolute z-10"
                  style={{
                    width: "64px",
                    height: "64px",
                    top: "-32px",
                    left: "50%",
                    marginLeft: "-32px",
                  }}
                >
                  <img 
                    src={verIcon} 
                    alt="Verification icon" 
                    className="w-full h-full object-contain"
                    style={{
                      filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))",
                    }}
                  />
                </motion.div>

                <div className="flex flex-col items-center text-center mb-4 pt-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Verify Your Identity
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Enter your {verificationType === "mobile" ? "mobile number" : "email"} to view your Bills
                  </p>
                </div>

                {/* Form Section */}
                <div className="w-full">
                    {/* Verification Type Toggle */}
                    <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setVerificationType("mobile");
                          setOtpSent(false);
                          setOtp("");
                          setVerificationInput("");
                          setMobileError("");
                          setEmailError("");
                          setIsInputFocused(false);
                        }}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                          verificationType === "mobile"
                            ? "text-white shadow-md"
                            : "text-gray-600 hover:opacity-80"
                        }`}
                        style={
                          verificationType === "mobile"
                            ? { backgroundColor: "#FDA11E" }
                            : {}
                        }
                      >
                        <Smartphone className="w-4 h-4 inline mr-2" />
                        Mobile
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVerificationType("email");
                          setOtpSent(false);
                          setOtp("");
                          setVerificationInput("");
                          setMobileError("");
                          setEmailError("");
                          setIsInputFocused(false);
                        }}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                          verificationType === "email"
                            ? "text-white shadow-md"
                            : "text-gray-600 hover:opacity-80"
                        }`}
                        style={
                          verificationType === "email"
                            ? { backgroundColor: "#FDA11E" }
                            : {}
                        }
                      >
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </button>
                    </div>

                    {!otpSent ? (
                      // Mobile/Email Input
                      <div className="space-y-4">
                        <div className="relative">
                          {verificationType === "mobile" ? (
                            // Country Code Badge with Flag - Perfectly aligned inside input
                            <div
                              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center px-2 py-1 rounded-md"
                              style={{
                                backgroundColor: "#F7F7F7",
                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                              }}
                            >
                              <img 
                                src={flagIcon} 
                                alt="India flag" 
                                className="mr-1.5 rounded-sm object-cover"
                                style={{ width: '16px', height: '16px' }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling;
                                  if (fallback) {
                                    (fallback as HTMLElement).style.display = 'inline';
                                  }
                                }}
                              />
                              <span className="text-base mr-2 hidden">🇮🇳</span>
                              <span className="text-xs font-normal text-gray-700">+91</span>
                            </div>
                          ) : (
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                          )}
                          
                          <Input
                            type={verificationType === "mobile" ? "tel" : "email"}
                            value={verificationInput}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (verificationType === "mobile") {
                                  const numericValue = value.replace(/\D/g, '');
                                  const limitedValue = numericValue.slice(0, 10);
                                  setVerificationInput(limitedValue);
                                  setMobileError(""); // No error messages for mobile
                                } else {
                                  setVerificationInput(value);
                                  if (value && !value.includes("@")) {
                                    setEmailError("Please enter a valid email address");
                                  } else {
                                    setEmailError("");
                                  }
                                }
                              }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSendOtp();
                              }
                            }}
                            onFocus={(e) => {
                              setIsInputFocused(true);
                              e.currentTarget.style.borderColor = "#4285f4";
                              e.currentTarget.style.borderWidth = "1px";
                              e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.2) 0px 12px 28px 0px, rgba(0, 0, 0, 0.1) 0px 2px 4px 0px, rgba(255, 255, 255, 0.05) 0px 0px 0px 1px inset";
                            }}
                            onBlur={(e) => {
                              setIsInputFocused(false);
                              e.currentTarget.style.borderColor = "#d1d5db";
                              e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.2) 0px 12px 28px 0px, rgba(0, 0, 0, 0.1) 0px 2px 4px 0px, rgba(255, 255, 255, 0.05) 0px 0px 0px 1px inset";
                            }}
                            className={verificationType === "mobile" ? "pl-20 pt-4 pb-4 border border-gray-300 bg-white font-normal" : "pl-10 pt-4 pb-4 border border-gray-300 bg-white font-normal"}
                            style={{
                              boxShadow: "rgba(0, 0, 0, 0.2) 0px 12px 28px 0px, rgba(0, 0, 0, 0.1) 0px 2px 4px 0px, rgba(255, 255, 255, 0.05) 0px 0px 0px 1px inset",
                              fontWeight: "normal",
                              transition: "all 0.3s ease",
                            } as React.CSSProperties}
                          />
                          
                          <label
                            className={`absolute pointer-events-none font-normal transition-all duration-300 ease-in-out ${
                              verificationType === "mobile" ? "left-20" : "left-10"
                            } ${
                              isInputFocused || verificationInput
                                ? "-top-2 text-xs bg-white px-1 text-gray-600"
                                : "top-1/2 -translate-y-1/2 text-sm text-gray-500"
                            }`}
                          >
                            {verificationType === "mobile" ? "Mobile Number" : "Email Address"}
                          </label>
                        </div>
                        
                        {emailError && verificationType === "email" && (
                          <div className="min-h-[20px]">
                            <p className="text-red-500 text-xs font-normal">
                              {emailError}
                            </p>
                          </div>
                        )}
                        <div className="flex justify-center">
                          <Button
                            onClick={handleSendOtp}
                            disabled={
                              isVerifying || 
                              (verificationType === "mobile" 
                                ? verificationInput.replace(/\D/g, '').length !== 10
                                : !verificationInput.includes("@"))
                            }
                            className="inline-flex items-center justify-center cursor-pointer select-none relative z-0 rounded-3xl border-none box-border text-sm font-medium h-10 px-5 normal-case overflow-visible leading-normal text-white disabled:opacity-70"
                            style={{ 
                              backgroundColor: "#FDA11E",
                              appearance: "none",
                              fontFamily: '"Google Sans", Roboto, Arial, sans-serif',
                              letterSpacing: ".25px",
                              touchAction: "manipulation",
                              willChange: "transform,opacity",
                              boxShadow: "rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px",
                              transition: "box-shadow 280ms cubic-bezier(.4, 0, .2, 1), opacity 15ms linear 30ms, transform 270ms cubic-bezier(0, 0, .2, 1) 0ms",
                            }}
                          onMouseEnter={(e) => {
                            const isValid = verificationType === "mobile" 
                              ? verificationInput.replace(/\D/g, '').length === 10
                              : verificationInput.includes("@");
                            if (!isVerifying && isValid) {
                              e.currentTarget.style.backgroundColor = "#e6930a";
                              e.currentTarget.style.boxShadow = "rgba(60, 64, 67, .3) 0 2px 3px 0, rgba(60, 64, 67, .15) 0 6px 10px 4px";
                            }
                          }}
                          onMouseLeave={(e) => {
                            const isValid = verificationType === "mobile" 
                              ? verificationInput.replace(/\D/g, '').length === 10
                              : verificationInput.includes("@");
                            if (!isVerifying && isValid) {
                              e.currentTarget.style.backgroundColor = "#FDA11E";
                              e.currentTarget.style.boxShadow = "rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px";
                            }
                          }}
                          onMouseDown={(e) => {
                            const isValid = verificationType === "mobile" 
                              ? verificationInput.replace(/\D/g, '').length === 10
                              : verificationInput.includes("@");
                            if (!isVerifying && isValid) {
                              e.currentTarget.style.boxShadow = "rgba(60, 64, 67, .3) 0 4px 4px 0, rgba(60, 64, 67, .15) 0 8px 12px 6px";
                            }
                          }}
                          onMouseUp={(e) => {
                            const isValid = verificationType === "mobile" 
                              ? verificationInput.replace(/\D/g, '').length === 10
                              : verificationInput.includes("@");
                            if (!isVerifying && isValid) {
                              e.currentTarget.style.boxShadow = "rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px";
                            }
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.outline = "none";
                            e.currentTarget.style.border = "2px solid #4285f4";
                            e.currentTarget.style.boxShadow = "rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.border = "none";
                          }}
                        >
                          {isVerifying ? (
                            "Sending..."
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send OTP
                            </>
                          )}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                </div>
              </div>
            </motion.div>
          ) : (
            // Billing Dashboard
            <motion.section
              key="dashboard"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="py-16"
            >
              <div className="container mx-auto px-4">
        {/* Header */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                View Bills Online
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Access and download your invoices, track payments, and manage your billing history
              </p>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: "easeInOut" }}
            >
              <Card 
                className="mb-8 border border-gray-200/50 backdrop-blur-md"
                style={{
                  background: "#c6c9b5",
                  borderRadius: "16px",
                  boxShadow: "rgba(0, 0, 0, 0.09) 0px 2px 1px, rgba(0, 0, 0, 0.09) 0px 4px 2px, rgba(0, 0, 0, 0.09) 0px 8px 4px, rgba(0, 0, 0, 0.09) 0px 16px 8px, rgba(0, 0, 0, 0.09) 0px 32px 16px",
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Filter className="w-5 h-5" />
                    Filter & Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={(e) => {
                          setIsSearchFocused(true);
                          e.currentTarget.style.borderColor = "#4285f4";
                          e.currentTarget.style.borderWidth = "1px";
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.outline = "none";
                        }}
                        onBlur={(e) => {
                          setIsSearchFocused(false);
                          e.currentTarget.style.borderColor = "transparent";
                          e.currentTarget.style.borderWidth = "1px";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        className="bg-white/80 backdrop-blur-sm pl-10 pt-4 pb-4 font-normal"
                        style={{
                          borderRadius: "12px",
                          border: "1px solid transparent",
                          fontWeight: "normal",
                          transition: "all 0.3s ease",
                        } as React.CSSProperties}
                      />
                      <label
                        className={`absolute pointer-events-none font-normal transition-all duration-300 ease-in-out left-10 ${
                          isSearchFocused || searchTerm
                            ? "-top-2.5 text-xs text-gray-600"
                            : "top-1/2 -translate-y-1/2 text-sm text-gray-500"
                        }`}
                        style={{
                          backgroundColor: isSearchFocused || searchTerm ? "#c6c9b5" : "transparent",
                          paddingLeft: isSearchFocused || searchTerm ? "4px" : "0",
                          paddingRight: isSearchFocused || searchTerm ? "4px" : "0",
                          paddingTop: isSearchFocused || searchTerm ? "1px" : "0",
                          paddingBottom: isSearchFocused || searchTerm ? "1px" : "0",
                          lineHeight: isSearchFocused || searchTerm ? "1" : "inherit",
                        }}
                      >
                        Search invoices
                      </label>
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger 
                        className="bg-white/80 backdrop-blur-sm"
                        style={{
                          borderRadius: "12px",
                          border: "1px solid transparent",
                          outline: "none",
                          boxShadow: "none",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#4285f4";
                          e.currentTarget.style.borderWidth = "1px";
                          e.currentTarget.style.outline = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "transparent";
                          e.currentTarget.style.borderWidth = "1px";
                          e.currentTarget.style.outline = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger 
                        className="bg-white/80 backdrop-blur-sm"
                        style={{
                          borderRadius: "12px",
                          border: "1px solid transparent",
                          outline: "none",
                          boxShadow: "none",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#4285f4";
                          e.currentTarget.style.borderWidth = "1px";
                          e.currentTarget.style.outline = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "transparent";
                          e.currentTarget.style.borderWidth = "1px";
                          e.currentTarget.style.outline = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <SelectValue placeholder="Filter by date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="30days">Last 30 days</SelectItem>
                        <SelectItem value="90days">Last 90 days</SelectItem>
                        <SelectItem value="year">Last year</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button 
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setDateFilter("all");
                      }}
                      variant="outline"
                      className="bg-white/80 backdrop-blur-sm text-gray-700"
                      style={{ 
                        borderRadius: "12px",
                        border: "1px solid transparent",
                        outline: "none",
                        boxShadow: "none",
                        color: "#374151",
                      } as React.CSSProperties}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
                        e.currentTarget.style.color = "#374151";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
                        e.currentTarget.style.color = "#374151";
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#4285f4";
                        e.currentTarget.style.borderWidth = "1px";
                        e.currentTarget.style.outline = "none";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.color = "#374151";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.borderWidth = "1px";
                        e.currentTarget.style.outline = "none";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.color = "#374151";
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Invoices List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4, ease: "easeInOut" }}
              className="space-y-4"
            >
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice, index) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.5 + index * 0.1, 
                      duration: 0.4, 
                      ease: "easeOut" 
                    }}
                    whileHover={{ 
                      y: -4,
                      transition: { duration: 0.15 }
                    }}
                  >
                    <Card 
                      className="cursor-pointer"
                      style={{
                        background: "#F9FAFB",
                        borderRadius: "16px",
                        border: "1px solid rgba(0, 0, 0, 0.05)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                        transition: "all 0.15s ease-out",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#FFFFFF";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#F9FAFB";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="grid md:grid-cols-6 gap-4 items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Invoice ID</p>
                            <p className="font-semibold font-mono">{invoice.id}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">AWB Number</p>
                            <p className="font-semibold font-mono">{invoice.awb}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="font-semibold">{new Date(invoice.date).toLocaleDateString()}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-semibold text-lg">₹{invoice.amount.toFixed(2)}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                            >
                              <Badge 
                                className={`${getStatusColor(invoice.status)} border rounded-full px-3 py-1`}
                                style={{
                                  fontWeight: "500",
                                }}
                              >
                              {invoice.status}
                            </Badge>
                            </motion.div>
                          </div>
                          
                          <div className="flex gap-2">
                                <motion.div 
                                  whileHover={{ scale: 1.05 }} 
                                  whileTap={{ scale: 0.95 }}
                                  transition={{ duration: 0.4 }}
                                >
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(invoice.id)}
                                    className="border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                                    style={{ 
                                      transitionDuration: "0.4s",
                                      borderRadius: "8px",
                                    }}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                PDF
                              </Button>
                            </motion.div>
                            
                                <motion.div 
                                  whileHover={{ scale: 1.05 }} 
                                  whileTap={{ scale: 0.95 }}
                                  transition={{ duration: 0.4 }}
                                >
                              <Button
                                size="sm"
                                    className="bg-gray-900 hover:bg-gray-800 text-white transition-all"
                                    style={{ 
                                      transitionDuration: "0.4s",
                                      borderRadius: "8px",
                                    }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200/50">
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Recipient: </span>
                              <span className="font-medium">{invoice.recipient}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Destination: </span>
                              <span className="font-medium">{invoice.destination}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.4, ease: "easeInOut" }}
                    >
                <Card 
                  className="border border-gray-200/50"
                  style={{
                    background: "linear-gradient(to bottom, #FFFFFF, #F9FAFB)",
                    borderRadius: "16px",
                    boxShadow: "rgba(0, 0, 0, 0.09) 0px 2px 1px, rgba(0, 0, 0, 0.09) 0px 4px 2px, rgba(0, 0, 0, 0.09) 0px 8px 4px, rgba(0, 0, 0, 0.09) 0px 16px 8px, rgba(0, 0, 0, 0.09) 0px 32px 16px",
                  }}
                >
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Invoices Found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                        ? "Try adjusting your filters to see more results."
                              : "You don't have any invoices yet. Start shipping to see your Bills here."}
                    </p>
                  </CardContent>
                </Card>
                    </motion.div>
              )}
            </motion.div>

            {/* Summary Stats */}
            {filteredInvoices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.4, ease: "easeInOut" }}
                className="mt-8"
              >
                <Card 
                  className="border border-gray-200/50"
                  style={{
                    background: "#F3F4F6",
                    borderRadius: "16px",
                    boxShadow: "rgba(0, 0, 0, 0.09) 0px 2px 1px, rgba(0, 0, 0, 0.09) 0px 4px 2px, rgba(0, 0, 0, 0.09) 0px 8px 4px, rgba(0, 0, 0, 0.09) 0px 16px 8px, rgba(0, 0, 0, 0.09) 0px 32px 16px, inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                    transition: "all 0.15s ease-out",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.12) 0px 2px 1px, rgba(0, 0, 0, 0.12) 0px 4px 2px, rgba(0, 0, 0, 0.12) 0px 8px 4px, rgba(0, 0, 0, 0.12) 0px 16px 8px, rgba(0, 0, 0, 0.12) 0px 32px 16px, rgba(0, 0, 0, 0.12) 0px 64px 32px, inset 0 1px 0 rgba(255, 255, 255, 0.8)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.09) 0px 2px 1px, rgba(0, 0, 0, 0.09) 0px 4px 2px, rgba(0, 0, 0, 0.09) 0px 8px 4px, rgba(0, 0, 0, 0.09) 0px 16px 8px, rgba(0, 0, 0, 0.09) 0px 32px 16px, inset 0 1px 0 rgba(255, 255, 255, 0.8)";
                  }}
                >
                  <CardHeader>
                    <CardTitle style={{ color: "#111827" }}>Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-6 text-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.15 }}
                        className="transition-all duration-150"
                      >
                        <p className="text-3xl font-bold transition-colors duration-300" style={{ color: "#FDA11E" }}>
                          {filteredInvoices.length}
                        </p>
                        <p className="text-sm mt-1" style={{ color: "#111827" }}>Total Invoices</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.15 }}
                        className="transition-all duration-150"
                      >
                        <p className="text-3xl font-bold transition-colors duration-300" style={{ color: "#FDA11E" }}>
                          ₹{filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
                        </p>
                        <p className="text-sm mt-1" style={{ color: "#111827" }}>Total Amount</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.15 }}
                        className="transition-all duration-150"
                      >
                        <p className="text-3xl font-bold transition-colors duration-300" style={{ color: "#FDA11E" }}>
                          {filteredInvoices.filter(inv => inv.status === "Paid").length}
                        </p>
                        <p className="text-sm mt-1" style={{ color: "#111827" }}>Paid Invoices</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.15 }}
                        className="transition-all duration-150"
                      >
                        <p className="text-3xl font-bold transition-colors duration-300" style={{ color: "#FDA11E" }}>
                          {filteredInvoices.filter(inv => inv.status === "Pending").length}
                        </p>
                        <p className="text-sm mt-1" style={{ color: "#111827" }}>Pending Invoices</p>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* OTP Popup Modal */}
        <AnimatePresence>
          {otpSent && !isVerified && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={() => {
                  // Optional: Close on backdrop click, or remove this if you don't want it
                }}
              />
              
              {/* OTP Popup Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ pointerEvents: "auto" }}
              >
                <div
                  className="bg-white rounded-2xl p-8 w-full max-w-md relative"
                  style={{
                    borderRadius: "16px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Back Arrow */}
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setOtpDigits(["", "", "", "", "", ""]);
                      setOtp("");
                    }}
                    className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    style={{
                      color: "#374151",
                    }}
                    aria-label="Go back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-center mb-2 text-foreground">
                    Enter OTP
                  </h3>
                  
                  {/* Subtitle */}
                  <p className="text-muted-foreground text-sm text-center mb-6">
                    We've sent an OTP on {verificationType === "mobile" 
                      ? `+91 ${verificationInput.replace(/\D/g, '')}` 
                      : verificationInput}
                  </p>

                  {/* OTP Input Boxes */}
                  <div className="flex gap-3 justify-center mb-6">
                    {otpDigits.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#4285f4";
                          e.currentTarget.style.borderWidth = "1px";
                          e.currentTarget.style.outline = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#d1d5db";
                          e.currentTarget.style.borderWidth = "1px";
                          e.currentTarget.style.outline = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        className="w-12 h-12 text-center text-xl font-semibold rounded-lg transition-all"
                        style={{
                          fontWeight: "normal",
                          border: "1px solid #d1d5db",
                          outline: "none",
                          boxShadow: "none",
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>

                  {/* Verify OTP Button */}
                  <div className="mb-4">
                    <Button
                      onClick={handleVerifyOtp}
                      disabled={isVerifying || otpDigits.join("").length !== 6}
                      className="w-full text-white font-semibold py-6 rounded-lg transition-all disabled:opacity-50"
                      style={{ 
                        backgroundColor: "#FDA11E",
                        transitionDuration: "0.4s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isVerifying && otpDigits.join("").length === 6) {
                          e.currentTarget.style.backgroundColor = "#e6930a";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(253, 161, 30, 0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isVerifying && otpDigits.join("").length === 6) {
                          e.currentTarget.style.backgroundColor = "#FDA11E";
                          e.currentTarget.style.boxShadow = "none";
                        }
                      }}
                    >
                      {isVerifying ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </div>

                  {/* Resend OTP Link */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isVerifying}
                      className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 underline underline-offset-2 hover:underline-offset-4 disabled:opacity-50"
                      style={{
                        textDecorationColor: "transparent",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecorationColor = "currentColor";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecorationColor = "transparent";
                      }}
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default ViewBills;