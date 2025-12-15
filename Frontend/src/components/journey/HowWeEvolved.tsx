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
  return (
    <section className={`pt-4 md:pt-6 pb-4 md:pb-6 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* Header Section */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            How We Evolved
          </h2>
          <p className="text-base text-gray-600 max-w-xl">
            Every part of our business has been redesigned for resilience, visibility, and customer confidence.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className={`rounded-lg border border-gray-100 p-5 relative overflow-hidden ${
                card.id === "ops" || card.id === "service" ? "mt-8" : ""
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
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[60px] border-l-transparent border-t-[60px] border-t-[#FF7A00] rounded-tr-lg" />
              ) : (
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[60px] border-l-transparent border-t-[60px] border-t-black rounded-tr-lg" />
              )}

              {/* Icon Square with Letters */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                card.id === "tech" || card.id === "sustainability" 
                  ? "bg-black" 
                  : "bg-[#FF7A00]"
              }`}>
                <span className="text-white font-bold text-base">
                  {card.iconLetters}
                </span>
              </div>
              
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {card.title}
              </h3>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowWeEvolved;

