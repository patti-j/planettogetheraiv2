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
    console.log("🏠 FloatingHamburger logo clicked - this should not be used in mobile");
    // Don't navigate - this component conflicts with mobile navigation
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
      <Button
        onClick={() => onToggle(!isOpen)}
        variant="ghost"
        size="icon"
        className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
    </div>
  );
}

export default FloatingHamburgerMenu;