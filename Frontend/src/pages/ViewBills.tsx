import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Download, Search, FileText, Filter, Eye, Mail, Send, Shield, Smartphone, ArrowLeft, Printer, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import flagIcon from "@/Icon-images/flag.png";
import verIcon from "@/assets/ver.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  awb: string;
  date: string;
  amount: number;
  status: string;
  recipient: string;
  destination: string;
  dueDate: string;
  invoiceData?: any; // Full invoice data for detailed view
}

const COMPANY_DETAILS = {
  name: "Our Courier & Logistics",
  location: "Rehabari, Guwahati, Assam 781008",
  gstin: " 18AJRPG5984B1ZV",
  state: "Assam",
  stateCode: "18",
  phone: "+91 76360 96733",
  email: "info@oclservices.com",
  website: "www.oclservices.com",
};

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
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string | null>(null);
  const invoiceContentRef = useRef<HTMLDivElement | null>(null);

  // Fetch invoices after verification
  useEffect(() => {
    if (isVerified && verificationInput && verificationType === 'mobile') {
      fetchInvoicesByPhone();
    } else if (isVerified && verificationInput && verificationType === 'email') {
      fetchInvoicesByEmail();
    }
  }, [isVerified, verificationInput, verificationType]);

  const fetchInvoicesByPhone = async () => {
    try {
      const phoneNumber = verificationInput.replace(/\D/g, '');
      
      if (!phoneNumber || phoneNumber.length !== 10) {
        return;
      }

      setLoadingInvoices(true);
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const url = `${API_BASE}/api/customer-booking/invoices-by-phone?phoneNumber=${encodeURIComponent(phoneNumber)}`;
      console.log('📞 Fetching invoices from:', url);
      console.log('📞 Phone number being sent:', phoneNumber);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success && data.data) {
        console.log('✅ Found invoices:', data.data.length);
        setInvoices(data.data);
        setFilteredInvoices(data.data);
        if (data.data.length === 0) {
          toast({
            title: "No Invoices Found",
            description: "No invoices found for this phone number",
            variant: "default",
          });
        }
      } else {
        console.log('❌ No invoices found or error:', data);
        setInvoices([]);
        setFilteredInvoices([]);
        toast({
          title: "No Invoices Found",
          description: data.message || data.error || "No invoices found for this phone number",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
      setFilteredInvoices([]);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchInvoicesByEmail = async () => {
    try {
      const email = verificationInput.trim().toLowerCase();
      
      if (!email || !email.includes('@')) {
        return;
      }

      setLoadingInvoices(true);
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const url = `${API_BASE}/api/customer-booking/invoices-by-email?email=${encodeURIComponent(email)}`;
      console.log('📧 Fetching invoices from:', url);
      console.log('📧 Email being sent:', email);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success && data.data) {
        console.log('✅ Found invoices:', data.data.length);
        setInvoices(data.data);
        setFilteredInvoices(data.data);
        if (data.data.length === 0) {
          toast({
            title: "No Invoices Found",
            description: "No invoices found for this email address",
            variant: "default",
          });
        }
      } else {
        console.log('❌ No invoices found or error:', data);
        setInvoices([]);
        setFilteredInvoices([]);
        toast({
          title: "No Invoices Found",
          description: data.message || data.error || "No invoices found for this email address",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
      setFilteredInvoices([]);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingInvoices(false);
    }
  };
  
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
    // Find the invoice and open it in the dialog, then trigger download
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setAutoDownload(true);
      setSelectedInvoice(invoice);
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

  // Helper function to convert number to words (Indian format)
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero Rupees Only';
    
    const convertHundreds = (n: number): string => {
      let result = '';
      if (n > 99) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 19) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n > 9) {
        result += teens[n - 10] + ' ';
        return result.trim();
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result.trim();
    };
    
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    let result = '';
    let remaining = integerPart;
    
    // Crore
    if (remaining >= 10000000) {
      const crore = Math.floor(remaining / 10000000);
      result += convertHundreds(crore) + ' Crore ';
      remaining %= 10000000;
    }
    
    // Lakh
    if (remaining >= 100000) {
      const lakh = Math.floor(remaining / 100000);
      result += convertHundreds(lakh) + ' Lakh ';
      remaining %= 100000;
    }
    
    // Thousand
    if (remaining >= 1000) {
      const thousand = Math.floor(remaining / 1000);
      result += convertHundreds(thousand) + ' Thousand ';
      remaining %= 1000;
    }
    
    // Hundreds, Tens, Ones
    if (remaining > 0) {
      result += convertHundreds(remaining) + ' ';
    }
    
    result = result.trim() + ' Rupees';
    
    // Add paise if exists
    if (decimalPart > 0) {
      result += ' and ' + convertHundreds(decimalPart) + ' Paise';
    }
    
    return result + ' Only';
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getConsignmentValue = (reference?: string) => {
    if (!reference) return "";
    const digitsOnly = reference.replace(/[^0-9]/g, "");
    return digitsOnly || reference.trim();
  };

  const getBarcodeUrl = (reference?: string) => {
    const value = getConsignmentValue(reference) || "OCL";
    return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(value)}&translate-esc=on`;
  };

  // Function to fetch barcode and convert to data URL (to avoid CORS issues in PDF)
  const fetchBarcodeAsDataUrl = async (reference?: string, retries = 3): Promise<string | null> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const barcodeUrl = getBarcodeUrl(reference);
        console.log(`Fetching barcode (attempt ${attempt}/${retries}):`, barcodeUrl);
        const response = await fetch(barcodeUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          throw new Error('Empty blob received');
        }
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            if (dataUrl && dataUrl.startsWith('data:')) {
              console.log('Barcode fetched successfully as data URL');
              resolve(dataUrl);
            } else {
              reject(new Error('Invalid data URL'));
            }
          };
          reader.onerror = () => reject(new Error('FileReader error'));
          reader.readAsDataURL(blob);
        });
      } catch (error: any) {
        console.error(`Error fetching barcode (attempt ${attempt}/${retries}):`, error);
        if (attempt === retries) {
          console.error('All retry attempts failed for barcode');
          return null;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return null;
  };

  const parsePrice = (value: any): number => {
    if (!value) return 0;
    const cleaned = String(value).replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const handleDownloadInvoice = useCallback(async () => {
    if (!selectedInvoice || !invoiceContentRef.current) {
      return;
    }

    try {
      setDownloadingInvoice(true);
      
      // Always fetch barcode as data URL to ensure it's available for PDF
      const reference = selectedInvoice.invoiceData?.consignmentNumber || selectedInvoice.awb;
      let finalBarcodeDataUrl = barcodeDataUrl;
      
      if (!finalBarcodeDataUrl) {
        console.log('Fetching barcode as data URL...');
        finalBarcodeDataUrl = await fetchBarcodeAsDataUrl(reference);
        if (finalBarcodeDataUrl) {
          setBarcodeDataUrl(finalBarcodeDataUrl);
          // Wait for state update and DOM to reflect the change
          await new Promise(resolve => setTimeout(resolve, 300));
        } else {
          console.warn('Failed to fetch barcode as data URL, will try direct URL');
        }
      }
      
      // Find the barcode image element and ensure it's loaded
      const barcodeImg = invoiceContentRef.current.querySelector('img[alt*="Barcode"]') as HTMLImageElement;
      if (barcodeImg) {
        // Update the image src if we have a data URL
        if (finalBarcodeDataUrl && barcodeImg.src !== finalBarcodeDataUrl) {
          barcodeImg.src = finalBarcodeDataUrl;
          console.log('Updated barcode image src to data URL');
        }
        
        // Wait for barcode image to load
        await new Promise<void>((resolve) => {
          if (barcodeImg.complete && barcodeImg.naturalHeight !== 0) {
            console.log('Barcode image already loaded');
            resolve();
            return;
          }
          
          const timeout = setTimeout(() => {
            console.warn('Barcode image loading timeout');
            resolve(); // Continue even if timeout
          }, 15000);
          
          barcodeImg.onload = () => {
            clearTimeout(timeout);
            console.log('Barcode image loaded successfully');
            resolve();
          };
          
          barcodeImg.onerror = () => {
            clearTimeout(timeout);
            console.warn('Barcode image failed to load, will continue anyway');
            resolve();
          };
          
          // Force reload if image hasn't loaded
          if (!barcodeImg.complete) {
            barcodeImg.src = barcodeImg.src; // Trigger reload
          }
        });
      }
      
      // Wait for all other images to load
      const images = invoiceContentRef.current.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
        // Skip barcode as we already handled it
        if (img === barcodeImg) {
          return Promise.resolve();
        }
        
        // Check if image is already loaded
        if (img.complete && img.naturalHeight !== 0) {
          return Promise.resolve();
        }
        
        return new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('Image loading timeout:', img.src);
            resolve(); // Continue even if image times out
          }, 10000);
          
          img.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timeout);
            console.warn('Image failed to load:', img.src);
            resolve(); // Continue even if image fails
          };
        });
      });
      
      await Promise.all(imagePromises);

      // Additional delay to ensure everything is fully rendered, especially barcode
      await new Promise(resolve => setTimeout(resolve, 1500));

      const scale =
        typeof window !== "undefined"
          ? Math.min(window.devicePixelRatio || 2, 2)
          : 2;

      const canvas = await html2canvas(invoiceContentRef.current, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false, // Keep false to ensure canvas can be exported
        logging: false,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 20000, // Increased timeout for barcode image
        removeContainer: false,
        foreignObjectRendering: false,
        proxy: undefined, // Let html2canvas handle CORS
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add date and time at the top
      const now = new Date();
      const dateTimeStr = now.toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${dateTimeStr}`, 10, 10, { align: 'left' });
      
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const startY = 15; // Y position to start the image (below date/time)
      const availableHeightFirstPage = pageHeight - startY; // Available height on first page
      
      // Add image to first page
      pdf.addImage(imgData, "PNG", 0, startY, imgWidth, imgHeight);
      
      // Handle pagination if image is taller than available space on first page
      let heightLeft = imgHeight - availableHeightFirstPage;
      let position = startY - heightLeft;
      
      while (heightLeft > 0) {
        pdf.addPage();
        // Add date/time to each new page
        pdf.text(`Generated on: ${dateTimeStr}`, 10, 10, { align: 'left' });
        // Continue the image on the new page
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
      }

      pdf.save(`invoice-${selectedInvoice.id}.pdf`);
      toast({
        title: "Invoice downloaded",
        description: `${selectedInvoice.id} saved as PDF.`,
      });
    } catch (err) {
      console.error("Error downloading invoice:", err);
      toast({
        title: "Download failed",
        description: "We could not generate the invoice PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoice(false);
    }
  }, [selectedInvoice, barcodeDataUrl, toast]);

  // Fetch barcode as data URL when invoice is selected
  useEffect(() => {
    if (selectedInvoice) {
      const reference = selectedInvoice.invoiceData?.consignmentNumber || selectedInvoice.awb;
      fetchBarcodeAsDataUrl(reference).then(dataUrl => {
        setBarcodeDataUrl(dataUrl);
      });
    } else {
      setBarcodeDataUrl(null);
    }
  }, [selectedInvoice]);

  // Auto-download effect: triggers download when dialog opens with autoDownload flag
  useEffect(() => {
    if (autoDownload && selectedInvoice) {
      // Wait for content to render, with retry mechanism
      let retries = 0;
      const maxRetries = 10;
      
      const tryDownload = async () => {
        if (invoiceContentRef.current) {
          try {
            await handleDownloadInvoice();
            setAutoDownload(false);
          } catch (error) {
            console.error('Auto-download failed:', error);
            setAutoDownload(false);
          }
        } else if (retries < maxRetries) {
          retries++;
          setTimeout(tryDownload, 200);
        } else {
          console.error('Invoice content not found after retries');
          setAutoDownload(false);
        }
      };
      
      const timer = setTimeout(tryDownload, 500);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, selectedInvoice, handleDownloadInvoice]);

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
              {loadingInvoices ? (
                <Card 
                  className="border border-gray-200/50"
                  style={{
                    background: "linear-gradient(to bottom, #FFFFFF, #F9FAFB)",
                    borderRadius: "16px",
                    boxShadow: "rgba(0, 0, 0, 0.09) 0px 2px 1px, rgba(0, 0, 0, 0.09) 0px 4px 2px, rgba(0, 0, 0, 0.09) 0px 8px 4px, rgba(0, 0, 0, 0.09) 0px 16px 8px, rgba(0, 0, 0, 0.09) 0px 32px 16px",
                  }}
                >
                  <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold mb-2">Loading Invoices...</h3>
                    <p className="text-muted-foreground">
                      Please wait while we fetch your invoices
                    </p>
                  </CardContent>
                </Card>
              ) : filteredInvoices.length > 0 ? (
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
                                onClick={() => setSelectedInvoice(invoice)}
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
                          {filteredInvoices.filter(inv => inv.status.toLowerCase() === "paid").length}
                        </p>
                        <p className="text-sm mt-1" style={{ color: "#111827" }}>Paid Invoices</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.15 }}
                        className="transition-all duration-150"
                      >
                        <p className="text-3xl font-bold transition-colors duration-300" style={{ color: "#FDA11E" }}>
                          {filteredInvoices.filter(inv => inv.status.toLowerCase() === "pending").length}
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

      {/* Invoice Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 border-0 shadow-none bg-white print:bg-white print:max-h-full print:overflow-visible [&>button]:hidden mx-2 sm:mx-auto">
          <DialogHeader className="sticky top-0 z-10 bg-white dark:bg-slate-900 p-3 sm:p-4 print:hidden border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <DialogTitle className="text-base sm:text-lg font-semibold break-words text-slate-900">
                Invoice - {selectedInvoice?.id}
              </DialogTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedInvoice) {
                      window.print();
                    }
                  }}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadInvoice}
                  disabled={!selectedInvoice || downloadingInvoice}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                >
                  {downloadingInvoice ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Preparing
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>
          {selectedInvoice && selectedInvoice.invoiceData && (
            <div
              id="invoice-content"
              ref={invoiceContentRef}
              className="p-3 sm:p-6 print:p-3 bg-white"
            >
              {/* Invoice Section */}
              <div className="max-w-3xl mx-auto print:max-w-full">
                <div className="bg-white p-3 sm:p-4 print:p-3">
                  {/* Header Section */}
                  <div className="mb-3 pb-2">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 items-start">
                      <div className="flex items-start">
                        <img
                          src="/assets/ocl-logo.png"
                          alt="OCL Logo"
                          className="h-24 w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/ocl-logo.png';
                          }}
                        />
                      </div>
                      <div className="text-xs sm:text-[10px] space-y-1.5 text-slate-700">
                        <div className="space-y-0.5 sm:text-right">
                          <p className="text-sm sm:text-xs font-semibold text-slate-900">
                            Invoice Details
                          </p>
                          <p>Invoice No.: {selectedInvoice.invoiceData.invoiceNumber || selectedInvoice.id}</p>
                          <p>Created: {formatShortDate(selectedInvoice.date)}</p>
                        </div>
                        <div className="space-y-0.5 sm:text-right">
                          <p>
                            Consignment No.: {selectedInvoice.invoiceData.consignmentNumber || selectedInvoice.awb || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 mb-3 pb-2 grid-cols-1 sm:grid-cols-2 text-xs sm:text-[10px] text-slate-700">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-900">
                        {COMPANY_DETAILS.name}
                      </p>
                      <p>{COMPANY_DETAILS.location}</p>
                      <p>GSTIN: {COMPANY_DETAILS.gstin}</p>
                      <p>State: {COMPANY_DETAILS.state} (Code: {COMPANY_DETAILS.stateCode})</p>
                    </div>
                    <div className="space-y-0.5 sm:text-right">
                      <p>Email: {COMPANY_DETAILS.email}</p>
                      <p>Phone: {COMPANY_DETAILS.phone}</p>
                      <p>Website: {COMPANY_DETAILS.website}</p>
                      <p>Contact: 03612637373, 8453994809</p>
                    </div>
                  </div>

                  {/* Sender and Recipient Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    {/* From Section */}
                    <div>
                      <div className="text-xs sm:text-[10px] font-semibold text-slate-700 mb-1">From - Sender Information</div>
                      <div className="text-xs sm:text-[10px] text-slate-600 leading-tight">
                        <div className="font-medium">{selectedInvoice.invoiceData.origin?.name || 'N/A'}</div>
                        <div>{selectedInvoice.invoiceData.origin?.flatBuilding || ''} {selectedInvoice.invoiceData.origin?.locality || ''}</div>
                        <div>{selectedInvoice.invoiceData.origin?.area || ''}, {selectedInvoice.invoiceData.origin?.city || ''}, {selectedInvoice.invoiceData.origin?.state || ''}</div>
                        <div>PIN: {selectedInvoice.invoiceData.origin?.pincode || 'N/A'}</div>
                        {selectedInvoice.invoiceData.origin?.mobileNumber && (
                          <div>Phone: {selectedInvoice.invoiceData.origin.mobileNumber}</div>
                        )}
                      </div>
                    </div>

                    {/* To Section */}
                    <div className="sm:text-right">
                      <div className="text-xs sm:text-[10px] font-semibold text-slate-700 mb-1">To - Recipient Information</div>
                      <div className="text-xs sm:text-[10px] text-slate-600 leading-tight">
                        <div className="font-medium">{selectedInvoice.invoiceData.destination?.name || selectedInvoice.recipient || 'N/A'}</div>
                        <div>{selectedInvoice.invoiceData.destination?.flatBuilding || ''} {selectedInvoice.invoiceData.destination?.locality || ''}</div>
                        <div>{selectedInvoice.invoiceData.destination?.area || ''}, {selectedInvoice.invoiceData.destination?.city || ''}, {selectedInvoice.invoiceData.destination?.state || ''}</div>
                        <div>PIN: {selectedInvoice.invoiceData.destination?.pincode || 'N/A'}</div>
                        {selectedInvoice.invoiceData.destination?.mobileNumber && (
                          <div>Phone: {selectedInvoice.invoiceData.destination.mobileNumber}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shipment Details Section */}
                  <div className="mb-3 pb-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <div className="text-xs sm:text-[10px] text-slate-500 mb-0.5">Shipping mode</div>
                        <div className="text-xs sm:text-[10px] font-semibold text-slate-700">
                          {selectedInvoice.invoiceData.shipmentDetails?.shippingMode === 'byAir' || selectedInvoice.invoiceData.shipmentDetails?.shippingMode === 'air'
                            ? 'Air'
                            : selectedInvoice.invoiceData.shipmentDetails?.shippingMode === 'byTrain' || selectedInvoice.invoiceData.shipmentDetails?.shippingMode === 'train'
                            ? 'Train'
                            : 'Road'}
                          {selectedInvoice.invoiceData.shipmentDetails?.serviceType &&
                            ` - ${selectedInvoice.invoiceData.shipmentDetails.serviceType === 'priority' ? 'Priority' : 'Standard'}`}
                        </div>
                      </div>
                      <div className="text-left sm:text-center">
                        <div className="text-xs sm:text-[10px] text-slate-500 mb-0.5">Weight</div>
                        <div className="text-xs sm:text-[10px] font-semibold text-slate-700">
                          {selectedInvoice.invoiceData.shipmentDetails?.weight || '0'} kg
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-xs sm:text-[10px] text-slate-500 mb-0.5">Declared Value</div>
                        <div className="text-xs sm:text-[10px] font-semibold text-slate-700">
                          ₹
                          {selectedInvoice.invoiceData.shipmentDetails?.declaredValue
                            ? parsePrice(selectedInvoice.invoiceData.shipmentDetails.declaredValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '0.00'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barcode Section */}
                  <div className="mb-3 pb-2">
                    <div className="grid gap-4 sm:grid-cols-[1fr] items-center">
                      <div className="bg-slate-100 p-3 rounded flex items-center justify-center w-full" style={{ minHeight: '80px' }}>
                        <div className="text-center space-y-1.5 w-full">
                          <div className="text-[9px] text-slate-500">Barcode</div>
                          <img
                            src={barcodeDataUrl || getBarcodeUrl(selectedInvoice.invoiceData.consignmentNumber || selectedInvoice.awb)}
                            alt={`Barcode for ${getConsignmentValue(selectedInvoice.invoiceData.consignmentNumber || selectedInvoice.awb)}`}
                            className="mx-auto h-16 w-full object-contain mix-blend-multiply"
                            style={{ maxWidth: '100%', display: 'block' }}
                            key={barcodeDataUrl ? 'barcode-dataurl' : 'barcode-url'} // Force re-render when data URL is available
                            onLoad={(e) => {
                              console.log('Barcode image loaded successfully');
                              const img = e.currentTarget;
                              if (img.naturalHeight === 0) {
                                console.warn('Barcode image has zero height');
                              }
                            }}
                            onError={(e) => {
                              console.error('Barcode image failed to load, trying fallback');
                              const img = e.currentTarget;
                              // Try fallback URL if data URL fails
                              if (barcodeDataUrl && img.src === barcodeDataUrl) {
                                const reference = selectedInvoice.invoiceData?.consignmentNumber || selectedInvoice.awb;
                                img.src = getBarcodeUrl(reference);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bill To and Payment Details */}
                  <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left Column - Bill To */}
                    <div>
                      <div className="text-xs sm:text-[10px] font-semibold text-slate-700 mb-1">Bill To</div>
                      <div className="text-xs sm:text-[10px] text-slate-600 leading-tight">
                        <div className="font-medium">{selectedInvoice.invoiceData.billTo?.name || selectedInvoice.invoiceData.destination?.name || selectedInvoice.recipient || 'N/A'}</div>
                        <div>Phone: {selectedInvoice.invoiceData.billTo?.phone || selectedInvoice.invoiceData.destination?.mobileNumber || 'N/A'}</div>
                        <div>{selectedInvoice.invoiceData.billTo?.address || `${selectedInvoice.invoiceData.destination?.flatBuilding || ''} ${selectedInvoice.invoiceData.destination?.locality || ''}`}</div>
                        {selectedInvoice.invoiceData.destination?.city && (
                          <>
                            <div>{selectedInvoice.invoiceData.destination.area || ''}, {selectedInvoice.invoiceData.destination.city}, {selectedInvoice.invoiceData.destination.state || ''}</div>
                            <div>PIN: {selectedInvoice.invoiceData.destination.pincode || 'N/A'}</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Payment Details */}
                    <div className="text-left sm:text-right">
                      <div className="text-xs sm:text-[10px] font-bold text-black">
                        <div>{selectedInvoice.invoiceData.payment?.status === 'paid' ? 'Paid' : 'Unpaid'}</div>
                      </div>
                      <div className="text-base sm:text-[18px] font-bold text-black mt-1">
                        <div>₹{selectedInvoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details - Price Breakdown */}
                  <div className="mb-3">
                    {selectedInvoice.invoiceData.pricing && (
                      <div className="mt-2 pt-2">
                        <div className="text-xs sm:text-[9px] text-slate-600 space-y-0.5">
                          {selectedInvoice.invoiceData.pricing.detailsData ? (
                            // Use detailsData if available (office booking invoice)
                            (() => {
                              const detailsData = selectedInvoice.invoiceData.pricing.detailsData;
                              const freightCharge = parsePrice(detailsData.freightCharge);
                              const awbCharge = parsePrice(detailsData.awbCharge);
                              const pickupCharge = parsePrice(detailsData.pickupCharge);
                              const localCollection = parsePrice(detailsData.localCollection);
                              const doorDelivery = parsePrice(detailsData.doorDelivery);
                              const loadingUnloading = parsePrice(detailsData.loadingUnloading);
                              const demurrageCharge = parsePrice(detailsData.demurrageCharge);
                              const ddaCharge = parsePrice(detailsData.ddaCharge);
                              const hamaliCharge = parsePrice(detailsData.hamaliCharge);
                              const packingCharge = parsePrice(detailsData.packingCharge);
                              const otherCharge = parsePrice(detailsData.otherCharge);
                              const totalBeforeFuel = freightCharge + awbCharge + pickupCharge + localCollection + doorDelivery + loadingUnloading + demurrageCharge + ddaCharge + hamaliCharge + packingCharge + otherCharge;
                              
                              let fuelAmount = 0;
                              if (detailsData.fuelCharge && detailsData.fuelChargeType === 'percentage') {
                                const fuelPercentage = parseFloat(detailsData.fuelCharge);
                                if (!isNaN(fuelPercentage) && fuelPercentage > 0) {
                                  fuelAmount = (totalBeforeFuel * fuelPercentage) / 100;
                                }
                              } else if (detailsData.fuelCharge && detailsData.fuelChargeType === 'custom') {
                                fuelAmount = parsePrice(detailsData.fuelCharge);
                              }
                              
                              const totalWithFuel = totalBeforeFuel + fuelAmount;
                              const sgstAmount = parsePrice(detailsData.sgstAmount);
                              const cgstAmount = parsePrice(detailsData.cgstAmount);
                              const igstAmount = parsePrice(detailsData.igstAmount);
                              const grandTotal = parsePrice(detailsData.grandTotal) || selectedInvoice.amount;
                              
                              return (
                                <>
                                  {freightCharge > 0 && (
                                    <div className="flex justify-between">
                                      <span>Freight Charge:</span>
                                      <span>₹{freightCharge.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {awbCharge > 0 && (
                                    <div className="flex justify-between">
                                      <span>AWB Charge:</span>
                                      <span>₹{awbCharge.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {pickupCharge > 0 && (
                                    <div className="flex justify-between">
                                      <span>Pickup Charge:</span>
                                      <span>₹{pickupCharge.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {localCollection > 0 && (
                                    <div className="flex justify-between">
                                      <span>Local Collection:</span>
                                      <span>₹{localCollection.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {doorDelivery > 0 && (
                                    <div className="flex justify-between">
                                      <span>Door Delivery:</span>
                                      <span>₹{doorDelivery.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {loadingUnloading > 0 && (
                                    <div className="flex justify-between">
                                      <span>Loading/Unloading:</span>
                                      <span>₹{loadingUnloading.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {demurrageCharge > 0 && (
                                    <div className="flex justify-between">
                                      <span>Demurrage:</span>
                                      <span>₹{demurrageCharge.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {ddaCharge > 0 && (
                                    <div className="flex justify-between">
                                      <span>DDA:</span>
                                      <span>₹{ddaCharge.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {hamaliCharge > 0 && (
                                    <div className="flex justify-between">
                                      <span>Hamali:</span>
                                      <span>₹{hamaliCharge.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {packingCharge > 0 && (
                                    <div className="flex justify-between">
                                      <span>Packing:</span>
                                      <span>₹{packingCharge.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {otherCharge > 0 && (
                                    <div className="flex justify-between">
                                      <span>Other:</span>
                                      <span>₹{otherCharge.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {fuelAmount > 0 && (
                                    <div className="flex justify-between">
                                      <span>Fuel Charge:</span>
                                      <span>₹{fuelAmount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {(sgstAmount > 0 || cgstAmount > 0 || igstAmount > 0) && (
                                    <>
                                      {sgstAmount > 0 && (
                                        <div className="flex justify-between">
                                          <span>SGST:</span>
                                          <span>₹{sgstAmount.toFixed(2)}</span>
                                        </div>
                                      )}
                                      {cgstAmount > 0 && (
                                        <div className="flex justify-between">
                                          <span>CGST:</span>
                                          <span>₹{cgstAmount.toFixed(2)}</span>
                                        </div>
                                      )}
                                      {igstAmount > 0 && (
                                        <div className="flex justify-between">
                                          <span>IGST:</span>
                                          <span>₹{igstAmount.toFixed(2)}</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  <div className="flex justify-between font-bold text-black pt-0.5">
                                    <span>Total Amount:</span>
                                    <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-[9px] text-slate-600 italic pt-1 gap-1">
                                    <span>Amount in Words:</span>
                                    <span className="text-left sm:text-right break-words">
                                      {selectedInvoice.invoiceData.pricing.amountInWords || numberToWords(grandTotal)}
                                    </span>
                                  </div>
                                </>
                              );
                            })()
                          ) : (
                            // Simple pricing breakdown (for older invoices)
                            (() => {
                              const basePrice = selectedInvoice.invoiceData.pricing.basePrice || 0;
                              const pickupCharge = selectedInvoice.invoiceData.pricing.pickupCharge || 0;
                              const subtotal = selectedInvoice.invoiceData.pricing.subtotal || (basePrice + pickupCharge);
                              const gstAmount = selectedInvoice.invoiceData.pricing.gstAmount || 0;
                              const totalAmount = selectedInvoice.invoiceData.pricing.totalAmount || selectedInvoice.amount;
                              
                              return (
                                <>
                                  {basePrice > 0 && (
                                    <div className="flex justify-between">
                                      <span>Base Price:</span>
                                      <span>₹{basePrice.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {pickupCharge > 0 && (
                                    <div className="flex justify-between">
                                      <span>Pickup Charge:</span>
                                      <span>₹{pickupCharge.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {gstAmount > 0 && (
                                    <div className="flex justify-between">
                                      <span>GST (18%):</span>
                                      <span>₹{gstAmount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-bold text-black pt-0.5">
                                    <span>Total Amount:</span>
                                    <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-[9px] text-slate-600 italic pt-1 gap-1">
                                    <span>Amount in Words:</span>
                                    <span className="text-left sm:text-right break-words">
                                      {selectedInvoice.invoiceData.pricing.amountInWords || numberToWords(totalAmount)}
                                    </span>
                                  </div>
                                </>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Item Description */}
                  <div className="mb-3">
                    <div className="text-xs sm:text-[10px] font-semibold text-slate-700 mb-1">Item Description:</div>
                    <div className="text-xs sm:text-[10px] text-slate-600">
                      {selectedInvoice.invoiceData.itemDescription || 
                        (selectedInvoice.invoiceData.shipmentDetails?.natureOfConsignment === 'DOX' ? 'Document' : 
                         selectedInvoice.invoiceData.shipmentDetails?.natureOfConsignment === 'NON-DOX' ? 'Parcel' : 
                         selectedInvoice.invoiceData.shipmentDetails?.natureOfConsignment || 'Document')}
                    </div>
                  </div>

                  {/* Disclaimers */}
                  <div className="mb-3 space-y-1">
                    <div className="text-xs sm:text-[9px] text-slate-600 leading-tight">
                      Personal/Used goods, Not for Sale No Commercial Value.
                    </div>
                    <div className="text-xs sm:text-[9px] text-slate-600 leading-tight">
                      Please note that the final charges may be subject to revision if the actual weight differs from the declared weight, or if any additional charges are applicable for the shipment. For any queries or updates, please contact us at{' '}
                      <a
                        href="mailto:info@oclservices.com"
                        className="underline font-medium hover:opacity-80 transition-opacity text-blue-600 hover:text-blue-700"
                      >
                        info@oclservices.com
                      </a>
                    </div>
                    <div className="text-xs sm:text-[9px] text-slate-600 leading-tight">
                      Movement of content is subject to our list of Dangerous Goods and Prohibited Items.
                    </div>
                  </div>

                  {/* Computer Generated Invoice Note */}
                  <div className="mb-3 p-2 rounded border bg-yellow-50 border-yellow-200">
                    <div className="text-xs sm:text-[9px] leading-tight text-yellow-800">
                      <span className="font-bold">*</span> This is computer generated invoice and does not require official signature. Kindly notify us immediately in case you find any discrepancy in the details of transaction.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ViewBills;