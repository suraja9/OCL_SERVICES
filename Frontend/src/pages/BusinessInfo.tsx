import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Hash, 
  CheckCircle2,
  Shield,
  IdCard,
  Building2,
  CreditCard,
  Landmark,
  CheckCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import businessImg from "@/assets/business.png";
import hdfcImg from "@/assets/hdfc.png";
import gstImg from "@/assets/gst.png";
import pancardImg from "@/assets/pancard.jpg";
import ooooImg from "@/assets/oooo.png";

interface BusinessInfoData {
  gstNumber: string;
  panNumber: string;
  hsnSacNumber: string;
  legalName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  isVerified: boolean;
  lastUpdated: string;
}

const BusinessInfo = () => {
  const rightColumnRef = useRef<HTMLDivElement>(null);

  const [formData] = useState<BusinessInfoData>({
    gstNumber: "18AJRPG5984B1ZV",
    panNumber: "AJRPG5984B",
    hsnSacNumber: "996812",
    legalName: "Our Courier & Logistics",
    bankName: "HDFC Bank",
    accountNumber: "50200070561441",
    ifscCode: "HDFC0004436",
    branch: "ULUBARI BRANCH",
    isVerified: true,
    lastUpdated: "2024-01-15"
  });


  const businessDetails = [
    {
      icon: FileText,
      label: "GST Details",
      value: formData.gstNumber,
      color: "#FFA019",
      backgroundImage: gstImg
    },
    {
      icon: IdCard,
      label: "PAN Details",
      value: formData.panNumber,
      color: "#FFA019",
      backgroundImage: pancardImg
    },
    {
      icon: Hash,
      label: "HSN / SAC Number",
      value: formData.hsnSacNumber,
      color: "#FFA019"
    },
    {
      icon: Shield,
      label: "Legal Name",
      value: formData.legalName,
      color: "#FFA019",
      backgroundImage: ooooImg
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Top Section - One Row */}
      <motion.section
        className="pt-24 pb-12 bg-gradient-to-br from-orange-50 via-white to-blue-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left - Title */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3"
                style={{ 
                  color: "#0D1B2A",
                  fontFamily: "'Value Serif Pro Bold', serif"
                }}
              >
                Business <span style={{ color: "#FFA019" }}>Information</span>
              </h1>
              <p
                className="text-base md:text-lg text-gray-600"
                style={{ fontFamily: "'Value Serif Pro Bold', serif" }}
              >
                Official company details for verification and billing
              </p>
            </motion.div>

            {/* Right - Image */}
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <img 
                src={businessImg} 
                alt="Business illustration" 
                className="w-full h-auto max-w-[280px] md:max-w-[320px]"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Business Details Section */}
      <motion.section
        className="py-8 md:py-12"
        style={{ backgroundColor: "#FFF5E6" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-8 text-center"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ 
              color: "#0D1B2A",
              fontFamily: "'Value Serif Pro Bold', serif"
            }}
          >
            Company <span style={{ color: "#FFA019" }}>Details</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {businessDetails.map((detail, index) => {
              const IconComponent = detail.icon;
              return (
                <motion.div
                  key={index}
                  className="rounded-lg p-5 transition-all duration-300 relative overflow-hidden flex items-center justify-center"
                  style={{
                    backgroundColor: '#1a1a1a',
                    backgroundImage: detail.backgroundImage ? `url(${detail.backgroundImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    boxShadow: 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px',
                    minHeight: '180px'
                  }}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  {/* Overlay for better text readability and image visibility */}
                  {detail.backgroundImage ? (
                    <div 
                      className="absolute inset-0 rounded-lg"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.6)'
                      }}
                    />
                  ) : null}
                  <div className="flex flex-col items-center justify-center text-center relative z-10 w-full">
                    <p 
                      className="text-sm md:text-base font-medium uppercase tracking-wider mb-2"
                      style={{ 
                        color: '#FFFFFF',
                        fontFamily: "'Value Serif Pro Bold', serif",
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {detail.label}:
                    </p>
                    <p 
                      className={`text-sm font-bold break-all w-full text-center ${detail.label === "Legal Name" ? "font-sans" : "font-mono"}`}
                      style={{ 
                        color: '#FFFFFF',
                        fontFamily: detail.label === "Legal Name" 
                          ? "'Value Serif Pro Bold', serif" 
                          : "monospace",
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {detail.value || "Not provided"}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Bank Account Details Section */}
      <motion.section
        className="py-8 md:py-12 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="text-2xl md:text-3xl font-bold text-center"
              style={{ 
                color: "#0D1B2A",
                fontFamily: "'Value Serif Pro Bold', serif"
              }}
            >
              Bank Account <span style={{ color: "#FFA019" }}>Details</span>
            </h2>
          </motion.div>

          <div className="rounded-xl p-6 md:p-8 shadow-lg" style={{ backgroundColor: '#000000' }}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-center">
              {/* Column 1 - Bank Name and IFSC Code */}
              <div className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Landmark className="w-4 h-4" style={{ color: "#FFA019" }} />
                    <label 
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ 
                        color: '#FFA019',
                        fontFamily: "'Value Serif Pro Bold', serif"
                      }}
                    >
                      Bank Name:
                    </label>
                  </div>
                  <p 
                    className="text-base font-semibold"
                    style={{ 
                      color: '#FFFFFF',
                      fontFamily: "'Value Serif Pro Bold', serif" 
                    }}
                  >
                    {formData.bankName || "Not provided"}
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4" style={{ color: "#FFA019" }} />
                    <label 
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ 
                        color: '#FFA019',
                        fontFamily: "'Value Serif Pro Bold', serif"
                      }}
                    >
                      IFSC Code:
                    </label>
                  </div>
                  <p 
                    className="text-base font-semibold font-mono"
                    style={{ 
                      color: '#FFFFFF',
                      fontFamily: "monospace" 
                    }}
                  >
                    {formData.ifscCode || "Not provided"}
                  </p>
                </motion.div>
              </div>

              {/* Column 2 - Account Number and Branch */}
              <div className="space-y-5" ref={rightColumnRef}>
                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4" style={{ color: "#FFA019" }} />
                    <label 
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ 
                        color: '#FFA019',
                        fontFamily: "'Value Serif Pro Bold', serif"
                      }}
                    >
                      Account Number:
                    </label>
                  </div>
                  <p 
                    className="text-base font-semibold font-mono"
                    style={{ 
                      color: '#FFFFFF',
                      fontFamily: "monospace" 
                    }}
                  >
                    {formData.accountNumber || "Not provided"}
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4" style={{ color: "#FFA019" }} />
                    <label 
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ 
                        color: '#FFA019',
                        fontFamily: "'Value Serif Pro Bold', serif"
                      }}
                    >
                      Branch:
                    </label>
                  </div>
                  <p 
                    className="text-base font-semibold"
                    style={{ 
                      color: '#FFFFFF',
                      fontFamily: "'Value Serif Pro Bold', serif" 
                    }}
                  >
                    {formData.branch || "Not provided"}
                  </p>
                </motion.div>
              </div>

              {/* Column 3 - Verified Text */}
              <div className="flex items-center justify-center" ref={rightColumnRef}>
                <motion.div
                  className="flex flex-col items-center justify-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <CheckCircle className="w-8 h-8 mb-2" style={{ color: "#FFA019" }} />
                  <p 
                    className="text-lg font-semibold uppercase tracking-wider"
                    style={{ 
                      color: '#FFA019',
                      fontFamily: "'Value Serif Pro Bold', serif"
                    }}
                  >
                    Verified
                  </p>
                </motion.div>
              </div>

              {/* Column 4 - HDFC Logo spanning the height of Account Number to Branch */}
              <div className="flex items-center justify-center lg:justify-end">
                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <img
                    src={hdfcImg}
                    alt="HDFC Bank Logo"
                    className="w-auto object-contain"
                    style={{ 
                      height: `${rightColumnRef.current?.offsetHeight || 180}px`,
                      maxHeight: "200px",
                      width: "auto"
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default BusinessInfo;
