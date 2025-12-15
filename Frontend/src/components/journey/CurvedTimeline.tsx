import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { CheckCircle2, MapPin, Monitor, Plane, Factory } from "lucide-react";

export type TimelineMilestone = {
  id: string;
  year: string;
  title: string;
  summary: string;
  icon: React.ReactNode;
  color: string;
};

type CurvedTimelineProps = {
  milestones: TimelineMilestone[];
  className?: string;
};

export function CurvedTimeline({ milestones, className }: CurvedTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Curved SVG Path */}
      <svg
        className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full pointer-events-none"
        style={{ height: "100%", minHeight: "600px" }}
        viewBox="0 0 4 1000"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0A6B6B" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#0A6B6B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F6B53A" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d="M 2 0 Q 2 200 2 400 Q 2 600 2 800 Q 2 900 2 1000"
          stroke="url(#timelineGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          style={{
            pathLength: prefersReducedMotion ? 1 : pathLength,
            opacity: prefersReducedMotion ? 1 : opacity
          }}
          filter="url(#glow)"
        />
      </svg>

      {/* Milestones */}
      <div className="relative space-y-24 md:space-y-32">
        {milestones.map((milestone, index) => (
          <TimelineItem
            key={milestone.id}
            milestone={milestone}
            index={index}
            total={milestones.length}
            scrollProgress={scrollYProgress}
            prefersReducedMotion={!!prefersReducedMotion}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({
  milestone,
  index,
  total,
  scrollProgress,
  prefersReducedMotion
}: {
  milestone: TimelineMilestone;
  index: number;
  total: number;
  scrollProgress: any;
  prefersReducedMotion: boolean;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.3 }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => {
      if (itemRef.current) {
        observer.unobserve(itemRef.current);
      }
    };
  }, []);

  const isEven = index % 2 === 0;
  const y = useTransform(
    scrollProgress,
    [0, 1],
    [index * 50, (total - index) * -50]
  );

  return (
    <motion.div
      ref={itemRef}
      className={`relative flex items-center gap-8 ${
        isEven ? "flex-row" : "flex-row-reverse"
      }`}
      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
      animate={
        prefersReducedMotion || isInView
          ? { opacity: 1, x: 0 }
          : { opacity: 0, x: isEven ? -50 : 50 }
      }
      transition={{
        duration: 0.8,
        delay: index * 0.15,
        ease: [0.2, 0.9, 0.2, 1]
      }}
      style={prefersReducedMotion ? {} : { y }}
    >
      {/* Timeline Dot */}
      <div className="relative z-10 flex-shrink-0">
        <motion.div
          className={`relative w-16 h-16 rounded-full bg-white shadow-[0_8px_24px_rgba(10,107,107,0.3)] flex items-center justify-center ${
            milestone.color || "bg-[#0A6B6B]"
          }`}
          initial={{ scale: 0 }}
          animate={
            prefersReducedMotion || isInView
              ? { scale: 1 }
              : { scale: 0 }
          }
          transition={{
            duration: 0.5,
            delay: index * 0.15 + 0.3,
            type: "spring",
            stiffness: 200
          }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
          <div className="relative z-10 text-white">
            {milestone.icon}
          </div>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#0A6B6B]"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={
              prefersReducedMotion || isInView
                ? { scale: 1.5, opacity: 0 }
                : { scale: 1, opacity: 0.8 }
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.2
            }}
          />
        </motion.div>
      </div>

      {/* Content Card */}
      <motion.div
        className={`flex-1 ${
          isEven ? "text-left" : "text-right"
        } max-w-md`}
        whileHover={{ scale: 1.02, x: isEven ? 8 : -8 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative rounded-2xl bg-white/80 backdrop-blur-xl p-6 shadow-[0_20px_60px_rgba(13,27,42,0.12)] border border-white/20">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-3 ${
                milestone.color || "bg-[#0A6B6B]"
              } text-white shadow-lg`}
            >
              {milestone.year}
            </div>
            <h3
              className="text-2xl font-bold text-[#0D1B2A] mb-2"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              {milestone.title}
            </h3>
            <p className="text-sm text-[#2b3442] leading-relaxed">
              {milestone.summary}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CurvedTimeline;

