import { motion } from "framer-motion";
import home2Image from "@/assets/home-2.png";

const NeedHelpCard = () => {
  return (
    <section 
      className="relative py-6 md:py-8 need-help-section-mobile" 
      style={{ 
        backgroundColor: '#000000',
        backgroundImage: `
          radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 45% 35%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 75% 15%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 25% 60%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 85% 70%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 60% 85%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 35% 80%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 90% 40%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 10% 50%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 55% 25%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 30% 10%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 70% 55%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 50% 75%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 95% 25%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 20% 45%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 65% 65%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 40% 30%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 80% 90%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 5% 30%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 12% 70%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 38% 5%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 52% 50%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 68% 30%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 78% 60%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 88% 80%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 22% 25%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 48% 90%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 62% 12%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 72% 45%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 8% 85%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 42% 15%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 58% 70%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 82% 35%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
          radial-gradient(circle at 18% 55%, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px),
          radial-gradient(circle at 92% 65%, rgba(255, 255, 255, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl mx-auto px-4 md:px-6"
      >
        {/* Card with Image, Text and Button */}
        <div
          className="md:rounded-xl overflow-hidden relative need-help-card-wrapper"
          style={{
            minHeight: '200px'
          }}
        >
          <img
            src={home2Image}
            alt="OCL Services"
            className="absolute top-0 left-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/40" />

          {/* Text and Button inside card */}
          <div className="relative z-10 flex flex-col justify-between h-full p-4 md:p-6 lg:p-8" style={{ minHeight: '200px' }}>
            <div className="flex flex-col items-center">
              <h3
                className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3 text-white drop-shadow-lg text-center"
                style={{ fontFamily: 'Poppins, ui-sans-serif' }}
              >
                Need Help Choosing the Right Service?
              </h3>
              <p className="text-white/90 text-xs md:text-sm lg:text-base drop-shadow-md text-center mb-4 md:mb-6 hidden md:block">
                Not sure which service suits your business best? Our experts are ready to guide you.
              </p>
            </div>
            <div className="flex justify-center pb-2">
              <button
                onClick={() => (window.location.href = '/contact')}
                className="button-86"
                role="button"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        /* Mobile spacing */
        @media (max-width: 767px) {
          .need-help-section-mobile {
            padding-top: 48px !important;
            padding-bottom: 48px !important;
          }
          
          .need-help-card-wrapper h3 {
            margin-top: 2rem !important;
          }
        }

        .need-help-card-wrapper {
          box-shadow: none;
        }
        
        @media (min-width: 768px) {
          .need-help-card-wrapper {
            box-shadow: rgba(255, 255, 255, 0.3) 0px 15px 30px, rgba(0, 0, 0, 0.2) 0px 5px 10px;
          }
        }
        
        .button-86 {
          all: unset;
          width: auto;
          min-width: 120px;
          height: auto;
          font-size: 16px;
          background: transparent;
          border: none;
          position: relative;
          color: #ffffff;
          cursor: pointer;
          z-index: 1;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
          font-weight: 600;
        }

        .button-86:hover {
          color: #0D1C48;
        }

        .button-86::after,
        .button-86::before {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          z-index: -99999;
          transition: all .4s;
        }

        .button-86::before {
          transform: translate(0%, 0%);
          width: 100%;
          height: 100%;
          background: #0D1C48;
          border-radius: 10px;
        }

        .button-86::after {
          transform: translate(10px, 10px);
          width: 35px;
          height: 35px;
          background: #ffffff15;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          border-radius: 50px;
        }

        .button-86:hover {
          color: #ffffff;
        }

        .button-86:hover::before {
          transform: translate(5%, 20%);
          width: 110%;
          height: 110%;
          background: #FF9F00;
        }

        .button-86:hover::after {
          border-radius: 10px;
          transform: translate(0, 0);
          width: 100%;
          height: 100%;
          background: #FF9F00;
        }

        .button-86:active::after {
          transition: 0s;
          transform: translate(0, 5%);
        }
      `}</style>
    </section>
  );
};

export default NeedHelpCard;

