import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bot,
  Sparkles,
  Gauge,
  Target,
  TrendingUp,
  Activity,
  BarChart3,
  Plus,
  Palette,
  Grid3x3
} from 'lucide-react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { AiDesignStudioMobile } from './ai-design-studio-mobile';
import AIDesignStudio from '@/components/ai-design-studio';
import { SmartKPIWidgetStudio } from '@/components/smart-kpi-widget-studio';
import { DashboardDesigner } from '@/components/dashboard-designer';

interface DesignStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DesignStudio({ open, onOpenChange }: DesignStudioProps) {
  const deviceType = useDeviceType();
  const [aiDesignStudioOpen, setAiDesignStudioOpen] = React.useState(false);
  const [smartKPIStudioOpen, setSmartKPIStudioOpen] = React.useState(false);
  const [dashboardDesignerOpen, setDashboardDesignerOpen] = React.useState(false);

  if (!open) {
    return null;
  }

  return (
    <>
      <div style={{ zIndex: 9999 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-2">
        <div className="w-full max-w-sm h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold">Design Studio</h2>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Create widgets, dashboards, and pages
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* SMART KPI Widget Studio - Primary Action */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <Gauge className="h-5 w-5 text-white" />
                  </div>
                  SMART KPI Widget Studio
                </CardTitle>
                <CardDescription>
                  Create powerful KPI widgets with guided templates and intelligent configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setSmartKPIStudioOpen(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Create SMART KPI Widget
                </Button>
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>Real-time metrics</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    <span>Auto-refresh</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BarChart3 className="h-3 w-3" />
                    <span>Multiple visualizations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Designer - Secondary Action */}
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Grid3x3 className="h-5 w-5 text-white" />
                  </div>
                  Dashboard Designer
                </CardTitle>
                <CardDescription>
                  Create custom dashboards with drag-and-drop widgets for comprehensive data visualization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setDashboardDesignerOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Design New Dashboard
                </Button>
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Grid3x3 className="h-3 w-3" />
                    <span>Drag & drop</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BarChart3 className="h-3 w-3" />
                    <span>Widget library</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Target className="h-3 w-3" />
                    <span>Custom layouts</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                      <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Charts
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">Line, bar, pie charts</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded">
                      <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">KPIs and indicators</p>
                </CardContent>
              </Card>
            </div>

            {/* AI Design Assistant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  AI Design Assistant
                </CardTitle>
                <CardDescription>
                  Let AI help you create and customize widgets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setAiDesignStudioOpen(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Open AI Assistant
                </Button>
              </CardContent>
            </Card>

            {/* Existing Design Studio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  All Templates
                </CardTitle>
                <CardDescription>
                  Browse all widget and dashboard templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AiDesignStudioMobile
                  onClose={() => onOpenChange(false)}
                  onAiAssistant={() => setAiDesignStudioOpen(true)}
                  showDesignStudio={false}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* SMART KPI Widget Studio Dialog */}
      <SmartKPIWidgetStudio
        open={smartKPIStudioOpen}
        onOpenChange={setSmartKPIStudioOpen}
      />

      {/* AI Design Studio Dialog */}
      <AIDesignStudio
        open={aiDesignStudioOpen}
        onOpenChange={setAiDesignStudioOpen}
      />

      {/* Dashboard Designer Dialog */}
      <DashboardDesigner
        open={dashboardDesignerOpen}
        onOpenChange={setDashboardDesignerOpen}
        onSave={(dashboard) => {
          console.log('Dashboard saved:', dashboard);
        }}
      />
    </>
  );
}

export default DesignStudio;