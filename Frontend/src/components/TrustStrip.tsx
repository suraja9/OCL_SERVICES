import { motion } from "framer-motion";

const TrustStrip = () => {
  const stats = [
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
    <section className="w-full py-8 md:py-10 bg-white relative" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <div className="ocl-container">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex flex-col items-center text-center group cursor-default"
            >
              <div className="text-4xl mb-2">{stat.emoji}</div>
              <motion.div
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2"
                style={{ color: '#0D1C48', fontFamily: 'Poppins, ui-sans-serif' }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {stat.number}
              </motion.div>
              <p className="text-sm md:text-base text-gray-600 font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;

