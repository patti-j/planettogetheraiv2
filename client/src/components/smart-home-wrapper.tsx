import { useDeviceType } from "@/hooks/useDeviceType";
import { useLocation } from "wouter";
import MobileHomePage from "@/pages/mobile-home";
import DesktopHome from "@/pages/desktop-home";

export function SmartHomeWrapper() {
  const deviceType = useDeviceType();
  const [location] = useLocation();
  
  // On mobile devices, always show MobileHomePage which will handle routing internally
  // This ensures the mobile header is always present
  if (deviceType === "mobile") {
    // Pass the location as a prop so mobile home can react to route changes
    return <MobileHomePage key={location} />;
  }
  
  // On desktop, only show DesktopHome for the root route
  if (location === "/" || location === "/home") {
    return <DesktopHome />;
  }
  
  // For other routes on desktop, let the main router handle it
  return null;
}