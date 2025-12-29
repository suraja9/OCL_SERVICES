import React, { useEffect, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import journeyBg from "@/assets/journey.png";

type StatBoxProps = {
  value: string;
  label: string;
  delay?: number;
};

function StatBox({ value, label, delay = 0 }: StatBoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const prefersReducedMotion = useReducedMotion();

  // Extract number from value (e.g., "22+" -> 22, "50k+" -> 50)
  const numValue = parseInt(value.replace(/[^0-9]/g, "")) || 0;
  const suffix = value.replace(/[0-9]/g, "");

  return (
    <motion.div
      ref={ref}
      className="bg-white rounded-lg border border-gray-100 p-2 md:p-4 flex flex-col justify-center items-center text-center"
      style={{
        boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div 
        className="text-base md:text-2xl lg:text-3xl font-bold mb-1 md:mb-1.5 gradient-number"
        style={{
          background: 'linear-gradient(90deg, #ff6a00, #0078ff, #8e2de2)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {isInView && !prefersReducedMotion ? (
          <CountUpNumber end={numValue} suffix={suffix} duration={2} />
        ) : (
          value
        )}
      </div>
      <div className="text-[10px] md:text-sm text-gray-600 leading-tight px-1">{label}</div>
    </motion.div>
  );
}

function CountUpNumber({ end, suffix, duration }: { end: number; suffix: string; duration: number }) {
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <>{count}{suffix}</>;
}

type AtlasHeroProps = {
  image: string;
  imageAlt?: string;
};

export function AtlasHero({ image, imageAlt = "OCL Logistics Operations" }: AtlasHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Gradient animation styles */}
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        .gradient-number {
          animation: gradientMove 3s linear infinite;
        }

        @media (min-width: 768px) {
          .hero-bg-blur {
            filter: blur(2px);
            -webkit-filter: blur(2px);
          }
          .hero-image-card-shadow {
            box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;
          }
        }
      `}</style>
    <section 
      ref={heroRef}
      className="relative w-full pt-[100px] md:pt-[240px] pb-8 md:pb-20 overflow-hidden"
    >
      {/* Background Image Layer - Clean and visible */}
      <div
        className="absolute inset-0 hero-bg-blur"
        style={{
          backgroundImage: `url(${journeyBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 1,
        }}
      />

      {/* Content Container - Above overlay */}
      <div className="relative max-w-7xl mx-auto px-5 md:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-24 items-center">
          {/* Left Column */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-[30px] md:text-[48px] font-bold text-black mb-4 md:mb-6 leading-tight text-center md:text-left">
              <span className="text-[#FFA019]">Our</span> Journey<br className="md:hidden" />
              <span className="md:hidden"> in Logistics</span>
              <span className="hidden md:inline"> in Logistics</span>
            </h1>

            <p className="hidden md:block text-lg md:text-xl text-black mb-12 leading-relaxed max-w-xl">
              From a local courier service to a nationwide logistics network, OCL Services has been delivering trust, reliability, and precision for over two decades.
            </p>

            {/* Stats Grid - Single Row */}
            <div className="grid grid-cols-3 gap-2 md:gap-5 max-w-2xl mx-auto md:mx-0">
              <StatBox value="25+" label="Years in operation" delay={0.1} />
              <StatBox value="75+" label="Cities Covered" delay={0.2} />
              <StatBox value="50k+" label="Shipments delivered" delay={0.3} />
            </div>
          </motion.div>

          {/* Right Column - Glassmorphism Window Card */}
          <motion.div
            ref={cardRef}
            className="hidden lg:block relative rounded-[24px] overflow-hidden mt-8 h-[260px] md:h-[280px] w-full max-w-[90%] mx-auto lg:max-w-[85%] hero-image-card-shadow"
            style={{
              zIndex: 5,
            }}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.3, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.3 }
            }}
          >
            {/* White Glassmorphism Frame - No blur to keep image clear */}
            <div
              className="absolute inset-0 rounded-[24px]"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                zIndex: 2,
              }}
            />

            {/* Full Independent Image - No Background Clipping */}
            <img
              src={journeyBg}
              alt={imageAlt}
              className="absolute inset-0 w-full h-full object-cover rounded-[24px]"
              style={{
                filter: 'none',
                WebkitFilter: 'none',
                zIndex: 1,
              }}
            />
            
            {/* Subtle inner border for definition */}
            <div 
              className="absolute inset-0 rounded-[24px] pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.4)',
                zIndex: 3,
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
    </>
  );
}

export default AtlasHero;
