import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ShippingAndReturnPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <motion.section
        className="relative w-full py-16 md:py-24"
        style={{ backgroundColor: "#FFD54F" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4"
              style={{ color: "#0D1B2A" }}
            >
              Shipping & Return Policy
            </h1>
            <p
              className="text-sm sm:text-base md:text-lg lg:text-xl font-light max-w-3xl mx-auto"
              style={{ color: "#0D1B2A" }}
            >
              Understanding our shipping processes, timelines, delivery standards, and return policies
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Content Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6 md:p-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="prose prose-lg max-w-none">
              {/* Introduction */}
              <div className="mb-8">
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4 text-justify">
                  This Shipping & Return Policy outlines our shipping processes, service areas, return policies, and important information regarding your shipments. 
                  By using our shipping services, you agree to the terms outlined in this policy. Please read this policy carefully to understand how we handle 
                  your shipments and what you can expect from our services.
                </p>
              </div>

              {/* Service Areas */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  1. Service Areas and Coverage
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      1.1 Our Service Network
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                      Our main area of service is North East India, with our office located in Guwahati. We provide:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>Shipping services from North East to the entire country</li>
                      <li>Shipping services from other places across India to North East</li>
                      <li>Domestic shipping across all major cities, towns, and rural areas (subject to serviceability)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      1.2 Serviceability Check
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                      Before booking a shipment, please verify serviceability to your destination using our online serviceability checker. 
                      Service availability may vary based on location, and we reserve the right to refuse service to areas where we do not operate.
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Options */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  2. Shipping Options and Services
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      2.1 Standard Delivery
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                      Our standard delivery service provides reliable shipping for all types of shipments. This service is available 
                      for all destinations across India.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      2.2 Priority Delivery
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                      For urgent deliveries, we offer priority delivery service with faster processing and transit. Priority delivery 
                      is subject to availability and may incur additional charges.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      2.3 Specialized Services
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                      While our main specialization is construction-related shipping, we also offer specialized shipping services including:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>Construction materials and equipment shipping (our main specialization)</li>
                      <li>Medicine and pharmaceutical deliveries</li>
                      <li>Document courier services</li>
                      <li>Corporate bulk shipping</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Packaging Requirements */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  3. Packaging Requirements
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                  Proper packaging is essential to ensure the safety of your shipment during transit:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                  <li>Use sturdy boxes or containers appropriate for the item being shipped</li>
                  <li>Ensure adequate cushioning and padding to prevent damage</li>
                  <li>Seal packages securely with strong tape</li>
                  <li>Include clear labeling with recipient address and contact information</li>
                  <li>Ensure packages can withstand normal handling during transit</li>
                </ul>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-3 text-justify">
                  While we handle all shipments with care, we are not responsible for damage caused by inadequate packaging. 
                  We reserve the right to refuse shipments that are improperly packaged.
                </p>
              </div>

              {/* Online Booking Requirements */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  3.1 Online Booking Requirements
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                  For shipments booked through our online platform, products must remain in an open or unsealed condition at the time of pickup. 
                  This allows our pickup personnel to verify the contents of the shipment for accuracy, compliance with our restricted items policy, 
                  and proper documentation. Packages may be sealed after verification is complete during the pickup process. 
                  We reserve the right to refuse pickup if products are sealed or packaged in a manner that prevents content verification.
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  This verification process helps ensure the safety and security of all shipments in our network and compliance with shipping regulations.
                </p>
              </div>

              {/* Tracking and Updates */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  4. Tracking and Shipment Updates
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      4.1 Real-Time Tracking
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                      All shipments are assigned a unique tracking number that allows you to monitor your package in real-time through our website 
                      or mobile application. You can track your shipment at any stage of the delivery process.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      4.2 SMS and Email Notifications
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                      We provide automatic transactional SMS and email updates at key stages during transhipment:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>When your shipment is picked up</li>
                      <li>When it reaches a transit hub</li>
                      <li>When it's out for delivery</li>
                      <li>When delivery is completed or if there are any issues</li>
                    </ul>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-2 text-justify">
                      By using our services, consignors and consignees agree to accept transactional SMS notifications sent by OCL during transhipment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Process */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  5. Delivery Process
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      5.1 Delivery Address
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                      Please ensure the delivery address is complete, accurate, and includes landmarks if necessary. We deliver to the address 
                      provided at the time of booking. Any changes to the delivery address after pickup may incur additional charges and may 
                      delay delivery.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      5.2 Delivery Requirements
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                      For successful delivery:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>Recipient or authorized person must be available at the delivery address</li>
                      <li>Valid identification may be required for certain shipments</li>
                      <li>Payment must be completed (for TO PAY shipments) before delivery</li>
                      <li>Recipient must inspect the package before signing for delivery</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      5.3 Failed Deliveries
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                      We make up to 3 delivery attempts at the provided address. If delivery cannot be completed due to incorrect address, 
                      recipient unavailability, or refusal to accept, the shipment will be held at our service center for a maximum of 10 days. 
                      After this period, the shipment may be returned to the sender or disposed of as per our terms and conditions. 
                      Additional charges may apply for re-delivery or return to sender.
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Charges */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  6. Shipping Charges and Payment
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      6.1 Pricing and Chargeable Weight
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                      Shipping charges are calculated based on chargeable weight (actual or volumetric, whichever is higher), distance, service type 
                      (Standard or Priority), and any additional services requested. The chargeable weight is rounded off to the next higher half Kg or one Kg 
                      (or as per the rate category agreed to). Prices are displayed at the time of booking and are subject to applicable taxes.
                    </p>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                      <strong>Volumetric Weight Calculation:</strong> Volumetric weight (in Kg) = (Length × Width × Height in cm) ÷ 5000
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      6.2 Payment Options
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                      We accept various payment methods:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>Online payment (credit/debit cards, UPI, net banking)</li>
                      <li>TO Pay (COD) - available for select shipments</li>
                      <li>Corporate accounts with credit terms</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      6.3 Additional Charges
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                      Additional charges may apply for:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>Address correction or redirection</li>
                      <li>Re-delivery attempts after failed delivery</li>
                      <li>Storage charges for undelivered shipments</li>
                      <li>State and local taxes, and import duties (to be borne by consignee or consignor)</li>
                      <li>Customs duties and taxes (for applicable shipments)</li>
                      <li>Special handling requirements</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      6.4 Insurance
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                      While OCL has developed a sophisticated tracking system and experienced manpower to handle all shipments, insurance coverage 
                      is optional and available at the consignor's own cost. Consignors may choose to insure their shipments if desired.
                    </p>
                  </div>
                </div>
              </div>

              {/* Restrictions and Prohibited Items */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  7. Restricted and Prohibited Items
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                  Certain items are restricted or prohibited from shipping. OCL does not carry perishable goods. Please refer to our Restricted Items policy 
                  for a complete list. Common prohibited items include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                  <li>Perishable goods (OCL does not carry perishable items)</li>
                  <li>Hazardous materials and dangerous goods (as classified by IATA, ICAO, or applicable government departments)</li>
                  <li>Illegal substances and contraband</li>
                  <li>Live animals</li>
                  <li>Currency, bearer negotiable instruments, bullion, precious metals and stones</li>
                  <li>Firearms, parts thereof, and ammunition</li>
                  <li>Human remains</li>
                  <li>Pornography and illegal narcotics/drugs</li>
                  <li>Items not permitted by laws/rules/restrictions in force</li>
                  <li>Items that cannot be transported safely or legally</li>
                </ul>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-3 text-justify">
                  Shipping prohibited items may result in legal action, and we reserve the right to refuse or dispose of such shipments. 
                  Details of restricted items are available at all OCL offices on request and on our website.
                </p>
              </div>

              {/* Delays and Issues */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  8. Delays and Delivery Issues
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      8.1 Causes of Delay
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                      Delivery delays may occur due to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>Weather conditions and natural disasters</li>
                      <li>Public holidays and festivals</li>
                      <li>Customs clearance delays</li>
                      <li>Incorrect or incomplete address</li>
                      <li>Recipient unavailability</li>
                      <li>Transportation disruptions</li>
                      <li>Force majeure events</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      8.2 Reporting Issues
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                      If you experience any issues with your shipment, please contact our customer support team immediately. 
                      We will investigate and work to resolve the issue as quickly as possible.
                    </p>
                  </div>
                </div>
              </div>

              {/* Return Policy Section */}
              <div className="mb-8 mt-12 pt-8 border-t-2 border-gray-300">
                <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: "#0D1B2A" }}>
                  Return Policy
                </h2>

                {/* Return Charges */}
                <div className="mb-8">
                  <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                    1. Return Charges
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                    If a shipment is returned for any reason (refusal, wrong address, unavailability, or sender request), the sender/receipient have to pay the return shipping charge.
                  </p>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                    Return charges are billed based on the same factors as the original shipment (weight, distance, service type).
                  </p>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                    Return charges must be cleared before dispatching the return.
                  </p>
                </div>

                {/* Compensation for Loss or Damage */}
                <div className="mb-8">
                  <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                    2. Compensation for Loss or Damage
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                    If a shipment is lost or damaged during transit (forward or return), OCL will pay a flat compensation of ₹250.00 not more then that, irrespective of the shipment's value.
                  </p>
                </div>

                {/* TO PAY Returns */}
                <div className="mb-8">
                  <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                    3. TO PAY Returns
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                    For returned TO PAY shipments:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                    <li>Only the collected TO PAY amount (if any) will be reversed.</li>
                    <li>Return charges and applicable fees are deducted first.</li>
                    <li>Settlement is processed within 7–14 working days.</li>
                  </ul>
                </div>

                {/* Non-Refundable Charges */}
                <div className="mb-8">
                  <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                    4. Non-Refundable Charges
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                    The following are never refunded:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                    <li>Original shipping cost</li>
                    <li>Return shipping cost</li>
                    <li>Handling or additional service fees</li>
                  </ul>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-3 text-justify">
                    Only the ₹250.00 compensation applies for eligible loss/damage cases not more then that1.
                  </p>
                </div>

                {/* Filing a Claim */}
                <div className="mb-8">
                  <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                    5. Filing a Claim
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                    To claim the ₹250.00 compensation (for loss or damage), the sender must provide:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                    <li>Tracking/Docket Number</li>
                    <li>Proof of contents</li>
                    <li>Proof of damage (if applicable)</li>
                  </ul>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-3 text-justify">
                    Claims must be filed within 7 days.
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-8 p-6 bg-yellow-50 rounded-lg border-l-4" style={{ borderColor: "#FFC043" }}>
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  Contact Us
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                  For questions, concerns, or assistance regarding shipping and returns, please contact us:
                </p>
                <div className="space-y-2 text-sm md:text-base text-gray-700">
                  <p><strong>OCL</strong></p>
                  <p>Piyali Phukan Road, Rehabari, Guwahati, 781008</p>
                  <p>Phone: +91 76360 96733</p>
                  <p>Email: info@oclservices.com</p>
                  <p className="mt-3">
                    <strong>Customer Service Hours:</strong> Monday to Saturday ( 9:45 AM to 7:00 PM IST )
                  </p>
                </div>
              </div>

              {/* Last Updated */}
              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ShippingAndReturnPolicy;

