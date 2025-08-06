import { useDeviceType } from "@/hooks/useDeviceType";
import { useLocation, Redirect } from "wouter";
import MobileHomePage from "@/pages/mobile-home";

export function SmartHomeWrapper() {
  const deviceType = useDeviceType();
  const [location] = useLocation();
  
  // Debug logging to understand what's happening
  console.log('SmartHomeWrapper - Device Type:', deviceType, 'Window Width:', window.innerWidth, 'Location:', location);
  
  // On mobile devices, always show MobileHomePage which will handle routing internally
  // This ensures the mobile header is always present
  if (deviceType === "mobile" && window.innerWidth < 768) {
    // Double-check that we're actually on mobile before loading mobile page
    console.log('Loading MobileHomePage for mobile device');
    // Pass the location as a prop so mobile home can react to route changes
    return <MobileHomePage key={location} />;
  }
  
  // On desktop, redirect root route to production schedule
  if (location === "/" || location === "/home") {
    console.log('Redirecting desktop root to production-schedule');
    return <Redirect to="/production-schedule" />;
  }
  
  // For other routes on desktop, let the main router handle it
  return null;
}