// Placeholder data for clients page
// This simulates 2000+ clients without loading them all

export interface Client {
  name: string;
  logo?: string;
  industry: string;
  businessType?: "Startup" | "SME" | "Enterprise";
  region?: string;
  featured?: boolean;
  testimonial?: string;
  partnership_since?: string;
  volume?: string;
  description?: string;
}

export interface CaseStudy {
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

// Generate placeholder clients for each industry
const generateClients = (industry: string, count: number, featured: boolean[] = []): Client[] => {
  const businessTypes: ("Startup" | "SME" | "Enterprise")[] = ["Startup", "SME", "Enterprise"];
  const regions = ["North", "South", "East", "West", "Central"];
  
  return Array.from({ length: count }, (_, i) => ({
    name: `${industry} Client ${i + 1}`,
    industry,
    businessType: businessTypes[i % businessTypes.length],
    region: regions[i % regions.length],
    featured: featured[i] || false,
  }));
};

// Helper function to get logo URL using logo service
const getLogoUrl = (companyName: string): string => {
  // Use logo.clearbit.com for real brand logos (works with company names/domains)
  // Falls back to a monochromatic logo service if needed
  const domainMap: Record<string, string> = {
    "Caterpillar": "caterpillar.com",
    "Cipla": "cipla.com",
    "Dell": "dell.com",
    "Hitachi": "hitachi.com",
    "HP": "hp.com",
    "Hyundai": "hyundai.com",
    "Larsen & Toubro": "larsentoubro.com",
    "Mahindra": "mahindra.com",
    "P&G": "pg.com",
    "Volvo": "volvo.com",
    "Zydus Wellness": "zyduswellness.com",
    "Amazon": "amazon.com",
  };
  
  const domain = domainMap[companyName];
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }
  return "";
};

// Featured clients (major brands)
export const featuredClients: Client[] = [
  { 
    name: "Caterpillar", 
    industry: "Automotive", 
    featured: true,
    logo: getLogoUrl("Caterpillar"),
    description: "Global leader in construction and mining equipment"
  },
  { 
    name: "Cipla", 
    industry: "Pharmaceuticals", 
    featured: true,
    logo: getLogoUrl("Cipla"),
    description: "Premier pharmaceutical company serving global healthcare"
  },
  { 
    name: "Dell", 
    industry: "Electronics", 
    featured: true,
    logo: getLogoUrl("Dell"),
    description: "World-renowned technology solutions and services provider"
  },
  { 
    name: "Hitachi", 
    industry: "Electronics", 
    featured: true,
    logo: getLogoUrl("Hitachi"),
    description: "Innovative technology and infrastructure solutions leader"
  },
  { 
    name: "HP", 
    industry: "Electronics", 
    featured: true,
    logo: getLogoUrl("HP"),
    description: "Leading provider of personal systems and printing solutions"
  },
  { 
    name: "Hyundai", 
    industry: "Automotive", 
    featured: true,
    logo: getLogoUrl("Hyundai"),
    description: "Global automotive manufacturer driving innovation forward"
  },
  { 
    name: "Larsen & Toubro", 
    industry: "Automotive", 
    featured: true,
    logo: getLogoUrl("Larsen & Toubro"),
    description: "Engineering and construction conglomerate excellence"
  },
  { 
    name: "Mahindra", 
    industry: "Automotive", 
    featured: true,
    logo: getLogoUrl("Mahindra"),
    description: "Diversified automotive and farm equipment powerhouse"
  },
  { 
    name: "P&G", 
    industry: "FMCG", 
    featured: true,
    logo: getLogoUrl("P&G"),
    description: "Consumer goods leader trusted by millions worldwide"
  },
  { 
    name: "Volvo", 
    industry: "Automotive", 
    featured: true,
    logo: getLogoUrl("Volvo"),
    description: "Premium vehicle manufacturer committed to safety and quality"
  },
  { 
    name: "Zydus Wellness", 
    industry: "Pharmaceuticals", 
    featured: true,
    logo: getLogoUrl("Zydus Wellness"),
    description: "Healthcare and wellness solutions for better living"
  },
  { 
    name: "Amazon", 
    industry: "E-commerce", 
    featured: true,
    logo: getLogoUrl("Amazon"),
    description: "Global e-commerce and cloud computing technology giant"
  },
];

// Industry-wise client counts (simulating 2000+ total)
export const industryClientCounts = {
  "E-commerce": 450,
  "Healthcare": 320,
  "Pharmaceuticals": 280,
  "FMCG": 250,
  "Automotive": 200,
  "Electronics": 180,
  "Textiles": 150,
  "Fashion": 170,
};

// Sample clients per industry (for display)
export const industryClients: Record<string, Client[]> = {
  "E-commerce": [
    ...featuredClients.filter((c) => c.industry === "E-commerce"),
    ...generateClients("E-commerce", 6),
  ],
  "Healthcare": generateClients("Healthcare", 6, [true, true, false, false, false, false]),
  "Pharmaceuticals": [
    ...featuredClients.filter((c) => c.industry === "Pharmaceuticals"),
    ...generateClients("Pharmaceuticals", 4),
  ],
  "FMCG": [
    ...featuredClients.filter((c) => c.industry === "FMCG"),
    ...generateClients("FMCG", 6),
  ],
  "Automotive": [
    ...featuredClients.filter((c) => c.industry === "Automotive"),
    ...generateClients("Automotive", 4),
  ],
  "Electronics": [
    ...featuredClients.filter((c) => c.industry === "Electronics"),
    ...generateClients("Electronics", 4),
  ],
  "Textiles": generateClients("Textiles", 6, [true, true, false, false, false, false]),
  "Fashion": generateClients("Fashion", 6, [true, true, false, false, false, false]),
};

// All industries
export const industries = Object.keys(industryClientCounts);

// Business types
export const businessTypes = ["Startup", "SME", "Enterprise"];

// Regions
export const regions = ["North", "South", "East", "West", "Central"];

// Case studies
export const caseStudies: CaseStudy[] = [
  {
    brandName: "TechGadgets India",
    problem: "High shipping costs and delayed deliveries affecting customer satisfaction",
    solution: "Implemented OCL's express delivery network with real-time tracking",
    result: "Reduced shipping costs by 35% and improved on-time delivery to 98%",
    metrics: [
      { label: "Cost Reduction", value: "35%" },
      { label: "On-Time Delivery", value: "98%" },
    ],
  },
  {
    brandName: "MediCare Plus",
    problem: "Temperature-sensitive pharmaceutical products requiring cold-chain logistics",
    solution: "Deployed OCL's specialized cold-chain infrastructure with 24/7 monitoring",
    result: "Zero product spoilage and 99.8% delivery success rate",
    metrics: [
      { label: "Product Integrity", value: "100%" },
      { label: "Delivery Success", value: "99.8%" },
    ],
  },
  {
    brandName: "Fashion Forward",
    problem: "Need for fast fashion logistics with same-day delivery in metro cities",
    solution: "Integrated OCL's express courier service with last-mile delivery optimization",
    result: "Achieved same-day delivery in 15+ cities with 40% faster turnaround",
    metrics: [
      { label: "Same-Day Delivery", value: "15+ Cities" },
      { label: "Faster Turnaround", value: "40%" },
    ],
  },
  {
    brandName: "DailyEssentials FMCG",
    problem: "Bulk logistics challenges for nationwide distribution",
    solution: "Leveraged OCL's extensive network for cost-effective bulk shipping",
    result: "Expanded to 500+ cities with 25% reduction in logistics overhead",
    metrics: [
      { label: "Cities Covered", value: "500+" },
      { label: "Cost Savings", value: "25%" },
    ],
  },
];

// Total client count
export const totalClientCount = Object.values(industryClientCounts).reduce(
  (sum, count) => sum + count,
  0
);

