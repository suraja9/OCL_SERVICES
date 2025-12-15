import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
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
              Privacy Policy
            </h1>
            <p
              className="text-sm sm:text-base md:text-lg lg:text-xl font-light max-w-3xl mx-auto"
              style={{ color: "#0D1B2A" }}
            >
              Your privacy is important to us. Learn how we collect, use, and protect your information.
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
                  At OCL, we are committed to protecting your privacy and ensuring the security of your personal information. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services, website, mobile application, 
                  or any other digital platform.
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  By using our services, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and 
                  practices, please do not use our services.
                </p>
              </div>

              {/* Information We Collect */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  1. Information We Collect
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      1.1 Personal Information
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                      We may collect the following types of personal information:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>Name, contact details (phone number, email address, postal address)</li>
                      <li>Identification documents (when required for verification)</li>
                      <li>Payment information (credit/debit card details, bank account information)</li>
                      <li>Shipment details (sender and recipient information, package contents, delivery addresses)</li>
                      <li>Account credentials (username, password)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D1B2A" }}>
                      1.2 Usage Information
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-2 text-justify">
                      We automatically collect certain information when you use our services:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>Location data (when permitted)</li>
                      <li>Cookies and similar tracking technologies</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* How We Use Your Information */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  2. How We Use Your Information
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4">
                  <li>To process and manage your shipments and deliveries</li>
                  <li>To provide customer support and respond to your inquiries</li>
                  <li>To send transactional SMS, emails, and notifications regarding your shipments</li>
                  <li>To process payments and prevent fraudulent transactions</li>
                  <li>To improve our services, website, and user experience</li>
                  <li>To comply with legal obligations and regulatory requirements</li>
                  <li>To send marketing communications (with your consent)</li>
                </ul>
              </div>

              {/* Information Sharing */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  3. Information Sharing and Disclosure
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                  <li>
                    <strong style={{ color: "#000" }}>Service Providers:</strong> With third-party service providers who assist us in operating our business.
                  </li>
                  <li>
                    <strong style={{ color: "#000" }}>Third-Party Delivery Partners:</strong>  In certain cases, we engage third-party delivery operators to
complete the shipment process. When such operators handle the final delivery, their Proof of
Delivery (POD) will be considered the official and final POD for the shipment. By using our services,
you acknowledge and agree that deliveries fulfilled through third-party partners will follow their
delivery and documentation procedures.
                  </li>
                  <li>
                    <strong style={{ color: "#000" }}>Consent:</strong> With your explicit consent for any other purpose
                  </li>
                </ul>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-3 text-justify">
                  We do not sell your personal information to third parties for their marketing purposes.
                </p>
              </div>

              {/* Data Security */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  4. Data Security
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, 
                  alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, 
                  and we cannot guarantee absolute security.
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  We use encryption, secure servers, and access controls to safeguard your data. All employees and service providers are bound by 
                  confidentiality obligations.
                </p>
              </div>

              {/* Your Rights */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  5. Your Rights and Choices
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                  <li><strong>Access:</strong> Request access to your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
                  <li><strong>Objection:</strong> Object to processing of your personal information</li>
                  <li><strong>Withdrawal of Consent:</strong> Withdraw consent for marketing communications</li>
                </ul>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-3 text-justify">
                  To exercise these rights, please contact us using the contact information provided below.
                </p>
              </div>

              {/* Cookies */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  6. Cookies and Tracking Technologies
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                  We use cookies and similar tracking technologies to enhance your experience, analyze usage, and improve our services. You can control 
                  cookies through your browser settings, but disabling cookies may affect the functionality of our website.
                </p>
              </div>

              {/* Data Retention */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  7. Data Retention
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  We retain your personal information only for as long as necessary to fulfill the purposes outlined in 
                  this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. 
                  When information is no longer needed, we will securely delete or anonymize it.
                </p>
              </div>

              {/* Changes to Privacy Policy */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  8. Changes to This Privacy Policy
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or legal 
                  requirements. We will notify you of any significant changes by posting the new Privacy Policy on this 
                  page and updating the "Last Updated" date. Your continued use of our services after such changes 
                  constitutes acceptance of the updated policy.
                </p>
              </div>

              {/* Contact Information */}
              <div className="mb-8 p-6 bg-yellow-50 rounded-lg border-l-4" style={{ borderColor: "#FFC043" }}>
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  Contact Us
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3 text-justify">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2 text-sm md:text-base text-gray-700">
                  <p><strong>OCL</strong></p>
                  <p>Piyali Phukan Road, Rehabari, Guwahati, 781008</p>
                  <p>Phone: +91 76360 96733</p>
                  <p>Email: info@oclservices.com</p>
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

export default PrivacyPolicy;

