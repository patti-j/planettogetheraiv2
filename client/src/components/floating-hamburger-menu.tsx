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
  // Log when component renders
  console.log("🍔 FloatingHamburgerMenu rendering - isOpen:", isOpen, "window width:", window.innerWidth);
  
  const handleClick = () => {
    console.log("🏠 FloatingHamburger logo clicked - this should not be used in mobile");
    // Don't navigate - this component conflicts with mobile navigation
  };

  // Check if mobile device
  const isMobile = window.innerWidth < 768;
  
  // Always show on all devices (removed device-specific visibility logic)
  return (
    <div className={`fixed right-4 z-[9999] pointer-events-auto ${
      isMobile ? 'top-3' : 'top-4'
    }`}>
      <Button
        onClick={() => {
          console.log("🍔 Hamburger button clicked");
          onToggle(!isOpen);
        }}
        variant="ghost"
        size="icon"
        className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-700"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
    </div>
  );
}

export default FloatingHamburgerMenu;