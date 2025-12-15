import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from "framer-motion";

export type TimelineMilestone = {
  id: string;
  year: string;
  title: string;
  summary: string;
  details?: string;
  icon?: React.ReactNode;
};

type HorizontalTimelineProps = {
  milestones: TimelineMilestone[];
  className?: string;
};

export function HorizontalTimeline({ milestones, className }: HorizontalTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const scrollPosition = windowHeight / 2;
      const timelineTop = rect.top;
      const timelineHeight = rect.height;
      
      const relativePosition = (scrollPosition - timelineTop) / timelineHeight;
      const clampedProgress = Math.max(0, Math.min(1, relativePosition));
      setProgress(clampedProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Timeline Line */}
      <div className="relative h-1 bg-gray-200 max-w-5xl mx-auto mb-16">
        <motion.div
          className="absolute top-0 left-0 h-full bg-[#F6B53A]"
          style={{
            width: prefersReducedMotion ? "100%" : `${progress * 100}%`,
            transition: prefersReducedMotion ? "none" : "width 0.1s linear"
          }}
        />
      </div>

      {/* Timeline Dots and Cards */}
      <div className="relative">
        <div className="flex justify-between items-start max-w-5xl mx-auto px-4">
          {milestones.map((milestone, index) => {
            const isActive = activeIndex === index;
            const dotProgress = (index + 1) / milestones.length;
            const isPassed = progress >= dotProgress - 0.1;

            return (
              <div
                key={milestone.id}
                className="relative flex-1 flex flex-col items-center"
                style={{ maxWidth: `${100 / milestones.length}%` }}
              >
                {/* Timeline Dot */}
                <div className="relative z-10 mb-8 flex items-center justify-center">
                  <motion.button
                    className="relative focus:outline-none"
                    onClick={() => setActiveIndex(isActive ? null : index)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`${milestone.year} - ${milestone.title}`}
                  >
                    {isPassed && !prefersReducedMotion && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-[#F6B53A]"
                        animate={{
                          scale: [1, 2, 2.5],
                          opacity: [0.4, 0.2, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                        style={{ width: "16px", height: "16px", left: "-8px", top: "-8px" }}
                      />
                    )}
                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-colors relative z-10 ${
                        isPassed
                          ? "bg-[#F6B53A] border-[#F6B53A]"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  </motion.button>
                </div>

                {/* Year Label */}
                <motion.div
                  className="text-xs font-semibold text-gray-600 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  {milestone.year}
                </motion.div>

                {/* Floating Card */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-80"
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      transition={{
                        duration: 0.4,
                        ease: [0.16, 1, 0.3, 1] // GSAP-style ease
                      }}
                    >
                      <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-6">
                        <div className="flex items-start gap-3 mb-3">
                          {milestone.icon && (
                            <div className="text-[#F6B53A] flex-shrink-0">
                              {milestone.icon}
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {milestone.title}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {milestone.summary}
                            </p>
                            {milestone.details && (
                              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                {milestone.details}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover Card Preview */}
                <motion.div
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-10 w-64"
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 pointer-events-none">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {milestone.title}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {milestone.summary}
                    </p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HorizontalTimeline;

