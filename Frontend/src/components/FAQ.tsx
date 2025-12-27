import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { useMemo } from "react";
import distributionIcon from "@/Icon-images/distribution.png";
import packageIcon from "@/Icon-images/package.png";
import laptopIcon from "@/Icon-images/laptop.png";
import faqImage from "@/assets/faq.png";

// Image Icon Components
const DistributionIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <img src={distributionIcon} alt="Distribution" className={className} style={style} />
);

const PackageIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <img src={packageIcon} alt="Package" className={className} style={style} />
);

const LaptopIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <img src={laptopIcon} alt="Laptop" className={className} style={style} />
);

const faqs = [
  {
    id: "item-1",
    question: "How can I track my shipment?",
    answer:
      "You can track any shipment directly using your mobile number or AWB number on our homepage tracking tool.",
    Illustration: DistributionIcon,
  },
  {
    id: "item-2",
    question: "Does OCL deliver to remote or rural areas?",
    answer:
      "Yes, we have a wide delivery network covering over 20,000+ pin codes across India.",
    Illustration: PackageIcon,
  },
  {
    id: "item-3",
    question: "What if my package gets delayed or damaged?",
    answer:
      "Every parcel is insured and tracked in real time. You'll receive instant notifications for any delivery updates.",
    Illustration: PackageIcon,
  },
  {
    id: "item-4",
    question: "Can I schedule a pickup from my home or office?",
    answer:
      "Absolutely. Use the \"Schedule Pickup\" feature on our homepage to book a convenient pickup time.",
    Illustration: LaptopIcon,
  },
  {
    id: "item-5",
    question: "Do you offer business or bulk shipping solutions?",
    answer:
      "Yes. OCL provides customized logistics and B2B shipping solutions tailored for eCommerce and corporate needs.",
    Illustration: LaptopIcon,
  },
];

// Logistics-themed background SVG pattern
const LogisticsBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Top-right corner illustration */}
    <svg
      className="absolute top-0 right-0 w-96 h-96 md:w-[500px] md:h-[500px] opacity-[0.03] md:opacity-[0.08]"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* World map outline */}
      <path
        d="M200 50 C250 50, 300 80, 320 120 C340 160, 350 200, 340 240 C330 280, 300 320, 250 340 C200 360, 150 350, 100 330 C50 310, 30 270, 40 230 C50 190, 80 150, 120 120 C160 90, 180 60, 200 50 Z"
        stroke="#0D1B2A"
        strokeWidth="2"
        fill="none"
      />
      {/* Package icons */}
      <rect x="150" y="150" width="40" height="30" rx="4" stroke="#FF9F00" strokeWidth="1.5" fill="none" />
      <rect x="220" y="200" width="40" height="30" rx="4" stroke="#FF9F00" strokeWidth="1.5" fill="none" />
      <rect x="100" y="250" width="40" height="30" rx="4" stroke="#FF9F00" strokeWidth="1.5" fill="none" />
      {/* Connection lines */}
      <line x1="170" y1="165" x2="240" y2="215" stroke="#0D1B2A" strokeWidth="1" opacity="0.3" />
      <line x1="240" y1="215" x2="120" y2="265" stroke="#0D1B2A" strokeWidth="1" opacity="0.3" />
      {/* Dotted path */}
      <circle cx="200" cy="100" r="3" fill="#FF9F00" opacity="0.4" />
      <circle cx="280" cy="140" r="3" fill="#FF9F00" opacity="0.4" />
      <circle cx="300" cy="200" r="3" fill="#FF9F00" opacity="0.4" />
    </svg>

    {/* Bottom-left corner illustration */}
    <svg
      className="absolute bottom-0 left-0 w-80 h-80 md:w-[400px] md:h-[400px] opacity-[0.03] md:opacity-[0.08]"
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Truck illustration */}
      <rect x="50" y="200" width="80" height="40" rx="4" stroke="#0D1B2A" strokeWidth="2" fill="none" />
      <circle cx="70" cy="260" r="15" stroke="#0D1B2A" strokeWidth="2" fill="none" />
      <circle cx="110" cy="260" r="15" stroke="#0D1B2A" strokeWidth="2" fill="none" />
      {/* Package stack */}
      <rect x="150" y="150" width="50" height="40" rx="4" stroke="#FF9F00" strokeWidth="1.5" fill="none" />
      <rect x="155" y="140" width="40" height="35" rx="4" stroke="#FF9F00" strokeWidth="1.5" fill="none" />
      {/* Location pins */}
      <circle cx="100" cy="100" r="8" fill="#FF9F00" opacity="0.3" />
      <circle cx="200" cy="80" r="8" fill="#FF9F00" opacity="0.3" />
      <circle cx="250" cy="150" r="8" fill="#FF9F00" opacity="0.3" />
      {/* Connection path */}
      <path
        d="M100 100 L200 80 L250 150"
        stroke="#0D1B2A"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.2"
        fill="none"
      />
    </svg>
  </div>
);

const FAQ = () => {
  const items = useMemo(() => faqs, []);

  return (
          <section
            className="w-full relative py-3 md:py-6 pb-2 md:pb-4 faq-section-mobile"
            style={{ background: "linear-gradient(to bottom, #CACDD3 0%, #CACDD3 60%, #FFFFFF 100%)" }}
          >
      {/* Content container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-3 md:mb-5">
          <h2 
            className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight"
            style={{ color: "#0D1B2A", fontFamily: 'Poppins, ui-sans-serif' }}
          >
            <span className="md:hidden">FAQ</span>
            <span className="hidden md:inline">FREQUENTLY ASKED QUESTIONS</span>
          </h2>
        </div>

        {/* FAQ Container - Two Column Layout for Desktop */}
        <div className="flex flex-col md:flex-row items-stretch px-4 md:px-6 gap-6 md:gap-8 lg:gap-12">
          {/* FAQ Accordion - Left Side */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <Accordion type="single" collapsible className="space-y-1.5">
            {items.map(({ id, question, answer, Illustration }) => (
              <AccordionItem
                key={id}
                value={id}
                className="border rounded-md bg-white transition-all duration-300"
                style={{ 
                  borderColor: "#E2E8F0",
                  borderRadius: "6px",
                  boxShadow: "rgba(0, 0, 0, 0.06) 0px 2px 8px, rgba(0, 0, 0, 0.04) 0px 1px 2px"
                }}
              >
                <AccordionTrigger
                  className="px-2.5 md:px-4 lg:px-5 py-1.5 md:py-2.5 lg:py-3 rounded-md hover:no-underline data-[state=open]:rounded-t-md data-[state=open]:rounded-b-none"
                >
                  <div className="flex w-full items-center gap-1.5">
                    {/* Question icon - simplified (no circle) */}
                    <HelpCircle className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" style={{ color: "#FF9F00" }} />
                    
                    {/* Question text */}
                    <div className="flex-1 text-left">
                      <div 
                        className="font-bold text-[10px] md:text-sm lg:text-base"
                        style={{ color: "#1E293B" }}
                      >
                        {question}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent>
                  <div
                    className="mx-1.5 mb-1.5 mt-0.5 rounded-md p-2 md:p-3 lg:p-4 flex items-start gap-2 md:gap-3 transition-all duration-300"
                    style={{
                      backgroundColor: "#FFF9F3",
                      borderLeft: "2px solid #FF9F00",
                    }}
                  >
                    {/* Answer text */}
                    <div className="flex-1">
                      <p 
                        className="leading-relaxed text-[10px] md:text-xs lg:text-sm"
                        style={{ 
                          color: "#64748B",
                          lineHeight: "1.4"
                        }}
                      >
                        {answer}
                      </p>
                    </div>
                    
                    {/* Illustration icon - hidden on mobile */}
                    <div className="hidden md:block shrink-0">
                      <div 
                        className="h-8 w-8 rounded-md flex items-center justify-center"
                        style={{ 
                          backgroundColor: "white",
                          border: "1px solid rgba(255, 159, 0, 0.2)"
                        }}
                      >
                        <Illustration className="h-4 w-4 object-contain" style={{ maxWidth: "16px", maxHeight: "16px" }} />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          </div>
          
          {/* FAQ Image - Right Side (Desktop only) */}
          <div className="hidden md:flex md:w-1/2 items-center justify-center">
            <img 
              src={faqImage} 
              alt="FAQ" 
              className="w-full h-auto max-w-md object-contain"
            />
          </div>
        </div>
      </div>

      {/* Mobile spacing styles */}
      <style>{`
        @media (max-width: 767px) {
          .faq-section-mobile {
            padding-top: 48px !important;
            padding-bottom: 48px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default FAQ;


