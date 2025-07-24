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
  BarChart3, Target, Calendar, Clock, Maximize2, Minimize2
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [aiGenerateDialogOpen, setAiGenerateDialogOpen] = useState(false);
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
      // This would integrate with the AI agent for presentation generation
      return apiRequest("/api/ai-agent/generate-presentation", "POST", { prompt });
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

  const getPresentationStats = () => {
    const total = presentations.length;
    const templates = presentations.filter((p: Presentation) => p.isTemplate).length;
    const public_ = presentations.filter((p: Presentation) => p.isPublic).length;
    const avgDuration = presentations.reduce((acc: number, p: Presentation) => acc + (p.estimatedDuration || 0), 0) / Math.max(total, 1);
    
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
                  ) : presentations.length === 0 ? (
                    <div className="text-center py-8">
                      <Presentation className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-muted-foreground">No presentations yet</p>
                      <p className="text-sm text-muted-foreground">Create your first presentation to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {presentations.slice(0, 5).map((presentation: Presentation) => (
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
                            <Button variant="ghost" size="sm">
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
              {presentations.map((presentation: Presentation) => (
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
                        <Button variant="ghost" size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
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
    </div>
  );
}