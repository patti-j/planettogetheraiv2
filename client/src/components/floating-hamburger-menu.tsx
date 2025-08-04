import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
// For now, we'll use an SVG version of the logo to avoid asset path issues
const logoSvg = `data:image/svg+xml,${encodeURIComponent(`
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="url(#gradient)"/>
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6b7280;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="20" y="30" width="25" height="20" fill="white" rx="2"/>
  <rect x="20" y="55" width="15" height="15" fill="white" rx="2"/>
  <rect x="55" y="30" width="25" height="40" fill="white" rx="2"/>
</svg>
`)}`;

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
        <img 
          src={logoSvg} 
          alt="PlanetTogether" 
          className="w-10 h-10 object-contain drop-shadow-lg hover:drop-shadow-xl transition-all duration-200"
        />
        
        {/* Close icon overlay when open */}
        {isOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-95 rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg">
            <X className="w-6 h-6 text-gray-800 dark:text-gray-200 stroke-2" />
          </div>
        )}
      </div>
    </div>
  );
}

export default FloatingHamburgerMenu;