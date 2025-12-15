import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Milestone } from "./Timeline";

type HorizontalMilestonesProps = {
  milestones: Milestone[];
  className?: string;
};

export function HorizontalMilestones({
  milestones,
  className
}: HorizontalMilestonesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { scrollXProgress } = useScroll({
    container: scrollRef,
    layoutEffect: false
  });

  const opacity = useTransform(scrollXProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollXProgress, [0, 0.1, 0.9, 1], [0.8, 1, 1, 0.8]);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScroll);
      checkScroll();
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", checkScroll);
      }
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Scroll Buttons */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 z-20 flex gap-2">
        <motion.button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className="p-3 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Scroll left"
        >
          <ArrowLeft className="w-5 h-5 text-[#0A6B6B]" />
        </motion.button>
        <motion.button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className="p-3 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Scroll right"
        >
          <ArrowRight className="w-5 h-5 text-[#0A6B6B]" />
        </motion.button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#0A6B6B]/10 rounded-full overflow-hidden z-10">
        <motion.div
          className="h-full bg-gradient-to-r from-[#0A6B6B] to-[#F6B53A]"
          style={{
            scaleX: prefersReducedMotion ? 1 : scrollXProgress,
            transformOrigin: "0%"
          }}
        />
      </div>

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scroll-smooth snap-x snap-mandatory pb-8"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch"
        }}
      >
        <style>{`
          div[class*="overflow-x-auto"]::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex gap-8 px-4 md:px-8" style={{ width: "max-content" }}>
          {milestones.map((milestone, index) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              index={index}
              scrollProgress={scrollXProgress}
              prefersReducedMotion={!!prefersReducedMotion}
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
  scrollProgress,
  prefersReducedMotion
}: {
  milestone: Milestone;
  index: number;
  scrollProgress: any;
  prefersReducedMotion: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className="snap-start min-w-[320px] md:min-w-[400px] lg:min-w-[480px] flex-shrink-0"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={
        prefersReducedMotion || isInView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 50, scale: 0.9 }
      }
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.2, 0.9, 0.2, 1]
      }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      <div className="relative h-full rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl shadow-[0_24px_64px_rgba(13,27,42,0.15)] border border-white/20 group">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A6B6B]/5 via-transparent to-[#F6B53A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Image */}
        {milestone.media && (
          <div className="relative h-64 overflow-hidden">
            <motion.img
              src={milestone.media.src}
              alt={milestone.media.alt || ""}
              className="w-full h-full object-cover"
              initial={{ scale: 1.1 }}
              animate={isInView ? { scale: 1 } : { scale: 1.1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute top-4 right-4">
              <div className="rounded-full bg-white/90 backdrop-blur-md px-4 py-2 shadow-lg">
                <span className="text-sm font-bold text-[#0A6B6B]">
                  {milestone.year}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 md:p-8 relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <motion.div
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A6B6B] to-[#0A6B6B]/80 flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-white">{milestone.icon}</div>
            </motion.div>
            <div className="flex-1">
              <h3
                className="text-2xl md:text-3xl font-bold text-[#0D1B2A] mb-2"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                {milestone.title}
              </h3>
              <p className="text-base text-[#2b3442] leading-relaxed">
                {milestone.summary}
              </p>
            </div>
          </div>

          {milestone.details && (
            <motion.p
              className="text-sm text-[#2b3442]/80 mt-4"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.4 }}
            >
              {milestone.details}
            </motion.p>
          )}

          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#0A6B6B] via-[#F6B53A] to-[#0A6B6B] rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10" />
        </div>
      </div>
    </motion.div>
  );
}

export default HorizontalMilestones;

