import { useState, useRef, useEffect } from "react";

// Import all logos
import catLogo from "@/Home-Logo-marquee/cat-1.svg";
import ciplaLogo from "@/Home-Logo-marquee/cipla-logo.svg";
import dellLogo from "@/Home-Logo-marquee/dell-12.png";
import hitachiLogo from "@/Home-Logo-marquee/hitachi-12.png";
import hpLogo from "@/Home-Logo-marquee/hp-5.svg";
import hyundaiLogo from "@/Home-Logo-marquee/hyundai.png";
import larsenLogo from "@/Home-Logo-marquee/larsen-toubro-logo-2.svg";
import mahindraLogo from "@/Home-Logo-marquee/mahindra-red-logo.webp";
import pgLogo from "@/Home-Logo-marquee/p-g-2.svg";
import volvoLogo from "@/Home-Logo-marquee/volvo.svg";
import zydusWellnessLogo from "@/Home-Logo-marquee/Zydus_Wellness.png";

const PartnersScroll = () => {
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const partners = [
    { name: "Caterpillar", logo: catLogo },
    { name: "Cipla", logo: ciplaLogo },
    { name: "Dell", logo: dellLogo },
    { name: "Hitachi", logo: hitachiLogo },
    { name: "HP", logo: hpLogo },
    { name: "Hyundai", logo: hyundaiLogo },
    { name: "Larsen & Toubro", logo: larsenLogo },
    { name: "Mahindra", logo: mahindraLogo },
    { name: "P&G", logo: pgLogo },
    { name: "Volvo", logo: volvoLogo },
    { name: "Zydus Wellness", logo: zydusWellnessLogo },
  ];

  // Duplicate the array multiple times for seamless infinite loop
  const duplicatedPartners = [...partners, ...partners];

  useEffect(() => {
    if (scrollRef.current) {
      if (isPaused) {
        scrollRef.current.style.animationPlayState = "paused";
      } else {
        scrollRef.current.style.animationPlayState = "running";
      }
    }
  }, [isPaused]);

  return (
    <div style={{ backgroundColor: "#F9FBFF" }}>
      <div className="text-center py-4 md:py-6 px-4">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 uppercase">
          Our Valued Clients
        </h2>
      </div>

      <section 
        className="w-full overflow-hidden py-2 md:py-4 mb-6 md:mb-8"
        style={{ backgroundColor: "#FFF5E6" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative w-full overflow-hidden">
          {/* Scrolling container with flexbox */}
          <div 
            ref={scrollRef}
            className="flex items-center partners-marquee"
          >
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                className="flex-shrink-0 logo-item"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="logo-image"
                />
              </div>
            ))}
          </div>
        </div>

        <style>{`
          .partners-marquee {
            display: flex;
            width: fit-content;
            animation: marqueeScroll 20s linear infinite;
          }

          .logo-item {
            margin-right: 30px;
            width: 150px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .logo-image {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
            object-position: center;
          }

          @keyframes marqueeScroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .logo-item {
              width: 100px;
              height: 35px;
              margin-right: 20px;
            }
          }

          @media (max-width: 480px) {
            .logo-item {
              width: 80px;
              height: 30px;
              margin-right: 15px;
            }
          }
        `}</style>
      </section>
    </div>
  );
};

export default PartnersScroll;

