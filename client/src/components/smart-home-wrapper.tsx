import { useDeviceType } from "@/hooks/useDeviceType";
import { useLocation, Redirect } from "wouter";
import MobileHomePage from "@/pages/mobile-home";
import HomePage from "@/pages/home";
import TopMenu from "@/components/top-menu";
import { MobileLayout } from "@/components/navigation/mobile-layout";

export function SmartHomeWrapper() {
  const deviceType = useDeviceType();
  const [location] = useLocation();
  
  // Debug logging to understand what's happening
  console.log('SmartHomeWrapper - Device Type:', deviceType, 'Window Width:', window.innerWidth, 'Location:', location);
  
  // On mobile devices, always redirect to mobile-home for any non-mobile route
  if (deviceType === "mobile" && window.innerWidth < 768) {
    // Always redirect mobile users to mobile-home if not already there
    if (!location.includes('/mobile')) {
      console.log('Redirecting mobile user to mobile-home from:', location);
      return <Redirect to="/mobile-home" />;
    }
    // If already on a mobile route, render the page wrapped in MobileLayout
    console.log('Loading MobileHomePage for mobile device with MobileLayout wrapper');
    return (
      <MobileLayout>
        <MobileHomePage key={location} />
      </MobileLayout>
    );
  }
  
  // On desktop, show the new HomePage for root route
  if (location === "/" || location === "/home") {
    console.log('Loading HomePage for desktop root');
    return <HomePage />;
  }
  
  // For other routes on desktop, let the main router handle it
  return null;
}