import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";
import { GuidedTour } from "./guided-tour";
import { useTour } from "@/contexts/TourContext";

interface ResumeTourButtonProps {
  className?: string;
}

export function ResumeTourButton({ className = "" }: ResumeTourButtonProps) {
  const [showButton, setShowButton] = useState(false);
  const [tourState, setTourState] = useState<any>(null);
  const [showTour, setShowTour] = useState(false);
  const { isActive: isTourActive } = useTour();

  useEffect(() => {
    // Check if there's a saved tour state
    const savedState = localStorage.getItem('tourProgress');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Only show if the tour was paused recently (within 24 hours)
        const hoursSinceExit = (Date.now() - parsedState.timestamp) / (1000 * 60 * 60);
        if (hoursSinceExit < 24) {
          setTourState(parsedState);
          setShowButton(true);
        } else {
          // Clean up old tour state
          localStorage.removeItem('tourProgress');
        }
      } catch (error) {
        console.error("Failed to parse saved tour state:", error);
        localStorage.removeItem('tourProgress');
      }
    }
  }, []);

  const handleResumeTour = () => {
    setShowTour(true);
    setShowButton(false);
  };

  const handleDismiss = () => {
    localStorage.removeItem('tourProgress');
    setShowButton(false);
  };

  const handleTourComplete = () => {
    localStorage.removeItem('tourProgress');
    setShowTour(false);
  };

  const handleTourSkip = () => {
    // Don't remove the tour state when skipped again - keep it for later resume
    setShowTour(false);
    setShowButton(true);
  };

  // Don't show resume button if there's an active tour running
  if (!showButton && !showTour) return null;
  if (isTourActive && !showTour) return null;

  return (
    <>
      {/* Resume Tour Button */}
      {showButton && (
        <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
          <div className="bg-white shadow-lg rounded-lg border p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Play className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm">Resume Demo Tour</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Continue your {tourState?.role?.replace('-', ' ')} demo from step {(tourState?.currentStep || 0) + 1}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    onClick={handleResumeTour}
                    className="text-xs"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Resume
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDismiss}
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumed Tour Component */}
      {showTour && tourState && (
        <GuidedTour
          roleId={tourState.roleId}
          initialStep={tourState.currentStep}
          initialVoiceEnabled={tourState.voiceEnabled}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </>
  );
}