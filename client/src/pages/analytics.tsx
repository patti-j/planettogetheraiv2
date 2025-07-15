import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Maximize2, Minimize2, FolderOpen, Sparkles, Eye, EyeOff } from "lucide-react";

import AIAnalyticsManager from "@/components/ai-analytics-manager";
import EnhancedDashboardManager from "@/components/dashboard-manager-enhanced";
import AnalyticsWidget from "@/components/analytics-widget";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMobile } from "@/hooks/use-mobile";
import type { Job, Operation, Resource, Capability } from "@shared/schema";

interface AnalyticsWidget {
  id: string;
  title: string;
  type: "metric" | "chart" | "table" | "progress";
  data: any;
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
  isStandard?: boolean;
}

interface DashboardConfig {
  id: number;
  name: string;
  description: string;
  configuration: any; // Make this flexible to handle different structures
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Metrics {
  activeJobs: number;
  utilization: number;
  overdueOperations: number;
  avgLeadTime: number;
}

export default function Analytics() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [dashboardManagerOpen, setDashboardManagerOpen] = useState(false);
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [visibleDashboards, setVisibleDashboards] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useMobile();

  const { data: dashboards = [] } = useQuery<DashboardConfig[]>({
    queryKey: ["/api/dashboard-configs"],
  });

  // Fetch live data for widgets
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: visibleDashboards.size > 0,
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
    enabled: visibleDashboards.size > 0,
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
    enabled: visibleDashboards.size > 0,
  });

  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ["/api/capabilities"],
    enabled: visibleDashboards.size > 0,
  });

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
    refetchInterval: 30000,
    enabled: visibleDashboards.size > 0,
  });











  const handleToggleDashboardVisibility = (dashboardId: number) => {
    setVisibleDashboards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dashboardId)) {
        newSet.delete(dashboardId);
      } else {
        newSet.add(dashboardId);
      }
      return newSet;
    });
  };



  const visibleDashboardConfigs = dashboards.filter(dashboard => 
    visibleDashboards.has(dashboard.id)
  );

  const generateWidgetData = () => ({
    jobs,
    operations,
    resources,
    metrics,
    overdueJobs: jobs.filter(job => new Date(job.dueDate) < new Date() && job.status !== 'completed'),
    resourceUtilization: operations.length > 0 ? (operations.filter(op => op.assignedResourceId).length / operations.length * 100) : 0,
    jobsByStatus: jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    operationsByStatus: operations.reduce((acc, operation) => {
      acc[operation.status] = (acc[operation.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    resourcesByStatus: resources.reduce((acc, resource) => {
      acc[resource.status] = (acc[resource.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  });

  const PageContent = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {/* Dashboard Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="h-4 w-4" />
              Dashboard Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Dashboards to Display:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {dashboards.map((dashboard) => (
                  <div key={dashboard.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dashboard-${dashboard.id}`}
                      checked={visibleDashboards.has(dashboard.id)}
                      onCheckedChange={() => handleToggleDashboardVisibility(dashboard.id)}
                    />
                    <label
                      htmlFor={`dashboard-${dashboard.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                    >
                      {dashboard.name}
                      {dashboard.isDefault && (
                        <Badge variant="secondary" className="text-xs px-1">Default</Badge>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Dashboard Widgets */}
        {visibleDashboardConfigs.length > 0 && (
          <div className="space-y-6">
            {visibleDashboardConfigs.map((dashboard) => (
              <Card key={dashboard.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{dashboard.name}</span>
                        {dashboard.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{dashboard.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {dashboard.configuration?.customWidgets?.length || 0} widgets
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDashboardManagerOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard.configuration?.customWidgets?.length > 0 ? (
                    <div className="relative min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {dashboard.configuration.customWidgets.map((widget: AnalyticsWidget) => (
                        <AnalyticsWidget
                          key={widget.id}
                          widget={widget}
                          onToggle={() => {}} // Read-only mode
                          onRemove={() => {}} // Read-only mode
                          onEdit={() => {}} // Read-only mode
                          onResize={() => {}} // Read-only mode
                          onMove={() => {}} // Read-only mode
                          data={generateWidgetData()}
                          readOnly={true}
                        />
                      ))}
                      <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        Live View • Updates every 30s
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FolderOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No widgets configured for this dashboard</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {visibleDashboards.size === 0 && (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Dashboards Selected</h3>
              <p className="text-sm mb-4">
                Select one or more dashboards from the checkboxes above to view their live widgets.
              </p>
              <Button
                onClick={() => setDashboardManagerOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="md:ml-0 ml-12">
              <h1 className="text-2xl font-semibold text-gray-800">Analytics</h1>
              <p className="text-gray-600">Manage and view dashboard configurations</p>
            </div>
            {!isMobile && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDashboardManagerOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Manage
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAiAnalyticsOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Analytics
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="flex items-center gap-2"
                >
                  {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {isMaximized ? (
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">Analytics - Maximized</h1>
                <Button
                  variant="outline"
                  onClick={() => setIsMaximized(false)}
                  className="flex items-center gap-2"
                >
                  <Minimize2 className="h-4 w-4" />
                  Minimize
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PageContent />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <PageContent />
          </div>
        )}
      </div>

      {/* Modals */}
      <EnhancedDashboardManager
        open={dashboardManagerOpen}
        onOpenChange={setDashboardManagerOpen}
        dashboards={dashboards}
      />

      <AIAnalyticsManager
        open={aiAnalyticsOpen}
        onOpenChange={setAiAnalyticsOpen}
      />
    </>
  );
}