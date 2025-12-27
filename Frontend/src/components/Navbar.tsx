import { useState, useRef, useEffect } from "react";
import { ChevronDown, Menu, X, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import navData from "@/data/nav.json";
import oclLogo from "@/assets/ocl-logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Reset activeDropdown when mobile menu closes
  useEffect(() => {
    if (!isOpen) {
      setActiveDropdown(null);
    }
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && menuRef.current && navRef.current) {
        const target = event.target as Node;
        if (!menuRef.current.contains(target) && !navRef.current.contains(target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none">
      {/* Glass container wrapper (90% width, centered, margins) */}
      <div ref={navRef} className="w-[96%] mt-2">
        <div 
          className="pointer-events-auto flex items-center justify-between h-[48px] rounded-[50px] px-4 sm:px-6 border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
          style={{
            background: "rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {/* Left: Logo + Company name */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-95 transition-opacity duration-300">
            <img
              src={oclLogo}
              alt="OCL SERVICES"
              className="h-4 w-auto sm:h-5 md:h-6 lg:h-7"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
            />
            <div className="leading-tight hidden sm:block">
              
            </div>
          </Link>

          {/* Right Section - Menu Items */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Phone Icon */}
            <a
              href="tel:8453994809"
              className="lg:hidden p-2 rounded-full text-black hover:bg-white/20 transition-all duration-200 flex items-center justify-center"
              style={{ marginTop: "2px" }}
              aria-label="Call 8453994809"
            >
              <Phone className="h-5 w-5" />
            </a>
            {/* Mobile Ship Now Button */}
            {navData.navigation
              .filter((item) => item.type === "cta")
              .map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="lg:hidden rounded-full text-white font-semibold text-xs transition-all duration-200 ship-now-btn flex items-center justify-center"
                  style={{
                    background: "linear-gradient(90deg, #ff8c00, #ffbb33, #0078ff)",
                    backgroundSize: "200% auto",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "30px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    transition: "all 0.3s ease",
                    animation: "gradientShift 4s ease infinite",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 140, 0, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                  }}
                >
                  {item.label}
                </Link>
              ))}
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navData.navigation.map((item) => (
              <div 
                key={item.label} 
                className="relative group"
                onMouseEnter={() => item.type === "dropdown" && handleMouseEnter(item.label)}
                onMouseLeave={() => item.type === "dropdown" && handleMouseLeave()}
              >
                {item.type === "dropdown" ? (
                  <>
                    <button className="flex items-center space-x-1 px-3 py-2 text-black font-medium transition-colors duration-200">
                      <span>{item.label}</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {activeDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
                        {item.items?.map((subItem) => (
                          <Link
                            key={subItem.label}
                            to={subItem.href}
                            className="block px-4 py-3 text-sm text-black hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className={`px-3.5 py-2 font-semibold transition-all duration-200 ${
                      item.type === "cta" 
                        ? "rounded-full text-white ship-now-btn"
                        : "text-black rounded-full"
                    }`}
                    style={
                      item.type === "cta"
                        ? {
                            background: "linear-gradient(90deg, #ff8c00, #ffbb33, #0078ff)",
                            backgroundSize: "200% auto",
                            fontWeight: 600,
                            border: "none",
                            borderRadius: "30px",
                            padding: "10px 25px",
                            cursor: "pointer",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                            transition: "all 0.3s ease",
                            animation: "gradientShift 4s ease infinite",
                          }
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      if (item.type === "cta") {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 140, 0, 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (item.type === "cta") {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="text-black hover:bg-white/10"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="lg:hidden w-[96%] flex justify-end mt-2 pointer-events-auto animate-menu-slide-down">
          <div 
            ref={menuRef}
            className="w-[50%] border border-white/20 rounded-3xl px-3 py-2.5 space-y-0 animate-menu-fade-in"
            style={{
              background: "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            {navData.navigation
              .filter((item) => item.type !== "cta")
              .map((item, index) => (
              <div 
                key={item.label}
                className="animate-menu-item-fade-in"
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: 'both'
                }}
              >
                {item.type === "dropdown" ? (
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                      className="flex items-center justify-between w-full px-3 py-2 text-left text-black hover:bg-white/10 rounded-xl transition-colors duration-200"
                    >
                      <span className="font-medium">{item.label}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                        activeDropdown === item.label ? "rotate-180" : ""
                      }`} />
                    </button>
                    
                    {activeDropdown === item.label && (
                      <div className="mt-1 ml-2 space-y-1 border-l-2 border-white/20 pl-2.5 animate-dropdown-expand">
                        {item.items?.map((subItem, subIndex) => (
                          <Link
                            key={subItem.label}
                            to={subItem.href}
                            className="block px-3 py-1.5 text-sm text-black hover:bg-white/10 rounded-lg transition-colors duration-200 animate-dropdown-item-fade-in"
                            style={{
                              animationDelay: `${subIndex * 0.03}s`,
                              animationFillMode: 'both'
                            }}
                            onClick={() => setIsOpen(false)}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={`block px-3 py-2 rounded-full font-medium transition-all duration-200 ${
                      item.type === "cta" 
                        ? "text-white text-center ship-now-btn"
                        : "text-black hover:bg-white/10"
                    }`}
                    onClick={() => setIsOpen(false)}
                    style={
                      item.type === "cta"
                        ? {
                            background: "linear-gradient(90deg, #ff8c00, #ffbb33, #0078ff)",
                            backgroundSize: "200% auto",
                            fontWeight: 600,
                            border: "none",
                            borderRadius: "30px",
                            padding: "8px 20px",
                            cursor: "pointer",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                            transition: "all 0.3s ease",
                            animation: "gradientShift 4s ease infinite",
                          }
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      if (item.type === "cta") {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 140, 0, 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (item.type === "cta") {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gradient Animation Styles */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes menuSlideDown {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes menuFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes menuItemFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes dropdownExpand {
          0% {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }

        @keyframes dropdownItemFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-5px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-menu-slide-down {
          animation: menuSlideDown 0.3s ease-out;
        }

        .animate-menu-fade-in {
          animation: menuFadeIn 0.3s ease-out;
        }

        .animate-menu-item-fade-in {
          animation: menuItemFadeIn 0.3s ease-out;
        }

        .animate-dropdown-expand {
          animation: dropdownExpand 0.3s ease-out;
          overflow: hidden;
        }

        .animate-dropdown-item-fade-in {
          animation: dropdownItemFadeIn 0.2s ease-out;
        }

        .ship-now-btn {
          background: linear-gradient(90deg, #ff8c00, #ffbb33, #0078ff);
          background-size: 200% auto;
          animation: gradientShift 4s ease infinite;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;