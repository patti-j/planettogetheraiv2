import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertImplementationProjectSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, 
  Calendar, 
  Users, 
  Building2, 
  ChevronRight, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  FileText,
  Target,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const createProjectSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  projectType: z.enum(["full_implementation", "migration", "pilot", "upgrade", "training"]),
  targetGoLiveDate: z.string().optional()
});

type CreateProjectData = z.infer<typeof createProjectSchema>;

export default function ImplementationProjects() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const { toast } = useToast();

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/implementation/projects"],
    queryFn: async () => {
      const response = await fetch("/api/implementation/projects", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      console.log("Sending data to API:", data);
      const response = await fetch("/api/implementation/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data)
      });
      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Failed to create project: ${errorText}`);
      }
      const result = await response.json();
      console.log("API Response:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Project created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/implementation/projects"] });
      setCreateDialogOpen(false);
      toast({
        title: "Project Created",
        description: "Implementation project has been created successfully."
      });
      form.reset();
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to create project: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const form = useForm<CreateProjectData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      projectType: "full_implementation"
    }
  });

  const onSubmit = (data: CreateProjectData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    createProjectMutation.mutate(data);
  };

  // Log form errors when they occur
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log("Form validation errors:", form.formState.errors);
    }
  }, [form.formState.errors]);

  // Filter projects by status
  const activeProjects = projects.filter((p: any) => 
    ["planning", "in_progress", "testing", "go_live_prep"].includes(p.status)
  );
  const completedProjects = projects.filter((p: any) => p.status === "completed");
  const onHoldProjects = projects.filter((p: any) => p.status === "on_hold");

  const getStatusColor = (status: string) => {
    switch(status) {
      case "planning": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "testing": return "bg-purple-100 text-purple-800";
      case "go_live_prep": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      case "on_hold": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProjectTypeIcon = (type: string) => {
    switch(type) {
      case "full_implementation": return <Target className="h-4 w-4" />;
      case "migration": return <TrendingUp className="h-4 w-4" />;
      case "pilot": return <CheckCircle2 className="h-4 w-4" />;
      case "upgrade": return <TrendingUp className="h-4 w-4" />;
      case "training": return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const ProjectCard = ({ project }: { project: any }) => (
    <Link href={`/implementation/${project.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getProjectTypeIcon(project.projectType)}
                {project.projectName}
              </CardTitle>
              <CardDescription>{project.projectCode}</CardDescription>
            </div>
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace(/_/g, " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{project.clientCompany}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Go-Live: {project.plannedGoLiveDate ? format(new Date(project.plannedGoLiveDate), "MMM dd, yyyy") : "TBD"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.completionPercentage || 0}%</span>
              </div>
              <Progress value={parseFloat(project.completionPercentage || "0")} />
            </div>

            {project.budgetStatus && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Budget</span>
                <Badge variant={project.budgetStatus === "on_track" ? "default" : "destructive"}>
                  {project.budgetStatus.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-end">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Implementation Projects</h1>
          <p className="text-muted-foreground">Manage and track all implementation projects</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Projects</CardDescription>
            <CardTitle className="text-2xl">{activeProjects.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-3 w-3" />
              In Progress
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl">{completedProjects.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Successfully Delivered
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>On Hold</CardDescription>
            <CardTitle className="text-2xl">{onHoldProjects.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-yellow-600">
              <AlertCircle className="mr-1 h-3 w-3" />
              Awaiting Action
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>AI Insights</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-purple-600">
              Status reports ready
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({activeProjects.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedProjects.length})</TabsTrigger>
          <TabsTrigger value="on_hold">On Hold ({onHoldProjects.length})</TabsTrigger>
          <TabsTrigger value="all">All Projects ({projects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          {activeProjects.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No active projects</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedProjects.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          {completedProjects.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No completed projects</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="on_hold" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {onHoldProjects.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          {onHoldProjects.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No projects on hold</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          {projects.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No projects found</p>
                <Button 
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create First Project
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Implementation Project</DialogTitle>
            <DialogDescription>
              Start a new implementation project for your company
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ERP Implementation Phase 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full_implementation">Full Implementation</SelectItem>
                          <SelectItem value="migration">Migration</SelectItem>
                          <SelectItem value="pilot">Pilot</SelectItem>
                          <SelectItem value="upgrade">Upgrade</SelectItem>
                          <SelectItem value="training">Training Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="targetGoLiveDate"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Target Go-Live Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value || ''} 
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}