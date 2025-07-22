import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GuidedTour } from "@/components/guided-tour";

interface TourContextType {
  isActive: boolean;
  currentRole: string;
  voiceEnabled: boolean;
  startTour: (role: string, voiceEnabled?: boolean) => void;
  completeTour: () => void;
  skipTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentRole, setCurrentRole] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Check localStorage for active tour on mount
  useEffect(() => {
    const savedTourState = localStorage.getItem("activeDemoTour");
    if (savedTourState) {
      const tourData = JSON.parse(savedTourState);
      setIsActive(true);
      setCurrentRole(tourData.role);
      setVoiceEnabled(tourData.voiceEnabled || false);
      console.log("Restored active tour from localStorage:", tourData);
    }
  }, []);

  const startTour = (role: string, voiceEnabledParam = false) => {
    console.log("Starting global tour for role:", role, "with voice:", voiceEnabledParam);
    setIsActive(true);
    setCurrentRole(role);
    setVoiceEnabled(voiceEnabledParam);
    
    // Save tour state to localStorage
    localStorage.setItem("activeDemoTour", JSON.stringify({ 
      role, 
      active: true, 
      voiceEnabled: voiceEnabledParam 
    }));
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

  return (
    <TourContext.Provider value={{
      isActive,
      currentRole,
      voiceEnabled,
      startTour,
      completeTour,
      skipTour
    }}>
      {children}
      
      {/* Global Tour Overlay - shows on any page when active */}
      {isActive && currentRole && (
        <GuidedTour
          role={currentRole}
          initialVoiceEnabled={voiceEnabled}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}