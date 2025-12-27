import { motion } from "framer-motion";
import scheduleIcon from "@/assets/schedule.png";

const SchedulePickupSection = () => {
  return (
    <section
      className="relative overflow-hidden py-12 md:py-16 schedule-pickup-section"
    >
      <div className="ocl-container relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row items-center gap-6 md:gap-8"
          >
            {/* Text - Left (white background side) */}
            <div className="w-full md:w-1/2 flex flex-col justify-center md:text-left md:items-start text-center md:min-h-[250px]">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-xl md:text-2xl font-bold mb-4 text-black md:text-black"
                style={{ fontFamily: "Poppins, ui-sans-serif", fontWeight: 700 }}
              >
                Schedule Pickup
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm md:text-base leading-relaxed text-black md:text-gray-800"
                style={{ lineHeight: "1.7", fontWeight: 500 }}
              >
                Book doorstep pickup services with flexible timing, instant confirmation, and
                real-time tracking support.
              </motion.p>
            </div>

            {/* Image + CTA - Right (black background side) */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full group"
              >
                <img
                  src={scheduleIcon}
                  alt="Schedule Pickup"
                  className="w-full h-[160px] md:h-[200px] rounded-lg object-cover transition-all duration-500 group-hover:scale-105"
                  style={{
                    boxShadow:
                      "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px",
                  }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <button
                  className="button-86"
                  onClick={() => (window.location.href = "/schedule-pickup")}
                >
                  Learn More
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Section Styles */}
      <style>{`
        .schedule-pickup-section {
          background-color: #000000;
        }
        
        @media (max-width: 767px) {
          .schedule-pickup-section h3,
          .schedule-pickup-section p {
            color: #FFFFFF !important;
          }
        }
        
        @media (min-width: 768px) {
          .schedule-pickup-section {
            background-color: #000000;
          }
          .schedule-pickup-section h3,
          .schedule-pickup-section p {
            color: #FFFFFF !important;
          }
        }
      `}</style>
    </section>
  );
};

export default SchedulePickupSection;


