import { motion } from "framer-motion";
import mobileSide from "@/assets/mobile.png";

const FloatingMobile = () => {
  return (
    <section className="relative overflow-visible">
      <div className="ocl-container py-8 md:py-12 relative">
        <motion.img
          src={mobileSide}
          alt="OCL Mobile"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="hidden md:block absolute right-6 lg:right-10 top-0 -translate-y-1/2 h-56 lg:h-64 object-contain z-30"
        />
      </div>
    </section>
  );
};

export default FloatingMobile;


