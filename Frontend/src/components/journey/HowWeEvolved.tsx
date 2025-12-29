import React from "react";
import { motion } from "framer-motion";

export type EvolutionCard = {
  id: string;
  iconLetters: string;
  title: string;
  description: string;
};

type HowWeEvolvedProps = {
  cards: EvolutionCard[];
  className?: string;
};

export function HowWeEvolved({ cards, className }: HowWeEvolvedProps) {
  // Helper function to truncate description to 3 lines for mobile
  const truncateToThreeLines = (text: string): string => {
    // Approximate 3 lines of text for mobile (text-xs, leading-tight) = ~120 characters
    const maxLength = 120;
    if (text.length <= maxLength) {
      // If text already ends with period, return as is
      return text.trim().endsWith('.') ? text.trim() : text.trim() + '.';
    }
    
    // Truncate and find the last sentence ending before maxLength
    const truncated = text.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');
    
    // If we found a period, truncate there
    if (lastPeriod > maxLength * 0.7) {
      return truncated.substring(0, lastPeriod + 1);
    }
    
    // Otherwise, truncate at last space and add period
    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + '.';
    }
    
    // Fallback: truncate at maxLength and add period
    return truncated.substring(0, maxLength - 1) + '.';
  };

  return (
    <section className={`pt-4 md:pt-6 pb-4 md:pb-6 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* Header Section */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-4 md:mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-[30px] md:text-5xl font-bold text-gray-900 text-center md:text-left">
            How <span className="text-[#FFA019]">We</span> Evolved
          </h2>
          
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className={`rounded-lg border border-gray-100 p-3 md:p-5 relative overflow-hidden ${
                card.id === "ops" || card.id === "service" ? "md:mt-8" : ""
              }`}
              style={{
                backgroundColor: "#F2F6F9",
                boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              {/* Corner Badge */}
              {card.id === "tech" || card.id === "sustainability" ? (
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] md:border-l-[60px] border-l-transparent border-t-[40px] md:border-t-[60px] border-t-[#FFA019] rounded-tr-lg" />
              ) : (
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] md:border-l-[60px] border-l-transparent border-t-[40px] md:border-t-[60px] border-t-black rounded-tr-lg" />
              )}

              {/* Icon Square with Letters */}
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-2 md:mb-3 ${
                card.id === "tech" || card.id === "sustainability" 
                  ? "bg-black" 
                  : "bg-[#FFA019]"
              }`}>
                <span className="text-white font-bold text-xs md:text-base">
                  {card.iconLetters}
                </span>
              </div>
              
              <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1 md:mb-2">
                {card.title}
              </h3>
              
              <p className="text-xs md:text-sm text-gray-600 leading-tight md:leading-relaxed md:line-clamp-none">
                <span className="md:hidden">{truncateToThreeLines(card.description)}</span>
                <span className="hidden md:inline">{card.description}</span>
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowWeEvolved;

