import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, User, Clock, Settings, Sparkles, Grid3X3, LayoutGrid, BarChart3, Filter } from "lucide-react";
import { format } from "date-fns";
import Sidebar from "@/components/sidebar";
import AIAnalyticsManager from "@/components/ai-analytics-manager";
import AnalyticsWidget from "@/components/analytics-widget";
import type { Job, Operation, Resource } from "@shared/schema";

interface AnalyticsWidget {
  id: string;
  title: string;
  type: "metric" | "chart" | "table" | "progress";
  data: any;
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
}

export default function Reports() {
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const [customWidgets, setCustomWidgets] = useState<AnalyticsWidget[]>([]);
  const [showCustomWidgets, setShowCustomWidgets] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"grid" | "free">("grid");
  const [reportFilter, setReportFilter] = useState<"all" | "jobs" | "operations" | "resources">("all");

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const handleExportReport = (reportType: string) => {
    // This would typically trigger a download of the report
    console.log(`Exporting ${reportType} report...`);
    // Placeholder for actual export functionality
  };

  const getJobOperations = (jobId: number) => {
    return operations.filter(op => op.jobId === jobId);
  };

  const getResourceName = (resourceId: number | null) => {
    if (!resourceId) return "Unassigned";
    const resource = resources.find(r => r.id === resourceId);
    return resource?.name || `Resource ${resourceId}`;
  };

  const getJobProgress = (jobId: number) => {
    const jobOperations = getJobOperations(jobId);
    if (jobOperations.length === 0) return 0;
    const completed = jobOperations.filter(op => op.status === 'completed').length;
    return Math.round((completed / jobOperations.length) * 100);
  };

  const handleWidgetCreate = (widget: AnalyticsWidget) => {
    setCustomWidgets(prev => [...prev, widget]);
  };

  const handleWidgetUpdate = (widgets: AnalyticsWidget[]) => {
    setCustomWidgets(widgets);
  };

  const handleWidgetToggle = (id: string) => {
    setCustomWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, visible: !widget.visible } : widget
    ));
  };

  const handleWidgetRemove = (id: string) => {
    setCustomWidgets(prev => prev.filter(widget => widget.id !== id));
  };

  const handleWidgetEdit = (id: string) => {
    console.log("Edit widget:", id);
  };

  const handleWidgetResize = (id: string, size: { width: number; height: number }) => {
    setCustomWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, size } : widget
    ));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-500">Production reports and analytics</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportFilter(reportFilter === "all" ? "jobs" : "all")}
              >
                <Filter className="w-4 h-4 mr-2" />
                {reportFilter === "all" ? "Show All" : "Filter: " + reportFilter}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomWidgets(!showCustomWidgets)}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                {showCustomWidgets ? "Hide Reports" : "Show Reports"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLayoutMode(layoutMode === "grid" ? "free" : "grid")}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                {layoutMode === "grid" ? "Free Layout" : "Grid Layout"}
              </Button>
              <Button
                onClick={() => setAiAnalyticsOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Reports
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {/* Quick Export Actions */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleExportReport('jobs')}
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm font-medium">Export Jobs</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleExportReport('operations')}
            >
              <Settings className="h-6 w-6" />
              <span className="text-sm font-medium">Export Operations</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleExportReport('resources')}
            >
              <Clock className="h-6 w-6" />
              <span className="text-sm font-medium">Export Resources</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleExportReport('summary')}
            >
              <Download className="h-6 w-6" />
              <span className="text-sm font-medium">Full Report</span>
            </Button>
          </div>

          {/* Jobs Report */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Jobs Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Job Name</th>
                      <th className="text-left p-2 font-medium">Customer</th>
                      <th className="text-left p-2 font-medium">Priority</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Due Date</th>
                      <th className="text-left p-2 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b">
                        <td className="p-2">{job.name}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            {job.customer}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge 
                            className={
                              job.priority === 'high' ? 'bg-red-100 text-red-800' :
                              job.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }
                          >
                            {job.priority}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant="secondary" className="capitalize">
                            {job.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {format(new Date(job.dueDate), "MMM dd, yyyy")}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${getJobProgress(job.id)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {getJobProgress(job.id)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {jobs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No jobs available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Operations Report */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Operations Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Operation</th>
                      <th className="text-left p-2 font-medium">Job</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Duration</th>
                      <th className="text-left p-2 font-medium">Assigned Resource</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operations.map((operation) => {
                      const job = jobs.find(j => j.id === operation.jobId);
                      return (
                        <tr key={operation.id} className="border-b">
                          <td className="p-2">{operation.name}</td>
                          <td className="p-2">{job?.name || `Job ${operation.jobId}`}</td>
                          <td className="p-2">
                            <Badge variant="secondary" className="capitalize">
                              {operation.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              {operation.duration}h
                            </div>
                          </td>
                          <td className="p-2">
                            {getResourceName(operation.assignedResourceId)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {operations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No operations available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resources Report */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resources Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Resource</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Assigned Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((resource) => {
                      const assignedOps = operations.filter(op => op.assignedResourceId === resource.id);
                      return (
                        <tr key={resource.id} className="border-b">
                          <td className="p-2">{resource.name}</td>
                          <td className="p-2 capitalize">{resource.type}</td>
                          <td className="p-2">
                            <Badge 
                              className={
                                resource.status === 'active' ? 'bg-green-100 text-green-800' :
                                resource.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {resource.status}
                            </Badge>
                          </td>
                          <td className="p-2">{assignedOps.length} operations</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {resources.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No resources available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Custom AI-Generated Report Widgets */}
          {showCustomWidgets && customWidgets.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Custom Report Widgets</h2>
              <div className={`grid gap-4 ${layoutMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {customWidgets.map((widget) => (
                  <AnalyticsWidget
                    key={widget.id}
                    widget={widget}
                    onToggle={handleWidgetToggle}
                    onRemove={handleWidgetRemove}
                    onEdit={handleWidgetEdit}
                    onResize={handleWidgetResize}
                    jobs={jobs}
                    operations={operations}
                    resources={resources}
                    metrics={{}}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* AI Analytics Manager */}
      <AIAnalyticsManager
        open={aiAnalyticsOpen}
        onOpenChange={setAiAnalyticsOpen}
        onWidgetCreate={handleWidgetCreate}
        currentWidgets={customWidgets}
        onWidgetUpdate={handleWidgetUpdate}
      />
    </div>
  );
}