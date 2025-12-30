import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

  return (
    <section
      className="w-full pt-4 md:pt-12 pb-6 md:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: "#f9f9f9" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-4 md:mb-12 text-center">
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
            ⭐ Customer Feedback - Verified by OCL Services
          </motion.p>
        </div>

        {/* Review Cards Carousel - Centered */}
        <div className="w-full flex justify-center px-4 md:px-6">
          <div className="w-full max-w-sm md:max-w-5xl relative customer-reviews-carousel" style={{ overflowX: "hidden", overflowY: "visible", scrollbarWidth: "none", msOverflowStyle: "none", height: "auto", maxHeight: "none" }}>
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
                  className="flex-shrink-0 overflow-visible customer-review-card-wrapper"
                  style={{ width: `${100 / cardsPerView}%`, boxSizing: 'border-box' }}
                >
                  <div
                    className="bg-white rounded-xl h-full relative mb-4 overflow-visible customer-review-card mx-auto"
                    style={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.12) 0px 2px 4px, rgba(0, 0, 0, 0.15) 0px 2px 4px",
                      WebkitBoxShadow:
                        "rgba(0, 0, 0, 0.12) 0px 2px 4px, rgba(0, 0, 0, 0.15) 0px 2px 4px",
                      borderRadius: "12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      width: '100%',
                      maxWidth: '100%'
                    }}
                  >
                    {/* Notch at bottom center (chat bubble effect) */}
                    <div
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
                      style={{
                        width: "0",
                        height: "0",
                        borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent",
                        borderTop: "8px solid #FFFFFF",
                        filter: "none"
                      }}
                    />
                    {/* Floating Photo Icon at Top Center - Fully visible */}
                    <div
                      className="absolute left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center customer-review-avatar"
                      style={{ pointerEvents: "none" }}
                    >
                      <div
                        className="rounded-full bg-white flex items-center justify-center mb-1.5 overflow-hidden customer-review-avatar-img"
                        style={{
                          boxShadow: "rgba(0, 0, 0, 0.12) 0px 4px 8px, rgba(0, 0, 0, 0.08) 0px 2px 4px",
                          border: "2px solid #FFFFFF"
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
                        className="text-[10px] md:text-xs font-bold mb-0.5 text-center"
                        style={{
                          color: "#000000",
                          fontFamily: "'Value Serif Pro Bold', serif"
                        }}
                      >
                        {review.name}
                      </p>
                      <p
                        className="text-[9px] md:text-[10px] text-center"
                        style={{
                          color: "#666666",
                          fontFamily: "'Value Serif Pro Bold', serif",
                          fontWeight: "normal",
                          lineHeight: "1.3",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {review.title}
                      </p>
                    </div>

                    {/* Review Text */}
                    <p
                      className="text-xs md:text-sm mb-2 text-center italic"
                      style={{
                        color: "#333333",
                        fontFamily: "'Value Serif Pro Bold', serif",
                        lineHeight: "1.5"
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
        
        /* Mobile-specific styles */
        @media (max-width: 767px) {
          .customer-reviews-carousel {
            padding-top: 2.5rem;
            padding-bottom: 1rem;
            overflow-x: hidden !important;
          }

          .customer-reviews-carousel .flex {
            gap: 0 !important;
          }
          
          .customer-review-card-wrapper {
            padding-left: 1.5rem !important;
            padding-right: 1.5rem !important;
            box-sizing: border-box !important;
          }
          
          .customer-review-card-wrapper:first-child {
            padding-left: 1rem !important;
          }
          
          .customer-review-card-wrapper:last-child {
            padding-right: 1rem !important;
          }
          
          .customer-review-card {
            padding: 0.75rem;
            padding-top: 2.5rem;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          .customer-review-avatar {
            top: -40px;
          }
          
          .customer-review-avatar-img {
            width: 40px;
            height: 40px;
          }
        }
        
        /* Desktop styles */
        @media (min-width: 768px) {
          .customer-reviews-carousel {
            padding-top: 3.5rem;
            padding-bottom: 1.5rem;
          }
          
          .customer-review-card {
            padding: 1rem;
            padding-top: 3rem;
          }
          
          .customer-review-avatar {
            top: -48px;
          }
          
          .customer-review-avatar-img {
            width: 48px;
            height: 48px;
          }

          /* Add gaps between cards on desktop */
          .customer-review-card-wrapper {
            padding-left: 1.5rem !important;
            padding-right: 1.5rem !important;
          }

          .customer-review-card-wrapper:first-child {
            padding-left: 1rem !important;
            padding-right: 1.5rem !important;
          }

          .customer-review-card-wrapper:last-child {
            padding-right: 1rem !important;
            padding-left: 1.5rem !important;
          }

          .customer-review-card-wrapper .customer-review-card {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }

          .customer-reviews-carousel {
            overflow-x: visible !important;
          }
        }
      `}</style>
    </section>
  );
};

export default CustomerReviews;

