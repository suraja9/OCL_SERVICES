import React from "react";
import { motion } from "framer-motion";

export type Leader = {
  id: string;
  name: string;
  role: string;
  photo?: string;
};

type LeadershipSectionProps = {
  leaders: Leader[];
  description: string;
  className?: string;
};

export function LeadershipSection({
  leaders,
  description,
  className
}: LeadershipSectionProps) {
  return (
    <section className={`pt-8 md:pt-12 pb-8 md:pb-12 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left - Description + 2 Cards */}
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-8">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Leadership & People
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                {description}
              </p>
            </div>
            
            {/* 2 Cards aligned with bottom row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto">
              {leaders.slice(0, 2).map((leader, index) => (
                <motion.div
                  key={leader.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                  style={{
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
                  whileHover={{ y: -4 }}
                >
                  {leader.photo && (
                    <div className="relative h-40 overflow-hidden bg-gray-100">
                      <motion.img
                        src={leader.photo}
                        alt={leader.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                  )}
                  <div className="p-4 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {leader.name}
                    </h3>
                    <p className="text-sm text-[#FF7A00] font-semibold">
                      {leader.role}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Remaining Leader Cards in 2x2 Grid */}
          <div className="grid grid-cols-2 gap-6">
            {leaders.slice(2).map((leader, index) => (
              <motion.div
                key={leader.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                style={{
                  boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
                }}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ y: -4 }}
              >
                {leader.photo && (
                  <div className="relative h-40 overflow-hidden bg-gray-100">
                    <motion.img
                      src={leader.photo}
                      alt={leader.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                )}
                <div className="p-4 pt-8 text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {leader.name}
                  </h3>
                  <p className="text-sm text-[#FF7A00] font-semibold">
                    {leader.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LeadershipSection;

