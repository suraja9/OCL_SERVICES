import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type AtlasMilestone = {
  id: string;
  year: string;
  title: string;
  tag: string;
  tagColor?: string;
  description: string;
  icon?: React.ReactNode;
  metrics?: Array<{ label: string; value: string }>;
};

type AtlasTimelineProps = {
  milestones: AtlasMilestone[];
  className?: string;
};

export function AtlasTimeline({ milestones, className }: AtlasTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeYear, setActiveYear] = useState<string>(milestones[0]?.year || "");
  const [shimmerPosition, setShimmerPosition] = useState(0);

  const years = useMemo(() => Array.from(new Set(milestones.map(m => m.year))).sort(), [milestones]);

  // Shimmer animation
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const interval = setInterval(() => {
      setShimmerPosition((prev) => (prev + 2) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const activeIndex = years.findIndex((year) => year === activeYear);
  const progress = activeIndex >= 0 ? (activeIndex / (years.length - 1)) * 100 : 0;

  const handlePrevious = () => {
    const currentIndex = years.findIndex((year) => year === activeYear);
    const prevIndex = currentIndex === 0 ? years.length - 1 : currentIndex - 1;
    setActiveYear(years[prevIndex]);
  };

  const handleNext = () => {
    const currentIndex = years.findIndex((year) => year === activeYear);
    const nextIndex = (currentIndex + 1) % years.length;
    setActiveYear(years[nextIndex]);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Enhanced Background with Vignette and Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black rounded-lg overflow-hidden">
        {/* Noise Texture */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }}
        />
        {/* Vignette */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)"
          }}
        />
      </div>

      {/* Black Card Container - Only for Header and Timeline */}
      <div className="relative bg-black/60 backdrop-blur-xl rounded-lg shadow-2xl pt-4 pb-6 sm:pt-6 sm:pb-8 md:pt-8 md:pb-10 px-4 sm:px-6 md:px-8 lg:px-12 mb-6 sm:mb-8">
        {/* Header Section with Typography Upgrade */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left Side - Description (Desktop Only) */}
            <motion.div
              className="hidden md:block"
              initial={{ opacity: 0, letterSpacing: "0.1em" }}
              animate={{ opacity: 1, letterSpacing: "0em" }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-xs sm:text-sm md:text-base text-gray-300 font-medium leading-relaxed">
                A decade and a half of building a resilient, data-driven logistics backbone.
              </p>
            </motion.div>
            
            {/* Mobile/Desktop Layout - Button Left, Years Right */}
            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
              <motion.div 
                className="px-4 py-2 backdrop-blur-md text-white text-xs font-semibold rounded-full border"
                style={{
                  backgroundColor: '#FFA019',
                  borderColor: '#FFA019',
                  boxShadow: 'rgba(0, 0, 0, 0.07) 0px 1px 1px, rgba(0, 0, 0, 0.07) 0px 2px 2px, rgba(0, 0, 0, 0.07) 0px 4px 4px, rgba(0, 0, 0, 0.07) 0px 8px 8px, rgba(0, 0, 0, 0.07) 0px 16px 16px',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {milestones.length} key milestones
              </motion.div>
              <motion.span 
                className="text-xs text-gray-400 font-semibold ml-auto md:ml-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {years[0]} - {years[years.length - 1]}
              </motion.span>
            </div>
          </div>
        </motion.div>

        {/* Mobile Timeline - Single Year with Arrows */}
        <div className="md:hidden relative py-6">
          <div className="relative flex items-center justify-center gap-4">
            {/* Left Arrow */}
            <button
              onClick={handlePrevious}
              className="text-white hover:text-[#FFA019] transition-colors duration-200 focus:outline-none z-20"
              aria-label="Previous year"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Centered Year Display */}
            <div className="flex-1 flex justify-center">
              <motion.button
                className="relative z-20 focus:outline-none"
                onClick={() => setActiveYear(activeYear)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="relative w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-xl bg-gradient-to-br from-[#FF7A00]/30 to-[#FF9500]/20 border-2 border-[#FF7A00]/60"
                  style={{
                    boxShadow: "0 8px 32px rgba(255, 122, 0, 0.4), 0 0 0 1px rgba(255, 122, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <span className="text-sm font-bold text-white drop-shadow-lg">
                    {activeYear}
                  </span>
                </div>
              </motion.button>
            </div>

            {/* Right Arrow */}
            <button
              onClick={handleNext}
              className="text-white hover:text-[#FFA019] transition-colors duration-200 focus:outline-none z-20"
              aria-label="Next year"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Desktop Timeline Section */}
        <div className="hidden md:block relative py-6">
          <div className="relative">
            {/* Glowing Neon Track with Gradient - Behind circles */}
            <div className="absolute top-[45%] left-0 right-0 h-1.5 -translate-y-1/2 rounded-full overflow-hidden z-0">
              {/* Base gradient track */}
              <div 
                className="absolute inset-0 rounded-full opacity-30"
                style={{
                  background: "linear-gradient(90deg, #FF7A00 0%, #FF9500 30%, #FFB84D 60%, #FFD700 100%)",
                }}
              />
              
              {/* Dynamic Progress Glow */}
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #FF7A00 0%, #FF9500 30%, #FFB84D 60%, #FFD700 100%)",
                  boxShadow: "0 0 20px rgba(255, 122, 0, 0.6), 0 0 40px rgba(255, 149, 0, 0.4), 0 0 60px rgba(255, 184, 77, 0.2)",
                  filter: "blur(0.5px)"
                }}
                initial={false}
                animate={{
                  width: `${progress}%`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  mass: 1
                }}
              >
                {/* Shimmer Effect */}
                {!prefersReducedMotion && (
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)",
                      width: "30%",
                    }}
                    animate={{
                      x: `${shimmerPosition * 3.33}%`,
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                )}
              </motion.div>
            </div>

            {/* Year Markers Container */}
            <div className="relative flex justify-between items-center w-full pb-2 year-markers-container" style={{ minHeight: '56px' }}>
              {/* Year Markers with Glassmorphism - Above the line */}
              <div className="flex justify-between items-center w-full gap-2 sm:gap-4 md:gap-6">
              {years.map((year, index) => {
                const isActive = activeYear === year;

                return (
                  <motion.button
                    key={year}
                    className="relative z-20 focus:outline-none group flex-shrink-0"
                    onClick={() => setActiveYear(year)}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1 
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ 
                      delay: index * 0.1, 
                      type: "spring",
                      stiffness: 200,
                      damping: 15
                    }}
                  >
                    {/* Glassmorphism Orb - Fully covers the line behind it */}
                    <motion.div
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isActive 
                          ? "backdrop-blur-xl bg-gradient-to-br from-[#FF7A00]/30 to-[#FF9500]/20 border-2 border-[#FF7A00]/60" 
                          : "backdrop-blur-md bg-white/10 border-2 border-white/20"
                      }`}
                      style={{
                        boxShadow: isActive 
                          ? "0 8px 32px rgba(255, 122, 0, 0.4), 0 0 0 1px rgba(255, 122, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.2)"
                          : "0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
                        zIndex: 20,
                        position: 'relative',
                        backgroundColor: isActive ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.4)', // Solid background to cover line
                      }}
                      animate={{
                        scale: isActive ? 1.15 : 1,
                        opacity: isActive ? 1 : 0.7
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                    >
                      {/* Inner Glow */}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF7A00]/40 to-transparent"
                          style={{ zIndex: 1 }}
                          animate={{
                            opacity: [0.4, 0.6, 0.4]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      )}

                      {/* Reflection Highlight */}
                      <div 
                        className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white/30 blur-sm"
                        style={{ transform: "rotate(-45deg)", zIndex: 2 }}
                      />

                      {/* Pulse Glow Ring for Active */}
                      {isActive && !prefersReducedMotion && (
                        <>
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-[#FF7A00]"
                            style={{ zIndex: 0 }}
                            animate={{
                              scale: [1, 1.3, 1.3],
                              opacity: [0.8, 0, 0]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeOut"
                            }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full border border-[#FFB84D]"
                            style={{ zIndex: 0 }}
                            animate={{
                              scale: [1, 1.5, 1.5],
                              opacity: [0.6, 0, 0]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: 0.3,
                              ease: "easeOut"
                            }}
                          />
                        </>
                      )}

                      {/* Year Text */}
                      <span
                        className={`text-xs md:text-sm font-bold relative z-10 ${
                          isActive ? "text-white drop-shadow-lg" : "text-gray-400"
                        }`}
                        style={{ zIndex: 3 }}
                      >
                        {year}
                      </span>
                    </motion.div>
                  </motion.button>
                );
              })}
              </div>
            </div>
            </div>
          </div>
        </div>

      {/* Milestone Content - Full Width, Fixed Height with Padding */}
      <div className="relative min-h-[300px] sm:h-[350px] md:h-[400px] w-full pb-1 md:pb-1 pt-0 -mt-4">
        {/* Orange Triangle in Bottom Right Corner - Touching outer border */}
        <div 
          className="absolute bottom-0 right-0 z-10 hidden sm:block"
          style={{
            width: '80px',
            height: '80px',
            background: '#FFA019',
            clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
            borderBottomRightRadius: '12px',
          }}
        />
        <div 
          className="absolute bottom-0 right-0 z-10 sm:hidden"
          style={{
            width: '60px',
            height: '60px',
            background: '#FFA019',
            clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
            borderBottomRightRadius: '8px',
          }}
        />
        
        <div className="h-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-20 md:pb-1">
          <AnimatePresence mode="wait">
            {milestones
              .filter((milestone) => milestone.year === activeYear)
              .map((milestone) => (
                <MilestoneCard
                  key={`${milestone.id}-${activeYear}`}
                  milestone={milestone}
                  isActive={true}
                />
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MilestoneCard({
  milestone,
  isActive
}: {
  milestone: AtlasMilestone;
  isActive: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [hoverOffset, setHoverOffset] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const interval = setInterval(() => {
      setHoverOffset((prev) => (prev === 0 ? -1 : 0));
    }, 3000);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0
      }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 0.8
      }}
    >
      <div className="relative w-full h-full flex flex-col">
        {/* Icon and Tag in One Row - Hidden on Mobile */}
        <motion.div
          className="hidden md:flex items-center justify-between mb-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            delay: 0.05
          }}
        >
          {milestone.icon && (
            <motion.div
              className="text-[#FF7A00]"
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: 0.1
              }}
            >
              {milestone.icon}
            </motion.div>
          )}
          
          <span
            className={`px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-md border ${
              milestone.tagColor || "bg-[#FF7A00]/20 text-[#FF7A00] border-[#FF7A00]/30"
            }`}
          >
            {milestone.tag}
          </span>
        </motion.div>
        
        <motion.h3
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight text-center md:text-left"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            delay: 0.15
          }}
        >
          {milestone.title}
        </motion.h3>
        
        <motion.p
          className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed whitespace-pre-line flex-1 overflow-y-auto text-center md:text-left"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            delay: 0.2
          }}
        >
          {milestone.description}
        </motion.p>

      </div>
    </motion.div>
  );
}

export default AtlasTimeline;
