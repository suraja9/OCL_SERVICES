import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Clock, MapPin, Calendar, CheckCircle, Package, Shield, Sparkles, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ourJourney from "@/assets/our-journey.png";
import schedule1 from "@/assets/schedule-1.png";
import schedule2 from "@/assets/schedule-2.png";
import schedule3 from "@/assets/schedule-3.png";
import schedule4 from "@/assets/schedule-4.png";

const SchedulePickup = () => {
  // Hero schedule form state (UI only; wire to API later)
  const [pickupPincode, setPickupPincode] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [weight, setWeight] = useState("");

  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Flexible Scheduling",
      description: "Schedule pickups at your convenience - same day or advance booking"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Real-time Tracking",
      description: "Track your pickup agent in real-time with live GPS updates"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Doorstep Pickup",
      description: "Our agents will collect packages directly from your location"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Instant Confirmation",
      description: "Get instant booking confirmation with pickup details"
    }
  ];

  const steps = [
    { step: "1", title: "Schedule Pickup", description: "Choose time and share package details online" },
    { step: "2", title: "Pickup Confirmed", description: "Instant confirmation and dispatch scheduling" },
    { step: "3", title: "Secure Transit", description: "Tamper-evident handling and verified custody" },
    { step: "4", title: "Delivered with Care", description: "Professional handover and confirmation" }
  ];

  const services = [
    { icon: <Truck className="w-6 h-6" />, title: "Express Courier", desc: "Same-day and next-day pickups for priority parcels" },
    { icon: <Package className="w-6 h-6" />, title: "Bulk Shipments", desc: "Optimized pickup for cartons and multi-piece loads" },
    { icon: <Shield className="w-6 h-6" />, title: "Secure Handling", desc: "Tamper-evident sealing and ID-verified partners" },
    { icon: <Sparkles className="w-6 h-6" />, title: "White-Glove", desc: "Premium doorstep experience for high-value items" }
  ];

  const [activeService, setActiveService] = useState(1);

  const whyRef = useRef<HTMLDivElement | null>(null);
  const coreRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] to-[#f8f6f5] flex flex-col overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1 pb-16 overflow-x-hidden">
        {/* Hero Section - Cinematic full-screen banner */}
        <section 
          className="relative flex items-center overflow-hidden -mt-20 pt-20 w-full"
          style={{ 
            minHeight: '85vh',
            height: 'auto',
            backgroundImage: `url(${ourJourney})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: window.innerWidth > 768 ? 'fixed' : 'scroll',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(43,14,14,0.8) 0%, rgba(43,14,14,0.55) 30%, rgba(43,14,14,0) 70%)", zIndex: 1 }} />
          <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 200px rgba(0,0,0,0.25)", zIndex: 1 }} />
          <div className="container mx-auto px-4 sm:px-6 md:px-8 relative py-8 sm:py-12 md:py-16" style={{ zIndex: 2 }}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.19,1,0.22,1] }}
              className="w-full lg:w-[45%]"
            >
              <h1 className="font-extrabold text-white leading-tight mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-[40px]"><span style={{ color: '#FFA019' }}>Schedule</span> Your Pickup</h1>
              <p className="text-white/85 text-sm sm:text-base md:text-lg mb-6 max-w-xl">Big machines, bigger responsibility.<br className="hidden sm:block" />Whether it's construction equipment, heavy cargo, or engineering materials - OCL handles your toughest pickups with unmatched care and reliability.</p>
              <div id="schedule-form" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl">
                  <input value={pickupPincode} onChange={(e) => setPickupPincode(e.target.value)} placeholder="Pickup Pincode" className="rounded-md bg-white text-[#1a1a1a] px-4 py-3 placeholder-[#8c8c8c] focus:outline-none focus:ring-2 focus:ring-[#FF9F0D]/50 min-h-[44px] text-base" />
                  <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="rounded-md bg-white text-[#1a1a1a] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF9F0D]/50 min-h-[44px] text-base" />
                  <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="rounded-md bg-white text-[#1a1a1a] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF9F0D]/50 min-h-[44px] text-base sm:col-span-2 lg:col-span-1" />
                </div>
                <motion.div className="mt-5" whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                  <Button className="relative overflow-hidden rounded-full px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white shadow-[0_12px_30px_rgba(255,159,13,0.35)] w-full sm:w-auto min-h-[44px]" style={{ backgroundImage: "linear-gradient(135deg, #FF9F0D 0%, #A64B2A 100%)" }}>
                    Schedule Pickup
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        

        {/* Why Choose OCL Pickup - Interactive 3D Cards with Silhouette BG */}
        <section ref={whyRef} className="pt-10 pb-12 md:pb-16 relative why-section bg-white">
          {/* clean background (removed silhouette image) */}
          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: [0.19,1,0.22,1] }}
              className="text-center mb-2"
            >
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.19,1,0.22,1], delay: 0.3 }}
                className="font-bold text-foreground mb-3 text-2xl sm:text-3xl md:text-4xl lg:text-[40px]"
              >
                Why Choose <span style={{ color: '#FFA019' }}>OCL</span> Pickup
              </motion.h2>
            </motion.div>
            {/* Synced 2-column carousel */}
            <WhyCarousel features={features} />
          </div>
        </section>

        {/* Core Services - Mirrored cinematic carousel */}
        <section className="relative min-h-[320px] w-full overflow-x-hidden" style={{ background: "linear-gradient(180deg, #FE9F19 0%, #FAD7A1 30%, #F3E0D5 65%, #FFFFFF 100%)" }}>
          <div className="container mx-auto px-4 w-full py-6 relative">
            <CoreServicesCarousel />
          </div>
        </section>

        {/* How OCL Handles Your Pickup - Cinematic Timeline */}
        <div className="consignments-transparent-wrapper" style={{ background: 'transparent', backgroundColor: 'transparent' }}>
          <section className="py-16 relative consignments-section">
            <div className="container mx-auto px-4 relative section-wrapper">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="font-bold text-foreground mb-3 text-xl sm:text-2xl md:text-3xl lg:text-[40px] px-4">!!! How <span style={{ color: '#FFA019' }}>OCL Handles</span> Your Consignments !!!</h2>
              </motion.div>

                <div className="max-w-5xl mx-auto relative section-container">
                {/* connecting line */}
                <div
                  aria-hidden
                  className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full shadow-[0_6px_24px_rgba(0,0,0,0.04)] z-0"
                  style={{ background: "#FE9F19" }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10 items-stretch section-row px-4 sm:px-0">
                  {steps.map((s, idx) => (
                    <motion.div
                      key={s.step}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.15 * idx, ease: [0.19, 1, 0.22, 1] }}
                      className="relative text-center flex flex-col h-full"
                    >
                      <div className="mx-auto mb-3 flex items-center justify-center">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-white font-semibold text-sm sm:text-base" style={{ background: "#FE9F19" }}>
                          {s.step}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white p-3 sm:p-4 flex-1 flex flex-col" style={{ boxShadow: "rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px" }}>
                        <h3 className="font-semibold text-[#1a1a1a] mb-1 text-sm sm:text-base">{s.title}</h3>
                        <p className="text-xs sm:text-sm text-[#6b6b6b] flex-1">{s.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
        
        {/* Ready to Ship? CTA */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-3xl" style={{ backgroundColor: '#000000' }}>
              <div className="relative z-10 px-6 md:px-12 py-8 text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="font-bold text-white mb-3 text-xl sm:text-2xl md:text-3xl lg:text-[40px]"
                >
                  Ready to Ship with <span style={{ color: '#FFA019' }}>OCL</span>?
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 px-4"
                  style={{ color: "#E0E0E0" }}
                >
                  Experience secure, on-time, and professional logistics — powered by OCL's trusted network.
                </motion.p>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4">
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.19,1,0.22,1] }} className="w-full sm:w-auto">
                  <Button
                    className="rounded-full text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-[0_12px_30px_rgba(254,159,25,0.25)] w-full sm:w-auto min-h-[44px]"
                    style={{ background: "#FE9F19" }}
                      onClick={() => {
                        const el = document.getElementById('schedule-form');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      Schedule a Pickup
                    </Button>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.19,1,0.22,1], delay: 0.2 }} className="w-full sm:w-auto">
                    <a href="/track" className="block w-full sm:w-auto">
                      <Button
                        className="rounded-full px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-white text-[#0C1B33] hover:bg-[#FE9F19] hover:text-white border-0 w-full sm:w-auto min-h-[44px]"
                      >
                        Track Shipment
                      </Button>
                    </a>
                  </motion.div>
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

export default SchedulePickup;

// Local component: WhyCarousel
const WhyCarousel: React.FC<{ features: { icon: React.ReactNode; title: string; description: string }[] }> = ({ features }) => {
  const cards = [
    { title: "Flexible Scheduling", description: "Schedule pickups at your convenience — same day or advance booking", color: "bg-blue-100" },
    { title: "Real-time Tracking", description: "Track your pickup agent with live GPS updates", color: "bg-orange-100" },
    { title: "Doorstep Pickup", description: "Our agents collect packages right from your location", color: "bg-green-100" },
    { title: "Instant Confirmation", description: "Get immediate booking confirmation with details", color: "bg-purple-100" }
  ];

  return (
    <div className="w-full sm:w-11/12 mx-auto mt-6 sm:mt-8 md:mt-10 px-4 sm:px-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className={`${card.color} rounded-2xl p-4 sm:p-6 text-gray-800 text-center`}
            style={{ boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px" }}
          >
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{card.title}</h3>
            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{card.description}</p>
              </motion.div>
        ))}
      </div>
    </div>
  );
};

// Local component: CoreServicesCarousel
const CoreServicesCarousel: React.FC = () => {
  const images = [
    { src: schedule1, alt: "Schedule service 1" },
    { src: schedule2, alt: "Schedule service 2" },
    { src: schedule3, alt: "Schedule service 3" },
    { src: schedule4, alt: "Schedule service 4" }
  ];

  return (
    <div className="w-11/12 mx-auto">
      {/* Title - Centered */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.19,1,0.22,1] }}
        className="text-center mb-4 md:mb-5"
      >
        <h2 className="font-bold text-foreground mb-1 text-xl sm:text-2xl md:text-3xl lg:text-[40px] px-4">Some of <span style={{ color: '#FFFFFF' }}>OCL</span> Services</h2>
      </motion.div>

      {/* 2x2 Grid of Images with gap in between */}
      <div className="space-y-4 md:space-y-5 max-w-5xl mx-auto px-4 sm:px-0">
        {/* Row 1 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 md:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex-shrink-0 flex items-center gap-3 w-full sm:w-auto"
          >
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-lg flex-shrink-0"
              style={{
                boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
              }}
            >
              <img
                src={images[0].src}
                alt={images[0].alt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" style={{ color: '#FE9F19' }} />
              <span className="text-xs sm:text-sm md:text-base font-semibold" style={{ color: '#0D1B2A' }}>
                Backhoe Boom
              </span>
            </div>
          </motion.div>
          <div className="hidden sm:block flex-1"></div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex-shrink-0 flex items-center gap-3 w-full sm:w-auto flex-row-reverse sm:flex-row"
          >
            <div className="flex items-center gap-2 sm:flex-row-reverse">
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rotate-180 sm:rotate-0 flex-shrink-0" style={{ color: '#FE9F19' }} />
              <span className="text-xs sm:text-sm md:text-base font-semibold" style={{ color: '#0D1B2A' }}>
                Operator Cabin
              </span>
            </div>
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-lg flex-shrink-0"
              style={{
                boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
              }}
            >
              <img
                src={images[1].src}
                alt={images[1].alt}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>

        {/* Center Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center px-4 py-3 md:py-4"
        >
          <div className="text-center max-w-4xl mx-auto space-y-3">
            <p
              className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold leading-relaxed"
              style={{
                color: '#0D1B2A',
                fontFamily: "'Value Serif Pro Bold', serif",
                lineHeight: '1.6'
              }}
            >
              From backhoe booms to hydraulic cylinders and many more, we specialize in moving every type of machinery part with precision and care.
            </p>
            <p
              className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold leading-relaxed"
              style={{
                color: '#0D1B2A',
                fontFamily: "'Value Serif Pro Bold', serif",
                lineHeight: '1.6'
              }}
            >
              Large, oversized, or fragile - we handle each component with the right equipment and the right expertise.
            </p>
            <p
              className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold leading-relaxed"
              style={{
                color: '#0D1B2A',
                fontFamily: "'Value Serif Pro Bold', serif",
                lineHeight: '1.6'
              }}
            >
              Your machinery deserves dependable logistics, and we deliver it on time, every single time.
            </p>
          </div>
        </motion.div>

        {/* Row 2 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 md:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-shrink-0 flex items-center gap-3 w-full sm:w-auto"
          >
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-lg flex-shrink-0"
              style={{
                boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
              }}
            >
              <img
                src={images[2].src}
                alt={images[2].alt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" style={{ color: '#FE9F19' }} />
              <span className="text-xs sm:text-sm md:text-base font-semibold" style={{ color: '#0D1B2A' }}>
                Loader Bucket
              </span>
            </div>
          </motion.div>
          <div className="hidden sm:block flex-1"></div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-shrink-0 flex items-center gap-3 w-full sm:w-auto flex-row-reverse sm:flex-row"
          >
            <div className="flex items-center gap-2 sm:flex-row-reverse">
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rotate-180 sm:rotate-0 flex-shrink-0" style={{ color: '#FE9F19' }} />
              <span className="text-xs sm:text-sm md:text-base font-semibold" style={{ color: '#0D1B2A' }}>
                Hydraulic Cylinder
              </span>
            </div>
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-lg flex-shrink-0"
              style={{
                boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
              }}
            >
              <img
                src={images[3].src}
                alt={images[3].alt}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};