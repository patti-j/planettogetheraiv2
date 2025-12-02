import { useState } from "react";
import { useLocation } from "wouter";
import { GuidedTour } from "@/components/guided-tour";

export default function GuidedTourPage() {
  const [, setLocation] = useLocation();
  const [showTour, setShowTour] = useState(true);

  const handleComplete = () => {
    setShowTour(false);
    setLocation("/");
  };

  const handleSkip = () => {
    setShowTour(false);
    setLocation("/");
  };

  if (!showTour) {
    return null;
  }

  return (
    <GuidedTour 
      roleId={1}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
