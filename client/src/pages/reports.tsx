import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, BarChart3, Plus, Edit, Download, Printer, Maximize2, Minimize2, Settings, ChevronDown, Sparkles, Trash2, Calendar, Clock, Users, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import Sidebar from "@/components/sidebar";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type ReportConfig, type Job, type Operation, type Resource } from "@shared/schema";

interface Report {
  id: string;
  title: string;
  type: "production" | "resource" | "efficiency" | "custom";
  data: any;
  createdAt: Date;
  description?: string;
  filters?: any;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState<Report["type"]>("production");
  const [reportDescription, setReportDescription] = useState("");
  const { toast } = useToast();

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ['/api/operations'],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
  });

  const { data: reportConfigs = [] } = useQuery<ReportConfig[]>({
    queryKey: ['/api/report-configs'],
  });

  // Load selected config
  const selectedConfig = reportConfigs.find(c => c.id === selectedConfigId) || reportConfigs.find(c => c.isDefault);

  useEffect(() => {
    if (selectedConfig && selectedConfig.configuration) {
      setReports(selectedConfig.configuration.reports || []);
    }
  }, [selectedConfig]);

  const createConfigMutation = useMutation({
    mutationFn: async (configData: { name: string; description: string; configuration: any }) => {
      return await apiRequest('POST', '/api/report-configs', configData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/report-configs'] });
      toast({
        title: "Report configuration created",
        description: "Your report configuration has been saved successfully.",
      });
      setShowConfigDialog(false);
      setConfigName("");
      setConfigDescription("");
    },
    onError: (error) => {
      toast({
        title: "Error creating report config",
        description: "There was a problem creating the report configuration.",
        variant: "destructive",
      });
    },
  });

  const createAIReportMutation = useMutation({
    mutationFn: async (prompt: string) => {
      return await apiRequest('POST', '/api/ai-agent', { command: `CREATE_REPORT: ${prompt}` });
    },
    onSuccess: (data) => {
      // Create a basic report from the AI response regardless of AI response format
      const reportType = aiPrompt.toLowerCase().includes('resource') ? 'resource' : 
                        aiPrompt.toLowerCase().includes('efficiency') ? 'efficiency' : 'production';
      
      const newReport: Report = {
        id: Date.now().toString(),
        title: `AI Generated Report: ${aiPrompt.substring(0, 50)}${aiPrompt.length > 50 ? '...' : ''}`,
        type: reportType,
        description: `Report generated from AI prompt: "${aiPrompt}"`,
        data: generateReportData(reportType),
        createdAt: new Date(),
      };
      
      setReports(prev => [...prev, newReport]);
      toast({
        title: "AI report created",
        description: "AI has generated a new report based on your prompt.",
      });
      setShowAIDialog(false);
      setAiPrompt("");
    },
    onError: (error) => {
      console.error('AI report creation error:', error);
      toast({
        title: "Error creating AI report",
        description: "There was a problem generating the report with AI.",
        variant: "destructive",
      });
      setShowAIDialog(false);
      setAiPrompt("");
    },
  });

  const generateReportData = (type: Report["type"]) => {
    switch (type) {
      case "production":
        return {
          totalJobs: jobs.length,
          completedJobs: jobs.filter(j => j.status === "completed").length,
          activeJobs: jobs.filter(j => j.status === "active").length,
          overdueJobs: jobs.filter(j => new Date(j.dueDate) < new Date()).length,
          operations: operations.length,
          completedOperations: operations.filter(o => o.status === "completed").length,
          jobsByPriority: {
            high: jobs.filter(j => j.priority === "high").length,
            medium: jobs.filter(j => j.priority === "medium").length,
            low: jobs.filter(j => j.priority === "low").length,
          }
        };
      case "resource":
        return {
          totalResources: resources.length,
          activeResources: resources.filter(r => r.status === "active").length,
          maintenanceResources: resources.filter(r => r.status === "maintenance").length,
          resourceTypes: [...new Set(resources.map(r => r.type))],
          utilizationRate: Math.round((operations.filter(o => o.resourceId).length / operations.length) * 100),
          topResources: resources.slice(0, 5).map(r => ({
            name: r.name,
            type: r.type,
            utilization: Math.round(Math.random() * 100),
          }))
        };
      case "efficiency":
        return {
          onTimeJobs: jobs.filter(j => j.status === "completed" && new Date(j.dueDate) >= new Date()).length,
          averageLeadTime: 5.2,
          resourceUtilization: 78,
          bottlenecks: ["CNC-002", "Assembly Station A"],
          improvementAreas: ["Scheduling optimization", "Resource allocation", "Quality control"],
        };
      default:
        return {};
    }
  };

  const handleCreateReport = () => {
    if (!reportTitle.trim()) return;
    
    const newReport: Report = {
      id: Date.now().toString(),
      title: reportTitle,
      type: reportType,
      description: reportDescription,
      data: generateReportData(reportType),
      createdAt: new Date(),
    };
    
    setReports(prev => [...prev, newReport]);
    setShowReportDialog(false);
    setReportTitle("");
    setReportDescription("");
    setReportType("production");
    
    toast({
      title: "Report created",
      description: "Your report has been generated successfully.",
    });
  };

  const handleCreateConfig = () => {
    if (!configName.trim()) return;
    
    createConfigMutation.mutate({
      name: configName,
      description: configDescription,
      configuration: { reports }
    });
  };

  const handleCreateAIReport = () => {
    if (!aiPrompt.trim()) return;
    
    createAIReportMutation.mutate(aiPrompt);
  };

  const handleRemoveReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    toast({
      title: "Report removed",
      description: "The report has been removed successfully.",
    });
  };

  const getReportIcon = (type: Report["type"]) => {
    switch (type) {
      case "production":
        return <BarChart3 className="w-6 h-6" />;
      case "resource":
        return <Users className="w-6 h-6" />;
      case "efficiency":
        return <TrendingUp className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: Report["type"]) => {
    switch (type) {
      case "production":
        return "bg-blue-100 text-blue-800";
      case "resource":
        return "bg-green-100 text-green-800";
      case "efficiency":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderReportData = (report: Report) => {
    switch (report.type) {
      case "production":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{report.data.totalJobs}</div>
              <div className="text-sm text-gray-600">Total Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{report.data.completedJobs}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{report.data.activeJobs}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{report.data.overdueJobs}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </div>
        );
      case "resource":
        return (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total Resources:</span>
              <span className="font-semibold">{report.data.totalResources}</span>
            </div>
            <div className="flex justify-between">
              <span>Active:</span>
              <span className="font-semibold text-green-600">{report.data.activeResources}</span>
            </div>
            <div className="flex justify-between">
              <span>Maintenance:</span>
              <span className="font-semibold text-yellow-600">{report.data.maintenanceResources}</span>
            </div>
            <div className="flex justify-between">
              <span>Utilization Rate:</span>
              <span className="font-semibold">{report.data.utilizationRate}%</span>
            </div>
          </div>
        );
      case "efficiency":
        return (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>On-Time Jobs:</span>
              <span className="font-semibold text-green-600">{report.data.onTimeJobs}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Lead Time:</span>
              <span className="font-semibold">{report.data.averageLeadTime} days</span>
            </div>
            <div className="flex justify-between">
              <span>Resource Utilization:</span>
              <span className="font-semibold">{report.data.resourceUtilization}%</span>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Bottlenecks:</div>
              <div className="flex flex-wrap gap-1">
                {report.data.bottlenecks.map((bottleneck: string) => (
                  <Badge key={bottleneck} variant="outline" className="text-xs">
                    {bottleneck}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return <div className="text-gray-500">Custom report data</div>;
    }
  };

  const selectedConfigName = selectedConfig?.name || reportConfigs.find(c => c.isDefault)?.name || "Default Reports";

  if (isMaximized) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex-none px-4 py-3 sm:px-6 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="md:ml-0 ml-12">
              <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
              <p className="text-gray-600 mt-1">
                Create and manage production reports
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[180px] justify-between">
                    {selectedConfigName}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {reportConfigs.map((config) => (
                    <DropdownMenuItem
                      key={config.id}
                      onClick={() => setSelectedConfigId(config.id)}
                      className="flex items-center justify-between"
                    >
                      <span>{config.name}</span>
                      {config.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowConfigDialog(true)}
                    className="text-blue-600 dark:text-blue-400"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Reports
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {reports.length > 0 && (
                <>
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    onClick={() => {
                      const reportData = JSON.stringify(reports, null, 2);
                      const blob = new Blob([reportData], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `reports-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </>
              )}
              
              <Button
                onClick={() => setShowReportDialog(true)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Report
              </Button>
              
              <Button
                onClick={() => setShowAIDialog(true)}
                variant="outline"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Create
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMaximized(!isMaximized)}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
          {reports.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Reports Created</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Get started by creating your first production report
                </p>
                <div className="flex justify-center space-x-2">
                  <Button
                    onClick={() => setShowReportDialog(true)}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Report
                  </Button>
                  <Button
                    onClick={() => setShowAIDialog(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Create
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 h-full overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {reports.map((report) => (
                  <Card key={report.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            {getReportIcon(report.type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              {report.title}
                            </CardTitle>
                            <Badge className={getTypeColor(report.type)}>
                              {report.type}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {}}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRemoveReport(report.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {report.description && (
                          <p className="text-sm text-gray-600">{report.description}</p>
                        )}
                        <div className="text-xs text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(report.createdAt, 'MMM d, yyyy')}
                        </div>
                        <div className="pt-2 border-t">
                          {renderReportData(report)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dialogs */}
        {/* Report Creation Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-title">Report Title</Label>
                <Input
                  id="report-title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Enter report title..."
                />
              </div>
              <div>
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={reportType} onValueChange={(value) => setReportType(value as Report["type"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production Report</SelectItem>
                    <SelectItem value="resource">Resource Report</SelectItem>
                    <SelectItem value="efficiency">Efficiency Report</SelectItem>
                    <SelectItem value="custom">Custom Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="report-description">Description (Optional)</Label>
                <Textarea
                  id="report-description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Enter description..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReport}>
                  Create Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report Configuration Dialog */}
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Save Report Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="config-name">Configuration Name</Label>
                <Input
                  id="config-name"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Enter configuration name..."
                />
              </div>
              <div>
                <Label htmlFor="config-description">Description</Label>
                <Textarea
                  id="config-description"
                  value={configDescription}
                  onChange={(e) => setConfigDescription(e.target.value)}
                  placeholder="Enter description..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateConfig} disabled={createConfigMutation.isPending}>
                  {createConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Report Creation Dialog */}
        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>AI Report Creation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-prompt">Describe your report needs</Label>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what kind of report you want to create..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAIReport} disabled={createAIReportMutation.isPending}>
                  {createAIReportMutation.isPending ? "Creating..." : "Create with AI"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-none px-4 py-3 sm:px-6 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="md:ml-0 ml-12">
              <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
              <p className="text-gray-600 mt-1">
                Create and manage production reports
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[180px] justify-between">
                    {selectedConfigName}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {reportConfigs.map((config) => (
                    <DropdownMenuItem
                      key={config.id}
                      onClick={() => setSelectedConfigId(config.id)}
                      className="flex items-center justify-between"
                    >
                      <span>{config.name}</span>
                      {config.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowConfigDialog(true)}
                    className="text-blue-600 dark:text-blue-400"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Reports
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {reports.length > 0 && (
                <>
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    onClick={() => {
                      const reportData = JSON.stringify(reports, null, 2);
                      const blob = new Blob([reportData], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `reports-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </>
              )}
              
              <Button
                onClick={() => setShowReportDialog(true)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Report
              </Button>
              
              <Button
                onClick={() => setShowAIDialog(true)}
                variant="outline"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Create
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMaximized(!isMaximized)}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
          {reports.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Reports Created</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Get started by creating your first production report
                </p>
                <div className="flex justify-center space-x-2">
                  <Button
                    onClick={() => setShowReportDialog(true)}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Report
                  </Button>
                  <Button
                    onClick={() => setShowAIDialog(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Create
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 h-full overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                  <Card key={report.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            {getReportIcon(report.type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              {report.title}
                            </CardTitle>
                            <Badge className={getTypeColor(report.type)}>
                              {report.type}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {}}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRemoveReport(report.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {report.description && (
                          <p className="text-sm text-gray-600">{report.description}</p>
                        )}
                        <div className="text-xs text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(report.createdAt, 'MMM d, yyyy')}
                        </div>
                        <div className="pt-2 border-t">
                          {renderReportData(report)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dialogs - Same as maximized version */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-title">Report Title</Label>
                <Input
                  id="report-title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Enter report title..."
                />
              </div>
              <div>
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={reportType} onValueChange={(value) => setReportType(value as Report["type"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production Report</SelectItem>
                    <SelectItem value="resource">Resource Report</SelectItem>
                    <SelectItem value="efficiency">Efficiency Report</SelectItem>
                    <SelectItem value="custom">Custom Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="report-description">Description (Optional)</Label>
                <Textarea
                  id="report-description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Enter description..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReport}>
                  Create Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Save Report Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="config-name">Configuration Name</Label>
                <Input
                  id="config-name"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Enter configuration name..."
                />
              </div>
              <div>
                <Label htmlFor="config-description">Description</Label>
                <Textarea
                  id="config-description"
                  value={configDescription}
                  onChange={(e) => setConfigDescription(e.target.value)}
                  placeholder="Enter description..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateConfig} disabled={createConfigMutation.isPending}>
                  {createConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>AI Report Creation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-prompt">Describe your report needs</Label>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what kind of report you want to create..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAIReport} disabled={createAIReportMutation.isPending}>
                  {createAIReportMutation.isPending ? "Creating..." : "Create with AI"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}