import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2 } from "lucide-react";
import { Building } from "lucide-react";

interface CaseStudy {
  brandName: string;
  logo?: string;
  problem: string;
  solution: string;
  result: string;
  metrics?: {
    label: string;
    value: string;
  }[];
}

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  index: number;
}

const CaseStudyCard = ({ caseStudy, index }: CaseStudyCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative h-full"
    >
      <div className="h-full rounded-2xl bg-white border-2 border-gray-200 p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col">
        {/* Brand Logo/Name */}
        <div className="flex items-center gap-4 mb-6">
          {caseStudy.logo ? (
            <img
              src={caseStudy.logo}
              alt={caseStudy.brandName}
              className="w-16 h-16 object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Building className="w-8 h-8 text-primary" />
            </div>
          )}
          <h3 className="text-xl font-bold text-gray-900">{caseStudy.brandName}</h3>
        </div>

        {/* Problem */}
        <div className="mb-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Problem</p>
              <p className="text-sm text-gray-600">{caseStudy.problem}</p>
            </div>
          </div>
        </div>

        {/* Solution */}
        <div className="mb-4">
          <div className="flex items-start gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Solution</p>
              <p className="text-sm text-gray-600">{caseStudy.solution}</p>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex items-start gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700 mb-1">Result</p>
              <p className="text-sm text-gray-600 mb-3">{caseStudy.result}</p>
            </div>
          </div>

          {/* Metrics */}
          {caseStudy.metrics && caseStudy.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {caseStudy.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                >
                  <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
                  <p className="text-lg font-bold text-primary">{metric.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CaseStudyCard;

