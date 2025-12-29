import { motion } from "framer-motion";
import { Building, Star } from "lucide-react";
import { useState } from "react";

interface Client {
  name: string;
  logo?: string;
  industry?: string;
  featured?: boolean;
  description?: string;
}

interface FeaturedClientsProps {
  clients: Client[];
}

const FeaturedClients = ({ clients }: FeaturedClientsProps) => {
  const featuredClients = clients.filter((client) => client.featured).slice(0, 12);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageError = (clientName: string) => {
    setImageErrors((prev) => ({ ...prev, [clientName]: true }));
  };

  return (
    <div className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Featured Partners
          </h2>
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
        </div>
        
      </motion.div>

      {/* Premium Partner Cards Grid - Small Square Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {featuredClients.map((client, index) => {
          const hasLogo = client.logo && !imageErrors[client.name];
          const showFallback = !hasLogo;
          
          return (
            <motion.div
              key={`${client.name}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ y: -6 }}
              className="group"
            >
              <div 
                className="relative w-full aspect-square rounded-[20px] flex flex-col items-center justify-center p-4 md:p-5 transition-all duration-500 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                {/* Hover shadow enhancement */}
                <div 
                  className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                />
                
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-orange-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[20px]" />
                
                {/* Logo Container - Top Center */}
                <div className="relative z-10 flex items-center justify-center w-full mb-2 md:mb-3 flex-shrink-0">
                  {hasLogo ? (
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="w-full flex items-center justify-center"
                    >
                      <img
                        src={client.logo}
                        alt={`${client.name} logo`}
                        className="max-w-[80%] max-h-12 md:max-h-14 object-contain filter grayscale-[60%] group-hover:grayscale-0 transition-all duration-500"
                        onError={() => handleImageError(client.name)}
                        loading="lazy"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                    >
                      <Building className="w-6 h-6 md:w-7 md:h-7 text-gray-400 group-hover:text-primary transition-colors duration-500" />
                    </motion.div>
                  )}
                </div>
                
                {/* Brand Name - Bold */}
                <div className="relative z-10 text-center mb-1 md:mb-2 flex-shrink-0">
                  <h3 className="text-xs md:text-sm font-bold text-gray-900 group-hover:text-primary transition-colors duration-500 leading-tight">
                    {client.name}
                  </h3>
                </div>
                
                {/* Description - One Line (compact for square cards) */}
                {client.description && (
                  <div className="relative z-10 text-center flex-shrink-0">
                    <p className="text-[10px] md:text-xs text-gray-600 leading-tight line-clamp-2 group-hover:text-gray-700 transition-colors duration-500 px-1">
                      {client.description}
                    </p>
                  </div>
                )}
                
                {/* Fallback Initials (if no description and no logo) */}
                {showFallback && !client.description && (
                  <div className="relative z-10 text-center flex-shrink-0">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      {getInitials(client.name)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturedClients;