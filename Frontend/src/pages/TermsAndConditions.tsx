import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsAndConditions = () => {
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
              Terms and Conditions
            </h1>
            <p
              className="text-sm sm:text-base md:text-lg lg:text-xl font-light max-w-3xl mx-auto"
              style={{ color: "#0D1B2A" }}
            >
              Please read these terms carefully before using our services
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
              {/* General Terms */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  General Terms
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  <li>
                    The Shipment is accepted by "OCL" through its employees referred to collectively hereinafter as "OCL" 
                    subject to the terms & conditions set out hereunder.
                  </li>
                  <li>
                    Consignor and Consignee agreed to accept transactional SMS which will send by "OCL" during their transhipment.
                  </li>
                  <li>
                    The "OCL" waybill is non-negotiable and the Consignor acknowledges that it has been prepared by the Consignor or by 
                    "OCL" on the behalf of the Consignor.
                  </li>
                  <li>
                    All Shipments under this waybill are carried at Owner's risk. "OCL" take third party's team and condition will be accepted 
                    by the Consignor/ Consignee. No Extra claim will be entertained by "OCL".
                  </li>
                </ol>
              </div>

              {/* Consignors Obligation */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  CONSIGNORS OBLIGATION AND ACKNOWLEDGEMENTS
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  <li>
                    By tendering materials for shipment via 'OCL' it is deemed that the consignor agrees to the terms and conditions stated 
                    herein.
                  </li>
                  <li>
                    The consignor warrants that he is the owner of the authorised agent of the owner of the goods transported hereunder and that the.
                  </li>
                  <li>
                    The Consignor hereby accepts "OCL" terms and conditions, both on its own behalf and/or as an agent for any other 
                    person with an interest in the shipment. The Consignor also acknowledges that they will be held solely responsible and subject to legal 
                    penalties for the booking of any illegal items explicitly prohibited by the government.
                  </li>
                  <li>
                    The consignor warrants that each article in the shipment is properly describe on the way bill and it doesn't Contravene the provisions of India 
                    Post Office Act or any other law for the time being in force and has not been declared by 'OCL' to be unacceptable for 
                    transport as specified and that the shipment is properly marked and addresses packed to ensure safe handling'.
                  </li>
                  <li>
                    The consigners shall be solely liable for all cost and expenses (which shall without limitation include state and local tax and import 
                    duties) related to the shipments and for cost incurred either in returning the shipment to the consignor or warehousing the shipments 
                    pending such return.
                  </li>
                  <li>
                    The consignor accept the condition that the shipment is being carried by "OCL" for point of rendering only up to the 
                    address shows on the waybill and in case this shipment has to be rerouted/redirected/returned for any reason whatsoever, the consignor 
                    shall pay in advance all charges levied by "OCL" for such rerouted/redirected/returned as per the normal schedule of "OCL" as also any State local Taxes and import duties etc, applicable thereon "OCL" will hold such 
                    shipment as Destined mentioned on the waybill for the maximum period 10 days from the date of shipment. Therefore, 'OCL' reserves the right to destroy the shipment without informing the CONSIGNOR and the CONSIGNOR shall indemnify "OCL" against any claim of liability.
                  </li>
                  <li>
                    Packing the material rendered for the shipment is the responsibility of the CONSIGNOR including placement of such materials inside the 
                    containers supplied by "OCL" if any not with standing anything else this terms and conditions.
                  </li>
                </ol>
              </div>

              {/* Inspection */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  OCL OF INSPECTION OF SHIPMENT
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  <li>
                    "OCL" has the right but not the obligation to open/or inspect the shipment.
                  </li>
                  <li>
                    'OCL' reserves the right to refuse shipment for not conforming to these terms and conditions without assigning any 
                    reasons whatsoever.
                  </li>
                </ol>
              </div>

              {/* Insurance */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  INSURANCE
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  <li>
                    While "OCL" has developed a sophisticated tracking system of all shipments carried in its network and his experienced 
                    manpower to handle all shipments. THE SHIPMENT may if so desires insure his shipment at his own cost.
                  </li>
                </ol>
              </div>

              {/* Taxes */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  TAXES
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  <li>
                    All taxes and other statutory payment levied on the shipment are to be borne by the CONSIGNEE and in his absence the 
                    same will be borne by the CONSIGNOR "OCL" will not extend any credit for statutory changes.
                  </li>
                </ol>
              </div>

              {/* Chargeable Weight */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  CHARGEABLE WEIGHT
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  <li>
                    Every Shipment shall be charge by its chargeable weight as defined hereunder and not the actual weight. The chargeable weight shall be 
                    higher of (a) The actual weight rounded off to the next higher half Kg. or one Kg. Or may be more than that or as per the rate category 
                    agreed to or (b) The Volume weight similarly rounded of as in (a) above.
                  </li>
                  <li>
                    Volumetric weight of the shipment in Kg's is its gross cubic cms. i.e Length* Width * Height divided by 5000.
                  </li>
                </ol>
              </div>

              {/* Lien on Goods */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  LIEN ON GOOD SHIPPED
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  <li>
                    The CONSIGNOR acknowledges "OCL" has right of line on this shipment for any outstanding freight, any other 
                    application changes. Central State and Local Taxes, duties, levies advances arising out of transportation and warehousing services, whether 
                    pertaining to past or present outstanding refuse to surrender possession of the shipment until all such changes are paid.
                  </li>
                  <li>
                    Further, if such changes are not paid to "OCL" within 10 days, then "OCL" may store the goods at the 
                    defaulting CONSIGNOR's / CONSIGNEE's own risk.
                  </li>
                  <li>
                    "OCL" does not carry any perishable goods. However, in any case of perishable goods, "OCL" due to 
                    such perishable goods entering into the network of "OCL".
                  </li>
                  <li>
                    If Consignee refuses delivery or the shipment is deemed to be unacceptable or it has been undervalued for customs purposes, or 
                    consignee cannot be reasonable identified or located, "OCL" shall use reasonable efforts to return the shipment to 
                    CONSIGNOR at Consignor's cost failing which the shipment may be released, disposed of or sold by "OCL" without 
                    incurring any liability whatsoever to the CONSIGNOR or anyone else. The proceeds shall be applied against service charges and related 
                    administrative costs and the balance of the proceeds of a sale to be returned to CONSIGNOR after adjusting outstanding dues, if any.
                  </li>
                </ol>
              </div>

              {/* Limitation Liability */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  LIMITATION LIABILITY
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  <li>
                    Without prejudice the liability of "OCL" for any loss or damage to the shipment (Which term shall include all document or 
                    parcels consigned through "OCL") shall be lowest of (a) Rs.250/- or (b) The amount of loss or damage to the document of 
                    parcel actually sustained for shipment which are not insured as mentioned below the actual value of the document or parcel so determined 
                    will be without regard to the commercial utility or special value to the Consignors.
                  </li>
                  <li>
                    The actual value of the document or parcel shall be ascertained by reference to the cost of preparation or replacement/reinstruction value at 
                    the time and place of shipment but under no circumstances shall exceed Rs.250/-
                  </li>
                  <li>
                    The actual value of the parcel (which terms shall include any item of commercial value of which is transported hereunder) shall be 
                    ascertained by reference to its cost by repair or replacements/resale or fair market value not exceeding the original cost of the article actually 
                    paid by CONSIGNOR subject to and within over all limit of Rs.250/-
                  </li>
                  <li>
                    In the event of any loss or damage to shipment, which are insure by the Consignor, "OCL" may at the request of the 
                    Consignors, issue loss/damage/shortage certificate with the sole purpose of enabling the Consignor to lodge insurance claim with its 
                    insurance company. The Consignor agrees and acknowledges that the loss/damage/shortage certificate will be issued by "OCL" without admission of any claim and that "OCL" shall be discharge of all liabilities, if any arising out of the 
                    shipment on acceptance of the loss/damage/shortage certificate by the Consignor.
                  </li>
                </ol>
              </div>

              {/* Consequential Damage */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  CONSEQUENTIAL DAMAGE EXCLUDE
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  <li>
                    "OCL" shall not be liable in any event for any consequences or special damage or other direct or indirect loss howsoever 
                    arising whether or not "OCL" has knowledge that such damages might be incurred including but not limited to loss of 
                    income, profits interest, utility or loss of market.
                  </li>
                </ol>
              </div>

              {/* Liabilities Not Assumed */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  LIABILITIES NOT ASSUMED
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  <li>
                    In particular "OCL" will not be liable for any loss and damage to the shipment or a delay in picking up or a delivering 
                    shipment if it is,
                    <ol className="list-lower-alpha list-inside ml-6 mt-2 space-y-2 text-justify">
                      <li>
                        Due to the act of God force majeure occurrence of any cause reasonable beyond the control of "OCL" or loss or damage 
                        caused through strikes, riots, political and other disturbance such as fire accident of the vehicle carrying the goods, explosions, beyond the 
                        control of "OCL" for the goods that are carried by "OCL".
                      </li>
                      <li>
                        Caused by:
                        <ol className="list-roman list-inside ml-6 mt-2 space-y-2 text-justify">
                          <li>
                            The act fault or omission/ commission of any act of the CONSIGNOR/ the consignee or any party claiming an interest in the shipment 
                            (including violation of any terms or condition thereof) or any other person.
                          </li>
                          <li>
                            Carriers such as Airlines or Airways not adhering to schedule for any reason whatsoever.
                          </li>
                          <li>
                            Government officials in discharge of their official duties such as Customs/Taxation Inspection etc.
                          </li>
                          <li>
                            The nature of the shipment or any defective characteristics or inherit vice, therein.
                          </li>
                          <li>
                            Electrical or magnetic erasure or other such damages to photographic images or recording in any form.
                          </li>
                        </ol>
                      </li>
                    </ol>
                  </li>
                  <li>
                    The CONSIGNOR indemnifies "OCL" against loss, damages, penalties, actions, proceedings etc. That may be instituted 
                    by any government official in discharge of their official duties including but not limited to Customs/Taxation Inspection etc.
                  </li>
                  <li>
                    Notwithstanding what is stated above whilst "OCL" will exercise its best efforts to provide expeditious delivery in 
                    accordance with its regularly delivery "OCL" WILL NOT UNDER ANY CIRCUMSTANCES BE LIABLE FOR DELAY IN 
                    PICK UP, TRANSPORTATION OR DELIVERY OF ANY SHIPMENT REGARDLESS OF CAUSE OF SUCH DELAYS.
                  </li>
                  <li>
                    No liability is assumed for any errors and/or omissions in any information/date which is imparted in respect of the shipment travelling under 
                    the air waybill.
                  </li>
                </ol>
              </div>

              {/* Claims */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  CLAIMS
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  <li>
                    Any claim must be brought by the CONSIGNOR and delivered, in writing to the office "OCL" nearest of the location at 
                    which the shipment is accepted within 15days from the date of such acceptance. No claim can be made against "OCL" 
                    beyond the time limit.
                  </li>
                  <li>
                    No claims for loss or damage will be entertained until all charges have been paid. The amount of any such claim will not deducted from any 
                    transportation charges owned to "OCL".
                  </li>
                </ol>
              </div>

              {/* Materials Not Acceptable */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  MATERIALS NOT ACCEPTABLE FOR CARRIAGE
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm md:text-base text-gray-700 leading-relaxed text-justify">
                  <li>
                    Except as per written agreement between the Consignor and "OCL", "OCL" will not carry materials as 
                    under.
                  </li>
                  <li>
                    Classified as hazardous material dangerous goods prohibited, banned or restricted articles by IATA(International Air Transport Association) 
                    ICAO(International Civil Aviation Organization) any applicable government department or other relevant Organization.
                  </li>
                  <li>
                    Not permitted by laws/rules/restrictions in force or no customs declaration is made when require by applicable customs regulations and /or 
                    any other relevant law.
                  </li>
                  <li>
                    "OCL" decides if cannot transport an item safely or legally (such items include but are not limited to animals, bullion, 
                    currency bearer negotiable instruments share certificates and blank shares precious metals and stones, firearms or parts thereof and 
                    ammunition, human remains, pornography and illegal narcotics/drugs).Details available in all "OCL" offices on request 
                    and also available on the website.
                  </li>
                </ol>
              </div>

              {/* Jurisdiction */}
              <div className="mb-8 p-4 bg-yellow-50 rounded-lg border-l-4" style={{ borderColor: "#FFC043" }}>
                <p className="text-sm md:text-base font-semibold text-gray-800 text-justify">
                  <strong>NOTE:</strong> ALL DISPUTES AND CLAIMS ARE SUBJECT TO GUWAHATI JURISDICTION.
                </p>
              </div>

              {/* Online Services */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "#0D1B2A" }}>
                  ADDITIONAL TERMS & CONDITIONS FOR ONLINE SERVICES
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-3" style={{ color: "#0D1B2A" }}>
                      1. Online Platform Usage:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>
                        By accessing or using 'OCL' online platform (website, mobile application, or any other digital interface), the Consignor and 
                        Consignee agree to comply with these terms, as well as any specific terms of use, privacy policies, and guidelines posted on the platform.
                      </li>
                      <li>
                        Users are responsible for maintaining the confidentiality of their account information, including passwords, and for all activities that occur 
                        under their account.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-3" style={{ color: "#0D1B2A" }}>
                      2. Accuracy of Online Information:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>
                        The Consignor is solely responsible for the accuracy of all information provided through the online platform, including shipment details, 
                        consignor/consignee addresses, contact information, and declarations. 'OCL' shall not be liable for any loss or damage 
                        arising from inaccurate or incomplete information provided by the user.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-3" style={{ color: "#0D1B2A" }}>
                      3. Online Booking and Payment:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>
                        All online bookings are subject to confirmation by 'OCL'.
                      </li>
                      <li>
                        Payments made through the online platform are subject to the terms and conditions of the respective payment gateway providers. 'Our 
                        Courier & Logistics' is not responsible for any issues arising from payment gateway failures or discrepancies.
                      </li>
                      <li>
                        Any charges, including freight, taxes, duties, and additional service fees, will be clearly displayed on the online platform, and by proceeding 
                        with a booking, the user agrees to these charges.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-3" style={{ color: "#0D1B2A" }}>
                      4. Electronic Waybills and Documentation:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>
                        Electronic waybills generated through the online platform shall be considered valid and binding.
                      </li>
                      <li>
                        Any other documentation required for shipment, such as invoices or customs declarations, may be submitted electronically through the 
                        platform, subject to 'OCL' guidelines.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-3" style={{ color: "#0D1B2A" }}>
                      5. Tracking Services:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>
                        'OCL' will provide online tracking services for shipments booked through its platform. While 'OCL' 
                        endeavors to provide accurate and real-time tracking information, it does not guarantee the continuous availability or absolute accuracy of 
                        such information due to potential technical issues or third-party service interruptions.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-3" style={{ color: "#0D1B2A" }}>
                      6. User Conduct:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>
                        Users agree not to use the online platform for any unlawful purpose or in any way that could damage, disable, overburden, or impair the 
                        platform or interfere with any other party's use and enjoyment of the platform.
                      </li>
                      <li>
                        Prohibited activities include, but are not limited to, unauthorized access, data mining, or transmitting harmful code.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-3" style={{ color: "#0D1B2A" }}>
                      7. Service Availability:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>
                        'OCL' will make reasonable efforts to ensure the online platform is available 24/7. However, 'OCL' 
                        reserves the right to suspend or withdraw access to the platform without notice for maintenance, upgrades, or any other reason. 'Our 
                        Courier & Logistics' shall not be liable for any loss or inconvenience caused by such unavailability.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-3" style={{ color: "#0D1B2A" }}>
                      8. Intellectual Property:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>
                        All content, trademarks, logos, and intellectual property displayed on the online platform are the property of 'OCL' or its 
                        licensors. Users are prohibited from reproducing, distributing, or using any such content without prior written consent from 'OCL'.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-3" style={{ color: "#0D1B2A" }}>
                      9. Amendments to Online Terms:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 leading-relaxed ml-4 text-justify">
                      <li>
                        'OCL' reserves the right to amend these online terms and conditions at any time. Users will be notified of significant 
                        changes, and continued use of the online platform after such amendments constitutes acceptance of the revised terms.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;

