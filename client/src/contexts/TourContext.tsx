import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GuidedTour } from "@/components/guided-tour";
import { useAuth } from "@/hooks/useAuth";

interface TourContextType {
  isActive: boolean;
  currentRole: string;
  voiceEnabled: boolean;
  startTour: (role: string, voiceEnabled?: boolean) => void;
  completeTour: () => void;
  skipTour: () => void;
  switchToRole: (newRole: string) => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentRole, setCurrentRole] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  // Check localStorage for active tour on mount
  useEffect(() => {
    const savedTourState = localStorage.getItem("activeDemoTour");
    if (savedTourState) {
      const tourData = JSON.parse(savedTourState);
      setIsActive(true);
      setCurrentRole(tourData.role);
      setVoiceEnabled(tourData.voiceEnabled || false);
      console.log("Restored active tour from localStorage:", tourData, "voice enabled:", tourData.voiceEnabled);
    }
  }, []);

  // Monitor authentication state - close tour if user signs out (but not during demo transitions)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && isActive) {
      // Check if this is a demo authentication transition by looking for demo token or tour state
      const demoToken = localStorage.getItem("authToken");
      const savedTourState = localStorage.getItem("activeDemoTour");
      
      if (demoToken?.includes("demo_") || savedTourState) {
        console.log("Demo authentication transition detected - preserving tour state");
        return; // Don't close tour during demo authentication process
      }
      
      console.log("User signed out during tour - closing tour window");
      setIsActive(false);
      setCurrentRole("");
      setVoiceEnabled(false);
      localStorage.removeItem("activeDemoTour");
    }
  }, [isAuthenticated, isLoading, isActive]);

  const startTour = (role: string, voiceEnabledParam = false) => {
    console.log("TourContext startTour called with role:", role, "voiceEnabledParam:", voiceEnabledParam);
    setIsActive(true);
    setCurrentRole(role);
    setVoiceEnabled(voiceEnabledParam);
    
    // Save tour state to localStorage
    const tourData = { 
      role, 
      active: true, 
      voiceEnabled: voiceEnabledParam 
    };
    localStorage.setItem("activeDemoTour", JSON.stringify(tourData));
    console.log("Saved tour state to localStorage:", tourData);
  };

  const completeTour = () => {
    console.log("Completing global tour");
    setIsActive(false);
    setCurrentRole("");
    localStorage.removeItem("activeDemoTour");
  };

  const skipTour = () => {
    console.log("Skipping global tour");
    setIsActive(false);
    setCurrentRole("");
    localStorage.removeItem("activeDemoTour");
  };

  const switchToRole = (newRole: string) => {
    console.log("Switching to new role:", newRole);
    setCurrentRole(newRole);
    
    // Update localStorage with new role but keep voice setting
    const tourData = { 
      role: newRole, 
      active: true, 
      voiceEnabled 
    };
    localStorage.setItem("activeDemoTour", JSON.stringify(tourData));
    console.log("Updated tour state for role switch:", tourData);
  };

  return (
    <TourContext.Provider value={{
      isActive,
      currentRole,
      voiceEnabled,
      startTour,
      completeTour,
      skipTour,
      switchToRole
    }}>
      {children}
      
      {/* Global Tour Overlay - shows on any page when active */}
      {isActive && currentRole && (
        <GuidedTour
          role={currentRole}
          initialVoiceEnabled={voiceEnabled}
          onComplete={completeTour}
          onSkip={skipTour}
          onSwitchRole={switchToRole}
        />
      )}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    console.warn("useTour called outside TourProvider - returning default values");
    // Return default values instead of throwing to prevent crashes
    return {
      isActive: false,
      currentRole: "",
      voiceEnabled: false,
      startTour: () => {},
      completeTour: () => {},
      skipTour: () => {},
      switchToRole: () => {}
    };
  }
  return context;
}