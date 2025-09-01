import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  Brain, 
  Target, 
  CheckCircle,
  AlertCircle,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AIReasoningProps {
  reasoning?: {
    thought_process: string[];
    decision_factors: string[];
    playbooks_consulted: string[];
    confidence_score: number;
    alternative_approaches?: string[];
  };
  playbooksUsed?: Array<{
    id: number;
    title: string;
    relevance_score: number;
    sections_used: string[];
    applied_rules?: string[];
  }>;
  onFeedback?: (feedback: 'helpful' | 'not_helpful', details?: string) => void;
  onEditPlaybook?: (playbookId: number) => void;
  onCreatePlaybook?: (context: string) => void;
}

export function AIReasoning({ 
  reasoning, 
  playbooksUsed = [], 
  onFeedback,
  onEditPlaybook,
  onCreatePlaybook
}: AIReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not_helpful' | null>(null);
  const { toast } = useToast();

  if (!reasoning && playbooksUsed.length === 0) {
    return null;
  }

  const handleFeedback = async (type: 'helpful' | 'not_helpful') => {
    setFeedbackGiven(type);
    if (onFeedback) {
      onFeedback(type);
    }
    
    // Track feedback for playbook effectiveness
    if (playbooksUsed.length > 0) {
      try {
        for (const playbook of playbooksUsed) {
          await apiRequest('/api/playbook-feedback', 'POST', {
            playbookId: playbook.id,
            effectiveness: type === 'helpful' ? 5 : 2,
            context: 'ai_reasoning'
          });
        }
        toast({
          title: "Feedback recorded",
          description: "Thank you for helping improve our AI guidance",
        });
      } catch (error) {
        console.error('Error recording feedback:', error);
      }
    }
  };

  const confidenceColor = reasoning?.confidence_score 
    ? reasoning.confidence_score >= 0.8 ? 'text-green-600' 
    : reasoning.confidence_score >= 0.6 ? 'text-yellow-600' 
    : 'text-orange-600'
    : 'text-gray-600';

  return (
    <Card className="mt-4 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-sm font-medium">AI Reasoning</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {reasoning?.confidence_score && (
              <Badge variant="outline" className={confidenceColor}>
                {Math.round(reasoning.confidence_score * 100)}% confident
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Playbooks Used */}
            {playbooksUsed.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span>Playbooks Consulted</span>
                </div>
                <div className="space-y-2 pl-6">
                  {playbooksUsed.map((playbook) => (
                    <div key={playbook.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{playbook.title}</span>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(playbook.relevance_score * 100)}% relevant
                          </Badge>
                          {onEditPlaybook && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditPlaybook(playbook.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {playbook.applied_rules && playbook.applied_rules.length > 0 && (
                        <div className="space-y-1">
                          {playbook.applied_rules.map((rule, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                              <span>{rule}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thought Process */}
            {reasoning?.thought_process && reasoning.thought_process.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span>Thought Process</span>
                </div>
                <div className="space-y-1 pl-6">
                  {reasoning.thought_process.map((thought, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="text-gray-400">{idx + 1}.</span>
                      <span>{thought}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision Factors */}
            {reasoning?.decision_factors && reasoning.decision_factors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span>Decision Factors</span>
                </div>
                <div className="flex flex-wrap gap-1 pl-6">
                  {reasoning.decision_factors.map((factor, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Alternative Approaches */}
            {reasoning?.alternative_approaches && reasoning.alternative_approaches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span>Alternative Approaches</span>
                </div>
                <div className="space-y-1 pl-6">
                  {reasoning.alternative_approaches.map((approach, idx) => (
                    <div key={idx} className="text-xs text-gray-600">
                      • {approach}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Section */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Was this reasoning helpful?</span>
                <div className="flex items-center gap-2">
                  {!feedbackGiven ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback('helpful')}
                        className="h-7 px-2"
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        <span className="text-xs">Yes</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback('not_helpful')}
                        className="h-7 px-2"
                      >
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        <span className="text-xs">No</span>
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-green-600">Thank you for your feedback!</span>
                  )}
                  {onCreatePlaybook && playbooksUsed.length === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCreatePlaybook('current_context')}
                      className="h-7 px-2 ml-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span className="text-xs">Create Playbook</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}