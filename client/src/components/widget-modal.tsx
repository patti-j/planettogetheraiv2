import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertTriangle, CheckCircle, Factory, Package, TrendingUp, Target, Play, Pause, RotateCcw } from 'lucide-react';

interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetType: string;
  widgetTitle: string;
}

export function WidgetModal({
  isOpen,
  onClose,
  widgetType,
  widgetTitle
}: WidgetModalProps) {
  const renderExpandedWidgetContent = () => {
    switch (widgetType) {
      case 'operation-sequencer':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  Active Operations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded border bg-green-50 border-green-200">
                    <div>
                      <div className="text-sm font-medium">Mixing - Batch #2501</div>
                      <div className="text-xs text-muted-foreground">Ibuprofen 200mg</div>
                    </div>
                    <Badge className="bg-green-600">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded border bg-yellow-50 border-yellow-200">
                    <div>
                      <div className="text-sm font-medium">Setup - Press Line A</div>
                      <div className="text-xs text-muted-foreground">Next: Tablet Compression</div>
                    </div>
                    <Badge variant="outline">Setup</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Queue Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded border">
                    <div className="text-sm">Operation {i}</div>
                    <Badge variant="outline">Queued</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button size="sm" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Start Next
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                </div>
                <Button size="sm" variant="outline" className="flex items-center gap-2 w-full">
                  <RotateCcw className="h-4 w-4" />
                  Resequence
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'schedule-optimizer':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Optimization Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Schedule Efficiency</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <Progress value={87} className="h-3" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Resource Utilization</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-3" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>On-Time Delivery</span>
                    <span className="font-medium">96%</span>
                  </div>
                  <Progress value={96} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Optimizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded border bg-green-50 border-green-200">
                    <div className="text-sm font-medium text-green-800">
                      Reduced setup time by 15%
                    </div>
                    <div className="text-xs text-green-600">2 hours ago</div>
                  </div>
                  <div className="p-3 rounded border bg-blue-50 border-blue-200">
                    <div className="text-sm font-medium text-blue-800">
                      Improved resource allocation
                    </div>
                    <div className="text-xs text-blue-600">4 hours ago</div>
                  </div>
                  <div className="p-3 rounded border bg-purple-50 border-purple-200">
                    <div className="text-sm font-medium text-purple-800">
                      Optimized batch sequencing
                    </div>
                    <div className="text-xs text-purple-600">6 hours ago</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'resource-monitor':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'High Shear Mixer #1', status: 'active', utilization: 92, dept: 'Mixing' },
              { name: 'Tablet Press Line A', status: 'setup', utilization: 0, dept: 'Pressing' },
              { name: 'Coating Pan #1', status: 'maintenance', utilization: 0, dept: 'Coating' },
              { name: 'Packaging Line 1', status: 'idle', utilization: 0, dept: 'Packaging' },
              { name: 'High Shear Mixer #2', status: 'active', utilization: 87, dept: 'Mixing' },
              { name: 'Tablet Press Line B', status: 'active', utilization: 78, dept: 'Pressing' },
            ].map((resource) => (
              <Card key={resource.name}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{resource.name}</span>
                    <Badge 
                      variant={resource.status === 'active' ? 'default' : 'outline'}
                      className={
                        resource.status === 'active' ? 'bg-green-600' :
                        resource.status === 'maintenance' ? 'bg-red-600 text-white' :
                        resource.status === 'setup' ? 'bg-yellow-600 text-white' : ''
                      }
                    >
                      {resource.status}
                    </Badge>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground">{resource.dept} Department</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilization</span>
                      <span className="font-medium">{resource.utilization}%</span>
                    </div>
                    <Progress value={resource.utilization} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      default:
        return (
          <div className="p-8 text-center">
            <div className="text-lg text-muted-foreground">
              Widget: {widgetType}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Enhanced view for {widgetTitle} widget would be displayed here.
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{widgetTitle}</span>
            <Badge variant="outline">Widget</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-2 min-h-[500px]">
          {renderExpandedWidgetContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}