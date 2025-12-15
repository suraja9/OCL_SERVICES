import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import amitSharmaImg from "@/assets/Amit-Sharma.png";
import rituAgarwalImg from "@/assets/Ritu-Agarwal.png";
import manojVermaImg from "@/assets/Manoj.png";

interface Review {
  id: number;
  text: string;
  name: string;
  title: string;
  avatar: string;
}

const CustomerReviews = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);

  // Update cards per view based on screen size
  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 768) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  // Auto-scroll every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, reviews.length - cardsPerView);
        if (prev >= maxIndex) {
          return 0;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [cardsPerView]);

  const reviews: Review[] = [
    {
      id: 1,
      text: "OCL Services made our delivery seamless and on time. The communication was clear throughout.",
      name: "Amit Sharma",
      title: "Operations Head",
      avatar: amitSharmaImg
    },
    {
      id: 2,
      text: "Their logistics support helped us handle high volume orders effortlessly during the festive season.",
      name: "Ritu Agarwal",
      title: "Supply Chain Manager",
      avatar: rituAgarwalImg
    },
    {
      id: 3,
      text: "Fast and reliable team they handled our express shipments professionally.",
      name: "Manoj Verma",
      title: "Local Business Owner",
      avatar: manojVermaImg
    }
  ];

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      if (prev === 0) {
        return Math.max(0, reviews.length - cardsPerView);
      }
      return prev - 1;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, reviews.length - cardsPerView);
      if (prev >= maxIndex) {
        return 0;
      }
      return prev + 1;
    });
  };

  return (
    <section
      className="w-full pt-8 md:pt-12 pb-12 md:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: "#f9f9f9" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-8 md:mb-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
            style={{
              color: "#000000",
              fontFamily: "'Value Serif Pro Bold', serif"
            }}
          >
            Hear from the people<br />
            who move with us.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base md:text-lg mb-3"
            style={{
              color: "#000000",
              fontFamily: "'Value Serif Pro Bold', serif"
            }}
          >
            Real experiences. Genuine feedback. Every shipment tells a story.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm"
            style={{
              color: "#666666",
              fontFamily: "'Value Serif Pro Bold', serif"
            }}
          >
            ⭐ Customer Feedback – Verified by OCL Services
          </motion.p>
        </div>

        {/* Main Content - Sidebar + Reviews */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:w-1/4 flex flex-col"
          >
            {/* Large Quotation Mark Icon */}
            <div
              className="text-8xl md:text-9xl font-bold mb-4"
              style={{ 
                color: "#888888", 
                fontFamily: "serif",
                lineHeight: "1",
                fontWeight: "bold"
              }}
            >
              "
            </div>
            
            {/* Title */}
            <h3
            className="text-xl md:text-2xl font-medium mb-6"
            style={{
              color: "#000000",
              fontFamily: "'Value Serif Pro Bold', serif"
            }}
            >
              What our customers are saying
            </h3>

            {/* Progress Bar with Navigation Arrows */}
            <div className="flex items-center gap-1.5 mt-4">
              {/* Left Arrow */}
              <button
                onClick={handlePrev}
                className="flex-shrink-0 p-0 hover:opacity-70 transition-opacity"
                style={{ color: "#CCCCCC" }}
              >
                <ChevronLeft className="w-3 h-3" />
              </button>

              {/* Progress Bar */}
              <div className="flex-1 h-0.5 bg-gray-300 rounded-full overflow-hidden relative" style={{ maxWidth: "200px" }}>
                <div
                  className="h-full bg-gray-800 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((currentIndex + 1) / Math.max(1, reviews.length - cardsPerView + 1)) * 100))}%`
                  }}
                />
              </div>

              {/* Right Arrow */}
              <button
                onClick={handleNext}
                className="flex-shrink-0 p-0 hover:opacity-70 transition-opacity"
                style={{ color: "#333333" }}
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>

          {/* Review Cards Carousel */}
          <div className="lg:w-3/4 relative" style={{ overflowX: "hidden", overflowY: "visible", paddingTop: "5rem", paddingBottom: "2rem", scrollbarWidth: "none", msOverflowStyle: "none", height: "auto", maxHeight: "none" }}>
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`
              }}
            >
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex-shrink-0 px-3 overflow-visible"
                  style={{ width: `${100 / cardsPerView}%` }}
                >
                  <div
                    className="bg-white rounded-2xl h-full relative mb-6 overflow-visible p-4 md:p-5"
                    style={{
                      boxShadow: "rgba(0, 0, 0, 0.25) 0px 14px 28px, rgba(0, 0, 0, 0.22) 0px 10px 10px",
                      WebkitBoxShadow: "rgba(0, 0, 0, 0.25) 0px 14px 28px, rgba(0, 0, 0, 0.22) 0px 10px 10px",
                      borderRadius: "16px",
                      paddingTop: "4rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    {/* Notch at bottom center (chat bubble effect) */}
                    <div
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
                      style={{
                        width: "0",
                        height: "0",
                        borderLeft: "10px solid transparent",
                        borderRight: "10px solid transparent",
                        borderTop: "10px solid #FFFFFF",
                        filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05))"
                      }}
                    />
                    {/* Floating Photo Icon at Top Center - Fully visible */}
                    <div
                      className="absolute left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center"
                      style={{ pointerEvents: "none", top: "-64px" }}
                    >
                      <div
                        className="rounded-full bg-white flex items-center justify-center mb-2 overflow-hidden"
                        style={{
                          boxShadow: "rgba(0, 0, 0, 0.15) 0px 8px 16px, rgba(0, 0, 0, 0.1) 0px 4px 8px",
                          border: "3px solid #FFFFFF",
                          width: "64px",
                          height: "64px"
                        }}
                      >
                        <img
                          src={review.avatar}
                          alt={review.name}
                          className="w-full h-full rounded-full object-cover"
                          style={{ borderRadius: "50%" }}
                        />
                      </div>
                      <p
                        className="text-xs md:text-sm font-bold mb-1 text-center"
                        style={{
                          color: "#000000",
                          fontFamily: "'Value Serif Pro Bold', serif"
                        }}
                      >
                        {review.name}
                      </p>
                      <p
                        className="text-xs text-center"
                        style={{
                          color: "#666666",
                          fontFamily: "'Value Serif Pro Bold', serif",
                          fontWeight: "normal",
                          lineHeight: "1.4",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {review.title}
                      </p>
                    </div>

                    {/* Review Text */}
                    <p
                      className="text-sm md:text-base mb-3 text-center italic"
                      style={{
                        color: "#333333",
                        fontFamily: "'Value Serif Pro Bold', serif",
                        lineHeight: "1.6"
                      }}
                    >
                      {review.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hide Scrollbars */}
      <style>{`
        .lg\\:w-3\\/4::-webkit-scrollbar {
          display: none;
        }
        .lg\\:w-3\\/4 {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default CustomerReviews;

