import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Save, Factory } from "lucide-react";
import Sidebar from "@/components/sidebar";
import GanttChart from "@/components/ui/gantt-chart";
import MetricsCard from "@/components/ui/metrics-card";
import JobForm from "@/components/job-form";
import ResourceForm from "@/components/resource-form";
import type { Job, Operation, Resource, Capability } from "@shared/schema";

interface Metrics {
  activeJobs: number;
  utilization: number;
  overdueOperations: number;
  avgLeadTime: number;
}

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<"operations" | "resources">("resources");
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ["/api/capabilities"],
  });

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Production Schedule</h2>
              <p className="text-gray-600">Manage operations and resource allocation</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 flex items-center">
                <Factory className="w-4 h-4 mr-1" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Schedule
              </Button>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricsCard
              title="Active Jobs"
              value={metrics?.activeJobs?.toString() || "0"}
              change="+8% from last week"
              icon="briefcase"
              color="blue"
            />
            <MetricsCard
              title="Resource Utilization"
              value={`${metrics?.utilization || 0}%`}
              change=""
              icon="chart-line"
              color="green"
              showProgress={true}
              progressValue={metrics?.utilization || 0}
            />
            <MetricsCard
              title="Overdue Operations"
              value={metrics?.overdueOperations?.toString() || "0"}
              change="Requires attention"
              icon="exclamation-triangle"
              color="red"
            />
            <MetricsCard
              title="Avg. Lead Time"
              value={`${metrics?.avgLeadTime || 0} days`}
              change="-0.3 days improved"
              icon="clock"
              color="orange"
            />
          </div>
        </header>

        {/* Gantt Container */}
        <div className="flex-1 bg-white m-6 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as "operations" | "resources")}>
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="resources" 
                  className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                >
                  <Factory className="w-4 h-4 mr-2" />
                  Resources View
                </TabsTrigger>
                <TabsTrigger 
                  value="operations" 
                  className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
                >
                  <Factory className="w-4 h-4 mr-2" />
                  Operations View
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="resources" className="h-full m-0">
              <GanttChart
                jobs={jobs}
                operations={operations}
                resources={resources}
                capabilities={capabilities}
                view="resources"
              />
            </TabsContent>

            <TabsContent value="operations" className="h-full m-0">
              <GanttChart
                jobs={jobs}
                operations={operations}
                resources={resources}
                capabilities={capabilities}
                view="operations"
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Job Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          <JobForm onSuccess={() => setJobDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          <ResourceForm 
            capabilities={capabilities} 
            onSuccess={() => setResourceDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
