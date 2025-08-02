import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Eye, 
  Download,
  RefreshCw,
  ChevronDown,
  Settings
} from "lucide-react";

interface Report {
  id: string;
  title: string;
  type: "production" | "resource" | "efficiency" | "custom";
  description: string;
  data: any;
  createdAt: Date;
}

interface ReportsWidgetProps {
  config?: {
    defaultReportType?: string;
    showControls?: boolean;
    compactView?: boolean;
    maxReports?: number;
  };
}

export function ReportsWidget({ config = {} }: ReportsWidgetProps) {
  const {
    defaultReportType = "production",
    showControls = true,
    compactView = false,
    maxReports = 3
  } = config;

  const [selectedReportType, setSelectedReportType] = useState<string>(defaultReportType);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  // Fetch data from the same endpoints as the reports page
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

  // Auto-select default or first config if none selected
  useEffect(() => {
    if (!selectedConfigId && reportConfigs.length > 0) {
      const defaultConfig = reportConfigs.find(c => c.isDefault) || reportConfigs[0];
      setSelectedConfigId(defaultConfig.id);
    }
  }, [reportConfigs, selectedConfigId]);

  useEffect(() => {
    if (selectedConfig && selectedConfig.configuration) {
      const configReports = selectedConfig.configuration.reports || [];
      // Filter by selected report type and limit number
      const filteredReports = selectedReportType === "all" 
        ? configReports 
        : configReports.filter((r: Report) => r.type === selectedReportType);
      setReports(filteredReports.slice(0, maxReports));
    } else {
      // Generate sample reports if no config
      setReports([generateSampleReport(selectedReportType as Report["type"])].slice(0, maxReports));
    }
  }, [selectedConfig, selectedReportType, maxReports]);

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
        };
      case "resource":
        return {
          totalResources: resources.length,
          activeResources: resources.filter(r => r.status === "active").length,
          maintenanceResources: resources.filter(r => r.status === "maintenance").length,
          utilizationRate: Math.round((operations.filter(o => o.resourceId).length / operations.length) * 100) || 0,
        };
      case "efficiency":
        return {
          onTimeJobs: jobs.filter(j => new Date(j.dueDate) >= new Date() || j.status === "completed").length,
          averageLeadTime: 7,
          resourceUtilization: Math.round((operations.filter(o => o.resourceId).length / operations.length) * 100) || 0,
          bottlenecks: ["CNC Machine", "Quality Control"]
        };
      default:
        return { message: "Custom report data" };
    }
  };

  const generateSampleReport = (type: Report["type"]): Report => ({
    id: `sample-${type}`,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
    type,
    description: `Live ${type} metrics and analytics`,
    data: generateReportData(type),
    createdAt: new Date(),
  });

  const getReportIcon = (type: Report["type"]) => {
    switch (type) {
      case "production":
        return <BarChart3 className="w-4 h-4" />;
      case "resource":
        return <Users className="w-4 h-4" />;
      case "efficiency":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Report["type"]) => {
    switch (type) {
      case "production":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "resource":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "efficiency":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const renderReportData = (report: Report) => {
    if (compactView) {
      // Compact view shows key metrics only
      switch (report.type) {
        case "production":
          return (
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{report.data.totalJobs}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{report.data.completedJobs}</div>
                <div className="text-xs text-gray-500">Done</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{report.data.activeJobs}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
            </div>
          );
        case "resource":
          return (
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{report.data.totalResources}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{report.data.activeResources}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{report.data.utilizationRate}%</div>
                <div className="text-xs text-gray-500">Util.</div>
              </div>
            </div>
          );
        case "efficiency":
          return (
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{report.data.onTimeJobs}</div>
                <div className="text-xs text-gray-500">On Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{report.data.averageLeadTime}d</div>
                <div className="text-xs text-gray-500">Lead Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{report.data.resourceUtilization}%</div>
                <div className="text-xs text-gray-500">Utilization</div>
              </div>
            </div>
          );
        default:
          return <div className="text-gray-500 text-sm">Custom report</div>;
      }
    }

    // Full view - same as reports page
    switch (report.type) {
      case "production":
        return (
          <div className="grid grid-cols-2 gap-3">
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
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Resources:</span>
              <span className="font-semibold">{report.data.totalResources}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Active:</span>
              <span className="font-semibold text-green-600">{report.data.activeResources}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Maintenance:</span>
              <span className="font-semibold text-yellow-600">{report.data.maintenanceResources}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Utilization Rate:</span>
              <span className="font-semibold">{report.data.utilizationRate}%</span>
            </div>
          </div>
        );
      case "efficiency":
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">On-Time Jobs:</span>
              <span className="font-semibold text-green-600">{report.data.onTimeJobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Avg Lead Time:</span>
              <span className="font-semibold">{report.data.averageLeadTime} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Resource Utilization:</span>
              <span className="font-semibold">{report.data.resourceUtilization}%</span>
            </div>
            {report.data.bottlenecks && report.data.bottlenecks.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Bottlenecks:</div>
                <div className="flex flex-wrap gap-1">
                  {report.data.bottlenecks.map((bottleneck: string) => (
                    <Badge key={bottleneck} variant="outline" className="text-xs">
                      {bottleneck}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return <div className="text-gray-500">Custom report data</div>;
    }
  };

  if (reports.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">No reports available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Reports
          </CardTitle>
          {showControls && (
            <div className="flex items-center gap-2">
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                  <SelectItem value="efficiency">Efficiency</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getReportIcon(report.type)}
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {report.title}
                  </h4>
                  {!compactView && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {report.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge className={`${getTypeColor(report.type)} text-xs`}>
                  {report.type}
                </Badge>
                {showControls && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Export report data
                      const reportData = JSON.stringify(report, null, 2);
                      const blob = new Blob([reportData], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `report-${report.id}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-2">
              {renderReportData(report)}
            </div>
            {!compactView && (
              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Updated: {new Date(report.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default ReportsWidget;