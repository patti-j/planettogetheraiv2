import { useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Activity, ChevronLeft, ChevronRight, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface AIInsight {
  id: string;
  type: 'insight' | 'anomaly' | 'recommendation' | 'simulation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  actionable: boolean;
  impact?: string;
  recommendation?: string;
}

export function AILeftPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');

  // Listen for toggle event from command palette
  useEffect(() => {
    const handleToggle = () => setIsCollapsed(!isCollapsed);
    document.addEventListener('toggle-ai-panel', handleToggle);
    return () => document.removeEventListener('toggle-ai-panel', handleToggle);
  }, [isCollapsed]);

  // Mock AI insights data - in production, this would come from the backend
  const mockInsights: AIInsight[] = [
    {
      id: '1',
      type: 'anomaly',
      title: 'Unusual Production Delay Detected',
      description: 'Production line A is operating 23% below expected capacity',
      priority: 'high',
      timestamp: '2 minutes ago',
      actionable: true,
      impact: 'May delay 3 orders by 2-4 hours',
      recommendation: 'Reallocate resources from Line B or schedule overtime'
    },
    {
      id: '2',
      type: 'insight',
      title: 'Optimal Resource Allocation Found',
      description: 'Rescheduling Order #PO-2025-003 could improve overall efficiency by 15%',
      priority: 'medium',
      timestamp: '10 minutes ago',
      actionable: true,
      impact: 'Save 4 hours of production time',
      recommendation: 'Move to Tuesday morning slot'
    },
    {
      id: '3',
      type: 'recommendation',
      title: 'Preventive Maintenance Suggested',
      description: 'CNC Machine 1 showing early signs of wear',
      priority: 'medium',
      timestamp: '1 hour ago',
      actionable: true,
      impact: 'Prevent potential 8-hour downtime',
      recommendation: 'Schedule maintenance for next weekend'
    },
    {
      id: '4',
      type: 'simulation',
      title: 'What-If Scenario Available',
      description: 'Impact analysis for rush order insertion completed',
      priority: 'low',
      timestamp: '2 hours ago',
      actionable: false,
      impact: 'Minimal disruption with proper sequencing'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return AlertTriangle;
      case 'insight': return TrendingUp;
      case 'recommendation': return Lightbulb;
      case 'simulation': return Activity;
      default: return Brain;
    }
  };

  return (
    <div className={cn(
      "h-full bg-background border-r transition-all duration-300 flex flex-col",
      isCollapsed ? "w-14" : "w-80"
    )}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold">Max AI Assistant</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(isCollapsed && "mx-auto")}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {/* AI Status */}
          <div className="p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">AI Active</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Analyzing production data in real-time
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-3 mx-4 mt-4">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
              <TabsTrigger value="simulations">Simulations</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-4">
              <TabsContent value="insights" className="mt-4 space-y-3">
                {mockInsights
                  .filter(i => i.type === 'insight' || i.type === 'recommendation')
                  .map(insight => (
                    <Card key={insight.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = getTypeIcon(insight.type);
                              return <Icon className="w-4 h-4 text-primary" />;
                            })()}
                            <CardTitle className="text-sm">{insight.title}</CardTitle>
                          </div>
                          <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                            {insight.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                        {insight.impact && (
                          <div className="text-xs bg-muted p-2 rounded mb-2">
                            <span className="font-medium">Impact: </span>
                            {insight.impact}
                          </div>
                        )}
                        {insight.actionable && (
                          <Button size="sm" className="w-full">
                            <Play className="w-3 h-3 mr-1" />
                            Apply Recommendation
                          </Button>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">{insight.timestamp}</div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="anomalies" className="mt-4 space-y-3">
                {mockInsights
                  .filter(i => i.type === 'anomaly')
                  .map(insight => (
                    <Card key={insight.id} className="cursor-pointer hover:bg-muted/50 transition-colors border-orange-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <CardTitle className="text-sm">{insight.title}</CardTitle>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            Anomaly
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                        {insight.impact && (
                          <div className="text-xs bg-orange-50 dark:bg-orange-950 p-2 rounded mb-2">
                            <span className="font-medium">Impact: </span>
                            {insight.impact}
                          </div>
                        )}
                        {insight.recommendation && (
                          <div className="text-xs bg-muted p-2 rounded mb-2">
                            <span className="font-medium">Recommendation: </span>
                            {insight.recommendation}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            Investigate
                          </Button>
                          <Button size="sm" className="flex-1">
                            Fix Now
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">{insight.timestamp}</div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="simulations" className="mt-4 space-y-3">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Quick Simulation
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Run what-if scenarios instantly
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Activity className="w-3 h-3 mr-2" />
                        Add Rush Order Impact
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Activity className="w-3 h-3 mr-2" />
                        Machine Downtime Scenario
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Activity className="w-3 h-3 mr-2" />
                        Resource Reallocation
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {mockInsights
                  .filter(i => i.type === 'simulation')
                  .map(insight => (
                    <Card key={insight.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" />
                          <CardTitle className="text-sm">{insight.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                        {insight.impact && (
                          <div className="text-xs bg-muted p-2 rounded mb-2">
                            {insight.impact}
                          </div>
                        )}
                        <Button size="sm" variant="outline" className="w-full">
                          View Results
                        </Button>
                        <div className="text-xs text-muted-foreground mt-2">{insight.timestamp}</div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </>
      )}

      {/* Collapsed state - show icon indicators */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Brain className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </Button>
          <Separator className="w-6" />
          <Button variant="ghost" size="icon" className="relative">
            <TrendingUp className="w-5 h-5" />
            <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center">
              3
            </Badge>
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center">
              1
            </Badge>
          </Button>
          <Button variant="ghost" size="icon">
            <Activity className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}