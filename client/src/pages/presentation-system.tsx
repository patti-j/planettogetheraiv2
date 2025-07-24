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
  ExternalLink, Monitor, ArrowRight, Maximize
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Create presentation mutation
  const createPresentationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/presentations", "POST", data);
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
      return apiRequest("/api/presentations/" + presentationId, "DELETE");
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

  // Handle presentation playback
  const handlePlayPresentation = (presentation: Presentation) => {
    setSelectedPresentation(presentation);
    setCurrentSlideIndex(0);
    setPresentationViewerOpen(true);
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
              Create, manage, and deliver AI-powered presentations integrated with guided tours
            </p>
          </div>
          <div className="flex items-center space-x-2 lg:flex-shrink-0">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Presentation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Presentation</DialogTitle>
                  <DialogDescription>
                    Create a new presentation from scratch
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>AI Presentation Generator</DialogTitle>
                  <DialogDescription>
                    Describe the presentation you want to create and our AI will generate it for you
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="presentations">Presentations</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

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
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
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
                  </CardContent>
                </Card>
              ))}
            </div>
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
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 flex items-center space-x-1 px-2 py-1"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span className="text-xs">Prev</span>
                  </Button>
                  
                  <span className="text-xs text-gray-300 font-mono px-2">
                    {String(currentSlideIndex + 1).padStart(2, '0')} / {String(selectedPresentation.customization?.slides?.length || 1).padStart(2, '0')}
                  </span>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={nextSlide}
                    disabled={!selectedPresentation.customization?.slides || currentSlideIndex >= selectedPresentation.customization.slides.length - 1}
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 flex items-center space-x-1 px-2 py-1"
                  >
                    <span className="text-xs">Next</span>
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex justify-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentSlideIndex(0)}
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 px-2 py-1"
                  >
                    <SkipBack className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (selectedPresentation.customization?.slides) {
                        setCurrentSlideIndex(selectedPresentation.customization.slides.length - 1);
                      }
                    }}
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 px-2 py-1"
                  >
                    <SkipForward className="w-3 h-3" />
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
    </div>
  );
}