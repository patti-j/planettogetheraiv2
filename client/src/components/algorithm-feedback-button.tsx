import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface AlgorithmFeedbackButtonProps {
  algorithmName?: string;
  algorithmVersion?: string;
  executionId?: string;
  schedulingHistoryId?: number;
  algorithmPerformanceId?: number;
  optimizationRunId?: number;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  buttonText?: string;
  triggerContext?: string; // e.g., "scheduling-results", "optimization-complete"
}

export function AlgorithmFeedbackButton({
  algorithmName = "",
  algorithmVersion = "1.0.0",
  executionId,
  schedulingHistoryId,
  algorithmPerformanceId,
  optimizationRunId,
  variant = "outline",
  size = "sm",
  className = "",
  buttonText = "Feedback",
  triggerContext
}: AlgorithmFeedbackButtonProps) {
  const [, setLocation] = useLocation();

  const handleFeedbackClick = () => {
    // Enhance algorithm context with better defaults
    const algorithmContext = {
      algorithmName: algorithmName || "backwards-scheduling", // Default to most common algorithm
      algorithmVersion: algorithmVersion || "1.0.0",
      executionId: executionId || `exec_${Date.now()}`, // Generate execution ID if not provided
      schedulingHistoryId,
      algorithmPerformanceId,
      optimizationRunId,
      triggerContext: triggerContext || "manual-feedback",
      // Add timestamp for better tracking
      contextTimestamp: new Date().toISOString(),
      // Add source page for better context
      sourcePage: window.location.pathname
    };
    
    sessionStorage.setItem('algorithmFeedbackContext', JSON.stringify(algorithmContext));
    
    // Navigate to unified feedback page (now all feedback is unified)
    setLocation('/feedback?tab=submit&type=algorithm');
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleFeedbackClick}
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      {buttonText}
    </Button>
  );
}