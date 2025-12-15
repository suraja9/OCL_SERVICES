import { motion } from "framer-motion";
import { Building } from "lucide-react";

interface Client {
  name: string;
  logo?: string;
  industry?: string;
}

interface LogoCloudProps {
  clients: Client[];
  maxLogos?: number;
  grayscale?: boolean;
  className?: string;
}

const LogoCloud = ({ 
  clients, 
  maxLogos = 50, 
  grayscale = true,
  className = "" 
}: LogoCloudProps) => {
  const displayClients = clients.slice(0, maxLogos);
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4 md:gap-6 ${className}`}>
      {displayClients.map((client, index) => (
        <motion.div
          key={`${client.name}-${index}`}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: index * 0.02 }}
          whileHover={{ scale: 1.1, y: -4 }}
          className="flex flex-col items-center justify-center group"
        >
          <div
            className={`
              w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24
              rounded-xl md:rounded-2xl
              bg-gradient-to-br from-gray-100 to-gray-200
              dark:from-gray-800 dark:to-gray-900
              flex items-center justify-center
              border border-gray-200 dark:border-gray-700
              shadow-sm hover:shadow-lg
              transition-all duration-300
              ${grayscale ? "grayscale hover:grayscale-0" : ""}
            `}
          >
            {client.logo ? (
              <img
                src={client.logo}
                alt={client.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <Building className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-primary transition-colors" />
                <span className="text-[8px] md:text-[10px] font-semibold text-gray-500 mt-1">
                  {getInitials(client.name)}
                </span>
              </div>
            )}
          </div>
          <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mt-2 text-center line-clamp-2 max-w-[80px]">
            {client.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default LogoCloud;

