import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SmartKpiWidget } from '@/components/smart-kpi-widget';
import { SmartKPIWidgetStudio } from '@/components/smart-kpi-widget-studio';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Package, 
  AlertTriangle, 
  Edit,
  Plus,
  Save,
  X
} from 'lucide-react';

interface WorkspaceDashboardProps {
  // Legacy interface for backward compatibility
  workspaceDashboard?: any;
  isLoading?: boolean;
  isEditMode?: boolean;
  onToggleEditMode?: (editMode: boolean) => void;
  onSave?: (dashboardData: any) => void;
  productionData?: {
    jobTemplates: any[];
    operations: any[];
    resources: any[];
  };
  
  // New interface for production schedule usage
  dashboardId?: number | string;
  workspaceId?: string;
  compact?: boolean;
}

export function WorkspaceDashboard({
  workspaceDashboard,
  isLoading = false,
  isEditMode = false,
  onToggleEditMode = () => {},
  onSave = () => {},
  productionData,
  dashboardId,
  workspaceId,
  compact = false
}: WorkspaceDashboardProps) {
  const [widgets, setWidgets] = useState(workspaceDashboard?.configuration?.widgets || []);
  const [showKpiStudio, setShowKpiStudio] = useState(false);

  // Sync widgets state with workspaceDashboard prop changes
  React.useEffect(() => {
    if (workspaceDashboard?.configuration?.widgets) {
      setWidgets(workspaceDashboard.configuration.widgets);
    }
  }, [workspaceDashboard]);

  // Provide safe default production data if not provided
  const safeProductionData = productionData || {
    jobTemplates: [],
    operations: [],
    resources: []
  };

  // Calculate default KPIs from production data
  const defaultKpis = React.useMemo(() => {
    if (!safeProductionData.operations || !Array.isArray(safeProductionData.operations)) return [];
    
    const operations = safeProductionData.operations;
    const totalOperations = operations.length;
    const onTimeOperations = operations.filter(op => !op.onHold && op.scheduledStatus !== 'Late').length;
    const lateOperations = operations.filter(op => op.scheduledStatus === 'Late').length;
    const onHoldOperations = operations.filter(op => op.onHold).length;

    return [
      {
        id: 'on-time-delivery',
        title: 'On-Time Delivery',
        currentValue: totalOperations > 0 ? Math.round((onTimeOperations / totalOperations) * 100) : 0,
        targetValue: 95,
        unit: '%',
        status: totalOperations > 0 && (onTimeOperations / totalOperations) >= 0.95 ? 'good' : 'warning',
        trend: 'up',
        data: Array.from({ length: 15 }, () => Math.random() * 20 + 80),
        description: 'Percentage of operations completed on schedule'
      },
      {
        id: 'active-operations',
        title: 'Active Operations',
        currentValue: totalOperations - onHoldOperations,
        targetValue: totalOperations,
        unit: '',
        status: onHoldOperations === 0 ? 'good' : 'warning',
        trend: 'stable',
        data: Array.from({ length: 15 }, () => Math.random() * 10 + totalOperations - 5),
        description: 'Currently running production operations'
      },
      {
        id: 'late-operations',
        title: 'Late Operations',
        currentValue: lateOperations,
        targetValue: 0,
        unit: '',
        status: lateOperations === 0 ? 'good' : 'danger',
        trend: lateOperations > 5 ? 'down' : 'stable',
        data: Array.from({ length: 15 }, () => Math.random() * 5 + lateOperations),
        description: 'Operations running behind schedule'
      },
      {
        id: 'resource-utilization',
        title: 'Resource Utilization',
        currentValue: safeProductionData.resources ? Math.round(Math.random() * 30 + 70) : 0,
        targetValue: 85,
        unit: '%',
        status: 'good',
        trend: 'up',
        data: Array.from({ length: 15 }, () => Math.random() * 20 + 70),
        description: 'Average utilization across all production resources'
      }
    ];
  }, [safeProductionData]);

  const handleSave = () => {
    const dashboardData = {
      name: 'Production Schedule Dashboard',
      pageIdentifier: 'production-schedule',
      plantId: 1,
      configuration: {
        layout: {
          type: 'grid' as const,
          columns: 4,
          gap: 4,
          padding: 6
        },
        widgets: widgets.map(w => ({
          ...w,
          position: { x: 0, y: 0, w: 1, h: 1 },
          isVisible: true,
          configuration: w.config || {}
        })),
        refreshInterval: 30,
        autoRefresh: false,
        theme: 'default'
      },
      isActive: true,
      createdBy: 1 // Default user ID for now
    };
    
    onSave(dashboardData);
    onToggleEditMode(false);
  };

  const handleAddWidget = (widgetType: string) => {
    const newWidget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: `New ${widgetType.charAt(0).toUpperCase() + widgetType.slice(1)} Widget`,
      size: 'medium',
      config: {}
    };
    
    setWidgets([...widgets, newWidget]);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  if (isLoading) {
    return (
      <div className="border-b bg-background p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-green-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-green-950/20">
      <div className="p-6">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Production Schedule Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time KPIs and metrics for production scheduling performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKpiStudio(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add KPI
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleEditMode(false)}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleEditMode(true)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Dashboard
              </Button>
            )}
          </div>
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Default KPIs */}
          {defaultKpis.map((kpi) => (
            <SmartKpiWidget
              key={kpi.id}
              id={kpi.id}
              title={kpi.title}
              currentValue={kpi.currentValue}
              targetValue={kpi.targetValue}
              unit={kpi.unit}
              status={kpi.status as 'good' | 'warning' | 'danger'}
              trend={kpi.trend as 'up' | 'down' | 'stable'}
              data={kpi.data}
              description={kpi.description}
              isEditMode={isEditMode}
              onRemove={() => {}}
            />
          ))}

          {/* Custom Widgets */}
          {widgets.map((widget) => (
            <SmartKpiWidget
              key={widget.id}
              {...widget}
              isEditMode={isEditMode}
              onRemove={() => handleRemoveWidget(widget.id)}
            />
          ))}

          {/* Add Widget Placeholder */}
          {isEditMode && (
            <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/25 hover:bg-muted/40 transition-colors cursor-pointer">
              <CardContent 
                className="flex items-center justify-center h-40"
                onClick={() => setShowKpiStudio(true)}
              >
                <div className="text-center">
                  <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Add KPI Widget</p>
                  <p className="text-xs text-muted-foreground">Create custom metrics</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Status Summary */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              Last updated: {new Date().toLocaleTimeString()}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              Shared across workspace
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {defaultKpis.filter(kpi => kpi.status === 'danger').length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                Issues detected
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* KPI Widget Studio Modal */}
      {showKpiStudio && (
        <SmartKPIWidgetStudio
          open={showKpiStudio}
          onOpenChange={(open) => setShowKpiStudio(open)}
          existingWidget={undefined}
        />
      )}
    </div>
  );
}