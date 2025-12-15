import { motion } from "framer-motion";
import { Building, ChevronRight } from "lucide-react";
import { useRef } from "react";

interface Client {
  name: string;
  logo?: string;
}

interface IndustryCarouselProps {
  industry: string;
  clients: Client[];
  totalCount: number;
}

const IndustryCarousel = ({ industry, clients, totalCount }: IndustryCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
            {industry}
          </h3>
          <p className="text-sm text-gray-600">
            +{totalCount - clients.length} more clients in this industry
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
      >
        {clients.map((client, index) => (
          <motion.div
            key={`${client.name}-${index}`}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="flex-shrink-0 snap-start"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex flex-col items-center justify-center p-4 shadow-sm hover:shadow-lg transition-all duration-300 group">
              {client.logo ? (
                <img
                  src={client.logo}
                  alt={client.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <Building className="w-8 h-8 md:w-10 md:h-10 text-gray-400 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-gray-500 mt-2">
                    {getInitials(client.name)}
                  </span>
                </div>
              )}
              <span className="text-xs text-gray-600 mt-2 text-center line-clamp-2 max-w-[120px]">
                {client.name}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default IndustryCarousel;

