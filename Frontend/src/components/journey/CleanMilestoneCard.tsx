import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export type MilestoneCardData = {
  id: string;
  year: string;
  title: string;
  summary: string;
  details?: string;
  image?: string;
  icon?: React.ReactNode;
};

type CleanMilestoneCardProps = {
  milestone: MilestoneCardData;
  index: number;
  className?: string;
};

export function CleanMilestoneCard({
  milestone,
  index,
  className
}: CleanMilestoneCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1] // GSAP-style ease
      }}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
    >
      {milestone.image && (
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <motion.img
            src={milestone.image}
            alt={milestone.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          {milestone.icon && (
            <div className="text-[#F6B53A] flex-shrink-0">
              {milestone.icon}
            </div>
          )}
          <div className="flex-1">
            <div className="inline-block px-3 py-1 bg-[#F6B53A]/10 text-[#F6B53A] text-xs font-semibold rounded-full mb-2">
              {milestone.year}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {milestone.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              {milestone.summary}
            </p>
            {milestone.details && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {milestone.details}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CleanMilestoneCard;

