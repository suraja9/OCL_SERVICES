import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type City = {
  id: string;
  name: string;
  x: number;
  y: number;
  year: string;
  status: "active" | "coming-soon";
};

type CleanIndiaMapProps = {
  className?: string;
};

const cities: City[] = [
  { id: "mumbai", name: "Mumbai", x: 45, y: 55, year: "2001", status: "active" },
  { id: "delhi", name: "Delhi", x: 52, y: 25, year: "2003", status: "active" },
  { id: "bangalore", name: "Bangalore", x: 48, y: 75, year: "2005", status: "active" },
  { id: "chennai", name: "Chennai", x: 55, y: 80, year: "2006", status: "active" },
  { id: "kolkata", name: "Kolkata", x: 65, y: 40, year: "2008", status: "active" },
  { id: "hyderabad", name: "Hyderabad", x: 50, y: 70, year: "2009", status: "active" },
  { id: "pune", name: "Pune", x: 44, y: 58, year: "2010", status: "active" },
  { id: "ahmedabad", name: "Ahmedabad", x: 38, y: 45, year: "2012", status: "active" },
  { id: "jaipur", name: "Jaipur", x: 45, y: 30, year: "2014", status: "active" },
  { id: "lucknow", name: "Lucknow", x: 55, y: 30, year: "2015", status: "active" },
  { id: "indore", name: "Indore", x: 42, y: 50, year: "2016", status: "active" },
  { id: "kochi", name: "Kochi", x: 40, y: 88, year: "2017", status: "active" },
  { id: "chandigarh", name: "Chandigarh", x: 50, y: 20, year: "2018", status: "active" },
  { id: "bhopal", name: "Bhopal", x: 45, y: 48, year: "2019", status: "active" },
  { id: "visakhapatnam", name: "Visakhapatnam", x: 58, y: 72, year: "2020", status: "active" },
  { id: "patna", name: "Patna", x: 60, y: 38, year: "2021", status: "active" },
  { id: "nagpur", name: "Nagpur", x: 48, y: 55, year: "2022", status: "active" },
  { id: "surat", name: "Surat", x: 36, y: 52, year: "2023", status: "active" }
];

export function CleanIndiaMap({ className }: CleanIndiaMapProps) {
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [animatedCities, setAnimatedCities] = useState<string[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      if (animatedCities.length < cities.length) {
        setAnimatedCities((prev) => [...prev, cities[prev.length].id]);
      } else {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [animatedCities.length]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative w-full max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-8 md:p-12">
        <svg
          viewBox="0 0 800 1000"
          className="w-full h-auto"
          style={{ maxHeight: "500px" }}
        >
          {/* Simplified India outline */}
          <motion.path
            d="M 200 150 Q 250 100 300 120 T 400 140 T 500 160 T 600 180 T 650 200 L 680 250 L 670 350 L 650 450 L 620 550 L 580 650 L 540 750 L 500 800 L 450 850 L 400 880 L 350 900 L 300 920 L 250 930 L 200 920 L 150 900 L 120 850 L 100 800 L 90 750 L 100 650 L 120 550 L 140 450 L 160 350 L 180 250 Z"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: prefersReducedMotion ? 0.1 : 1.5,
              ease: "easeInOut"
            }}
          />

          {/* Connection Lines */}
          {cities.slice(0, -1).map((city, index) => {
            const nextCity = cities[index + 1];
            if (!animatedCities.includes(city.id) || !animatedCities.includes(nextCity.id)) {
              return null;
            }
            return (
              <motion.line
                key={`line-${city.id}-${nextCity.id}`}
                x1={(city.x / 100) * 800}
                y1={(city.y / 100) * 1000}
                x2={(nextCity.x / 100) * 800}
                y2={(nextCity.y / 100) * 1000}
                stroke="#F6B53A"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                strokeOpacity="0.4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: prefersReducedMotion ? 0.1 : 0.6,
                  delay: index * 0.05
                }}
              />
            );
          })}

          {/* City Points */}
          {cities.map((city) => {
            const isAnimated = animatedCities.includes(city.id);
            const isActive = activeCity === city.id;

            return (
              <g key={city.id}>
                {/* City Dot */}
                <motion.circle
                  cx={(city.x / 100) * 800}
                  cy={(city.y / 100) * 1000}
                  r={isActive ? "6" : "4"}
                  fill={city.status === "active" ? "#F6B53A" : "#9ca3af"}
                  stroke="white"
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={
                    isAnimated
                      ? {
                          scale: isActive ? 1.3 : 1,
                          opacity: 1
                        }
                      : { scale: 0, opacity: 0 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    delay: cities.indexOf(city) * 0.05
                  }}
                  onMouseEnter={() => setActiveCity(city.id)}
                  onMouseLeave={() => setActiveCity(null)}
                  style={{ cursor: "pointer" }}
                />

                {/* City Label */}
                {isActive && (
                  <motion.g
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <rect
                      x={(city.x / 100) * 800 - 35}
                      y={(city.y / 100) * 1000 - 30}
                      width="70"
                      height="25"
                      rx="4"
                      fill="white"
                      stroke="#F6B53A"
                      strokeWidth="1.5"
                    />
                    <text
                      x={(city.x / 100) * 800}
                      y={(city.y / 100) * 1000 - 12}
                      textAnchor="middle"
                      fill="#F6B53A"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {city.name}
                    </text>
                  </motion.g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: cities.length.toString(), label: "Cities" },
            { value: "22+", label: "Years" },
            { value: "1000+", label: "Routes" },
            { value: "50K+", label: "Deliveries" }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CleanIndiaMap;

