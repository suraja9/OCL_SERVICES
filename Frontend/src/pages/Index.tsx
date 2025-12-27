import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import TrustStrip from "@/components/TrustStrip";
import FeatureCards from "@/components/FeatureCards";
import SchedulePickupSection from "@/components/SchedulePickupSection";
import NeedHelpCard from "@/components/NeedHelpCard";
import PartnersScroll from "@/components/PartnersScroll";
import CustomerReviews from "@/components/CustomerReviews";
import FAQ from "@/components/FAQ";
import StatsSection from "@/components/StatsSection";
import TrustStatsSection from "@/components/TrustStatsSection";
// import TrackingSection from "@/components/TrackingSection";
import Footer from "@/components/Footer";
import WavyDivider from "@/components/WavyDivider";
import ScrollToTop from "@/components/ScrollToTop";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Index = () => {
  const heroAnimation = useScrollAnimation();
  const featuresAnimation = useScrollAnimation();
  // const trackingAnimation = useScrollAnimation();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div ref={heroAnimation.ref} className={`transition-all duration-700 ${heroAnimation.className}`}>
        <HeroCarousel />
      </div>
      <StatsSection />
      
      <TrustStatsSection />

      <div ref={featuresAnimation.ref} className={`transition-all duration-700 ${featuresAnimation.className}`}>
        <FeatureCards />
      </div>
      
      <SchedulePickupSection />
      
      <PartnersScroll />
      
      <FAQ />

      <NeedHelpCard />
      
      <CustomerReviews />
      
      {/* Tracking section removed per request */}
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
