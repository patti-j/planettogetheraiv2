import { useDeviceType } from "@/hooks/useDeviceType";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import MobileHomePage from "@/pages/mobile-home";
import HomePage from "@/pages/home";
import TopMenu from "@/components/top-menu";
import { MobileLayout } from "@/components/navigation/mobile-layout";

export function SmartHomeWrapper() {
  const deviceType = useDeviceType();
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Debug logging to understand what's happening
  console.log('SmartHomeWrapper - Device Type:', deviceType, 'Window Width:', window.innerWidth, 'Location:', location);
  
  // For authenticated users, handle routing properly
  // Remove the authentication check that was causing blank page
  
  // On mobile devices, redirect to mobile-home for authenticated users
  if (deviceType === "mobile" && window.innerWidth < 768) {
    // Don't redirect if we're on login, portal, or other public routes
    const publicRoutes = ['/login', '/portal', '/home', '/marketing', '/pricing'];
    const isPublicRoute = publicRoutes.some(route => location.includes(route));
    
    // Only redirect authenticated users who aren't on mobile or public routes
    if (!location.includes('/mobile') && !isPublicRoute && isAuthenticated) {
      console.log('Redirecting authenticated mobile user to mobile-home from:', location);
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
  
  // On desktop, show the new HomePage only for root route
  if (location === "/" || location === "/home") {
    console.log('Loading HomePage for desktop root');
    return <HomePage />;
  }
  
  // For other routes on desktop, render nothing and let the parent router handle it
  // This component should only handle the home route redirection
  console.log('SmartHomeWrapper - Not handling route:', location);
  return null;
}