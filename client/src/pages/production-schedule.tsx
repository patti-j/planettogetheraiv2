import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GanttChart from "@/components/ui/gantt-chart";
import { 
  Calendar, 
  Wrench, 
  User, 
  Clock, 
  Activity, 
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Settings
} from "lucide-react";

export default function ProductionSchedulePage() {
  const [currentView, setCurrentView] = useState<"operations" | "resources" | "customers">("resources");
  const [selectedResourceViewId, setSelectedResourceViewId] = useState<number | null>(null);
  const [rowHeight, setRowHeight] = useState(60);

  // Fetch data for the schedule
  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
  });

  const { data: operations = [] } = useQuery({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["/api/resources"],
  });

  const { data: capabilities = [] } = useQuery({
    queryKey: ["/api/capabilities"],
  });

  // Calculate schedule statistics
  const totalOperations = operations.length;
  const completedOperations = operations.filter((op: any) => op.status === "completed").length;
  const runningOperations = operations.filter((op: any) => op.status === "running").length;
  const plannedOperations = operations.filter((op: any) => op.status === "planned").length;
  const delayedOperations = operations.filter((op: any) => {
    if (op.status === "completed" || !op.endTime) return false;
    return new Date(op.endTime) < new Date();
  }).length;

  // Get active resources
  const activeResources = resources.filter((resource: any) => 
    operations.some((op: any) => op.assignedResourceId === resource.id && op.status === "running")
  ).length;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production Schedule</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time production scheduling and resource management
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Schedule Settings
            </Button>
            <Button size="sm">
              <PlayCircle className="w-4 h-4 mr-2" />
              Run Optimizer
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Operations</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{totalOperations}</p>
                </div>
                <Activity className="w-4 h-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Running</p>
                  <p className="text-lg font-semibold text-green-600">{runningOperations}</p>
                </div>
                <PlayCircle className="w-4 h-4 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-lg font-semibold text-blue-600">{completedOperations}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Planned</p>
                  <p className="text-lg font-semibold text-gray-600">{plannedOperations}</p>
                </div>
                <Clock className="w-4 h-4 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Delayed</p>
                  <p className="text-lg font-semibold text-red-600">{delayedOperations}</p>
                </div>
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Active Resources</p>
                  <p className="text-lg font-semibold text-purple-600">{activeResources}</p>
                </div>
                <Wrench className="w-4 h-4 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Gantt Chart Area */}
      <div className="flex-1 flex flex-col">
        <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as "operations" | "resources" | "customers")}>
          <div className="border-b border-gray-200 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between px-6">
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="resources" 
                  className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Resource Schedule
                </TabsTrigger>
                <TabsTrigger 
                  value="operations" 
                  className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Job Schedule
                </TabsTrigger>
                <TabsTrigger 
                  value="customers" 
                  className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                >
                  <User className="w-4 h-4 mr-2" />
                  Customer Schedule
                </TabsTrigger>
              </TabsList>

              {/* View Controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Row Height:</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setRowHeight(Math.max(40, rowHeight - 10))}
                  disabled={rowHeight <= 40}
                >
                  -
                </Button>
                <span className="text-xs font-mono w-8 text-center">{rowHeight}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setRowHeight(Math.min(120, rowHeight + 10))}
                  disabled={rowHeight >= 120}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          
          <TabsContent value="resources" className="h-full m-0">
            <GanttChart
              jobs={jobs}
              operations={operations}
              resources={resources}
              capabilities={capabilities}
              view="resources"
              selectedResourceViewId={selectedResourceViewId}
              onResourceViewChange={setSelectedResourceViewId}
              rowHeight={rowHeight}
              onRowHeightChange={setRowHeight}
            />
          </TabsContent>

          <TabsContent value="operations" className="h-full m-0">
            <GanttChart
              jobs={jobs}
              operations={operations}
              resources={resources}
              capabilities={capabilities}
              view="operations"
              selectedResourceViewId={selectedResourceViewId}
              onResourceViewChange={setSelectedResourceViewId}
              rowHeight={rowHeight}
              onRowHeightChange={setRowHeight}
            />
          </TabsContent>

          <TabsContent value="customers" className="h-full m-0">
            <GanttChart
              jobs={jobs}
              operations={operations}
              resources={resources}
              capabilities={capabilities}
              view="customers"
              selectedResourceViewId={selectedResourceViewId}
              onResourceViewChange={setSelectedResourceViewId}
              rowHeight={rowHeight}
              onRowHeightChange={setRowHeight}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}