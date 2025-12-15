import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import userBanner1 from "@/assets/user-banner-1.png";
import userBanner2 from "@/assets/user-banner-2.png";
import userBanner3 from "@/assets/user-banner-3.png";

interface Slide {
  id: string;
  image: string;
  title: string;
  description: string;
  ctaText: string;
  ctaAction: () => void;
}

interface RightBannerSliderProps {
  isDarkMode?: boolean;
  height?: string;
}

const RightBannerSlider: React.FC<RightBannerSliderProps> = ({ isDarkMode = false, height = "220px" }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const slides: Slide[] = React.useMemo(() => [
    {
      id: "slide-1",
      image: userBanner1,
      title: "Fast Delivery Across India",
      description: "We deliver across 220+ cities. Book now for reliable service.",
      ctaText: "Book Now",
      ctaAction: () => {
        const event = new CustomEvent("user-dashboard:navigate", {
          detail: { section: "booknow" },
        });
        window.dispatchEvent(event);
      },
    },
    {
      id: "slide-2",
      image: userBanner2,
      title: "Flat 15% Off First Shipment",
      description: "Use code OCLNEW15 to get exclusive discount on your first booking.",
      ctaText: "Book Now",
      ctaAction: () => {
        const event = new CustomEvent("user-dashboard:navigate", {
          detail: { section: "booknow" },
        });
        window.dispatchEvent(event);
      },
    },
    {
      id: "slide-3",
      image: userBanner3,
      title: "96% India Coverage",
      description: "Deliver across 220+ International locations with trusted logistics.",
      ctaText: "Explore Services",
      ctaAction: () => {
        window.location.href = "/services/logistics";
      },
    },
  ], []);

  // Debug: Log image paths
  useEffect(() => {
    console.log("Banner images:", {
      userBanner1,
      userBanner2,
      userBanner3,
      slides: slides.map(s => ({ id: s.id, image: s.image }))
    });
  }, [slides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 4000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, slides.length]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl overflow-hidden shadow-lg",
        isDarkMode ? "bg-slate-900/80" : "bg-white"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ height: height }}
    >
      {/* Slider Container */}
      <div className="relative h-full w-full overflow-hidden">
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
            width: `${slides.length * 100}%`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex-shrink-0"
              style={{ 
                width: `${100 / slides.length}%`,
                minWidth: `${100 / slides.length}%`,
                height: '100%'
              }}
            >
              <div className="w-full h-full relative overflow-hidden" style={{ height: '100%', backgroundColor: '#f3f4f6' }}>
                {/* Image Section - Full Width */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                  onLoad={(e) => {
                    console.log(`✅ Image loaded successfully for ${slide.title}:`, slide.image);
                    console.log('Image element:', e.currentTarget);
                  }}
                  onError={(e) => {
                    console.error(`❌ Failed to load image for ${slide.title}`);
                    console.error('Image path:', slide.image);
                    console.error('Error event:', e);
                    console.error('Target:', e.currentTarget);
                  }}
                  style={{ 
                    display: 'block', 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backgroundColor: '#e5e7eb'
                  }}
                />
                
                {/* Book Now Button - Positioned over the image on right side */}
                <div className="absolute bottom-4 right-4 z-10">
                  <Button
                    onClick={slide.ctaAction}
                    className="bg-[#FF7A00] hover:bg-[#FF8A1A] text-white text-xs px-4 py-2 h-auto rounded-full font-semibold shadow-lg"
                  >
                    {slide.ctaText}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "rounded-full transition-all duration-300",
              currentSlide === index
                ? "w-2.5 h-2.5 bg-[#FF7A00] opacity-100"
                : "w-2 h-2 bg-white/60 hover:bg-white/80 opacity-60"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default RightBannerSlider;

