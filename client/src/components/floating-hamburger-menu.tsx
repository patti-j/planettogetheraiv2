import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import planetTogetherLogo from "@/assets/planet-together-logo.png";

interface FloatingHamburgerMenuProps {
  onToggle: (isOpen: boolean) => void;
  isOpen?: boolean;
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
}

export function FloatingHamburgerMenu({ 
  onToggle, 
  isOpen = false, 
  showOnDesktop = true, 
  showOnMobile = true 
}: FloatingHamburgerMenuProps) {
  const handleClick = () => {
    console.log("🏠 Logo clicked! Navigating to homepage");
    window.location.href = '/';
  };

  // Show/hide based on device type
  let visibilityClass = "";
  if (showOnDesktop && showOnMobile) {
    visibilityClass = ""; // Show on all devices
  } else if (showOnDesktop && !showOnMobile) {
    visibilityClass = "hidden lg:block"; // Show only on desktop (lg and up)
  } else if (!showOnDesktop && showOnMobile) {
    visibilityClass = "lg:hidden"; // Show only on mobile (below lg)
  } else {
    return null; // Don't show at all
  }

  return (
    <div className={`fixed top-4 left-4 z-50 ${visibilityClass}`}>
      <div 
        onClick={handleClick}
        className="cursor-pointer group relative transition-all duration-200 hover:scale-110"
        title="Go to Homepage"
      >
        {/* Main logo - clickable to go home */}
        <img 
          src={planetTogetherLogo} 
          alt="PlanetTogether" 
          className="w-6 h-6 object-contain drop-shadow-md hover:drop-shadow-lg transition-all duration-200 rounded-full"
        />
      </div>
    </div>
  );
}

export default FloatingHamburgerMenu;