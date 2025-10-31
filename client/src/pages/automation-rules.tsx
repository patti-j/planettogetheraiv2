import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings, Sparkles, PlayCircle, PauseCircle, Trash2, AlertCircle, 
  CheckCircle2, Eye, History, Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function AutomationRules() {
  const { toast } = useToast();
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Fetch automation rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/automation-rules']
  });

  // Fetch execution history
  const { data: executions = [] } = useQuery({
    queryKey: ['/api/automation-executions'],
    enabled: isHistoryOpen
  });

  // Toggle rule enabled/disabled
  const toggleRuleMutation = useMutation({
    mutationFn: (data: { id: number; isEnabled: boolean }) => 
      apiRequest(`/api/automation-rules/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled: data.isEnabled })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation-rules'] });
      toast({
        title: "Rule Updated",
        description: "Automation rule status has been updated"
      });
    }
  });

  // Delete rule
  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/automation-rules/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation-rules'] });
      toast({
        title: "Rule Deleted",
        description: "Automation rule has been deleted"
      });
    }
  });

  const getIssueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      at_risk_job: "At-Risk Job",
      buffer_shortage: "Buffer Shortage",
      resource_conflict: "Resource Conflict",
      quality_hold: "Quality Hold",
      deadline_risk: "Deadline Risk",
      capacity_overload: "Capacity Overload",
      material_shortage: "Material Shortage"
    };
    return labels[type] || type;
  };

  const getOutcomeColor = (outcome: string) => {
    const colors: Record<string, string> = {
      success: "text-green-600",
      failed: "text-red-600",
      skipped: "text-yellow-600",
      approved: "text-blue-600",
      rejected: "text-gray-600"
    };
    return colors[outcome] || "text-gray-600";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            AI Automation Rules
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage automatic resolution of recurring issues
          </p>
        </div>
        <Button onClick={() => setIsHistoryOpen(true)}>
          <History className="h-4 w-4 mr-2" />
          View History
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Automation rules allow the AI to automatically resolve similar issues when they occur in the future.
          You can enable, disable, or delete rules at any time.
        </AlertDescription>
      </Alert>

      {/* Active Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Rules</CardTitle>
          <CardDescription>
            Automation rules that are currently monitoring for issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rulesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No automation rules configured yet. When you receive an AI recommendation, 
                you can choose to automatically resolve similar issues in the future.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {rules.map((rule: any) => (
                <div 
                  key={rule.id} 
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{rule.ruleName}</h3>
                        {rule.isEnabled ? (
                          <Badge className="bg-green-600">
                            <PlayCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            <PauseCircle className="h-3 w-3 mr-1" />
                            Paused
                          </Badge>
                        )}
                        {rule.requiresApproval && (
                          <Badge variant="outline" className="text-blue-600">
                            Requires Approval
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rule.description || "No description"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Type: {getIssueTypeLabel(rule.issueType)}
                        </span>
                        <span>
                          Executed: {rule.executionCount || 0} times
                        </span>
                        {rule.lastExecutedAt && (
                          <span>
                            Last: {new Date(rule.lastExecutedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isEnabled}
                        onCheckedChange={(checked) => {
                          toggleRuleMutation.mutate({ id: rule.id, isEnabled: checked });
                        }}
                        disabled={toggleRuleMutation.isPending}
                        data-testid={`toggle-rule-${rule.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRule(rule);
                        }}
                        data-testid={`view-rule-${rule.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this automation rule?')) {
                            deleteRuleMutation.mutate(rule.id);
                          }
                        }}
                        disabled={deleteRuleMutation.isPending}
                        data-testid={`delete-rule-${rule.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rule Details Dialog */}
      {selectedRule && (
        <Dialog open={!!selectedRule} onOpenChange={() => setSelectedRule(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedRule.ruleName}</DialogTitle>
              <DialogDescription>Automation rule details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Issue Type</label>
                <p className="text-sm text-muted-foreground">
                  {getIssueTypeLabel(selectedRule.issueType)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Match Conditions</label>
                <pre className="text-sm bg-muted p-3 rounded-md mt-1 overflow-auto">
                  {JSON.stringify(selectedRule.matchConditions, null, 2)}
                </pre>
              </div>
              <div>
                <label className="text-sm font-medium">Actions</label>
                <pre className="text-sm bg-muted p-3 rounded-md mt-1 overflow-auto">
                  {JSON.stringify(selectedRule.actionPayload, null, 2)}
                </pre>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedRule.isEnabled ? "Active" : "Paused"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Notifications</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedRule.notifyOnExecution ? selectedRule.notificationChannel : "Disabled"}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Execution History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Execution History</DialogTitle>
            <DialogDescription>
              Recent automation executions across all rules
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {executions.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No execution history yet</AlertDescription>
              </Alert>
            ) : (
              executions.map((execution: any) => (
                <div key={execution.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Rule ID: {execution.ruleId}
                        </span>
                        <Badge className={getOutcomeColor(execution.outcome)}>
                          {execution.outcome}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(execution.executedAt).toLocaleString()}
                      </p>
                      {execution.errorMessage && (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {execution.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
