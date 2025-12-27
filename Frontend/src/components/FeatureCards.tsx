import { motion } from "framer-motion";
import { Package, Truck, MapPin } from "lucide-react";
import trackTraceIcon from "@/assets/track-trace-icon.png";
import scheduleIcon from "@/assets/schedule.png";

const features = [
  {
    id: 1,
    title: "Track & Trace",
    description:
      "Real-time package tracking with detailed status updates and delivery notifications across all delivery networks",
    image: trackTraceIcon,
    link: "/track",
  },
  {
    id: 3,
    title: "Schedule Pickup",
    description:
      "Book doorstep pickup services with flexible timing, instant confirmation, and real-time tracking support",
    image: scheduleIcon,
    link: "/schedule-pickup",
  },
];

const FeatureCards = () => {
  return (
    <>
    <section 
      className="relative overflow-hidden py-12 md:py-16 core-services-section"
    >
      <div className="ocl-container relative z-10">
        {/* Heading and Subheading */}
        <div className="text-center mb-12 md:mb-16">
                 <motion.h2
                   initial={{ opacity: 0, y: -20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 uppercase core-services-heading"
                  style={{ fontFamily: 'Poppins, ui-sans-serif' }}
                >
                  <span className="core-services-heading-span-1">Our Core </span><span className="core-services-heading-span-2">Services</span>
                 </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden md:block max-w-2xl mx-auto text-sm md:text-base font-normal tagline-text-desktop"
          >
            <span className="tagline-text-desktop">Reliable solutions designed to simplify every step of your shipping journey.</span>
          </motion.p>
        </div>

        {/* Track & Trace - Core Services main card */}
        <div className="max-w-6xl mx-auto mb-8 md:mb-12">
              <motion.div
            initial={{ opacity: 0, x: -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row items-center gap-6 md:gap-8"
              >
                {/* Heading - Mobile only, above image */}
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="md:hidden text-xl font-bold mb-4 text-center track-trace-heading-mobile"
                  style={{ fontFamily: "Poppins, ui-sans-serif", fontWeight: 700 }}
                >
                  {features[0].title}
                </motion.h3>

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
                      src={features[0].image}
                      alt={features[0].title}
                      className="w-full h-[160px] md:h-[200px] rounded-lg object-cover transition-all duration-500 group-hover:scale-105" 
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
                  onClick={() => (window.location.href = features[0].link)}
                    >
                      Learn More
                    </button>
                  </motion.div>
                </div>

                {/* Text Half - Desktop layout, mobile description only */}
            <div className="w-full md:w-1/2 flex flex-col justify-center md:text-left md:items-start text-center md:min-h-[250px]">
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="hidden md:block text-xl md:text-2xl font-bold mb-4 text-white md:text-black"
                    style={{ fontFamily: "Poppins, ui-sans-serif", fontWeight: 700 }}
                  >
                    {features[0].title}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="text-sm md:text-base leading-relaxed text-white md:text-gray-800"
                    style={{ lineHeight: '1.7', fontWeight: 500 }}
                  >
                    {features[0].description}
                  </motion.p>
                </div>
              </motion.div>
        </div>
      </div>

    </section>

    {/* Section and Button Styles */}
    <style>{`
        .core-services-section {
          background-color: #FFFFFF;
        }
        
        @media (max-width: 767px) {
          .core-services-heading,
          .core-services-heading-span-1,
          .core-services-heading-span-2,
          .core-services-section h3,
          .core-services-section p,
          .track-trace-heading-mobile {
            color: #000000 !important;
          }
        }
        
        @media (min-width: 768px) {
          .core-services-section {
            background-color: #FFFFFF;
          }
          .core-services-heading,
          .core-services-heading-span-1,
          .core-services-heading-span-2,
          .core-services-section h3,
          .core-services-section p,
          .tagline-text-desktop {
            color: #000000 !important;
          }
        }

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