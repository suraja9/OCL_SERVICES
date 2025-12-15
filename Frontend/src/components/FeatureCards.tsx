import { motion } from "framer-motion";
import { Package, Truck, MapPin } from "lucide-react";
import trackTraceIcon from "@/assets/track-trace-icon.jpg";
import scheduleIcon from "@/assets/schedule.png";
import home2Image from "@/assets/home-2.png";

const features = [
  {
    id: 1,
    title: "Track & Trace",
    description: "Real-time package tracking with detailed status updates and delivery notifications across all delivery networks",
    image: trackTraceIcon,
    link: "/track"
  },
  {
    id: 3,
    title: "Schedule Pickup",
    description: "Book doorstep pickup services with flexible timing, instant confirmation, and real-time tracking support",
    image: scheduleIcon,
    link: "/schedule-pickup"
  }
];

const FeatureCards = () => {
  return (
    <>
    <section 
      className="relative overflow-hidden py-12 md:py-16" 
      style={{ 
        background: "repeating-linear-gradient(135deg, #fafafa 0px, #fafafa 2px, #f7f7f7 2px, #f7f7f7 4px)"
      }}
    >
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10"
        >
          <Package className="w-16 h-16 text-gray-600" />
        </motion.div>
        <motion.div
          animate={{
            y: [0, 15, 0],
            x: [0, -10, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-40 right-20"
        >
          <Truck className="w-20 h-20 text-gray-600" />
        </motion.div>
        <motion.div
          animate={{
            y: [0, -10, 0],
            x: [0, 15, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-40 left-1/4"
        >
          <MapPin className="w-14 h-14 text-gray-600" />
        </motion.div>
      </div>

      <div className="ocl-container relative z-10">
        {/* Heading and Subheading */}
        <div className="text-center mb-12 md:mb-16">
                 <motion.h2
                   initial={{ opacity: 0, y: -20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                   className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 uppercase"
                   style={{ color: '#0D1C48', fontFamily: 'Poppins, ui-sans-serif' }}
                 >
                   Our Core Services
                 </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto text-sm md:text-base text-gray-600 font-normal"
          >
            Reliable solutions designed to simplify every step of your shipping journey.
          </motion.p>
        </div>

        {/* Zig-Zag Service Rows */}
        <div className="space-y-12 md:space-y-16 max-w-6xl mx-auto relative">
          {/* Stepped Connector Line - Professional Flow Diagram Style */}
          <div className="hidden md:block absolute left-0 right-0 top-0 bottom-0 pointer-events-none z-0">
            <svg
              className="w-full h-full"
              viewBox="0 0 1200 600"
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
            >
              {/* Glow filter for animated dot */}
              <defs>
                <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                  <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
                  <feFlood floodColor="#FF9F00" floodOpacity="0.6" result="glowColor" />
                  <feComposite in="glowColor" in2="offsetBlur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Stepped path with 90° angles - Symmetric and precise:
                  1. Start: right edge of first image, BETWEEN title and description (y=185)
                  2. Move horizontally right, extending to end of description paragraph (x=920)
                  3. 90° downward turn to button level
                  4. 90° left turn, moving left (symmetric distance)
                  5. 90° downward turn to BETWEEN title and description of second row (y=450)
                  6. 90° right turn, moving to center-left edge of second image - y=475 */}
              <motion.path
                id="connectorPath"
                d="M 480 185 
                   L 920 185
                   L 920 290
                   L 300 290
                   L 300 450
                   L 720 450
                   L 720 475"
                fill="none"
                stroke="#FF9F00"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              
              {/* Animated dot moving along the path */}
              <circle r="5" fill="#FF9F00" filter="url(#dotGlow)">
                <animateMotion
                  dur="4s"
                  repeatCount="indefinite"
                  path="M 480 185 L 920 185 L 920 290 L 300 290 L 300 450 L 720 450 L 720 475"
                />
              </circle>
            </svg>
          </div>

          {/* Mobile: Simple vertical connector */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 top-0 bottom-0 pointer-events-none z-0" style={{ width: '2px' }}>
            <svg
              className="w-full h-full"
              viewBox="0 0 10 600"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="mobileDotGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                  <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
                  <feFlood floodColor="#FF9F00" floodOpacity="0.5" result="glowColor" />
                  <feComposite in="glowColor" in2="offsetBlur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <motion.path
                d="M 5 200 L 5 400"
                fill="none"
                stroke="#FF9F00"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
              {/* Animated dot for mobile */}
              <circle r="4" fill="#FF9F00" filter="url(#mobileDotGlow)">
                <animateMotion
                  dur="4s"
                  repeatCount="indefinite"
                  path="M 5 200 L 5 400"
                />
              </circle>
            </svg>
          </div>

          {features.map((feature, index) => {
            const isEven = index % 2 === 1; // Row 2 (Schedule Pickup)
            
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: isEven ? 100 : -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-6 md:gap-8 relative z-10`}
              >
                {/* Image + Button Half */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center space-y-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full group"
                  >
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="w-full h-[200px] md:h-[250px] rounded-lg object-cover transition-all duration-500 group-hover:scale-105" 
                      style={{
                        boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
                      }}
                    />
            </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <button
                      className="button-86"
                      onClick={() => (window.location.href = feature.link)}
                    >
                      Learn More
                    </button>
                  </motion.div>
                </div>

                {/* Text Half */}
                <div className={`w-full md:w-1/2 flex flex-col justify-center ${isEven ? 'md:text-right md:items-end' : 'md:text-left md:items-start'} text-center md:text-left`}>
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-2xl md:text-3xl font-bold mb-4"
                    style={{ color: '#0D1C48', fontFamily: 'Poppins, ui-sans-serif' }}
                  >
                    {feature.title}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="text-sm md:text-base text-[#4C5C6B] leading-relaxed"
                    style={{ lineHeight: '1.7' }}
                  >
                    {feature.description}
                  </motion.p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Curved Transition at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            d="M0,0 C300,100 600,50 900,80 T1200,0 L1200,120 L0,120 Z"
            fill="#F9FBFF"
          />
        </svg>
      </div>
    </section>

    {/* Need Help Choosing Card - Separate Section */}
    <section className="relative py-12 md:py-16" style={{ backgroundColor: '#F9FBFF' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto"
      >
          <div 
            className="rounded-2xl border border-blue-100 overflow-hidden relative"
            style={{
              boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
            }}
          >
            {/* Background Image */}
            <img
              src={home2Image}
              alt="OCL Services"
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/40" />
            
            {/* Content */}
            <div className="relative z-10 p-8 md:p-10">
              <div className="flex flex-col items-center text-center">
                <h3 
                  className="text-xl md:text-2xl font-semibold mb-3 text-white drop-shadow-lg"
                  style={{ fontFamily: 'Poppins, ui-sans-serif' }}
                >
                  Need Help Choosing the Right Service?
                </h3>
                <p className="text-white/90 text-base md:text-lg mb-6 drop-shadow-md max-w-2xl">
                  Not sure which service suits your business best? Our experts are ready to guide you.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => (window.location.href = '/contact')}
                    className="button-86"
                    role="button"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
    </section>

    {/* Button-86 Styles */}
    <style>{`
        .button-86 {
          all: unset;
          width: auto;
          min-width: 120px;
          height: auto;
          font-size: 16px;
          background: transparent;
          border: none;
          position: relative;
          color: #ffffff;
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
          font-weight: 600;
        }

        .button-86:hover {
          color: #0D1C48;
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
          background: #0D1C48;
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

        .button-86:hover {
          color: #ffffff;
        }

        .button-86:hover::before {
          transform: translate(5%, 20%);
          width: 110%;
          height: 110%;
          background: #FF9F00;
        }

        .button-86:hover::after {
          border-radius: 10px;
          transform: translate(0, 0);
          width: 100%;
          height: 100%;
          background: #FF9F00;
        }

        .button-86:active::after {
          transition: 0s;
          transform: translate(0, 5%);
        }
      `}</style>
    </>
  );
};

export default FeatureCards;