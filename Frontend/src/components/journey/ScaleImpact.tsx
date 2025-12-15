import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type StatCardProps = {
  value: string;
  label: string;
  index: number;
};

function StatCard({ value, label, index }: StatCardProps) {
  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </motion.div>
  );
}

type ScaleImpactProps = {
  className?: string;
};

export function ScaleImpact({ className }: ScaleImpactProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mapDrawn, setMapDrawn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMapDrawn(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className={`pt-8 md:pt-12 pb-8 md:pb-12 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Map */}
          <motion.div
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-8"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Network</h3>
            <svg
              viewBox="0 0 800 1000"
              className="w-full h-auto"
              style={{ maxHeight: "400px" }}
            >
              {/* Simplified India outline */}
              <motion.path
                d="M 200 150 Q 250 100 300 120 T 400 140 T 500 160 T 600 180 T 650 200 L 680 250 L 670 350 L 650 450 L 620 550 L 580 650 L 540 750 L 500 800 L 450 850 L 400 880 L 350 900 L 300 920 L 250 930 L 200 920 L 150 900 L 120 850 L 100 800 L 90 750 L 100 650 L 120 550 L 140 450 L 160 350 L 180 250 Z"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={mapDrawn ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0.1 : 1.5,
                  ease: "easeInOut"
                }}
              />

              {/* City dots */}
              {[
                { x: 45, y: 55, name: "Mumbai" },
                { x: 52, y: 25, name: "Delhi" },
                { x: 48, y: 75, name: "Bangalore" },
                { x: 55, y: 80, name: "Chennai" },
                { x: 65, y: 40, name: "Kolkata" },
                { x: 50, y: 70, name: "Hyderabad" }
              ].map((city, i) => (
                <g key={city.name}>
                  <motion.circle
                    cx={(city.x / 100) * 800}
                    cy={(city.y / 100) * 1000}
                    r="5"
                    fill="#FF7A00"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={mapDrawn ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                    transition={{
                      delay: i * 0.1 + 0.5,
                      type: "spring",
                      stiffness: 200
                    }}
                  />
                </g>
              ))}

              {/* Connection lines */}
              {mapDrawn && (
                <>
                  <motion.line
                    x1={(45 / 100) * 800}
                    y1={(55 / 100) * 1000}
                    x2={(52 / 100) * 800}
                    y2={(25 / 100) * 1000}
                    stroke="#FF7A00"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    strokeOpacity="0.4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                  />
                  <motion.line
                    x1={(48 / 100) * 800}
                    y1={(75 / 100) * 1000}
                    x2={(55 / 100) * 800}
                    y2={(80 / 100) * 1000}
                    stroke="#FF7A00"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    strokeOpacity="0.4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 1.2 }}
                  />
                </>
              )}
            </svg>
          </motion.div>

          {/* Right - Stats */}
          <div>
            <motion.h3
              className="text-2xl font-bold text-gray-900 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Scale & Impact
            </motion.h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard value="18" label="Hubs" index={0} />
              <StatCard value="480+" label="Routes" index={1} />
              <StatCard value="2.8" label="Days avg delivery" index={2} />
              <StatCard value="98.3%" label="On-time rate" index={3} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ScaleImpact;

