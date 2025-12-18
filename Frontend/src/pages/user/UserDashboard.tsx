import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Compass,
  LayoutDashboard,
  Mail,
  MoonStar,
  PackageSearch,
  Sparkles,
  Sun,
  Headphones,
  Menu,
  LogOut,
  Search,
  Phone,
  Truck,
  MapPin,
  PackageCheck,
  CheckCircle,
  Map,
  User,
  Handshake,
  Box,
} from "lucide-react";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { useToast } from "@/hooks/use-toast";
import BookNow from "@/components/user/BookNow";
import ContactSupport from "@/components/user/ContactSupport";
import MyBooking from "@/components/user/MyBooking";
import CustomerTracking from "@/components/user/CustomerTracking";
import RightBannerSlider from "@/components/user/RightBannerSlider";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import oclLogo from "@/assets/ocl-logo.png";
import homeIcon from "@/Icon-images/Building.png";
import bookNowIcon from "@/Icon-images/invoice.png";
import myBookingIcon from "@/Icon-images/package.png";
import trackingIcon from "@/Icon-images/location.png";
import contactSupportIcon from "@/Icon-images/call.png";
import scl1 from "@/assets/scl-1.png";
import scl2 from "@/assets/scl-2.png";
import scl3 from "@/assets/scl-3.png";
import scl4 from "@/assets/scl-4.png";

type SidebarItem = {
  id: "home" | "booknow" | "mybooking" | "tracking" | "contactsupport";
  label: string;
};

const UserDashboard: React.FC = () => {
  const { isAuthenticated, customer, logout } = useUserAuth();
  const { toast } = useToast();

  const sidebarItems: SidebarItem[] = useMemo(
    () => [
      {
        id: "home",
        label: "Home",
      },
      {
        id: "booknow",
        label: "Book now",
      },
      {
        id: "mybooking",
        label: "My Booking",
      },
      {
        id: "tracking",
        label: "Tracking",
      },
      {
        id: "contactsupport",
        label: "Contact Support",
      },
    ],
    []
  );

  const [activeItem, setActiveItem] = useState<SidebarItem["id"]>("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
    setActiveItem("home");
  };

  useEffect(() => {
    const handleDashboardNavigation = (event: Event) => {
      const customEvent = event as CustomEvent<{ section?: SidebarItem["id"] }>;
      const targetSection = customEvent.detail?.section;
      if (!targetSection) return;
      setActiveItem(targetSection);
      if (isMobile) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("user-dashboard:navigate", handleDashboardNavigation as EventListener);
    return () => {
      window.removeEventListener("user-dashboard:navigate", handleDashboardNavigation as EventListener);
    };
  }, [isMobile]);

  const pageBackground = isDarkMode
    ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50"
    : "bg-gradient-to-b from-white to-sky-100 text-slate-900";
  const accentGradient = isDarkMode
    ? "from-blue-500/20 via-blue-400/10 to-transparent"
    : "from-blue-400/15 via-blue-300/10 to-transparent";
  const accentGradientAlt = isDarkMode
    ? "from-purple-500/25 via-indigo-400/10 to-transparent"
    : "from-purple-400/15 via-violet-300/10 to-transparent";
  const sidebarBackground = isDarkMode
    ? "bg-slate-900/95 border-slate-700/80 backdrop-blur-xl"
    : "bg-white/95 border-slate-200/80 backdrop-blur-xl";
  const sidebarTextMuted = isDarkMode ? "text-slate-300/90" : "text-slate-600";

  const handleItemClick = (itemId: SidebarItem["id"]) => {
    setActiveItem(itemId);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Reusable Sidebar Content Component
  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-8 px-6 pt-6 pb-4">
      {/* Company Logo */}
      <div className="flex justify-center mb-2">
        <Link to="/" aria-label="Go to homepage" className="inline-flex">
          <img 
            src={oclLogo} 
            alt="OCL Logo" 
            className={cn(
              "h-24 w-36 object-contain transition-opacity",
              isDarkMode ? "opacity-90 brightness-110" : "opacity-100"
            )}
          />
        </Link>
      </div>
      
      <div className="flex flex-col gap-3">
        <div>
          
        </div>
      </div>

      <nav className="space-y-1">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={cn(
              "group w-full rounded-xl border px-3 py-2 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2",
              isDarkMode
                ? "focus-visible:ring-blue-400 border-transparent hover:border-blue-500/30 hover:bg-blue-500/10"
                : "focus-visible:ring-blue-500 border-transparent hover:border-blue-400/30 hover:bg-blue-400/10",
              activeItem === item.id
                ? isDarkMode
                  ? "border-blue-500/50 bg-blue-500/20 shadow-lg shadow-blue-500/10"
                  : "border-blue-400/50 bg-blue-400/20 shadow-lg shadow-blue-400/10"
                : ""
            )}
          >
            <div className="flex items-center gap-2">
              {item.id === "home" ? (
                <img 
                  src={homeIcon} 
                  alt="Home" 
                  className={cn(
                    "h-5 w-5 object-contain transition-all",
                    activeItem === item.id 
                      ? isDarkMode 
                        ? "opacity-100 brightness-125" 
                        : "opacity-100"
                      : isDarkMode
                        ? "opacity-60 brightness-110"
                        : "opacity-50"
                  )}
                />
                ) : item.id === "booknow" ? (
                <img 
                  src={bookNowIcon} 
                  alt="Book now" 
                  className={cn(
                    "h-5 w-5 object-contain transition-all",
                    activeItem === item.id 
                      ? isDarkMode 
                        ? "opacity-100 brightness-125" 
                        : "opacity-100"
                      : isDarkMode
                        ? "opacity-60 brightness-110"
                        : "opacity-50"
                  )}
                />
                ) : item.id === "mybooking" ? (
                <img 
                  src={myBookingIcon} 
                  alt="My Booking" 
                  className={cn(
                    "h-5 w-5 object-contain transition-all",
                    activeItem === item.id 
                      ? isDarkMode 
                        ? "opacity-100 brightness-125" 
                        : "opacity-100"
                      : isDarkMode
                        ? "opacity-60 brightness-110"
                        : "opacity-50"
                  )}
                />
                ) : item.id === "tracking" ? (
                <img 
                  src={trackingIcon} 
                  alt="Tracking" 
                  className={cn(
                    "h-5 w-5 object-contain transition-all",
                    activeItem === item.id 
                      ? isDarkMode 
                        ? "opacity-100 brightness-125" 
                        : "opacity-100"
                      : isDarkMode
                        ? "opacity-60 brightness-110"
                        : "opacity-50"
                  )}
                />
                ) : item.id === "contactsupport" ? (
                <img 
                  src={contactSupportIcon} 
                  alt="Contact Support" 
                  className={cn(
                    "h-5 w-5 object-contain transition-all",
                    activeItem === item.id 
                      ? isDarkMode 
                        ? "opacity-100 brightness-125" 
                        : "opacity-100"
                      : isDarkMode
                        ? "opacity-60 brightness-110"
                        : "opacity-50"
                  )}
                />
              ) : (
                <img 
                  src={homeIcon} 
                  alt="Home" 
                  className={cn(
                    "h-5 w-5 object-contain transition-all",
                    activeItem === item.id 
                      ? isDarkMode 
                        ? "opacity-100 brightness-125" 
                        : "opacity-100"
                      : isDarkMode
                        ? "opacity-60 brightness-110"
                        : "opacity-50"
                  )}
                />
              )}
              <span className={cn(
                "text-sm font-medium transition-colors",
                isDarkMode 
                  ? activeItem === item.id 
                    ? "text-slate-50" 
                    : "text-slate-300"
                  : activeItem === item.id
                    ? "text-slate-900"
                    : "text-slate-700"
              )}>
                {item.label}
              </span>
            </div>
          </button>
        ))}
      </nav>

      {/* Logout Button - Only show if logged in */}
      {isAuthenticated && (
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className={cn(
              "group w-full rounded-xl border px-3 py-2 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2",
              isDarkMode
                ? "focus-visible:ring-red-400 border-transparent hover:border-red-500/30 hover:bg-red-500/10"
                : "focus-visible:ring-red-500 border-transparent hover:border-red-400/30 hover:bg-red-400/10"
            )}
          >
            <div className="flex items-center gap-2">
              <LogOut className={cn(
                "h-5 w-5 transition-colors",
                isDarkMode ? "text-red-400 group-hover:text-red-300" : "text-red-600 group-hover:text-red-700"
              )} />
              <span className={cn(
                "text-sm font-medium transition-colors",
                isDarkMode ? "text-red-400 group-hover:text-red-300" : "text-red-600 group-hover:text-red-700"
              )}>
                Logout
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "relative min-h-screen transition-colors duration-500 ease-out",
        pageBackground
      )}
    >
      <style>{`
        .marquee-container:hover .marquee-content {
          animation-play-state: paused;
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute -right-24 top-[-10%] h-[280px] w-[280px] rounded-full blur-3xl",
            `bg-gradient-to-br ${accentGradient}`
          )}
        />
        <div
          className={cn(
            "absolute bottom-[-15%] left-[-10%] h-[340px] w-[340px] rounded-full blur-3xl",
            `bg-gradient-to-tr ${accentGradientAlt}`
          )}
        />
      </div>

      {/* Scrolling Marquee/Ticker */}
      <div 
        className="marquee-container fixed top-0 left-0 right-0 z-50 w-full overflow-hidden"
        style={{
          background: "linear-gradient(to bottom, #000000 0%, #000000 85%, #FF9A0C 100%)"
        }}
      >
        <div className="relative flex w-full">
          <div className={cn(
            "marquee-content flex animate-scroll items-center whitespace-nowrap py-1.5 text-xs font-medium sm:py-2 sm:text-sm",
            "text-white"
          )}
          style={{ width: "200%" }}
          >
            <span className="mx-4">
              📊 Today's Network Update: Our delivery operations are running smoothly with 93% of shipments reaching on time across all active zones.  ⏱ Current pickup estimate ranges between 60-75 minutes depending on your location, and we are continuously optimizing routes for faster service.  😊 Customer satisfaction remains strong at 4.4/5 based on recent feedback.  🔍 AI Delay Monitor: No major disruptions predicted today, but minor slowdowns may occur during peak evening hours - we'll keep you updated in real time.
            </span>
            <span className="mx-4">
              📊 Today's Network Update: Our delivery operations are running smoothly with 93% of shipments reaching on time across all active zones.  ⏱ Current pickup estimate ranges between 60-75 minutes depending on your location, and we are continuously optimizing routes for faster service.  😊 Customer satisfaction remains strong at 4.4/5 based on recent feedback.  🔍 AI Delay Monitor: No major disruptions predicted today, but minor slowdowns may occur during peak evening hours - we'll keep you updated in real time.
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row pt-[2.5rem]">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside
          className={cn(
            "hidden lg:fixed lg:left-0 lg:top-[2.5rem] lg:flex lg:w-64 lg:max-w-64 lg:h-[calc(100vh-2.5rem)] lg:border-r lg:rounded-tl-none lg:rounded-tr-3xl transition-all duration-500",
            isDarkMode
              ? "lg:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]"
              : "lg:shadow-[rgba(0,0,0,0.19)_0px_10px_20px,rgba(0,0,0,0.23)_0px_6px_6px]",
            sidebarBackground
          )}
        >
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar - Sheet Drawer */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent
            side="left"
            className={cn(
              "w-[85vw] max-w-sm p-0 backdrop-blur-xl",
              sidebarBackground
            )}
          >
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <main className={cn(
          "flex-1 lg:ml-80 min-w-0"
        )}>
          <div className={cn(
            "flex w-full flex-col gap-4 py-4 sm:gap-5 sm:py-6 lg:pt-[5vh]",
            "pl-6 pr-6 sm:pl-8 sm:pr-8 lg:pl-[5%] lg:pr-[5%]",
            "box-border"
          )}>
            {/* Mobile Header with Hamburger Menu */}
            <div className="flex items-center justify-between gap-4 lg:hidden">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className={cn(
                  "h-10 w-10 rounded-xl border transition",
                  isDarkMode
                    ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                    : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                )}
              >
                <Menu size={20} />
                <span className="sr-only">Open menu</span>
              </Button>
              <div className="flex-1">
                <h1 className={cn(
                  "text-xl font-semibold",
                  isDarkMode ? "text-slate-50" : "text-slate-900"
                )}>
                  OCL User Panel
                </h1>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDarkMode((prev) => !prev)}
                className={cn(
                  "h-10 w-10 rounded-xl border transition",
                  isDarkMode
                    ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                    : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                )}
              >
                {isDarkMode ? (
                  <Sun size={18} />
                ) : (
                  <MoonStar size={18} />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>

            {/* Desktop Header */}
            <div className="hidden flex-col items-start justify-between gap-4 sm:flex-row sm:items-center lg:hidden">
              <div>
                <p
                  className={cn(
                    "text-xs uppercase tracking-[0.4em]",
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsDarkMode((prev) => !prev)}
                className={cn(
                  "flex items-center gap-2 rounded-full border transition",
                  isDarkMode
                    ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                    : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                )}
              >
                {isDarkMode ? (
                  <>
                    <Sun size={16} />
                    <span className="text-sm font-medium">Light mode</span>
                  </>
                ) : (
                  <>
                    <MoonStar size={16} />
                    <span className="text-sm font-medium">Dark mode</span>
                  </>
                )}
              </Button>
            </div>

            {/* Desktop Dark Mode Toggle - Top Right */}
            <div className="hidden lg:flex justify-end mb-2">
              <Button
                variant="outline"
                onClick={() => setIsDarkMode((prev) => !prev)}
                className={cn(
                  "flex items-center gap-2 rounded-full border transition",
                  isDarkMode
                    ? "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800/70"
                    : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                )}
              >
                {isDarkMode ? (
                  <>
                    <Sun size={16} />
                    <span className="text-sm font-medium">Light mode</span>
                  </>
                ) : (
                  <>
                    <MoonStar size={16} />
                    <span className="text-sm font-medium">Dark mode</span>
                  </>
                )}
              </Button>
            </div>
            {activeItem === "home" && (
              <>
                <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                    <div className="max-w-3xl space-y-3 sm:space-y-4">
                      
                      <h2
                        className={cn(
                          "text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl",
                          isDarkMode ? "text-white" : "text-slate-900"
                        )}
                      >
                        Welcome to OCL.
                      </h2>
                      
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          onClick={() => handleItemClick("booknow")}
                          className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 sm:px-6 sm:py-3 sm:text-base shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]"
                        >
                          Create Booking
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => window.location.href = "/services/logistics"}
                          className={cn(
                            "rounded-full border-0 px-5 py-2.5 text-sm font-semibold transition sm:px-6 sm:py-3 sm:text-base shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]",
                            isDarkMode
                              ? "bg-transparent text-slate-200 hover:bg-transparent"
                              : "bg-white text-blue-700 hover:bg-white"
                          )}
                        >
                          Explore Services
                        </Button>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-3 lg:max-w-xs">
                      <p
                        className={cn(
                          "text-xs sm:text-sm",
                          isDarkMode ? "text-slate-300" : "text-slate-600"
                        )}
                      >
                      </p>
                      <div className="space-y-2">
                        {[
                          {
                            icon: <CalendarDays size={16} />,
                            title: "Schedule a pickup",
                            detail: "Book a slot in under 60 seconds.",
                          },
                          {
                            icon: <PackageSearch size={16} />,
                            title: "Track live consignments",
                            detail: "Check real-time progress and ETAs.",
                          },
                        ].map((item) => (
                          <div
                            key={item.title}
                            className={cn(
                              "flex items-start gap-2 border p-2 transition shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,rgba(0,0,0,0.3)_0px_3px_7px_-3px]",
                              isDarkMode
                                ? "border-transparent bg-slate-800/40 hover:border-blue-500/30 hover:bg-blue-500/10"
                                : "border-transparent bg-white hover:border-blue-400/40 hover:bg-blue-50"
                            )}
                          >
                            <span
                              className={cn(
                                "mt-1 flex-shrink-0",
                                isDarkMode ? "text-blue-200" : "text-blue-600"
                              )}
                            >
                              {item.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  "text-xs font-medium sm:text-sm",
                                  isDarkMode ? "text-white" : "text-slate-800"
                                )}
                              >
                                {item.title}
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isDarkMode ? "text-slate-400" : "text-slate-500"
                                )}
                              >
                                {item.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </section>

                <section className="w-full">
                  <h3
                    className={cn(
                      "mb-6 text-center text-lg font-semibold sm:text-xl",
                      isDarkMode ? "text-white" : "text-slate-900"
                    )}
                  >
                    How it works
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        heading: "Schedule Pickup",
                        subtext: "Choose time and share package details online",
                        image: scl1,
                        gradient: "from-blue-100 to-white",
                      },
                      {
                        heading: "Pickup Confirmed",
                        subtext: "Instant confirmation and dispatch scheduling",
                        image: scl2,
                        gradient: "from-purple-100 to-white",
                      },
                      {
                        heading: "Secure Transit",
                        subtext: "Tamper-evident handling and verified custody",
                        image: scl3,
                        gradient: "from-green-100 to-white",
                      },
                      {
                        heading: "Delivered with Care",
                        subtext: "Professional handover and confirmation",
                        image: scl4,
                        gradient: "from-orange-100 to-white",
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className={cn(
                            "h-32 w-full border transition overflow-hidden rounded-lg",
                            isDarkMode
                              ? "border-slate-700/60 bg-slate-800/60 shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                              : `border-slate-200/80 bg-gradient-to-br ${item.gradient} shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,rgba(0,0,0,0.3)_0px_3px_7px_-3px]`
                          )}
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.heading}
                              className="h-full w-full object-contain p-0.5"
                              style={{ 
                                transform: item.heading === "Schedule Pickup" ? "scale(1.3)" : "scale(1)",
                                transformOrigin: "center"
                              }}
                            />
                          )}
                        </div>
                        <h4
                          className={cn(
                            "mt-3 text-center text-base font-semibold transition-colors",
                            isDarkMode ? "text-slate-100" : "text-slate-900"
                          )}
                        >
                          {item.heading}
                        </h4>
                        <p
                          className={cn(
                            "mt-1 text-center text-xs transition-colors",
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          )}
                        >
                          {item.subtext}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="grid gap-3 sm:gap-4 lg:grid-cols-[2fr_1fr]">
                  <div
                    className={cn(
                      "border transition overflow-hidden",
                      isDarkMode
                        ? "border-slate-800/60 bg-slate-900/60"
                        : "border-slate-200 bg-white"
                    )}
                    style={{ height: "180px" }}
                  >
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3
                      className={cn(
                        "text-sm font-semibold sm:text-base",
                        isDarkMode ? "text-white" : "text-slate-900"
                      )}
                    >
                      Quick actions
                    </h3>
                    <div className="space-y-2">
                      {[
                        "Download latest reports",
                        "Invite your team",
                        "Set delivery preferences",
                      ].map((action) => (
                        <Button
                          key={action}
                          variant="outline"
                          className={cn(
                            "group w-full justify-start gap-2 border text-xs transition shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,rgba(0,0,0,0.3)_0px_3px_7px_-3px]",
                            isDarkMode
                              ? "border-slate-800 bg-transparent text-slate-200 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-slate-100"
                              : "border-slate-200 bg-white text-slate-600 hover:border-blue-400/40 hover:bg-blue-50 hover:text-slate-900"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition",
                              isDarkMode
                                ? "bg-slate-800/70 text-blue-200 group-hover:text-blue-100"
                                : "bg-blue-50 text-blue-600 group-hover:text-blue-700"
                            )}
                          >
                            <Sparkles size={12} />
                          </span>
                          <span className="truncate">{action}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            )}
            {activeItem === "booknow" && (
              <section className="relative w-full min-w-0 transition">
                <BookNow isDarkMode={isDarkMode} />
              </section>
            )}
            {activeItem === "mybooking" && (
              <section className="relative w-full min-w-0 transition">
                <MyBooking isDarkMode={isDarkMode} />
              </section>
            )}
            {activeItem === "tracking" && (
              <section className="relative w-full min-w-0 transition">
                <CustomerTracking isDarkMode={isDarkMode} />
              </section>
            )}
            {activeItem === "contactsupport" && (
              <section className="relative w-full min-w-0 transition">
                <ContactSupport isDarkMode={isDarkMode} />
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;

