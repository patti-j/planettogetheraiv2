import { useLocation, useRoute } from "wouter";
import { ArrowLeft, BarChart3, TrendingUp, Activity, AlertCircle, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useViewMode } from "@/hooks/use-view-mode";
import { Skeleton } from "@/components/ui/skeleton";
import OperationSequencerWidget from "@/components/widgets/operation-sequencer-widget";

interface Widget {
  id: number;
  title: string;
  type: string;
  targetPlatform: string;
  source: string;
  configuration: any;
  createdAt: string;
}

export default function MobileWidgetView() {
  const [, params] = useRoute("/widgets/:id");
  const [, setLocation] = useLocation();
  const { currentView } = useViewMode();
  
  const widgetId = params?.id;

  // Fetch widget data
  const { data: widget, isLoading } = useQuery<Widget>({
    queryKey: ['/api/mobile/widgets', widgetId],
    queryFn: async () => {
      const response = await fetch('/api/mobile/widgets');
      const widgets = await response.json();
      return widgets.find((w: Widget) => w.id.toString() === widgetId);
    },
    enabled: !!widgetId
  });

  const handleBack = () => {
    setLocation(currentView === "desktop" ? "/" : "/mobile-home");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50">
          <div className="flex items-center px-4 py-3">
            <Button variant="ghost" size="sm" onClick={handleBack} className="mr-3">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Widget Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The widget you're looking for doesn't exist.</p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'production-metrics':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Output</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">87%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">94%</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quality Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</span>
                    <span className="text-sm font-medium">98.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Defect Rate</span>
                    <span className="text-sm font-medium">1.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'equipment-status':
        return (
          <div className="space-y-3">
            {['Reactor 1', 'Mixer 2', 'Packaging Line'].map((equipment, index) => (
              <Card key={equipment}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Settings className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{equipment}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {index === 1 ? 'Maintenance' : 'Running'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={index === 1 ? 'destructive' : 'default'}>
                      {index === 1 ? 'Offline' : 'Online'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'quality-dashboard':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {['pH', 'Temperature', 'Purity'].map((test, index) => (
                <Card key={test}>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{test}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {test === 'pH' ? '7.2' : test === 'Temperature' ? '22°C' : '99.8%'}
                    </p>
                    <Badge variant="default" className="text-xs mt-1">Normal</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'inventory-tracking':
        return (
          <div className="space-y-3">
            {[
              { name: 'Raw Materials', level: 75, status: 'Good' },
              { name: 'Work in Progress', level: 45, status: 'Low' },
              { name: 'Finished Goods', level: 90, status: 'High' }
            ].map((item) => (
              <Card key={item.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <Badge variant={item.status === 'Low' ? 'destructive' : 'default'}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.level < 50 ? 'bg-red-600' : item.level < 80 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${item.level}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.level}% capacity</p>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'gantt-chart':
        return (
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Production Schedule</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {[
                    { task: 'PO-2025-001', progress: 85, eta: '2 hours' },
                    { task: 'PO-2025-002', progress: 40, eta: '6 hours' },
                    { task: 'PO-2025-003', progress: 10, eta: '12 hours' }
                  ].map((item) => (
                    <div key={item.task} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.task}</span>
                        <span className="text-gray-600 dark:text-gray-400">ETA: {item.eta}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'operation-sequencer':
        return (
          <div className="h-[600px]">
            <OperationSequencerWidget 
              configuration={widget.configuration}
              isDesktop={false}
            />
          </div>
        );

      case 'schedule-optimizer':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Schedule Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">94%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Efficiency</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">87%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Utilization</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current Schedule</span>
                    <Badge variant="outline" className="text-xs">Optimized</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Trade-off Analysis</span>
                    <Badge variant="secondary" className="text-xs">Available</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Bottlenecks</span>
                    <span className="text-sm font-medium text-orange-600">2 identified</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Reduce Setup Time</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">+12% efficiency gain</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Parallel Processing</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">-4 hours total time</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Resource Reallocation</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Resolve bottlenecks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                Apply Optimization
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                View Details
              </Button>
            </div>
          </div>
        );

      case 'atp-ctp':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">ATP/CTP Calculator</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Available to Promise</span>
                    <span className="text-sm font-medium text-green-600">2,450 units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Capable to Promise</span>
                    <span className="text-sm font-medium text-blue-600">3,200 units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Next Available</span>
                    <span className="text-sm font-medium">Jan 15, 2025</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Widget Preview</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is a {widget.type} widget from {widget.source}
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="flex items-center px-4 py-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="mr-3">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 dark:text-white">{widget.title}</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{widget.type} • {widget.source}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Widget
          </Badge>
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-4">
        {renderWidgetContent()}
        
        {/* Widget Info */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Widget Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-medium capitalize">{widget.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Source:</span>
                <span className="font-medium capitalize">{widget.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Platform:</span>
                <span className="font-medium capitalize">{widget.targetPlatform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="font-medium">
                  {new Date(widget.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}