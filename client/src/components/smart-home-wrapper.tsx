import { useDeviceType } from "@/hooks/useDeviceType";
import MobileHomePage from "@/pages/mobile-home";
import Homepage from "@/pages/homepage";

export function SmartHomeWrapper() {
  const deviceType = useDeviceType();
  
  // Automatically show mobile home for mobile devices, regular home for desktop
  if (deviceType === "mobile") {
    return <MobileHomePage />;
  }
  
  return <Homepage />;
}