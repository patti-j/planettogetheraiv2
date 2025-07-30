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
    // Store algorithm context in sessionStorage to pre-populate the form
    const algorithmContext = {
      algorithmName,
      algorithmVersion,
      executionId,
      schedulingHistoryId,
      algorithmPerformanceId,
      optimizationRunId,
      triggerContext
    };
    
    sessionStorage.setItem('algorithmFeedbackContext', JSON.stringify(algorithmContext));
    
    // Navigate to feedback page with algorithm tab active
    setLocation('/feedback?tab=algorithm');
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