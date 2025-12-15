import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface IndustryFilterProps {
  industries: string[];
  businessTypes?: string[];
  regions?: string[];
  selectedIndustry: string;
  selectedBusinessType?: string;
  selectedRegion?: string;
  onIndustryChange: (value: string) => void;
  onBusinessTypeChange?: (value: string) => void;
  onRegionChange?: (value: string) => void;
}

const IndustryFilter = ({
  industries,
  businessTypes = [],
  regions = [],
  selectedIndustry,
  selectedBusinessType,
  selectedRegion,
  onIndustryChange,
  onBusinessTypeChange,
  onRegionChange,
}: IndustryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center items-center">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filter by:</span>
      </div>
      
      <Select value={selectedIndustry} onValueChange={onIndustryChange}>
        <SelectTrigger className="w-[180px] border-2 border-gray-200 bg-white hover:border-primary transition-colors">
          <SelectValue placeholder="All Industries" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Industries</SelectItem>
          {industries.map((industry) => (
            <SelectItem key={industry} value={industry}>
              {industry}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {businessTypes.length > 0 && onBusinessTypeChange && (
        <Select value={selectedBusinessType || "All"} onValueChange={onBusinessTypeChange}>
          <SelectTrigger className="w-[180px] border-2 border-gray-200 bg-white hover:border-primary transition-colors">
            <SelectValue placeholder="All Business Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Business Types</SelectItem>
            {businessTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {regions.length > 0 && onRegionChange && (
        <Select value={selectedRegion || "All"} onValueChange={onRegionChange}>
          <SelectTrigger className="w-[180px] border-2 border-gray-200 bg-white hover:border-primary transition-colors">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Regions</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default IndustryFilter;

