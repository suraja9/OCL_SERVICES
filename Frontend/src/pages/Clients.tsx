import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import clientPageImage from "@/assets/client-page-1.png";
import Footer from "@/components/Footer";
import AnimatedCounter from "@/components/clients/AnimatedCounter";
import LogoCloud from "@/components/clients/LogoCloud";
import IndustryFilter from "@/components/clients/IndustryFilter";
import FeaturedClients from "@/components/clients/FeaturedClients";
import { Button } from "@/components/ui/button";
import {
  featuredClients,
  industryClients,
  industries,
  businessTypes,
  regions,
  totalClientCount,
  type Client,
} from "@/data/clientsData";

const Clients = () => {
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [selectedBusinessType, setSelectedBusinessType] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");

  // Filter clients based on selections
  const filteredClients = useMemo(() => {
    let clients: Client[] = [];

    if (selectedIndustry === "All") {
      // Show featured clients when all industries selected
      clients = featuredClients.slice(0, 12);
    } else {
      // Show clients from selected industry
      clients = industryClients[selectedIndustry] || [];
    }

    // Apply business type filter
    if (selectedBusinessType !== "All") {
      clients = clients.filter(
        (client) => client.businessType === selectedBusinessType
      );
    }

    // Apply region filter
    if (selectedRegion !== "All") {
      clients = clients.filter((client) => client.region === selectedRegion);
    }

    return clients.slice(0, 12); // Limit to 12 logos
  }, [selectedIndustry, selectedBusinessType, selectedRegion]);


  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* 1. Hero Section */}
      <section className="relative w-full pt-24 md:pt-32 pb-4 md:pb-6 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        
        <div className="relative z-10 container mx-auto px-4 md:px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                <AnimatedCounter value={totalClientCount} suffix="+" />
              </span>{" "}
              Businesses Across India
            </h1>
            

            {/* Animated Counters */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  <AnimatedCounter value={totalClientCount} suffix="+" />
                </div>
                <div className="text-sm md:text-base text-gray-600">Clients</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  <AnimatedCounter value={98} suffix="%" />
                </div>
                <div className="text-sm md:text-base text-gray-600">Satisfaction</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  <AnimatedCounter value={4.8} decimals={1} suffix="/5" />
                </div>
                <div className="text-sm md:text-base text-gray-600">Rating</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Industry Filter Section */}
      <section className="pt-6 pb-4 border-y border-gray-200" style={{ backgroundColor: '#FFF5E6' }}>
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <IndustryFilter
            industries={industries}
            businessTypes={businessTypes}
            regions={regions}
            selectedIndustry={selectedIndustry}
            selectedBusinessType={selectedBusinessType}
            selectedRegion={selectedRegion}
            onIndustryChange={setSelectedIndustry}
            onBusinessTypeChange={setSelectedBusinessType}
            onRegionChange={setSelectedRegion}
          />

          {/* Filtered Results */}
          {selectedIndustry !== "All" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-12"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                {selectedIndustry} Clients
              </h3>
              <div className="flex justify-center">
                <LogoCloud clients={filteredClients} maxLogos={12} grayscale={false} />
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* 3. Featured Partners */}
      <section className="pt-4 pb-4 md:pb-6 bg-black">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <FeaturedClients clients={featuredClients} />
        </div>
      </section>

      {/* 4. Become a Featured Partner */}
      <section className="pt-4 md:pt-6 pb-8 md:pb-12 bg-white">
        <style>{`
          .button-86 {
            all: unset;
            width: auto;
            min-width: 200px;
            height: auto;
            font-size: 16px;
            background: transparent;
            border: none;
            position: relative;
            color: #f0f0f0;
            cursor: pointer;
            z-index: 1;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
            font-weight: 600;
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
        `}</style>
        <div className="container mx-auto px-10 md:px-6 max-w-[1200px]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-10 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              {/* Left Side - Text Content */}
              <div className="text-center md:text-left md:-ml-10">
                <h2 
                  className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  Become a Partner with <span style={{ color: '#FFA019' }}>OCL</span>
                </h2>
                <p 
                  className="text-sm md:text-base text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto md:mx-0"
                  style={{ lineHeight: '1.75' }}
                >
                  Join India's growing logistics network. Long-term partner brands get featured here, gaining visibility across thousands of monthly visitors. Showcase your brand alongside leading companies that trust OCL.
                </p>
                <div className="flex flex-col items-center md:items-start gap-4">
                  <Link to="/contact">
                    <button className="button-86" role="button">
                      Become a Featured Partner
                    </button>
                  </Link>
                  
                </div>
              </div>

              {/* Right Side - Image */}
              <div className="relative flex justify-center md:justify-end">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative w-full max-w-md z-10"
                >
                  <img
                    src={clientPageImage}
                    alt="Featured Partner"
                    className="w-full h-auto object-contain"
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Clients;
