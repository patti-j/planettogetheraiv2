import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Sparkles, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AutomationToggleProps {
  /** Type of issue being resolved */
  issueType: "at_risk_job" | "buffer_shortage" | "resource_conflict" | "quality_hold" | "deadline_risk" | "capacity_overload" | "material_shortage";
  
  /** Default name for the automation rule */
  defaultRuleName?: string;
  
  /** Match conditions for this issue type */
  matchConditions: Record<string, any>;
  
  /** Actions to be automated */
  actionPayload: Record<string, any>;
  
  /** Callback when automation is enabled */
  onAutomationEnabled?: (ruleId: number) => void;
}

export function AutomationToggle({
  issueType,
  defaultRuleName,
  matchConditions,
  actionPayload,
  onAutomationEnabled
}: AutomationToggleProps) {
  const { toast } = useToast();
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [customRuleName, setCustomRuleName] = useState(defaultRuleName || "");

  const createRuleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/automation-rules', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation-rules'] });
      toast({
        title: "Automation Enabled",
        description: `Similar issues will be automatically resolved${requiresApproval ? ' after approval' : ''}.`,
      });
      onAutomationEnabled?.(data.id);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Enable Automation",
        description: error.message || "Could not create automation rule",
        variant: "destructive"
      });
    }
  });

  const handleToggle = (checked: boolean) => {
    setIsAutomationEnabled(checked);
    
    if (checked) {
      // Create the automation rule
      const issueTypeLabels: Record<string, string> = {
        at_risk_job: "At-Risk Jobs",
        buffer_shortage: "Buffer Shortages",
        resource_conflict: "Resource Conflicts",
        quality_hold: "Quality Holds",
        deadline_risk: "Deadline Risks",
        capacity_overload: "Capacity Overloads",
        material_shortage: "Material Shortages"
      };
      
      const ruleName = customRuleName || `Auto-resolve ${issueTypeLabels[issueType]}`;
      
      createRuleMutation.mutate({
        ruleName,
        description: `Automatically resolves ${issueTypeLabels[issueType].toLowerCase()} matching specified conditions`,
        issueType,
        matchConditions,
        actionPayload,
        isEnabled: true,
        requiresApproval,
        notifyOnExecution: true,
        notificationChannel: "toast"
      });
    }
  };

  const getIssueTypeLabel = () => {
    const labels: Record<string, string> = {
      at_risk_job: "at-risk jobs",
      buffer_shortage: "buffer shortages",
      resource_conflict: "resource conflicts",
      quality_hold: "quality holds",
      deadline_risk: "deadline risks",
      capacity_overload: "capacity overloads",
      material_shortage: "material shortages"
    };
    return labels[issueType] || "similar issues";
  };

  return (
    <div className="border rounded-lg p-4 bg-purple-50/50 dark:bg-purple-950/20">
      <Collapsible>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <div>
              <Label htmlFor="auto-resolve" className="text-base font-medium cursor-pointer">
                Auto-resolve similar issues
              </Label>
              <p className="text-sm text-muted-foreground">
                Let AI handle {getIssueTypeLabel()} automatically
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAutomationEnabled && (
              <Badge className="bg-purple-600">Automation Active</Badge>
            )}
            <Switch
              id="auto-resolve"
              checked={isAutomationEnabled}
              onCheckedChange={handleToggle}
              disabled={createRuleMutation.isPending}
              data-testid="toggle-auto-resolve"
            />
          </div>
        </div>

        <CollapsibleTrigger asButton className="w-full mt-3">
          <Button variant="ghost" size="sm" className="w-full">
            <ChevronDown className="h-4 w-4 mr-2" />
            Advanced Options
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-3 pt-3 border-t">
          <div className="space-y-2">
            <Label htmlFor="rule-name" className="text-sm">
              Rule Name (Optional)
            </Label>
            <Input
              id="rule-name"
              placeholder={`Auto-resolve ${getIssueTypeLabel()}`}
              value={customRuleName}
              onChange={(e) => setCustomRuleName(e.target.value)}
              data-testid="input-rule-name"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="require-approval"
              checked={requiresApproval}
              onCheckedChange={(checked) => setRequiresApproval(checked as boolean)}
              data-testid="checkbox-require-approval"
            />
            <Label
              htmlFor="require-approval"
              className="text-sm font-normal cursor-pointer"
            >
              Require manual approval before executing
            </Label>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-md">
            <Info className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">How it works</p>
              <p className="mt-1">
                When the AI detects {getIssueTypeLabel()} matching your criteria, 
                it will automatically apply the same resolution
                {requiresApproval ? ' after you approve it' : ''}.
                You can disable this automation at any time in Settings → Automation Rules.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/**
 * Example Usage in a Recommendation Modal:
 * 
 * ```tsx
 * <AutomationToggle
 *   issueType="at_risk_job"
 *   defaultRuleName="Expedite high-priority jobs"
 *   matchConditions={{
 *     minPriority: 4,
 *     maxBufferHours: 12
 *   }}
 *   actionPayload={{
 *     action: "expedite",
 *     operations: ["process_immediately", "alert_team"]
 *   }}
 *   onAutomationEnabled={(ruleId) => {
 *     console.log('Automation rule created:', ruleId);
 *   }}
 * />
 * ```
 */
