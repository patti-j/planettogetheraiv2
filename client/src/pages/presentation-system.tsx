import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Presentation, Plus, FileText, Users, TrendingUp, Bot, 
  Library, Settings, Play, Edit, Share, Trash2, Upload,
  BarChart3, Target, Calendar, Clock, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, X, SkipBack, SkipForward,
  ExternalLink, Monitor, ArrowRight, Maximize, Folder,
  Filter, Download, Eye, Star, CheckCircle, XCircle,
  User, Tag, Link, Globe, Info, HelpCircle, Zap,
  Lightbulb, Sparkles
} from "lucide-react";

interface Presentation {
  id: number;
  title: string;
  description: string | null;
  category: string;
  audience: string | null;
  createdBy: number;
  isTemplate: boolean;
  isPublic: boolean;
  tags: string[];
  thumbnail: string | null;
  estimatedDuration: number | null;
  targetRoles: string[];
  customization: any;
  createdAt: string;
  updatedAt: string;
  creatorUsername?: string;
}

interface PresentationSlide {
  id: number;
  presentationId: number;
  slideOrder: number;
  title: string;
  slideType: string;
  content: any;
  layout: string;
  backgroundColor: string;
  textColor: string;
  duration: number | null;
  voiceNarration: string | null;
  isInteractive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Additional interfaces for presentation studio integration
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
  name: string; // Changed from title to match database schema
  description?: string;
  presentationType: string; // Changed from type to match database schema
  targetAudience: string;
  objectives: string[];
  duration?: number;
  status: string;
  collaborators: number[];
  deadline?: string;
  presentationId?: number;
  aiProfile?: {
    tone: string;
    complexity: string;
    focusAreas: string[];
    restrictions: string[];
  };
  createdBy: number;
  createdAt: string;
  updatedAt: string;
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

export default function PresentationSystemPage() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [presentationViewerOpen, setPresentationViewerOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [aiGenerateDialogOpen, setAiGenerateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presentationToDelete, setPresentationToDelete] = useState<Presentation | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [presentationToEdit, setPresentationToEdit] = useState<Presentation | null>(null);
  
  // Studio-specific state
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [selectedMaterialType, setSelectedMaterialType] = useState("document");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [webContentDialogOpen, setWebContentDialogOpen] = useState(false);
  const [webUrl, setWebUrl] = useState("");
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [bestPracticesOpen, setBestPracticesOpen] = useState(false);
  const [aiPromptDialogOpen, setAiPromptDialogOpen] = useState(false);
  const [customAiPrompt, setCustomAiPrompt] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch presentations
  const { data: presentations = [], isLoading: presentationsLoading } = useQuery({
    queryKey: ["/api/presentations"],
  });

  // Fetch presentation library
  const { data: library = [], isLoading: libraryLoading } = useQuery({
    queryKey: ["/api/presentation-library"],
  });

  // Fetch presentation analytics
  const { data: analytics = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/presentation-analytics"],
  });

  // Studio queries
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

  // Create presentation mutation
  const createPresentationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/presentations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      setCreateDialogOpen(false);
      toast({
        title: "Presentation Created",
        description: "Your presentation has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create presentation",
        variant: "destructive",
      });
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/presentation-projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-projects"] });
      setProjectDialogOpen(false);
      toast({
        title: "Project Created",
        description: "Your presentation project has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Upload material mutation
  const uploadMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/presentation-materials", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-materials", activeProject] });
      setUploadDialogOpen(false);
      toast({
        title: "Material Added",
        description: "Your presentation material has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload material",
        variant: "destructive",
      });
    },
  });

  // Web content extraction mutation
  const extractWebContentMutation = useMutation({
    mutationFn: async (url: string) => {
      return apiRequest("POST", "/api/extract-web-content", { url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-materials", activeProject] });
      setWebContentDialogOpen(false);
      setWebUrl("");
      setExtractionProgress(0);
      toast({
        title: "Content Extracted",
        description: "Web content has been extracted and added to your materials.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to extract web content",
        variant: "destructive",
      });
    },
  });

  // AI-powered presentation generation
  const generatePresentationMutation = useMutation({
    mutationFn: async (prompt: string) => {
      // Use dedicated AI presentation generation endpoint
      const response = await apiRequest("POST", "/api/presentations/generate-with-ai", { prompt });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      setAiGenerateDialogOpen(false);
      toast({
        title: "AI Presentation Generated",
        description: "Your AI-powered presentation has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate presentation",
        variant: "destructive",
      });
    },
  });

  // Delete presentation mutation
  const deletePresentationMutation = useMutation({
    mutationFn: async (presentationId: number) => {
      return apiRequest("DELETE", "/api/presentations/" + presentationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      setDeleteDialogOpen(false);
      setPresentationToDelete(null);
      toast({
        title: "Presentation Deleted",
        description: "The presentation has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete presentation",
        variant: "destructive",
      });
    },
  });

  // Update presentation mutation
  const updatePresentationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", "/api/presentations/" + id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      setEditDialogOpen(false);
      setPresentationToEdit(null);
      toast({
        title: "Presentation Updated",
        description: "The presentation has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update presentation",
        variant: "destructive",
      });
    },
  });

  const handleCreatePresentation = (formData: FormData) => {
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      audience: formData.get("audience") as string,
      createdBy: 1, // Would be current user ID
      isTemplate: formData.get("isTemplate") === "on",
      isPublic: formData.get("isPublic") === "on",
      tags: (formData.get("tags") as string)?.split(",").map(tag => tag.trim()) || [],
      targetRoles: (formData.get("targetRoles") as string)?.split(",").map(role => role.trim()) || [],
      estimatedDuration: parseInt(formData.get("estimatedDuration") as string) || null,
    };

    createPresentationMutation.mutate(data);
  };

  const handleGenerateWithAI = (prompt: string) => {
    generatePresentationMutation.mutate(prompt);
  };

  const handleEditPresentation = (presentation: Presentation) => {
    setPresentationToEdit(presentation);
    setEditDialogOpen(true);
  };

  const handleUpdatePresentation = (formData: FormData) => {
    if (!presentationToEdit) return;
    
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      audience: formData.get("audience") as string,
      isTemplate: formData.get("isTemplate") === "on",
      isPublic: formData.get("isPublic") === "on",
      tags: (formData.get("tags") as string)?.split(",").map(tag => tag.trim()) || [],
      targetRoles: (formData.get("targetRoles") as string)?.split(",").map(role => role.trim()) || [],
      estimatedDuration: parseInt(formData.get("estimatedDuration") as string) || null,
    };

    updatePresentationMutation.mutate({ id: presentationToEdit.id, data });
  };

  // Handle presentation playback
  const handlePlayPresentation = (presentation: Presentation) => {
    console.log("Starting presentation:", presentation);
    console.log("Slides data:", presentation.customization?.slides);
    setSelectedPresentation(presentation);
    setCurrentSlideIndex(0);
    setPresentationViewerOpen(true);
    
    // Auto-scroll to top to show presentation viewer controls
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  // Presentation navigation
  const nextSlide = () => {
    if (selectedPresentation?.customization?.slides && currentSlideIndex < selectedPresentation.customization.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const closePresentationViewer = () => {
    setPresentationViewerOpen(false);
    setSelectedPresentation(null);
    setCurrentSlideIndex(0);
  };

  const getPresentationStats = () => {
    const presentationData = (presentations as Presentation[]) || [];
    const total = presentationData.length;
    const templates = presentationData.filter((p: Presentation) => p.isTemplate).length;
    const public_ = presentationData.filter((p: Presentation) => p.isPublic).length;
    const avgDuration = presentationData.reduce((acc: number, p: Presentation) => acc + (p.estimatedDuration || 0), 0) / Math.max(total, 1);
    
    return { total, templates, public: public_, avgDuration };
  };

  const stats = getPresentationStats();

  // Studio handler functions
  const handleCreateProject = (formData: FormData) => {
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as string,
      targetAudience: formData.get("targetAudience") as string,
      objectives: (formData.get("objectives") as string).split(",").map(obj => obj.trim()).filter(Boolean),
      status: "active",
      createdBy: 1, // Would be current user ID
    };

    createProjectMutation.mutate(data);
  };

  const handleUploadMaterial = (formData: FormData) => {
    const data = {
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      content: formData.get("content") as string,
      tags: (formData.get("tags") as string).split(",").map(tag => tag.trim()).filter(Boolean),
      presentationId: activeProject,
      uploadedBy: "current-user", // Would be current user
      metadata: {}
    };

    uploadMaterialMutation.mutate(data);
  };

  const handleExtractWebContent = () => {
    if (!webUrl.trim()) return;
    
    setExtractionProgress(10);
    extractWebContentMutation.mutate(webUrl);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setExtractionProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 20;
      });
    }, 500);
  };

  // Initialize default AI prompt
  const defaultAiPrompt = `Create an exciting, engaging presentation that looks like a modern website rather than boring PowerPoint slides. 

Key Requirements:
- Visual-First Design: Use bold imagery, diverse visuals, minimal text
- Website-Style Layouts: Modern, interactive elements and design patterns
- User Excitement Focus: Content designed to drive software adoption and engagement
- No PowerPoint Format: Avoid traditional bullet points and text-heavy slides

Design Philosophy:
- Diverse, compelling imagery for each slide
- Clean, modern typography with visual hierarchy
- Interactive elements and engaging visual storytelling
- Content that excites users about the software capabilities
- Professional yet dynamic presentation flow

Create presentations that users will find exciting and that effectively demonstrate software value and drive adoption decisions.`;

  if (!customAiPrompt) {
    setCustomAiPrompt(defaultAiPrompt);
  }

  return (
    <div className={`${isMaximized ? 'fixed inset-0 z-50 bg-white' : 'relative'}`}>
      {/* Maximize/Minimize Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMaximized(!isMaximized)}
        className="fixed top-2 right-2 z-50"
      >
        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </Button>

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="md:ml-0 ml-12">
            <div className="flex items-center space-x-2">
              <Presentation className="w-6 h-6" />
              <h1 className="text-xl md:text-2xl font-semibold">Presentation System</h1>
            </div>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Create presentations quickly or build advanced projects with AI-powered content research
            </p>
          </div>
          <div className="flex items-center space-x-2 lg:flex-shrink-0">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Quick Presentation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Quick Presentation</DialogTitle>
                  <DialogDescription>
                    Create a simple presentation using templates - fast and straightforward approach
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleCreatePresentation(formData);
                }}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" name="title" required />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select name="category" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="customer">Customer Demo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="audience">Target Audience</Label>
                      <Input id="audience" name="audience" placeholder="e.g., Manufacturing executives" />
                    </div>
                    <div>
                      <Label htmlFor="estimatedDuration">Duration (minutes)</Label>
                      <Input id="estimatedDuration" name="estimatedDuration" type="number" />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input id="tags" name="tags" placeholder="manufacturing, efficiency, AI" />
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isTemplate" name="isTemplate" />
                        <Label htmlFor="isTemplate">Save as template</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isPublic" name="isPublic" />
                        <Label htmlFor="isPublic">Make public</Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPresentationMutation.isPending}>
                      {createPresentationMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={aiGenerateDialogOpen} onOpenChange={setAiGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                  <Bot className="w-4 h-4 mr-2" />
                  Generate with AI
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>AI Quick Generator</DialogTitle>
                  <DialogDescription>
                    Describe your presentation in a few sentences and AI will create it instantly - perfect for immediate needs
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const prompt = formData.get("prompt") as string;
                  handleGenerateWithAI(prompt);
                }}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="prompt">Presentation Requirements</Label>
                      <Textarea 
                        id="prompt" 
                        name="prompt" 
                        required
                        rows={4}
                        placeholder="Create a 20-minute sales presentation for manufacturing executives about AI-powered production optimization, including ROI analysis, case studies, and implementation roadmap."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button type="button" variant="outline" onClick={() => setAiGenerateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={generatePresentationMutation.isPending} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                      {generatePresentationMutation.isPending ? "Generating..." : "Generate Presentation"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import PowerPoint
            </Button>
          </div>
        </div>

        {/* Interactive Options Selection */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-center">Choose Your Approach</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="text-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg bg-white rounded-lg p-4 border-2 border-green-200 hover:border-green-400"
              onClick={() => setCreateDialogOpen(true)}
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-800 mb-2">Quick Presentation</h3>
              <p className="text-sm text-green-700 mb-2">Simple template-based presentations for immediate use</p>
              <p className="text-xs text-green-600 font-medium mb-3">Best for: Standard formats, quick turnaround, simple needs</p>
              <div className="inline-flex items-center text-green-700 font-medium text-sm">
                <span>Click to start</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
            <div 
              className="text-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg bg-white rounded-lg p-4 border-2 border-purple-200 hover:border-purple-400"
              onClick={() => setAiGenerateDialogOpen(true)}
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bot className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-800 mb-2">AI Generate</h3>
              <p className="text-sm text-purple-700 mb-2">Instant AI-created presentations from your description</p>
              <p className="text-xs text-purple-600 font-medium mb-3">Best for: Custom content, AI-powered creation, immediate results</p>
              <div className="inline-flex items-center text-purple-700 font-medium text-sm">
                <span>Click to start</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
            <div 
              className="text-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg bg-white rounded-lg p-4 border-2 border-blue-200 hover:border-blue-400"
              onClick={() => setActiveTab("studio")}
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-800 mb-2">Studio Project</h3>
              <p className="text-sm text-blue-700 mb-2">Advanced projects with research, materials, and team collaboration</p>
              <p className="text-xs text-blue-600 font-medium mb-3">Best for: Complex presentations, website content extraction, team projects</p>
              <div className="inline-flex items-center text-blue-700 font-medium text-sm">
                <span>Click to start</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              <strong>New to the system?</strong> Click on any card above to get started immediately.
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Presentations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <Library className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.templates}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Public</CardTitle>
              <Share className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.public}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.avgDuration)}m</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-full min-w-max md:grid md:grid-cols-5">
              <TabsTrigger value="overview" className="flex-shrink-0">
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Recent</span>
              </TabsTrigger>
              <TabsTrigger value="presentations" className="flex-shrink-0">
                <span className="hidden sm:inline">Presentations</span>
                <span className="sm:hidden">List</span>
              </TabsTrigger>
              <TabsTrigger value="studio" className="flex-shrink-0">
                <span className="hidden sm:inline">Studio</span>
                <span className="sm:hidden">Studio</span>
              </TabsTrigger>
              <TabsTrigger value="library" className="flex-shrink-0">
                <span className="hidden sm:inline">Library</span>
                <span className="sm:hidden">Library</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-shrink-0">
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Presentations</CardTitle>
                  <CardDescription>Your latest presentation projects</CardDescription>
                </CardHeader>
                <CardContent>
                  {presentationsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (presentations as Presentation[] || []).length === 0 ? (
                    <div className="text-center py-8">
                      <Presentation className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-muted-foreground">No presentations yet</p>
                      <p className="text-sm text-muted-foreground">Create your first presentation to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(presentations as Presentation[] || []).slice(0, 5).map((presentation: Presentation) => (
                        <div key={presentation.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Presentation className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium">{presentation.title}</h3>
                              <p className="text-sm text-muted-foreground">{presentation.description}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="secondary">{presentation.category}</Badge>
                                {presentation.estimatedDuration && (
                                  <span className="text-xs text-muted-foreground">
                                    {presentation.estimatedDuration}m
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                                <span>By {presentation.creatorUsername || 'Unknown'}</span>
                                <span>•</span>
                                <span>Created {formatDate(presentation.createdAt)}</span>
                                {presentation.updatedAt !== presentation.createdAt && (
                                  <>
                                    <span>•</span>
                                    <span>Updated {formatDate(presentation.updatedAt)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPresentation(presentation);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPresentation(presentation);
                            }}>
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Target className="w-4 h-4 mr-2" />
                    Sales Presentation Template
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Training Material Template
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Executive Dashboard Template
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Technical Deep Dive Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="presentations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(presentations as Presentation[] || []).map((presentation: Presentation) => (
                <Card key={presentation.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPresentation(presentation)}>
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                    <Presentation className="w-12 h-12 text-white" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{presentation.title}</CardTitle>
                    <CardDescription>{presentation.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{presentation.category}</Badge>
                          {presentation.isTemplate && <Badge variant="outline">Template</Badge>}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handlePlayPresentation(presentation)}>
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPresentationToDelete(presentation);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>By {presentation.creatorUsername || 'Unknown'}</div>
                        <div>Created {formatDate(presentation.createdAt)}</div>
                        {presentation.updatedAt !== presentation.createdAt && (
                          <div>Updated {formatDate(presentation.updatedAt)}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="studio" className="space-y-4">
            {/* Studio Project Selection */}
            {!activeProject ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Folder className="w-5 h-5 mr-2" />
                    Presentation Studio
                  </CardTitle>
                  <CardDescription>
                    Create modern, engaging presentations with AI-powered content generation and professional design
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projectsLoading ? (
                      [1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded mb-2" />
                          <div className="h-3 bg-gray-200 rounded w-2/3" />
                        </div>
                      ))
                    ) : projects.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <Presentation className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-muted-foreground mb-4">No presentation projects yet</p>
                        <p className="text-sm text-gray-500">Use the "New Project" button below to get started</p>
                      </div>
                    ) : (
                      projects.map((project: PresentationProject) => (
                        <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveProject(project.id)}>
                          <CardHeader>
                            <CardTitle className="text-lg">{project.title}</CardTitle>
                            <CardDescription>{project.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">{project.type}</Badge>
                              <Badge variant={project.status === 'active' ? 'default' : 'outline'}>
                                {project.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                  
                  <div className="mt-6 flex justify-center">
                    <Button onClick={() => setProjectDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Active Project Studio Interface */
              <div className="space-y-6">
                {/* Project Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <Button variant="ghost" onClick={() => setActiveProject(null)} className="mb-2">
                      ← Back to Projects
                    </Button>
                    <h2 className="text-2xl font-bold">Modern Presentation Studio</h2>
                    <p className="text-gray-600">Create exciting, website-like presentations that drive software adoption</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setAiPromptDialogOpen(true)}
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Customize AI Prompt
                    </Button>
                    <Button 
                      onClick={() => {/* Generate modern presentation */}}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Modern Presentation
                    </Button>
                  </div>
                </div>

                {/* Design Philosophy Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4 text-center">
                      <Eye className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                      <h3 className="font-semibold text-blue-900">Visual-First</h3>
                      <p className="text-sm text-blue-700">Bold visuals, diverse imagery, minimal text</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4 text-center">
                      <Globe className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <h3 className="font-semibold text-green-900">Website-Style</h3>
                      <p className="text-sm text-green-700">Modern layouts, interactive elements</p>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4 text-center">
                      <Zap className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                      <h3 className="font-semibold text-orange-900">User Excitement</h3>
                      <p className="text-sm text-orange-700">Content that drives software adoption</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 text-center">
                      <XCircle className="w-8 h-8 mx-auto text-red-600 mb-2" />
                      <h3 className="font-semibold text-red-900">No PowerPoint</h3>
                      <p className="text-sm text-red-700">Avoid boring, text-heavy formats</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Materials and Suggestions Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Presentation Materials</span>
                        <Button onClick={() => setUploadDialogOpen(true)} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Material
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {materialsLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : materials.length === 0 ? (
                        <div className="text-center py-6">
                          <FileText className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                          <p className="text-sm text-gray-500 mb-3">No materials added yet</p>
                          <Button onClick={() => setUploadDialogOpen(true)} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Material
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {materials.map((material: PresentationMaterial) => (
                            <div key={material.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{material.title}</h4>
                                <p className="text-xs text-gray-500">{material.type}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  {material.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>AI Content Suggestions</span>
                        <Button size="sm" variant="outline">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Generate Ideas
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {suggestionsLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="p-3 bg-gray-100 rounded animate-pulse">
                              <div className="h-4 bg-gray-200 rounded mb-2" />
                              <div className="h-3 bg-gray-200 rounded w-3/4" />
                            </div>
                          ))}
                        </div>
                      ) : suggestions.length === 0 ? (
                        <div className="text-center py-6">
                          <Lightbulb className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                          <p className="text-sm text-gray-500 mb-3">No suggestions yet</p>
                          <Button size="sm" variant="outline">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate AI Ideas
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {suggestions.map((suggestion: ContentSuggestion) => (
                            <div key={suggestion.id} className="p-3 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-sm">{suggestion.title}</h4>
                              <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="text-xs">{suggestion.priority}</Badge>
                                  <Badge variant="outline" className="text-xs">{suggestion.status}</Badge>
                                  {suggestion.aiGenerated && (
                                    <Badge variant="outline" className="text-xs">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      AI
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button variant="outline" size="sm">
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Presentation Library</CardTitle>
                <CardDescription>Browse and discover presentation templates from the community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Library className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">Library functionality coming soon</p>
                  <p className="text-sm text-muted-foreground">Share and discover presentation templates</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Presentation Analytics</CardTitle>
                <CardDescription>Track presentation performance and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">Analytics dashboard coming soon</p>
                  <p className="text-sm text-muted-foreground">View detailed performance metrics and audience insights</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Integrated Presentation Viewer */}
      {presentationViewerOpen && selectedPresentation && (
        <div className="absolute inset-0 bg-white flex flex-col">
          {/* Integrated Presenter Toolbar */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-4 py-2 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">PRESENTING</span>
              </div>
              <div className="h-4 w-px bg-blue-700"></div>
              <h2 className="text-sm font-semibold">{selectedPresentation.title}</h2>
              <Badge variant="secondary" className="bg-blue-800 text-blue-100 border-blue-700 text-xs">
                {selectedPresentation.category}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-xs text-blue-100">
                {currentSlideIndex + 1} / {selectedPresentation.customization?.slides?.length || 1}
              </div>
              
              {/* Quick Demo Access */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-blue-100 hover:bg-blue-800 transition-colors px-2 py-1"
                onClick={() => setPresentationViewerOpen(false)}
              >
                <Monitor className="w-3 h-3 mr-1" />
                Live App
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={closePresentationViewer} 
                className="text-blue-100 hover:bg-blue-800 transition-colors px-2 py-1"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Main Content Area with Integrated Layout */}
          <div className="flex-1 flex">
            {/* Slide Display Area */}
            <div className="flex-1 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
              {selectedPresentation.customization?.slides && selectedPresentation.customization.slides.length > 0 ? (
                <div className="w-full max-w-4xl">
                  {(() => {
                    const slide = selectedPresentation.customization.slides[currentSlideIndex];
                    return (
                      <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
                        <div className="text-center mb-6">
                          <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">{slide.title}</h1>
                          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto rounded-full"></div>
                        </div>
                        
                        <div className="prose prose-lg max-w-none text-center">
                          {slide.content && (
                            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {slide.content}
                            </div>
                          )}
                        </div>

                        {/* Interactive Demo Elements */}
                        <div className="mt-8 grid grid-cols-2 gap-4">
                          <Button 
                            variant="outline" 
                            className="flex items-center justify-center space-x-2 p-4 border-blue-200 hover:bg-blue-50"
                            onClick={() => setPresentationViewerOpen(false)}
                          >
                            <BarChart3 className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-600">Show Dashboard</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex items-center justify-center space-x-2 p-4 border-green-200 hover:bg-green-50"
                            onClick={() => setPresentationViewerOpen(false)}
                          >
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Live Scheduling</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="w-full max-w-3xl text-center">
                  <div className="bg-white rounded-xl shadow-xl p-12 border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedPresentation.title}</h1>
                    <p className="text-lg text-gray-600 mb-6">{selectedPresentation.description}</p>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
                      <Presentation className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                      <p className="text-gray-700 mb-3">Integrated presentation ready for seamless delivery</p>
                      <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                        <span>{selectedPresentation.category}</span>
                        <span>•</span>
                        <span>{selectedPresentation.estimatedDuration || 'Flexible'}min</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Integrated Control Panel */}
            <div className="w-72 bg-gray-900 text-white flex flex-col border-l border-gray-800">
              {/* Control Header */}
              <div className="p-3 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-gray-100">Presentation Controls</h3>
                <p className="text-xs text-gray-400 mt-1">Seamless demo integration</p>
              </div>

              {/* Navigation Controls */}
              <div className="p-3 border-b border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={previousSlide}
                    disabled={currentSlideIndex === 0}
                    className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700 disabled:bg-gray-700 disabled:border-gray-600 flex items-center space-x-1 px-3 py-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm">Previous</span>
                  </Button>
                  
                  <span className="text-xs text-gray-300 font-mono px-2">
                    {String(currentSlideIndex + 1).padStart(2, '0')} / {String(selectedPresentation.customization?.slides?.length || 1).padStart(2, '0')}
                  </span>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={nextSlide}
                    disabled={!selectedPresentation.customization?.slides || currentSlideIndex >= selectedPresentation.customization.slides.length - 1}
                    className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700 disabled:bg-gray-700 disabled:border-gray-600 flex items-center space-x-1 px-3 py-2"
                  >
                    <span className="text-sm">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex justify-center space-x-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentSlideIndex(0)}
                    className="bg-green-600 border-green-500 text-white hover:bg-green-700 px-3 py-1"
                    title="Go to first slide"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (selectedPresentation.customization?.slides) {
                        setCurrentSlideIndex(selectedPresentation.customization.slides.length - 1);
                      }
                    }}
                    className="bg-green-600 border-green-500 text-white hover:bg-green-700 px-3 py-1"
                    title="Go to last slide"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Demo Actions */}
              <div className="p-3 border-b border-gray-800">
                <h4 className="text-xs font-medium text-gray-300 mb-2">Quick Demo Access</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 justify-start text-xs py-1"
                    onClick={() => setPresentationViewerOpen(false)}
                  >
                    <BarChart3 className="w-3 h-3 mr-2" />
                    Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 justify-start text-xs py-1"
                    onClick={() => setPresentationViewerOpen(false)}
                  >
                    <Calendar className="w-3 h-3 mr-2" />
                    Production Schedule
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 justify-start text-xs py-1"
                    onClick={() => setPresentationViewerOpen(false)}
                  >
                    <Bot className="w-3 h-3 mr-2" />
                    Max AI Demo
                  </Button>
                </div>
              </div>

              {/* Presenter Notes */}
              <div className="flex-1 p-3 overflow-auto">
                <h4 className="text-xs font-medium text-gray-300 mb-2">Presenter Notes</h4>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="bg-gray-800 p-2 rounded border border-gray-700">
                    <div className="text-yellow-400 font-medium mb-1">💡 Transition</div>
                    <p className="text-xs">Click demo buttons to switch to live features seamlessly</p>
                  </div>
                  
                  <div className="bg-gray-800 p-2 rounded border border-gray-700">
                    <div className="text-blue-400 font-medium mb-1">🎯 Key Points</div>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>Real-time data</li>
                      <li>Drag-and-drop UI</li>
                      <li>AI insights</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800 p-2 rounded border border-gray-700">
                    <div className="text-green-400 font-medium mb-1">⏱️ Timing</div>
                    <p className="text-xs">2-3min slide + 5-7min demo</p>
                  </div>
                </div>
              </div>

              {/* Max AI Integration Hint */}
              <div className="p-3 border-t border-gray-800">
                <div className="bg-purple-900 p-2 rounded border border-purple-700">
                  <div className="flex items-center space-x-2 mb-1">
                    <Bot className="w-3 h-3 text-purple-300" />
                    <span className="text-xs font-medium text-purple-300">Max AI Ready</span>
                  </div>
                  <p className="text-xs text-purple-400">Use Max for presentation control and live demos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Presentation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{presentationToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setPresentationToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (presentationToDelete) {
                  deletePresentationMutation.mutate(presentationToDelete.id);
                }
              }}
              disabled={deletePresentationMutation.isPending}
            >
              {deletePresentationMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Presentation Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Presentation</DialogTitle>
            <DialogDescription>
              Update the details for "{presentationToEdit?.title}"
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleUpdatePresentation(formData);
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input 
                  id="edit-title" 
                  name="title" 
                  required 
                  defaultValue={presentationToEdit?.title || ""} 
                  placeholder="Presentation title" 
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  name="description" 
                  defaultValue={presentationToEdit?.description || ""} 
                  placeholder="Brief description of the presentation" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select name="category" defaultValue={presentationToEdit?.category || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Product Demo">Product Demo</SelectItem>
                      <SelectItem value="Executive">Executive</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-duration">Duration (minutes)</Label>
                  <Input 
                    id="edit-duration" 
                    name="estimatedDuration" 
                    type="number" 
                    min="1" 
                    defaultValue={presentationToEdit?.estimatedDuration || ""} 
                    placeholder="30" 
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-audience">Target Audience</Label>
                <Input 
                  id="edit-audience" 
                  name="audience" 
                  defaultValue={presentationToEdit?.audience || ""} 
                  placeholder="e.g., Manufacturing executives, IT managers" 
                />
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input 
                  id="edit-tags" 
                  name="tags" 
                  defaultValue={presentationToEdit?.tags?.join(", ") || ""} 
                  placeholder="manufacturing, efficiency, technology" 
                />
              </div>
              <div>
                <Label htmlFor="edit-roles">Target Roles (comma-separated)</Label>
                <Input 
                  id="edit-roles" 
                  name="targetRoles" 
                  defaultValue={presentationToEdit?.targetRoles?.join(", ") || ""} 
                  placeholder="Director, Manager, Scheduler" 
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="edit-template" 
                    name="isTemplate" 
                    defaultChecked={presentationToEdit?.isTemplate || false}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500" 
                  />
                  <Label htmlFor="edit-template" className="text-sm">
                    Save as template for reuse
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="edit-public" 
                    name="isPublic" 
                    defaultChecked={presentationToEdit?.isPublic || false}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500" 
                  />
                  <Label htmlFor="edit-public" className="text-sm">
                    Make publicly available
                  </Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditDialogOpen(false);
                  setPresentationToEdit(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatePresentationMutation.isPending}>
                {updatePresentationMutation.isPending ? "Updating..." : "Update Presentation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Studio Dialogs */}
      {/* Project Creation Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Folder className="w-5 h-5 mr-2" />
              Create Presentation Project
            </DialogTitle>
            <DialogDescription>
              Set up a new presentation project for modern, engaging content creation
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleCreateProject(formData);
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-title">Project Title</Label>
                <Input id="project-title" name="title" required placeholder="e.g., Q2 Sales Presentation" />
              </div>
              <div>
                <Label htmlFor="project-description">Description</Label>
                <Textarea id="project-description" name="description" placeholder="Brief description of the presentation project" />
              </div>
              <div>
                <Label htmlFor="project-type">Project Type</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Presentation</SelectItem>
                    <SelectItem value="product-demo">Product Demo</SelectItem>
                    <SelectItem value="training">Training Material</SelectItem>
                    <SelectItem value="executive">Executive Brief</SelectItem>
                    <SelectItem value="marketing">Marketing Campaign</SelectItem>
                    <SelectItem value="customer-story">Customer Success Story</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="project-audience">Target Audience</Label>
                <Input id="project-audience" name="targetAudience" placeholder="e.g., Manufacturing executives, IT managers" />
              </div>
              <div>
                <Label htmlFor="project-objectives">Key Objectives (comma-separated)</Label>
                <Input id="project-objectives" name="objectives" placeholder="Drive adoption, Show ROI, Build excitement" />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Material Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Add Presentation Material
            </DialogTitle>
            <DialogDescription>
              Add content materials to enhance your presentation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => setUploadDialogOpen(false)}
              >
                <FileText className="w-8 h-8 mb-2" />
                <span className="text-sm">Upload Document</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => {
                  setUploadDialogOpen(false);
                  setWebContentDialogOpen(true);
                }}
              >
                <Globe className="w-8 h-8 mb-2" />
                <span className="text-sm">Extract from Web</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Web Content Extraction Dialog */}
      <Dialog open={webContentDialogOpen} onOpenChange={setWebContentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Extract Web Content
            </DialogTitle>
            <DialogDescription>
              Extract content from websites to enhance your presentation materials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="web-url">Website URL</Label>
              <Input 
                id="web-url" 
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                placeholder="https://www.planetogether.com" 
              />
            </div>
            
            {extractionProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Extracting content...</span>
                  <span>{extractionProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${extractionProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
              <div className="font-medium text-blue-900 mb-1">Recommended Sources:</div>
              <ul className="space-y-1 text-blue-700">
                <li>• planetogether.com - Product information</li>
                <li>• Customer success stories</li>
                <li>• Industry reports and case studies</li>
                <li>• Competitor analysis pages</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => setWebContentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExtractWebContent}
              disabled={!webUrl.trim() || extractWebContentMutation.isPending}
            >
              {extractWebContentMutation.isPending ? "Extracting..." : "Extract Content"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Prompt Customization Dialog */}
      <Dialog open={aiPromptDialogOpen} onOpenChange={setAiPromptDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2" />
              Customize AI Prompt
            </DialogTitle>
            <DialogDescription>
              Edit the AI generation prompt to control how presentations are created. The default prompt ensures exciting, website-like presentations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <div className="space-y-4 h-full">
              <div className="flex-1">
                <Label htmlFor="ai-prompt">AI Generation Prompt</Label>
                <Textarea 
                  id="ai-prompt"
                  value={customAiPrompt}
                  onChange={(e) => setCustomAiPrompt(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Enter your custom AI prompt..."
                />
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2">Key Design Requirements:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-amber-800">
                  <div>
                    <strong>✓ Visual-First:</strong> Bold imagery, minimal text
                  </div>
                  <div>
                    <strong>✓ Website-Style:</strong> Modern layouts, interactive elements
                  </div>
                  <div>
                    <strong>✓ User Excitement:</strong> Content that drives software adoption
                  </div>
                  <div>
                    <strong>✗ No PowerPoint:</strong> Avoid boring, text-heavy formats
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between space-x-2 mt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setCustomAiPrompt(defaultAiPrompt)}
            >
              Reset to Default
            </Button>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => setAiPromptDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setAiPromptDialogOpen(false)}>
                Save Prompt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}