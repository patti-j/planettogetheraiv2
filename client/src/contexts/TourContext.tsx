import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GuidedTour } from "@/components/guided-tour";
import { useAuth } from "@/hooks/useAuth";

interface TourContextType {
  isActive: boolean;
  currentRoleId: number | null;
  voiceEnabled: boolean;
  startTour: (roleId: number, voiceEnabled?: boolean) => void;
  completeTour: () => void;
  skipTour: () => void;
  closeTour: () => void;
  switchToRole: (newRoleId: number) => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentRoleId, setCurrentRoleId] = useState<number | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();

  // Check localStorage for active tour on mount
  useEffect(() => {
    const savedTourState = localStorage.getItem("activeDemoTour");
    if (savedTourState) {
      const tourData = JSON.parse(savedTourState);
      setIsActive(true);
      setCurrentRoleId(tourData.roleId);
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
      setCurrentRoleId(null);
      setVoiceEnabled(false);
      localStorage.removeItem("activeDemoTour");
    }
  }, [isAuthenticated, isLoading, isActive]);

  const startTour = (roleId: number, voiceEnabledParam = false) => {
    console.log("TourContext startTour called with roleId:", roleId, "voiceEnabledParam:", voiceEnabledParam);
    setIsActive(true);
    setCurrentRoleId(roleId);
    setVoiceEnabled(voiceEnabledParam);
    
    // Save tour state to localStorage
    const tourData = { 
      roleId, 
      active: true, 
      voiceEnabled: voiceEnabledParam 
    };
    localStorage.setItem("activeDemoTour", JSON.stringify(tourData));
    console.log("Saved tour state to localStorage:", tourData);
  };

  const completeTour = () => {
    console.log("Completing global tour");
    setIsActive(false);
    setCurrentRoleId(null);
    localStorage.removeItem("activeDemoTour");
    
    // Invalidate role-related cache to update role switcher display
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/current-role`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/assigned-roles`] });
    }
  };

  const skipTour = () => {
    console.log("Skipping global tour");
    setIsActive(false);
    setCurrentRoleId(null);
    localStorage.removeItem("activeDemoTour");
    
    // Invalidate role-related cache to update role switcher display
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/current-role`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/assigned-roles`] });
    }
  };

  const closeTour = () => {
    console.log("Closing tour (triggered by logout)");
    setIsActive(false);
    setCurrentRoleId(null);
    setVoiceEnabled(false);
    localStorage.removeItem("activeDemoTour");
    
    // Invalidate role-related cache to update role switcher display
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/current-role`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/assigned-roles`] });
    }
  };

  const switchToRole = (newRoleId: number) => {
    console.log("Switching to new roleId:", newRoleId);
    setCurrentRoleId(newRoleId);
    
    // Update localStorage with new role but keep voice setting
    const tourData = { 
      roleId: newRoleId, 
      active: true, 
      voiceEnabled 
    };
    localStorage.setItem("activeDemoTour", JSON.stringify(tourData));
    console.log("Updated tour state for role switch:", tourData);
  };

  return (
    <TourContext.Provider value={{
      isActive,
      currentRoleId,
      voiceEnabled,
      startTour,
      completeTour,
      skipTour,
      closeTour,
      switchToRole
    }}>
      {children}
      
      {/* Global Tour Overlay - shows on any page when active */}
      {isActive && currentRoleId && (
        <GuidedTour
          roleId={currentRoleId}
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
      currentRoleId: null,
      voiceEnabled: false,
      startTour: () => {},
      completeTour: () => {},
      skipTour: () => {},
      switchToRole: () => {}
    };
  }
  return context;
}