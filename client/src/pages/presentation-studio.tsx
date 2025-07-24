import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  FileText, 
  Image, 
  BarChart3, 
  Lightbulb, 
  Sparkles, 
  Plus, 
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Edit,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Tag,
  Maximize2,
  Minimize2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PresentationMaterial {
  id: number;
  presentationId?: number;
  title: string;
  type: string;
  content: any;
  fileUrl?: string;
  metadata: any;
  tags: string[];
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PresentationProject {
  id: number;
  title: string;
  description?: string;
  type: string;
  targetAudience: string;
  objectives: string[];
  status: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ContentSuggestion {
  id: number;
  presentationId?: number;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  aiGenerated: boolean;
  implementedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default function PresentationStudio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [selectedMaterialType, setSelectedMaterialType] = useState("document");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // New project form state
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    type: "Sales",
    targetAudience: "",
    objectives: ""
  });

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    type: "document",
    content: "",
    tags: "",
    metadata: ""
  });

  // Queries
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/presentation-projects"],
  });

  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ["/api/presentation-materials", activeProject],
    enabled: !!activeProject,
  });

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ["/api/presentation-suggestions", activeProject],
    enabled: !!activeProject,
  });

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/presentation-projects", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          objectives: data.objectives.split(',').map((obj: string) => obj.trim()).filter(Boolean),
          status: "active",
          createdBy: 1 // TODO: Get from auth context
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-projects"] });
      setProjectDialogOpen(false);
      setNewProject({ title: "", description: "", type: "Sales", targetAudience: "", objectives: "" });
      toast({ title: "Success", description: "Project created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    },
  });

  const uploadMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/presentation-materials", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          presentationId: activeProject,
          tags: data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
          metadata: data.metadata ? JSON.parse(data.metadata) : {},
          uploadedBy: "current-user", // TODO: Get from auth context
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-materials", activeProject] });
      setUploadDialogOpen(false);
      setUploadForm({ title: "", type: "document", content: "", tags: "", metadata: "" });
      toast({ title: "Success", description: "Material uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload material", variant: "destructive" });
    },
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const currentProject = projects.find((p: PresentationProject) => p.id === activeProject);
      if (!currentProject) throw new Error("No active project");

      return apiRequest("/api/presentation-studio/ai/suggest-materials", {
        method: "POST",
        body: JSON.stringify({
          presentationType: currentProject.type,
          targetAudience: currentProject.targetAudience,
          existingMaterials: materials.map((m: PresentationMaterial) => ({ title: m.title, type: m.type })),
          objectives: currentProject.objectives
        }),
      });
    },
    onSuccess: (data) => {
      // Create suggestion entries in the database
      if (data.criticalMaterials) {
        data.criticalMaterials.forEach((suggestion: any) => {
          apiRequest("/api/presentation-suggestions", {
            method: "POST",
            body: JSON.stringify({
              presentationId: activeProject,
              title: suggestion.title,
              description: suggestion.description,
              type: suggestion.type,
              priority: suggestion.priority,
              status: "pending",
              aiGenerated: true
            }),
          });
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-suggestions", activeProject] });
      toast({ title: "Success", description: "AI suggestions generated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate suggestions", variant: "destructive" });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadForm(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ""),
          content: e.target?.result as string
        }));
      };
      reader.readAsText(file);
    }
  };

  const filteredMaterials = materials.filter((material: PresentationMaterial) => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterType === "all" || material.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const priorityColors = {
    high: "destructive",
    medium: "default",
    low: "secondary"
  };

  const statusColors = {
    pending: "secondary",
    approved: "default",
    implemented: "default",
    rejected: "destructive"
  };

  const typeIcons = {
    document: FileText,
    image: Image,
    data: BarChart3,
    case_study: FileText,
    statistics: BarChart3,
    research: FileText,
    testimonial: User,
    competitive_analysis: BarChart3,
    data_sheet: FileText
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isMaximized ? "fixed inset-0 z-50" : ""}`}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Presentation Studio</h1>
              <p className="text-sm text-gray-600">AI-powered presentation creation workspace</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Projects */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Projects</h2>
              <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>Set up a new presentation project with AI assistance</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Project Title</Label>
                      <Input
                        id="title"
                        value={newProject.title}
                        onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter project title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProject.description}
                        onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief project description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Presentation Type</Label>
                      <Select value={newProject.type} onValueChange={(value) => setNewProject(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Training">Training</SelectItem>
                          <SelectItem value="Executive">Executive</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="audience">Target Audience</Label>
                      <Input
                        id="audience"
                        value={newProject.targetAudience}
                        onChange={(e) => setNewProject(prev => ({ ...prev, targetAudience: e.target.value }))}
                        placeholder="e.g., Manufacturing Executives, Technical Teams"
                      />
                    </div>
                    <div>
                      <Label htmlFor="objectives">Objectives (comma-separated)</Label>
                      <Textarea
                        id="objectives"
                        value={newProject.objectives}
                        onChange={(e) => setNewProject(prev => ({ ...prev, objectives: e.target.value }))}
                        placeholder="Increase awareness, Drive sales, Educate users"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={() => createProjectMutation.mutate(newProject)}
                      disabled={createProjectMutation.isPending || !newProject.title}
                    >
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {projectsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No projects yet</p>
                <p className="text-sm">Create your first presentation project</p>
              </div>
            ) : (
              projects.map((project: PresentationProject) => (
                <Card 
                  key={project.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${activeProject === project.id ? 'ring-2 ring-purple-500' : ''}`}
                  onClick={() => setActiveProject(project.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{project.title}</CardTitle>
                    {project.description && (
                      <CardDescription className="text-xs">{project.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">{project.type}</Badge>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {!activeProject ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Presentation Studio</h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Create professional presentations with AI assistance. Upload materials, get intelligent suggestions, 
                  and build compelling content for any audience.
                </p>
                <Button onClick={() => setProjectDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="materials" className="flex-1 flex flex-col">
              <div className="border-b px-6 py-4">
                <TabsList>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
                  <TabsTrigger value="insights">Analytics</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="materials" className="flex-1 p-6">
                {/* Materials Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Presentation Materials</h3>
                    <p className="text-sm text-gray-600">Upload and manage your presentation content</p>
                  </div>
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Material
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Presentation Material</DialogTitle>
                        <DialogDescription>Add content to your presentation project</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="material-title">Title</Label>
                          <Input
                            id="material-title"
                            value={uploadForm.title}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Material title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="material-type">Type</Label>
                          <Select value={uploadForm.type} onValueChange={(value) => setUploadForm(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="document">Document</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="data">Data/Statistics</SelectItem>
                              <SelectItem value="case_study">Case Study</SelectItem>
                              <SelectItem value="testimonial">Testimonial</SelectItem>
                              <SelectItem value="research">Research</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="file-upload">Upload File</Label>
                          <Input
                            id="file-upload"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".txt,.doc,.docx,.pdf,.csv,.json"
                          />
                        </div>
                        <div>
                          <Label htmlFor="content">Content</Label>
                          <Textarea
                            id="content"
                            value={uploadForm.content}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Paste or type content here"
                            rows={6}
                          />
                        </div>
                        <div>
                          <Label htmlFor="tags">Tags (comma-separated)</Label>
                          <Input
                            id="tags"
                            value={uploadForm.tags}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="manufacturing, efficiency, case-study"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
                        <Button 
                          onClick={() => uploadMaterialMutation.mutate(uploadForm)}
                          disabled={uploadMaterialMutation.isPending || !uploadForm.title || !uploadForm.content}
                        >
                          {uploadMaterialMutation.isPending ? "Uploading..." : "Upload Material"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search materials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="data">Data</SelectItem>
                      <SelectItem value="case_study">Case Studies</SelectItem>
                      <SelectItem value="testimonial">Testimonials</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Materials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materialsLoading ? (
                    <div className="col-span-full text-center py-8 text-gray-500">Loading materials...</div>
                  ) : filteredMaterials.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No materials found</p>
                      <p className="text-sm">Upload your first material to get started</p>
                    </div>
                  ) : (
                    filteredMaterials.map((material: PresentationMaterial) => {
                      const IconComponent = typeIcons[material.type as keyof typeof typeIcons] || FileText;
                      return (
                        <Card key={material.id} className="group hover:shadow-md transition-all">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2">
                                <IconComponent className="w-5 h-5 text-blue-600" />
                                <CardTitle className="text-sm font-medium line-clamp-2">{material.title}</CardTitle>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <Badge variant="secondary" className="text-xs">{material.type}</Badge>
                              <div className="flex flex-wrap gap-1">
                                {material.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                                {material.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">+{material.tags.length - 3}</Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {material.uploadedBy}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDistanceToNow(new Date(material.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="suggestions" className="flex-1 p-6">
                {/* Suggestions Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">AI Suggestions</h3>
                    <p className="text-sm text-gray-600">Get intelligent recommendations for your presentation</p>
                  </div>
                  <Button 
                    onClick={() => generateSuggestionsMutation.mutate()}
                    disabled={generateSuggestionsMutation.isPending}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generateSuggestionsMutation.isPending ? "Generating..." : "Generate Suggestions"}
                  </Button>
                </div>

                {/* Suggestions List */}
                <div className="space-y-4">
                  {suggestionsLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading suggestions...</div>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No suggestions yet</p>
                      <p className="text-sm">Generate AI suggestions to get personalized recommendations</p>
                    </div>
                  ) : (
                    suggestions.map((suggestion: ContentSuggestion) => (
                      <Card key={suggestion.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base font-medium">{suggestion.title}</CardTitle>
                              <CardDescription className="mt-1">{suggestion.description}</CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={priorityColors[suggestion.priority as keyof typeof priorityColors] as any}
                                className="text-xs"
                              >
                                {suggestion.priority}
                              </Badge>
                              <Badge 
                                variant={statusColors[suggestion.status as keyof typeof statusColors] as any}
                                className="text-xs"
                              >
                                {suggestion.status}
                              </Badge>
                              {suggestion.aiGenerated && (
                                <Badge variant="outline" className="text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  AI
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardFooter className="pt-2">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Badge variant="secondary" className="text-xs">{suggestion.type}</Badge>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button variant="outline" size="sm">
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="insights" className="flex-1 p-6">
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Analytics Coming Soon</p>
                  <p className="text-sm">Track material usage and presentation effectiveness</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}