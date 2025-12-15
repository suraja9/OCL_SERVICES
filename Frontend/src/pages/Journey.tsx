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
      description: "Started operations with a promise of reliability and trust in every shipment.",
      icon: <CheckCircle2 className="h-6 w-6" />,
      metrics: [
        { label: "Day-zero reliability", value: "~50 shipments / week" }
      ]
    },
    {
      id: "2008",
      year: "2008",
      title: "Regional Growth",
      tag: "Expansion",
      description: "Scaled network across regions, expanding routes and service partnerships.",
      icon: <MapPin className="h-6 w-6" />,
      metrics: [
        { label: "Regional network", value: "1,200+ lanes active" }
      ]
    },
    {
      id: "2013",
      year: "2013",
      title: "National Presence",
      tag: "Scale",
      description: "Established presence in major cities across India with dedicated hubs.",
      icon: <MapPin className="h-6 w-6" />
    },
    {
      id: "2017",
      year: "2017",
      title: "Digital Era",
      tag: "Innovation",
      description: "Launched online logistics platform with real-time tracking and booking.",
      icon: <Monitor className="h-6 w-6" />,
      metrics: [
        { label: "Real-time visibility", value: "90%+ tracked live" }
      ]
    },
    {
      id: "2020",
      year: "2020",
      title: "Multi-Modal",
      tag: "Growth",
      description: "Expanded to road + rail delivery for comprehensive coverage.",
      icon: <Plane className="h-6 w-6" />,
      metrics: [
        { label: "Greener routes", value: "-24% CO2 per shipment" }
      ]
    },
    {
      id: "2024",
      year: "2024",
      title: "Specialized",
      tag: "Expertise",
      description: "Industrial logistics launched for heavy and complex loads.",
      icon: <Factory className="h-6 w-6" />,
      metrics: [
        { label: "Global partnerships", value: "3.5M+ shipments / year" }
      ]
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
      <section className="pt-12 md:pt-16 pb-4 md:pb-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-lg text-gray-600">
              Key milestones that shaped our growth from a local courier to a nationwide logistics leader
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-right md:text-right">
              Our Journey
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
