import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Settings, 
  PlayCircle, 
  Clock, 
  TrendingUp,
  BarChart3,
  Target,
  Activity,
  Zap,
  History,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronRight,
  Calendar,
  Timer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ScheduleOptimizationWidgetProps {
  config?: {
    showQuickActions?: boolean;
    showHistory?: boolean;
    showMetrics?: boolean;
    maxHistoryItems?: number;
    defaultView?: 'overview' | 'history' | 'algorithms';
    showAlgorithmSelector?: boolean;
    showProfileSelector?: boolean;
  };
  configuration?: {
    view?: 'minimal' | 'compact' | 'standard';
    isCompact?: boolean;
    minimal?: boolean;
    [key: string]: any;
  };
  isCompact?: boolean;
  data?: any;
  onAction?: (action: string, data: any) => void;
}

interface OptimizationHistory {
  id: number;
  algorithmName: string;
  status: string;
  executedAt: string;
  executionTime: number;
  operationsCount: number;
  performanceScore: number;
  summary: string;
}

interface Algorithm {
  id: number;
  name: string;
  displayName: string;
  status: string;
  description: string;
}

interface Profile {
  id: number;
  name: string;
  description: string;
  isDefault: boolean;
  configuration?: {
    weights?: {
      [key: string]: number;
    };
  };
}

export default function ScheduleOptimizationWidget({ 
  config = {
    showQuickActions: true,
    showHistory: true,
    showMetrics: true,
    maxHistoryItems: 5,
    defaultView: 'overview',
    showAlgorithmSelector: true,
    showProfileSelector: true
  },
  configuration = {},
  isCompact = false,
  data,
  onAction
}: ScheduleOptimizationWidgetProps) {
  const [currentView, setCurrentView] = useState(config.defaultView || 'overview');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [optimizationDialog, setOptimizationDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileWeights, setProfileWeights] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch algorithms
  const { data: algorithms = [] } = useQuery({
    queryKey: ["/api/optimization/algorithms"],
    queryFn: async () => {
      const response = await fetch("/api/optimization/algorithms");
      return await response.json();
    }
  });

  // Fetch profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["/api/optimization/profiles"],
    queryFn: async () => {
      const response = await fetch("/api/optimization/profiles");
      return await response.json();
    }
  });

  // Fetch optimization history
  const { data: schedulingHistory = [] } = useQuery({
    queryKey: ["/api/optimization/scheduling-history"],
    queryFn: async () => {
      const response = await fetch("/api/optimization/scheduling-history");
      const data = await response.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    }
  });

  // Run optimization mutation
  const optimizationMutation = useMutation({
    mutationFn: async (data: { algorithmId: number; profileId: number; parameters?: any }) => {
      const response = await apiRequest("POST", "/api/optimization/execute", data);
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Optimization Started",
        description: `${selectedAlgorithm?.displayName || 'Algorithm'} is now running...`
      });
      setOptimizationDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/optimization/scheduling-history"] });
      onAction?.('optimization_started', result);
    },
    onError: (error) => {
      toast({
        title: "Optimization Failed",
        description: "Unable to start optimization. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "running": return "secondary";
      case "failed": return "destructive";
      case "cancelled": return "outline";
      default: return "outline";
    }
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Ensure schedulingHistory is always an array before using array methods
  const safeSchedulingHistory = Array.isArray(schedulingHistory) ? schedulingHistory : [];
  const recentOptimizations = safeSchedulingHistory.slice(0, config.maxHistoryItems || 5);
  const lastOptimization = safeSchedulingHistory[0];
  const runningOptimizations = safeSchedulingHistory.filter((h: OptimizationHistory) => h.status === 'running');

  // Auto-select default profile and approved algorithm on load
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      const defaultProfile = profiles.find((p: Profile) => p.isDefault) || profiles[0];
      setSelectedProfile(defaultProfile);
      setProfileWeights(defaultProfile?.configuration?.weights || {});
    }
  }, [profiles, selectedProfile]);

  useEffect(() => {
    if (algorithms.length > 0 && !selectedAlgorithm) {
      const approvedAlgorithms = algorithms.filter((a: Algorithm) => a.status === 'approved');
      if (approvedAlgorithms.length > 0) {
        setSelectedAlgorithm(approvedAlgorithms[0]);
      }
    }
  }, [algorithms, selectedAlgorithm]);

  // Determine view mode
  const viewMode = configuration.view || (isCompact ? 'compact' : 'standard');
  
  // Minimal view for widget bar
  if (viewMode === 'minimal' || configuration.minimal) {
    return (
      <div className="space-y-2 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium">Optimizer</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-5 px-1.5 text-[10px]"
            onClick={() => {
              if (selectedAlgorithm && selectedProfile) {
                optimizationMutation.mutate({
                  algorithmId: selectedAlgorithm.id,
                  profileId: selectedProfile.id,
                  parameters: { weights: profileWeights }
                });
              }
            }}
            disabled={!selectedAlgorithm || !selectedProfile || optimizationMutation.isPending}
          >
            {optimizationMutation.isPending ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <PlayCircle className="h-2.5 w-2.5" />
            )}
          </Button>
        </div>
        
        {/* Last optimization result */}
        {schedulingHistory && schedulingHistory.length > 0 && (
          <div className="text-[10px] space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Last Run</span>
              <Badge 
                variant={schedulingHistory[0]?.status === 'completed' ? 'default' : 'secondary'} 
                className="h-3 px-1 text-[8px]"
              >
                {schedulingHistory[0]?.status || 'Unknown'}
              </Badge>
            </div>
            {schedulingHistory[0]?.status === 'completed' && (
              <div className="flex items-center gap-2">
                <span className="text-foreground/80">Score:</span>
                <span className="font-medium text-green-600">
                  {schedulingHistory[0]?.performanceMetrics?.score || 'N/A'}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Standard view with Card wrapper
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Schedule Optimization
          </CardTitle>
          <div className="flex items-center gap-1">
            {config.showQuickActions && (
              <Dialog open={optimizationDialog} onOpenChange={setOptimizationDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 px-2">
                    <PlayCircle className="h-3 w-3 mr-1" />
                    Run
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Run Optimization
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {config.showAlgorithmSelector && (
                      <div>
                        <Label>Algorithm</Label>
                        <Select
                          value={selectedAlgorithm?.id?.toString()}
                          onValueChange={(value) => {
                            const algorithm = algorithms.find((a: Algorithm) => a.id === parseInt(value));
                            setSelectedAlgorithm(algorithm);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose algorithm..." />
                          </SelectTrigger>
                          <SelectContent>
                            {algorithms.filter((a: Algorithm) => a.status === 'approved').map((algorithm: Algorithm) => (
                              <SelectItem key={algorithm.id} value={algorithm.id.toString()}>
                                {algorithm.displayName || algorithm.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {config.showProfileSelector && (
                      <div>
                        <Label>Profile</Label>
                        <Select
                          value={selectedProfile?.id?.toString()}
                          onValueChange={(value) => {
                            const profile = profiles.find((p: Profile) => p.id === parseInt(value));
                            setSelectedProfile(profile);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose profile..." />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map((profile: Profile) => (
                              <SelectItem key={profile.id} value={profile.id.toString()}>
                                <div className="flex items-center gap-2">
                                  {profile.name}
                                  {profile.isDefault && (
                                    <Badge variant="secondary" className="text-xs">Default</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button 
                      onClick={() => {
                        if (selectedAlgorithm && selectedProfile) {
                          optimizationMutation.mutate({
                            algorithmId: selectedAlgorithm.id,
                            profileId: selectedProfile.id,
                            parameters: {
                              weights: profileWeights
                            }
                          });
                        }
                      }}
                      disabled={!selectedAlgorithm || !selectedProfile || optimizationMutation.isPending}
                      className="w-full"
                    >
                      {optimizationMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Run Optimization
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={() => setCurrentView(currentView === 'overview' ? 'history' : 'overview')}
            >
              {currentView === 'overview' ? <History className="h-3 w-3" /> : <BarChart3 className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {currentView === 'overview' && (
          <div className="space-y-4">
            {/* Algorithm and Profile Configuration */}
            <div className="space-y-3">
              {/* Selected Algorithm */}
              {selectedAlgorithm && (
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Algorithm</span>
                    </div>
                    <Select
                      value={selectedAlgorithm.id.toString()}
                      onValueChange={(value) => {
                        const algorithm = algorithms.find((a: Algorithm) => a.id === parseInt(value));
                        setSelectedAlgorithm(algorithm);
                      }}
                    >
                      <SelectTrigger className="w-auto h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {algorithms.filter((a: Algorithm) => a.status === 'approved').map((algorithm: Algorithm) => (
                          <SelectItem key={algorithm.id} value={algorithm.id.toString()}>
                            {algorithm.displayName || algorithm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedAlgorithm.description}</p>
                </div>
              )}

              {/* Selected Profile with Editable Weights */}
              {selectedProfile && (
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <div className="flex flex-col gap-2 mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Settings className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium">Profile</span>
                        {selectedProfile.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 flex-shrink-0"
                        onClick={() => setEditingProfile(!editingProfile)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center">
                      <Select
                        value={selectedProfile.id.toString()}
                        onValueChange={(value) => {
                          const profile = profiles.find((p: Profile) => p.id === parseInt(value));
                          setSelectedProfile(profile);
                          setProfileWeights(profile?.configuration?.weights || {});
                          setEditingProfile(false);
                        }}
                      >
                        <SelectTrigger className="w-full h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map((profile: Profile) => (
                            <SelectItem key={profile.id} value={profile.id.toString()}>
                              <div className="flex items-center gap-2">
                                {profile.name}
                                {profile.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{selectedProfile.description}</p>
                  
                  {/* Profile Weights Configuration */}
                  {selectedProfile.configuration?.weights && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Optimization Weights</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedProfile.configuration.weights).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs capitalize">{key}</span>
                            {editingProfile ? (
                              <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={profileWeights[key] || value}
                                onChange={(e) => {
                                  setProfileWeights(prev => ({
                                    ...prev,
                                    [key]: parseFloat(e.target.value)
                                  }));
                                }}
                                className="w-16 h-6 text-xs text-right bg-background border border-border rounded px-1"
                              />
                            ) : (
                              <span className="text-xs font-mono">{(profileWeights[key] || value).toFixed(1)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Overview */}
            {runningOptimizations.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {runningOptimizations.length} optimization{runningOptimizations.length > 1 ? 's' : ''} running
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {runningOptimizations[0].algorithmName}
                </div>
              </div>
            )}

            {/* Quick Metrics */}
            {config.showMetrics && lastOptimization && (
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="text-lg font-semibold">
                    {lastOptimization.performanceScore || 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">Performance Score</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="text-lg font-semibold">
                    {formatExecutionTime(lastOptimization.executionTime)}
                  </div>
                  <div className="text-xs text-muted-foreground">Last Runtime</div>
                </div>
              </div>
            )}

            {/* Recent History */}
            {config.showHistory && recentOptimizations.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Recent Optimizations
                </div>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {recentOptimizations.map((optimization: OptimizationHistory) => (
                      <div key={optimization.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Badge variant={getStatusColor(optimization.status)} className="text-xs px-1 py-0">
                            {optimization.status}
                          </Badge>
                          <span className="truncate font-medium">
                            {optimization.algorithmName}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(optimization.executedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {currentView === 'history' && (
          <div className="space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <History className="h-3 w-3" />
              Optimization History
            </div>
            <ScrollArea className="h-40">
              {schedulingHistory.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No optimization history</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {schedulingHistory.map((optimization: OptimizationHistory) => (
                    <div key={optimization.id} className="p-3 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(optimization.status)} className="text-xs">
                            {optimization.status}
                          </Badge>
                          <span className="font-medium text-sm">{optimization.algorithmName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(optimization.executedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Operations: {optimization.operationsCount || 0}</span>
                          <span>Runtime: {formatExecutionTime(optimization.executionTime)}</span>
                        </div>
                        {optimization.performanceScore && (
                          <div>Score: {optimization.performanceScore}</div>
                        )}
                        {optimization.summary && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {optimization.summary}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}