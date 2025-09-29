import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GuidedTour } from "@/components/guided-tour";
import { useAuth } from "@/hooks/useAuth";

interface TourContextType {
  isActive: boolean;
  currentRoleId: number | null;
  voiceEnabled: boolean;
  startTour: (roleId: number, voiceEnabled?: boolean, context?: 'training' | 'demo' | 'custom') => void;
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
  const [tourContext, setTourContext] = useState<'training' | 'demo' | 'custom'>('demo');
  const [originalRoleId, setOriginalRoleId] = useState<number | null>(null);
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
      setTourContext(tourData.context || 'demo');
      setOriginalRoleId(tourData.originalRoleId || null);
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

  const startTour = (roleId: number, voiceEnabledParam = false, context: 'training' | 'demo' | 'custom' = 'demo') => {
    console.log("TourContext startTour called with roleId:", roleId, "voiceEnabledParam:", voiceEnabledParam, "context:", context);
    
    try {
      // Validate parameters
      if (!roleId || (typeof roleId !== 'number' && typeof roleId !== 'string')) {
        console.error("Invalid roleId provided to startTour:", roleId);
        throw new Error("Invalid role ID provided");
      }
      
      // Convert string roleId to number if needed
      const numericRoleId = typeof roleId === 'string' ? parseInt(roleId, 10) : roleId;
      if (isNaN(numericRoleId)) {
        console.error("Could not convert roleId to number:", roleId);
        throw new Error("Invalid role ID format");
      }
      
      // Store original role for training context tours
      if (context === 'training' && user?.id) {
        // Get current role to restore later
        queryClient.fetchQuery({
          queryKey: [`/api/users/${user.id}/current-role`],
          queryFn: async () => {
            try {
              const response = await fetch(`/api/users/${user.id}/current-role`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
              });
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              return await response.json();
            } catch (fetchError) {
              console.error("Failed to fetch current role:", fetchError);
              throw fetchError;
            }
          }
        }).then(currentRole => {
          setOriginalRoleId(currentRole?.id || null);
          console.log("Stored original role for training context:", currentRole?.id);
        }).catch(err => {
          console.warn("Could not fetch current role:", err);
          setOriginalRoleId(null);
          // Continue with tour even if role fetching fails
        });
      }
      
      // Set tour state
      setIsActive(true);
      setCurrentRoleId(numericRoleId);
      setVoiceEnabled(voiceEnabledParam);
      setTourContext(context);
      
      // Save tour state to localStorage
      try {
        const tourData = { 
          roleId: numericRoleId, 
          active: true, 
          voiceEnabled: voiceEnabledParam,
          context,
          originalRoleId: context === 'training' ? originalRoleId : null
        };
        localStorage.setItem("activeDemoTour", JSON.stringify(tourData));
        console.log("Saved tour state to localStorage:", tourData);
      } catch (storageError) {
        console.warn("Failed to save tour state to localStorage:", storageError);
        // Continue with tour even if localStorage save fails
      }
      
      console.log("Tour started successfully");
    } catch (error) {
      console.error("Error starting tour:", error);
      
      // Reset tour state in case of error
      setIsActive(false);
      setCurrentRoleId(null);
      setVoiceEnabled(false);
      setTourContext('demo');
      
      // Re-throw error so it can be caught by the caller
      throw new Error(`Failed to start tour: ${error.message}`);
    }
  };

  const completeTour = () => {
    console.log("Completing global tour, context:", tourContext, "originalRoleId:", originalRoleId);
    
    // Handle role restoration based on context
    if (tourContext === 'training' && originalRoleId && user?.id) {
      // For training context, restore original role
      console.log("Restoring original role for training context:", originalRoleId);
      fetch(`/api/users/${user.id}/switch-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ roleId: originalRoleId })
      }).then(() => {
        console.log("Successfully restored original role");
        // Invalidate cache after role switch
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/current-role`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/assigned-roles`] });
      }).catch(err => {
        console.error("Failed to restore original role:", err);
        // Still invalidate cache even if role switch failed
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/current-role`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/assigned-roles`] });
      });
    } else {
      // For demo context, stay in current role but invalidate cache
      console.log("Demo context tour - staying in current role");
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/current-role`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/assigned-roles`] });
      }
    }
    
    setIsActive(false);
    setCurrentRoleId(null);
    setTourContext('demo');
    setOriginalRoleId(null);
    localStorage.removeItem("activeDemoTour");
  };

  const skipTour = () => {
    console.log("Skipping global tour, context:", tourContext, "originalRoleId:", originalRoleId);
    
    // Handle role restoration based on context (same logic as completeTour)
    if (tourContext === 'training' && originalRoleId && user?.id) {
      // For training context, restore original role
      console.log("Restoring original role for skipped training tour:", originalRoleId);
      fetch(`/api/users/${user.id}/switch-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ roleId: originalRoleId })
      }).then(() => {
        console.log("Successfully restored original role after skip");
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/current-role`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/assigned-roles`] });
      }).catch(err => {
        console.error("Failed to restore original role after skip:", err);
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/current-role`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/assigned-roles`] });
      });
    } else {
      // For demo context, stay in current role but invalidate cache
      console.log("Demo context tour skipped - staying in current role");
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/current-role`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/assigned-roles`] });
      }
    }
    
    setIsActive(false);
    setCurrentRoleId(null);
    setTourContext('demo');
    setOriginalRoleId(null);
    localStorage.removeItem("activeDemoTour");
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
    
    // Update localStorage with new role but keep voice setting and context
    const tourData = { 
      roleId: newRoleId, 
      active: true, 
      voiceEnabled,
      context: tourContext,
      originalRoleId 
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