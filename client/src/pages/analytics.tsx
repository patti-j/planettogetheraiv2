import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import Sidebar from "@/components/sidebar";
import { formatOperationStatus } from "@/lib/utils";
import type { Job, Operation, Resource } from "@shared/schema";

interface Metrics {
  activeJobs: number;
  utilization: number;
  overdueOperations: number;
  avgLeadTime: number;
}

export default function Analytics() {
  const { data: metrics } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const getJobsByStatus = () => {
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return statusCounts;
  };

  const getOperationsByStatus = () => {
    const statusCounts = operations.reduce((acc, operation) => {
      acc[operation.status] = (acc[operation.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return statusCounts;
  };

  const getResourcesByStatus = () => {
    const statusCounts = resources.reduce((acc, resource) => {
      acc[resource.status] = (acc[resource.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return statusCounts;
  };

  const getResourceUtilization = () => {
    const assigned = operations.filter(op => op.assignedResourceId).length;
    const total = operations.length;
    return total > 0 ? Math.round((assigned / total) * 100) : 0;
  };

  const getOverdueJobs = () => {
    const now = new Date();
    return jobs.filter(job => new Date(job.dueDate) < now && job.status !== 'completed');
  };

  const jobsByStatus = getJobsByStatus();
  const operationsByStatus = getOperationsByStatus();
  const resourcesByStatus = getResourcesByStatus();
  const resourceUtilization = getResourceUtilization();
  const overdueJobs = getOverdueJobs();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-500">Production performance insights</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.activeJobs || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently in production
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resourceUtilization}%</div>
                <p className="text-xs text-muted-foreground">
                  Operations assigned to resources
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Jobs</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overdueJobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  Past due date
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{operations.length}</div>
                <p className="text-xs text-muted-foreground">
                  All operations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdowns */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Jobs by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(jobsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {status}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(jobsByStatus).length === 0 && (
                    <p className="text-sm text-gray-500">No jobs available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Operations by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(operationsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {formatOperationStatus(status)}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(operationsByStatus).length === 0 && (
                    <p className="text-sm text-gray-500">No operations available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resources by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(resourcesByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {status}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(resourcesByStatus).length === 0 && (
                    <p className="text-sm text-gray-500">No resources available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Jobs */}
          {overdueJobs.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Overdue Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-red-900">{job.name}</p>
                        <p className="text-sm text-red-600">Customer: {job.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          Due: {new Date(job.dueDate).toLocaleDateString()}
                        </p>
                        <Badge className="bg-red-100 text-red-800 capitalize">
                          {job.priority} priority
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}