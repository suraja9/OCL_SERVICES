import React from "react";
import { motion } from "framer-motion";
import { Truck, Clock, Shield, MapPin, CheckCircle, Package, Zap, Users, Calendar, Star, Radio, HeadphonesIcon, DollarSign, TrendingDown, Globe, FileCheck, Lock, Link2, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import expressDeliveryImg from "@/assets/express-delivery.png";
import standardDeliveryImg from "@/assets/courier-2.png";
import secureCourierImg from "@/assets/secure-courier.png";
import courierMainImg from "@/assets/courier-main.png";
import fastReliableImg from "@/assets/Fast-reliable.png";
import wideCoverageImg from "@/assets/wide-coverage.png";
import dedicatedSupportImg from "@/assets/dedicated-support.png";
import transparencyImg from "@/assets/transparency.png";

const Courier = () => {

  const benefits = [
    {
      icon: fastReliableImg,
      title: "Fast & Reliable",
      description: "On-time delivery with 99% success rate"
    },
    {
      icon: wideCoverageImg,
      title: "Wide Coverage",
      description: "Delivering to 25,000+ pin codes across India"
    },
    {
      icon: dedicatedSupportImg,
      title: "Dedicated Support",
      description: "24/7 customer support for all your queries"
    },
    {
      icon: transparencyImg,
      title: "100% Transparency",
      description: "Real-time tracking and instant notifications"
    }
  ];

  // Icon mapping function for feature bullet points
  const getFeatureIcon = (feature: string) => {
    const iconProps = { className: "w-4 h-4 text-white flex-shrink-0 mt-0.5" };
    const text = feature.toLowerCase();

    if (text.includes("pickup")) return <Calendar {...iconProps} />;
    if (text.includes("priority")) return <Star {...iconProps} />;
    if (text.includes("tracking")) return <Radio {...iconProps} />;
    if (text.includes("support")) return <Users {...iconProps} />;

    if (text.includes("cost-effective") || text.includes("cost-effective")) return <TrendingDown {...iconProps} />;
    if (text.includes("coverage")) return <Globe {...iconProps} />;
    if (text.includes("insurance provided")) return <Shield {...iconProps} />;
    if (text.includes("proof of delivery")) return <FileCheck {...iconProps} />;

    if (text.includes("tamper-proof")) return <Lock {...iconProps} />;
    if (text.includes("chain of custody")) return <Link2 {...iconProps} />;
    if (text.includes("background-verified")) return <UserCheck {...iconProps} />;
    if (text.includes("insurance up to")) return <Shield {...iconProps} />;

    return <CheckCircle {...iconProps} />;
  };


  const services = [
    {
      title: "EXPRESS DELIVERY",
      description: "Same-day and next-day delivery for urgent shipments",
      features: ["Same-Day Pickup", "Priority Services", "Real-time Tracking", "Dedicated Support"],
      bgImage: expressDeliveryImg
    },
    {
      title: "STANDARD DELIVERY",
      description: "Reliable delivery within 2-5 business days",
      features: ["Cost-Effective", "Nationwide Coverage", "Insurance provided upon Request", "Proof of Delivery"],
      bgImage: standardDeliveryImg
    },
    {
      title: "SECURE COURIER",
      description: "Enhanced security for valuable and sensitive items",
      features: ["Tamper-proof packaging", "Chain of custody", "Background-verified agents", "Insurance up to ₹1 Lakh"],
      bgImage: secureCourierImg
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-soft flex flex-col">
      <Navbar />
      
        {/* Hero Section */}
      <section 
        className="relative -mt-20 pt-20 md:pt-24 overflow-x-hidden min-h-[50vh] w-full"
        style={{
          backgroundImage: `url(${courierMainImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'fixed' : 'scroll'
        }}
      >
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 sm:px-6 relative z-10 flex items-center justify-center min-h-[80vh]">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="flex justify-center mb-4 md:mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-red/10 rounded-full flex items-center justify-center">
                  <Truck className="w-8 h-8 md:w-10 md:h-10 text-brand-red" />
                </div>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 px-2">
                Courier Services
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white max-w-3xl mx-auto mb-8 md:mb-14 px-2">
                Fast, reliable, and secure courier services for all your delivery needs. 
                From documents to packages, we ensure your items reach their destination safely and on time.
              </p>
              
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
                  <Link to="/schedule-pickup">
                    <Button 
                      size="lg" 
                      className="px-8 py-6 text-base font-semibold bg-[#FDA11E] text-white hover:bg-white hover:text-black rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-[#FDA11E] hover:border-white"
                    >
                      Book Pickup Now
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
                  <Link to="/rates">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="px-8 py-6 text-base font-semibold bg-white text-black hover:bg-[#FA9D17] hover:text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-white hover:border-[#FA9D17]"
                    >
                      View Rates
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

      <main className="flex-1">
        {/* Services Section */}
        <section className="py-8 md:py-10">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6 md:mb-9"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 px-2" style={{ color: '#424530' }}>
                <span style={{ color: '#FFA019' }}>Our</span> Services
              </h2>
              
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="relative group cursor-pointer"
                >
                  {/* Clean white card with orange fill animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.6,
                      ease: "easeOut",
                      delay: 0.2 + index * 0.08,
                    }}
                    className={`ocl-service-card ${index !== 1 ? 'ocl-service-card-reversed' : 'ocl-service-card-black'} relative bg-white rounded-2xl border border-slate-100 px-3 pt-1 pb-5 md:px-4 md:pt-2 md:pb-6 h-full flex flex-col`}
                    style={{ boxShadow: 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px' }}
                  >
                    <div className="flex-1 flex flex-col md:flex-row md:items-start gap-4 min-h-0 overflow-hidden">
                      {/* Title and hover content: points on left */}
                      <div className="md:w-[55%] flex-shrink-0 flex flex-col h-full">
                        <h3 className={`text-[18px] font-semibold leading-tight mb-1 mt-2 transition-all duration-300 ${
                          index === 1 
                            ? 'text-[#FFA019]' 
                            : 'text-[#062B4F] group-hover:text-[#062B4F]'
                        }`}>
                          {service.title}
                        </h3>
                        {/* Points - reversed for first and third cards */}
                        <ul className={`mt-auto mb-0 space-y-0.5 transition-opacity duration-300 delay-200 ${
                          index === 1
                            ? 'invisible opacity-0 group-hover:visible group-hover:opacity-100'
                            : 'visible opacity-100 group-hover:invisible group-hover:opacity-0'
                        }`}>
                          {service.features.map((feature, featureIndex) => (
                            <li
                              key={featureIndex}
                              className="flex items-start gap-1.5 text-[15px] text-white leading-tight"
                            >
                              {getFeatureIcon(feature)}
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Image - always visible on right */}
                      <div className="md:w-[45%] md:self-center flex justify-center items-center min-h-0 max-h-full overflow-hidden">
                        <img
                          src={service.bgImage}
                          alt={service.title}
                          className="max-w-[80%] max-h-[80%] w-auto h-auto object-contain rounded-lg"
                          style={{ maxHeight: '80%' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="pt-6 md:pt-8 pb-12 md:pb-16" style={{ background: '#F5F5F5' }}>
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center mb-8 md:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 px-2" style={{ color: '#424530' }}>
                Why Choose <span style={{ color: '#FFA019' }}>OCL?</span>
              </h2>
              
            </motion.div>
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
                    className="text-center border-r border-gray-300 last:border-r-0 pr-4 md:pr-8"
                  >
                    <div className="flex justify-center mb-3">
                      <img 
                        src={benefit.icon} 
                        alt={benefit.title}
                        className="w-12 h-12 md:w-16 md:h-16 object-contain"
                      />
                    </div>
                    <div className="text-lg md:text-xl font-bold mb-2" style={{ color: '#424530' }}>
                      {benefit.title}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">
                      {benefit.description}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Courier;

