import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, User, Clock, Settings } from "lucide-react";
import { format } from "date-fns";
import Sidebar from "@/components/sidebar";
import type { Job, Operation, Resource } from "@shared/schema";

export default function Reports() {
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
        </main>
      </div>
    </div>
  );
}