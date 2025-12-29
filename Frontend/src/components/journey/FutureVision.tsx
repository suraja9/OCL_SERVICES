import React from "react";
import { motion } from "framer-motion";

type FutureVisionProps = {
  tags: string[];
  className?: string;
};

export function FutureVision({ tags, className }: FutureVisionProps) {
  return (
    <section className={`pt-4 md:pt-6 pb-4 md:pb-6 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <motion.div
          className="p-8 md:p-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-[30px] md:text-4xl font-bold text-gray-900 mb-4 text-center">
            A more intelligent, predictable <span className="text-[#FFA019]">logistics</span> future.
          </h2>

          <p className="hidden md:block text-lg text-gray-600 mb-8 max-w-2xl mx-auto text-center">
            We're investing in AI-powered tracking, predictive analytics, and deeper integrations to make logistics more transparent and efficient for everyone.
          </p>

          {/* Tag Chips */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-x-6 gap-y-4 md:gap-3 justify-items-center md:justify-center items-start px-2 md:px-0">
            {tags
              .filter(tag => 
                tag !== "Predictive Forecasting" && 
                tag !== "Better Fleet Management" && 
                tag !== "Automated Routing"
              )
              .map((tag, index) => {
              const isCentered = tag === "Real-time Analytics";
              return (
              <motion.span
                key={tag}
                className={`px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 text-center whitespace-nowrap w-fit ${isCentered ? 'col-span-2 md:col-span-1' : ''}`}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: 0.4 + index * 0.05,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ borderColor: "#FF7A00", color: "#FF7A00" }}
              >
                {tag}
              </motion.span>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default FutureVision;

