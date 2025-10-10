import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Bot, ChevronDown, ChevronRight, Undo2, AlertTriangle, 
  CheckCircle, XCircle, Clock, Search, Filter, RotateCcw, 
  Eye, EyeOff, Calendar, User, Database, Zap, BarChart3,
  Factory, Package, Shield, Sparkles, X
} from 'lucide-react';
import { format } from 'date-fns';

interface AgentAction {
  id: number;
  sessionId: string;
  agentType: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  actionDescription: string;
  reasoning: string;
  userPrompt: string | null;
  beforeState: Record<string, any> | null;
  afterState: Record<string, any> | null;
  undoInstructions: {
    method: string;
    endpoint?: string;
    data?: Record<string, any>;
    dependencies?: string[];
  } | null;
  isUndone: boolean;
  undoneAt: string | null;
  undoneBy: number | null;
  parentActionId: number | null;
  batchId: string | null;
  executionTime: number | null;
  success: boolean;
  errorMessage: string | null;
  createdBy: number;
  createdAt: string;
  undoneByUser?: {
    id: number;
    username: string;
  };
  createdByUser?: {
    id: number;
    username: string;
  };
}

const agentTypeIcons = {
  max: Bot,
  scheduler: Calendar,
  optimizer: Zap,
  analytics: BarChart3,
  production: Factory,
  inventory: Package,
  quality: Shield,
  ai: Sparkles,
} as const;

const actionTypeColors = {
  create: 'bg-green-100 text-green-800 border-green-200',
  update: 'bg-blue-100 text-blue-800 border-blue-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
  optimize: 'bg-purple-100 text-purple-800 border-purple-200',
  analyze: 'bg-orange-100 text-orange-800 border-orange-200',
  generate: 'bg-teal-100 text-teal-800 border-teal-200',
} as const;

export default function AgentHistory() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterSuccess, setFilterSuccess] = useState<string>('all');
  const [expandedActions, setExpandedActions] = useState<Set<number>>(new Set());
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(null);
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agent actions
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['/api/agent-actions', searchTerm, filterAgent, filterAction, filterSuccess],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Undo action mutation
  const undoActionMutation = useMutation({
    mutationFn: async (actionId: number) => {
      return apiRequest(`/api/agent-actions/${actionId}/undo`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Action Undone",
        description: "The agent action has been successfully undone.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agent-actions'] });
      setShowUndoDialog(false);
      setSelectedAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Undo Failed",
        description: error.message || "Failed to undo the action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleExpanded = (actionId: number) => {
    setExpandedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  const canUndo = (action: AgentAction) => {
    return !action.isUndone && action.success && action.undoInstructions;
  };

  const getAgentIcon = (agentType: string) => {
    const IconComponent = agentTypeIcons[agentType as keyof typeof agentTypeIcons] || Bot;
    return <IconComponent className="h-4 w-4" />;
  };

  const getActionTypeColor = (actionType: string) => {
    return actionTypeColors[actionType as keyof typeof actionTypeColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const filteredActions = actions.filter((action: AgentAction) => {
    const matchesSearch = !searchTerm || 
      action.actionDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.reasoning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.userPrompt && action.userPrompt.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAgent = filterAgent === 'all' || action.agentType === filterAgent;
    const matchesAction = filterAction === 'all' || action.actionType === filterAction;
    const matchesSuccess = filterSuccess === 'all' || 
      (filterSuccess === 'success' && action.success) ||
      (filterSuccess === 'failure' && !action.success) ||
      (filterSuccess === 'undone' && action.isUndone);
    
    return matchesSearch && matchesAgent && matchesAction && matchesSuccess;
  });

  // Group actions by batch or session for better organization
  const groupedActions = filteredActions.reduce((groups: Record<string, AgentAction[]>, action: AgentAction) => {
    const key = action.batchId || action.sessionId;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(action);
    return groups;
  }, {});

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Action History</h1>
          <p className="text-muted-foreground">
            Track, understand, and manage all AI agent actions across your system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const previousPage = sessionStorage.getItem('previousPage') || '/production-scheduler';
              navigate(previousPage);
            }}
            className="flex-shrink-0"
            title="Close Agent History"
            data-testid="button-close-agent-history"
          >
            <X className="w-5 h-5" />
          </Button>
          <Badge variant="outline" className="px-3 py-1">
            {filteredActions.length} actions
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Agent Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="max">Max AI</SelectItem>
                <SelectItem value="scheduler">Scheduler</SelectItem>
                <SelectItem value="optimizer">Optimizer</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="optimize">Optimize</SelectItem>
                <SelectItem value="analyze">Analyze</SelectItem>
                <SelectItem value="generate">Generate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSuccess} onValueChange={setFilterSuccess}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Successful</SelectItem>
                <SelectItem value="failure">Failed</SelectItem>
                <SelectItem value="undone">Undone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span>Loading agent actions...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredActions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Actions Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterAgent !== 'all' || filterAction !== 'all' || filterSuccess !== 'all'
                  ? "No actions match your current filters."
                  : "No agent actions have been recorded yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActions).map(([groupKey, groupActions]) => (
              <Card key={groupKey} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="px-2 py-1">
                        {groupActions[0].batchId ? 'Batch' : 'Session'}: {groupKey.slice(0, 8)}...
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {groupActions.length} action{groupActions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(groupActions[0].createdAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {groupActions.map((action) => (
                      <div key={action.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center gap-2 mt-0.5">
                              {getAgentIcon(action.agentType)}
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getActionTypeColor(action.actionType)}`}
                              >
                                {action.actionType}
                              </Badge>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm mb-1">
                                {action.actionDescription}
                              </h4>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {action.createdByUser?.username || `User ${action.createdBy}`}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Database className="h-3 w-3" />
                                  {action.entityType}
                                  {action.entityId && ` #${action.entityId}`}
                                </span>
                                {action.executionTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {action.executionTime}ms
                                  </span>
                                )}
                              </div>
                              {action.userPrompt && (
                                <div className="mt-2 p-2 bg-muted rounded text-xs">
                                  <span className="font-medium">User Request: </span>
                                  {action.userPrompt}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {action.isUndone ? (
                              <Badge variant="secondary" className="text-xs">
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Undone
                              </Badge>
                            ) : action.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(action.id)}
                              className="px-2"
                            >
                              {expandedActions.has(action.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            {canUndo(action) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAction(action);
                                  setShowUndoDialog(true);
                                }}
                                className="px-2"
                              >
                                <Undo2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {expandedActions.has(action.id) && (
                          <div className="pt-3 border-t space-y-3">
                            <Tabs defaultValue="reasoning" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
                                <TabsTrigger value="changes">Changes</TabsTrigger>
                                <TabsTrigger value="undo">Undo Info</TabsTrigger>
                                <TabsTrigger value="technical">Technical</TabsTrigger>
                              </TabsList>
                              <TabsContent value="reasoning" className="mt-4">
                                <div className="p-3 bg-muted rounded text-sm">
                                  {action.reasoning}
                                </div>
                              </TabsContent>
                              <TabsContent value="changes" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {action.beforeState && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                        <EyeOff className="h-4 w-4" />
                                        Before
                                      </h5>
                                      <ScrollArea className="h-32 w-full border rounded p-2">
                                        <pre className="text-xs">
                                          {JSON.stringify(action.beforeState, null, 2)}
                                        </pre>
                                      </ScrollArea>
                                    </div>
                                  )}
                                  {action.afterState && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        After
                                      </h5>
                                      <ScrollArea className="h-32 w-full border rounded p-2">
                                        <pre className="text-xs">
                                          {JSON.stringify(action.afterState, null, 2)}
                                        </pre>
                                      </ScrollArea>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                              <TabsContent value="undo" className="mt-4">
                                {action.undoInstructions ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="font-medium">Method:</span>
                                      <Badge variant="outline">{action.undoInstructions.method}</Badge>
                                    </div>
                                    {action.undoInstructions.endpoint && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium">Endpoint:</span>
                                        <code className="bg-muted px-2 py-1 rounded text-xs">
                                          {action.undoInstructions.endpoint}
                                        </code>
                                      </div>
                                    )}
                                    {action.undoInstructions.dependencies && action.undoInstructions.dependencies.length > 0 && (
                                      <div className="text-sm">
                                        <span className="font-medium">Dependencies:</span>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {action.undoInstructions.dependencies.map((dep, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                              {dep}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    This action cannot be undone automatically.
                                  </p>
                                )}
                              </TabsContent>
                              <TabsContent value="technical" className="mt-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Session ID:</span>
                                    <div className="font-mono text-xs bg-muted p-1 rounded mt-1">
                                      {action.sessionId}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Agent Type:</span>
                                    <div className="mt-1">
                                      <Badge variant="outline">{action.agentType}</Badge>
                                    </div>
                                  </div>
                                  {action.parentActionId && (
                                    <div>
                                      <span className="font-medium">Parent Action:</span>
                                      <div className="mt-1">#{action.parentActionId}</div>
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium">Created:</span>
                                    <div className="text-xs mt-1">
                                      {format(new Date(action.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                                    </div>
                                  </div>
                                  {action.errorMessage && (
                                    <div className="col-span-2">
                                      <span className="font-medium text-red-600">Error:</span>
                                      <div className="text-xs bg-red-50 border border-red-200 p-2 rounded mt-1">
                                        {action.errorMessage}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Undo Confirmation Dialog */}
      <AlertDialog open={showUndoDialog} onOpenChange={setShowUndoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Confirm Undo Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to undo this action? This will attempt to revert the changes made by the agent.
              {selectedAction && (
                <div className="mt-3 p-3 bg-muted rounded">
                  <div className="font-medium text-sm mb-1">
                    {selectedAction.actionDescription}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAction.reasoning}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAction && undoActionMutation.mutate(selectedAction.id)}
              disabled={undoActionMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {undoActionMutation.isPending ? "Undoing..." : "Undo Action"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}