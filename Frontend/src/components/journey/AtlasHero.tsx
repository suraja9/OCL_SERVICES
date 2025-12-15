import React, { useEffect, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

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
      className="bg-white rounded-lg border border-gray-100 p-4 flex flex-col justify-center"
      style={{
        boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-2xl md:text-3xl font-bold text-blue-900 mb-1.5">
        {isInView && !prefersReducedMotion ? (
          <CountUpNumber end={numValue} suffix={suffix} duration={2} />
        ) : (
          value
        )}
      </div>
      <div className="text-sm text-gray-600 whitespace-nowrap">{label}</div>
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

  return (
    <section className="relative w-full pt-[140px] md:pt-[180px] pb-12 md:pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-24 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="inline-block px-3 py-1 bg-[#FF7A00]/10 text-[#FF7A00] text-xs font-semibold rounded-full mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Trusted logistics since 2001
            </motion.div>

            <h1 className="text-[48px] font-bold text-gray-900 mb-6 leading-tight">
              Our Journey in Logistics
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed max-w-xl">
              From a local courier service to a nationwide logistics network, OCL Services has been delivering trust, reliability, and precision for over two decades.
            </p>

            {/* Stats Grid - Single Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl">
              <StatBox value="22+" label="Years in operation" delay={0.1} />
              <StatBox value="18" label="Cities served" delay={0.2} />
              <StatBox value="50k+" label="Shipments delivered" delay={0.3} />
            </div>
          </motion.div>

          {/* Right Column - Image */}
          <motion.div
            className="relative rounded-lg overflow-hidden shadow-lg mt-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={image}
              alt={imageAlt}
              className="w-full h-[300px] md:h-[380px] object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default AtlasHero;

