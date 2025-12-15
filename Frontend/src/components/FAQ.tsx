import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { useMemo } from "react";
import faqImage from "@/assets/faq.png";
import distributionIcon from "@/Icon-images/distribution.png";
import packageIcon from "@/Icon-images/package.png";
import laptopIcon from "@/Icon-images/laptop.png";

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
            className="w-full relative py-6 md:py-10"
            style={{ background: "linear-gradient(to bottom, #CACDD3 0%, #CACDD3 60%, #FFFFFF 100%)" }}
          >
      {/* Content container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 
            className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight"
            style={{ color: "#0D1B2A", fontFamily: 'Poppins, ui-sans-serif' }}
          >
            FREQUENTLY ASKED QUESTIONS
          </h2>
        </div>

        {/* Two Column Layout: FAQ on Left, Image on Right */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-8 md:gap-12">
          {/* FAQ Container - Left Side */}
          <div className="w-full md:w-[55%] flex flex-col justify-center">
            <Accordion type="single" collapsible className="space-y-2.5">
            {items.map(({ id, question, answer, Illustration }) => (
              <AccordionItem
                key={id}
                value={id}
                className="border rounded-xl bg-white transition-all duration-300"
                style={{ 
                  borderColor: "#E2E8F0",
                  borderRadius: "12px",
                  boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"
                }}
              >
                <AccordionTrigger
                  className="px-3 md:px-4 py-2.5 md:py-3 rounded-xl hover:no-underline data-[state=open]:rounded-t-xl data-[state=open]:rounded-b-none"
                >
                  <div className="flex w-full items-center gap-2.5">
                    {/* Question mark icon */}
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "#FFF2E0" }}
                    >
                      <HelpCircle className="h-3.5 w-3.5" style={{ color: "#FF9F00" }} />
                    </div>
                    
                    {/* Question text */}
                    <div className="flex-1 text-left">
                      <div 
                        className="font-bold text-sm md:text-base"
                        style={{ color: "#1E293B" }}
                      >
                        {question}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent>
                  <div
                    className="mx-3 mb-3 mt-1 rounded-lg p-3 md:p-4 flex items-start gap-3 transition-all duration-300"
                    style={{
                      backgroundColor: "#FFF9F3",
                      borderLeft: "4px solid #FF9F00",
                    }}
                  >
                    {/* Answer text */}
                    <div className="flex-1">
                      <p 
                        className="leading-relaxed"
                        style={{ 
                          color: "#64748B",
                          fontSize: "14px",
                          lineHeight: "1.5"
                        }}
                      >
                        {answer}
                      </p>
                    </div>
                    
                    {/* Illustration icon - hidden on mobile */}
                    <div className="hidden md:block shrink-0">
                      <div 
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ 
                          backgroundColor: "white",
                          border: "1px solid rgba(255, 159, 0, 0.2)"
                        }}
                      >
                        <Illustration className="h-5 w-5 object-contain" style={{ maxWidth: "20px", maxHeight: "20px" }} />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          </div>

          {/* Image Container - Right Side */}
          <div className="w-full md:w-[40%] flex items-center justify-center">
            <div className="w-full max-w-md">
              <img
                src={faqImage}
                alt="FAQ Illustration"
                className="w-full h-auto object-contain"
                style={{ maxHeight: "500px" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;


