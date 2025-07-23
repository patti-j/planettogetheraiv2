import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAITheme } from "@/hooks/use-ai-theme";

import { 
  Plus, 
  Sparkles, 
  FileText, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Eye, 
  Download,
  Trash2,
  Printer,
  Settings,
  ChevronDown,
  Maximize2,
  Minimize2
} from "lucide-react";

interface Report {
  id: string;
  title: string;
  type: "production" | "resource" | "efficiency" | "custom";
  description: string;
  data: any;
  createdAt: Date;
}

export default function Reports() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState<Report["type"]>("production");
  const [reportDescription, setReportDescription] = useState("");
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { aiTheme } = useAITheme();

  const { data: reportConfigs = [] } = useQuery({
    queryKey: ['/api/report-configs'],
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/jobs'],
  });

  const { data: operations = [] } = useQuery({
    queryKey: ['/api/operations'],
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources'],
  });

  const selectedConfig = reportConfigs.find((config: any) => config.id === selectedConfigId);

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
      const reportType = aiPrompt.toLowerCase().includes('resource') ? 'resource' : 
                        aiPrompt.toLowerCase().includes('efficiency') ? 'efficiency' : 'production';
      
      // Create a clean, simple title from the user's prompt
      const createSimpleTitle = (prompt: string, type: string): string => {
        // Clean up the prompt by removing common report-related words
        const cleanPrompt = prompt
          .toLowerCase()
          .replace(/\b(create|generate|show|give|me|a|an|the|report|analysis|data)\b/g, '')
          .trim()
          .split(/\s+/)
          .filter(word => word.length > 0)
          .slice(0, 3) // Take first 3 meaningful words
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return cleanPrompt || `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
      };
      
      const newReport: Report = {
        id: Date.now().toString(),
        title: createSimpleTitle(aiPrompt, reportType),
        type: reportType,
        description: aiPrompt,
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
        };
      case "efficiency":
        return {
          onTimeJobs: jobs.filter(j => new Date(j.dueDate) >= new Date() || j.status === "completed").length,
          averageLeadTime: 7,
          resourceUtilization: Math.round((operations.filter(o => o.resourceId).length / operations.length) * 100),
          bottlenecks: ["CNC Machine", "Quality Control"]
        };
      default:
        return { message: "Custom report data" };
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
    setReportType("production");
    setReportDescription("");
    
    toast({
      title: "Report created",
      description: "Your report has been created successfully.",
    });
  };

  const handleCreateConfig = () => {
    if (!configName.trim()) return;
    
    const configData = {
      name: configName,
      description: configDescription,
      configuration: {
        reports: reports,
        settings: {}
      }
    };
    
    createConfigMutation.mutate(configData);
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

  const PageContent = () => (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="md:ml-0 ml-12">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Reports
          </h1>
          <p className="text-sm md:text-base text-gray-600">Create and manage production reports</p>
        </div>
        
        {/* Maximize button moved to fixed top-right position */}
        
        {/* Controls positioned below header */}
        <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-2 md:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[280px] justify-between">
                  {selectedConfigName}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
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
              onClick={() => setShowAIDialog(true)}
              variant="outline"
              className={`${aiTheme.gradient} text-white border-0`}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create
            </Button>
            
            <Button
              onClick={() => setShowReportDialog(true)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>

        {/* Content */}
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
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getReportIcon(report.type)}
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white leading-tight break-words">
                          {report.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                          {report.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 flex-shrink-0">
                      <Badge className={getTypeColor(report.type)}>
                        {report.type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReport(report.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {renderReportData(report)}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.print()}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const reportData = JSON.stringify(report, null, 2);
                            const blob = new Blob([reportData], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `report-${report.id}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* Dialogs */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Report</DialogTitle>
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
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type..." />
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

    </div>
  );

  return (
    <>
      {/* Maximize button in top right corner matching hamburger menu positioning */}
      <div className="fixed top-2 right-2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMaximized(!isMaximized)}
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {isMaximized ? (
        <div className="fixed inset-0 bg-white z-50">
          <PageContent />
        </div>
      ) : (
        <div className="h-screen bg-gray-50 dark:bg-gray-900">
          <PageContent />
        </div>
      )}

      {/* Move dialogs outside conditional rendering to prevent remounting */}
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
    </>
  );
}