import { useDeviceType } from "@/hooks/useDeviceType";
import { useLocation, Redirect } from "wouter";
import MobileHomePage from "@/pages/mobile-home";
import TopMenu from "@/components/top-menu";

export function SmartHomeWrapper() {
  const deviceType = useDeviceType();
  const [location] = useLocation();
  
  // Debug logging to understand what's happening
  console.log('SmartHomeWrapper - Device Type:', deviceType, 'Window Width:', window.innerWidth, 'Location:', location);
  
  // On mobile devices, redirect to mobile-home for root routes
  if (deviceType === "mobile" && window.innerWidth < 768) {
    if (location === "/" || location === "/home") {
      console.log('Redirecting mobile root to mobile-home');
      return <Redirect to="/mobile-home" />;
    }
    // For other mobile routes, let MobileHomePage handle them
    console.log('Loading MobileHomePage for mobile device');
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