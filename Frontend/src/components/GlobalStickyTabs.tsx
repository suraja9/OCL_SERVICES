import React from "react";
import { useLocation } from "react-router-dom";
import StickyTabs from "./StickyTabs";

interface GlobalStickyTabsProps {
  children: React.ReactNode;
}

const GlobalStickyTabs: React.FC<GlobalStickyTabsProps> = ({ children }) => {
  const location = useLocation();
  // Only show tabs on the homepage
  const showTabs = location.pathname === "/";
  return (
    <>
      {children}
      {showTabs && <StickyTabs />}
    </>
  );
};

export default GlobalStickyTabs;
