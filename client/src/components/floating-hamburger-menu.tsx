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

  // Always show on all devices (removed device-specific visibility logic)
  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
      <Button
        onClick={() => {
          console.log("🍔 Hamburger button clicked");
          onToggle(!isOpen);
        }}
        variant="ghost"
        size="icon"
        className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg border-2 border-gray-300 dark:border-gray-600"
        style={{ 
          backgroundColor: isOpen ? '#ef4444' : '#3b82f6',
          color: 'white'
        }}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
      </Button>
    </div>
  );
}

export default FloatingHamburgerMenu;