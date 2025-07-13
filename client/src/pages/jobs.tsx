import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Edit, Trash2, Calendar, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Sidebar from "@/components/sidebar";
import JobForm from "@/components/job-form";
import type { Job } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Jobs() {
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const { toast } = useToast();

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete job");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Job deleted successfully",
        description: "The job and all its operations have been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error deleting job",
        description: "There was a problem deleting the job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setJobDialogOpen(true);
  };

  const handleDeleteJob = (jobId: number) => {
    if (confirm("Are you sure you want to delete this job? This will also delete all associated operations.")) {
      deleteJobMutation.mutate(jobId);
    }
  };

  const handleDialogClose = () => {
    setJobDialogOpen(false);
    setEditingJob(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
              <p className="text-gray-500">Manage your production jobs</p>
            </div>
            <Button 
              onClick={() => setJobDialogOpen(true)}
              className="bg-primary hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-600">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first production job.</p>
              <Button onClick={() => setJobDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Job
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                          {job.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(job.priority)}>
                            {job.priority}
                          </Badge>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditJob(job)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-medium">Customer:</span>
                        <span className="ml-1">{job.customer}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="font-medium">Due:</span>
                        <span className={`ml-1 ${isOverdue(job.dueDate) ? 'text-red-600 font-medium' : ''}`}>
                          {format(new Date(job.dueDate), "MMM dd, yyyy")}
                        </span>
                        {isOverdue(job.dueDate) && (
                          <AlertCircle className="w-4 h-4 ml-1 text-red-600" />
                        )}
                      </div>

                      {job.description && (
                        <div className="text-sm text-gray-600">
                          <p className="line-clamp-2">{job.description}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Job Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingJob ? "Edit Job" : "Create New Job"}
            </DialogTitle>
          </DialogHeader>
          <JobForm 
            job={editingJob || undefined}
            onSuccess={handleDialogClose} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}