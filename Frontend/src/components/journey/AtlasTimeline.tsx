import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { LucideIcon } from "lucide-react";

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
  const [activeYear, setActiveYear] = useState<string | null>(null);
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

  const years = Array.from(new Set(milestones.map(m => m.year))).sort();

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* White Card Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 pt-4 pb-8 md:pt-6 md:pb-12 px-8 md:px-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Left Side */}
            <div>
              <p className="text-sm text-gray-600">
                A decade and a half of building a resilient, data-driven logistics backbone.
              </p>
            </div>
            
            {/* Right Side */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-full">
                {milestones.length} key milestones
              </div>
              <span className="text-xs text-gray-600 font-semibold">
                {years[0]} - {years[years.length - 1]}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="mb-12">

          {/* Timeline Line with Markers */}
          <div className="relative">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2" />
            
            {/* Progress Line */}
            <motion.div
              className="absolute top-1/2 left-0 h-1 bg-[#FF7A00] -translate-y-1/2"
              style={{
                width: prefersReducedMotion ? "100%" : `${progress * 100}%`,
                transition: prefersReducedMotion ? "none" : "width 0.1s linear"
              }}
            />

            {/* Year Markers */}
            <div className="relative flex justify-between items-center">
              {years.map((year, index) => {
                const yearProgress = (index + 1) / years.length;
                const isPassed = progress >= yearProgress - 0.1;
                const isActive = activeYear === year;

                return (
                  <motion.button
                    key={year}
                    className="relative z-10 focus:outline-none"
                    onClick={() => setActiveYear(isActive ? null : year)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    {/* Circular Marker */}
                    <div
                      className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-colors ${
                        isPassed
                          ? "bg-[#FF7A00] border-white shadow-lg"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {isPassed && !prefersReducedMotion && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-[#FF7A00]"
                          animate={{
                            scale: [1, 1.5, 1.5],
                            opacity: [0.3, 0, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                        />
                      )}
                      <span
                        className={`text-xs font-semibold ${
                          isPassed ? "text-white" : "text-gray-400"
                        }`}
                      >
                        {year}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Milestone Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {milestones.map((milestone, index) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              index={index}
              isActive={activeYear === null || activeYear === milestone.year}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MilestoneCard({
  milestone,
  index,
  isActive
}: {
  milestone: AtlasMilestone;
  index: number;
  isActive: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`bg-white rounded-lg border border-gray-100 p-6 transition-all ${
        isActive ? "opacity-100" : "opacity-60"
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: isActive ? 1 : 0.6, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{ y: -4, borderColor: "#FF7A00", opacity: 1 }}
    >
      {milestone.icon && (
        <div className="text-[#FF7A00] mb-4">
          {milestone.icon}
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded ${
            milestone.tagColor || "bg-[#FF7A00]/10 text-[#FF7A00]"
          }`}
        >
          {milestone.tag}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {milestone.title}
      </h3>
      
      <p className="text-sm text-gray-600 leading-relaxed mb-4">
        {milestone.description}
      </p>

      {/* Metrics */}
      {milestone.metrics && milestone.metrics.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {milestone.metrics.map((metric, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded"
            >
              {metric.label}: {metric.value}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default AtlasTimeline;
