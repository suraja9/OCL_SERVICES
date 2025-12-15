import React from "react";
import { motion } from "framer-motion";

type PremiumCardProps = {
  imageSrc: string;
  title: string;
  subtitle?: string;
  tag?: string;
  className?: string;
  onClick?: () => void;
  gradient?: string; // background gradient for top section overlay
  disableHover?: boolean;
};

const PremiumCard: React.FC<PremiumCardProps> = ({ imageSrc, title, subtitle, tag, className = "", onClick, gradient, disableHover }) => {
  return (
    <motion.div
      whileHover={disableHover ? undefined : { y: -6, scale: 1.03 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onClick={onClick}
      className={
        "group relative h-[300px] w-full overflow-hidden rounded-[16px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] " +
        "transition-all duration-300 transition-ease-[cubic-bezier(0.25,1,0.5,1)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.15)] " +
        className
      }
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Top image (16:9) */}
      <div className="relative h-[55%] w-full overflow-hidden">
        <img
          src={imageSrc}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {/* gradient overlay (custom per card) */}
        {gradient ? (
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{ background: gradient }}
          />
        ) : null}
        {/* subtle white overlay for depth */}
        <div className="pointer-events-none absolute inset-0 bg-white/10" />
      </div>

      {/* Bottom content */}
      <div className="h-[45%] w-full bg-white px-[18px] py-4">
        {tag ? (
          <span
            className="inline-block rounded-[8px] bg-[#F3E0D5] px-[10px] py-[4px] text-[11px] font-medium text-[#5A1E1E]"
          >
            {tag}
          </span>
        ) : null}
        <h3 className="mt-2 text-[16px] font-semibold leading-snug text-[#222]">{title}</h3>
        {subtitle ? (
          <p className="mt-1 text-[13px] leading-snug text-[#777]">{subtitle}</p>
        ) : null}
      </div>
    </motion.div>
  );
};

export default PremiumCard;


