import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, MessageCircle, AlertCircle, Building2, Send, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import companyData from "@/data/company.json";
import conconImg from "@/assets/concon.jpg";
import callIcon from "@/Icon-images/call.png";
import emailIcon from "@/assets/email.png";
import facebookIcon from "@/Icon-images/facebook.png";
import instagramIcon from "@/Icon-images/instagram.png";
import twitterIcon from "@/Icon-images/twitter.png";
import linkedinIcon from "@/Icon-images/linkedin.png";

const ContactOCL = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    phone: "",
    message: ""
  });
  const [focused, setFocused] = useState({
    name: false,
    email: false,
    subject: false,
    phone: false,
    message: false
  });

  const handleFocus = (field: string) => {
    setFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setFocused(prev => ({ ...prev, [field]: false }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactMethods = [
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak directly with our customer service team",
      contact: "+91 8453994809",
      action: "tel:+918453994809",
      actionText: "+91 8453994809",
      emoji: "📞"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Support",
      description: "Get instant help via WhatsApp",
      contact: "+91 8453994809",
      action: "https://wa.me/918453994809",
      actionText: "+91 8453994809",
      emoji: "💬"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us your queries and we'll respond within 24 hours",
      contact: "info@oclservices.com",
      action: "mailto:info@oclservices.com",
      actionText: "info@oclservices.com",
      emoji: "📧"
    }
  ];

  const officeHours = [
    { day: "Mon - Sat", hours: "10:00 AM - 7:00 PM" },
    { day: "Sunday", hours: "HOLIDAY" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.42, 0, 0.58, 1] as const
      }
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <style>{`
        .button-86 {
          all: unset;
          width: auto;
          min-width: 100px;
          height: auto;
          font-size: 16px;
          background: transparent;
          border: none;
          position: relative;
          color: #f0f0f0;
          cursor: pointer;
          z-index: 1;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .button-86::after,
        .button-86::before {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          z-index: -99999;
          transition: all .4s;
        }

        .button-86::before {
          transform: translate(0%, 0%);
          width: 100%;
          height: 100%;
          background: #28282d;
          border-radius: 10px;
        }

        .button-86::after {
          transform: translate(10px, 10px);
          width: 35px;
          height: 35px;
          background: #ffffff15;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          border-radius: 50px;
        }

        .button-86:hover::before {
          transform: translate(5%, 20%);
          width: 110%;
          height: 110%;
          background: #FFA019;
        }

        .button-86:hover::after {
          border-radius: 10px;
          transform: translate(0, 0);
          width: 100%;
          height: 100%;
        }

        .button-86:active::after {
          transition: 0s;
          transform: translate(0, 5%);
        }

        .button-86-orange::before {
          background: #FFA019;
        }

        .button-86-orange:hover::before {
          background: #28282d;
        }
      `}</style>
      <Navbar />
      
      {/* Full-Width Hero Section */}
      <motion.div
        className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          backgroundImage: `url(${conconImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        {/* Centered Title */}
        <motion.h1
          className="relative z-10 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white text-center px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            textShadow: "0px 4px 20px rgba(0, 0, 0, 0.8)",
            marginTop: "40px"
          }}
        >
          Contact <span style={{ color: "#000000" }}>OCL</span>
        </motion.h1>
      </motion.div>

      {/* Three Contact Cards Section */}
      <div className="relative z-10 container mx-auto px-4 pt-16 pb-8 max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8 flex-wrap"
        >
          {contactMethods.map((method, index) => {
            const IconComponent = method.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative group"
                style={{
                  maxWidth: method.title === "Call Us" || method.title === "Email Support" ? "240px" : "320px",
                  width: method.title === "Call Us" || method.title === "Email Support" ? "240px" : "auto",
                  flex: method.title === "WhatsApp Support" ? "1 1 320px" : "0 0 auto",
                  height: method.title === "Call Us" || method.title === "Email Support" ? "auto" : "auto"
                }}
              >
                <div
                  className={`rounded-2xl transition-all duration-300 relative overflow-hidden ${method.title === "Call Us" || method.title === "Email Support" ? "px-4 pt-4 pb-3" : "p-6"}`}
                  style={{
                    background: method.title === "WhatsApp Support"
                      ? "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)"
                      : method.title === "Call Us"
                      ? "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)"
                      : method.title === "Email Support"
                      ? "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)"
                      : "linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)",
                    boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px",
                    border: "1px solid rgba(255, 255, 255, 0.8)"
                  }}
                >
                  {/* Decorative gradient overlay */}
                  <div
                    className={`absolute top-0 right-0 opacity-10 rounded-full blur-3xl ${method.title === "Call Us" || method.title === "Email Support" ? "w-20 h-20" : "w-32 h-32"}`}
                    style={{
                      background: method.title === "WhatsApp Support"
                        ? "radial-gradient(circle, #25D366 0%, transparent 70%)"
                        : method.title === "Call Us"
                        ? "radial-gradient(circle, #F5A623 0%, transparent 70%)"
                        : method.title === "Email Support"
                        ? "radial-gradient(circle, #4285F4 0%, transparent 70%)"
                        : "radial-gradient(circle, #F5A623 0%, transparent 70%)"
                    }}
                  />
                  
                  <div
                    className={`flex justify-center relative z-10 ${method.title === "Call Us" || method.title === "Email Support" ? "mb-3" : "mb-4"}`}
                  >
                    {method.title === "WhatsApp Support" ? (
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                          fill="#25D366"
                        />
                      </svg>
                    ) : method.title === "Call Us" ? (
                      <img 
                        src={callIcon} 
                        alt="Call Us" 
                        className="w-12 h-12 object-contain"
                      />
                    ) : method.title === "Email Support" ? (
                      <img 
                        src={emailIcon} 
                        alt="Email Support" 
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <span className="text-4xl">{method.emoji}</span>
                    )}
                  </div>
                  
                  <h3
                    className={`${method.title === "Call Us" || method.title === "Email Support" ? "text-base mb-2" : "text-lg mb-3"} font-bold text-center relative z-10`}
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 700,
                      color: method.title === "WhatsApp Support"
                        ? "#1B5E20"
                        : method.title === "Call Us"
                        ? "#E65100"
                        : method.title === "Email Support"
                        ? "#0D47A1"
                        : "#0C1B33",
                      letterSpacing: "-0.02em"
                    }}
                  >
                    {method.title}
                  </h3>
                  
                  <p
                    className={`${method.title === "Call Us" || method.title === "Email Support" ? "text-xs mb-3 min-h-[32px]" : "text-sm mb-6 min-h-[40px]"} text-center relative z-10`}
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      color: "#424242",
                      lineHeight: "1.5"
                    }}
                  >
                    {method.description}
                  </p>
                  
                  <motion.button
                    onClick={() => window.open(method.action, '_blank')}
                    className={`${method.title === "Call Us" || method.title === "Email Support" ? "w-auto px-3 py-1.5 text-xs" : "w-auto px-4 py-2 text-xs"} rounded-xl font-semibold transition-all duration-300 mx-auto block relative z-10`}
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      maxWidth: method.title === "Call Us" || method.title === "Email Support" ? "160px" : "200px",
                      background: method.title === "WhatsApp Support"
                        ? "linear-gradient(135deg, #25D366 0%, #128C7E 100%)"
                        : method.title === "Call Us"
                        ? "linear-gradient(135deg, #F5A623 0%, #E8951F 100%)"
                        : method.title === "Email Support"
                        ? "linear-gradient(135deg, #4285F4 0%, #1A73E8 100%)"
                        : "linear-gradient(135deg, #0C1B33 0%, #1A237E 100%)",
                      color: "#FFFFFF",
                      border: "none",
                      boxShadow: method.title === "WhatsApp Support"
                        ? "0px 6px 20px rgba(37, 211, 102, 0.4)"
                        : method.title === "Call Us"
                        ? "0px 6px 20px rgba(245, 166, 35, 0.4)"
                        : method.title === "Email Support"
                        ? "0px 6px 20px rgba(66, 133, 244, 0.4)"
                        : "0px 6px 20px rgba(12, 27, 51, 0.3)"
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {method.actionText}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Get in Touch Section with Floating Panel */}
      <div className="relative w-full">
        {/* Black Background Section - Increased height for better overlap */}
        <div className="w-full min-h-[350px] flex items-start justify-center px-4 md:px-8 relative pb-36 pt-8" style={{ background: "#000000" }}>
          <div className="max-w-7xl mx-auto text-center">
            <h2
              className="text-4xl md:text-5xl font-bold"
        style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "-0.02em"
              }}
            >
              Get in Touch
            </h2>
          </div>
        </div>

        {/* White Background Section */}
        <div className="w-full bg-white relative pt-0 pb-16">
          1
          {/* Floating Two-Column Panel - 40% on black, 60% on white */}
           <div className="relative -mt-52 mb-4 z-20">
          <div className="max-w-5xl mx-auto px-4">
          <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
              }}
            >
              <div className="grid md:grid-cols-2">
                {/* Left Panel - White Contact Form */}
                <div className="bg-white p-6 md:p-8 relative">
                  <h3
                    className="text-xl md:text-2xl font-bold mb-6 text-center"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 700,
                      color: "#0C1B33",
                      letterSpacing: "-0.02em"
                    }}
                  >
                    Drop us a Line
                  </h3>
                  
                  <form className="space-y-8">
                    {/* Name Field */}
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        onFocus={() => handleFocus("name")}
                        onBlur={() => handleBlur("name")}
                        className="w-full bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none pb-1 pt-0"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "16px",
                          color: "#0C1B33"
                        }}
                      />
                      <label
                        className={`absolute left-0 transition-all duration-200 pointer-events-none ${
                          focused.name || formData.name
                            ? "-top-5 text-xs text-blue-500"
                            : "top-0 text-base text-gray-400"
                        }`}
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400
                        }}
                      >
                        Name
                      </label>
                    </div>

                    {/* Email Field */}
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        onFocus={() => handleFocus("email")}
                        onBlur={() => handleBlur("email")}
                        className="w-full bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none pb-1 pt-0"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "16px",
                          color: "#0C1B33"
                        }}
                      />
                      <label
                        className={`absolute left-0 transition-all duration-200 pointer-events-none ${
                          focused.email || formData.email
                            ? "-top-5 text-xs text-blue-500"
                            : "top-0 text-base text-gray-400"
                        }`}
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400
                        }}
                      >
                        Email
                      </label>
                    </div>

                    {/* Subject Field */}
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleChange("subject", e.target.value)}
                        onFocus={() => handleFocus("subject")}
                        onBlur={() => handleBlur("subject")}
                        className="w-full bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none pb-1 pt-0"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "16px",
                          color: "#0C1B33"
                        }}
                      />
                      <label
                        className={`absolute left-0 transition-all duration-200 pointer-events-none ${
                          focused.subject || formData.subject
                            ? "-top-5 text-xs text-blue-500"
                            : "top-0 text-base text-gray-400"
                        }`}
                  style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400
                  }}
                >
                        Subject
                      </label>
                </div>

                    {/* Phone Field */}
                    <div className="relative">
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        onFocus={() => handleFocus("phone")}
                        onBlur={() => handleBlur("phone")}
                        className="w-full bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none pb-1 pt-0"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "16px",
                          color: "#0C1B33"
                        }}
                      />
                      <label
                        className={`absolute left-0 transition-all duration-200 pointer-events-none ${
                          focused.phone || formData.phone
                            ? "-top-5 text-xs text-blue-500"
                            : "top-0 text-base text-gray-400"
                        }`}
                  style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400
                        }}
                      >
                        Phone
                      </label>
              </div>
              
                    {/* Message Field */}
                    <div className="relative">
                      <textarea
                        rows={1}
                        value={formData.message}
                        onChange={(e) => handleChange("message", e.target.value)}
                        onFocus={() => handleFocus("message")}
                        onBlur={() => handleBlur("message")}
                        className="w-full bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none pb-1 pt-0 resize-none"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "16px",
                          color: "#0C1B33"
                        }}
                      />
                      <label
                        className={`absolute left-0 transition-all duration-200 pointer-events-none ${
                          focused.message || formData.message
                            ? "-top-5 text-xs text-blue-500"
                            : "top-0 text-base text-gray-400"
                        }`}
                    style={{
                      fontFamily: "'Inter', sans-serif",
                          fontWeight: 400
                        }}
                      >
                        Message
                      </label>
                    </div>
                  </form>

                  {/* Circular Send Button */}
                  <div className="flex justify-end mt-6">
                    <button
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                      style={{
                        background: "linear-gradient(135deg, #FFA019 0%, #FF8C00 100%)",
                        color: "#FFFFFF"
                      }}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Right Panel - Black Contact Information */}
                <div className="bg-black p-6 md:p-8 text-white">
                  <h3
                    className="text-xl md:text-2xl font-bold mb-6 text-center"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      letterSpacing: "-0.02em"
                    }}
                  >
                    Contact Information
                  </h3>

                  <div className="space-y-4 mb-8">
                    {/* Address */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 pt-0.5">
                        <MapPin className="w-6 h-6" style={{ color: "#FFA019" }} />
                      </div>
                      <div>
                        <p
                          className="text-base leading-relaxed"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            color: "#E0E0E0",
                            lineHeight: "1.6"
                          }}
                        >
                          Piyali Phukan Road, Rehabari,<br />
                          Guwahati, 781008, Assam, India
                        </p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <Phone className="w-6 h-6" style={{ color: "#FFA019" }} />
                      </div>
                      <div>
                        <a
                          href="tel:+918453994809"
                          className="text-base transition-colors hover:opacity-80"
                  style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            color: "#E0E0E0"
                  }}
                >
                          +91 8453994809
                        </a>
                </div>
              </div>
              
                    {/* Email */}
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <Mail className="w-6 h-6" style={{ color: "#FFA019" }} />
                      </div>
                      <div>
                        <a
                          href="mailto:info@oclservices.com"
                          className="text-base transition-colors hover:opacity-80"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            color: "#E0E0E0"
                          }}
                        >
                          info@oclservices.com
                        </a>
                      </div>
                    </div>

                    {/* Website */}
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <Globe className="w-6 h-6" style={{ color: "#FFA019" }} />
                      </div>
                      <div>
                        <a
                          href="https://www.oclservices.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base transition-colors hover:opacity-80"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                            color: "#E0E0E0"
                          }}
                        >
                          www.oclservices.com
                        </a>
                      </div>
                    </div>
              </div>
              
                  {/* Social Media Icons */}
                  <div>
                    <p
                      className="text-sm mb-4"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                        color: "#B0B0B0"
                      }}
                    >
                      Follow Us
                    </p>
                    <div className="flex gap-4">
                      <a
                        href="https://www.linkedin.com/company/our-courier-and-logistics/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                        style={{ backgroundColor: "transparent" }}
                      >
                        <img src={linkedinIcon} alt="LinkedIn" className="w-8 h-8" />
                      </a>
                      <a
                        href="https://www.instagram.com/ocl_services/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                        style={{ backgroundColor: "transparent" }}
                      >
                        <img src={instagramIcon} alt="Instagram" className="w-8 h-8" />
                      </a>
                      <a
                        href="https://twitter.com/oclservices"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                        style={{ backgroundColor: "transparent" }}
                      >
                        <img src={twitterIcon} alt="Twitter" className="w-8 h-8" />
                      </a>
                      <a
                        href="https://facebook.com/oclcourier"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                        style={{ backgroundColor: "transparent" }}
                      >
                        <img src={facebookIcon} alt="Facebook" className="w-8 h-8" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
              </div>
            </div>
        </div>

        {/* Additional white space below */}
        <div className="w-full bg-white pt-0 pb-4"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-0 pb-16 max-w-7xl">
        {/* Need Immediate Assistance Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div
            className="rounded-2xl p-10 bg-white"
            style={{
              boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
            }}
          >
            <h3
              className="text-2xl md:text-3xl font-bold mb-4"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                color: "#0C1B33"
              }}
            >
              Need Immediate Assistance?
            </h3>
            <p
              className="text-base mb-8 max-w-2xl mx-auto"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                color: "#5A5A5A",
                lineHeight: "1.6"
              }}
            >
              For immediate support, you can also track your shipments, schedule pickups, or access our help center
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/track'}
                className="button-86"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600
                }}
              >
                Track Shipment
              </button>
              <button
                onClick={() => window.location.href = '/schedule-pickup'}
                className="button-86 button-86-orange"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600
                }}
              >
                Schedule Pickup
              </button>
              <button
                onClick={() => window.location.href = '/support/write'}
                className="button-86"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600
                }}
              >
                Write to Us
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactOCL;
