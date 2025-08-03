import { useLocation, useRoute } from "wouter";
import { ArrowLeft, BarChart3, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useViewMode } from "@/hooks/use-view-mode";
import { Skeleton } from "@/components/ui/skeleton";
import OperationSequencerWidget from "@/components/widgets/operation-sequencer-widget";
import AtpCtpWidget from "@/components/widgets/atp-ctp-widget";
import { SalesOrderStatusWidget } from "@/components/widgets/sales-order-status-widget";
import ReportsWidget from "@/components/widgets/reports-widget";
import ScheduleTradeoffAnalyzerWidget from "@/components/widgets/schedule-tradeoff-analyzer-widget";
import ScheduleOptimizationWidget from "@/components/schedule-optimization-widget";
import ProductionOrderStatusWidget from "@/components/widgets/production-order-status-widget";
import OperationDispatchWidget from "@/components/widgets/operation-dispatch-widget";
import ResourceAssignmentWidget from "@/components/widgets/resource-assignment-widget";

interface Widget {
  id: number;
  title: string;
  type: string;
  targetPlatform: string;
  source: string;
  configuration: any;
  createdAt: string;
}



// Dynamic widget component mapping
const WIDGET_COMPONENTS = {
  'operation-sequencer': OperationSequencerWidget,
  'atp-ctp': AtpCtpWidget,
  'sales-order-status': SalesOrderStatusWidget,
  'reports': ReportsWidget,
  'schedule-tradeoff-analyzer': ScheduleTradeoffAnalyzerWidget,
  'schedule-optimizer': ScheduleOptimizationWidget,
  'production-order-status': ProductionOrderStatusWidget,
  'operation-dispatch': OperationDispatchWidget,
  'resource-assignment': ResourceAssignmentWidget,
};

export default function MobileWidgetView() {
  const [, params] = useRoute("/widgets/:id");
  const [, setLocation] = useLocation();
  const { currentView } = useViewMode();
  
  const widgetId = params?.id ?? "";
  
  if (!params) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Invalid Route</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">No widget ID provided in the URL.</p>
          <Button onClick={() => setLocation("/mobile-home")}>Go Back</Button>
        </div>
      </div>
    );
  }

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

  const renderWidgetContent = () => {
    if (!widget) return null;

    // Check if we have a specific component for this widget type
    const WidgetComponent = WIDGET_COMPONENTS[widget.type as keyof typeof WIDGET_COMPONENTS];
    
    if (WidgetComponent) {
      // For mobile-specific props, we need to handle each component type
      const getComponentProps = () => {
        const baseProps = {
          configuration: widget.configuration,
          className: "w-full"
        };

        switch (widget.type) {
          case 'operation-sequencer':
            return { ...baseProps, isDesktop: false };
          
          case 'atp-ctp':
            return { 
              ...baseProps, 
              compact: widget.configuration?.compact || widget.configuration?.view === 'compact'
            };
          

          
          default:
            return baseProps;
        }
      };

      return (
        <div className="w-full">
          <WidgetComponent {...getComponentProps()} />
        </div>
      );
    }

    // For widget types without specific components, show a helpful message
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">{widget.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {widget.type} widget
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Widget component available in full desktop view
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-4"
            onClick={() => setLocation(`/${widget.type}`)}
          >
            View Full Widget
          </Button>
        </CardContent>
      </Card>
    );
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