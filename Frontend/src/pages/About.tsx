import { motion } from "framer-motion";
import { Truck, ShoppingCart, FileText, Briefcase, CheckCircle, MapPin, Heart, Headphones, ArrowRight } from "lucide-react";
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
                className="relative w-full min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden"
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
                
                <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10 max-w-6xl">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h1
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight tracking-tight px-4"
                            style={{ color: "#FFFFFF" }}
                        >
                            About <span style={{ color: orange }}>OCL</span> Services
                        </h1>
                        <p
                            className="text-base sm:text-lg md:text-xl lg:text-2xl font-light max-w-3xl mx-auto leading-relaxed px-4"
                            style={{ color: "#FFFFFF" }}
                        >
                            We make sure your shipments reach on time - every time.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Two-Column About Section */}
            <section className="py-8 sm:py-10 md:py-16 bg-white">
                <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
                        {/* Text Content - Left */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2
                                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight"
                                style={{ color: darkNavy }}
                            >
                                Delivering Excellence in <span style={{ color: orange }}>Logistics</span>
                            </h2>
                            <div className="space-y-4 text-sm sm:text-base md:text-lg leading-relaxed text-justify" style={{ color: "#4A5568" }}>
                                <p>
                                    OCL Services moves heavy construction machinery, industrial equipment, machine parts, and bulk cargo across India with a simple focus - safe handling and reliable delivery.
                                </p>
                                <p>
                                    The Image reflects how we work: consistent service that builds long-term relationships with our clients. Whether it's large machines or critical components, our job is to get them from one location to the next smoothly, efficiently, and without complications.
                                </p>
                            </div>
                        </motion.div>

                        {/* Image - Right */}
                        <motion.div
                            className="relative overflow-hidden rounded-lg"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="aspect-[4/3] relative">
                                <img
                                    src={about1Img}
                                    alt="OCL Logistics Services"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Dark Mission Section */}
            <section 
                className="py-8 sm:py-10 md:py-16 relative"
                style={{ backgroundColor: "#000000" }}
            >
                <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
                        {/* Image - Left */}
                        <motion.div
                            className="relative overflow-hidden rounded-lg order-2 lg:order-1"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="aspect-[4/3] relative">
                                <img
                                    src={about2Img}
                                    alt="OCL Team"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            </div>
                        </motion.div>

                        {/* Text Content - Right */}
                        <motion.div
                            className="order-1 lg:order-2"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2
                                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 leading-tight"
                                style={{ color: "#FFFFFF" }}
                            >
                                Making <span style={{ color: orange }}>Logistics</span> Simple & Stress-Free
                            </h2>
                            <ul className="space-y-5">
                                {[
                                    { text: "We keep logistics simple and straightforward.", icon: CheckCircle },
                                    { text: "Every shipment is trackable with clear updates.", icon: MapPin },
                                    { text: "Our services are built around real client needs.", icon: Heart },
                                    { text: "Support stays consistent throughout the journey.", icon: Headphones }
                                ].map((item, index) => (
                                    <motion.li
                                        key={index}
                                        className="flex items-start gap-4"
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.1 * index }}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            <item.icon 
                                                className="w-6 h-6" 
                                                style={{ color: orange }}
                                                strokeWidth={2}
                                            />
                                        </div>
                                        <span className="text-base md:text-lg font-light text-white/90 leading-relaxed">
                                            {item.text}
                                        </span>
                                    </motion.li>
                                ))}
                            </ul>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
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
                                className="bg-white border-2 rounded-lg p-6 md:p-8"
                                style={{ 
                                    borderColor: "#E2E8F0",
                                    boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px",
                                }}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <div className="flex items-start gap-4">
                                    <div 
                                        className="flex-shrink-0 p-3 rounded-lg transition-colors duration-300"
                                        style={{ 
                                            backgroundColor: `${orange}15`,
                                        }}
                                    >
                                        <item.icon 
                                            className="w-6 h-6" 
                                            style={{ color: orange }}
                                            strokeWidth={2}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 
                                            className="text-lg md:text-xl font-bold mb-2"
                                            style={{ color: darkNavy }}
                                        >
                                            {item.text}
                                        </h3>
                                        <p 
                                            className="text-sm md:text-base leading-relaxed"
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
            <section className="py-6 sm:py-8 md:py-10 bg-gray-50">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
                        {[
                            {
                                image: dedicatedSupportImg,
                                title: "Customer-Centric",
                                description: "Focused on transparency and trust. We prioritize your needs with dedicated support teams, clear communication channels, and personalized service. Our commitment to building lasting relationships ensures that every interaction is meaningful and every concern is addressed promptly."
                            },
                            {
                                image: expressDeliveryImg,
                                title: "On-Time Delivery",
                                description: "Every shipment delivered as promised. With our extensive network and optimized routes, we guarantee timely deliveries across India. Our advanced tracking systems keep you informed at every step, ensuring peace of mind and reliability you can count on."
                            },
                            {
                                image: businessImg,
                                title: "Smart Solutions",
                                description: "Tailored logistics for every business need. From small parcels to heavy machinery, we offer customized solutions that scale with your business. Our technology-driven approach and flexible services adapt to your unique requirements, helping you stay competitive in today's market."
                            }
                        ].map((card, index) => (
                            <motion.div
                                key={index}
                                className="rounded-lg p-8 text-center"
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
                                    className="inline-flex items-center justify-center mb-6"
                                    style={{ 
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "50%",
                                        backgroundColor: `${orange}15`,
                                        overflow: "hidden",
                                    }}
                                >
                                    <img 
                                        src={card.image} 
                                        alt={card.title}
                                        className="w-full h-full object-cover"
                                        style={{ borderRadius: "50%" }}
                                    />
                                </div>
                                <h3
                                    className="text-xl md:text-2xl font-bold mb-3"
                                    style={{ color: darkNavy }}
                                >
                                    {card.title}
                                </h3>
                                <p 
                                    className="text-base leading-relaxed"
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
                className="py-16 md:py-24 relative overflow-hidden"
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
                        className="text-center"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight px-4"
                            style={{ color: "#FFFFFF" }}
                        >
                            <span style={{ color: orange }}>We</span> Help Businesses Grow Faster and Bigger
                        </h2>
                        <p 
                            className="text-base sm:text-lg md:text-xl font-light max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10 px-4"
                            style={{ color: "#FFFFFF" }}
                        >
                            Partner with OCL Services to streamline your logistics operations and scale your business with confidence.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Strong CTA Footer Section */}
            <section className="py-16 md:py-20 bg-white border-t-2" style={{ borderColor: "#E2E8F0" }}>
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
                                    className="px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 w-full sm:w-auto min-h-[44px]"
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
                                    className="px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 hover:bg-[#FFA019] hover:text-white w-full sm:w-auto min-h-[44px]"
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
        </div>
    );
};

export default About;
