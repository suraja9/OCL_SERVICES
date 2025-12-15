import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import navData from "@/data/nav.json";
import { useState } from "react";
import facebookIcon from "@/Icon-images/facebook.png";
import instagramIcon from "@/Icon-images/instagram.png";
import twitterIcon from "@/Icon-images/twitter.png";
import linkedinIcon from "@/Icon-images/linkedin.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Replace with Supabase integration for newsletter signup
    setShowSuccess(true);
    setEmail("");
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <footer className="bg-black border-t-2 border-brand-red text-white">

      {/* Main Footer Content */}
      <div className="ocl-container px-2" style={{ paddingTop: '30px', paddingBottom: '40px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-6">
          
          {/* About / Brand Summary Column */}
          <div className="space-y-5">
            <h3 
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4"
              style={{ color: '#FFC043', fontFamily: 'Poppins, ui-sans-serif' }}
            >
              {navData.logo.text}
            </h3>
            <p 
              className="text-[#F8F8F8] text-xs sm:text-sm md:text-base leading-relaxed"
              style={{ lineHeight: '1.8' }}
            >
              {navData.logo.tagline} Your trusted logistics partner delivering fast, secure, and reliable courier solutions India.
            </p>
            
            {/* Contact Info with Icons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#FFC043] flex-shrink-0 mt-0.5" />
                <span className="text-[#D4D9DE] text-xs sm:text-sm"> Piyali Phukan Road, Rehabari,
                Guwahati, 781008</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-[#FFC043] flex-shrink-0" />
                <span className="text-[#D4D9DE] text-xs sm:text-sm">+91 76360 96733</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-[#FFC043] flex-shrink-0" />
                <span className="text-[#D4D9DE] text-xs sm:text-sm">info@oclservices.com</span>
              </div>
            </div>
          </div>

          {/* Services Column */}
          <div className="space-y-5">
            <h4 
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-4"
              style={{ color: '#FFC043', fontFamily: 'Poppins, ui-sans-serif' }}
            >
              Services
            </h4>
            <ul className="space-y-3">
              {navData.navigation.find(nav => nav.label === "Services")?.items?.map((item) => (
                <li key={item.label}>
                  <a 
                    href={item.href} 
                    className="text-[#D4D9DE] hover:text-[#FFC043] transition-colors duration-300 text-xs sm:text-sm md:text-base block"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-5">
            <h4 
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-4"
              style={{ color: '#FFC043', fontFamily: 'Poppins, ui-sans-serif' }}
            >
              Company
            </h4>
            <ul className="space-y-3">
              {navData.navigation.find(nav => nav.label === "Company")?.items?.map((item) => (
                <li key={item.label}>
                  <a 
                    href={item.href} 
                    className="text-[#D4D9DE] hover:text-[#FFC043] transition-colors duration-300 text-xs sm:text-sm md:text-base block"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies Column */}
          <div className="space-y-5">
            <h4 
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-4"
              style={{ color: '#FFC043', fontFamily: 'Poppins, ui-sans-serif' }}
            >
              Policies
            </h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="/terms-and-conditions" 
                  className="text-[#D4D9DE] hover:text-[#FFC043] transition-colors duration-300 text-xs sm:text-sm md:text-base block"
                >
                  Terms and Conditions
                </a>
              </li>
              <li>
                <a 
                  href="/privacy" 
                  className="text-[#D4D9DE] hover:text-[#FFC043] transition-colors duration-300 text-xs sm:text-sm md:text-base block"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="/shipping-and-return-policy" 
                  className="text-[#D4D9DE] hover:text-[#FFC043] transition-colors duration-300 text-xs sm:text-sm md:text-base block"
                >
                  Shipping & Return Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter + Social Links Column */}
          <div className="space-y-6">
            <h4 
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-4"
              style={{ color: '#FFC043', fontFamily: 'Poppins, ui-sans-serif' }}
            >
              Stay Updated
            </h4>
            <p className="text-[#D4D9DE] text-xs sm:text-sm md:text-base">
              Subscribe to our newsletter for the latest updates and shipping tips.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-white rounded-lg border-0 text-gray-900 placeholder:text-gray-500 h-12 px-4 focus:ring-2 focus:ring-[#FFC043]"
                required
              />
              <Button 
                type="submit" 
                className="w-full rounded-full bg-gradient-to-r from-[#FD9C13] to-[#F49610] hover:from-[#e58f12] hover:to-[#d8820f] text-white font-semibold h-12 transition-all duration-300 hover:scale-105"
              >
                Subscribe
              </Button>
            </form>

            {/* Success Message */}
            {showSuccess && (
              <div className="text-[#FFC043] text-sm font-medium animate-fade-in">
                Thanks for subscribing!
              </div>
            )}

            {/* Social Media Links */}
            <div className="pt-4">
              <p className="text-[#D4D9DE] text-xs sm:text-sm mb-4 font-medium text-center md:text-left">Follow Us</p>
              <div className="flex space-x-4 justify-center md:justify-start">
                <a 
                  href="https://www.linkedin.com/company/our-courier-and-logistics/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  style={{ backgroundColor: "transparent" }}
                >
                  <img src={linkedinIcon} alt="LinkedIn" className="w-8 h-8" />
                </a>
                <a 
                  href="https://www.instagram.com/ocl_services/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  style={{ backgroundColor: "transparent" }}
                >
                  <img src={instagramIcon} alt="Instagram" className="w-8 h-8" />
                </a>
                <a 
                  href="https://twitter.com/oclservices" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  style={{ backgroundColor: "transparent" }}
                >
                  <img src={twitterIcon} alt="Twitter" className="w-8 h-8" />
                </a>
                <a 
                  href="https://www.facebook.com/oclservices" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  style={{ backgroundColor: "transparent" }}
                >
                  <img src={facebookIcon} alt="Facebook" className="w-8 h-8" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-[#FFA019] border-t border-black/20">
        <div className="ocl-container px-2 py-3">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-black text-[10px] sm:text-xs md:text-sm text-center md:text-left">
              © {currentYear} OCL Services. All rights reserved.
            </p>
            <p className="text-black text-[10px] sm:text-xs md:text-sm text-center md:text-right">
              Powered by OCL.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;