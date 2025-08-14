import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, Pin, Maximize2, Clock, AlertTriangle, CheckCircle, Factory, Package, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  onPin: () => void;
  onMaximize: () => void;
  widgetType: string;
  widgetTitle: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  anchorElement?: HTMLElement | null;
}

export function WidgetFlyout({
  isOpen,
  onClose,
  onPin,
  onMaximize,
  widgetType,
  widgetTitle,
  position = 'top-right',
  anchorElement
}: WidgetFlyoutProps) {
  if (!isOpen) return null;

  const renderWidgetContent = () => {
    switch (widgetType) {
      case 'operation-sequencer':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Factory className="h-4 w-4" />
              <span className="text-sm font-medium">Next Operations</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded border bg-muted/50">
                <div className="text-xs">Mixing - Batch #2501</div>
                <Badge variant="secondary">Ready</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded border">
                <div className="text-xs">Pressing - Line A</div>
                <Badge variant="outline">Queued</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded border">
                <div className="text-xs">Coating - Pan #1</div>
                <Badge variant="outline">Scheduled</Badge>
              </div>
            </div>
          </div>
        );

      case 'schedule-optimizer':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Optimization Status</span>
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Schedule Efficiency</span>
                  <span>87%</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Resource Utilization</span>
                  <span>92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground">
                Last optimized: 2 hours ago
              </div>
            </div>
          </div>
        );

      case 'resource-monitor':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Resource Status</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded border">
                <div className="text-xs">Mixer #1</div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded border">
                <div className="text-xs">Press Line A</div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs">Setup</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded border">
                <div className="text-xs">Coating Pan</div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span className="text-xs">Maintenance</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'quality-tracker':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Quality Metrics</span>
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>First Pass Yield</span>
                  <span className="text-green-600 font-medium">96.2%</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Defect Rate</span>
                  <span className="text-red-600 font-medium">0.8%</span>
                </div>
              </div>
              <div className="p-2 rounded border bg-green-50 border-green-200">
                <div className="text-xs text-green-800">3 batches passed QC today</div>
              </div>
            </div>
          </div>
        );

      case 'inventory-alerts':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Inventory Alerts</span>
            </div>
            <div className="space-y-2">
              <div className="p-2 rounded border bg-yellow-50 border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs text-yellow-800">Lactose: Low Stock</span>
                </div>
              </div>
              <div className="p-2 rounded border bg-red-50 border-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-800">API shortage in 3 days</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'performance-kpi':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Performance KPIs</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded border text-center">
                <div className="font-medium text-green-600">98.2%</div>
                <div className="text-muted-foreground">Uptime</div>
              </div>
              <div className="p-2 rounded border text-center">
                <div className="font-medium text-blue-600">87%</div>
                <div className="text-muted-foreground">OEE</div>
              </div>
              <div className="p-2 rounded border text-center">
                <div className="font-medium text-purple-600">4.2h</div>
                <div className="text-muted-foreground">Cycle Time</div>
              </div>
              <div className="p-2 rounded border text-center">
                <div className="font-medium text-orange-600">12</div>
                <div className="text-muted-foreground">Orders</div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Widget: {widgetType}
            </div>
            <div className="text-xs text-muted-foreground">
              This is a placeholder for the {widgetTitle} widget.
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "fixed z-50 w-80 h-64 bg-background border rounded-lg shadow-lg",
        "transition-all duration-200 ease-in-out",
        position === 'top-right' && "top-16 right-4",
        position === 'top-left' && "top-16 left-4",
        position === 'bottom-right' && "bottom-4 right-4",
        position === 'bottom-left' && "bottom-4 left-4"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-medium">{widgetTitle}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPin}
            className="h-7 w-7 p-0"
          >
            <Pin className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMaximize}
            className="h-7 w-7 p-0"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 h-full overflow-hidden">
        {renderWidgetContent()}
      </div>
    </div>
  );
}