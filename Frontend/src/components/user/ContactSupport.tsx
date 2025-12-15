import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MessageCircle, MapPin, Clock, Send, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import companyData from "@/data/company.json";

interface ContactSupportProps {
  isDarkMode: boolean;
}

const ContactSupport: React.FC<ContactSupportProps> = ({ isDarkMode }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/customer-complain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          category: formData.category,
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to submit your message');
      }

      toast({
        title: "Message Sent Successfully!",
        description: result.message || "Thank you for contacting us. We'll respond to your message within 24 hours.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        category: "",
        message: "",
      });
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Failed to Send Message",
        description: error.message || "An error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const contactMethods = [
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak directly with our customer service team",
      contact: "+91 8453994809",
      action: "tel:+918453994809",
      actionText: "Call Now",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Support",
      description: "Get instant help via WhatsApp",
      contact: "+91 8453994809",
      action: "https://wa.me/918453994809",
      actionText: "Chat on WhatsApp",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us your queries and we'll respond within 24 hours",
      contact: companyData.contact.email,
      action: `mailto:${companyData.contact.email}`,
      actionText: "Send Email",
    },
  ];

  const officeHours = [
    { day: "Mon - Sat", hours: "10:00 AM - 7:00 PM" },
    { day: "Sunday", hours: "HOLIDAY" },
  ];

  const categories = [
    "General Inquiry",
    "Booking Issue",
    "Tracking Issue",
    "Payment Issue",
    "Complaint",
    "Feedback",
    "Other",
  ];

  return (
    <div 
      className="relative w-full min-w-0"
      style={{
        background: isDarkMode 
          ? undefined 
          : "linear-gradient(to bottom, #F7FBFF, #E9F1FF)"
      }}
    >
      {/* Radial Highlights */}
      {!isDarkMode && (
        <>
          <div 
            className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(74, 140, 255, 0.15), transparent)" }}
          />
          <div 
            className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(74, 140, 255, 0.1), transparent)" }}
          />
        </>
      )}
      
      <div className="relative space-y-4 w-full min-w-0">
        {/* Header */}
        <div className="space-y-1.5">
          <h2
            className={cn(
              "text-2xl font-semibold",
              isDarkMode ? "text-white" : "text-[#1A2E45] font-semibold"
            )}
            style={!isDarkMode ? { fontWeight: 600 } : {}}
          >
            Contact Support
          </h2>
          <p
            className={cn(
              "text-sm",
              isDarkMode ? "text-slate-300/80" : "text-[#4A5A6A]"
            )}
          >
            Get in touch with our support team. We're here to help you 24/7.
          </p>
        </div>

      {/* Contact Form and Office Details */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr] w-full min-w-0">
        {/* Contact Form */}
        <Card
          className={cn(
            "transition",
            isDarkMode
              ? "border-slate-800/60 bg-slate-900/70"
              : "border-transparent"
          )}
          style={!isDarkMode ? {
            background: "rgba(255, 255, 255, 0.55)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRadius: "0",
            boxShadow: "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px"
          } : {}}
        >
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className={cn(
                      "peer h-9 transition-all duration-200 font-normal",
                      isDarkMode
                        ? "border-slate-700 bg-slate-800 text-white"
                        : "border-[#DDE6EE] bg-white focus:border-[#4A8CFF] focus:ring-2 focus:ring-[#4A8CFF]/20 text-gray-600"
                    )}
                    style={!isDarkMode ? {
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                      outline: 'none',
                      fontWeight: 'normal',
                      color: '#6B7280'
                    } : { outline: 'none', fontWeight: 'normal' }}
                    onMouseEnter={(e) => {
                      if (!isDarkMode) {
                        e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDarkMode) {
                        e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.05)";
                      }
                    }}
                  />
                  <Label
                    htmlFor="name"
                    className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 text-sm transition-all duration-200 pointer-events-none",
                      "peer-focus:top-0 peer-focus:text-xs peer-focus:-translate-y-1/2 peer-focus:px-1",
                      formData.name ? "top-0 text-xs -translate-y-1/2 px-1" : "",
                      isDarkMode
                        ? "peer-focus:text-blue-200 peer-focus:bg-slate-900/70"
                        : "peer-focus:text-[#4A8CFF] peer-focus:bg-white",
                      isDarkMode
                        ? formData.name
                          ? "text-blue-200 bg-slate-900/70"
                          : "text-slate-400"
                        : formData.name
                          ? "text-[#4A8CFF] bg-white"
                          : "text-slate-500"
                    )}
                  >
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className={cn(
                      "peer h-9 transition-all duration-200 font-normal",
                      isDarkMode
                        ? "border-slate-700 bg-slate-800 text-white"
                        : "border-[#DDE6EE] bg-white focus:border-[#4A8CFF] focus:ring-2 focus:ring-[#4A8CFF]/20 text-gray-600"
                    )}
                    style={!isDarkMode ? {
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                      outline: 'none',
                      fontWeight: 'normal',
                      color: '#6B7280'
                    } : { outline: 'none', fontWeight: 'normal' }}
                    onMouseEnter={(e) => {
                      if (!isDarkMode) {
                        e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDarkMode) {
                        e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.05)";
                      }
                    }}
                  />
                  <Label
                    htmlFor="email"
                    className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 text-sm transition-all duration-200 pointer-events-none",
                      "peer-focus:top-0 peer-focus:text-xs peer-focus:-translate-y-1/2 peer-focus:px-1",
                      formData.email ? "top-0 text-xs -translate-y-1/2 px-1" : "",
                      isDarkMode
                        ? "peer-focus:text-blue-200 peer-focus:bg-slate-900/70"
                        : "peer-focus:text-[#4A8CFF] peer-focus:bg-white",
                      isDarkMode
                        ? formData.email
                          ? "text-blue-200 bg-slate-900/70"
                          : "text-slate-400"
                        : formData.email
                          ? "text-[#4A8CFF] bg-white"
                          : "text-slate-500"
                    )}
                  >
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={cn(
                      "peer h-9 transition-all duration-200 font-normal",
                      isDarkMode
                        ? "border-slate-700 bg-slate-800 text-white"
                        : "border-[#DDE6EE] bg-white focus:border-[#4A8CFF] focus:ring-2 focus:ring-[#4A8CFF]/20 text-gray-600"
                    )}
                    style={!isDarkMode ? {
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                      outline: 'none',
                      fontWeight: 'normal',
                      color: '#6B7280'
                    } : { outline: 'none', fontWeight: 'normal' }}
                    onMouseEnter={(e) => {
                      if (!isDarkMode) {
                        e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDarkMode) {
                        e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.05)";
                      }
                    }}
                  />
                  <Label
                    htmlFor="phone"
                    className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 text-sm transition-all duration-200 pointer-events-none",
                      "peer-focus:top-0 peer-focus:text-xs peer-focus:-translate-y-1/2 peer-focus:px-1",
                      formData.phone ? "top-0 text-xs -translate-y-1/2 px-1" : "",
                      isDarkMode
                        ? "peer-focus:text-blue-200 peer-focus:bg-slate-900/70"
                        : "peer-focus:text-[#4A8CFF] peer-focus:bg-white",
                      isDarkMode
                        ? formData.phone
                          ? "text-blue-200 bg-slate-900/70"
                          : "text-slate-400"
                        : formData.phone
                          ? "text-[#4A8CFF] bg-white"
                          : "text-slate-500"
                    )}
                  >
                    Phone Number
                  </Label>
                </div>
                <div>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                    required
                  >
                    <SelectTrigger
                      className={cn(
                        "h-9 transition-all duration-200 focus:outline-none font-normal",
                        isDarkMode
                          ? "border-slate-700 bg-slate-800 text-white"
                          : "border-[#DDE6EE] bg-white focus:border-[#4A8CFF] focus:ring-2 focus:ring-[#4A8CFF]/20 text-gray-600"
                      )}
                      style={!isDarkMode ? {
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                        outline: 'none',
                        fontWeight: 'normal',
                        color: '#6B7280'
                      } : { outline: 'none', fontWeight: 'normal' }}
                      onMouseEnter={(e) => {
                        if (!isDarkMode) {
                          e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDarkMode) {
                          e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.05)";
                        }
                      }}
                    >
                      <SelectValue placeholder="Category *" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative">
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                  className={cn(
                    "peer h-9 transition-all duration-200 font-normal",
                    isDarkMode
                      ? "border-slate-700 bg-slate-800 text-white"
                      : "border-[#DDE6EE] bg-white focus:border-[#4A8CFF] focus:ring-2 focus:ring-[#4A8CFF]/20 text-gray-600"
                  )}
                  style={!isDarkMode ? {
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                    outline: 'none',
                    fontWeight: 'normal',
                    color: '#6B7280'
                  } : { outline: 'none', fontWeight: 'normal' }}
                  onMouseEnter={(e) => {
                    if (!isDarkMode) {
                      e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDarkMode) {
                      e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.05)";
                    }
                  }}
                />
                <Label
                  htmlFor="subject"
                  className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 text-sm transition-all duration-200 pointer-events-none",
                    "peer-focus:top-0 peer-focus:text-xs peer-focus:-translate-y-1/2 peer-focus:px-1",
                    formData.subject ? "top-0 text-xs -translate-y-1/2 px-1" : "",
                    isDarkMode
                      ? "peer-focus:text-blue-200 peer-focus:bg-slate-900/70"
                      : "peer-focus:text-[#4A8CFF] peer-focus:bg-white",
                    isDarkMode
                      ? formData.subject
                        ? "text-blue-200 bg-slate-900/70"
                        : "text-slate-400"
                      : formData.subject
                        ? "text-blue-600 bg-white"
                        : "text-slate-500"
                  )}
                >
                  Subject <span className="text-red-500">*</span>
                </Label>
              </div>

              <div className="relative">
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                  rows={4}
                  className={cn(
                    "peer pt-6 resize-none transition-all duration-200 focus:outline-none font-normal",
                    isDarkMode
                      ? "border-slate-700 bg-slate-800 text-white"
                      : "border-[#DDE6EE] bg-white focus:border-[#4A8CFF] focus:ring-2 focus:ring-[#4A8CFF]/20 text-gray-600"
                  )}
                  style={!isDarkMode ? {
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                    outline: 'none',
                    fontWeight: 'normal',
                    color: '#6B7280'
                  } : { outline: 'none', fontWeight: 'normal' }}
                  onMouseEnter={(e) => {
                    if (!isDarkMode) {
                      e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDarkMode) {
                      e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.05)";
                    }
                  }}
                />
                <Label
                  htmlFor="message"
                  className={cn(
                    "absolute left-3 top-4 text-sm transition-all duration-200 pointer-events-none",
                    "peer-focus:top-0 peer-focus:text-xs peer-focus:-translate-y-1/2 peer-focus:px-1",
                    formData.message ? "top-0 text-xs -translate-y-1/2 px-1" : "",
                    isDarkMode
                      ? "peer-focus:text-blue-200 peer-focus:bg-slate-900/70"
                      : "peer-focus:text-[#4A8CFF] peer-focus:bg-white",
                    isDarkMode
                      ? formData.message
                        ? "text-blue-200 bg-slate-900/70"
                        : "text-slate-400"
                      : formData.message
                        ? "text-blue-600 bg-white"
                        : "text-slate-500"
                  )}
                >
                  Message <span className="text-red-500">*</span>
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full text-white text-sm h-9 transition-colors duration-200",
                  isDarkMode 
                    ? "bg-blue-500 hover:bg-blue-600" 
                    : ""
                )}
                style={!isDarkMode ? {
                  background: "linear-gradient(90deg, #4A8CFF, #6EA8FF)",
                  boxShadow: "0 2px 8px rgba(74, 140, 255, 0.3)",
                  backdropFilter: "none",
                  WebkitBackdropFilter: "none"
                } : {
                  backdropFilter: "none",
                  WebkitBackdropFilter: "none"
                }}
              >
                {isLoading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Office Hours & Address */}
        <Card
          className={cn(
            "transition",
            isDarkMode
              ? "border-slate-800/60 bg-slate-900/70"
              : "border-transparent bg-white sm:bg-[rgba(255,255,255,0.55)]"
          )}
          style={!isDarkMode ? {
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRadius: "0",
            boxShadow: "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px"
          } : {}}
        >
          {/* Office Hours Section */}
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <Clock 
                size={18} 
                strokeWidth={2}
                className={cn(
                  isDarkMode ? "text-white" : "text-[#4A8CFF]"
                )} 
              />
              <CardTitle
                className={cn(
                  "text-base",
                  isDarkMode ? "text-white" : "text-[#2D3E50]"
                )}
              >
                Office Hours
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2">
              {officeHours.map((schedule) => (
                <div
                  key={schedule.day}
                  className={cn(
                    "flex items-center justify-between border p-2.5",
                    isDarkMode
                      ? "border-slate-800 bg-slate-800/40"
                      : "border-slate-200 bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isDarkMode ? "text-slate-200" : "text-slate-700"
                    )}
                  >
                    {schedule.day}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      isDarkMode ? "text-slate-300" : "text-slate-600"
                    )}
                  >
                    {schedule.hours}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>

          {/* Office Address Section */}
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <MapPin 
                size={18} 
                strokeWidth={2}
                className={cn(
                  isDarkMode ? "text-white" : "text-[#4A8CFF]"
                )} 
              />
              <CardTitle
                className={cn(
                  "text-base",
                  isDarkMode ? "text-white" : "text-[#2D3E50]"
                )}
              >
                Office Address
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <p
              className={cn(
                "text-xs leading-relaxed mb-3",
                isDarkMode ? "text-slate-300" : "text-[#4A5A6A]"
              )}
            >
              Piyali Phukan Road, Rehabari, Guwahati, 781008
            </p>
            <div className={cn(
              "w-full h-32 overflow-hidden border relative",
              isDarkMode ? "border-slate-700" : "border-slate-200"
            )}>
              <iframe
                src="https://www.google.com/maps?q=Piyali+Phukan+Road,+Rehabari,+Guwahati,+781008&output=embed&zoom=15"
                width="100%"
                height="100%"
                style={{ border: 0, pointerEvents: 'none' }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Office Location Map"
                className="pointer-events-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Methods Cards */}
      <div className="grid gap-3 md:grid-cols-3 w-full min-w-0">
        {contactMethods.map((method, index) => {
          const Icon = method.icon;
          const gradients = [
            { from: "#F9FCFF", to: "#ECF6FF" },
            { from: "#F8FFFB", to: "#E9FFF3" },
            { from: "#FDF9FF", to: "#F7ECFF" }
          ];
          return (
            <Card
              key={method.title}
              className={cn(
                "flex flex-col",
                isDarkMode
                  ? "border-transparent bg-slate-900/70"
                  : "border-transparent"
              )}
              style={!isDarkMode ? {
                background: `linear-gradient(to bottom, ${gradients[index].from}, ${gradients[index].to})`,
                borderRadius: "0",
                boxShadow: "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px"
              } : {}}
            >
              <CardHeader className="text-center">
                <CardTitle
                  className={cn(
                    "text-base text-center",
                    isDarkMode ? "text-white" : "text-[#2D3E50]"
                  )}
                >
                  {method.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-center flex flex-col flex-1">
                <p
                  className={cn(
                    "text-xs text-center",
                    isDarkMode ? "text-slate-300" : "text-[#4A5A6A]"
                  )}
                >
                  {method.description}
                </p>
                <div className="mt-auto">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full text-xs h-8",
                      isDarkMode
                        ? "border-blue-500/40 bg-transparent text-blue-100"
                        : ""
                    )}
                    style={!isDarkMode ? {
                      background: "linear-gradient(90deg, rgba(74, 140, 255, 0.1), rgba(110, 168, 255, 0.1))",
                      borderColor: "rgba(74, 140, 255, 0.3)",
                      color: "#4A8CFF"
                    } : {}}
                    onClick={() => window.open(method.action, "_blank")}
                  >
                    {method.contact}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      </div>
    </div>
  );
};

export default ContactSupport;