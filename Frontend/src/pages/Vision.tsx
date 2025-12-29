import { motion } from "framer-motion";
import { CheckCircle2, Target, TrendingUp, Shield, Users, Leaf, Eye, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import vmImg from "@/assets/v&m.png";
import courierTeamImg from "@/assets/courier-team.jpg";
import trackingTechImg from "@/assets/tracking-tech.jpg";
import shippingNetworkImg from "@/assets/shipping-network.jpg";
import missionImg from "@/assets/mission.png";
import visionImg from "@/assets/vision.png";
import about1Img from "@/assets/about-1.png";
import about2Img from "@/assets/about-2.png";
import about3Img from "@/assets/about-3.png";
import coreImg from "@/assets/core.png";

const Vision = () => {
  // Mission section data
  const missionPoints = [
    {
      icon: CheckCircle2,
      title: "Accuracy and Consistency",
      description: "Deliver every shipment with accuracy and consistency."
    },
    {
      icon: Target,
      title: "Technology-Driven Transparency",
      description: "Use technology to improve transparency."
    },
    {
      icon: Shield,
      title: "Reliable End-to-End Logistics",
      description: "Support businesses with reliable end-to-end logistics."
    }
  ];

  // Vision section data
  const visionPoints = [
    {
      icon: Users,
      title: "Trusted Partnerships",
      description: "Build trusted, long-term logistics partnerships."
    },
    {
      icon: TrendingUp,
      title: "Clear Processes",
      description: "Use clear processes and responsible growth."
    },
    {
      icon: Leaf,
      title: "Sustainable Supply Chains",
      description: "Enable sustainable supply chains across India."
    }
  ];

  // Image collage images - 3 images per section
  const missionImages = [
    missionImg,
    trackingTechImg,
    shippingNetworkImg
  ];

  const visionImages = [
    visionImg,
    about1Img,
    about2Img
  ];

  // Decorative Divider Component with Teal Diamonds
  const DecorativeDivider = () => (
    <div className="relative flex items-center justify-center w-40 my-4">
      <div className="absolute w-full h-px bg-gray-300"></div>
      <div className="relative flex items-center gap-2 bg-white px-4">
        <div className="w-2 h-2 rotate-45 bg-teal-500"></div>
        <div className="w-2.5 h-2.5 rotate-45 bg-teal-600"></div>
        <div className="w-2 h-2 rotate-45 bg-teal-500"></div>
      </div>
    </div>
  );

  // Single Large Diamond Box Component - matches total height of all text items
  const SingleDiamondBox = ({ image }: { image: string }) => {
    const [totalHeight, setTotalHeight] = useState<number>(400);

    useEffect(() => {
      // Measure the total height of all three text blocks
      const measureHeight = () => {
        const textContainer = document.querySelector('[data-text-container]');
        if (textContainer) {
          const height = (textContainer as HTMLElement).offsetHeight;
          if (height > 0) {
            setTotalHeight(height);
          }
        }
      };

      // Measure after a short delay to ensure DOM is ready
      const timer = setTimeout(measureHeight, 200);
      const imageTimer = setTimeout(measureHeight, 500);
      window.addEventListener('resize', measureHeight);

      return () => {
        clearTimeout(timer);
        clearTimeout(imageTimer);
        window.removeEventListener('resize', measureHeight);
      };
    }, []);

    // Calculate width to maintain diamond aspect ratio (square)
    const boxSize = Math.min(totalHeight, 300);

  return (
      <div
        className="flex-shrink-0 transition-transform duration-300 hover:scale-110"
        style={{
          filter: "drop-shadow(rgba(0, 0, 0, 0.19) 0px 10px 20px) drop-shadow(rgba(0, 0, 0, 0.23) 0px 6px 6px)"
        }}
      >
        <motion.div
          className="overflow-hidden"
          style={{
            width: `${boxSize}px`,
            height: `${totalHeight}px`,
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            transform: "rotate(15deg)"
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover"
            style={{ transform: "rotate(-15deg) scale(1.4)" }}
          />
        </motion.div>
      </div>
    );
  };

  // Section Component (reusable for both Mission and Vision)
  const SectionLayout = ({
    title,
    points,
    images,
    reverse = false,
    showDividers = true,
    backgroundColor = "bg-white"
  }: {
    title: string;
    points: Array<{ icon: any; title: string; description: string }>;
    images: string[];
    reverse?: boolean;
    showDividers?: boolean;
    backgroundColor?: string;
  }) => (
    <section className={`w-full ${backgroundColor} py-6 md:py-8`}>
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Centered Title at Top */}
        <motion.div 
          className="w-full mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        >
          {/* Decorative divider above title */}
          {showDividers && <div className="flex justify-center mb-3"><DecorativeDivider /></div>}

          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3 relative inline-block">
              {title.startsWith("Our ") ? (
                <>
                  <span style={{ color: "#FFA019" }}>Our</span> {title.substring(4)}
                </>
              ) : (
                title
              )}
              <span 
                className="absolute bottom-0 left-0 right-0 block"
                style={{
                  background: "linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.1) 10%, rgba(0, 0, 0, 0.3) 20%, rgba(0, 0, 0, 0.5) 30%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0.9) 50%, rgba(0, 0, 0, 0.7) 60%, rgba(0, 0, 0, 0.5) 70%, rgba(0, 0, 0, 0.3) 80%, rgba(0, 0, 0, 0.1) 90%, transparent 100%)",
                  height: "3px",
                  transform: "translateY(8px)",
                  borderRadius: "2px"
                }}
              ></span>
            </h2>
          </div>

          {/* Decorative divider below title */}
          {showDividers && <div className="flex justify-center mt-3"><DecorativeDivider /></div>}
        </motion.div>

        {/* Two Column Layout Below Title */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4 items-start">
            {/* Left Column - Text Items */}
          <motion.div
              className={`${reverse ? "lg:order-2" : "lg:order-1"} ${reverse ? "lg:ml-4" : "lg:mr-4"}`}
              initial={{ opacity: 0, x: reverse ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            >
              <div className="space-y-6" data-text-container>
              {points.map((point, index) => {
                const IconComponent = point.icon;
                return (
                  <motion.div
                    key={index}
                    data-text-block
                    className={`flex items-start gap-5 ${index === 0 || index === 2 ? 'ml-12 md:ml-20 lg:ml-24' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    {/* Small diamond-shaped icon container */}
                    <div 
                      className="flex-shrink-0 relative"
                      style={{
                        filter: "drop-shadow(rgba(0, 0, 0, 0.16) 0px 3px 6px) drop-shadow(rgba(0, 0, 0, 0.23) 0px 3px 6px)"
                      }}
                    >
                      <div 
                        className="w-12 h-12 flex items-center justify-center relative"
                        style={{
                          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                          transform: "rotate(15deg)",
                          borderRadius: "6px",
                          backgroundColor: "#ffffff",
                          border: "3px solid #FFA02B"
                        }}
                      >
                        {/* Corner decorations */}
                        <div 
                          className="absolute top-0 left-0 w-2 h-2"
                          style={{
                            backgroundColor: "#FFA02B",
                            clipPath: "polygon(0% 0%, 100% 0%, 0% 100%)"
                          }}
                        ></div>
                        <div 
                          className="absolute top-0 right-0 w-2 h-2"
                          style={{
                            backgroundColor: "#FFA02B",
                            clipPath: "polygon(100% 0%, 100% 100%, 0% 0%)"
                          }}
                        ></div>
                        <div 
                          className="absolute bottom-0 left-0 w-2 h-2"
                          style={{
                            backgroundColor: "#FFA02B",
                            clipPath: "polygon(0% 0%, 0% 100%, 100% 100%)"
                          }}
                        ></div>
                        <div 
                          className="absolute bottom-0 right-0 w-2 h-2"
                          style={{
                            backgroundColor: "#FFA02B",
                            clipPath: "polygon(100% 0%, 100% 100%, 0% 100%)"
                          }}
                        ></div>
                        
                        <div style={{ transform: "rotate(-15deg)" }}>
                          <IconComponent className="w-5 h-5 text-gray-900" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm md:text-xl lg:text-2xl font-bold text-gray-900 mb-1.5">
                        {point.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-xs md:text-base lg:text-lg">
                        {point.description}
                    </p>
                  </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

            {/* Right Column - Single Large Diamond Box */}
          <motion.div
              className={`hidden md:flex ${reverse ? "lg:order-1" : "lg:order-2"} items-start ${reverse ? "justify-start lg:mr-4" : "justify-end lg:ml-4"}`}
              initial={{ opacity: 0, x: reverse ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
            >
              <SingleDiamondBox image={images[0]} />
            </motion.div>
                  </div>
                </div>
              </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Title Block */}
      <motion.section
        className="relative w-full h-[45vh] md:h-[80vh] flex items-center justify-center overflow-hidden vision-hero-section"
        style={{
          backgroundImage: `url(${vmImg})`,
          backgroundRepeat: "no-repeat"
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30 z-0"></div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-[800px] mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6">
            Vision & Mission
          </h1>
          <p className="text-white leading-relaxed text-base md:text-lg lg:text-xl">
            Shaping the future of logistics through discipline, innovation, and unwavering commitment to excellence.
          </p>
        </div>
      </motion.section>

      {/* Section 1: Our Mission */}
      <SectionLayout
        title="Our Mission"
        points={missionPoints}
        images={missionImages}
        reverse={false}
        showDividers={false}
      />

      {/* Section 2: Our Vision */}
      <SectionLayout
        title="Our Vision"
        points={visionPoints}
        images={visionImages}
        reverse={true}
        showDividers={false}
        backgroundColor="bg-[#F9FAFB]"
      />

      {/* Section 3 - Core Values */}
      <section 
        className="pt-6 pb-10 md:pt-12 md:pb-20 bg-black"
        style={{
          backgroundImage: `url(${coreImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        >
          <div className="text-center mb-6 md:mb-12 max-w-screen-xl mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3 md:mb-4">
              <span style={{ color: "#FFA019" }}>Our</span> Core Values
            </h2>
            
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 lg:gap-8 max-w-screen-xl mx-auto px-4 md:px-6">
            {/* Value 1 - Reliability */}
            <div 
              className="px-3 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 text-center rounded-xl"
              style={{
                backgroundColor: "#EFF6FF",
                boxShadow: "rgba(255, 255, 255, 0.3) 4px 4px 8px, rgba(255, 255, 255, 0.2) 2px 2px 4px"
              }}
            >
              <h3 className="text-lg md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-2 md:mb-4">
                Reliability
              </h3>
              <p className="text-xs md:text-base text-gray-700 leading-relaxed">
                We work with clarity, discipline, and predictable processes.
              </p>
            </div>
                    
            {/* Value 2 - Responsibility */}
            <div 
              className="px-3 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 text-center rounded-xl"
              style={{
                backgroundColor: "#F0FDFA",
                boxShadow: "rgba(255, 255, 255, 0.3) 4px 4px 8px, rgba(255, 255, 255, 0.2) 2px 2px 4px"
              }}
            >
              <h3 className="text-lg md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-2 md:mb-4">
                Responsibility
              </h3>
              <p className="text-xs md:text-base text-gray-700 leading-relaxed">
                We treat every client's shipment like an obligation, not a task.
              </p>
            </div>

            {/* Value 3 - Innovation */}
            <div 
              className="col-span-2 md:col-span-1 innovation-card-mobile px-3 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 text-center rounded-xl mx-auto md:mx-0"
              style={{
                backgroundColor: "#FFF7ED",
                boxShadow: "rgba(255, 255, 255, 0.3) 4px 4px 8px, rgba(255, 255, 255, 0.2) 2px 2px 4px"
              }}
            >
              <h3 className="text-lg md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-2 md:mb-4">
                Innovation
              </h3>
              <p className="text-xs md:text-base text-gray-700 leading-relaxed">
                Technology enhances every part of our logistics workflow.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section 4 - Commitment Statement */}
      <section className="pt-6 pb-10 md:pt-12 md:pb-20" style={{ backgroundColor: "#F9FAFB" }}>
        <motion.div
          className="max-w-[850px] mx-auto text-center px-4 md:px-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6 md:mb-8">
            <span style={{ color: "#FFA019" }}>Our</span> Commitment
              </h2>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-16">
            <div className="text-center border-r border-gray-300 pr-4 md:pr-8">
              <div className="text-2xl md:text-4xl lg:text-5xl font-semibold mb-2 gradient-number">
                99.9%
              </div>
              <div className="text-gray-700 text-xs md:text-sm lg:text-base">
                On-Time Delivery
              </div>
            </div>

            <div className="text-center border-r border-gray-300 pr-4 md:pr-8">
              <div className="text-2xl md:text-4xl lg:text-5xl font-semibold mb-2 gradient-number">
                24/7
              </div>
              <div className="text-gray-700 text-xs md:text-sm lg:text-base">
                Customer Support
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl md:text-4xl lg:text-5xl font-semibold mb-2 gradient-number">
                100%
              </div>
              <div className="text-gray-700 text-xs md:text-sm lg:text-base">
                Shipment Tracking
              </div>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed text-base md:text-lg">
            Every shipment we handle represents trust. Our responsibility is to deliver consistently - with accuracy, transparency, and complete support from start to finish.
          </p>

          {/* Gradient animation styles */}
          <style>{`
            @keyframes gradientMove {
              0% { background-position: 0% 50%; }
              100% { background-position: 100% 50%; }
            }

            .gradient-number {
              background: linear-gradient(90deg, #ff6a00, #0078ff, #8e2de2);
              background-size: 200% auto;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              color: transparent;
              animation: gradientMove 3s linear infinite;
            }
          `}</style>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Vision;
