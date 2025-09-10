// Federation Health Dashboard Component
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Activity, AlertTriangle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getModuleHealth } from '../../../packages/federation-error-handler';

interface ModuleHealth {
  moduleId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  successRate: number;
  failureRate: number;
  totalErrors: number;
  isCircuitOpen: boolean;
  lastError?: Date;
  circuitOpenedAt?: Date;
  fallbackActive?: boolean;
}

interface ModuleError {
  id: string;
  moduleId: string;
  type: string;
  severity: string;
  message: string;
  timestamp: Date;
  recoveryAttempts: number;
  recoveryStrategy?: string;
  context?: any;
}

interface ModuleMetrics {
  [moduleId: string]: {
    throughput: number;
    latency: number;
    errorRate: number;
    availability: number;
  };
}

export function FederationHealthDashboard() {
  const [moduleHealth, setModuleHealth] = useState<ModuleHealth[]>([]);
  const [recentErrors, setRecentErrors] = useState<ModuleError[]>([]);
  const [moduleMetrics, setModuleMetrics] = useState<ModuleMetrics>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [showDebugMode, setShowDebugMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch health data
  const fetchHealthData = async () => {
    try {
      setIsRefreshing(true);
      
      // Get module health from federation error handler
      const healthData = await window.__FEDERATION_REGISTRY__?.getHealthReport();
      
      if (healthData) {
        const modules: ModuleHealth[] = Object.entries(healthData).map(([id, data]: any) => ({
          moduleId: id,
          status: data.status,
          successRate: data.successRate || 0,
          failureRate: data.failureRate || 0,
          totalErrors: data.totalErrors || 0,
          isCircuitOpen: data.isCircuitOpen || false,
          lastError: data.lastError ? new Date(data.lastError) : undefined,
          circuitOpenedAt: data.circuitOpenedAt ? new Date(data.circuitOpenedAt) : undefined,
          fallbackActive: data.fallbackActive || false
        }));
        
        setModuleHealth(modules);
      }
      
      // Get recent errors
      const errors = await window.__FEDERATION_REGISTRY__?.getRecentErrors(10);
      if (errors) {
        setRecentErrors(errors);
      }
      
      // Get metrics
      const metrics = await window.__FEDERATION_REGISTRY__?.getModuleMetrics();
      if (metrics) {
        setModuleMetrics(metrics);
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh health data
  useEffect(() => {
    fetchHealthData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Restart module
  const restartModule = async (moduleId: string) => {
    try {
      await window.__FEDERATION_REGISTRY__?.restartModule(moduleId);
      await fetchHealthData();
    } catch (error) {
      console.error(`Failed to restart module ${moduleId}:`, error);
    }
  };

  // Clear errors for module
  const clearModuleErrors = async (moduleId: string) => {
    try {
      await window.__FEDERATION_REGISTRY__?.clearErrors(moduleId);
      await fetchHealthData();
    } catch (error) {
      console.error(`Failed to clear errors for ${moduleId}:`, error);
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    const variants: any = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    };
    
    return (
      <Badge variant={variants[severity] || 'secondary'}>
        {severity}
      </Badge>
    );
  };

  // Calculate overall health
  const overallHealth = moduleHealth.reduce((acc, module) => {
    if (module.status === 'healthy') return acc;
    if (module.status === 'unhealthy') return Math.min(acc, 50);
    return Math.min(acc, 75);
  }, 100);

  return (
    <TooltipProvider>
      <div className="space-y-4" data-testid="federation-health-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Federation Health Monitor</h2>
            <p className="text-muted-foreground">Real-time module health and error tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebugMode(!showDebugMode)}
              data-testid="button-toggle-debug"
            >
              {showDebugMode ? 'Hide Debug' : 'Show Debug'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              data-testid="button-toggle-auto-refresh"
            >
              {autoRefresh ? 'Pause' : 'Resume'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHealthData}
              disabled={isRefreshing}
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Health</span>
                <span className="text-2xl font-bold">{overallHealth}%</span>
              </div>
              <Progress value={overallHealth} className="h-2" />
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {moduleHealth.filter(m => m.status === 'healthy').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Healthy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {moduleHealth.filter(m => m.status === 'degraded').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Degraded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {moduleHealth.filter(m => m.status === 'unhealthy').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Unhealthy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {moduleHealth.reduce((sum, m) => sum + m.totalErrors, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Errors</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleHealth.map((module) => (
            <Card
              key={module.moduleId}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedModule === module.moduleId ? 'ring-2 ring-primary' : ''
              } ${module.status === 'unhealthy' ? 'border-red-300' : ''}`}
              onClick={() => setSelectedModule(module.moduleId)}
              data-testid={`card-module-${module.moduleId}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getStatusIcon(module.status)}
                    {module.moduleId}
                  </CardTitle>
                  {module.isCircuitOpen && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Zap className="h-4 w-4 text-orange-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Circuit breaker is open
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium">{module.successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={module.successRate} className="h-1" />
                  
                  {module.totalErrors > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Errors</span>
                      <span className="font-medium text-red-600">{module.totalErrors}</span>
                    </div>
                  )}
                  
                  {module.fallbackActive && (
                    <Badge variant="outline" className="text-xs">
                      Fallback Active
                    </Badge>
                  )}
                  
                  {module.lastError && (
                    <div className="text-xs text-muted-foreground">
                      Last error: {new Date(module.lastError).toLocaleTimeString()}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        restartModule(module.moduleId);
                      }}
                      disabled={module.status === 'healthy'}
                      data-testid={`button-restart-${module.moduleId}`}
                    >
                      Restart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearModuleErrors(module.moduleId);
                      }}
                      disabled={module.totalErrors === 0}
                      data-testid={`button-clear-errors-${module.moduleId}`}
                    >
                      Clear Errors
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed View Tabs */}
        <Tabs defaultValue="errors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="errors">Recent Errors</TabsTrigger>
            <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
            {showDebugMode && <TabsTrigger value="debug">Debug Info</TabsTrigger>}
          </TabsList>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Last 10 errors across all modules</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {recentErrors.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No recent errors
                      </div>
                    ) : (
                      recentErrors.map((error) => (
                        <Alert
                          key={error.id}
                          className={`${
                            error.severity === 'critical' || error.severity === 'high'
                              ? 'border-red-300'
                              : ''
                          }`}
                        >
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle className="flex items-center justify-between">
                            <span>{error.moduleId}</span>
                            <div className="flex items-center gap-2">
                              {getSeverityBadge(error.severity)}
                              <span className="text-xs text-muted-foreground">
                                {new Date(error.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </AlertTitle>
                          <AlertDescription>
                            <div className="space-y-1">
                              <p>{error.message}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Type: {error.type}</span>
                                {error.recoveryAttempts > 0 && (
                                  <span>Recovery attempts: {error.recoveryAttempts}</span>
                                )}
                                {error.recoveryStrategy && (
                                  <span>Strategy: {error.recoveryStrategy}</span>
                                )}
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Real-time performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(moduleMetrics).map(([moduleId, metrics]) => (
                    <div key={moduleId} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{moduleId}</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Throughput</div>
                          <div className="text-lg font-bold">{metrics.throughput}/s</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Latency</div>
                          <div className="text-lg font-bold">{metrics.latency}ms</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Error Rate</div>
                          <div className="text-lg font-bold">{metrics.errorRate}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Availability</div>
                          <div className="text-lg font-bold">{metrics.availability}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {showDebugMode && (
            <TabsContent value="debug" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Debug Information</CardTitle>
                  <CardDescription>Detailed system state for debugging</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <pre className="text-xs">
                      {JSON.stringify(
                        {
                          moduleHealth,
                          recentErrors,
                          moduleMetrics,
                          selectedModule,
                          overallHealth
                        },
                        null,
                        2
                      )}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Critical Alerts */}
        {moduleHealth.some(m => m.status === 'unhealthy') && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Critical System Alert</AlertTitle>
            <AlertDescription>
              {moduleHealth.filter(m => m.status === 'unhealthy').length} module(s) are currently unhealthy.
              System may be operating in degraded mode with fallback data.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </TooltipProvider>
  );
}