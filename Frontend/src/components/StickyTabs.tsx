import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, MessageCircle, ShoppingCart, Phone, Mail, User, Building, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import flagIcon from "@/Icon-images/flag.png";

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  service?: string;
  budget?: string;
}

const StickyTabs = () => {
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const [enquiryFormData, setEnquiryFormData] = useState<FormData>({
    name: "", email: "", phone: "", company: "", message: ""
  });
  const [salesFormData, setSalesFormData] = useState<FormData>({
    name: "", email: "", phone: "", company: "", message: "", service: "", budget: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();

  // Color animation - changes every second
  const colors = [
    "from-blue-900 to-blue-700", // Night blue
    "from-primary to-primary/80", // Teal
    "from-purple-900 to-purple-700", // Purple
    "from-indigo-900 to-indigo-700", // Indigo
    "from-slate-900 to-slate-700", // Slate
    "from-cyan-900 to-cyan-700", // Cyan
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen for custom event to open enquiry modal
  useEffect(() => {
    const handleOpenEnquiry = () => {
      setTimeout(() => {
        setEnquiryOpen(true);
      }, 300);
    };

    window.addEventListener('openEnquiry', handleOpenEnquiry);
    return () => {
      window.removeEventListener('openEnquiry', handleOpenEnquiry);
    };
  }, []);

  // Reset form data when modal opens to ensure fresh form every time
  useEffect(() => {
    if (enquiryOpen) {
      setEnquiryFormData({ name: "", email: "", phone: "", company: "", message: "" });
      setFocusedField(null);
      setIsSubmitted(false);
      setSubmitError(null);
    }
  }, [enquiryOpen]);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate success
      setIsSubmitted(true);
      setIsSubmitting(false);
    } catch (error) {
      setSubmitError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setIsSubmitted(false);
    setEnquiryFormData({ name: "", email: "", phone: "", company: "", message: "" });
    setFocusedField(null);
    setEnquiryOpen(false);
  };

  const handleSendAnother = () => {
    setIsSubmitted(false);
    setEnquiryFormData({ name: "", email: "", phone: "", company: "", message: "" });
    setFocusedField(null);
  };

  const handleSalesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "Sales Inquiry Submitted Successfully!",
      description: "Thank you for your interest. Our sales team will reach out to you soon.",
    });

    setSalesFormData({ name: "", email: "", phone: "", company: "", message: "", service: "", budget: "" });
    setSalesOpen(false);
    setIsSubmitting(false);
  };

  return (
    <>
      {/* Sticky Tabs - Enquiry on Left, Sales on Right */}
      {/* ENQUIRY - Left side */}
      <div className="hidden md:block fixed left-0 z-[9999]" style={{ top: '50%', transform: 'translateY(-50%)' }}>
        <motion.button
          onClick={() => setEnquiryOpen(true)}
          className="text-white py-8 w-10 md:w-11 rounded-r-2xl shadow-lg transition-all duration-300 group relative overflow-hidden"
          style={{ 
            writingMode: 'vertical-rl', 
            textOrientation: 'mixed',
            background: '#F4B840',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="flex items-center justify-center h-full relative z-10">
            <span className="text-sm font-bold tracking-wider text-white drop-shadow-md">ENQUIRY</span>
          </div>
        </motion.button>
      </div>

      {/* SALES - Right side */}
      <div className="hidden md:block fixed right-0 z-[9999]" style={{ top: '50%', transform: 'translateY(-50%)' }}>
        <motion.button
          onClick={() => setSalesOpen(true)}
          className="text-white py-8 w-10 md:w-11 rounded-l-2xl shadow-lg transition-all duration-300 group relative overflow-hidden"
          style={{ 
            writingMode: 'vertical-rl', 
            textOrientation: 'mixed',
            background: '#F4B840',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="flex items-center justify-center h-full relative z-10">
            <span className="text-sm font-bold tracking-wider text-white drop-shadow-md">SALES</span>
          </div>
        </motion.button>
      </div>

      {/* Enquiry Modal */}
      <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
        <DialogContent 
          className="sm:max-w-md max-h-[90vh] overflow-y-auto" 
          onPointerDownOutside={(e) => e.preventDefault()} 
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{ backgroundColor: "#F2FCFB", boxShadow: "rgba(0, 0, 0, 0.56) 0px 22px 70px 4px" }}
        >
          <style>{`
            /* Hide default DialogContent close button only when success screen is shown */
            ${isSubmitted ? `
              button[data-radix-dialog-close],
              [data-radix-dialog-content] button[data-radix-dialog-close],
              [data-radix-dialog-content] > button[data-radix-dialog-close],
              button.absolute.right-4.top-4,
              button[class*="right-4"][class*="top-4"],
              [data-radix-dialog-content] > button:last-child:has(svg),
              button:has(svg.h-4.w-4):has(span[class*="sr-only"]) {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
              }
            ` : ''}

            .floating-label-wrapper {
              position: relative;
              margin-bottom: 0;
            }

            .floating-label {
              position: absolute;
              left: 44px;
              top: 50%;
              transform: translateY(-50%);
              font-size: 15px;
              color: #4B5563;
              background: #FFFFFF;
              padding: 0 4px;
              transition: all 0.2s ease;
              pointer-events: none;
              font-family: 'Value Serif Pro Bold', serif;
              font-weight: 400;
              z-index: 1;
              line-height: 1.5;
            }

            .floating-label-wrapper.focused .floating-label,
            .floating-label-wrapper.has-value .floating-label {
              color: #FDA11E;
              font-size: 11px;
              top: 0;
              left: 16px;
              transform: translateY(-50%);
              font-weight: 500;
            }

            .floating-label-wrapper.focused .floating-label[for*="message"],
            .floating-label-wrapper.has-value .floating-label[for*="message"] {
              top: 0;
              transform: translateY(-50%);
            }

            .floating-input {
              width: 100%;
              border: 1px solid #E2E8F0;
              border-radius: 10px;
              padding: 14px 16px 14px 44px;
              font-size: 15px;
              line-height: 1.5;
              font-family: 'Value Serif Pro Bold', serif;
              font-weight: 400;
              background: #FFFFFF;
              transition: border-color 0.2s ease, box-shadow 0.2s ease;
              height: 48px;
              box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
            }

            .floating-input:focus {
              outline: none;
              border-color: #FDA11E;
              box-shadow: 0px 0px 0px 3px rgba(253, 161, 30, 0.1), rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
            }

            .floating-input::placeholder {
              color: transparent;
            }

            .floating-textarea {
              width: 100%;
              border: 1px solid #E2E8F0;
              border-radius: 10px;
              padding: 14px 16px 28px 16px;
              font-size: 15px;
              line-height: 1.5;
              font-family: 'Value Serif Pro Bold', serif;
              font-weight: 400;
              background: #FFFFFF;
              transition: border-color 0.2s ease, box-shadow 0.2s ease;
              min-height: 100px;
              box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
            }

            .floating-label-wrapper.message-field:not(.focused):not(.has-value) .floating-label {
              left: 16px;
              top: 14px;
              transform: none;
            }

            .floating-label-wrapper.phone-field .floating-label {
              left: 90px;
            }

            .floating-label-wrapper.phone-field.focused .floating-label,
            .floating-label-wrapper.phone-field.has-value .floating-label {
              left: 16px;
              top: 0;
              transform: translateY(-50%);
            }

            /* CSS for asterisk visibility - always visible */
            .required-asterisk {
              visibility: visible;
              opacity: 1;
              color: #EF4444;
            }

            .floating-textarea:focus {
              outline: none;
              border-color: #FDA11E;
              box-shadow: 0px 0px 0px 3px rgba(253, 161, 30, 0.1), rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
            }

            .floating-textarea::placeholder {
              color: transparent;
            }

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
          `}</style>
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center justify-center py-8 px-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                  className="mb-6"
                >
                  <CheckCircle className="w-20 h-20" style={{ color: "#4BB543" }} strokeWidth={1.5} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-center mb-6"
                >
                  <h3 
                    className="text-2xl font-semibold mb-3"
                    style={{ 
                      color: "#4BB543",
                      fontFamily: "'Value Serif Pro Bold', serif"
                    }}
                  >
                    Thank you! Your enquiry has been received.
                  </h3>
                  <p 
                    className="text-base"
                    style={{ 
                      color: "#6B7280",
                      fontFamily: "'Value Serif Pro Bold', serif"
                    }}
                  >
                    Our team will get in touch with you shortly.
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="flex flex-col sm:flex-row gap-3 w-full"
                >
                  <button
                    onClick={handleCloseSuccess}
                    className="button-17 flex-1"
                    style={{
                      fontFamily: "'Value Serif Pro Bold', serif",
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSendAnother}
                    className="button-17 flex-1"
                    style={{
                      fontFamily: "'Value Serif Pro Bold', serif",
                    }}
                  >
                    Send another enquiry
                  </button>
                </motion.div>
                </motion.div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex justify-center">
                    <div 
                      className="px-6 py-2 rounded-full border-2"
                      style={{
                        borderColor: "#FFE5B4",
                        backgroundColor: "#FFE5B4",
                        fontFamily: "'Value Serif Pro Bold', serif",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#0B2E4E",
                        display: "inline-block"
                      }}
                    >
                      ENQUIRY
                    </div>
            </DialogTitle>
                </DialogHeader>
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleEnquirySubmit}
                  className="space-y-4 mt-4"
                >
            <div className={`floating-label-wrapper ${focusedField === "enquiry-name" ? "focused" : ""} ${enquiryFormData.name ? "has-value" : ""}`}>
              <label className="floating-label">Full Name <span className="required-asterisk">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 z-10" style={{ color: "#9CA3AF", strokeWidth: "1.5" }} />
                <Input
                  id="enquiry-name"
                  type="text"
                  placeholder="Full Name"
                  value={enquiryFormData.name}
                  onChange={(e) => setEnquiryFormData({...enquiryFormData, name: e.target.value})}
                  className="floating-input"
                  onFocus={() => setFocusedField("enquiry-name")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </div>

            <div className={`floating-label-wrapper ${focusedField === "enquiry-email" ? "focused" : ""} ${enquiryFormData.email ? "has-value" : ""}`}>
              <label className="floating-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 z-10" style={{ color: "#9CA3AF", strokeWidth: "1.5" }} />
                <Input
                  id="enquiry-email"
                  type="email"
                  placeholder="Email Address "
                  value={enquiryFormData.email}
                  onChange={(e) => setEnquiryFormData({...enquiryFormData, email: e.target.value})}
                  className="floating-input"
                  onFocus={() => setFocusedField("enquiry-email")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            <div className={`floating-label-wrapper phone-field ${focusedField === "enquiry-phone" ? "focused" : ""} ${enquiryFormData.phone ? "has-value" : ""}`}>
              <label className="floating-label">Phone Number <span className="required-asterisk">*</span></label>
              <div className="relative flex items-center gap-2" style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "0", background: "#FFFFFF", boxShadow: "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px" }}>
                <div 
                  className="flex items-center gap-1.5 px-3 py-3 rounded-l-lg"
                  style={{
                    borderRight: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                  }}
                >
                  <img 
                    src={flagIcon} 
                    alt="India" 
                    style={{
                      width: "20px",
                      height: "15px",
                      objectFit: "cover",
                      borderRadius: "2px"
                    }}
                  />
                  <span 
                    style={{ 
                      color: "#4B5563",
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontSize: "15px",
                      fontWeight: "500"
                    }}
                  >
                    +91
                  </span>
                </div>
                <Input
                  id="enquiry-phone"
                  type="tel"
                  placeholder=""
                  value={enquiryFormData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setEnquiryFormData({...enquiryFormData, phone: value});
                  }}
                  maxLength={10}
                  className="flex-1 border-0 focus:ring-0 focus:outline-none"
                  style={{ 
                    padding: "14px 16px",
                    fontFamily: "'Value Serif Pro Bold', serif",
                    fontSize: "15px",
                    lineHeight: "1.5",
                    fontWeight: "400",
                    background: "transparent",
                    boxShadow: "none"
                  }}
                  onFocus={(e) => {
                    setFocusedField("enquiry-phone");
                    const parent = e.currentTarget.closest(".relative") as HTMLElement;
                    if (parent) {
                      parent.style.borderColor = "#FDA11E";
                      parent.style.boxShadow = "0px 0px 0px 3px rgba(253, 161, 30, 0.1), rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px";
                    }
                  }}
                  onBlur={(e) => {
                    setFocusedField(null);
                    const parent = e.currentTarget.closest(".relative") as HTMLElement;
                    if (parent) {
                      parent.style.borderColor = "#E2E8F0";
                      parent.style.boxShadow = "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px";
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div className={`floating-label-wrapper message-field ${focusedField === "enquiry-message" ? "focused" : ""} ${enquiryFormData.message ? "has-value" : ""}`}>
              <label className="floating-label">Message</label>
              <div className="relative">
                <Textarea
                  id="enquiry-message"
                  placeholder="Message"
                  value={enquiryFormData.message}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 150);
                    setEnquiryFormData({...enquiryFormData, message: value});
                  }}
                  maxLength={150}
                  className="floating-textarea"
                  onFocus={() => setFocusedField("enquiry-message")}
                  onBlur={() => setFocusedField(null)}
                />
                <div 
                  className="absolute bottom-2 right-3 text-xs"
                  style={{
                    color: "#9CA3AF",
                    fontFamily: "'Value Serif Pro Bold', serif",
                  }}
                >
                  {enquiryFormData.message.length}/150
                </div>
              </div>
            </div>

            <div className="flex justify-center">
            <Button
              type="submit"
                disabled={isSubmitting || !enquiryFormData.name || !enquiryFormData.phone || enquiryFormData.phone.length !== 10}
                className="text-white font-semibold px-8 py-2
                       hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-primary/25"
                style={{
                  fontFamily: "'Value Serif Pro Bold', serif",
                  fontSize: "14px",
                  backgroundColor: "#FDA21F",
                  opacity: (!enquiryFormData.name || !enquiryFormData.phone || enquiryFormData.phone.length !== 10) ? 0.5 : 1,
                  cursor: (!enquiryFormData.name || !enquiryFormData.phone || enquiryFormData.phone.length !== 10) ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Submitting..." : "SUBMIT"}
            </Button>
            </div>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-md text-center"
                style={{
                  backgroundColor: "#FEE2E2",
                  color: "#DC2626",
                  fontFamily: "'Value Serif Pro Bold', serif",
                  fontSize: "14px",
                }}
              >
                {submitError}
              </motion.div>
            )}
          </motion.form>
              </>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Sales Inquiry Modal */}
      <Dialog open={salesOpen} onOpenChange={setSalesOpen}>
        <DialogContent 
          className="sm:max-w-md max-h-[90vh] overflow-y-auto" 
          onPointerDownOutside={(e) => {
            // Allow Select dropdowns to work
            const target = e.target as HTMLElement;
            if (target.closest('[data-radix-select-content]') || target.closest('[data-radix-select-trigger]')) {
              return;
            }
            e.preventDefault();
          }}
          onInteractOutside={(e) => {
            // Allow Select dropdowns to work
            const target = e.target as HTMLElement;
            if (target.closest('[data-radix-select-content]') || target.closest('[data-radix-select-trigger]')) {
              return;
            }
            e.preventDefault();
          }}
          style={{ backgroundColor: "#F2FCFB", boxShadow: "rgba(0, 0, 0, 0.56) 0px 22px 70px 4px" }}
        >
          <style>{`
            /* Hide default DialogContent close button */
            button[data-radix-dialog-close],
            [data-radix-dialog-content] button[data-radix-dialog-close],
            [data-radix-dialog-content] > button[data-radix-dialog-close],
            button.absolute.right-4.top-4,
            button[class*="right-4"][class*="top-4"],
            [data-radix-dialog-content] > button:last-child:has(svg),
            button:has(svg.h-4.w-4):has(span[class*="sr-only"]) {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }

            .floating-label-wrapper-sales {
              position: relative;
              margin-bottom: 0;
            }

            .floating-label-sales {
              position: absolute;
              left: 38px;
              top: 50%;
              transform: translateY(-50%);
              font-size: 14px;
              color: #4B5563;
              background: #FFFFFF;
              padding: 0 4px;
              transition: all 0.2s ease;
              pointer-events: none;
              font-family: 'Value Serif Pro Bold', serif;
              font-weight: 400;
              z-index: 1;
              line-height: 1.4;
            }

            .floating-label-wrapper-sales.focused .floating-label-sales,
            .floating-label-wrapper-sales.has-value .floating-label-sales {
              color: #FDA11E;
              font-size: 10px;
              top: 0;
              left: 12px;
              transform: translateY(-50%);
              font-weight: 500;
            }

            .floating-label-wrapper-sales.message-field:not(.focused):not(.has-value) .floating-label-sales {
              left: 12px;
              top: 10px;
              transform: none;
            }

            .floating-label-wrapper-sales.phone-field .floating-label-sales {
              left: 80px;
            }

            .floating-label-wrapper-sales.phone-field.focused .floating-label-sales,
            .floating-label-wrapper-sales.phone-field.has-value .floating-label-sales {
              left: 12px;
              top: 0;
              transform: translateY(-50%);
            }

            .floating-input-sales {
              width: 100%;
              border: 1px solid #E2E8F0;
              border-radius: 10px;
              padding: 10px 12px 10px 38px;
              font-size: 14px;
              line-height: 1.4;
              font-family: 'Value Serif Pro Bold', serif;
              font-weight: 400;
              background: #FFFFFF;
              transition: border-color 0.2s ease, box-shadow 0.2s ease;
              height: 40px;
              box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
            }

            .floating-input-sales:focus {
              outline: none;
              border-color: #FDA11E;
              box-shadow: 0px 0px 0px 3px rgba(253, 161, 30, 0.1), rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
            }

            .floating-input-sales::placeholder {
              color: transparent;
            }

            .floating-textarea-sales {
              width: 100%;
              border: 1px solid #E2E8F0;
              border-radius: 10px;
              padding: 10px 12px 24px 12px;
              font-size: 14px;
              line-height: 1.4;
              font-family: 'Value Serif Pro Bold', serif;
              font-weight: 400;
              background: #FFFFFF;
              transition: border-color 0.2s ease, box-shadow 0.2s ease;
              min-height: 60px;
              box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
            }

            .floating-textarea-sales:focus {
              outline: none;
              border-color: #FDA11E;
              box-shadow: 0px 0px 0px 3px rgba(253, 161, 30, 0.1), rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
            }

            .floating-textarea-sales::placeholder {
              color: transparent;
            }

            .required-asterisk-sales {
              visibility: visible;
              opacity: 1;
              color: #EF4444;
            }
          `}</style>
          <DialogHeader className="relative">
            <DialogTitle className="flex justify-center">
              <div 
                className="px-6 py-2 rounded-full border-2"
                style={{
                  borderColor: "#FFE5B4",
                  backgroundColor: "#FFE5B4",
                  fontFamily: "'Value Serif Pro Bold', serif",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#0B2E4E",
                  display: "inline-block"
                }}
              >
                SALES
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-6 w-6 rounded-full"
              onClick={() => setSalesOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <form onSubmit={handleSalesSubmit} className="space-y-4 mt-4">
            <div className={`floating-label-wrapper-sales ${focusedField === "sales-name" ? "focused" : ""} ${salesFormData.name ? "has-value" : ""}`}>
              <label className="floating-label-sales">Full Name <span className="required-asterisk-sales">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 z-10" style={{ color: "#9CA3AF", strokeWidth: "1.5" }} />
                <Input
                  id="sales-name"
                  type="text"
                  placeholder="Full Name"
                  value={salesFormData.name}
                  onChange={(e) => setSalesFormData({...salesFormData, name: e.target.value})}
                  className="floating-input-sales"
                  onFocus={() => setFocusedField("sales-name")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </div>

            <div className={`floating-label-wrapper-sales ${focusedField === "sales-email" ? "focused" : ""} ${salesFormData.email ? "has-value" : ""}`}>
              <label className="floating-label-sales">Email Address <span className="required-asterisk-sales">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 z-10" style={{ color: "#9CA3AF", strokeWidth: "1.5" }} />
                <Input
                  id="sales-email"
                  type="email"
                  placeholder="Email Address"
                  value={salesFormData.email}
                  onChange={(e) => setSalesFormData({...salesFormData, email: e.target.value})}
                  className="floating-input-sales"
                  onFocus={() => setFocusedField("sales-email")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </div>

            <div className={`floating-label-wrapper-sales phone-field ${focusedField === "sales-phone" ? "focused" : ""} ${salesFormData.phone ? "has-value" : ""}`}>
              <label className="floating-label-sales">Phone Number <span className="required-asterisk-sales">*</span></label>
              <div className="relative flex items-center gap-2" style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "0", background: "#FFFFFF", boxShadow: "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px", height: "40px" }}>
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-l-lg"
                  style={{
                    borderRight: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                  }}
                >
                  <img 
                    src={flagIcon} 
                    alt="India" 
                    style={{
                      width: "18px",
                      height: "13px",
                      objectFit: "cover",
                      borderRadius: "2px"
                    }}
                  />
                  <span 
                    style={{ 
                      color: "#4B5563",
                      fontFamily: "'Value Serif Pro Bold', serif",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}
                  >
                    +91
                  </span>
                </div>
                <Input
                  id="sales-phone"
                  type="tel"
                  placeholder=""
                  value={salesFormData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setSalesFormData({...salesFormData, phone: value});
                  }}
                  maxLength={10}
                  className="flex-1 border-0 focus:ring-0 focus:outline-none"
                  style={{ 
                    padding: "10px 12px",
                    fontFamily: "'Value Serif Pro Bold', serif",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    fontWeight: "400",
                    background: "transparent",
                    boxShadow: "none"
                  }}
                  onFocus={(e) => {
                    setFocusedField("sales-phone");
                    const parent = e.currentTarget.closest(".relative") as HTMLElement;
                    if (parent) {
                      parent.style.borderColor = "#FDA11E";
                      parent.style.boxShadow = "0px 0px 0px 3px rgba(253, 161, 30, 0.1), rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px";
                    }
                  }}
                  onBlur={(e) => {
                    setFocusedField(null);
                    const parent = e.currentTarget.closest(".relative") as HTMLElement;
                    if (parent) {
                      parent.style.borderColor = "#E2E8F0";
                      parent.style.boxShadow = "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px";
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div className={`floating-label-wrapper-sales ${focusedField === "sales-company" ? "focused" : ""} ${salesFormData.company ? "has-value" : ""}`}>
              <label className="floating-label-sales">Company Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 z-10" style={{ color: "#9CA3AF", strokeWidth: "1.5" }} />
                <Input
                  id="sales-company"
                  type="text"
                  placeholder="Company Name"
                  value={salesFormData.company}
                  onChange={(e) => setSalesFormData({...salesFormData, company: e.target.value})}
                  className="floating-input-sales"
                  onFocus={() => setFocusedField("sales-company")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sales-service" className="text-sm font-medium" style={{ fontFamily: "'Value Serif Pro Bold', serif", color: "#4B5563", marginBottom: "8px", display: "block" }}>
                Service Interested In <span className="required-asterisk-sales">*</span>
              </Label>
              <Select value={salesFormData.service} onValueChange={(value) => setSalesFormData({...salesFormData, service: value})}>
                <SelectTrigger 
                  className="border-2 border-primary/30 focus:border-primary"
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontFamily: "'Value Serif Pro Bold', serif",
                    fontSize: "14px",
                    background: "#FFFFFF",
                    boxShadow: "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px",
                    height: "40px",
                    zIndex: 10
                  }}
                >
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent className="z-[10000]" style={{ zIndex: 10000 }}>
                  <SelectItem value="courier">Courier Services</SelectItem>
                  <SelectItem value="logistics">Logistics Solutions</SelectItem>
                  <SelectItem value="express">Express Delivery</SelectItem>
                  <SelectItem value="international">International Shipping</SelectItem>
                  <SelectItem value="warehousing">Warehousing</SelectItem>
                  <SelectItem value="custom">Custom Solution</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sales-budget" className="text-sm font-medium" style={{ fontFamily: "'Value Serif Pro Bold', serif", color: "#4B5563", marginBottom: "8px", display: "block" }}>
                Monthly Budget Range
              </Label>
              <Select value={salesFormData.budget} onValueChange={(value) => setSalesFormData({...salesFormData, budget: value})}>
                <SelectTrigger 
                  className="border-2 border-primary/30 focus:border-primary"
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontFamily: "'Value Serif Pro Bold', serif",
                    fontSize: "14px",
                    background: "#FFFFFF",
                    boxShadow: "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px",
                    height: "40px",
                    zIndex: 10
                  }}
                >
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent className="z-[10000]" style={{ zIndex: 10000 }}>
                  <SelectItem value="0-10k">₹0 - ₹10,000</SelectItem>
                  <SelectItem value="10k-50k">₹10,000 - ₹50,000</SelectItem>
                  <SelectItem value="50k-100k">₹50,000 - ₹1,00,000</SelectItem>
                  <SelectItem value="100k-500k">₹1,00,000 - ₹5,00,000</SelectItem>
                  <SelectItem value="500k+">₹5,00,000+</SelectItem>
                  <SelectItem value="discuss">Discuss Later</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={`floating-label-wrapper-sales message-field ${focusedField === "sales-message" ? "focused" : ""} ${salesFormData.message ? "has-value" : ""}`}>
              <label className="floating-label-sales">Requirements <span className="required-asterisk-sales">*</span></label>
              <div className="relative">
              <Textarea
                id="sales-message"
                  placeholder="Requirements"
                value={salesFormData.message}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 150);
                    setSalesFormData({...salesFormData, message: value});
                  }}
                  maxLength={150}
                  className="floating-textarea-sales"
                  onFocus={() => setFocusedField("sales-message")}
                  onBlur={() => setFocusedField(null)}
                required
              />
                <div 
                  className="absolute bottom-2 right-3 text-xs"
                  style={{
                    color: "#9CA3AF",
                    fontFamily: "'Value Serif Pro Bold', serif",
                  }}
                >
                  {salesFormData.message.length}/150
                </div>
              </div>
            </div>

            <div className="flex justify-center">
            <Button
              type="submit"
                disabled={isSubmitting || !salesFormData.name || !salesFormData.email || !salesFormData.phone || salesFormData.phone.length !== 10 || !salesFormData.service || !salesFormData.message}
                className="text-white font-semibold px-8 py-2
                       hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-primary/25"
                style={{
                  fontFamily: "'Value Serif Pro Bold', serif",
                  fontSize: "14px",
                  backgroundColor: "#FDA21F",
                  opacity: (!salesFormData.name || !salesFormData.email || !salesFormData.phone || salesFormData.phone.length !== 10 || !salesFormData.service || !salesFormData.message) ? 0.5 : 1,
                  cursor: (!salesFormData.name || !salesFormData.email || !salesFormData.phone || salesFormData.phone.length !== 10 || !salesFormData.service || !salesFormData.message) ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Submitting..." : "SUBMIT"}
            </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StickyTabs;
