import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, AlertTriangle, Droplets, Smartphone, Apple, Gem, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import restrictedData from "@/data/restricted.json";
import bannedImage from "@/assets/banned.png";

const iconMap = {
  AlertTriangle,
  Droplets,
  Smartphone,
  Apple,
  Gem,
  Ban
};

const RestrictedItems = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 50]);

  const filteredCategories = restrictedData.categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white relative">
      {/* Full Page Background Image */}
      <div 
        className="fixed inset-0 w-full h-full z-0 background-image-container"
        style={{
          backgroundImage: `url(${bannedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Overlay for better content readability */}
      <div className="fixed inset-0 bg-white/85 z-[1] overlay-container" />
      
      <style>{`
        /* Make background image completely visible on mobile */
        @media (max-width: 767px) {
          .background-image-container {
            background-size: contain !important;
            background-attachment: scroll !important;
            background-position: center top !important;
          }
          
          .overlay-container {
            background: rgba(255, 255, 255, 0.3) !important;
          }

          /* Increase header section height on mobile */
          .header-section-mobile {
            padding-top: 60px !important;
            padding-bottom: 80px !important;
            margin-bottom: 0 !important;
            position: relative;
          }

          /* Move search bar to border between header and next section */
          .search-bar-mobile {
            position: absolute !important;
            bottom: 0 !important;
            left: 50% !important;
            transform: translateX(-50%) translateY(50%) !important;
            width: calc(95% - 32px) !important;
            margin-bottom: 0 !important;
            z-index: 10;
          }

          /* Add margin-top to Important Notice to account for search bar overlap */
          .important-notice-container {
            margin-top: 40px !important;
            margin-bottom: 24px !important;
          }

          /* Reduce gap between Important Notice and category cards */
          .categories-accordion-container {
            margin-top: 0 !important;
          }

          /* Reduce gap between category cards on mobile */
          .categories-accordion-container .space-y-8 > * {
            margin-bottom: 10px !important;
          }

          .categories-accordion-container .space-y-8 > *:last-child {
            margin-bottom: 0 !important;
          }

          /* Reduce card sizes and heights on mobile */
          .categories-accordion-container button[role="button"] {
            padding: 6px 10px !important;
            min-height: auto !important;
          }

          .categories-accordion-container .text-left h3 {
            font-size: 13px !important;
            line-height: 1.2 !important;
            margin-bottom: 2px !important;
          }

          .categories-accordion-container .text-left p {
            font-size: 10px !important;
            line-height: 1.2 !important;
          }

          /* Remove icon box design and keep icons simple on mobile */
          .categories-accordion-container div.w-12 {
            background: transparent !important;
            width: auto !important;
            height: auto !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }

          .categories-accordion-container div.w-12 svg {
            width: 20px !important;
            height: 20px !important;
            color: white !important;
          }

          /* Change icon color to black when card is open/clicked */
          .categories-accordion-container [data-state="open"] div.w-12 svg,
          .categories-accordion-container [data-state="open"] svg {
            color: #000000 !important;
          }

          /* Reduce size and add padding to search bar on mobile */
          .search-bar-container {
            max-width: 95% !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .search-bar-container .search-input {
            padding: 12px 16px 12px 50px !important;
            font-size: 14px !important;
          }

          .search-bar-container .search-icon-container {
            left: 18px !important;
          }

          /* Remove card styling and match width with category cards on mobile */
          .important-notice-container {
            max-width: 100% !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }

          .important-notice-container > div {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 16px 0 !important;
          }

          /* Hide icon on mobile */
          .important-notice-container .flex.items-center > div:first-child {
            display: none !important;
          }

          /* Fix alignment for Important Notice heading on mobile */
          .important-notice-heading {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            line-height: 1.2 !important;
          }

          .important-notice-heading svg {
            flex-shrink: 0 !important;
            vertical-align: middle !important;
          }

          .important-notice-container h3 {
            font-size: 14px !important;
          }

          .important-notice-container h3::before,
          .important-notice-container h3::after {
            content: "" !important;
          }

          .important-notice-container p {
            font-size: 12px !important;
          }
        }

        /* Change icon color to black when card is open/clicked - all screen sizes */
        .categories-accordion-container [data-state="open"] div.w-12 svg,
        .categories-accordion-container [data-state="open"] svg {
          color: #000000 !important;
        }
      `}</style>
      
      <Navbar />
      
      <div className="relative z-[100] container mx-auto px-4 pt-20 pb-20">
        {/* Header Section with Parallax */}
        <motion.div 
          className="text-center mb-8 header-section-mobile relative"
          style={{ y }}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.h1 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 text-red-600"
            style={{ fontFamily: "'Playfair Display', serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Restricted & Banned Items
          </motion.h1>
            <motion.p 
              className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto font-inter hidden md:block"
              style={{ fontFamily: "'Inter', sans-serif" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Items that cannot be shipped through our courier services for safety and regulatory compliance
            </motion.p>
          
          {/* Soft Divider Line */}
          <motion.div 
            className="mt-8 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-[#E5E8EC] to-transparent hidden md:block"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />

          {/* Search Bar */}
        <motion.div
          className="max-w-2xl mx-auto mb-6 search-bar-container search-bar-mobile"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute left-5 top-1/2 -translate-y-1/2 z-10 pointer-events-none search-icon-container"
              whileHover={{ rotate: 15 }}
              transition={{ duration: 0.3 }}
            >
              <Search className="w-5 h-5 text-gray-400" />
            </motion.div>
            <Input
              placeholder="Search items or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 pr-4 py-6 text-base border border-[#E5E8EC] rounded-2xl bg-white transition-all duration-300 font-inter focus:outline-none focus:border-[#F5A623] focus:shadow-[0_0_0_3px_rgba(245,166,35,0.15)] search-input"
              style={{ 
                fontFamily: "'Inter', sans-serif",
                boxShadow: "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px"
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px, 0 0 0 3px rgba(245,166,35,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px";
              }}
            />
          </motion.div>
          </motion.div>
        </motion.div>

        {/* Important Notice Card - Glass Effect */}
        <motion.div
          className="mb-16 max-w-2xl mx-auto important-notice-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.div
            className="relative bg-gradient-to-br from-white to-[#F9FAFB] border border-[#E5E8EC] rounded-2xl px-5 py-4 backdrop-blur-sm"
            style={{
              boxShadow: "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px"
            }}
            whileHover={{ 
              boxShadow: "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px",
              y: -2
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.7,
                type: "spring",
                stiffness: 200
              }}
            >
              <motion.div 
                className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 rounded-lg flex items-center justify-center flex-shrink-0"
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 0.6,
                  delay: 0.8,
                  repeat: 1
                }}
              >
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </motion.div>
              <div className="flex-1">
                <h3 
                  className="text-sm sm:text-base md:text-lg font-bold mb-1 text-[#0C1B33] important-notice-heading flex items-center gap-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  <AlertTriangle className="w-4 h-4 text-red-600 md:hidden" />
                  <span className="hidden md:inline">:: </span>Important Notice:<span className="hidden md:inline"> ::</span>
                </h3>
                <p 
                  className="text-xs sm:text-sm text-gray-600 leading-relaxed"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Attempting to ship restricted items may result in shipment rejection, delays, or legal consequences. 
                  Please review this list carefully before booking your shipment.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Categories Accordion */}
        <motion.div
          className="max-w-5xl mx-auto mb-20 categories-accordion-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Accordion type="single" collapsible className="space-y-8">
            {filteredCategories.map((category, index) => {
              const IconComponent = iconMap[category.icon as keyof typeof iconMap];
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <AccordionItem 
                    value={category.id} 
                    className="rounded-2xl bg-red-600 overflow-hidden transition-all duration-300 hover:-translate-y-1 border-0"
                    style={{
                      boxShadow: "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px"
                    }}
                  >
                    <AccordionTrigger 
                      className="group px-6 py-5 hover:no-underline [&[data-state=open]]:bg-[#FFF9F0] [&[data-state=open]]:border-b-0 transition-colors duration-300"
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-data-[state=open]:bg-red-100">
                          <IconComponent className="w-6 h-6 text-white group-data-[state=open]:text-red-600" />
                        </div>
                        <div className="text-left flex-1">
                          <h3 
                            className="text-base sm:text-lg md:text-xl font-semibold text-white mb-1 group-data-[state=open]:text-[#0C1B33]"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {category.name}
                          </h3>
                          <p 
                            className="text-xs sm:text-sm text-white/90 font-inter group-data-[state=open]:text-gray-500"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {category.items.length} restricted items
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-0 border-t-0 -mt-[1px]">
                      <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {category.items.map((item, itemIndex) => (
                          <motion.div
                            key={itemIndex}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 * itemIndex }}
                            className="flex items-center space-x-3 p-3 border border-[#E5E8EC] rounded-xl bg-white transition-all duration-300"
                          >
                            <div 
                              className="w-2 h-2 bg-[#F5A623]"
                            />
                            <span 
                              className="text-xs sm:text-sm text-black font-inter"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              {item}
                            </span>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </Accordion>
        </motion.div>
      </div>

      <div className="relative z-[100]">
        <Footer />
      </div>
    </div>
  );
};

export default RestrictedItems;
