import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Building, User, Mail, Phone, MapPin, FileText, CheckCircle, Briefcase, Hash, MapPinned, Landmark, Sparkles, Globe, IdCard, FileCheck, Building2, Banknote, FileSpreadsheet, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import buildingIcon from "@/Icon-images/Building.png";
import userIcon from "@/Icon-images/user.png";
import mobileIcon from "@/Icon-images/mobile.png";
import webIcon from "@/Icon-images/world-wide-web.png";
import locationIcon from "@/Icon-images/location.png";
import landmarkIcon from "@/Icon-images/Landmark.png";
import invoiceIcon from "@/Icon-images/invoice.png";
import applyCreditImage from "@/assets/apply-credit-1.png";
import applyCreditImage2 from "@/assets/apply-credit-2.png";
import submitImg from "@/assets/submit.png";

const CreditAccount = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    concernName: "",
    mobile1: "",
    mobile2: "",
    websiteUrl: "",
    email: "",
    locality: "",
    buildingFlatNo: "",
    landmark: "",
    pincode: "",
    state: "",
    city: "",
    area: "",
    addressType: "home",
    acceptTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [isLoadingPincode, setIsLoadingPincode] = useState(false);
  const { toast } = useToast();

  // Validate all required fields
  const isFormValid = () => {
    const baseFieldsValid = (
      formData.companyName.trim() !== "" &&
      formData.concernName.trim() !== "" &&
      formData.mobile1.trim() !== "" &&
      formData.mobile1.length === 10 &&
      formData.email.trim() !== "" &&
      isValidEmail(formData.email) &&
      formData.locality.trim() !== "" &&
      formData.buildingFlatNo.trim() !== "" &&
      formData.pincode.trim() !== "" &&
      formData.state.trim() !== "" &&
      formData.city.trim() !== ""
    );
    
    // Area is required only if pincode is filled and areas are available
    const areaValid = formData.pincode.length === 6 && availableAreas.length > 0 
      ? formData.area.trim() !== "" 
      : true;
    
    return baseFieldsValid && areaValid;
  };

  // Pincode lookup function
  const lookupPincode = async (pincode: string) => {
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return;
    }

    setIsLoadingPincode(true);
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/pincode/${pincode}/simple`);
      
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          state: data.state || '',
          city: data.city || '',
          area: '' // Reset area when pincode changes
        }));
        setAvailableAreas(data.areas || []);
      } else {
        // Clear fields if pincode not found
        setFormData(prev => ({
          ...prev,
          state: '',
          city: '',
          area: ''
        }));
        setAvailableAreas([]);
        toast({
          title: "Pincode Not Found",
          description: "The entered pincode is not serviceable in our database.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error looking up pincode:', error);
      toast({
        title: "Error",
        description: "Failed to lookup pincode. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPincode(false);
    }
  };

  // Handle pincode change
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setFormData(prev => ({
        ...prev,
        pincode: value,
        state: '',
        city: '',
        area: ''
      }));
      setAvailableAreas([]);
      
      // Trigger lookup when pincode is 6 digits
      if (value.length === 6) {
        lookupPincode(value);
      }
    }
  };

  // Handle mobile number change (only 10 digits)
  const handleMobileChange = (field: 'mobile1' | 'mobile2', value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length <= 10) {
      setFormData(prev => ({
        ...prev,
        [field]: digitsOnly
      }));
    }
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // No website validation – user can enter any value

  const [submissionStage, setSubmissionStage] = useState<'form' | 'submitting' | 'truck' | 'success'>('form');

  const playWhoosh = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(120, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmissionStage('submitting');

    // Brief submitting phase with slight blur
    await new Promise(resolve => setTimeout(resolve, 600));
    setSubmissionStage('truck');
    playWhoosh();

    // Truck cinematic (2.2s), then small delay before popup
    await new Promise(resolve => setTimeout(resolve, 2200));
    await new Promise(resolve => setTimeout(resolve, 500));

    setIsLoading(false);
    setSubmissionStage('success');
    setIsSubmitted(true);

    toast({
      title: "Application Submitted Successfully!",
      description: "Your credit account application has been received. We'll contact you within 2-3 business days.",
    });
  };

  const benefits = [
    {
      icon: CreditCard,
      title: "Flexible Credit Terms",
      description: "Get credit limits up to ₹10 lakhs with flexible payment terms",
      color: "#FDA11E"
    },
    {
      icon: CheckCircle,
      title: "Priority Processing",
      description: "Enjoy priority booking and faster processing of your shipments",
      color: "#10B981"
    },
    {
      icon: FileText,
      title: "Consolidated Billing",
      description: "Get monthly consolidated invoices for better financial management",
      color: "#3B82F6"
    }
  ];

  const requiredDocs = [
    {
      icon: IdCard,
      title: "PAN Card",
      description: "Valid Permanent Account Number card for business verification",
      color: "#FDA11E"
    },
    {
      icon: FileCheck,
      title: "GST Registration Certificate",
      description: "Current GST registration certificate with registration number",
      color: "#10B981"
    },
    {
      icon: Building2,
      title: "Company Registration Certificate",
      description: "Certificate of Incorporation or Partnership Deed as applicable",
      color: "#3B82F6"
    },
    {
      icon: Home,
      title: "Address Proof",
      description: "Utility bill or rent agreement for business address verification",
      color: "#F59E0B"
    }
  ];

  // Helper function for floating label
  const isLabelFloated = (fieldName: string) => {
    return formData[fieldName as keyof typeof formData] !== "" || focusedField === fieldName;
  };

  // Helper function to check if email is valid (for disabling next fields)
  const isEmailValid = () => {
    return formData.email.trim() !== "" && isValidEmail(formData.email);
  };

  // Helper function to get border color
  const getBorderColor = (fieldName: string) => {
    if (focusedField === fieldName) return '#FE9F16';
    if (hoveredField === fieldName && !focusedField) return 'rgba(254,159,22,0.5)';
    const fieldValue = formData[fieldName as keyof typeof formData];
    if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim() !== '') return 'rgba(254,159,22,0.3)';
    return 'rgba(0,0,0,0.08)';
  };

  // Helper function to get input background color
  const getInputBackground = (fieldName: string) => {
    if (hoveredField === fieldName && !focusedField) return '#FFF3E1';
    return 'white';
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
      {/* White Background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: '#FFFFFF'
        }}
      />
      
      <Navbar />

      {/* Header Section */}
      <motion.section
        className="relative w-full py-16 md:py-24 overflow-hidden flex items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{ backgroundColor: '#000000', minHeight: '40vh' }}
      >
        <div className="container mx-auto px-4 md:px-6 relative z-10 w-full" style={{ maxWidth: '1400px' }}>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-0 md:mb-6"
              style={{ 
                color: "#FFFFFF",
                fontFamily: "'Value Serif Pro Bold', serif"
              }}
            >
              Apply for <span style={{ color: "#FFA019" }}>Credit</span> Account
            </h1>
            <p
              className="hidden md:block text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto"
              style={{ 
                color: "#E0E0E0",
                fontFamily: "'Value Serif Pro Bold', serif" 
              }}
            >
              Get flexible payment terms and priority processing for your business shipments
            </p>
          </motion.div>
        </div>
      </motion.section>

      <div className="container mx-auto px-4 pt-12 pb-16 relative z-10" style={{ maxWidth: '1400px' }}>

        {/* Section 1: Credit Account Benefits */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mb-24"
        >
          {/* Title - Centered at Top */}
          <motion.div
            className="flex justify-center mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="inline-block"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <div 
                className="flex items-center gap-2 px-3 py-1.5 credit-benefits-title-mobile"
                style={{
                  background: '#643B29',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderRadius: '0px'
                }}
              >
                <Sparkles className="h-4 w-4 md:h-5 md:w-5" style={{ color: '#FDA11E' }} />
                <h2 className="text-lg md:text-2xl font-normal" style={{ color: '#FFFFFF' }}>
                  <span style={{ color: '#FFA019' }}>Credit</span> Account Benefits
                </h2>
              </div>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-12 items-center">
            {/* Left: Image Box with Layered Design */}
          <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block relative max-w-full md:max-w-[90%] pr-2 md:pr-4 credit-benefits-image-mobile"
            >
              {/* Orange Offset Box Behind */}
              <div 
                className="absolute -z-10 credit-benefits-orange-box-mobile"
              style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#FE9F16',
                  transform: 'translate(16px, 16px)',
                  boxShadow: '0 8px 25px rgba(254,159,22,0.3)'
                }}
              />
              {/* White Front Image Box */}
              <motion.div
                className="relative overflow-hidden group"
                style={{
                  background: 'white',
                  boxShadow: 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px',
                  transition: 'transform 0.4s ease',
                  borderRadius: '0px'
                }}
                whileHover={{ y: -5 }}
              >
                <img 
                  src={applyCreditImage} 
                  alt="Credit Account Benefits" 
                  className="w-full h-[200px] md:h-[320px] object-cover credit-benefits-img"
                />
              </motion.div>
            </motion.div>

            {/* Right: Content Text */}
                <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full lg:pl-2 md:pl-4 pr-4 credit-benefits-content-mobile"
            >
              <div className="space-y-3 md:space-y-6 w-full">
                  {benefits.map((benefit, index) => {
                    const IconComponent = benefit.icon;
                    return (
                      <motion.div 
                        key={index} 
                      className="flex gap-2 md:gap-4 items-center justify-center md:justify-start"
                        initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    >
                      <div className="flex-shrink-0">
                        <IconComponent className="h-4 w-4 md:h-5 md:w-5" style={{ color: benefit.color }} />
                      </div>
                      <div>
                        <h3 className="font-normal text-sm md:text-lg leading-tight text-center md:text-left" style={{ color: '#111827' }}>
                          {benefit.title.includes('Credit') ? (
                            <>
                              {benefit.title.split('Credit').map((part, idx, arr) => (
                                <React.Fragment key={idx}>
                                  {part}
                                  {idx < arr.length - 1 && <span style={{ color: '#FFA019' }}>Credit</span>}
                                </React.Fragment>
                              ))}
                            </>
                          ) : (
                            benefit.title
                          )}
                        </h3>
                        </div>
                      </motion.div>
                    );
                  })}
                  </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Section 2: Required Documents */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-24 -mt-8 md:-mt-4"
        >
          {/* Title - Centered at Top */}
          <motion.div
            className="flex justify-center mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            <motion.div
              className="inline-block"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <div 
                className="flex items-center gap-2 px-3 py-1.5 credit-benefits-title-mobile"
                style={{
                  background: '#643B29',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderRadius: '0px'
                }}
              >
                <FileText className="h-4 w-4 md:h-5 md:w-5" style={{ color: '#FDA11E' }} />
                <h2 className="text-lg md:text-2xl font-normal" style={{ color: '#FFFFFF' }}>
                  Required Documents
                </h2>
              </div>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-12 items-start lg:items-center">
            {/* Left: Content Text */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="w-full lg:pl-4 pr-4 credit-benefits-content-mobile flex items-center"
            >
              <div className="space-y-3 md:space-y-6 w-full">
                {requiredDocs.map((doc, index) => {
                  const IconComponent = doc.icon;
                  return (
                    <motion.div 
                      key={index}
                      className="flex gap-2 md:gap-4 items-center justify-center md:justify-start"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.55 + index * 0.1 }}
                    >
                      <div className="flex-shrink-0">
                        <IconComponent className="h-4 w-4 md:h-5 md:w-5" style={{ color: doc.color }} />
                      </div>
                      <div>
                        <h3 className="font-normal text-sm md:text-lg leading-tight text-center md:text-left" style={{ color: '#111827' }}>{doc.title}</h3>
              </div>
          </motion.div>
                  );
                })}
          </div>
            </motion.div>

            {/* Right: Image Box with Layered Design */}
          <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="hidden lg:block relative max-w-[90%] pl-4"
            >
              {/* Orange Offset Box Behind */}
              <div 
                className="absolute -z-10"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#FE9F16',
                  transform: 'translate(16px, 16px)',
                  boxShadow: '0 8px 25px rgba(254,159,22,0.3)'
                }}
              />
              {/* White Front Image Box */}
              <motion.div
                className="relative overflow-hidden group"
                style={{
                  background: 'white',
                  boxShadow: 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px',
                  transition: 'transform 0.4s ease',
                  borderRadius: '0px'
                }}
                whileHover={{ y: -5 }}
              >
                <img 
                  src={applyCreditImage2} 
                  alt="Required Documents" 
                  className="w-full h-[320px] object-cover"
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Section 3: Credit Account Application Form */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.div
              className="text-center my-10"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <div className="inline-block">
                <span className="text-xl font-normal" style={{ color: '#2C2C2C' }}>Fill Your Application Form</span>
                <motion.div
                  className="mx-auto"
                  style={{ height: '2px', background: '#FE9F16', borderRadius: '2px', marginTop: '8px' }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  viewport={{ once: true }}
                  animate={{}}
                />
              </div>
            </motion.div>
            <Card 
              className="relative rounded-[20px] md:border-0 border-0 overflow-hidden credit-form-card-mobile"
              style={{
                background: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(12px)',
                boxShadow: 'rgba(0, 0, 0, 0.25) 0px 14px 28px, rgba(0, 0, 0, 0.22) 0px 10px 10px',
                border: '1px solid rgba(254, 159, 22, 0.25)'
              }}
            >
              <CardContent className="pt-6 credit-form-cardcontent-mobile" style={{ backgroundColor: '#FFF9F3' }}>
                <AnimatePresence mode="wait">
                  {submissionStage === 'truck' && null}

                  {(submissionStage === 'form' || submissionStage === 'submitting') && (
                    <motion.form
                      key="form"
                      onSubmit={handleSubmit}
                      className="space-y-5 relative z-10"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={submissionStage === 'submitting' ? { filter: 'blur(2px)', opacity: 0.9, transition: 'all 0.4s ease-in-out' } : {}}
                    >
                  {/* Company Information */}
                      <motion.div 
                        className="space-y-5"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                      >
                        {/* Row 1: Company Name, Concern Name */}
                        <div className="grid md:grid-cols-2 gap-5">
                          <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.55, ease: "easeOut" }}
                          >
                            <Label 
                              htmlFor="companyName" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                isLabelFloated('companyName') 
                                  ? '-top-2 text-[#2C2C2C] bg-white px-1 opacity-100' 
                                  : 'top-3 opacity-0'
                              }`}
                              style={{
                                transform: isLabelFloated('companyName') ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                          Company Name *
                        </Label>
                            <div className="relative">
                              <img 
                                src={buildingIcon} 
                                alt="Company" 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10 object-contain"
                                style={{
                                  opacity: focusedField === 'companyName' ? 1 : 0.6
                                }}
                              />
                        <Input
                          id="companyName"
                          type="text"
                                placeholder={isLabelFloated('companyName') ? "" : "Company Name"}
                          value={formData.companyName}
                          onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                onFocus={() => setFocusedField('companyName')}
                                onBlur={() => setFocusedField(null)}
                                onMouseEnter={() => setHoveredField('companyName')}
                                onMouseLeave={() => setHoveredField(null)}
                                className="pl-10 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                                style={{ 
                                  borderWidth: '1px',
                                  borderColor: getBorderColor('companyName'),
                                  borderStyle: 'solid',
                                  backgroundColor: getInputBackground('companyName'),
                                  boxShadow: focusedField === 'companyName' 
                                    ? '0 0 8px rgba(254,159,22,0.3)' 
                                    : '0 1px 3px rgba(0,0,0,0.08)',
                                  borderRadius: '8px',
                                  transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                  color: '#2C2C2C'
                                }}
                          required
                        />
                            </div>
                          </motion.div>
                      
                          <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.56, ease: "easeOut" }}
                          >
                            <Label 
                              htmlFor="concernName" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                isLabelFloated('concernName') 
                                  ? '-top-2 text-[#2C2C2C] bg-white px-1 opacity-100' 
                                  : 'top-3 opacity-0'
                              }`}
                              style={{
                                transform: isLabelFloated('concernName') ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                              Concern Name *
                        </Label>
                            <div className="relative">
                              <img 
                                src={userIcon} 
                                alt="User" 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10 object-contain"
                                style={{
                                  opacity: focusedField === 'concernName' ? 1 : 0.6
                                }}
                              />
                        <Input
                                id="concernName"
                          type="text"
                                placeholder={isLabelFloated('concernName') ? "" : "Concern Name"}
                                value={formData.concernName}
                                onChange={(e) => setFormData({...formData, concernName: e.target.value})}
                                onFocus={() => setFocusedField('concernName')}
                                onBlur={() => setFocusedField(null)}
                                onMouseEnter={() => setHoveredField('concernName')}
                                onMouseLeave={() => setHoveredField(null)}
                                className="pl-10 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                                style={{ 
                                  borderWidth: '1px',
                                  borderColor: getBorderColor('concernName'),
                                  borderStyle: 'solid',
                                  backgroundColor: getInputBackground('concernName'),
                                  boxShadow: focusedField === 'concernName' ? '0 0 8px rgba(254,159,22,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                  borderRadius: '8px',
                                  transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                  color: '#2C2C2C'
                                }}
                          required
                        />
                            </div>
                          </motion.div>
                      </div>
                      </motion.div>

                        {/* Row 2: Mobile 1, Mobile 2 */}
                        <div className="grid md:grid-cols-2 gap-5">
                          <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.57, ease: "easeOut" }}
                          >
                            <Label 
                              htmlFor="mobile1" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                isLabelFloated('mobile1') 
                                  ? '-top-2 text-[#2C2C2C] bg-white px-1 opacity-100' 
                                  : 'top-3 opacity-0'
                              }`}
                              style={{
                                transform: isLabelFloated('mobile1') ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                              Mobile 1 *
                        </Label>
                        <div className="relative">
                              <img 
                                src={mobileIcon} 
                                alt="Mobile" 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10 object-contain"
                                style={{
                                  opacity: focusedField === 'mobile1' ? 1 : 0.6
                                }}
                              />
                              <div className="absolute left-10 top-1/2 -translate-y-1/2 z-10 flex items-center" style={{ pointerEvents: 'none' }}>
                                <span className="text-sm font-medium" style={{ color: '#6B7280' }}>+91</span>
                                <span className="ml-2" style={{ width: '1px', height: '16px', backgroundColor: '#D1D5DB' }}></span>
                              </div>
                          <Input
                                id="mobile1"
                                type="tel"
                                placeholder={isLabelFloated('mobile1') ? "" : "Mobile 1"}
                                value={formData.mobile1}
                                onChange={(e) => handleMobileChange('mobile1', e.target.value)}
                                onFocus={() => setFocusedField('mobile1')}
                                onBlur={() => setFocusedField(null)}
                                onMouseEnter={() => setHoveredField('mobile1')}
                                onMouseLeave={() => setHoveredField(null)}
                                className="pl-20 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                                style={{ 
                                  borderWidth: '1px',
                                  borderColor: getBorderColor('mobile1'),
                                  borderStyle: 'solid',
                                  backgroundColor: getInputBackground('mobile1'),
                                  boxShadow: focusedField === 'mobile1' ? '0 0 8px rgba(254,159,22,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                  borderRadius: '8px',
                                  transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                  color: '#2C2C2C'
                                }}
                                maxLength={10}
                            required
                          />
                        </div>
                      </motion.div>
                      
                          <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.58, ease: "easeOut" }}
                          >
                            <Label 
                              htmlFor="mobile2" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                isLabelFloated('mobile2') ? '-top-2 text-[#374151] bg-white px-1 opacity-100' : 'top-3 opacity-0'
                              }`}
                              style={{
                                transform: isLabelFloated('mobile2') ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                              Mobile 2
                        </Label>
                        <div className="relative">
                              <img 
                                src={mobileIcon} 
                                alt="Mobile" 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10 object-contain"
                                style={{
                                  opacity: focusedField === 'mobile2' ? 1 : 0.6
                                }}
                              />
                              <div className="absolute left-10 top-1/2 -translate-y-1/2 z-10 flex items-center" style={{ pointerEvents: 'none' }}>
                                <span className="text-sm font-medium" style={{ color: '#6B7280' }}>+91</span>
                                <span className="ml-2" style={{ width: '1px', height: '16px', backgroundColor: '#D1D5DB' }}></span>
                              </div>
                          <Input
                                id="mobile2"
                            type="tel"
                                placeholder={isLabelFloated('mobile2') ? "" : "Mobile 2"}
                                value={formData.mobile2}
                                onChange={(e) => handleMobileChange('mobile2', e.target.value)}
                                onFocus={() => setFocusedField('mobile2')}
                                onBlur={() => setFocusedField(null)}
                                className="pl-20 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                                style={{ 
                                  borderWidth: '1px',
                                  borderColor: getBorderColor('mobile2'),
                                  borderStyle: 'solid',
                                  backgroundColor: getInputBackground('mobile2'),
                                  boxShadow: focusedField === 'mobile2' ? '0 0 8px rgba(254,159,22,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                  borderRadius: '8px',
                                  transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                  color: '#2C2C2C'
                                }}
                                onMouseEnter={() => setHoveredField('mobile2')}
                                onMouseLeave={() => setHoveredField(null)}
                                maxLength={10}
                              />
                            </div>
                          </motion.div>
                        </div>

                        {/* Row 3: Website URL, Email-ID */}
                        <div className="grid md:grid-cols-2 gap-5">
                          <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.59, ease: "easeOut" }}
                          >
                            <Label 
                              htmlFor="websiteUrl" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                isLabelFloated('websiteUrl') ? '-top-2 text-[#374151] bg-white px-1 opacity-100' : 'top-3 opacity-0'
                              }`}
                              style={{
                                transform: isLabelFloated('websiteUrl') ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                              Website URL
                            </Label>
                            <div className="relative">
                              <img 
                                src={webIcon} 
                                alt="Website" 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10 object-contain"
                                style={{
                                  opacity: focusedField === 'websiteUrl' ? 1 : 0.6
                                }}
                              />
                              <Input
                                id="websiteUrl"
                                type="text"
                                placeholder={isLabelFloated('websiteUrl') ? "" : "Website URL"}
                                value={formData.websiteUrl}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData({...formData, websiteUrl: value});
                                }}
                                onBlur={(e) => {
                                  setFocusedField(null);
                                }}
                                onFocus={() => setFocusedField('websiteUrl')}
                                className="pl-10 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                                style={{ 
                                  borderWidth: '1px',
                                  borderColor: getBorderColor('websiteUrl'),
                                  borderStyle: 'solid',
                                  backgroundColor: getInputBackground('websiteUrl'),
                                  boxShadow: focusedField === 'websiteUrl' ? '0 0 8px rgba(254,159,22,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                  borderRadius: '8px',
                                  transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                  color: '#2C2C2C'
                                }}
                                onMouseEnter={() => setHoveredField('websiteUrl')}
                                onMouseLeave={() => setHoveredField(null)}
                              />
                              
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
                          >
                            <Label 
                              htmlFor="email" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                isLabelFloated('email') ? '-top-2 text-[#374151] bg-white px-1 opacity-100' : 'top-3 opacity-0'
                              }`}
                              style={{
                                transform: isLabelFloated('email') ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                              Email-ID *
                            </Label>
                            <div className="relative">
                              <svg 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10"
                                viewBox="0 0 24 24"
                                style={{
                                  opacity: focusedField === 'email' ? 1 : 0.6
                                }}
                              >
                                <path 
                                  d="M22.56 12.25c0-.97-.48-1.94-.48-1.94L12 4.9 1.92 10.31s-.48.97-.48 1.94v8.56c0 .48.48.97.97.97h19.24c.48 0 .97-.49.97-.97v-8.56h-.06z"
                                  fill="#EA4335"
                                />
                                <path 
                                  d="M12 4.9l10.08 5.41c.48-.97.48-1.94.48-1.94L12 4.9 1.44 8.37s0 .97.48 1.94L12 4.9z"
                                  fill="#4285F4"
                                />
                                <path 
                                  d="M12 4.9v15.34c0 .48-.48.97-.97.97H1.92c-.48 0-.97-.49-.97-.97v-8.56c0-.97.48-1.94.48-1.94L12 4.9z"
                                  fill="#34A853"
                                />
                                <path 
                                  d="M22.56 8.37v12.48c0 .48-.49.97-.97.97H12V4.9l10.56 3.47z"
                                  fill="#FBBC04"
                                />
                              </svg>
                              <Input
                                id="email"
                                type="email"
                                placeholder={isLabelFloated('email') ? "" : "Email-ID"}
                                value={formData.email}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData({...formData, email: value});
                                }}
                                onBlur={(e) => {
                                  setFocusedField(null);
                                }}
                                onFocus={() => setFocusedField('email')}
                                className="pl-10 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                                style={{ 
                                  borderWidth: '1px',
                                  borderColor: formData.email && !isValidEmail(formData.email) ? '#EF4444' : getBorderColor('email'),
                                  borderStyle: 'solid',
                                  backgroundColor: getInputBackground('email'),
                                  boxShadow: focusedField === 'email' ? '0 0 8px rgba(254,159,22,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                  borderRadius: '8px',
                                  transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                  cursor: 'text',
                                  opacity: 1,
                                  color: '#2C2C2C'
                                }}
                                onMouseEnter={() => setHoveredField('email')}
                                onMouseLeave={() => setHoveredField(null)}
                            required
                          />
                              {formData.email && !isValidEmail(formData.email) && (
                                <div className="mt-1 text-xs text-red-500" style={{ height: '14px', lineHeight: '14px' }}>
                                  Enter valid email format (e.g., user@example.com)
                        </div>
                              )}
                              
                    </div>
                      </motion.div>
                        </div>

                  {/* Address Information */}
                      <motion.div 
                        className="space-y-5"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                      >
                        {/* Row 1: Locality / Street, Building / Flat No. */}
                        <div className="grid md:grid-cols-2 gap-5">
                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.61, ease: "easeOut" }}
                          >
                          <Label 
                              htmlFor="locality" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                isLabelFloated('locality') ? '-top-2 text-[#374151] bg-white px-1 opacity-100' : 'top-3 opacity-0'
                              }`}
                              style={{
                                transform: isLabelFloated('locality') ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                              Locality / Street *
                      </Label>
                          <div className="relative">
                              <img 
                                src={locationIcon} 
                                alt="Location" 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10 object-contain"
                                style={{
                                  opacity: focusedField === 'locality' ? 1 : 0.6
                                }}
                              />
                              <Input
                                id="locality"
                                type="text"
                                placeholder={isLabelFloated('locality') ? "" : "Locality / Street"}
                                value={formData.locality}
                                onChange={(e) => setFormData({...formData, locality: e.target.value})}
                                onFocus={() => setFocusedField('locality')}
                              onBlur={() => setFocusedField(null)}
                                disabled={!isEmailValid()}
                                className="pl-10 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                              style={{ 
                                borderWidth: '1px',
                                  borderColor: getBorderColor('locality'),
                                borderStyle: 'solid',
                                  backgroundColor: !isEmailValid() ? '#F9FAFB' : getInputBackground('locality'),
                                  boxShadow: focusedField === 'locality' ? '0 0 8px rgba(254,159,22,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                  borderRadius: '8px',
                                  transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                  cursor: !isEmailValid() ? 'not-allowed' : 'text',
                                  opacity: !isEmailValid() ? 0.6 : 1,
                                  color: '#2C2C2C'
                                }}
                                onMouseEnter={() => setHoveredField('locality')}
                                onMouseLeave={() => setHoveredField(null)}
                        required
                      />
                          </div>
                          </motion.div>
                          
                          <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.62, ease: "easeOut" }}
                          >
                            <Label 
                              htmlFor="buildingFlatNo" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                isLabelFloated('buildingFlatNo') ? '-top-2 text-[#374151] bg-white px-1 opacity-100' : 'top-3 opacity-0'
                              }`}
                              style={{
                                transform: isLabelFloated('buildingFlatNo') ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                              Building / Flat No. *
                        </Label>
                            <div className="relative">
                              <img 
                                src={buildingIcon} 
                                alt="Building" 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10 object-contain"
                                style={{
                                  opacity: focusedField === 'buildingFlatNo' ? 1 : 0.6
                                }}
                              />
                        <Input
                                id="buildingFlatNo"
                          type="text"
                                placeholder={isLabelFloated('buildingFlatNo') ? "" : "Building / Flat No."}
                                value={formData.buildingFlatNo}
                                onChange={(e) => setFormData({...formData, buildingFlatNo: e.target.value})}
                                onFocus={() => setFocusedField('buildingFlatNo')}
                                onBlur={() => setFocusedField(null)}
                                disabled={!isEmailValid()}
                                className="pl-10 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                                style={{ 
                                  borderWidth: '1px',
                                  borderColor: getBorderColor('buildingFlatNo'),
                                  borderStyle: 'solid',
                                  backgroundColor: !isEmailValid() ? '#F9FAFB' : getInputBackground('buildingFlatNo'),
                                  boxShadow: focusedField === 'buildingFlatNo' ? '0 0 8px rgba(254,159,22,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                  borderRadius: '8px',
                                  transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                  cursor: !isEmailValid() ? 'not-allowed' : 'text',
                                  opacity: !isEmailValid() ? 0.6 : 1,
                                  color: '#2C2C2C'
                                }}
                                onMouseEnter={() => setHoveredField('buildingFlatNo')}
                                onMouseLeave={() => setHoveredField(null)}
                          required
                        />
                            </div>
                          </motion.div>
                      </div>
                      
                        {/* Row 2: Landmark, Pincode */}
                        <div className="grid md:grid-cols-2 gap-5">
                          <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.63, ease: "easeOut" }}
                          >
                            <Label 
                              htmlFor="landmark" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                isLabelFloated('landmark') ? '-top-2 text-[#374151] bg-white px-1 opacity-100' : 'top-3 opacity-0'
                              }`}
                              style={{
                                transform: isLabelFloated('landmark') ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                              Landmark
                        </Label>
                            <div className="relative">
                              <img 
                                src={locationIcon} 
                                alt="Location" 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10 object-contain"
                                style={{
                                  opacity: focusedField === 'landmark' ? 1 : 0.6
                                }}
                              />
                        <Input
                                id="landmark"
                          type="text"
                                placeholder={isLabelFloated('landmark') ? "" : "Landmark"}
                                value={formData.landmark}
                                onChange={(e) => setFormData({...formData, landmark: e.target.value})}
                                onFocus={() => setFocusedField('landmark')}
                                onBlur={() => setFocusedField(null)}
                                disabled={!isEmailValid()}
                                className="pl-10 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                                style={{ 
                                  borderWidth: '1px',
                                  borderColor: getBorderColor('landmark'),
                                  borderStyle: 'solid',
                                  backgroundColor: !isEmailValid() ? '#F9FAFB' : getInputBackground('landmark'),
                                  boxShadow: focusedField === 'landmark' ? '0 0 8px rgba(254,159,22,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                  borderRadius: '8px',
                                  transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                  cursor: !isEmailValid() ? 'not-allowed' : 'text',
                                  opacity: !isEmailValid() ? 0.6 : 1,
                                  color: '#2C2C2C'
                                }}
                                onMouseEnter={() => setHoveredField('landmark')}
                                onMouseLeave={() => setHoveredField(null)}
                        />
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.64, ease: "easeOut" }}
                          >
                            <Label 
                              htmlFor="pincode" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                isLabelFloated('pincode') ? '-top-2 text-[#374151] bg-white px-1 opacity-100' : 'top-3 opacity-0'
                              }`}
                              style={{
                                transform: isLabelFloated('pincode') ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                              Pincode *
                        </Label>
                            <div className="relative">
                              <img 
                                src={locationIcon} 
                                alt="Location" 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10 object-contain"
                                style={{
                                  opacity: focusedField === 'pincode' ? 1 : 0.6
                                }}
                              />
                        <Input
                          id="pincode"
                          type="text"
                                placeholder={isLabelFloated('pincode') ? "" : "Pincode"}
                          value={formData.pincode}
                                onChange={handlePincodeChange}
                                onFocus={() => setFocusedField('pincode')}
                                onBlur={() => setFocusedField(null)}
                                disabled={!isEmailValid()}
                                className="pl-10 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                                style={{ 
                                  borderWidth: '1px',
                                  borderColor: getBorderColor('pincode'),
                                  borderStyle: 'solid',
                                  backgroundColor: !isEmailValid() ? '#F9FAFB' : getInputBackground('pincode'),
                                  boxShadow: focusedField === 'pincode' ? '0 0 8px rgba(254,159,22,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                  borderRadius: '8px',
                                  transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                  cursor: !isEmailValid() ? 'not-allowed' : 'text',
                                  opacity: !isEmailValid() ? 0.6 : 1,
                                  color: '#2C2C2C'
                                }}
                                onMouseEnter={() => setHoveredField('pincode')}
                                onMouseLeave={() => setHoveredField(null)}
                                maxLength={6}
                          required
                        />
                              {isLoadingPincode && (
                                <div className="absolute right-3 top-3.5">
                                  <div className="h-4 w-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                              )}
                  </div>
                      </motion.div>
                        </div>

                        {/* Row 3: State, City */}
                        <div className="grid md:grid-cols-2 gap-5">
                      <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.65, ease: "easeOut" }}
                          >
                            <Label 
                              htmlFor="state" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                isLabelFloated('state') ? '-top-2 text-[#374151] bg-white px-1 opacity-100' : 'top-3 opacity-0'
                              }`}
                              style={{
                                transform: isLabelFloated('state') ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                              State
                        </Label>
                            <div className="relative">
                              <img 
                                src={locationIcon} 
                                alt="Location" 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10 object-contain"
                                style={{
                                  opacity: focusedField === 'state' ? 1 : 0.6
                                }}
                              />
                        <Input
                                id="state"
                          type="text"
                                placeholder={isLabelFloated('state') ? "" : "State"}
                                value={formData.state}
                                onChange={(e) => setFormData({...formData, state: e.target.value})}
                                onFocus={() => setFocusedField('state')}
                                onBlur={() => setFocusedField(null)}
                                disabled={!isEmailValid() || formData.pincode.length === 6}
                                className="pl-10 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                                style={{ 
                                  borderWidth: '1px',
                                  borderColor: getBorderColor('state'),
                                  borderStyle: 'solid',
                                  backgroundColor: (!isEmailValid() || formData.pincode.length === 6) ? '#F9FAFB' : getInputBackground('state'),
                                  boxShadow: focusedField === 'state' ? '0 0 8px rgba(254,159,22,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                  borderRadius: '8px',
                                  transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                  cursor: (!isEmailValid() || formData.pincode.length === 6) ? 'not-allowed' : 'text',
                                  color: '#2C2C2C',
                                  opacity: (!isEmailValid() || formData.pincode.length === 6) ? 0.6 : 1
                                }}
                                onMouseEnter={() => setHoveredField('state')}
                                onMouseLeave={() => setHoveredField(null)}
                                readOnly={formData.pincode.length === 6}
                        />
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.66, ease: "easeOut" }}
                          >
                            <Label 
                              htmlFor="city" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                isLabelFloated('city') ? '-top-2 text-[#374151] bg-white px-1 opacity-100' : 'top-3 opacity-0'
                              }`}
                              style={{
                                transform: isLabelFloated('city') ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                              City
                        </Label>
                            <div className="relative">
                              <img 
                                src={locationIcon} 
                                alt="Location" 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10 object-contain"
                                style={{
                                  opacity: focusedField === 'city' ? 1 : 0.6
                                }}
                              />
                        <Input
                                id="city"
                          type="text"
                                placeholder={isLabelFloated('city') ? "" : "City"}
                                value={formData.city}
                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                                onFocus={() => setFocusedField('city')}
                                onBlur={() => setFocusedField(null)}
                                disabled={!isEmailValid() || formData.pincode.length === 6}
                                className="pl-10 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                                style={{ 
                                  borderWidth: '1px',
                                  borderColor: getBorderColor('city'),
                                  borderStyle: 'solid',
                                  backgroundColor: (!isEmailValid() || formData.pincode.length === 6) ? '#F9FAFB' : getInputBackground('city'),
                                  boxShadow: focusedField === 'city' ? '0 0 8px rgba(254,159,22,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                  borderRadius: '8px',
                                  transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                  cursor: (!isEmailValid() || formData.pincode.length === 6) ? 'not-allowed' : 'text',
                                  color: '#2C2C2C',
                                  opacity: (!isEmailValid() || formData.pincode.length === 6) ? 0.6 : 1
                                }}
                                onMouseEnter={() => setHoveredField('city')}
                                onMouseLeave={() => setHoveredField(null)}
                                readOnly={formData.pincode.length === 6}
                              />
                            </div>
                          </motion.div>
                    </div>

                        {/* Area Dropdown - Only show when pincode is entered */}
                        {formData.pincode.length === 6 && availableAreas.length > 0 && (
                          <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.67, ease: "easeOut" }}
                          >
                            <Label 
                              htmlFor="area" 
                              className={`absolute left-3 text-xs font-normal transition-all duration-300 ease-out pointer-events-none z-20 ${
                                formData.area || focusedField === 'area' ? '-top-2 text-[#374151] bg-white px-1 opacity-100' : 'top-3 opacity-0'
                              }`}
                                style={{ 
                                transform: formData.area || focusedField === 'area' ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.9)',
                                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, top 0.3s ease-out'
                              }}
                            >
                              Area *
                        </Label>
                            <div className="relative">
                              <img 
                                src={locationIcon} 
                                alt="Location" 
                                className="absolute left-3 top-3.5 h-4 w-4 transition-opacity duration-300 ease-out z-10 object-contain"
                                style={{
                                  opacity: focusedField === 'area' ? 1 : 0.6
                                }}
                              />
                              <Select 
                                value={formData.area} 
                                onValueChange={(value) => setFormData({...formData, area: value})}
                                disabled={!isEmailValid()}
                              >
                              <SelectTrigger 
                                  className="pl-10 pt-3 border rounded-lg focus:outline-none focus:ring-0"
                                style={{ 
                                  borderWidth: '1px',
                                    borderColor: getBorderColor('area'),
                                    borderStyle: 'solid',
                                    backgroundColor: !isEmailValid() ? '#F9FAFB' : getInputBackground('area'),
                                    boxShadow: focusedField === 'area' ? '0 0 8px rgba(254,159,22,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                                    borderRadius: '8px',
                                    transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out',
                                    cursor: !isEmailValid() ? 'not-allowed' : 'pointer',
                                    opacity: !isEmailValid() ? 0.6 : 1,
                                    minHeight: '42px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#2C2C2C'
                                  }}
                                  onFocus={() => setFocusedField('area')}
                                  onBlur={() => setFocusedField(null)}
                                  onMouseEnter={() => setHoveredField('area')}
                                  onMouseLeave={() => setHoveredField(null)}
                                >
                                  <SelectValue placeholder={formData.area ? "" : "Select Area"} />
                          </SelectTrigger>
                          <SelectContent>
                                  {availableAreas.map((area, index) => (
                                    <SelectItem key={index} value={area}>
                                      {area}
                                    </SelectItem>
                                  ))}
                          </SelectContent>
                        </Select>
                      </div>
                          </motion.div>
                        )}
                      </motion.div>

                  {/* Type of Address */}
                      <motion.div 
                        className="space-y-5"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.65, ease: "easeOut" }}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5" style={{ color: '#FDA11E' }} />
                          <h3 className="text-lg font-normal" style={{ color: '#111827', opacity: 0.9 }}>
                            Type of Address
                          </h3>
                        </div>
                        <div 
                          className="p-4 md:p-4 rounded-lg bg-white credit-radio-card-mobile"
                              style={{ 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.05)'
                          }}
                        >
                          <style>{`
                            .radio-wrapper-1 {
                              color: #212529;
                              font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                              font-weight: 400;
                              line-height: 1.5;
                            }
                            
                            .radio-wrapper-1 label {
                              display: inline-block;
                              padding-left: .25em;
                              font-size: 0.875rem;
                              cursor: pointer;
                              color: #374151;
                            }
                            
                            .radio-wrapper-1 input[type=radio] {
                              font-family: inherit;
                              font-size: inherit;
                              line-height: inherit;
                              margin-bottom: 0;
                              margin-right: 0;
                            }
                            
                            .radio-wrapper-1 input[type=radio] {
                              background-position: center center;
                              -webkit-print-color-adjust: exact;
                              appearance: none;
                              background-color: #fff;
                              background-repeat: no-repeat;
                              background-size: contain;
                              border: 1px solid rgba(0, 0, 0, .25);
                              height: 1em;
                              margin-top: .25em;
                              vertical-align: top;
                              width: 1em;
                              border-radius: 50%;
                            }
                            
                            .radio-wrapper-1 input[type=radio]:active {
                              filter: brightness(90%);
                            }
                            
                            .radio-wrapper-1 input[type=radio]:focus {
                              border-color: #86b7fe;
                              box-shadow: rgba(13, 110, 253, .25) 0 0 0 .25rem;
                              outline: 0;
                            }
                            
                            .radio-wrapper-1 input[type=radio]:checked {
                              background-color: #0d6efd;
                              border-color: #0d6efd;
                            }
                            
                            .radio-wrapper-1 input[type=radio]:checked {
                              background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23fff'/%3e%3c/svg%3e");
                            }
                            
                            .radio-wrapper-1 input[type=radio]:disabled {
                              filter: none;
                              opacity: .5;
                              pointer-events: none;
                            }
                            
                            .radio-wrapper-1 input[type=radio]:disabled ~ label {
                              opacity: .5;
                            }
                          `}</style>
                          <div className="flex flex-row gap-4 md:gap-6 credit-radio-group-mobile">
                            <div className="radio-wrapper-1">
                              <input 
                                type="radio" 
                                id="home" 
                                name="addressType"
                                value="home"
                                checked={formData.addressType === "home"}
                                onChange={(e) => setFormData({...formData, addressType: e.target.value})}
                              />
                              <label htmlFor="home">Home</label>
                            </div>
                            <div className="radio-wrapper-1">
                              <input 
                                type="radio" 
                                id="office" 
                                name="addressType"
                                value="office"
                                checked={formData.addressType === "office"}
                                onChange={(e) => setFormData({...formData, addressType: e.target.value})}
                              />
                              <label htmlFor="office">Office</label>
                            </div>
                            <div className="radio-wrapper-1">
                              <input 
                                type="radio" 
                                id="other" 
                                name="addressType"
                                value="other"
                                checked={formData.addressType === "other"}
                                onChange={(e) => setFormData({...formData, addressType: e.target.value})}
                              />
                              <label htmlFor="other">Other</label>
                            </div>
                          </div>
                    </div>
                      </motion.div>

                  {/* Terms and Conditions */}
                      <motion.div 
                        className="flex items-start space-x-3 mt-4 md:mt-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
                      >
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => setFormData({...formData, acceptTerms: checked as boolean})}
                      disabled={!isFormValid()}
                          className="mt-1 credit-checkbox-mobile"
                      style={{ 
                        borderColor: 'rgba(0,0,0,0.08)',
                        opacity: !isFormValid() ? 0.5 : 1,
                        cursor: !isFormValid() ? 'not-allowed' : 'pointer'
                      }}
                    />
                        <Label htmlFor="terms" className="text-sm leading-5 cursor-pointer" style={{ color: '#374151' }}>
                      I accept the{" "}
                          <a href="/terms" className="text-[#FDA11E] hover:underline font-medium">
                        Terms & Conditions
                      </a>{" "}
                      and{" "}
                          <a href="/credit-terms" className="text-[#FDA11E] hover:underline font-medium">
                        <span style={{ color: '#FFA019' }}>Credit</span> Terms
                      </a>
                    </Label>
                      </motion.div>

                      <motion.div
                        className="flex justify-center mt-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
                      >
                        <motion.div
                          className="relative"
                          whileHover={{ 
                            scale: 1.05
                          }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 400,
                            damping: 17
                          }}
                        >
                  <Button
                    type="submit"
                            disabled={isLoading || !formData.acceptTerms || !isFormValid()}
                            className="button-17 relative overflow-hidden"
                            style={{
                              background: 'linear-gradient(90deg, #FE9F16 0%, #FDBD4E 100%)',
                              color: 'white',
                              width: 'auto',
                              minWidth: '200px',
                              borderRadius: '12px',
                              boxShadow: '0 8px 20px rgba(253,161,30,0.3)',
                              border: 'none'
                            }}
                          >
                            {/* Shimmer Effect */}
                            <motion.div
                              className="absolute inset-0 -z-0"
                              style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                backgroundSize: '200% 100%',
                              }}
                              animate={{
                                x: ['-100%', '100%'],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1,
                                ease: "linear"
                              }}
                            />
                            <span className="relative z-10 flex items-center gap-2">
                              {isLoading && (
                                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="3"/>
                                  <path d="M21 12a9 9 0 0 0-9-9" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
                                </svg>
                              )}
                              {isLoading ? "Submitting…" : "Submit Application"}
                            </span>
                  </Button>
                        </motion.div>
                      </motion.div>
                  <style>{`
                    .button-17 {
                      align-items: center;
                      appearance: none;
                      background-color: #fff;
                      border-radius: 24px;
                      border-style: none;
                      box-shadow: rgba(0, 0, 0, .2) 0 3px 5px -1px,rgba(0, 0, 0, .14) 0 6px 10px 0,rgba(0, 0, 0, .12) 0 1px 18px 0;
                      box-sizing: border-box;
                      color: #3c4043;
                      cursor: pointer;
                      display: inline-flex;
                      fill: currentcolor;
                      font-family: "Google Sans",Roboto,Arial,sans-serif;
                      font-size: 14px;
                      font-weight: 500;
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
                      transition: box-shadow 280ms cubic-bezier(.4, 0, .2, 1),opacity 15ms linear 30ms,transform 270ms cubic-bezier(0, 0, .2, 1) 0ms;
                      user-select: none;
                      -webkit-user-select: none;
                      touch-action: manipulation;
                      width: auto;
                      will-change: transform,opacity;
                      z-index: 0;
                    }

                    .button-17:hover {
                      background: #F6F9FE;
                      color: #174ea6;
                    }

                    .button-17:active {
                      box-shadow: 0 4px 4px 0 rgb(60 64 67 / 30%), 0 8px 12px 6px rgb(60 64 67 / 15%);
                      outline: none;
                    }

                    .button-17:focus {
                      outline: none;
                      border: 2px solid #4285f4;
                    }

                    .button-17:not(:disabled) {
                      box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
                    }

                    .button-17:not(:disabled):hover {
                      box-shadow: rgba(60, 64, 67, .3) 0 2px 3px 0, rgba(60, 64, 67, .15) 0 6px 10px 4px;
                    }

                    .button-17:not(:disabled):focus {
                      box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
                    }

                    .button-17:not(:disabled):active {
                      box-shadow: rgba(60, 64, 67, .3) 0 4px 4px 0, rgba(60, 64, 67, .15) 0 8px 12px 6px;
                    }

                    .button-17:disabled {
                      box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
                    }

                    /* Override for gradient button (Track Application) */
                    .button-17[style*="gradient"] {
                      background: linear-gradient(90deg, #FE9F16, #FDBD4E) !important;
                      color: white !important;
                    }

                    .button-17[style*="gradient"]:hover {
                      background: linear-gradient(90deg, #FFB648, #FEC96E) !important;
                      color: white !important;
                    }

                    /* Outline button styles (Go to Home) */
                    .button-17-outline {
                      background-color: #fff !important;
                      color: #2C2C2C !important;
                      border: 1px solid #DDD !important;
                    }

                    .button-17-outline:hover {
                      background: #FFFFFF !important;
                      color: #2C2C2C !important;
                      border-color: #DDD !important;
                    }

                    .button-17-outline:active {
                      background: #FFFFFF !important;
                      color: #2C2C2C !important;
                    }

                    .button-17-outline:focus {
                      background: #FFFFFF !important;
                      color: #2C2C2C !important;
                    }
                  `}</style>
                    </motion.form>
                  )}

                  {submissionStage === 'success' && null}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>
      </div>

      <Footer />

      {/* Success Modal Overlay */}
      {submissionStage === 'truck' && (
                    <motion.div
          key="truck-modal"
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative w-full max-w-[600px] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="rounded-[20px] overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #FFF8F1 0%, #FFEFD7 100%)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
            >
              <div className="p-10">
                <div className="w-full h-[180px] relative overflow-hidden">
                  {/* Road */}
                  <div className="absolute left-0 right-0" style={{ bottom: '20px', height: '2px', background: '#D1D5DB', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
                  {/* Motion blur trail */}
                  <motion.div
                    className="absolute" style={{ bottom: '36px', width: '160px', height: '12px', background: 'linear-gradient(90deg, rgba(254,159,22,0.25), rgba(254,159,22,0))', filter: 'blur(6px)' }}
                    initial={{ x: '-30%' }}
                    animate={{ x: ['-30%', '110%'] }}
                    transition={{ duration: 2.2, ease: [0.45, 0, 0.55, 1] }}
                  />
                  {/* Truck inside card */}
                  <motion.div
                    className="absolute"
                    style={{ bottom: '8px' }}
                    initial={{ x: '-30%' }}
                    animate={{ x: ['-30%', '110%'] }}
                    transition={{ duration: 2.2, ease: [0.45, 0, 0.55, 1] }}
                  >
                    <div className="relative">
                      {[...Array(4)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute rounded-full"
                          style={{ width: 10, height: 10, background: 'rgba(120,120,120,0.35)', right: -8 - i * 6, bottom: 18 }}
                          initial={{ opacity: 0.6, y: 0, scale: 0.8 }}
                          animate={{ opacity: [0.6, 0], y: -16 - i * 8, scale: 1.2 }}
                          transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity, repeatDelay: 0.4 }}
                        />
                      ))}
                      <svg width="225" height="90" viewBox="0 0 180 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scale(1.25)' }}>
                        <rect x="4" y="26" width="96" height="32" rx="4" fill="#FE9F16"/>
                        <rect x="100" y="30" width="52" height="28" rx="3" fill="#FE9F16"/>
                        <rect x="106" y="36" width="24" height="10" rx="2" fill="#FFFFFF" opacity="0.9"/>
                        <motion.circle cx="34" cy="62" r="9" fill="#111827" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
                        <circle cx="34" cy="62" r="4" fill="#9CA3AF"/>
                        <motion.circle cx="118" cy="62" r="9" fill="#111827" animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
                        <circle cx="118" cy="62" r="4" fill="#9CA3AF"/>
                      </svg>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      {submissionStage === 'success' && (
                      <motion.div
          key="success-modal"
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          onClick={() => { setSubmissionStage('form'); setIsSubmitted(false); }}
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="relative w-full max-w-[600px] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <motion.button
              aria-label="Close"
              onClick={() => { setSubmissionStage('form'); setIsSubmitted(false); }}
              className="absolute -top-3 -right-3 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center shadow"
              style={{ border: '1px solid rgba(0,0,0,0.1)' }}
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.6 }}
            >
              ×
            </motion.button>

            <div
              className="rounded-[20px]"
              style={{ background: '#FFFFFF', boxShadow: '0 6px 25px rgba(0,0,0,0.1)' }}
            >
              <motion.div className="px-10 py-12 flex flex-col items-center text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                {/* Outlined green badge with animated tick */}
                <motion.svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" className="mb-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: [0.95, 1.05, 1] }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  <circle cx="48" cy="48" r="40" fill="#FFFFFF" stroke="#009B72" strokeWidth="6" />
                  <motion.path d="M30 48 L42 60 L66 36" stroke="#009B72" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </motion.svg>

                <motion.h3 className="text-[22px] font-bold" style={{ color: '#1A1A1A' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  Application Submitted Successfully!
                      </motion.h3>
                <motion.p className="mt-2 text-[15px]" style={{ color: '#555' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                      >
                  Our team will review your request shortly.
                      </motion.p>

                <motion.div className="mt-7 grid grid-cols-2 gap-4 w-full max-w-[360px]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <motion.button className="w-full" style={{ background: '#FE9F16', color: '#fff', borderRadius: 10, height: 48 }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }} onClick={() => (window.location.href = '/my-shipments')}>
                    Track Application
                  </motion.button>
                  <motion.button className="w-full" style={{ background: '#FFFFFF', color: '#000', border: '1px solid #CCC', borderRadius: 10, height: 48 }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }} onClick={() => (window.location.href = '/') }>
                    Go to Home
                  </motion.button>
                    </motion.div>
          </motion.div>
        </div>
          </motion.div>
        </motion.div>
      )}
      
      <style>{`
        @media (max-width: 767px) {
          .credit-benefits-title-mobile {
            padding: 0.5rem 0.75rem !important;
          }
          .credit-benefits-image-mobile {
            max-width: 100% !important;
          }
          .credit-benefits-orange-box-mobile {
            transform: translate(8px, 8px) !important;
          }
          .credit-benefits-img {
            height: 180px !important;
          }
          .credit-benefits-content-mobile {
            padding-left: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CreditAccount;
