import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, RefreshCw, Info, Star, Bug, TrendingUp, Heart } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Submit algorithm feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      return apiRequest("POST", "/api/algorithm-feedback", feedbackData);
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your algorithm feedback! This helps improve our optimization algorithms.",
      });
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/algorithm-feedback"] });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit algorithm feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const feedbackData = {
      algorithmName: formData.get('algorithmName') as string,
      algorithmVersion: formData.get('algorithmVersion') as string,
      feedbackType: formData.get('feedbackType') as "improvement_suggestion" | "bug_report" | "performance_issue" | "positive_feedback",
      severity: formData.get('severity') as "low" | "medium" | "high" | "critical",
      category: formData.get('category') as "scheduling_accuracy" | "resource_utilization" | "performance" | "usability" | "results_quality",
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      expectedResult: (formData.get('expectedResult') as string) || undefined,
      actualResult: (formData.get('actualResult') as string) || undefined,
      suggestedImprovement: (formData.get('suggestedImprovement') as string) || undefined,
      executionId,
      schedulingHistoryId,
      algorithmPerformanceId,
      optimizationRunId,
      submittedBy: 1, // This would come from auth context
      status: 'open' as const,
      priority: formData.get('severity') as "low" | "medium" | "high" | "critical",
    };

    submitFeedbackMutation.mutate(feedbackData);
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case "improvement_suggestion": return <TrendingUp className="w-4 h-4" />;
      case "bug_report": return <Bug className="w-4 h-4" />;
      case "performance_issue": return <MessageSquare className="w-4 h-4" />;
      case "positive_feedback": return <Heart className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Algorithm Feedback</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Algorithm Name *
                </label>
                <Input 
                  name="algorithmName"
                  defaultValue={algorithmName}
                  placeholder="e.g., backwards-scheduling, forward-scheduling"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Algorithm Version *
                </label>
                <Input 
                  name="algorithmVersion"
                  defaultValue={algorithmVersion}
                  placeholder="e.g., 1.0.0, 2.1.3"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Feedback Type *
                </label>
                <Select name="feedbackType" value={feedbackType} onValueChange={setFeedbackType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feedback type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="improvement_suggestion">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Improvement Suggestion
                      </div>
                    </SelectItem>
                    <SelectItem value="bug_report">
                      <div className="flex items-center gap-2">
                        <Bug className="w-4 h-4" />
                        Bug Report
                      </div>
                    </SelectItem>
                    <SelectItem value="performance_issue">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Performance Issue
                      </div>
                    </SelectItem>
                    <SelectItem value="positive_feedback">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Positive Feedback
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Severity *
                </label>
                <Select name="severity" defaultValue="medium" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Category *
              </label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduling_accuracy">Scheduling Accuracy</SelectItem>
                  <SelectItem value="resource_utilization">Resource Utilization</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="usability">Usability</SelectItem>
                  <SelectItem value="results_quality">Results Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Title *
              </label>
              <Input 
                name="title"
                placeholder="Brief summary of your feedback"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Description *
              </label>
              <Textarea 
                name="description"
                placeholder="Detailed description of your feedback, observations, or issues"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Expected Result
                </label>
                <Textarea 
                  name="expectedResult"
                  placeholder="What did you expect the algorithm to do?"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Actual Result
                </label>
                <Textarea 
                  name="actualResult"
                  placeholder="What actually happened?"
                  rows={3}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Suggested Improvement
              </label>
              <Textarea 
                name="suggestedImprovement"
                placeholder="How do you think this could be improved?"
                rows={3}
              />
            </div>

            {executionId && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This feedback will be linked to execution run #{executionId}
                  {triggerContext && ` (${triggerContext})`}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={submitFeedbackMutation.isPending}
              >
                {submitFeedbackMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}