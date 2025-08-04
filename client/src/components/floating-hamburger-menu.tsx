import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
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
    console.log("🍔 Floating hamburger clicked! Opening menu");
    onToggle(!isOpen);
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
        title="Open Menu"
      >
        {/* Main logo - clean without button styling */}
        <div className="flex flex-col items-center gap-1">
          <img 
            src={planetTogetherLogo} 
            alt="PlanetTogether" 
            className="w-8 h-8 object-contain drop-shadow-md hover:drop-shadow-lg transition-all duration-200 rounded-full"
          />
          {/* Hamburger lines underneath logo */}
          <div className="flex flex-col gap-0.5">
            <div className="w-4 h-0.5 bg-gray-600 dark:bg-gray-300 rounded-full"></div>
            <div className="w-3 h-0.5 bg-gray-600 dark:bg-gray-300 rounded-full"></div>
          </div>
        </div>
        
        {/* Close icon overlay when open */}
        {isOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-95 rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg">
            <X className="w-4 h-4 text-gray-800 dark:text-gray-200 stroke-2" />
          </div>
        )}
      </div>
    </div>
  );
}

export default FloatingHamburgerMenu;