import { motion } from "framer-motion";

const TrustStatsSection = () => {
  const trustStats = [
    {
      number: "75+",
      label: "Cities Covered",
      emoji: "🚚"
    },
    {
      number: "99.8%",
      label: "On-Time Deliveries",
      emoji: "🕐"
    },
    {
      number: "1500+",
      label: "Business Clients",
      emoji: "💼"
    }
  ];

  return (
    <section 
      className="w-full py-4 md:py-8 relative overflow-hidden"
      style={{ backgroundColor: "#FFF5E6" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row items-center justify-center gap-4 sm:gap-6 md:gap-12 lg:gap-16">
          {trustStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex flex-col items-center text-center group cursor-default flex-1"
            >
              <motion.div
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2 gradient-number"
                style={{ 
                  fontFamily: 'Poppins, ui-sans-serif'
                }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {stat.number}
              </motion.div>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Gradient animation styles */}
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        .gradient-number {
          background: linear-gradient(90deg, #ff6a00, #0078ff, #8e2de2);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          animation: gradientMove 3s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default TrustStatsSection;

