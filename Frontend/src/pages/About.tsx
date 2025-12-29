import { motion } from "framer-motion";
import { Truck, ShoppingCart, FileText, Briefcase, CheckCircle, MapPin, Heart, Headphones, ArrowRight, Package, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import about1Img from "@/assets/about-1.png";
import about2Img from "@/assets/about-2.png";
import aboutUsImg from "@/assets/about-us.png";
import shippingNetworkImg from "@/assets/shipping-network.jpg";
import googleImg from "@/assets/google.jpg";
import dedicatedSupportImg from "@/assets/dedicated-support.png";
import expressDeliveryImg from "@/assets/express-delivery.png";
import businessImg from "@/assets/business.png";

const About = () => {
    const darkNavy = "#0D1B2A";
    const orange = "#FFA019";

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Banner Section */}
            <section 
                className="relative w-full min-h-[40vh] sm:min-h-[75vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden"
                style={{
                    backgroundImage: `url(${aboutUsImg})`,
                    backgroundAttachment: window.innerWidth > 768 ? "fixed" : "scroll",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                }}
            >
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
                </div>
                
                <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 lg:gap-32 items-center">
                        {/* Text Content - Left */}
                        <motion.div
                            className="text-center md:text-left mt-8 md:mt-12"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <h1
                                className="text-[30px] sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight tracking-tight"
                                style={{ color: "#FFFFFF" }}
                            >
                                About<br />
                                <span style={{ color: orange }}>OCL</span> Services
                            </h1>
                            <div className="hidden md:block max-w-2xl">
                                <p
                                    className="text-base sm:text-lg md:text-xl lg:text-2xl font-light leading-relaxed"
                                    style={{ color: "#FFFFFF" }}
                                >
                                    We deliver consistent service that builds lasting relationships. Whether it's large machines or critical components, we get them from one location to the next smoothly, efficiently, and without complications.
                                </p>
                            </div>
                        </motion.div>

                        {/* Glass Card - Right (Desktop Only) */}
                        <motion.div
                            className="hidden md:block mt-14 flex justify-end"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            <div 
                                className="rounded-lg max-w-sm md:max-w-xs lg:max-w-md w-full h-56 md:h-52 lg:h-64 overflow-hidden"
                                style={{
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    backgroundImage: `url(${aboutUsImg})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    boxShadow: 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px'
                                }}
                            >
                            </div>
                        </motion.div>
                    </div>
                    
                </div>
            </section>

            {/* Two-Column About Section */}
            <section className="pt-6 pb-4 sm:pt-8 sm:pb-6 md:py-10 bg-white">
                <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 md:gap-8 lg:gap-16 items-center">
                        {/* Heading - Mobile Only */}
                        <motion.div
                            className="md:hidden order-1 mb-2"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2
                                className="text-2xl sm:text-3xl font-bold leading-tight text-center"
                                style={{ color: darkNavy }}
                            >
                                Delivering Excellence in <span style={{ color: orange }}>Logistics</span>
                            </h2>
                        </motion.div>

                        {/* Text Content - Left */}
                        <motion.div
                            className="order-3 lg:order-1"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            {/* Desktop: Heading */}
                            <h2
                                className="hidden md:block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight text-left"
                                style={{ color: darkNavy }}
                            >
                                Delivering Excellence in <span style={{ color: orange }}>Logistics</span>
                            </h2>
                            {/* Mobile: Paragraph Description */}
                            <div className="md:hidden text-center space-y-2">
                                <p className="text-base font-light leading-relaxed mx-auto" style={{ color: "#4A5568", maxWidth: "95%" }}>
                                    We specialize in moving heavy construction machinery, industrial equipment, machine parts, and bulk cargo across India with precision and care.
                                </p>
                                <p className="text-base font-light leading-relaxed mx-auto" style={{ color: "#4A5568", maxWidth: "92%" }}>
                                    Our comprehensive logistics solutions ensure safe handling and reliable delivery for every shipment, from small components to massive industrial equipment.
                                </p>                                
                            </div>
                            {/* Desktop: Paragraph Description */}
                            <div className="hidden md:block max-w-xl">
                                <p className="text-sm sm:text-base md:text-lg font-light leading-relaxed" style={{ color: "#4A5568" }}>
                                    We specialize in moving heavy construction machinery, industrial equipment, machine parts, and bulk cargo across India with precision and care.
                                </p>
                                <p className="text-sm sm:text-base md:text-lg font-light leading-relaxed mt-4" style={{ color: "#4A5568" }}>
                                    Our comprehensive logistics solutions ensure safe handling and reliable delivery for every shipment, from small components to massive industrial equipment.
                                </p>
                            </div>
                        </motion.div>

                        {/* Image - Right */}
                        <motion.div
                            className="relative overflow-hidden rounded-lg flex justify-center order-2 lg:order-2 mt-0 md:mt-14"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="aspect-[4/3] relative w-full max-w-lg bg-white overflow-hidden rounded-lg">
                                <img
                                    src={about1Img}
                                    alt="OCL Logistics Services"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Dark Mission Section */}
            <section 
                className="pt-8 pb-4 sm:pt-10 sm:pb-6 md:py-16 relative"
                style={{ backgroundColor: "#000000" }}
            >
                <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-8 lg:gap-16 items-center">
                        {/* Image - Left */}
                        <motion.div
                            className="relative overflow-hidden rounded-lg order-2 lg:order-1 flex justify-center"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="aspect-[4/3] relative w-full max-w-lg">
                                <img
                                    src={about2Img}
                                    alt="OCL Team"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            </div>
                        </motion.div>

                        {/* Heading - Mobile Only */}
                        <motion.div
                            className="md:hidden order-1"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2
                                className="text-2xl sm:text-3xl font-bold mb-6 leading-tight text-center break-words"
                                style={{ color: "#FFFFFF" }}
                            >
                                Making <span style={{ color: orange }}>Logistics</span> Simple & Stress-Free
                            </h2>
                        </motion.div>

                        {/* Text Content - Right */}
                        <motion.div
                            className="order-3 lg:order-2"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            {/* Desktop: Heading */}
                            <h2
                                className="hidden md:block text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold mb-6 sm:mb-8 leading-tight text-left break-words"
                                style={{ color: "#FFFFFF" }}
                            >
                                Making <span style={{ color: orange }}>Logistics</span> Simple & Stress-Free
                            </h2>
                            {/* Mobile: Paragraph Description */}
                            <div className="md:hidden text-center space-y-2">
                                <p className="text-base font-light leading-relaxed mx-auto" style={{ color: "#FFFFFF", maxWidth: "95%" }}>
                                    We keep logistics simple and straightforward. Every shipment is trackable with clear updates, and our services are built around real client needs.
                                </p>
                                <p className="text-base font-light leading-relaxed mx-auto" style={{ color: "#FFFFFF", maxWidth: "92%" }}>
                                    Support stays consistent throughout the journey, ensuring your peace of mind from start to finish.
                                </p>
                            </div>
                            {/* Desktop: Paragraph Description */}
                            <div className="hidden md:block">
                                <p className="text-base md:text-lg font-light text-white/90 leading-relaxed">
                                    We keep logistics simple and straightforward. Every shipment is trackable with clear updates, and our services are built around real client needs.
                                </p>
                                <p className="text-base md:text-lg font-light text-white/90 leading-relaxed mt-4">
                                    Support stays consistent throughout the journey, ensuring your peace of mind from start to finish.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Service Specialization Cards Section */}
            <section className="py-8 sm:py-10 md:py-16 bg-white">
                <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
                    <motion.div
                        className="text-center mb-8 md:mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
                            style={{ color: darkNavy }}
                        >
                            <span style={{ color: orange }}>We</span> Specialize In
                        </h2>
                        <div className="w-24 h-1 mx-auto" style={{ backgroundColor: orange }} />
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3 md:gap-4 max-w-4xl mx-auto">
                        {[
                            { 
                                text: "Domestic Courier & Logistics Services", 
                                icon: Truck,
                                description: "Comprehensive domestic shipping solutions across India"
                            },
                            { 
                                text: "E-Commerce Logistics & Last-Mile Delivery", 
                                icon: ShoppingCart,
                                description: "End-to-end e-commerce fulfillment and delivery"
                            },
                            { 
                                text: "Document & Parcel Express Services", 
                                icon: FileText,
                                description: "Fast and secure document and parcel delivery"
                            },
                            { 
                                text: "Customized Business Logistics Solutions", 
                                icon: Briefcase,
                                description: "Tailored logistics solutions for your business needs"
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                className="bg-white rounded-lg p-3 md:p-4"
                                style={{ 
                                    border: "1px solid #E2E8F0",
                                    boxShadow: "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px",
                                }}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <div className="flex items-start gap-2.5">
                                    <div className="flex-shrink-0 specialize-icon-align">
                                        <item.icon 
                                            className="w-4 h-4 md:w-5 md:h-5"
                                            style={{ color: orange }}
                                            strokeWidth={2}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 
                                            className="text-sm md:text-base font-bold mb-1"
                                            style={{ color: darkNavy }}
                                        >
                                            {item.text}
                                        </h3>
                                        <p 
                                            className="text-xs leading-relaxed"
                                            style={{ color: "#64748B" }}
                                        >
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="py-6 sm:py-8 md:py-10 bg-white">
                <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
                    <motion.div
                        className="text-center mb-6 md:mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight"
                            style={{ color: darkNavy }}
                        >
                            Why <span style={{ color: orange }}>Choose</span> Us
                        </h2>
                        <div className="w-24 h-1 mx-auto" style={{ backgroundColor: orange }} />
                    </motion.div>

                    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-6 lg:gap-8 max-w-4xl mx-auto">
                        {[
                            {
                                image: dedicatedSupportImg,
                                title: "Customer-Centric",
                                description: "We prioritize your needs with dedicated support teams and personalized service. Our commitment ensures meaningful interactions and prompt responses."
                            },
                            {
                                image: expressDeliveryImg,
                                title: "On-Time Delivery",
                                description: "Timely deliveries across India with our extensive network and optimized routes. Advanced tracking keeps you informed at every step."
                            },
                            {
                                image: businessImg,
                                title: "Smart Solutions",
                                description: "Customized logistics solutions that scale with your business. Our technology-driven approach adapts to your unique requirements."
                            }
                        ].map((card, index) => (
                            <motion.div
                                key={index}
                                className="rounded-lg md:rounded-none md:rounded-tl-lg md:rounded-tr-lg md:rounded-br-lg md:rounded-bl-[2rem] p-3 md:p-4 text-center"
                                style={{
                                    backgroundColor: "#FAF2E7",
                                    boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px",
                                }}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, delay: index * 0.15 }}
                            >
                                <div 
                                    className="inline-flex items-center justify-center mb-2 md:mb-3 mx-auto w-[60px] h-[60px] md:w-12 md:h-12 lg:w-14 lg:h-14"
                                >
                                    <div
                                        className="w-full h-full rounded-full overflow-hidden"
                                        style={{ 
                                            backgroundColor: `${orange}15`,
                                        }}
                                    >
                                        <img 
                                            src={card.image} 
                                            alt={card.title}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                </div>
                                <h3
                                    className="text-xs md:text-base lg:text-lg font-bold mb-2"
                                    style={{ color: darkNavy }}
                                >
                                    {card.title}
                                </h3>
                                <p 
                                    className="hidden md:block text-xs lg:text-sm leading-relaxed"
                                    style={{ color: "#64748B" }}
                                >
                                    {card.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Growth/Impact Section with Gradient Background */}
            <section 
                className="py-8 md:py-12 relative overflow-hidden growth-impact-section"
                style={{
                    background: `linear-gradient(135deg, ${darkNavy} 0%, #1A2332 50%, ${darkNavy} 100%)`
                }}
            >
                <div className="absolute inset-0 opacity-40">
                    <div 
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url(${googleImg})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                        }}
                    />
                </div>
                
                <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl relative z-10">
                    <motion.div
                        className="text-center pt-8 md:pt-0"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 md:mb-10 leading-tight px-8"
                            style={{ color: "#FFFFFF" }}
                        >
                            <span style={{ color: orange }}>We</span> Help Businesses Grow Faster and Bigger
                        </h2>
                        <p 
                            className="hidden md:block text-base sm:text-lg md:text-xl font-light max-w-3xl mx-auto leading-relaxed mb-0 px-2 mt-2 sm:mt-8 md:mt-8"
                            style={{ color: "#FFFFFF" }}
                        >
                            Partner with OCL Services to streamline your logistics operations and scale your business with confidence.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Strong CTA Footer Section */}
            <section className="hidden md:block py-10 md:py-12 bg-white border-t-2" style={{ borderColor: "#E2E8F0" }}>
                <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight"
                            style={{ color: darkNavy }}
                        >
                            Ready to Get Started?
                        </h2>
                        <p 
                            className="text-base sm:text-lg md:text-xl font-light mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4"
                            style={{ color: "#64748B" }}
                        >
                            Experience the difference that professional logistics can make for your business.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
                            <Link to="/enquiry">
                                <Button
                                    size="lg"
                                    className="px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 w-full sm:w-auto min-h-[44px] hover:shadow-none"
                                    style={{
                                        backgroundColor: orange,
                                        color: "#FFFFFF",
                                        boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px",
                                    }}
                                >
                                    Get Custom Quote
                                </Button>
                            </Link>
                            <Link to="/contact" className="w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 hover:bg-[#FFA019] hover:text-white hover:shadow-none w-full sm:w-auto min-h-[44px]"
                                    style={{
                                        border: "none",
                                        color: darkNavy,
                                        boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px",
                                    }}
                                >
                                    Contact Expert
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
            
            <style>{`
                /* Mobile: Align icons with titles by moving them down slightly */
                @media (max-width: 767px) {
                    .specialize-icon-align {
                        margin-top: 3px;
                    }
                    /* Remove bottom border/line on mobile for Growth Impact section */
                    .growth-impact-section {
                        border-bottom: none !important;
                        border: none !important;
                    }
                    .growth-impact-section::after {
                        display: none !important;
                        content: none !important;
                        border: none !important;
                    }
                    .growth-impact-section::before {
                        display: none !important;
                        content: none !important;
                        border: none !important;
                    }
                    /* Also check if footer border is showing through */
                    footer.bg-black.border-t-2 {
                        border-top: none !important;
                    }
                }
                
                /* Desktop: Remove shadow on button hover */
                @media (min-width: 768px) {
                    section button.hover\\:shadow-none:hover {
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default About;
