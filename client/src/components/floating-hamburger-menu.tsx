import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import planetTogetherLogo from "@/assets/planet-together-logo.png";
import { useDeviceType } from "@/hooks/useDeviceType";

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
  const deviceType = useDeviceType();
  
  // Log when component renders
  console.log("🍔 FloatingHamburgerMenu rendering - isOpen:", isOpen, "window width:", window.innerWidth);
  
  const handleClick = () => {
    console.log("🏠 FloatingHamburger logo clicked - this should not be used in mobile");
    // Don't navigate - this component conflicts with mobile navigation
  };

  // Check if mobile device
  const isMobile = window.innerWidth < 768;
  
  // Hide on desktop since we have hamburger menu in desktop top bar
  if (deviceType === 'desktop') {
    return null;
  }
  
  // Always show on all devices (removed device-specific visibility logic)
  // Position at right-6 on all devices to avoid scrollbar overlap
  return (
    <Button
      onClick={() => {
        console.log("🍔 Hamburger button clicked");
        onToggle(!isOpen);
      }}
      variant="outline"
      size="sm"
      className={`fixed pointer-events-auto shadow-md border transition-all duration-200 ${
        isMobile ? 'right-2 top-16' : 'right-8 top-4'
      } ${
        isOpen 
          ? 'bg-red-500 hover:bg-red-600 text-white border-red-400 dark:bg-red-600 dark:hover:bg-red-700 dark:border-red-500' 
          : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400 dark:bg-blue-600 dark:hover:bg-blue-700 dark:border-blue-500'
      }`}
      style={{ zIndex: 2147483646 }}
      aria-label={isOpen ? "Close menu" : "Open menu"}>
      {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
    </Button>
  );
}

export default FloatingHamburgerMenu;