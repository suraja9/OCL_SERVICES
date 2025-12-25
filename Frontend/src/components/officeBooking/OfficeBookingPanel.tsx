/**
 * Office Booking Panel - Main Component
 * 
 * Multi-step booking flow for office users
 * Design inspired by CorporateBookingPanel, functionality from BookingPanel
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ServiceabilityStep, OriginStep, DestinationStep, ShipmentDetailsStep, MaterialDetailsStep, UploadStep, BillStep, DetailsStep, PaymentStep } from './steps';
import { useBookingState } from './hooks/useBookingState';
import { API_BASE } from './utils/constants';
import type { AddressData } from './types';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, Pencil, X, Building, MapPin, Mail, Loader2, CheckCircle, Package, ArrowRight, Truck, FileText, DollarSign, Download, Printer, Eye, Image, ArrowLeft, XCircle, Receipt, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FloatingInput, FloatingSelect } from './shared';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

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

const OfficeBookingPanel: React.FC = () => {
  const bookingState = useBookingState();
  const [isDarkMode] = useState(false);
  const { toast } = useToast();
  
  // Phone number search states
  const [phoneSearchResults, setPhoneSearchResults] = useState<any[]>([]);
  const [phoneSearchModalOpen, setPhoneSearchModalOpen] = useState<{ type: 'origin' | 'destination' | null; phoneNumber: string }>({ type: null, phoneNumber: '' });
  const [searchingPhone, setSearchingPhone] = useState(false);
  
  // Phone modal states (for digit inputs)
  const [phoneModalOpen, setPhoneModalOpen] = useState<{ type: 'origin' | 'destination' | null }>({ type: null });
  const [originMobileDigits, setOriginMobileDigits] = useState<string[]>(Array(10).fill(''));
  const [destinationMobileDigits, setDestinationMobileDigits] = useState<string[]>(Array(10).fill(''));
  
  // Form modal states
  const [formModalOpen, setFormModalOpen] = useState<{ type: 'origin' | 'destination' | null }>({ type: null });
  const [showPreviewInModal, setShowPreviewInModal] = useState(false);
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
  
  // OTP verification states (for sender/origin only)
  const [showOriginOtpVerification, setShowOriginOtpVerification] = useState(false);
  const [originOtpDigits, setOriginOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [originOtpVerified, setOriginOtpVerified] = useState(false);
  const [originOtpError, setOriginOtpError] = useState<string | null>(null);
  const [isOriginOtpSending, setIsOriginOtpSending] = useState(false);
  
  // Areas for pincode
  const [originAreas, setOriginAreas] = useState<string[]>([]);
  const [destinationAreas, setDestinationAreas] = useState<string[]>([]);
  
  // Current section tracking
  const [currentSection, setCurrentSection] = useState<'origin' | 'destination'>('origin');
  
  // Booking result state
  const [bookingResult, setBookingResult] = useState<{
    consignmentNumber?: string | number | null;
    bookingReference?: string | null;
    bookingId?: string | null;
  } | null>(null);

  // Invoice states
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const invoiceContentRef = useRef<HTMLDivElement | null>(null);

  // Door pickup charge constants (exclusive of GST)
  const DOOR_PICKUP_CHARGE = 100;
  const PICKUP_CHARGE_GST_RATE = 0.18; // 18% GST
  const PICKUP_CHARGE_GST = DOOR_PICKUP_CHARGE * PICKUP_CHARGE_GST_RATE; // ₹18
  const TOTAL_PICKUP_CHARGE = DOOR_PICKUP_CHARGE + PICKUP_CHARGE_GST; // ₹118

  // Helper function to calculate total pickup charge with GST
  const getTotalPickupCharge = (pickupCharge?: number): number => {
    if (pickupCharge !== undefined && pickupCharge !== null) {
      return pickupCharge + (pickupCharge * PICKUP_CHARGE_GST_RATE);
    }
    return TOTAL_PICKUP_CHARGE;
  };

  // Function to convert number to words (Indian format)
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

  const formatDateWithTime = (dateString: string) => {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} ${timePart}`;
  };

  const getConsignmentValue = (reference?: string | number | null) => {
    if (!reference) return "";
    const digitsOnly = String(reference).replace(/[^0-9]/g, "");
    return digitsOnly || String(reference).trim();
  };

  const getBarcodeUrl = (reference?: string | number | null) => {
    const value = getConsignmentValue(reference) || "OCL";
    return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(value)}&translate-esc=on`;
  };

  const getInvoiceNumber = () => {
    const createdDate = new Date();
    const currentYear = createdDate.getFullYear();
    const nextYear = currentYear + 1;
    const fiscalYear = `${String(currentYear).slice(-2)}-${String(nextYear).slice(-2)}`;

    const numericPart = bookingResult?.consignmentNumber 
      ? String(bookingResult.consignmentNumber).replace(/\D/g, "")
      : bookingResult?.bookingReference?.replace(/\D/g, "") || '0';

    const serial = numericPart.slice(-5).padStart(5, "0");

    return `${fiscalYear}/${serial}`;
  };

  // Parse pincode response helper
  const parsePincodeResponse = (data: any) => {
    try {
      if (!data || typeof data !== 'object') {
        return { state: '', city: '', district: '', areas: [] };
      }
      
      const state: string = data?.state || '';
      const citiesObj = data?.cities || {};
      const firstCityKey = citiesObj && Object.keys(citiesObj).length > 0 ? Object.keys(citiesObj)[0] : '';
      const city: string = firstCityKey || '';
      const districtsObj = firstCityKey ? citiesObj[firstCityKey]?.districts || {} : {};
      const firstDistrictKey = districtsObj && Object.keys(districtsObj).length > 0 ? Object.keys(districtsObj)[0] : '';
      const district: string = firstDistrictKey || '';
      const areasArr = firstDistrictKey ? districtsObj[firstDistrictKey]?.areas || [] : [];
      const areas: string[] = Array.isArray(areasArr) ? areasArr.map((a: any) => a?.name || '').filter(Boolean) : [];
      
      return { state, city, district, areas };
    } catch (error) {
      console.error('Error parsing pincode response:', error);
      return { state: '', city: '', district: '', areas: [] };
    }
  };

  // Check pincode serviceability (for initial step)
  const checkPincodeServiceability = async (pincode: string, type: 'origin' | 'destination') => {
    if (pincode.length !== 6) {
      if (type === 'origin') {
        bookingState.setOriginServiceable(null);
        bookingState.setOriginAddressInfo('');
        bookingState.setCheckingOrigin(false);
      } else {
        bookingState.setDestinationServiceable(null);
        bookingState.setDestinationAddressInfo('');
        bookingState.setCheckingDestination(false);
      }
      return;
    }

    if (type === 'origin') {
      bookingState.setCheckingOrigin(true);
    } else {
      bookingState.setCheckingDestination(true);
    }

    try {
      const { data } = await axios.get(`${API_BASE}/api/pincode/${pincode}`);
      const isServiceable = !!data;
      const parsed = isServiceable ? parsePincodeResponse(data) : { state: '', city: '', district: '', areas: [] };

      if (type === 'origin') {
        bookingState.setOriginServiceable(isServiceable);
        if (isServiceable) {
          bookingState.setOriginData(prev => ({
            ...prev,
            pincode: pincode,
            city: parsed.city,
            district: parsed.district,
            state: parsed.state
          }));
          setOriginAreas(parsed.areas);
          bookingState.setOriginAddressInfo(`${parsed.city}, ${parsed.state}`);
        } else {
          setOriginAreas([]);
          bookingState.setOriginAddressInfo('');
        }
      } else {
        bookingState.setDestinationServiceable(isServiceable);
        if (isServiceable) {
          bookingState.setDestinationData(prev => ({
            ...prev,
            pincode: pincode,
            city: parsed.city,
            district: parsed.district,
            state: parsed.state
          }));
          setDestinationAreas(parsed.areas);
          bookingState.setDestinationAddressInfo(`${parsed.city}, ${parsed.state}`);
        } else {
          setDestinationAreas([]);
          bookingState.setDestinationAddressInfo('');
        }
      }
    } catch (e) {
      if (type === 'origin') {
        bookingState.setOriginServiceable(false);
        bookingState.setOriginAddressInfo('');
      } else {
        bookingState.setDestinationServiceable(false);
        bookingState.setDestinationAddressInfo('');
      }
    } finally {
      if (type === 'origin') {
        bookingState.setCheckingOrigin(false);
      } else {
        bookingState.setCheckingDestination(false);
      }
    }
  };

  // Search by phone number
  const searchByPhoneNumber = async (phoneNumber: string, type: 'origin' | 'destination') => {
    if (phoneNumber.length !== 10) return;
    
    // Prevent duplicate searches for the same phone number
    if (phoneSearchModalOpen.type === type && phoneSearchModalOpen.phoneNumber === phoneNumber) {
      return;
    }
    
    try {
      setSearchingPhone(true);
      const response = await axios.get(`${API_BASE}/api/customer-booking/search-by-phone`, {
        params: { phoneNumber, type }
      });
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        // Phone number found - show preview modal directly with records
        setPhoneSearchResults(response.data.data);
        setPhoneSearchModalOpen({ type, phoneNumber });
        setSelectedRecordIndex(0);
        // Auto-fill with first record (don't close modals, we'll handle that)
        handleSelectPhoneRecord(response.data.data[0], type, false);
        // Close phone modal and open form modal in preview mode
        setPhoneModalOpen({ type: null });
        setTimeout(() => {
          setFormModalOpen({ type });
          setShowPreviewInModal(true);
        }, 300);
      } else {
        // No results found
        if (type === 'origin') {
          // For sender: Show OTP verification
          setPhoneSearchResults([]);
          setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
          setPhoneModalOpen({ type: null });
          setShowOriginOtpVerification(true);
          setOriginOtpVerified(false);
          setOriginOtpError(null);
          // Send OTP automatically
          setTimeout(() => {
            sendOriginOTP(phoneNumber);
          }, 100);
        } else {
          // For receiver: Open blank form (no OTP)
          setPhoneSearchResults([]);
          setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
          setPhoneModalOpen({ type: null });
          setTimeout(() => {
            setFormModalOpen({ type });
          }, 300);
        }
      }
    } catch (error) {
      console.error('Error searching by phone number:', error);
      if (type === 'origin') {
        // For sender: Show OTP verification on error
        setPhoneSearchResults([]);
        setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
        setPhoneModalOpen({ type: null });
        setShowOriginOtpVerification(true);
        setOriginOtpVerified(false);
        setOriginOtpError(null);
        setTimeout(() => {
          sendOriginOTP(phoneNumber);
        }, 100);
      } else {
        // For receiver: Open blank form on error
        setPhoneSearchResults([]);
        setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
        setPhoneModalOpen({ type: null });
        setTimeout(() => {
          setFormModalOpen({ type });
        }, 300);
      }
    } finally {
      setSearchingPhone(false);
    }
  };

  // Send OTP for origin (sender) phone number
  const sendOriginOTP = async (phoneNumber?: string) => {
    try {
      const mobileNumber = phoneNumber || originMobileDigits.filter(digit => digit !== '').join('');
      
      if (mobileNumber.length !== 10) {
        setOriginOtpError('Invalid phone number length. Expected 10 digits.');
        return;
      }
      
      setIsOriginOtpSending(true);
      setOriginOtpError(null);
      
      const response = await fetch(`${API_BASE}/api/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: mobileNumber })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('OTP sent successfully for origin phone:', mobileNumber);
        setOriginOtpError(null);
      } else {
        setOriginOtpError(result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOriginOtpError('Failed to send OTP. Please try again.');
    } finally {
      setIsOriginOtpSending(false);
    }
  };

  // Verify OTP for origin (sender) phone number
  const verifyOriginOTP = async (otp: string) => {
    if (otp.length !== 6) {
      setOriginOtpError('Please enter a valid 6-digit OTP.');
      return;
    }

    try {
      const mobileNumber = originMobileDigits.filter(digit => digit !== '').join('');
      
      if (mobileNumber.length !== 10) {
        setOriginOtpError('Invalid phone number.');
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: mobileNumber,
          otp: otp
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setOriginOtpVerified(true);
        setOriginOtpError(null);
        console.log('OTP verified successfully for origin phone:', mobileNumber);
        // Close OTP modal and open blank form
        setShowOriginOtpVerification(false);
        setTimeout(() => {
          setFormModalOpen({ type: 'origin' });
        }, 300);
      } else {
        setOriginOtpError(result.error || 'Invalid OTP. Please try again.');
        setOriginOtpDigits(Array(6).fill(''));
        setTimeout(() => {
          const firstInput = document.getElementById('origin-otp-digit-0');
          firstInput?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOriginOtpError('Error verifying OTP. Please try again.');
      setOriginOtpDigits(Array(6).fill(''));
      setTimeout(() => {
        const firstInput = document.getElementById('origin-otp-digit-0');
        firstInput?.focus();
      }, 100);
    }
  };

  // Get digit input ID helper
  const getDigitInputId = (type: 'origin' | 'destination', index: number) => `${type}-modal-digit-${index}`;

  // Handle origin digit change
  const handleOriginDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      const newDigits = Array(10).fill('');
      digits.split('').forEach((digit, i) => {
        if (i < 10) newDigits[i] = digit;
      });
      setOriginMobileDigits(newDigits);
      
      const mobileNumber = newDigits.filter(digit => digit !== '').join('');
      bookingState.setOriginData(prev => ({ ...prev, mobileNumber }));
      
      const nextEmptyIndex = newDigits.findIndex((d, i) => i >= index && d === '');
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(index + digits.length, 9);
      setTimeout(() => {
        const nextInput = document.getElementById(getDigitInputId('origin', focusIndex));
        nextInput?.focus();
      }, 0);
      return;
    }
    
    if (!/^[0-9]*$/.test(value)) return;
    
    const newDigits = [...originMobileDigits];
    newDigits[index] = value;
    setOriginMobileDigits(newDigits);
    
    if (value && index < 9) {
      setTimeout(() => {
        const nextInput = document.getElementById(getDigitInputId('origin', index + 1));
        nextInput?.focus();
      }, 0);
    }
    
    const mobileNumber = newDigits.filter(digit => digit !== '').join('');
    bookingState.setOriginData(prev => ({ ...prev, mobileNumber }));
    
    if (mobileNumber.length === 10) {
      searchByPhoneNumber(mobileNumber, 'origin');
    } else {
      setPhoneSearchResults([]);
      setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
    }
  };

  // Handle destination digit change
  const handleDestinationDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      const newDigits = Array(10).fill('');
      digits.split('').forEach((digit, i) => {
        if (i < 10) newDigits[i] = digit;
      });
      setDestinationMobileDigits(newDigits);
      
      const mobileNumber = newDigits.filter(digit => digit !== '').join('');
      bookingState.setDestinationData(prev => ({ ...prev, mobileNumber }));
      
      const nextEmptyIndex = newDigits.findIndex((d, i) => i >= index && d === '');
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(index + digits.length, 9);
      setTimeout(() => {
        const nextInput = document.getElementById(getDigitInputId('destination', focusIndex));
        nextInput?.focus();
      }, 0);
      return;
    }
    
    if (!/^[0-9]*$/.test(value)) return;
    
    const newDigits = [...destinationMobileDigits];
    newDigits[index] = value;
    setDestinationMobileDigits(newDigits);
    
    if (value && index < 9) {
      setTimeout(() => {
        const nextInput = document.getElementById(getDigitInputId('destination', index + 1));
        nextInput?.focus();
      }, 0);
    }
    
    const mobileNumber = newDigits.filter(digit => digit !== '').join('');
    bookingState.setDestinationData(prev => ({ ...prev, mobileNumber }));
    
    if (mobileNumber.length === 10) {
      searchByPhoneNumber(mobileNumber, 'destination');
    } else {
      setPhoneSearchResults([]);
      setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
    }
  };

  // Auto-fill form with selected record
  const handleSelectPhoneRecord = (record: any, type: 'origin' | 'destination', closeModals: boolean = true) => {
    if (type === 'origin') {
      bookingState.setOriginData(prev => ({
        ...prev,
        name: record.name || '',
        email: record.email || '',
        companyName: record.companyName || '',
        flatBuilding: record.flatBuilding || '',
        locality: record.locality || '',
        landmark: record.landmark || '',
        pincode: record.pincode || '',
        area: record.area || '',
        city: record.city || '',
        district: record.district || '',
        state: record.state || '',
        gstNumber: record.gstNumber || '',
        alternateNumbers: record.alternateNumbers || [''],
        addressType: record.addressType || 'Home',
        birthday: record.birthday || '',
        anniversary: record.anniversary || '',
        website: record.website || ''
      }));
      
      // Set pincode for serviceability check
      if (record.pincode) {
        bookingState.setOriginPincode(record.pincode);
        checkPincodeServiceability(record.pincode, 'origin');
      }
    } else {
      bookingState.setDestinationData(prev => ({
        ...prev,
        name: record.name || '',
        email: record.email || '',
        companyName: record.companyName || '',
        flatBuilding: record.flatBuilding || '',
        locality: record.locality || '',
        landmark: record.landmark || '',
        pincode: record.pincode || '',
        area: record.area || '',
        city: record.city || '',
        district: record.district || '',
        state: record.state || '',
        gstNumber: record.gstNumber || '',
        alternateNumbers: record.alternateNumbers || [''],
        addressType: record.addressType || 'Home',
        birthday: record.birthday || '',
        anniversary: record.anniversary || '',
        website: record.website || ''
      }));
      
      // Set pincode for serviceability check
      if (record.pincode) {
        bookingState.setDestinationPincode(record.pincode);
        checkPincodeServiceability(record.pincode, 'destination');
      }
    }
    
    // Only close modals if explicitly requested
    if (closeModals) {
      setPhoneSearchModalOpen({ type: null, phoneNumber: '' });
      setPhoneSearchResults([]);
      setPhoneModalOpen({ type: null });
      
      if (type === 'origin') {
        setCurrentSection('destination');
      }
    }
  };

  // Handle origin pincode change (for serviceability step)
  const handleOriginPincodeChange = (value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 6) return;
    bookingState.setOriginPincode(value);
    if (value.length === 6) {
      checkPincodeServiceability(value, 'origin');
    } else {
      bookingState.setOriginServiceable(null);
      bookingState.setOriginAddressInfo('');
    }
  };

  // Handle destination pincode change (for serviceability step)
  const handleDestinationPincodeChange = (value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 6) return;
    bookingState.setDestinationPincode(value);
    if (value.length === 6) {
      checkPincodeServiceability(value, 'destination');
    } else {
      bookingState.setDestinationServiceable(null);
      bookingState.setDestinationAddressInfo('');
    }
  };

  // Handle serviceability step next
  const handleServiceabilityNext = () => {
    if (bookingState.originServiceable === true && bookingState.destinationServiceable === true) {
      bookingState.markStepComplete(0);
      bookingState.nextStep();
    }
  };

  // Pincode lookup function (for address forms)
  const handlePincodeLookup = async (pincode: string, type: 'origin' | 'destination') => {
    try {
      const response = await axios.get(`${API_BASE}/api/pincode/lookup`, {
        params: { pincode }
      });

      if (response.data && response.data.success) {
        const pincodeData = response.data.data;
        
        if (type === 'origin') {
          bookingState.setOriginData(prev => ({
            ...prev,
            area: pincodeData.area || prev.area,
            city: pincodeData.city || prev.city,
            district: pincodeData.district || prev.district,
            state: pincodeData.state || prev.state
          }));
          bookingState.setOriginServiceable(pincodeData.serviceable !== false);
        } else {
          bookingState.setDestinationData(prev => ({
            ...prev,
            area: pincodeData.area || prev.area,
            city: pincodeData.city || prev.city,
            district: pincodeData.district || prev.district,
            state: pincodeData.state || prev.state
          }));
          bookingState.setDestinationServiceable(pincodeData.serviceable !== false);
        }
      }
    } catch (error) {
      console.error('Pincode lookup error:', error);
      if (type === 'origin') {
        bookingState.setOriginServiceable(false);
      } else {
        bookingState.setDestinationServiceable(false);
      }
    }
  };

  const handleOriginNext = () => {
    bookingState.markStepComplete(1);
    bookingState.nextStep();
  };

  const handleDestinationNext = () => {
    bookingState.markStepComplete(2);
    bookingState.nextStep();
  };

  const handleShipmentNext = () => {
    bookingState.markStepComplete(3);
    bookingState.nextStep();
  };

  const handleMaterialNext = () => {
    bookingState.markStepComplete(4);
    bookingState.nextStep();
  };

  const handleUploadNext = () => {
    bookingState.markStepComplete(5);
    bookingState.nextStep();
  };

  const handleReviewNext = () => {
    bookingState.markStepComplete(6);
    bookingState.nextStep();
  };

  const handleBillNext = () => {
    bookingState.markStepComplete(7);
    bookingState.nextStep();
  };

  const handleDetailsNext = () => {
    bookingState.markStepComplete(8);
    bookingState.nextStep();
  };

  // Helper function to parse invoice values (remove commas and convert to number)
  const parseInvoiceValue = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    return parseFloat(String(value).replace(/,/g, '')) || 0;
  };

  // Helper function to parse price (remove any formatting)
  const parsePrice = (value: string): number => {
    const cleaned = value.replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  // Handle invoice download
  const handleDownloadInvoice = useCallback(async () => {
    if (!invoiceContentRef.current) {
      return;
    }

    try {
      setDownloadingInvoice(true);
      const scale =
        typeof window !== "undefined"
          ? Math.min(window.devicePixelRatio || 2, 2)
          : 2;

      const canvas = await html2canvas(invoiceContentRef.current, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = bookingResult?.bookingReference || bookingResult?.consignmentNumber || 'invoice';
      pdf.save(`invoice-${fileName}.pdf`);
      toast({
        title: "Invoice downloaded",
        description: `${fileName} saved as PDF.`,
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
  }, [invoiceContentRef, bookingResult, toast]);

  // Submit booking function
  const submitBooking = async () => {
    try {
      bookingState.setIsSubmitting(true);
      bookingState.setSubmitError(null);

      console.log('Starting booking submission process...');
      
      // 1) Fetch next consignment number for this office user (optional - only if officeToken exists)
      // If no officeToken (e.g., admin user), backend will generate using global sequence
      let nextConsignmentNumber: number | null = null;
      const officeToken = localStorage.getItem('officeToken');
      if (officeToken) {
        try {
          const nextRes = await axios.get(`${API_BASE}/api/office/consignment/next`, {
            headers: { Authorization: `Bearer ${officeToken}` }
          });
          nextConsignmentNumber = nextRes?.data?.consignmentNumber ?? null;
          // If no consignment number from office user assignment, backend will use global sequence
          if (!nextConsignmentNumber) {
            console.log('No office user consignment assignment found, backend will use global sequence');
          }
        } catch (e: any) {
          // Log error but don't fail - backend will generate consignment number
          console.warn('Could not fetch office user consignment number, backend will generate:', e?.message || 'Unknown error');
        }
      } else {
        // No officeToken (likely admin user) - backend will generate using global sequence
        console.log('No officeToken found, backend will generate consignment number using global sequence');
      }
      
      // Frontend validation
      const requiredSender: Array<[string, string]> = [
        ['name', bookingState.originData.name],
        ['email', bookingState.originData.email],
        ['phone', bookingState.originData.mobileNumber],
        ['pincode', bookingState.originData.pincode],
        ['state', bookingState.originData.state],
        ['city', bookingState.originData.city],
        ['district', bookingState.originData.district],
        ['area', bookingState.originData.area],
        ['addressLine1', bookingState.originData.flatBuilding]
      ];
      const missingSender = requiredSender.filter(([_, val]) => !val || String(val).trim() === '').map(([key]) => key);
      if (missingSender.length > 0) {
        const errorMsg = `Please complete sender fields: ${missingSender.join(', ')}`;
        bookingState.setSubmitError(errorMsg);
        bookingState.setIsSubmitting(false);
        return;
      }

      const requiredReceiver: Array<[string, string]> = [
        ['name', bookingState.destinationData.name],
        ['email', bookingState.destinationData.email],
        ['phone', bookingState.destinationData.mobileNumber],
        ['pincode', bookingState.destinationData.pincode],
        ['state', bookingState.destinationData.state],
        ['city', bookingState.destinationData.city],
        ['district', bookingState.destinationData.district],
        ['area', bookingState.destinationData.area],
        ['addressLine1', bookingState.destinationData.flatBuilding]
      ];
      const missingReceiver = requiredReceiver.filter(([_, val]) => !val || String(val).trim() === '').map(([key]) => key);
      if (missingReceiver.length > 0) {
        const errorMsg = `Please complete receiver fields: ${missingReceiver.join(', ')}`;
        bookingState.setSubmitError(errorMsg);
        bookingState.setIsSubmitting(false);
        return;
      }

      console.log('Validation passed, proceeding with file uploads to AWS S3...');
      
      // Upload images to S3 using BookNow endpoints (same structure as BookNow.tsx)
      const uploadImagesToS3 = async () => {
        try {
          const imageUrls: string[] = [];
          
          // Upload package images if any (using BookNow endpoint)
          if (bookingState.uploadData.packageImages && bookingState.uploadData.packageImages.length > 0) {
            const formData = new FormData();
            bookingState.uploadData.packageImages.forEach((file) => {
              formData.append('packageImages', file);
            });

            const response = await fetch(`${API_BASE}/api/upload/booknow/package-images`, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to upload package images');
            }

            const result = await response.json();
            if (result.success && result.files) {
              result.files.forEach((file: any) => {
                imageUrls.push(file.url);
              });
            }
          }

          // Upload insurance document if exists (using BookNow endpoint)
          let insuranceDocUrl: string | null = null;
          if (bookingState.shipmentData.insuranceDocument) {
            const formData = new FormData();
            formData.append('insuranceDocument', bookingState.shipmentData.insuranceDocument);

            const response = await fetch(`${API_BASE}/api/upload/booknow/insurance-document`, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to upload insurance document');
            }

            const result = await response.json();
            if (result.success && result.file) {
              insuranceDocUrl = result.file.url;
            }
          }
          
          return { imageUrls, insuranceDocUrl };
        } catch (error) {
          console.error('Error uploading images to S3:', error);
          throw error;
        }
      };

      // Upload images to S3
      const { imageUrls = [], insuranceDocUrl = null } = await uploadImagesToS3();
      console.log('✅ Images uploaded to S3:', {
        packageImages: imageUrls.length,
        insuranceDocument: insuranceDocUrl ? 'Yes' : 'No'
      });

      // Calculate weights from uploadData
      const actualWeight = parseFloat(bookingState.uploadData.weight || '0') || 0;
      const lengthValue = parseFloat(bookingState.uploadData.length || '0') || 0;
      const widthValue = parseFloat(bookingState.uploadData.width || '0') || 0;
      const heightValue = parseFloat(bookingState.uploadData.height || '0') || 0;
      const VOLUMETRIC_DIVISOR = 5000;
      
      let volumetricWeight = 0;
      if (lengthValue > 0 && widthValue > 0 && heightValue > 0) {
        const volume = lengthValue * widthValue * heightValue;
        if (Number.isFinite(volume) && volume > 0) {
          volumetricWeight = parseFloat((volume / VOLUMETRIC_DIVISOR).toFixed(2));
        }
      }

      const chargeableWeight = Math.max(actualWeight, volumetricWeight);
      const formattedChargeableWeight = Number.isFinite(chargeableWeight) && chargeableWeight > 0 ? parseFloat(chargeableWeight.toFixed(2)) : 0;

      // Map shipping mode from OfficeBookingPanel format to BookNow format
      const mapShippingMode = (mode: 'Air' | 'Surface' | 'Train'): string => {
        switch (mode) {
          case 'Air': return 'byAir';
          case 'Train': return 'byTrain';
          case 'Surface': return 'byRoad';
          default: return 'byAir';
        }
      };

      // Map service type (Standard/Priority to lowercase)
      const mappedServiceType = bookingState.shipmentData.services?.toLowerCase() || 'standard';
      const mappedShippingMode = mapShippingMode(bookingState.shipmentData.mode);

      // Calculate price from detailsData grandTotal (remove any formatting)
      const parsePrice = (value: string): number => {
        const cleaned = value.replace(/[^\d.]/g, '');
        return parseFloat(cleaned) || 0;
      };
      const calculatedPrice = parsePrice(bookingState.detailsData.grandTotal);

      // Get currentStatus from paymentData (optional - no default)
      const currentStatus = bookingState.paymentData.currentStatus;

      // Build booking payload matching BookNow structure exactly
      const bookingPayload: any = {
        origin: {
          ...bookingState.originData,
          alternateNumbers: bookingState.originData.alternateNumbers.filter(num => num.trim() !== '')
        },
        destination: {
          ...bookingState.destinationData,
          alternateNumbers: bookingState.destinationData.alternateNumbers.filter(num => num.trim() !== '')
        },
        shipment: {
          natureOfConsignment: bookingState.shipmentData.natureOfConsignment || 'NON-DOX',
          insurance: bookingState.shipmentData.insurance || 'Without insurance',
          riskCoverage: bookingState.shipmentData.riskCoverage || 'Owner',
          packagesCount: bookingState.uploadData.totalPackages || '',
          materials: bookingState.uploadData.materials || '',
          others: bookingState.uploadData.others || '',
          description: bookingState.uploadData.contentDescription || '',
          declaredValue: bookingState.uploadData.declaredValue || '',
          weight: bookingState.uploadData.weight || '',
          length: bookingState.uploadData.length || '',
          width: bookingState.uploadData.width || '',
          height: bookingState.uploadData.height || '',
          insuranceCompanyName: bookingState.shipmentData.insuranceCompanyName || '',
          insurancePolicyNumber: bookingState.shipmentData.insurancePolicyNumber || '',
          insurancePolicyDate: bookingState.shipmentData.insurancePolicyDate || '',
          insuranceValidUpto: bookingState.shipmentData.insuranceValidUpto || '',
          insurancePremiumAmount: bookingState.shipmentData.insurancePremiumAmount || '',
          insuranceDocumentName: bookingState.shipmentData.insuranceDocumentName || '',
          insuranceDocument: insuranceDocUrl || '', // URL string instead of File
          declarationDocumentName: bookingState.uploadData.declarationDocumentName || '',
          declarationDocument: '' // Not used in office booking but included for structure match
        },
        packageImages: imageUrls, // Array of URLs from S3
        shippingMode: mappedShippingMode,
        serviceType: mappedServiceType,
        calculatedPrice: calculatedPrice > 0 ? calculatedPrice : null,
        actualWeight: actualWeight > 0 ? actualWeight : null,
        volumetricWeight: volumetricWeight > 0 ? volumetricWeight : null,
        chargeableWeight: formattedChargeableWeight > 0 ? formattedChargeableWeight : null,
        originServiceable: bookingState.originServiceable,
        destinationServiceable: bookingState.destinationServiceable,
        originAddressInfo: bookingState.originAddressInfo,
        destinationAddressInfo: bookingState.destinationAddressInfo,
        onlineCustomerId: null, // Office bookings don't have online customer ID
        // Include currentStatus only if it's set
        ...(currentStatus && { currentStatus }),
        // Include courierBoyId if currentStatus is 'picked' and courierBoyId is set
        ...(currentStatus === 'picked' && bookingState.paymentData.courierBoyId && { 
          courierBoyId: bookingState.paymentData.courierBoyId 
        }),
        paymentInfo: {
          // If Cash is selected, payment status is 'paid', otherwise 'pending'
          paymentStatus: bookingState.paymentData.modeOfPayment === 'Cash' ? 'paid' : 'pending',
          // Map payment method: 'Cash' -> 'cod', 'To Pay' -> 'pay_later'
          paymentMethod: bookingState.paymentData.modeOfPayment === 'Cash' ? 'cod' : 
                         bookingState.paymentData.modeOfPayment === 'To Pay' ? 'pay_later' : '',
          razorpayOrderId: '',
          razorpayPaymentId: '',
          razorpaySignature: ''
        },
        // Include pricing details for invoice generation
        detailsData: {
          freightCharge: bookingState.detailsData.freightCharge || '',
          awbCharge: bookingState.detailsData.awbCharge || '',
          pickupCharge: bookingState.detailsData.pickupCharge || '',
          localCollection: bookingState.detailsData.localCollection || '',
          doorDelivery: bookingState.detailsData.doorDelivery || '',
          loadingUnloading: bookingState.detailsData.loadingUnloading || '',
          demurrageCharge: bookingState.detailsData.demurrageCharge || '',
          ddaCharge: bookingState.detailsData.ddaCharge || '',
          hamaliCharge: bookingState.detailsData.hamaliCharge || '',
          packingCharge: bookingState.detailsData.packingCharge || '',
          otherCharge: bookingState.detailsData.otherCharge || '',
          total: bookingState.detailsData.total || '',
          fuelCharge: bookingState.detailsData.fuelCharge || '',
          fuelChargeType: bookingState.detailsData.fuelChargeType || 'percentage',
          sgstAmount: bookingState.detailsData.sgstAmount || '',
          cgstAmount: bookingState.detailsData.cgstAmount || '',
          igstAmount: bookingState.detailsData.igstAmount || '',
          grandTotal: bookingState.detailsData.grandTotal || ''
        },
        // Include declared value from upload data
        invoiceValue: bookingState.uploadData.invoiceValue || ''
      };

      console.log('🚀 Starting office booking submission to office-booking/create...');
      console.log('API_BASE:', API_BASE);
      console.log('Booking payload:', bookingPayload);
      
      // Use the new office-booking endpoint (separate from customer-booking)
      const response = await fetch(`${API_BASE}/api/office-booking/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });
      
      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('❌ Backend error response:', errorData);
        } catch (parseError) {
          // If response is not JSON, use status text
          console.error('❌ Failed to parse error response as JSON:', parseError);
          throw new Error(`Failed to save booking: ${response.status} ${response.statusText || 'Unknown error'}`);
        }
        const errorMessage = errorData.message || errorData.error || 'Failed to save booking';
        const errorDetails = Array.isArray(errorData.details) ? `: ${errorData.details.join('; ')}` : '';
        throw new Error(errorMessage + errorDetails);
      }

      const result = await response.json();
      const bookingId = result.data?.bookingId || result.data?._id;
      const bookingReference = result.data?.bookingReference;
      const consignmentNumber = result.data?.consignmentNumber || nextConsignmentNumber;
      
      console.log('✅ Booking submitted successfully:', {
        bookingId,
        bookingReference,
        consignmentNumber
      });
      
      // Store booking result for success page
      setBookingResult({
        consignmentNumber,
        bookingReference,
        bookingId
      });
      
      // Mark booking as submitted and move to success step
      bookingState.setSubmitSuccess(true);
      bookingState.setCurrentStep(11);
      bookingState.setCompletedSteps(Array(bookingState.steps.length).fill(true));
      
      // Record consignment usage (non-blocking) if we have a consignment number and officeToken
      // Only record usage for office users with assigned consignment numbers
      if (consignmentNumber && bookingId) {
        try {
          const officeToken = localStorage.getItem('officeToken');
          if (officeToken) {
            await axios.post(`${API_BASE}/api/office/consignment/use`, {
              consignmentNumber: consignmentNumber,
              bookingReference: bookingReference || bookingId,
              bookingData: bookingPayload
            }, {
              headers: { Authorization: `Bearer ${officeToken}` }
            });
            
            const officeUserId = localStorage.getItem('officeUserId');
            if (officeUserId) {
              const event = new CustomEvent('consignmentUsageUpdated', {
                detail: {
                  officeUserId: officeUserId,
                  assignmentType: 'office_user',
                  consignmentNumber: consignmentNumber,
                  bookingReference: bookingReference || bookingId
                }
              });
              window.dispatchEvent(event);
            }
          }
        } catch (usageErr) {
          console.warn('Failed to record consignment usage:', usageErr);
        }
      }
      
    } catch (err: any) {
      console.error('Booking submission error:', err);
      
      // Handle fetch errors properly (fetch doesn't have err.response like axios)
      if (err.message && err.message.includes('upload')) {
        bookingState.setSubmitError(`Upload failed: ${err.message}`);
      } else if (err.message) {
        // For fetch, the error message is already set in the Error object from the throw statement
        bookingState.setSubmitError(err.message);
      } else {
        // Fallback for network errors or other unexpected errors
        const errorMsg = err?.toString() || "Failed to submit booking. Please check your connection and try again.";
        bookingState.setSubmitError(errorMsg);
      }
    } finally {
      bookingState.setIsSubmitting(false);
    }
  };

  const handlePaymentNext = () => {
    bookingState.markStepComplete(9);
    bookingState.nextStep();
  };

  const handleFinalReviewSubmit = async () => {
    bookingState.markStepComplete(10);
    await submitBooking();
  };

  const handleOtherPartyPincodeLookup = async (pincode: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/pincode/lookup`, {
        params: { pincode }
      });

      if (response.data && response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Pincode lookup error:', error);
    }
    return {};
  };

  const handlePackageInfoChange = (field: string, value: string) => {
    bookingState.setUploadData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePackageImagesChange = (images: File[]) => {
    bookingState.setUploadData(prev => ({
      ...prev,
      packageImages: images
    }));
  };

  // Validation checks
  const isOriginPhoneComplete = bookingState.originData.mobileNumber.length === 10;
  const isDestinationPhoneComplete = bookingState.destinationData.mobileNumber.length === 10;

  const isOriginFormComplete = isOriginPhoneComplete && [
    bookingState.originData.name,
    bookingState.originData.flatBuilding,
    bookingState.originData.locality,
    bookingState.originData.area,
    bookingState.originData.city,
    bookingState.originData.state,
  ].every((field) => field && String(field).trim().length > 0);

  const isDestinationFormComplete = isDestinationPhoneComplete && [
    bookingState.destinationData.name,
    bookingState.destinationData.flatBuilding,
    bookingState.destinationData.locality,
    bookingState.destinationData.area,
    bookingState.destinationData.city,
    bookingState.destinationData.state,
  ].every((field) => field && String(field).trim().length > 0);

  // OTP digit handlers for origin
  const handleOriginOtpDigitChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    if (value.length > 1) return;
    
    const newDigits = [...originOtpDigits];
    newDigits[index] = value;
    setOriginOtpDigits(newDigits);
    setOriginOtpError(null);
    
    // Auto-focus next input
    if (value && index < 5) {
      setTimeout(() => {
        const nextInput = document.getElementById('origin-otp-digit-' + (index + 1));
        nextInput?.focus();
      }, 0);
    }
    
    // Auto-verify when 6 digits are entered
    const updatedDigits = [...newDigits];
    updatedDigits[index] = value;
    const otp = updatedDigits.filter(digit => digit !== '').join('');
    if (otp.length === 6) {
      // Use setTimeout to ensure state is updated before verification
      setTimeout(() => {
        verifyOriginOTP(otp);
      }, 100);
    }
  };

  const handleOriginOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !originOtpDigits[index] && index > 0) {
      e.preventDefault();
      const prevInput = document.getElementById('origin-otp-digit-' + (index - 1));
      prevInput?.focus();
      handleOriginOtpDigitChange(index - 1, '');
    }
  };

  // GST validation function - validates and formats input
  const validateGSTFormat = (value: string): string => {
    // Convert to uppercase first, then remove any non-alphanumeric characters
    let cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Limit to 15 characters
    cleanValue = cleanValue.slice(0, 15);
    
    // Apply GST format rules - filter characters based on position
    let formattedValue = '';
    
    for (let i = 0; i < cleanValue.length; i++) {
      const char = cleanValue[i];
      
      if (i < 2) {
        // First 2 positions: State code (numbers only)
        if (/[0-9]/.test(char)) {
          formattedValue += char;
        }
      } else if (i < 7) {
        // Positions 2-6: First part of PAN (letters only)
        if (/[A-Z]/.test(char)) {
          formattedValue += char;
        }
      } else if (i < 11) {
        // Positions 7-10: Second part of PAN (numbers only)
        if (/[0-9]/.test(char)) {
          formattedValue += char;
        }
      } else if (i === 11) {
        // Position 11: Third part of PAN (letter only)
        if (/[A-Z]/.test(char)) {
          formattedValue += char;
        }
      } else if (i === 12) {
        // Position 12: Registration number (1-9 or A-Z)
        if (/[1-9A-Z]/.test(char)) {
          formattedValue += char;
        }
      } else if (i === 13) {
        // Position 13: Default letter (always Z)
        if (char === 'Z') {
          formattedValue += char;
        }
      } else if (i === 14) {
        // Position 14: Checksum (number or letter)
        if (/[0-9A-Z]/.test(char)) {
          formattedValue += char;
        }
      }
    }
    
    return formattedValue;
  };

  // Handle origin GST input change
  const handleOriginGstChange = (value: string) => {
    const validatedValue = validateGSTFormat(value);
    bookingState.setOriginData(prev => ({ ...prev, gstNumber: validatedValue }));
  };

  // Handle destination GST input change
  const handleDestinationGstChange = (value: string) => {
    const validatedValue = validateGSTFormat(value);
    bookingState.setDestinationData(prev => ({ ...prev, gstNumber: validatedValue }));
  };

  // Review step state
  const [editingSection, setEditingSection] = useState<'origin' | 'destination' | 'shipment' | 'package' | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Update image previews when packageImages change
  useEffect(() => {
    if (bookingState.currentStep === 6) {
      const newPreviews: string[] = [];
      bookingState.uploadData.packageImages.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === bookingState.uploadData.packageImages.length) {
            setImagePreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
      if (bookingState.uploadData.packageImages.length === 0) {
        setImagePreviews([]);
      }
    }
  }, [bookingState.uploadData.packageImages, bookingState.currentStep]);

  // Review step options
  const addressTypeOptions = ['Home', 'Office', 'Others'];
  const packageTypeOptions = [
    { value: 'Auto & Machine Parts', icon: Package },
    { value: 'Books', icon: FileText },
    { value: 'Documents', icon: FileText },
    { value: 'Clothing (General)', icon: Package },
    { value: 'Electronics', icon: Package },
    { value: 'Medicines', icon: Package },
    { value: 'Others', icon: Package }
  ];
  const insuranceOptions = [
    { value: 'Without insurance', icon: Package },
    { value: 'With insurance', icon: Package }
  ];
  const riskCoverageOptions = [
    { value: 'Owner', icon: Package },
    { value: 'Carrier', icon: Package }
  ];

  // Helper functions for review step
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

  // Alternate number handlers
  const handleAlternateNumberChange = (
    type: 'origin' | 'destination',
    index: number,
    value: string
  ) => {
    if (type === 'origin') {
      bookingState.setOriginData((prev) => {
        const updated = [...(prev.alternateNumbers || [])];
        updated[index] = value;
        return { ...prev, alternateNumbers: updated };
      });
    } else {
      bookingState.setDestinationData((prev) => {
        const updated = [...(prev.alternateNumbers || [])];
        updated[index] = value;
        return { ...prev, alternateNumbers: updated };
      });
    }
  };

  const addAlternateNumber = (type: 'origin' | 'destination') => {
    if (type === 'origin') {
      bookingState.setOriginData((prev) => ({
        ...prev,
        alternateNumbers: [...(prev.alternateNumbers || []), ''],
      }));
    } else {
      bookingState.setDestinationData((prev) => ({
        ...prev,
        alternateNumbers: [...(prev.alternateNumbers || []), ''],
      }));
    }
  };

  const removeAlternateNumber = (type: 'origin' | 'destination', index: number) => {
    if (type === 'origin') {
      bookingState.setOriginData((prev) => {
        const updated = [...(prev.alternateNumbers || [])];
        updated.splice(index, 1);
        return { ...prev, alternateNumbers: updated.length ? updated : [''] };
      });
    } else {
      bookingState.setDestinationData((prev) => {
        const updated = [...(prev.alternateNumbers || [])];
        updated.splice(index, 1);
        return { ...prev, alternateNumbers: updated.length ? updated : [''] };
      });
    }
  };

  // Auto-open phone modal when entering step 1 if phone not complete
  useEffect(() => {
    if (bookingState.currentStep === 1 && !isOriginPhoneComplete && !phoneModalOpen.type && !formModalOpen.type && !showPreviewInModal && !showOriginOtpVerification) {
      setTimeout(() => {
        setPhoneModalOpen({ type: 'origin' });
        setCurrentSection('origin');
      }, 300);
    }
  }, [bookingState.currentStep, isOriginPhoneComplete, phoneModalOpen.type, formModalOpen.type, showPreviewInModal, showOriginOtpVerification]);

  // Auto-open phone modal when entering step 2 if destination phone not complete
  useEffect(() => {
    if (bookingState.currentStep === 2 && !isDestinationPhoneComplete && !phoneModalOpen.type && !formModalOpen.type && !showPreviewInModal && isOriginFormComplete) {
      setTimeout(() => {
        setPhoneModalOpen({ type: 'destination' });
        setCurrentSection('destination');
      }, 300);
    }
  }, [bookingState.currentStep, isDestinationPhoneComplete, phoneModalOpen.type, formModalOpen.type, showPreviewInModal, isOriginFormComplete]);

  // Auto-focus first input when phone modal opens
  useEffect(() => {
    if (phoneModalOpen.type) {
      setTimeout(() => {
        const firstInput = document.getElementById(getDigitInputId(phoneModalOpen.type!, 0));
        firstInput?.focus();
      }, 100);
    }
  }, [phoneModalOpen.type]);

  const renderCurrentStep = () => {
    switch (bookingState.currentStep) {
      case 0: // Serviceability
        return (
          <ServiceabilityStep
            originPincode={bookingState.originPincode}
            destinationPincode={bookingState.destinationPincode}
            onOriginPincodeChange={handleOriginPincodeChange}
            onDestinationPincodeChange={handleDestinationPincodeChange}
            originServiceable={bookingState.originServiceable}
            destinationServiceable={bookingState.destinationServiceable}
            checkingOrigin={bookingState.checkingOrigin}
            checkingDestination={bookingState.checkingDestination}
            originAddressInfo={bookingState.originAddressInfo}
            destinationAddressInfo={bookingState.destinationAddressInfo}
            onNext={handleServiceabilityNext}
            isDarkMode={isDarkMode}
          />
        );
      
      case 1: // Origin
        return (
          <OriginStep
            data={bookingState.originData}
            onChange={bookingState.setOriginData}
            onNext={handleOriginNext}
            originServiceable={bookingState.originServiceable}
            originPincode={bookingState.originPincode}
            originAreas={originAreas}
            originMobileDigits={originMobileDigits}
            onOriginDigitChange={handleOriginDigitChange}
            phoneModalOpen={phoneModalOpen.type === 'origin'}
            formModalOpen={formModalOpen.type === 'origin'}
            showPreviewInModal={showPreviewInModal && formModalOpen.type === 'origin'}
            phoneSearchResults={phoneSearchResults}
            selectedRecordIndex={selectedRecordIndex}
            onSelectRecord={(record) => handleSelectPhoneRecord(record, 'origin', true)}
            onSetSelectedRecordIndex={setSelectedRecordIndex}
            onClosePhoneModal={() => setPhoneModalOpen({ type: null })}
            onCloseFormModal={() => {
              setFormModalOpen({ type: null });
              setShowPreviewInModal(false);
            }}
            onOpenFormModal={() => setFormModalOpen({ type: 'origin' })}
            onShowPreview={() => setShowPreviewInModal(true)}
            onHidePreview={() => setShowPreviewInModal(false)}
            onPincodeCheck={(pincode) => handlePincodeLookup(pincode, 'origin')}
            onPhoneSearch={(phoneNumber) => searchByPhoneNumber(phoneNumber, 'origin')}
            searchingPhone={searchingPhone}
            isFormComplete={isOriginFormComplete}
            onAlternateNumberChange={(index, value) => handleAlternateNumberChange('origin', index, value)}
            onAddAlternateNumber={() => addAlternateNumber('origin')}
            onRemoveAlternateNumber={(index) => removeAlternateNumber('origin', index)}
            isDarkMode={isDarkMode}
            showOriginOtpVerification={showOriginOtpVerification}
            onOriginGstChange={handleOriginGstChange}
            originOtpDigits={originOtpDigits}
            originOtpVerified={originOtpVerified}
            originOtpError={originOtpError}
            isOriginOtpSending={isOriginOtpSending}
            onOriginOtpDigitChange={handleOriginOtpDigitChange}
            onOriginOtpKeyDown={handleOriginOtpKeyDown}
            onResendOriginOtp={() => {
              const mobileNumber = originMobileDigits.filter(digit => digit !== '').join('');
              sendOriginOTP(mobileNumber);
            }}
            onCloseOriginOtp={() => {
              setShowOriginOtpVerification(false);
              setOriginOtpDigits(Array(6).fill(''));
              setOriginOtpVerified(false);
              setOriginOtpError(null);
            }}
          />
        );
      
      case 2: // Destination
        return (
          <DestinationStep
            data={bookingState.destinationData}
            onChange={bookingState.setDestinationData}
            onNext={handleDestinationNext}
            onPrevious={bookingState.previousStep}
            destinationServiceable={bookingState.destinationServiceable}
            destinationPincode={bookingState.destinationPincode}
            destinationAreas={destinationAreas}
            destinationMobileDigits={destinationMobileDigits}
            onDestinationDigitChange={handleDestinationDigitChange}
            phoneModalOpen={phoneModalOpen.type === 'destination'}
            formModalOpen={formModalOpen.type === 'destination'}
            showPreviewInModal={showPreviewInModal && formModalOpen.type === 'destination'}
            phoneSearchResults={phoneSearchResults}
            selectedRecordIndex={selectedRecordIndex}
            onSelectRecord={(record) => handleSelectPhoneRecord(record, 'destination', true)}
            onSetSelectedRecordIndex={setSelectedRecordIndex}
            onClosePhoneModal={() => setPhoneModalOpen({ type: null })}
            onCloseFormModal={() => {
              setFormModalOpen({ type: null });
              setShowPreviewInModal(false);
            }}
            onOpenFormModal={() => setFormModalOpen({ type: 'destination' })}
            onShowPreview={() => setShowPreviewInModal(true)}
            onHidePreview={() => setShowPreviewInModal(false)}
            onPincodeCheck={(pincode) => handlePincodeLookup(pincode, 'destination')}
            onPhoneSearch={(phoneNumber) => searchByPhoneNumber(phoneNumber, 'destination')}
            searchingPhone={searchingPhone}
            isFormComplete={isDestinationFormComplete}
            onAlternateNumberChange={(index, value) => handleAlternateNumberChange('destination', index, value)}
            onAddAlternateNumber={() => addAlternateNumber('destination')}
            onRemoveAlternateNumber={(index) => removeAlternateNumber('destination', index)}
            isDarkMode={isDarkMode}
            onDestinationGstChange={handleDestinationGstChange}
          />
        );
      
      case 3: // Shipment Details (Nature, Insurance, Risk Coverage)
        return (
          <ShipmentDetailsStep
            data={bookingState.shipmentData}
            onChange={bookingState.setShipmentData}
            onNext={handleShipmentNext}
            onPrevious={bookingState.previousStep}
            isDarkMode={isDarkMode}
          />
        );
      
      case 4: // Material Details (Package info, images, dimensions, weight)
        return (
          <MaterialDetailsStep
            uploadData={bookingState.uploadData}
            onUploadDataChange={bookingState.setUploadData}
            onNext={handleMaterialNext}
            onPrevious={bookingState.previousStep}
            isChargeableFixed={bookingState.isChargeableFixed}
            onChargeableFixedChange={bookingState.setIsChargeableFixed}
            isDarkMode={isDarkMode}
          />
        );
      
      case 5: // Upload
        return (
          <UploadStep
            data={bookingState.uploadData}
            onChange={bookingState.setUploadData}
            onNext={handleUploadNext}
            onPrevious={bookingState.previousStep}
            isDarkMode={isDarkMode}
          />
        );
      
      case 6: // Review & Edit
        return (() => {
          const originAlternates = bookingState.originData.alternateNumbers?.filter((num) => num.trim()) || [];
          const destinationAlternates = bookingState.destinationData.alternateNumbers?.filter((num) => num.trim()) || [];
          
          const formatDate = (value: string) => {
            if (!value) return null;
            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) return null;
            return parsed.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
          };
          
          const renderAddress = (data: typeof bookingState.originData) => {
            const lines = [
              [data.flatBuilding, data.landmark].filter(Boolean).join(', '),
              [data.locality, data.area].filter(Boolean).join(', '),
              [data.city, data.state, data.pincode].filter(Boolean).join(', ')
            ].filter((line) => line);
            return lines.join(', ');
          };

          // Calculate weights for display
          const lengthValue = parseFloat(bookingState.uploadData.length || '0') || 0;
          const widthValue = parseFloat(bookingState.uploadData.width || '0') || 0;
          const heightValue = parseFloat(bookingState.uploadData.height || '0') || 0;
          const actualWeight = parseFloat(bookingState.uploadData.weight || '0') || 0;
          const VOLUMETRIC_DIVISOR = 5000;
          
          let volumetricWeight = 0;
          if (lengthValue > 0 && widthValue > 0 && heightValue > 0) {
            const volume = lengthValue * widthValue * heightValue;
            if (Number.isFinite(volume) && volume > 0) {
              volumetricWeight = parseFloat((volume / VOLUMETRIC_DIVISOR).toFixed(2));
            }
          }
          
          const chargeableWeight = Math.max(actualWeight, volumetricWeight);
          const displayActualWeight = actualWeight > 0 ? `${actualWeight.toFixed(2)} kg` : '—';
          const displayVolumetricWeight = volumetricWeight > 0 ? `${volumetricWeight.toFixed(2)} kg` : '—';
          const displayChargeableWeight = chargeableWeight > 0 ? `${chargeableWeight.toFixed(2)} kg` : '—';

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="space-y-2.5">
                {/* Origin Address */}
                <div className={cn(
                  'rounded-lg border p-2.5 transition-all duration-200',
                  isDarkMode
                    ? 'border-slate-800/50 bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-800/80 hover:border-blue-500/30'
                    : 'border-slate-200/60 bg-gradient-to-br from-slate-100/90 via-blue-50/70 to-slate-100/90 hover:border-blue-400/50'
                )}>
                  <div className={cn(
                    'flex items-center justify-between mb-2',
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    <h4 className={cn(
                      'text-sm font-semibold flex items-center gap-1.5',
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    )}>
                      <MapPin className="h-3.5 w-3.5" />
                      Sender :
                    </h4>
                    <div className="flex items-center gap-2">
                      {bookingState.originData.addressType && (
                        <span className={cn(
                          'text-xs font-semibold px-3 py-1.5 rounded-full border-2 shadow-sm',
                          'uppercase tracking-wide',
                          isDarkMode 
                            ? 'text-blue-300 bg-blue-500/20 border-blue-400/40 shadow-blue-500/10' 
                            : 'text-blue-700 bg-blue-50 border-blue-300 shadow-blue-200/50'
                        )}>
                          {bookingState.originData.addressType}
                        </span>
                      )}
                      <button
                        onClick={() => setEditingSection(editingSection === 'origin' ? null : 'origin')}
                        className={cn(
                          'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                          isDarkMode
                            ? 'text-blue-300 hover:bg-blue-500/20'
                            : 'text-blue-600 hover:bg-blue-50'
                        )}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {/* Line 1: Company name, Concern person */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <p className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                        {bookingState.originData.companyName || ''}
                      </p>
                      <p className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>{bookingState.originData.name}</p>
                    </div>
                    
                    {/* Line 2: Address */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="md:col-span-3">
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{renderAddress(bookingState.originData)}</p>
                      </div>
                    </div>
                    
                    {/* Line 3: Phone, Email, Website */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>+91 {bookingState.originData.mobileNumber}</p>
                      {bookingState.originData.email && (
                        <a 
                          href={`mailto:${bookingState.originData.email}`}
                          className={cn(
                            'text-[9px] sm:text-[10px] md:text-xs font-medium underline hover:opacity-80',
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          )}
                        >
                          {bookingState.originData.email}
                        </a>
                      )}
                      {bookingState.originData.website && (
                        <a 
                          href={bookingState.originData.website.startsWith('http') ? bookingState.originData.website : `https://${bookingState.originData.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'text-[9px] sm:text-[10px] md:text-xs font-medium underline hover:opacity-80',
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          )}
                        >
                          {bookingState.originData.website}
                        </a>
                      )}
                    </div>
                    
                    {/* Line 4: GST, Birthday and Anniversary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {bookingState.originData.gstNumber && (
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{bookingState.originData.gstNumber}</p>
                      )}
                      {bookingState.originData.birthday && (
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                          {formatDate(bookingState.originData.birthday) || bookingState.originData.birthday}
                        </p>
                      )}
                      {bookingState.originData.anniversary && (
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                          {formatDate(bookingState.originData.anniversary) || bookingState.originData.anniversary}
                        </p>
                      )}
                    </div>
                    
                    {/* Alternate Numbers - if any */}
                    {originAlternates && originAlternates.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{originAlternates.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Origin Address Edit Dialog */}
                <Dialog open={editingSection === 'origin'} onOpenChange={(open) => !open && setEditingSection(null)}>
                  <DialogContent className={cn(
                    'max-w-3xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  )}>
                    <DialogHeader>
                      <DialogTitle className={cn(isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                        Edit Sender :
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FloatingInput
                          label="Concern Person"
                          value={bookingState.originData.name}
                          onChange={(value) => bookingState.setOriginData((prev) => ({ ...prev, name: value }))}
                          required
                          isDarkMode={isDarkMode}
                        />
                        <FloatingSelect
                          label="Address Type"
                          value={bookingState.originData.addressType}
                          onChange={(value) => bookingState.setOriginData((prev) => ({ ...prev, addressType: value as any }))}
                          options={addressTypeOptions}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Company Name"
                          value={bookingState.originData.companyName}
                          onChange={(value) => bookingState.setOriginData((prev) => ({ ...prev, companyName: value }))}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Phone"
                          value={`+91 ${bookingState.originData.mobileNumber}`}
                          onChange={() => {}}
                          disabled
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Email"
                          value={bookingState.originData.email}
                          onChange={(value) => bookingState.setOriginData((prev) => ({ ...prev, email: value }))}
                          type="email"
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="GST Number"
                          value={bookingState.originData.gstNumber}
                          onChange={(value) => handleOriginGstChange(value)}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Flat, Building"
                          value={bookingState.originData.flatBuilding}
                          onChange={(value) => bookingState.setOriginData((prev) => ({ ...prev, flatBuilding: value }))}
                          required
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Locality"
                          value={bookingState.originData.locality}
                          onChange={(value) => bookingState.setOriginData((prev) => ({ ...prev, locality: value }))}
                          required
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Landmark"
                          value={bookingState.originData.landmark}
                          onChange={(value) => bookingState.setOriginData((prev) => ({ ...prev, landmark: value }))}
                          isDarkMode={isDarkMode}
                        />
                        {originAreas.length > 0 ? (
                          <FloatingSelect
                            label="Area"
                            value={bookingState.originData.area}
                            onChange={(value) => bookingState.setOriginData((prev) => ({ ...prev, area: value }))}
                            options={originAreas}
                            required
                            isDarkMode={isDarkMode}
                          />
                        ) : (
                          <FloatingInput
                            label="Area"
                            value={bookingState.originData.area}
                            onChange={(value) => bookingState.setOriginData((prev) => ({ ...prev, area: value }))}
                            required
                            isDarkMode={isDarkMode}
                          />
                        )}
                        <FloatingInput
                          label="District"
                          value={bookingState.originData.district}
                          onChange={(_value) => {}}
                          disabled
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Website"
                          value={bookingState.originData.website}
                          onChange={(value) => bookingState.setOriginData((prev) => ({ ...prev, website: value }))}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Birthday"
                          value={bookingState.originData.birthday}
                          onChange={(value) => bookingState.setOriginData((prev) => ({ ...prev, birthday: value }))}
                          type="date"
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Anniversary"
                          value={bookingState.originData.anniversary}
                          onChange={(value) => bookingState.setOriginData((prev) => ({ ...prev, anniversary: value }))}
                          type="date"
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setEditingSection(null)}
                        className={cn(
                          isDarkMode
                            ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setEditingSection(null)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Destination Address - Similar structure */}
                <div className={cn(
                  'rounded-lg border p-2.5 transition-all duration-200',
                  isDarkMode
                    ? 'border-slate-800/50 bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-800/80 hover:border-blue-500/30'
                    : 'border-slate-200/60 bg-gradient-to-br from-slate-100/90 via-blue-50/70 to-slate-100/90 hover:border-blue-400/50'
                )}>
                  <div className={cn(
                    'flex items-center justify-between mb-2',
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    <h4 className={cn(
                      'text-sm font-semibold flex items-center gap-1.5',
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    )}>
                      <MapPin className="h-3.5 w-3.5" />
                      Recipient :
                    </h4>
                    <div className="flex items-center gap-2">
                      {bookingState.destinationData.addressType && (
                        <span className={cn(
                          'text-xs font-semibold px-3 py-1.5 rounded-full border-2 shadow-sm',
                          'uppercase tracking-wide',
                          isDarkMode 
                            ? 'text-blue-300 bg-blue-500/20 border-blue-400/40 shadow-blue-500/10' 
                            : 'text-blue-700 bg-blue-50 border-blue-300 shadow-blue-200/50'
                        )}>
                          {bookingState.destinationData.addressType}
                        </span>
                      )}
                      <button
                        onClick={() => setEditingSection(editingSection === 'destination' ? null : 'destination')}
                        className={cn(
                          'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                          isDarkMode
                            ? 'text-blue-300 hover:bg-blue-500/20'
                            : 'text-blue-600 hover:bg-blue-50'
                        )}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <p className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                        {bookingState.destinationData.companyName || ''}
                      </p>
                      <p className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>{bookingState.destinationData.name}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="md:col-span-3">
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{renderAddress(bookingState.destinationData)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>+91 {bookingState.destinationData.mobileNumber}</p>
                      {bookingState.destinationData.email && (
                        <a 
                          href={`mailto:${bookingState.destinationData.email}`}
                          className={cn(
                            'text-[9px] sm:text-[10px] md:text-xs font-medium underline hover:opacity-80',
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          )}
                        >
                          {bookingState.destinationData.email}
                        </a>
                      )}
                      {bookingState.destinationData.website && (
                        <a 
                          href={bookingState.destinationData.website.startsWith('http') ? bookingState.destinationData.website : `https://${bookingState.destinationData.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'text-[9px] sm:text-[10px] md:text-xs font-medium underline hover:opacity-80',
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          )}
                        >
                          {bookingState.destinationData.website}
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {bookingState.destinationData.gstNumber && (
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{bookingState.destinationData.gstNumber}</p>
                      )}
                      {bookingState.destinationData.birthday && (
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                          {formatDate(bookingState.destinationData.birthday) || bookingState.destinationData.birthday}
                        </p>
                      )}
                      {bookingState.destinationData.anniversary && (
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                          {formatDate(bookingState.destinationData.anniversary) || bookingState.destinationData.anniversary}
                        </p>
                      )}
                    </div>
                    {destinationAlternates && destinationAlternates.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{destinationAlternates.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Destination Address Edit Dialog */}
                <Dialog open={editingSection === 'destination'} onOpenChange={(open) => !open && setEditingSection(null)}>
                  <DialogContent className={cn(
                    'max-w-3xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  )}>
                    <DialogHeader>
                      <DialogTitle className={cn(isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                        Edit Recipient
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FloatingInput
                          label="Concern Person"
                          value={bookingState.destinationData.name}
                          onChange={(value) => bookingState.setDestinationData((prev) => ({ ...prev, name: value }))}
                          required
                          isDarkMode={isDarkMode}
                        />
                        <FloatingSelect
                          label="Address Type"
                          value={bookingState.destinationData.addressType}
                          onChange={(value) => bookingState.setDestinationData((prev) => ({ ...prev, addressType: value as any }))}
                          options={addressTypeOptions}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Company Name"
                          value={bookingState.destinationData.companyName}
                          onChange={(value) => bookingState.setDestinationData((prev) => ({ ...prev, companyName: value }))}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Phone"
                          value={`+91 ${bookingState.destinationData.mobileNumber}`}
                          onChange={() => {}}
                          disabled
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Email"
                          value={bookingState.destinationData.email}
                          onChange={(value) => bookingState.setDestinationData((prev) => ({ ...prev, email: value }))}
                          type="email"
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="GST Number"
                          value={bookingState.destinationData.gstNumber}
                          onChange={(value) => handleDestinationGstChange(value)}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Flat, Building"
                          value={bookingState.destinationData.flatBuilding}
                          onChange={(value) => bookingState.setDestinationData((prev) => ({ ...prev, flatBuilding: value }))}
                          required
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Locality"
                          value={bookingState.destinationData.locality}
                          onChange={(value) => bookingState.setDestinationData((prev) => ({ ...prev, locality: value }))}
                          required
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Landmark"
                          value={bookingState.destinationData.landmark}
                          onChange={(value) => bookingState.setDestinationData((prev) => ({ ...prev, landmark: value }))}
                          isDarkMode={isDarkMode}
                        />
                        {destinationAreas.length > 0 ? (
                          <FloatingSelect
                            label="Area"
                            value={bookingState.destinationData.area}
                            onChange={(value) => bookingState.setDestinationData((prev) => ({ ...prev, area: value }))}
                            options={destinationAreas}
                            required
                            isDarkMode={isDarkMode}
                          />
                        ) : (
                          <FloatingInput
                            label="Area"
                            value={bookingState.destinationData.area}
                            onChange={(value) => bookingState.setDestinationData((prev) => ({ ...prev, area: value }))}
                            required
                            isDarkMode={isDarkMode}
                          />
                        )}
                        <FloatingInput
                          label="District"
                          value={bookingState.destinationData.district}
                          onChange={(_value) => {}}
                          disabled
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Website"
                          value={bookingState.destinationData.website}
                          onChange={(value) => bookingState.setDestinationData((prev) => ({ ...prev, website: value }))}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Birthday"
                          value={bookingState.destinationData.birthday}
                          onChange={(value) => bookingState.setDestinationData((prev) => ({ ...prev, birthday: value }))}
                          type="date"
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Anniversary"
                          value={bookingState.destinationData.anniversary}
                          onChange={(value) => bookingState.setDestinationData((prev) => ({ ...prev, anniversary: value }))}
                          type="date"
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setEditingSection(null)}
                        className={cn(
                          isDarkMode
                            ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setEditingSection(null)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Shipment Details */}
                <div className={cn(
                  'rounded-lg border p-2.5 transition-all duration-200',
                  isDarkMode
                    ? 'border-slate-800/50 bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-800/80 hover:border-blue-500/30'
                    : 'border-slate-200/60 bg-gradient-to-br from-slate-100/90 via-blue-50/70 to-slate-100/90 hover:border-blue-400/50'
                )}>
                  <div className={cn(
                    'flex items-center justify-between mb-2',
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    <h4 className={cn(
                      'text-sm font-semibold flex items-center gap-1.5',
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    )}>
                      <Package className="h-3.5 w-3.5" />
                      Shipment Details :
                    </h4>
                    <button
                      onClick={() => setEditingSection(editingSection === 'shipment' ? null : 'shipment')}
                      className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                        isDarkMode
                          ? 'text-blue-300 hover:bg-blue-500/20'
                          : 'text-blue-600 hover:bg-blue-50'
                      )}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                          {bookingState.shipmentData.natureOfConsignment === 'DOX' ? 'Document' : 
                           bookingState.shipmentData.natureOfConsignment === 'NON-DOX' ? 'Parcel' : 
                           bookingState.shipmentData.natureOfConsignment}
                        </p>
                      </div>
                      <div>
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{bookingState.shipmentData.insurance}</p>
                      </div>
                      <div>
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{bookingState.shipmentData.riskCoverage}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{bookingState.uploadData.totalPackages}</p>
                      </div>
                      <div>
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                          {bookingState.uploadData.materials}
                          {bookingState.uploadData.materials === 'Others' && bookingState.uploadData.others && ` (${bookingState.uploadData.others})`}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <span className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Content Description:</span>
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                          {bookingState.uploadData.contentDescription || '—'}
                        </p>
                      </div>
                      <div>
                        <span className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Declared Value:</span>
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>
                          {bookingState.uploadData.invoiceValue ? `₹${parseFloat(bookingState.uploadData.invoiceValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <span className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Actual Weight:</span>
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{displayActualWeight}</p>
                      </div>
                      <div>
                        <span className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Volumetric Weight:</span>
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-200' : 'text-[#4B5563]')}>{displayVolumetricWeight}</p>
                      </div>
                      <div>
                        <span className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Chargeable Weight:</span>
                        <p className={cn('text-[9px] sm:text-[10px] md:text-xs font-medium', isDarkMode ? 'text-blue-300' : 'text-blue-600')}>{displayChargeableWeight}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package Images */}
                {imagePreviews.length > 0 && (
                  <div className={cn(
                    'rounded-lg border p-2.5 transition-all duration-200',
                    isDarkMode
                      ? 'border-slate-800/50 bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-800/80 hover:border-blue-500/30'
                      : 'border-slate-200/60 bg-gradient-to-br from-slate-100/90 via-blue-50/70 to-slate-100/90 hover:border-blue-400/50'
                  )}>
                    <div className={cn(
                      'flex items-center justify-between mb-2',
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    )}>
                      <h4 className={cn(
                        'text-sm font-semibold flex items-center gap-1.5',
                        isDarkMode ? 'text-slate-200' : 'text-slate-800'
                      )}>
                        <Image className="h-3.5 w-3.5" />
                        Package Images :
                      </h4>
                      <button
                        onClick={() => setEditingSection(editingSection === 'package' ? null : 'package')}
                        className={cn(
                          'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                          isDarkMode
                            ? 'text-blue-300 hover:bg-blue-500/20'
                            : 'text-blue-600 hover:bg-blue-50'
                        )}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    </div>
                    <div className={cn(
                      "grid gap-2",
                      imagePreviews.length === 3 ? "grid-cols-3" :
                      imagePreviews.length === 4 ? "grid-cols-4" :
                      "grid-cols-5"
                    )}>
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          className={cn(
                            'overflow-hidden rounded border',
                            isDarkMode ? 'border-slate-700' : 'border-slate-200'
                          )}
                        >
                          <img
                            src={preview}
                            alt={`Package ${index + 1}`}
                            className="h-16 w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipment Details Edit Dialog */}
                <Dialog open={editingSection === 'shipment'} onOpenChange={(open) => !open && setEditingSection(null)}>
                  <DialogContent className={cn(
                    'max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  )}>
                    <DialogHeader>
                      <DialogTitle className={cn(isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                        Edit Shipment Details
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FloatingSelect
                          label="Nature of Consignment"
                          value={bookingState.shipmentData.natureOfConsignment === 'DOX' ? 'Document' : 
                                 bookingState.shipmentData.natureOfConsignment === 'NON-DOX' ? 'Parcel' : 
                                 bookingState.shipmentData.natureOfConsignment}
                          onChange={(value) => {
                            const actualValue = value === 'Document' ? 'DOX' : value === 'Parcel' ? 'NON-DOX' : value;
                            bookingState.setShipmentData((prev) => ({ ...prev, natureOfConsignment: actualValue }));
                          }}
                          options={['Document', 'Parcel']}
                          required
                          isDarkMode={isDarkMode}
                        />
                        <FloatingSelect
                          label="Insurance"
                          value={bookingState.shipmentData.insurance}
                          onChange={(value) => bookingState.setShipmentData((prev) => ({ ...prev, insurance: value }))}
                          options={insuranceOptions.map(opt => opt.value)}
                          required
                          isDarkMode={isDarkMode}
                        />
                        <FloatingSelect
                          label="Risk Coverage"
                          value={bookingState.shipmentData.riskCoverage}
                          onChange={(value) => bookingState.setShipmentData((prev) => ({ ...prev, riskCoverage: value }))}
                          options={riskCoverageOptions.map(opt => opt.value)}
                          required
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="No. of Packages"
                          value={bookingState.uploadData.totalPackages}
                          onChange={(value) => bookingState.setUploadData((prev) => ({ ...prev, totalPackages: sanitizeInteger(value) }))}
                          required
                          isDarkMode={isDarkMode}
                        />
                        <FloatingSelect
                          label="Package Type"
                          value={bookingState.uploadData.materials}
                          onChange={(value) => bookingState.setUploadData((prev) => ({ 
                            ...prev, 
                            materials: value,
                            others: value === 'Others' ? prev.others : ''
                          }))}
                          options={packageTypeOptions.map(opt => opt.value)}
                          required
                          isDarkMode={isDarkMode}
                        />
                        {bookingState.uploadData.materials === 'Others' && (
                          <FloatingInput
                            label="Others - Specify"
                            value={bookingState.uploadData.others}
                            onChange={(value) => bookingState.setUploadData((prev) => ({ ...prev, others: value }))}
                            required
                            isDarkMode={isDarkMode}
                            className="md:col-span-2"
                          />
                        )}
                        <FloatingInput
                          label="Length (cm)"
                          value={bookingState.uploadData.length}
                          onChange={(value) => bookingState.setUploadData((prev) => ({ ...prev, length: sanitizeDecimal(value) }))}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Width (cm)"
                          value={bookingState.uploadData.width}
                          onChange={(value) => bookingState.setUploadData((prev) => ({ ...prev, width: sanitizeDecimal(value) }))}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Height (cm)"
                          value={bookingState.uploadData.height}
                          onChange={(value) => bookingState.setUploadData((prev) => ({ ...prev, height: sanitizeDecimal(value) }))}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Actual Weight (kg)"
                          value={bookingState.uploadData.weight}
                          onChange={(value) => bookingState.setUploadData((prev) => ({ ...prev, weight: sanitizeDecimal(value) }))}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Content Description"
                          value={bookingState.uploadData.contentDescription}
                          onChange={(value) => bookingState.setUploadData((prev) => ({ ...prev, contentDescription: value }))}
                          isDarkMode={isDarkMode}
                        />
                        <FloatingInput
                          label="Declared Value (₹)"
                          value={bookingState.uploadData.invoiceValue}
                          onChange={(value) => bookingState.setUploadData((prev) => ({ ...prev, invoiceValue: sanitizeDecimal(value) }))}
                          isDarkMode={isDarkMode}
                          icon={<DollarSign className="h-4 w-4" />}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setEditingSection(null)}
                        className={cn(
                          isDarkMode
                            ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setEditingSection(null)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Package Images Edit Dialog */}
                <Dialog open={editingSection === 'package'} onOpenChange={(open) => !open && setEditingSection(null)}>
                  <DialogContent className={cn(
                    'max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  )}>
                    <DialogHeader>
                      <DialogTitle className={cn(isDarkMode ? 'text-slate-100' : 'text-slate-900')}>
                        Edit Package Images
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div
                        className={cn(
                          'flex flex-wrap items-center gap-2 rounded-md border p-2',
                          isDarkMode
                            ? 'border-slate-700 bg-slate-800/50'
                            : 'border-slate-300 bg-slate-50'
                        )}
                      >
                        <input
                          id="image-upload-edit"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length + bookingState.uploadData.packageImages.length > 5) {
                              toast({
                                title: "Maximum images exceeded",
                                description: "Maximum 5 images allowed",
                                variant: "destructive"
                              });
                              return;
                            }
                            bookingState.setUploadData((prev) => ({
                              ...prev,
                              packageImages: [...prev.packageImages, ...files]
                            }));
                          }}
                        />
                        <label
                          htmlFor="image-upload-edit"
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
                            {bookingState.uploadData.packageImages.length > 0 
                              ? `${bookingState.uploadData.packageImages.length} image${bookingState.uploadData.packageImages.length !== 1 ? 's' : ''} selected`
                              : 'No images selected'}
                          </p>
                          <p className={cn('text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                            Accepted formats: JPG, PNG. Max 5 images.
                          </p>
                        </div>
                        {bookingState.uploadData.packageImages.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              bookingState.setUploadData((prev) => ({
                                ...prev,
                                packageImages: []
                              }));
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
                                alt={`Package ${index + 1}`}
                                className="h-24 w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newFiles = bookingState.uploadData.packageImages.filter((_, i) => i !== index);
                                  bookingState.setUploadData((prev) => ({
                                    ...prev,
                                    packageImages: newFiles
                                  }));
                                }}
                                className={cn(
                                  'absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                                  isDarkMode
                                    ? 'bg-red-500/80 text-white hover:bg-red-600'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                                )}
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setEditingSection(null)}
                        className={cn(
                          isDarkMode
                            ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setEditingSection(null)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Navigation Buttons */}
                <div className="flex flex-row gap-2 pt-2 justify-between">
                  <Button
                    onClick={bookingState.previousStep}
                    className={cn(
                      'w-auto px-6',
                      isDarkMode
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    )}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleReviewNext}
                    className={cn(
                      'w-auto px-6',
                      isDarkMode
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    )}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })();
      
      case 7: // Bill
        return (
          <BillStep
            data={bookingState.billData}
            onChange={bookingState.setBillData}
            onNext={handleBillNext}
            onPrevious={bookingState.previousStep}
            originData={bookingState.originData}
            destinationData={bookingState.destinationData}
            onPincodeLookup={handleOtherPartyPincodeLookup}
            isDarkMode={isDarkMode}
          />
        );
      
      case 8: // Details
        return (
          <DetailsStep
            data={bookingState.detailsData}
            onChange={bookingState.setDetailsData}
            onNext={handleDetailsNext}
            onPrevious={bookingState.previousStep}
            billData={bookingState.billData}
            originData={bookingState.originData}
            destinationData={bookingState.destinationData}
            shipmentData={bookingState.shipmentData}
            uploadData={bookingState.uploadData}
            isChargeableFixed={bookingState.isChargeableFixed}
            isDarkMode={isDarkMode}
          />
        );
      
      case 9: // Payment
        return (
          <PaymentStep
            data={bookingState.paymentData}
            onChange={bookingState.setPaymentData}
            onNext={handlePaymentNext}
            onPrevious={bookingState.previousStep}
            onSubmit={handlePaymentNext}
            isSubmitting={false}
            submitError={null}
            isDarkMode={isDarkMode}
          />
        );
      
      case 10: // Final Review (Preview of Bill, Details, Payment)
        return (() => {
          // Format currency values
          const formatCurrency = (value: string | number | undefined): string => {
            if (!value) return '₹0.00';
            const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.]/g, '')) : value;
            if (isNaN(num)) return '₹0.00';
            return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          };

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={cn(
                'mb-6 pb-4 border-b',
                isDarkMode ? 'border-slate-700' : 'border-slate-200'
              )}>
                <h2 className={cn(
                  'text-2xl font-bold',
                  isDarkMode ? 'text-slate-100' : 'text-gray-900'
                )}>
                  Final Review
                </h2>
                <p className={cn(
                  'text-sm mt-1',
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                )}>
                  Please review all billing and payment details before completing the booking
                </p>
              </div>

              <div className="space-y-4">
                {/* Bill Information */}
                <div className={cn(
                  'rounded-lg border p-4 transition-all duration-200',
                  isDarkMode
                    ? 'border-slate-800/50 bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-800/80'
                    : 'border-slate-200/60 bg-gradient-to-br from-slate-100/90 via-blue-50/70 to-slate-100/90'
                )}>
                  <h3 className={cn(
                    'text-lg font-semibold mb-3 flex items-center gap-2',
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    <FileText className="h-5 w-5" />
                    Billing Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Party Type:</span>
                        <p className={cn('mt-1', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {bookingState.billData.partyType || '—'}
                        </p>
                      </div>
                      <div>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Bill Type:</span>
                        <p className={cn('mt-1', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {bookingState.billData.billType || '—'}
                        </p>
                      </div>
                    </div>
                    {bookingState.billData.partyType === 'other' && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Other Party Details:</span>
                        <div className="mt-2 space-y-1">
                          <p className={cn('text-sm', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                            {bookingState.billData.otherPartyDetails.concernName || bookingState.billData.otherPartyDetails.companyName || '—'}
                          </p>
                          <p className={cn('text-sm', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
                            {bookingState.billData.otherPartyDetails.phoneNumber || '—'}
                          </p>
                          <p className={cn('text-sm', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
                            {[
                              bookingState.billData.otherPartyDetails.flatBuilding,
                              bookingState.billData.otherPartyDetails.locality,
                              bookingState.billData.otherPartyDetails.area,
                              bookingState.billData.otherPartyDetails.city,
                              bookingState.billData.otherPartyDetails.state,
                              bookingState.billData.otherPartyDetails.pincode
                            ].filter(Boolean).join(', ') || '—'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details (Pricing) */}
                <div className={cn(
                  'rounded-lg border p-4 transition-all duration-200',
                  isDarkMode
                    ? 'border-slate-800/50 bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-800/80'
                    : 'border-slate-200/60 bg-gradient-to-br from-slate-100/90 via-blue-50/70 to-slate-100/90'
                )}>
                  <h3 className={cn(
                    'text-lg font-semibold mb-3 flex items-center gap-2',
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    <Receipt className="h-5 w-5" />
                    Pricing Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex justify-between">
                        <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Freight Charge:</span>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {formatCurrency(bookingState.detailsData.freightCharge)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>AWB Charge:</span>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {formatCurrency(bookingState.detailsData.awbCharge)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Pickup Charge:</span>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {formatCurrency(bookingState.detailsData.pickupCharge)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Local Collection:</span>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {formatCurrency(bookingState.detailsData.localCollection)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Door Delivery:</span>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {formatCurrency(bookingState.detailsData.doorDelivery)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Loading/Unloading:</span>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {formatCurrency(bookingState.detailsData.loadingUnloading)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Demurrage Charge:</span>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {formatCurrency(bookingState.detailsData.demurrageCharge)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>DDA Charge:</span>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {formatCurrency(bookingState.detailsData.ddaCharge)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Hamali Charge:</span>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {formatCurrency(bookingState.detailsData.hamaliCharge)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Packing Charge:</span>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {formatCurrency(bookingState.detailsData.packingCharge)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Other Charge:</span>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {formatCurrency(bookingState.detailsData.otherCharge)}
                        </span>
                      </div>
                    </div>
                    <div className={cn('pt-2 mt-2 border-t', isDarkMode ? 'border-slate-700' : 'border-slate-300')}>
                      <div className="flex justify-between">
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Total:</span>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {formatCurrency(bookingState.detailsData.total)}
                        </span>
                      </div>
                      {bookingState.detailsData.fuelCharge && (
                        <div className="flex justify-between mt-1">
                          <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>
                            Fuel Charge ({bookingState.detailsData.fuelChargeType === 'percentage' ? '%' : 'Fixed'}):
                          </span>
                          <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                            {formatCurrency(bookingState.detailsData.fuelCharge)}
                          </span>
                        </div>
                      )}
                      {(bookingState.detailsData.sgstAmount || bookingState.detailsData.cgstAmount || bookingState.detailsData.igstAmount) && (
                        <>
                          {bookingState.detailsData.sgstAmount && (
                            <div className="flex justify-between mt-1">
                              <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>SGST:</span>
                              <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                                {formatCurrency(bookingState.detailsData.sgstAmount)}
                              </span>
                            </div>
                          )}
                          {bookingState.detailsData.cgstAmount && (
                            <div className="flex justify-between mt-1">
                              <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>CGST:</span>
                              <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                                {formatCurrency(bookingState.detailsData.cgstAmount)}
                              </span>
                            </div>
                          )}
                          {bookingState.detailsData.igstAmount && (
                            <div className="flex justify-between mt-1">
                              <span className={cn(isDarkMode ? 'text-slate-400' : 'text-gray-600')}>IGST:</span>
                              <span className={cn('font-medium', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                                {formatCurrency(bookingState.detailsData.igstAmount)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      <div className={cn('flex justify-between mt-3 pt-2 border-t-2 font-bold text-lg', isDarkMode ? 'border-slate-600 text-blue-400' : 'border-blue-300 text-blue-600')}>
                        <span>Grand Total:</span>
                        <span>{formatCurrency(bookingState.detailsData.grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className={cn(
                  'rounded-lg border p-4 transition-all duration-200',
                  isDarkMode
                    ? 'border-slate-800/50 bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-800/80'
                    : 'border-slate-200/60 bg-gradient-to-br from-slate-100/90 via-blue-50/70 to-slate-100/90'
                )}>
                  <h3 className={cn(
                    'text-lg font-semibold mb-3 flex items-center gap-2',
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  )}>
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Payment Type:</span>
                        <p className={cn('mt-1', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {bookingState.paymentData.paymentType || '—'}
                        </p>
                      </div>
                      <div>
                        <span className={cn('font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Mode of Payment:</span>
                        <p className={cn('mt-1', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                          {bookingState.paymentData.modeOfPayment || '—'}
                        </p>
                      </div>
                      {bookingState.paymentData.amount && (
                        <div>
                          <span className={cn('font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Amount:</span>
                          <p className={cn('mt-1', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                            {formatCurrency(bookingState.paymentData.amount)}
                          </p>
                        </div>
                      )}
                      {bookingState.paymentData.currentStatus && (
                        <div>
                          <span className={cn('font-medium', isDarkMode ? 'text-slate-400' : 'text-gray-600')}>Current Status:</span>
                          <p className={cn('mt-1 capitalize', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                            {bookingState.paymentData.currentStatus}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-300">
                <Button
                  onClick={bookingState.previousStep}
                  variant="outline"
                  className={cn(
                    'w-auto px-6',
                    isDarkMode
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleFinalReviewSubmit}
                  disabled={bookingState.isSubmitting}
                  className={cn(
                    'w-auto px-6',
                    isDarkMode
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  )}
                >
                  {bookingState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing Booking...
                    </>
                  ) : (
                    <>
                      Complete Booking
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {bookingState.submitError && (
                <div className={cn(
                  'p-3 rounded-lg text-sm',
                  isDarkMode ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-red-50 text-red-600 border border-red-200'
                )}>
                  {bookingState.submitError}
                </div>
              )}
            </motion.div>
          );
        })();
      
      case 11: // Success
        return (
          <div className={`p-4 sm:p-6 lg:p-8 space-y-6 ${isDarkMode ? 'text-slate-100' : ''}`}>
            {/* Success Header */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="relative inline-block mb-4"
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
                  isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                  <CheckCircle className={`w-12 h-12 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div className={`absolute inset-0 rounded-full ${
                  isDarkMode ? 'bg-green-500/30' : 'bg-green-200'
                } animate-ping opacity-75`}></div>
              </motion.div>
              <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                Shipment Confirmed 
                <br/>
              </h2>
              
              {/* Consignment Number - Most Important */}
              {bookingResult?.consignmentNumber && (
                <div className={`inline-block rounded-2xl p-6 mb-6 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30' 
                    : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200'
                } shadow-lg`}>
                  <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Consignment Number
                  </p>
                  <p className={`text-4xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {bookingResult.consignmentNumber}
                  </p>
                 
                </div>
              )}
            </div>

            {/* Booking Preview Summary */}
            <div className={`rounded-2xl border ${
              isDarkMode 
                ? 'border-slate-700 bg-slate-800/50' 
                : 'border-slate-200 bg-white'
            } p-6 shadow-sm`}>
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Booking Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Origin */}
                <div className={`rounded-xl p-4 ${
                  isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h4 className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>Origin</h4>
                  </div>
                  <div className={`space-y-1 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <p className="font-medium">{bookingState.originData.name}</p>
                    <p>{bookingState.originData.mobileNumber}</p>
                    <p className="text-xs">{bookingState.originData.city}, {bookingState.originData.state}</p>
                    <p className="text-xs">PIN: {bookingState.originData.pincode}</p>
                  </div>
                </div>

                {/* Destination */}
                <div className={`rounded-xl p-4 ${
                  isDarkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <h4 className={`font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>Destination</h4>
                  </div>
                  <div className={`space-y-1 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <p className="font-medium">{bookingState.destinationData.name}</p>
                    <p>{bookingState.destinationData.mobileNumber}</p>
                    <p className="text-xs">{bookingState.destinationData.city}, {bookingState.destinationData.state}</p>
                    <p className="text-xs">PIN: {bookingState.destinationData.pincode}</p>
                  </div>
                </div>

                {/* Shipment Details */}
                <div className={`rounded-xl p-4 ${
                  isDarkMode ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className={`w-4 h-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                    <h4 className={`font-semibold ${isDarkMode ? 'text-orange-300' : 'text-orange-800'}`}>Shipment</h4>
                  </div>
                  <div className={`space-y-1 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <p><span className="font-medium">Mode:</span> {bookingState.shipmentData.mode}</p>
                    <p><span className="font-medium">Nature:</span> {bookingState.shipmentData.natureOfConsignment || 'N/A'}</p>
                    {bookingState.uploadData.totalPackages && (
                      <p><span className="font-medium">Packages:</span> {bookingState.uploadData.totalPackages}</p>
                    )}
                    {bookingState.uploadData.weight && (
                      <p><span className="font-medium">Weight:</span> {bookingState.uploadData.weight} kg</p>
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                <div className={`rounded-xl p-4 ${
                  isDarkMode ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <h4 className={`font-semibold ${isDarkMode ? 'text-purple-300' : 'text-purple-800'}`}>Payment</h4>
                  </div>
                  <div className={`space-y-1 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <p><span className="font-medium">Mode:</span> {bookingState.paymentData.modeOfPayment || 'N/A'}</p>
                    <p><span className="font-medium">Type:</span> {bookingState.paymentData.paymentType === 'FP' ? 'Godown Delivery' : bookingState.paymentData.paymentType === 'TP' ? 'Door Delivery' : 'N/A'}</p>
                    {bookingState.detailsData.grandTotal && (
                      <p className="font-semibold text-base mt-2">
                        <span className="font-medium">Total:</span> ₹{bookingState.detailsData.grandTotal}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="text-center pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => setShowInvoiceDialog(true)}
                variant="outline"
                className={cn(
                  "px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2",
                  isDarkMode
                    ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-lg"
                )}
              >
                <FileText className="w-5 h-5" />
                View Invoice
              </Button>
              <button
                onClick={() => {
                  setBookingResult(null);
                  bookingState.resetBooking();
                }}
                className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg'
                }`}
              >
                <Package className="w-5 h-5" />
                Book Another Shipment
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Step {bookingState.currentStep + 1}</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        );
    }
  };

  // Calculate progress percentage
  const totalSteps = bookingState.steps.length;
  const progressPercentage = totalSteps > 1 
    ? Math.round((bookingState.currentStep / (totalSteps - 1)) * 100) 
    : 0;

  return (
    <div 
      className={`w-full min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'} relative`}
      style={{ 
        fontFamily: 'Calibri, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important'
      }}
    >
      <div className="max-w-6xl mx-auto p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className={`text-base font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Booking Progress
              </span>
              <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Step {bookingState.currentStep + 1} of {totalSteps}
              </span>
            </div>
            <span className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {progressPercentage}%
            </span>
          </div>
          <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
            <motion.div
              className={`h-full rounded-full ${isDarkMode ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-blue-500 to-cyan-600'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
        {/* Step Content */}
        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-8 shadow-sm`}>
          {renderCurrentStep()}
        </div>
      </div>

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={(open) => !open && setShowInvoiceDialog(false)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 border-0 shadow-none bg-white print:bg-white print:max-h-full print:overflow-visible [&>button]:hidden mx-2 sm:mx-auto">
          <DialogHeader className={cn("sticky top-0 z-10 bg-white dark:bg-slate-900 p-3 sm:p-4 print:hidden", isDarkMode ? "border-slate-700" : "border-slate-200")}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <DialogTitle className={cn("text-base sm:text-lg font-semibold break-words", isDarkMode ? "text-white" : "text-slate-900")}>
                Invoice - {bookingResult?.bookingReference || bookingResult?.consignmentNumber || 'N/A'}
              </DialogTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.print();
                  }}
                  className={cn(
                    "flex-1 sm:flex-initial h-9 sm:h-8",
                    isDarkMode
                      ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                  className={cn(
                    "flex-1 sm:flex-initial h-9 sm:h-8",
                    isDarkMode
                      ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
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
          <div
            id="invoice-content"
            ref={invoiceContentRef}
            className={cn("p-3 sm:p-6 print:p-3", isDarkMode ? "bg-slate-900 print:bg-white" : "bg-white")}
          >
            {/* Invoice Section - Compressed Design (Same as MyBooking.tsx) */}
            <div className="max-w-3xl mx-auto print:max-w-full">
              <div className={cn(
                'bg-white p-3 sm:p-4 print:p-3',
                isDarkMode ? 'bg-slate-800 print:bg-white' : 'bg-white'
              )}>
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
                    <div
                      className={cn(
                        "text-xs sm:text-[10px] space-y-1.5",
                        isDarkMode ? "text-slate-200" : "text-slate-700"
                      )}
                    >
                      <div className="space-y-0.5 sm:text-right">
                        <p
                          className={cn(
                            "text-sm sm:text-xs font-semibold",
                            isDarkMode ? "text-white" : "text-slate-900"
                          )}
                        >
                          Invoice Details
                        </p>
                        <p>Invoice No.: {getInvoiceNumber()}</p>
                        <p>Created: {formatDateWithTime(new Date().toISOString())}</p>
                      </div>
                      <div className="space-y-0.5 sm:text-right">
                        <p>
                          Consignment No.: {bookingResult?.bookingReference || bookingResult?.consignmentNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    "grid gap-4 mb-3 pb-2 grid-cols-1 sm:grid-cols-2 text-xs sm:text-[10px]",
                    isDarkMode ? "text-slate-200" : "text-slate-700"
                  )}
                >
                  <div className="space-y-0.5">
                    <p className={cn("text-xs font-semibold", isDarkMode ? "text-white" : "text-slate-900")}>
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
                      <div className="font-medium">{bookingState.originData.name || 'N/A'}</div>
                      <div>{bookingState.originData.flatBuilding || ''} {bookingState.originData.locality || ''}</div>
                      <div>{bookingState.originData.area || ''}, {bookingState.originData.city || ''}, {bookingState.originData.state || ''}</div>
                      <div>PIN: {bookingState.originData.pincode || 'N/A'}</div>
                      {bookingState.originData.mobileNumber && (
                        <div>Phone: {bookingState.originData.mobileNumber}</div>
                      )}
                    </div>
                  </div>

                  {/* To Section */}
                  <div className="sm:text-right">
                    <div className="text-xs sm:text-[10px] font-semibold text-slate-700 mb-1">To - Recipient Information</div>
                    <div className="text-xs sm:text-[10px] text-slate-600 leading-tight">
                      <div className="font-medium">{bookingState.destinationData.name || 'N/A'}</div>
                      <div>{bookingState.destinationData.flatBuilding || ''} {bookingState.destinationData.locality || ''}</div>
                      <div>{bookingState.destinationData.area || ''}, {bookingState.destinationData.city || ''}, {bookingState.destinationData.state || ''}</div>
                      <div>PIN: {bookingState.destinationData.pincode || 'N/A'}</div>
                      {bookingState.destinationData.mobileNumber && (
                        <div>Phone: {bookingState.destinationData.mobileNumber}</div>
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
                        {bookingState.shipmentData.services === 'Priority' ? 'Priority' : 'Standard'}
                        {bookingState.shipmentData.mode &&
                          ` - ${
                            bookingState.shipmentData.mode === 'Air'
                              ? 'Air'
                              : bookingState.shipmentData.mode === 'Train'
                              ? 'Train'
                              : 'Road'
                          }`}
                      </div>
                    </div>
                    <div className="text-left sm:text-center">
                      <div className="text-xs sm:text-[10px] text-slate-500 mb-0.5">Weight</div>
                      <div className="text-xs sm:text-[10px] font-semibold text-slate-700">
                        {bookingState.uploadData.weight || '0'} kg
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs sm:text-[10px] text-slate-500 mb-0.5">Declared Value</div>
                      <div className="text-xs sm:text-[10px] font-semibold text-slate-700">
                        ₹
                        {bookingState.uploadData.invoiceValue
                          ? parsePrice(bookingState.uploadData.invoiceValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
                          src={getBarcodeUrl(bookingResult?.bookingReference || bookingResult?.consignmentNumber)}
                          alt={`Barcode for ${getConsignmentValue(bookingResult?.bookingReference || bookingResult?.consignmentNumber)}`}
                          className="mx-auto h-16 w-full object-contain mix-blend-multiply"
                          style={{ maxWidth: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill To and Payment Details - Two Column Layout */}
                <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Column - Bill To */}
                  <div>
                    <div className="text-xs sm:text-[10px] font-semibold text-slate-700 mb-1">Bill To</div>
                    <div className="text-xs sm:text-[10px] text-slate-600 leading-tight">
                      <div className="font-medium">{bookingState.destinationData.name || 'N/A'}</div>
                      <div>Phone: {bookingState.destinationData.mobileNumber || 'N/A'}</div>
                      <div>{bookingState.destinationData.flatBuilding || ''} {bookingState.destinationData.locality || ''}</div>
                      <div>{bookingState.destinationData.area || ''}, {bookingState.destinationData.city || ''}, {bookingState.destinationData.state || ''}</div>
                      <div>PIN: {bookingState.destinationData.pincode || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Right Column - Payment Details */}
                  <div className="text-left sm:text-right">
                    <div className="text-xs sm:text-[10px] font-bold text-black">
                      <div>{bookingState.paymentData.modeOfPayment === 'Cash' ? 'Paid' : 'Unpaid'}</div>
                    </div>
                    {bookingState.detailsData.grandTotal && (
                      <div className="text-base sm:text-[18px] font-bold text-black mt-1">
                        <div>₹{parsePrice(bookingState.detailsData.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details - Price Breakdown */}
                <div className="mb-3">
                  {/* Price Breakdown */}
                  {bookingState.detailsData.grandTotal && (
                    <div className="mt-2 pt-2">
                      <div className="text-xs sm:text-[9px] text-slate-600 space-y-0.5">
                        {(() => {
                          // Calculate price breakdown from grandTotal
                          // Office booking uses complex GST calculation (CGST+SGST for Assam, IGST for others)
                          // For invoice, we'll show a simplified breakdown
                          const totalPrice = parsePrice(bookingState.detailsData.grandTotal);
                          const totalBeforeGST = parsePrice(bookingState.detailsData.total || '0');
                          const gstAmount = totalPrice - totalBeforeGST;
                          
                          return (
                            <>
                              <div className="flex justify-between">
                                <span>Total Charges (before GST):</span>
                                <span>₹{totalBeforeGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              {(parsePrice(bookingState.detailsData.sgstAmount || '0') > 0 || parsePrice(bookingState.detailsData.cgstAmount || '0') > 0) && (
                                <>
                                  {parsePrice(bookingState.detailsData.cgstAmount || '0') > 0 && (
                                    <div className="flex justify-between">
                                      <span>CGST (9%):</span>
                                      <span>₹{parsePrice(bookingState.detailsData.cgstAmount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                  )}
                                  {parsePrice(bookingState.detailsData.sgstAmount || '0') > 0 && (
                                    <div className="flex justify-between">
                                      <span>SGST (9%):</span>
                                      <span>₹{parsePrice(bookingState.detailsData.sgstAmount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                  )}
                                </>
                              )}
                              {parsePrice(bookingState.detailsData.igstAmount || '0') > 0 && (
                                <div className="flex justify-between">
                                  <span>IGST (18%):</span>
                                  <span>₹{parsePrice(bookingState.detailsData.igstAmount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              {gstAmount > 0 && parsePrice(bookingState.detailsData.sgstAmount || '0') === 0 && parsePrice(bookingState.detailsData.cgstAmount || '0') === 0 && parsePrice(bookingState.detailsData.igstAmount || '0') === 0 && (
                                <div className="flex justify-between">
                                  <span>GST:</span>
                                  <span>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-black pt-0.5">
                                <span>Grand Total:</span>
                                <span>₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-[9px] text-slate-600 italic pt-1 gap-1">
                                <span>Amount in Words:</span>
                                <span className="text-left sm:text-right break-words">{numberToWords(totalPrice)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Item Description */}
                <div className="mb-3">
                  <div className="text-xs sm:text-[10px] font-semibold text-slate-700 mb-1">Item Description:</div>
                  <div className="text-xs sm:text-[10px] text-slate-600">
                    {bookingState.shipmentData.natureOfConsignment === 'DOX' ? 'Document' : bookingState.shipmentData.natureOfConsignment === 'NON-DOX' ? 'Parcel' : bookingState.shipmentData.natureOfConsignment || 'Document'}
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
                      className={cn(
                        "underline font-medium hover:opacity-80 transition-opacity",
                        isDarkMode ? "text-blue-300 hover:text-blue-200" : "text-blue-600 hover:text-blue-700"
                      )}
                    >
                      info@oclservices.com
                    </a>
                  </div>
                  <div className="text-xs sm:text-[9px] text-slate-600 leading-tight">
                    Movement of content is subject to our list of Dangerous Goods and Prohibited Items.
                  </div>
                </div>

                {/* Computer Generated Invoice Note */}
                <div className={cn(
                  "mb-3 p-2 rounded border",
                  isDarkMode 
                    ? "bg-yellow-500/10 border-yellow-500/30" 
                    : "bg-yellow-50 border-yellow-200"
                )}>
                  <div className={cn(
                    "text-xs sm:text-[9px] leading-tight",
                    isDarkMode ? "text-yellow-200" : "text-yellow-800"
                  )}>
                    <span className="font-bold">*</span> This is computer generated invoice and does not require official signature. Kindly notify us immediately in case you find any discrepancy in the details of transaction.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficeBookingPanel;