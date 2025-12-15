import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Rocket, ArrowLeft } from "lucide-react";
import homeImage from "@/assets/home-image.png";
import { useNavigate } from "react-router-dom";
import flagIcon from "@/Icon-images/flag.png";

const HeroCarousel = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative overflow-hidden min-h-screen md:min-h-[90vh] flex items-center py-8 md:py-0 overflow-x-hidden"
      style={{ background: "linear-gradient(180deg, #ffffff, #f4ecec)" }}
    >
      {/* Background image */}
      <img
        className="absolute inset-0 w-full h-full object-cover"
        src={homeImage}
        alt="OCL Services - Logistics and Courier"
      />
      {/* Delhivery-style left-to-right black gradient overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.75) 20%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0) 100%)",
          animation: "fadeInOverlay 0.5s ease-in"
        }}
      />

      <div className="relative z-20 w-full pt-20 md:pt-28 pb-6 md:pb-12 translate-y-0 md:translate-y-24">
        <div className="flex justify-center w-full">
          <div className="w-full px-4 sm:px-6 md:w-[85%] md:px-0">
            {/* Card and Text Side by Side */}
            <div className="flex flex-col md:flex-row md:items-center md:gap-12 w-full">
              {/* Heading - First on mobile, part of right side on desktop */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 md:mb-4 drop-shadow-lg order-1 md:hidden text-left w-full px-2"
                style={{ fontFamily: 'Value Serif Pro Bold, serif', color: '#00FF76', paddingTop: '0px' }}
              >
                !!! India's Most Reliable Logistics Service Provider !!!
              </motion.h1>

              {/* Tracking Module - Second on mobile, Left side on desktop */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
                className="hidden md:block w-full md:w-[38%] order-2 md:order-1"
              >
                <TrackingTabs />
              </motion.div>

              {/* Tracking Module directly visible on mobile (without outer box) - order-2 on mobile */}
              <div className="block md:hidden w-full order-2 mb-4 px-2">
                <TrackingTabs />
              </div>

              {/* Desktop: Heading + Description together on right side */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                className="hidden md:flex flex-col justify-start w-full md:w-[55%] md:ml-4 md:order-2"
                style={{ paddingTop: '0px' }}
              >
                <h1
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-3 md:mb-4 drop-shadow-lg"
                  style={{ fontFamily: 'Value Serif Pro Bold, serif', color: '#00FF76' }}
                >
                  !!! India's Most Reliable Logistics Service Provider !!!
                </h1>
              </motion.div>
            </div>

            {/* Schedule Pickup Button with fade-in animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.19, 1, 0.22, 1] }}
              className="flex justify-center mt-6 md:mt-16 px-4"
            >
              <button
                onClick={() => navigate('/schedule-pickup')}
                className="button-schedule-pickup flex items-center gap-2 w-full sm:w-auto justify-center min-h-[44px] text-base sm:text-lg"
                role="button"
              >
                <Rocket className="w-5 h-5 button-schedule-pickup-icon" />
                Schedule a Pickup
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Tracking Tabs component
const TrackingTabs = () => {
  const navigate = useNavigate();
  const [miniTab, setMiniTab] = useState<'mobile' | 'awb'>('awb');
  const [phone, setPhone] = useState("");
  const [awbNumber, setAwbNumber] = useState("");
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otp, setOtp] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const placeholders: Record<typeof miniTab, string> = {
    mobile: 'Enter your mobile number',
    awb: 'Enter AWB number',
  } as any;

  const handlePrimary = () => {
    if (miniTab !== 'mobile') {
      let trackingNumber = awbNumber.trim();
      if (!trackingNumber) trackingNumber = '9365889675'; // default for now
      if (trackingNumber) {
        navigate(`/tracking?view=progress&type=${miniTab}&number=${encodeURIComponent(trackingNumber)}`);
      }
      return;
    }
    // dummy gate: only accept 9365889675 as entered number
    if (phone.trim() === '9365889675') {
      setShowOtpPopup(true);
    }
  };

  const handleVerifyOtp = () => {
    const code = otpDigits.join("");
    if (code.length === 6) {
      setShowOtpPopup(false);
      setShowSuccess(true);
    }
  };

  return (
    <div
      className="w-full max-w-md rounded-2xl p-4 sm:p-5 md:p-6 transition-all text-white"
      style={{
        background: 'rgba(255, 255, 255, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        boxShadow: isMobile
          ? '0 12px 40px rgba(0, 0, 0, 0.6), 0 6px 20px rgba(0, 0, 0, 0.5), 0 3px 10px rgba(0, 0, 0, 0.4)'
          : 'rgba(136, 165, 191, 0.48) 6px 2px 16px 0px',
        minHeight: '240px',
      }}
    >
      {/* Track Shipment Label */}
      <div className="mb-2 md:mb-4">
        <span className="text-lg md:text-xl font-bold text-white drop-shadow-md">
          Track Shipment
        </span>
      </div>

      {/* Mini Tabs */}
      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
        {[
          { key: 'awb', label: 'AWB' },
          { key: 'mobile', label: 'Mobile' },
        ].map((t: any) => (
          <button
            key={t.key}
            onClick={() => setMiniTab(t.key)}
            className={`px-6 py-2 md:px-8 md:py-2 rounded-lg text-sm md:text-sm font-medium transition-all duration-300 min-h-[44px] min-w-[100px] md:min-w-[120px] ${miniTab === t.key
                ? 'bg-[#FD9C13] text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Input + Action */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
        {/* Input for Mobile/AWB/Ref */}
        <div className="relative flex-1 w-full">
          {miniTab === 'mobile' ? (
            <>
              {/* Indian Flag and +91 */}
              <div
                className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-10 flex items-center px-1 md:px-1.5 py-0.5 md:py-1 rounded-md"
                style={{
                  backgroundColor: "#F7F7F7",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
              >
                <img
                  src={flagIcon}
                  alt="India flag"
                  className="mr-0.5 md:mr-1 rounded-sm object-cover w-3.5 h-3.5 md:w-4 md:h-4"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'inline';
                    }
                  }}
                />
                <span className="text-base mr-2 hidden">🇮🇳</span>
                <span className="text-xs md:text-sm font-normal text-gray-700">+91</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only numbers
                  if (value.length <= 10) {
                    setPhone(value);
                  }
                }}
                maxLength={10}
                placeholder={isMobile ? "Mobile number" : "Enter your mobile num..."}
                className="w-full rounded-xl border border-gray-300 pl-14 md:pl-20 pr-4 md:pr-5 py-3 md:py-2 text-sm sm:text-base md:text-base outline-none focus:ring-2 focus:ring-[#5a1e1e]/30 min-h-[44px] placeholder:text-gray-700 placeholder:opacity-90"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.65)',
                  color: '#1E1E1E'
                }}
              />
            </>
          ) : (
            <>
              <input
                type="text"
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                placeholder="Enter AWB number"
                className="w-full rounded-xl border border-gray-300 px-3 md:px-4 py-3 md:py-2 text-base md:text-base outline-none focus:ring-2 focus:ring-[#5a1e1e]/30 min-h-[44px] placeholder:text-gray-700 placeholder:opacity-90"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.65)',
                  color: '#1E1E1E'
                }}
              />
            </>
          )}
        </div>

        <Button onClick={handlePrimary} className="rounded-xl bg-[#FD9C13] hover:bg-[#e58f12] text-white px-4 py-3 md:px-5 md:py-3 text-sm md:text-sm shadow transition-all duration-300 w-full sm:w-auto min-h-[44px]">
          {miniTab === 'mobile' ? 'Get OTP' : 'Track Now'}
        </Button>
      </div>

      {/* OTP Popup */}
      {showOtpPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 6 }}
            animate={{ scale: 1, y: 0 }}
            className="relative rounded-2xl bg-white w-[92%] max-w-md p-6 md:p-7"
            style={{
              boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)"
            }}
          >
            {/* Back */}
            <button onClick={() => setShowOtpPopup(false)} className="absolute left-4 top-4 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="text-xl font-semibold text-[#1f2937]">Enter OTP</div>
              <p className="text-sm text-[#6b7280] mt-1">We've sent an OTP on +91 {phone}</p>
            </div>

            {/* OTP boxes */}
            <div className="mt-5 flex justify-center gap-2 md:gap-3">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 1);
                    const next = [...otpDigits];
                    next[i] = val;
                    setOtpDigits(next);
                    const nextEl = document.getElementById(`otp-${i + 1}`) as HTMLInputElement | null;
                    if (val && nextEl) nextEl.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otpDigits[i]) {
                      const prevEl = document.getElementById(`otp-${i - 1}`) as HTMLInputElement | null;
                      if (prevEl) prevEl.focus();
                    }
                  }}
                  id={`otp-${i}`}
                  className="h-12 w-12 md:h-12 md:w-12 text-center text-lg rounded-md border border-gray-300 focus:border-[#FD9C13] focus:outline-none focus:ring-0 text-black"
                />
              ))}
            </div>

            <Button disabled={otpDigits.join("").length !== 6} onClick={handleVerifyOtp} className="mt-5 w-full rounded-md bg-[#FBCD8B] text-[#1f2937] font-semibold hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed">
              Verify OTP
            </Button>

            <div className="mt-3 text-center text-sm text-[#1f2937] cursor-pointer">Resend OTP</div>
          </motion.div>
        </motion.div>
      )}

      {/* Success popup */}
      {showSuccess && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} className="rounded-xl bg-white p-5 w-[90%] max-w-sm text-center shadow-xl">
            <div className="text-lg font-semibold mb-2 text-[#1f2937]">Verification successful</div>
            <p className="text-sm text-[#6b7280] mb-4">You can now view your shipments.</p>
            <Button onClick={() => navigate('/tracking?view=cards')} className="rounded-md bg-[#FD9C13] hover:bg-[#e58f12] text-white px-4 py-2">Check</Button>
          </motion.div>
        </motion.div>
      )}

      {/* App promo removed as requested */}
    </div>
  );
};

export default HeroCarousel; 