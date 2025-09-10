import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Loader2, 
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap
} from 'lucide-react';
import { federationRegistry } from '@/lib/federation-bootstrap';
import { performanceMonitor, type PerformanceReport } from '../../../packages/federation-performance';

interface ModuleMetrics {
  moduleId: string;
  loadTime: number;
  initializationTime: number;
  memoryUsage: number;
  eventCount: number;
  status: string;
  errors: number;
}

interface PerformanceTrend {
  timestamp: Date;
  averageLoadTime: number;
  totalMemory: number;
  activeModules: number;
}

export function FederationPerformanceDashboard() {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [moduleStatus, setModuleStatus] = useState<Record<string, any>>({});
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Refresh performance data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Get current performance report
      const perfReport = performanceMonitor.generateReport();
      setReport(perfReport);
      
      // Get module status
      const status = federationRegistry.getModuleStatus();
      setModuleStatus(status);
      
      // Update trends
      const newTrend: PerformanceTrend = {
        timestamp: new Date(),
        averageLoadTime: perfReport.averageLoadTime,
        totalMemory: perfReport.totalMemoryUsage,
        activeModules: perfReport.totalModules
      };
      
      setTrends(prev => {
        const updated = [...prev, newTrend];
        // Keep last 20 data points
        return updated.slice(-20);
      });
    } catch (error) {
      console.error('Failed to refresh performance data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh setup
  useEffect(() => {
    refreshData();
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-500';
      case 'loading': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      case 'cached': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  // Get performance status
  const getPerformanceStatus = (loadTime: number, budget: number) => {
    const ratio = loadTime / budget;
    if (ratio <= 0.8) return { color: 'text-green-500', icon: CheckCircle, label: 'Good' };
    if (ratio <= 1) return { color: 'text-yellow-500', icon: AlertTriangle, label: 'Warning' };
    return { color: 'text-red-500', icon: AlertTriangle, label: 'Critical' };
  };

  return (
    <div className="space-y-6 p-6" data-testid="federation-performance-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Federation Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor module loading, memory usage, and system performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            data-testid="toggle-auto-refresh"
          >
            <Activity className="mr-2 h-4 w-4" />
            Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button 
            onClick={refreshData}
            disabled={isRefreshing}
            size="sm"
            data-testid="button-refresh"
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-modules">
              {report?.totalModules || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered modules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-load-time">
              {formatDuration(report?.averageLoadTime || 0)}
            </div>
            {trends.length > 1 && (
              <p className="text-xs text-muted-foreground flex items-center">
                {trends[trends.length - 1].averageLoadTime > trends[trends.length - 2].averageLoadTime ? (
                  <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                )}
                {Math.abs(
                  ((trends[trends.length - 1].averageLoadTime - trends[trends.length - 2].averageLoadTime) / 
                  trends[trends.length - 2].averageLoadTime) * 100
                ).toFixed(1)}% from last
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Memory</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-memory">
              {formatBytes(report?.totalMemoryUsage || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all modules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Latency</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-event-latency">
              {formatDuration(performanceMonitor.getAverageEventLatency())}
            </div>
            <p className="text-xs text-muted-foreground">
              Average processing time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Module Status</CardTitle>
              <CardDescription>Real-time status and metrics for all registered modules</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {Object.entries(moduleStatus).map(([moduleId, status]) => {
                    const metrics = status.performance;
                    const budget = moduleId.includes('core') ? 200 : 500;
                    const perfStatus = metrics ? getPerformanceStatus(metrics.loadTime, budget) : null;
                    
                    return (
                      <div key={moduleId} className="border rounded-lg p-4" data-testid={`module-status-${moduleId}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{moduleId}</h3>
                            <Badge className={getStatusColor(status.status)}>
                              {status.status}
                            </Badge>
                            {perfStatus && (
                              <Badge variant="outline" className={perfStatus.color}>
                                <perfStatus.icon className="h-3 w-3 mr-1" />
                                {perfStatus.label}
                              </Badge>
                            )}
                          </div>
                          {status.error && (
                            <Badge variant="destructive">Error</Badge>
                          )}
                        </div>
                        
                        {metrics && (
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Load Time:</span>
                              <p className="font-medium">{formatDuration(metrics.loadTime)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Init Time:</span>
                              <p className="font-medium">{formatDuration(metrics.initializationTime)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Memory:</span>
                              <p className="font-medium">{formatBytes(metrics.memoryUsage)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Events:</span>
                              <p className="font-medium">{metrics.eventCount}</p>
                            </div>
                          </div>
                        )}
                        
                        {metrics && metrics.loadTime > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Performance Budget</span>
                              <span>{Math.min(100, (metrics.loadTime / budget) * 100).toFixed(0)}%</span>
                            </div>
                            <Progress value={Math.min(100, (metrics.loadTime / budget) * 100)} />
                          </div>
                        )}
                        
                        {status.error && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{status.error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slowest Modules</CardTitle>
              <CardDescription>Modules with the highest load times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report?.slowestModules.map((module, index) => (
                  <div key={module.moduleId} className="flex items-center justify-between" data-testid={`slowest-module-${index}`}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{module.moduleId}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        Load: {formatDuration(module.loadTime)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Init: {formatDuration(module.initializationTime)}
                      </span>
                      <Badge variant={module.status === 'loaded' ? 'default' : 'secondary'}>
                        {module.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Module loading performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trends.slice(-10).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {trend.timestamp.toLocaleTimeString()}
                    </span>
                    <div className="flex gap-4">
                      <span>Load: {formatDuration(trend.averageLoadTime)}</span>
                      <span>Memory: {formatBytes(trend.totalMemory)}</span>
                      <span>Modules: {trend.activeModules}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Budget Violations</CardTitle>
              <CardDescription>Modules exceeding their performance budgets</CardDescription>
            </CardHeader>
            <CardContent>
              {report?.budgetViolations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No budget violations detected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {report?.budgetViolations.map((violation, index) => (
                    <Alert
                      key={index}
                      variant={violation.severity === 'error' ? 'destructive' : 'default'}
                      data-testid={`violation-${index}`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{violation.moduleId}</AlertTitle>
                      <AlertDescription>
                        {violation.metric}: {violation.actual.toFixed(0)} 
                        (budget: {violation.budget.toFixed(0)}) 
                        - {((violation.actual / violation.budget - 1) * 100).toFixed(0)}% over budget
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
              <CardDescription>Suggestions to improve module performance</CardDescription>
            </CardHeader>
            <CardContent>
              {report?.recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No recommendations at this time</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {report?.recommendations.map((recommendation, index) => (
                    <Alert key={index} data-testid={`recommendation-${index}`}>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>{recommendation}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}