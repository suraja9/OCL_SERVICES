import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/useScrollAnimation";
import { Lightbulb, BarChart3, Rocket, Settings, ShoppingCart, Factory, Store, Plus, Building2, Package } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import logisticsMainImage from "@/assets/logistics-main.png";
import ltlImage from "@/assets/ltl.png";
import ftlImage from "@/assets/ftl.png";
import heavyHaultImage from "@/assets/heavy-hault.png";
import containerizedServicesImage from "@/assets/containerized-services.png";
import valueAddedImage from "@/assets/value-added.png";

const Logistics = () => {
  const titleAnimation = useScrollAnimation();
  const industryAnimations = useStaggeredAnimation(4, 150);
  const processAnimations = useStaggeredAnimation(4, 150);
  const logisticsServices = [
    {
      title: "LESS THAN TRUCK LOAD (LTL)",
      description: "Reliable and affordable small shipment solutions across India with full tracking support.",
      image: ltlImage
    },
    {
      title: "FULL TRUCK LOAD (FTL)",
      description: "Move bulk loads anywhere in India with end-to-end logistics management and timely delivery.",
      image: ftlImage
    },
    {
      title: "PROJECT & HEAVY HAUL",
      description: "Specialized in moving large, complex cargo with expert planning and permits.",
      image: heavyHaultImage
    },
    {
      title: "CONTAINERIZED SERVICES",
      description: "Safe and organized movement of goods using containerized transport solutions.",
      image: containerizedServicesImage
    },
    {
      title: "VALUE-ADDED SERVICES",
      description: "Real-time tracking, analytics, and reporting tools that enhance your logistics efficiency.",
      image: valueAddedImage
    }
  ];

  const industries = [
    {
      name: "E-commerce",
      icon: ShoppingCart,
      hoverDescription: "Reliable logistics for online sellers — faster deliveries, real-time tracking, and zero missed deadlines."
    },
    {
      name: "Manufacturing",
      icon: Factory,
      hoverDescription: "On-time movement of materials and finished goods — keeping your production lines running 24/7."
    },
    {
      name: "Retail",
      icon: Store,
      hoverDescription: "We handle nationwide store deliveries with precision, ensuring shelves stay stocked and sales never stop."
    },
    {
      name: "Healthcare",
      icon: Plus,
      hoverDescription: "Safe, temperature-controlled transport for critical medical supplies, pharma, and emergency shipments."
    },
    {
      name: "Construction",
      icon: Building2,
      hoverDescription: "Heavy-duty logistics for materials, machinery, and tools — delivered exactly when your project needs them."
    },
    {
      name: "Day to Day Life Request",
      icon: Package,
      hoverDescription: "Simplifying everyday logistics — from groceries to essentials, we keep life moving on schedule."
    }
  ];

  const [isHovered, setIsHovered] = useState(false);

  const process = [
    {
      step: "01",
      title: "Consultation",
      description: "Analyze your logistics requirements and design custom solutions",
      icon: Lightbulb,
      color: "#FFA019"
    },
    {
      step: "02",
      title: "Integration",
      description: "Seamlessly integrate with your existing systems and processes",
      icon: BarChart3,
      color: "#FFA019"
    },
    {
      step: "03",
      title: "Execution",
      description: "Implement logistics operations with real-time monitoring",
      icon: Rocket,
      color: "#FFA019"
    },
    {
      step: "04",
      title: "Optimization",
      description: "Continuous improvement through data analysis and feedback",
      icon: Settings,
      color: "#FFA019"
    }
  ];

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: `url(${logisticsMainImage})`,
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Navbar />
      
      <main className="flex-1 pt-16 relative z-10">
        {/* Hero Section */}
        <section className="relative py-0 overflow-x-hidden min-h-[50vh] w-full">
          {/* Dark Overlay for Hero Section Only */}
          <div 
            className="absolute inset-0"
                style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              zIndex: 0,
            }}
          />
          
          <div className="container mx-auto px-4 relative z-10 flex items-center justify-center min-h-[80vh]">
            <div ref={titleAnimation.ref} className={`text-center transition-all duration-700 ${titleAnimation.className}`}>
              <motion.h1 
                className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Logistics Solutions
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Comprehensive logistics and supply chain management solutions to streamline your operations. 
                From warehousing to last-mile delivery, we've got your business covered.
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap justify-center gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }} 
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <Link to="/enquiry">
                    <Button 
                      size="lg" 
                      className="px-8 py-6 text-base font-semibold bg-[#FDA11E] text-white hover:bg-white hover:text-black rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-[#FDA11E] hover:border-white"
                    >
                      Get Custom Quote
                    </Button>
                  </Link>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }} 
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 }}
                >
                  <Link to="/contact">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="px-8 py-6 text-base font-semibold bg-white text-black hover:bg-[#FA9D17] hover:text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-white hover:border-[#FA9D17]"
                    >
                      Contact Expert
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Logistics Services Section */}
        <section 
          className="py-12 relative z-10"
                      style={{
            background: "#ffffff",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-bold mb-4" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "48px" }}>
                <span style={{ color: "#FFA019" }}>Our</span> Logistics Services
              </h2>
              
            </motion.div>

            <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
              {logisticsServices.map((service, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1, 
                    ease: "easeOut" 
                  }}
                  className="group cursor-pointer w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                  style={{ maxWidth: "380px" }}
                >
                  <div className="bg-white rounded-xl overflow-hidden transition-all duration-300"
                    style={{
                      boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px",
                      border: "1px solid rgba(148, 163, 184, 0.15)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px";
                      e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px";
                      e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.15)";
                    }}
                  >
                    {/* Image Container */}
                    <div 
                      className="relative overflow-hidden bg-gray-200 flex items-center justify-center"
                      style={{
                        aspectRatio: "21/9",
                        borderRadius: "12px 12px 0 0",
                      }}
                    >
                      {service.image ? (
                        <motion.img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : (
                        <motion.div
                          className="w-full h-full flex items-center justify-center"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="text-gray-400 text-sm font-medium">Image Placeholder</div>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold mb-2 uppercase" style={{ color: "#1a1a1a" }}>
                          {service.title}
                        </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                          {service.description}
                        </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section 
          className="py-10 relative z-10"
          style={{
            background: "#0a0a0a",
            paddingTop: "20px",
            paddingBottom: "20px",
          }}
        >
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-bold mb-3" style={{ fontWeight: 600, color: "#ffffff", fontSize: "48px" }}>
                Industries <span style={{ color: "#FFA019" }}>We Serve</span>
              </h2>
              
            </motion.div>

            <div className="relative overflow-x-hidden py-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <div className="flex justify-center items-center w-full min-h-[120px]">
                <div 
                  className="flex gap-5"
                  style={{
                    animation: isHovered ? "none" : "scroll 35s linear infinite",
                    width: "fit-content",
                    gap: "20px",
                  }}
                >
                {/* Duplicate items for seamless infinite loop */}
                {[...industries, ...industries, ...industries].map((industry, index) => {
                    const IconComponent = industry.icon;
                    return (
                    <motion.div
                      key={`${industry.name}-${index}`}
                      className="flex-shrink-0 w-[300px] sm:w-[320px] md:w-[360px]"
                      onHoverStart={() => setIsHovered(true)}
                      onHoverEnd={() => setIsHovered(false)}
                    >
                      <motion.div
                        className="relative"
                        style={{
                          transformOrigin: "center center",
                        }}
                        initial="rest"
                        whileHover="hover"
                        variants={{
                          rest: { 
                            scale: 1,
                          },
                          hover: { 
                            scale: 1.05,
                            zIndex: 5,
                            transition: { duration: 0.4, ease: "easeInOut" }
                          }
                        }}
                      >
                        <motion.div
                          className="industry-card bg-white rounded-none relative overflow-hidden cursor-pointer h-[120px]"
                          style={{
                            borderRadius: "0",
                            padding: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          {/* Title on the left */}
                          <motion.div 
                            className="flex-1 z-10"
                            variants={{
                              rest: { opacity: 1 },
                              hover: { opacity: 0, transition: { duration: 0.3 } }
                            }}
                          >
                            <h3 
                              className="font-bold text-lg md:text-xl"
                              style={{ color: "#1a1a1a" }}
                            >
                              {industry.name}
                            </h3>
                          </motion.div>

                          {/* Icon on the right */}
                          <motion.div 
                            className="z-10 ml-4"
                            variants={{
                              rest: { opacity: 1, scale: 1 },
                              hover: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } }
                            }}
                          >
                            <IconComponent 
                              className="w-12 h-12"
                              style={{ color: "#FDA11E" }}
                            />
                          </motion.div>

                          {/* Description overlay on hover */}
                          <motion.div
                            className="absolute inset-0 z-20 flex items-center justify-center p-6"
                            variants={{
                              rest: { 
                                opacity: 0,
                              },
                              hover: { 
                                opacity: 1,
                                transition: { duration: 0.4, ease: "easeInOut" }
                              }
                            }}
                            style={{
                              background: "rgba(253, 161, 30, 0.95)",
                              borderRadius: "0",
                            }}
                          >
                            <p 
                              className="leading-relaxed text-center"
                              style={{
                                fontSize: "16px",
                                fontWeight: 500,
                                textAlign: "center",
                                maxWidth: "90%",
                                color: "#FFFFFF",
                                lineHeight: 1.5,
                              }}
                            >
                              {industry.hoverDescription}
                            </p>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
            <style>{`
              @keyframes scroll {
                0% {
                  transform: translateX(0);
                }
                100% {
                  transform: translateX(-33.333%);
                }
              }
              @media (max-width: 640px) {
                .industry-card {
                  height: 100px !important;
                  padding: 16px !important;
                }
              }
              /* Hide scrollbars */
              .relative.overflow-x-hidden::-webkit-scrollbar {
                display: none;
              }
              .relative.overflow-x-hidden {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
          </div>
        </section>

        {/* Process Section */}
        <section 
          className="py-12 relative z-10"
          style={{
            background: "#ffffff",
          }}
        >
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-bold mb-4" style={{ fontWeight: 600, color: "#111111", fontSize: "48px" }}>
                <span style={{ color: "#FFA019" }}>Our</span> Process
              </h2>
              
              {/* Animated underline */}
              <motion.div
                className="h-0.5 bg-[#FDA11E] mx-auto"
                initial={{ width: 0 }}
                whileInView={{ width: "120px" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                style={{ maxWidth: "120px" }}
              />
            </motion.div>

            <div className="max-w-7xl mx-auto">
              <div className="relative flex justify-center">
                <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
                  {process.map((step, index) => {
                    const IconComponent = step.icon;
                    return (
                    <motion.div 
                      key={index}
                        initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                        className="relative flex-shrink-0"
                        style={{ width: "230px" }}
                      >
                        {/* Colored background layer - offset diagonally */}
                        <div
                          className="absolute rounded-none z-0"
                          style={{
                            width: "230px",
                            height: "210px",
                            background: step.color,
                            borderRadius: "0",
                            top: "8px",
                            left: "8px",
                          }}
                        />
                        
                        {/* White card */}
                        <div 
                          className="relative bg-white rounded-none cursor-pointer transition-all duration-300"
                          style={{
                            width: "230px",
                            height: "210px",
                            borderRadius: "0",
                            boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px",
                            padding: "20px 18px 60px 18px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            position: "relative",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-6px)";
                            e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px";
                          }}
                        >
                          {/* Icon at top center */}
                          <div className="flex justify-center mb-3">
                            <IconComponent 
                              className="w-10 h-10"
                              style={{ 
                                color: step.color,
                                strokeWidth: 1.5,
                              }}
                            />
                      </div>
                          
                          {/* Title */}
                          <h3 
                            className="font-bold text-center mb-2"
                            style={{ 
                              color: "#111111",
                              fontSize: "1.2rem",
                            }}
                      >
                        {step.title}
                      </h3>
                          
                          {/* Description */}
                          <p 
                            className="text-center leading-relaxed"
                            style={{ 
                              color: "#555555",
                              fontSize: "0.9rem",
                              marginBottom: "16px",
                              flex: 1,
                            }}
                          >
                            {step.description}
                          </p>
                          
                          {/* Step tag in top-right corner - diagonal overlay */}
                          <div 
                            className="absolute top-0 right-0 z-10"
                            style={{
                              width: "65px",
                              height: "65px",
                              background: step.color,
                              clipPath: "polygon(100% 0, 100% 100%, 0 0)",
                              borderTopRightRadius: "0",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "flex-start",
                              alignItems: "flex-end",
                              paddingTop: "4px",
                              paddingRight: "6px",
                            }}
                          >
                            <span 
                              className="text-white"
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                lineHeight: "1.1",
                                marginBottom: "1px",
                                textAlign: "right",
                              }}
                            >
                              STEP
                            </span>
                            <span 
                              className="text-white"
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                lineHeight: "1.1",
                                textAlign: "right",
                              }}
                            >
                              {step.step}
                            </span>
                          </div>
                        </div>
                        
                        {/* Connector line between cards - desktop */}
                        {index < process.length - 1 && (
                          <motion.div
                            className="hidden md:block absolute top-1/2 left-full z-10"
                            style={{
                              background: "#E5E5E5",
                              transform: "translateY(-50%)",
                              width: "40px",
                              height: "2px",
                              left: "100%",
                            }}
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 + index * 0.1, ease: "easeOut" }}
                          />
                        )}
                        
                        {/* Connector line for mobile - vertical */}
                        {index < process.length - 1 && (
                          <div 
                            className="md:hidden absolute top-full left-1/2 z-10"
                            style={{
                              background: "#E5E5E5",
                              transform: "translateX(-50%)",
                              width: "2px",
                              height: "40px",
                            }}
                          />
                        )}
                    </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Logistics;