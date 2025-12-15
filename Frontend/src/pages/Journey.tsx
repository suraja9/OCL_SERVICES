import React from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  MapPin, 
  Monitor, 
  Plane, 
  Factory,
  Settings,
  Users,
  Headphones,
  Leaf
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import logisticsBgImg from "@/assets/logistics-bg.jpg";
import AtlasHero from "@/components/journey/AtlasHero";
import AtlasTimeline, { AtlasMilestone } from "@/components/journey/AtlasTimeline";
import HowWeEvolved, { EvolutionCard } from "@/components/journey/HowWeEvolved";
import FutureVision from "@/components/journey/FutureVision";

const Journey = () => {
  // Timeline Milestones
  const timelineMilestones: AtlasMilestone[] = [
    {
      id: "2001",
      year: "2001",
      title: "Foundation Year",
      tag: "Foundation",
      description: "I started OCL Services with nothing but a second-hand pickup, one helper, and a stubborn belief that reliability wins over shortcuts. Logistics in Assam was messy back then, full of delays and excuses. OCL was built to be the opposite - if we promise a date, we deliver on that date.\n\nThe early days were tough, barely 8-10 shipments a week, but every one went out on time. By year end, we grew to nearly 50 shipments a week - not because we were big but because we were consistent.",
      icon: <CheckCircle2 className="h-6 w-6" />,
      metrics: [
        { label: "Day-zero reliability", value: "~50 shipments / week" }
      ]
    },
    {
      id: "2007",
      year: "2007",
      title: "Regional Expansion",
      tag: "Expansion",
      description: "By 2007, we learned that customers don't stick because you are cheap - they stick because you are predictable. Construction companies started choosing us because we never said \"kal ho jayega.\"\n\nWe expanded into Tezpur, Jorhat, Silchar and more, convincing local truck owners to follow the OCL way: no overloads, no excuses, no last-minute changes. Slowly, we became a preferred logistics partner for engineering and construction firms.",
      icon: <MapPin className="h-6 w-6" />,
      metrics: []
    },
    {
      id: "2014",
      year: "2014",
      title: "Growth & Modernisation",
      tag: "Scale",
      description: "Until 2014, everything was manual - registers, diaries, calls. Growth exposed our weak points. Customers needed tracking; we needed transparency.\n\nWe digitized operations, created structured routing systems, improved documentation and started handling bigger industrial consignments - pipes, machinery parts, cable drums. This was the turning point where OCL shifted from a local transporter to a regional logistics system.",
      icon: <Monitor className="h-6 w-6" />
    },
    {
      id: "2020",
      year: "2020",
      title: "The COVID Collapse",
      tag: "Resilience",
      description: "2020 completely broke us. Vehicles stopped, payments froze, three major clients shut projects, and within 45 days OCL collapsed.\n\nIt hurt to watch 19 years of work disappear. But we didn't run. We didn't quit. We waited, regrouped, stayed honest with clients, and survived the storm.",
      icon: <Plane className="h-6 w-6" />,
      metrics: []
    },
    {
      id: "2022",
      year: "2022",
      title: "Revival & Rebuild",
      tag: "Rebirth",
      description: "Two years after COVID, we restarted from absolute zero - no investors, no outside help, only grit.\n\nWe rebuilt routes, regained old clients by proving our consistency again, and earned new ones because people trust companies that survive bad times. This wasn't growth - it was rebirth.",
      icon: <Factory className="h-6 w-6" />,
      metrics: []
    },
    {
      id: "2025",
      year: "2025",
      title: "Future Forward",
      tag: "Innovation",
      description: "Today, OCL Services is stronger than ever. We partner with major construction companies across Assam and the Northeast, moving consignments that actually build cities - heavy pipes, machinery parts, fragile components, cable drums and more.\n\nWe are expanding into smarter scheduling, better tracking and faster inter-city operations - not for marketing, but because our clients depend on reliability.\n\nAfter everything we've survived, one thing is clear: OCL is here for the long run.",
      icon: <Factory className="h-6 w-6" />,
      metrics: []
    }
  ];

  // Evolution Cards
  const evolutionCards: EvolutionCard[] = [
    {
      id: "ops",
      iconLetters: "Op",
      title: "Operations",
      description: "Standardized processes and 24/7 control towers ensure consistent execution across all hubs and partners."
    },
    {
      id: "tech",
      iconLetters: "Tx",
      title: "Technology",
      description: "APIs and real-time data streams connect carriers, warehouses, and shippers into a single source of truth."
    },
    {
      id: "service",
      iconLetters: "Cs",
      title: "Customer Service",
      description: "Dedicated account teams, proactive notifications, and clear SLAs keep every stakeholder aligned."
    },
    {
      id: "sustainability",
      iconLetters: "Su",
      title: "Sustainability",
      description: "Emission-aware routing, modal shifts, and consolidated loads reduce carbon intensity per shipment."
    }
  ];


  // Future Vision Tags
  const futureTags = [
    "AI Tracking",
    "Predictive Forecasting",
    "Better Fleet Management",
    "Deeper Integrations",
    "Real-time Analytics",
    "Automated Routing"
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* 1. HERO SECTION */}
      <AtlasHero image={logisticsBgImg} imageAlt="OCL Logistics Operations" />

      {/* 2. HORIZONTAL TIMELINE */}
      <section className="pt-8 sm:pt-12 md:pt-16 pb-4 md:pb-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-base sm:text-lg text-gray-600">
              Key milestones that shaped our growth from a local courier to a nationwide logistics leader
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center md:text-center">
              <span className="text-[#FFA019]">Our</span> Journey
            </h2>
          </motion.div>
          <AtlasTimeline milestones={timelineMilestones} />
        </div>
      </section>


      {/* 4. HOW WE EVOLVED */}
      <HowWeEvolved cards={evolutionCards} />

      {/* 5. FUTURE VISION */}
      <FutureVision tags={futureTags} />

      <Footer />
    </div>
  );
};

export default Journey;
