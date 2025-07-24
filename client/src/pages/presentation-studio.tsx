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
  Minimize2,
  Link,
  Globe,
  Target,
  Users,
  Info,
  HelpCircle,
  Zap,
  TrendingUp
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
    objectives: "",
    audienceRole: "",
    audienceSize: "",
    presentationLength: "",
    keyMessage: "",
    successMetrics: "",
    competitorInfo: "",
    brandGuidelines: ""
  });

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    type: "document",
    content: "",
    tags: "",
    metadata: "",
    webUrl: ""
  });

  // Web content extraction state
  const [webContentDialogOpen, setWebContentDialogOpen] = useState(false);
  const [webUrl, setWebUrl] = useState("");
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [bestPracticesOpen, setBestPracticesOpen] = useState(false);
  
  // AI Prompt customization state
  const [aiPromptDialogOpen, setAiPromptDialogOpen] = useState(false);
  const [customAiPrompt, setCustomAiPrompt] = useState("");

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
      setNewProject({
        title: "",
        description: "",
        type: "Sales",
        targetAudience: "",
        objectives: "",
        audienceRole: "",
        audienceSize: "",
        presentationLength: "",
        keyMessage: "",
        successMetrics: "",
        competitorInfo: "",
        brandGuidelines: ""
      });
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
      setUploadForm({ title: "", type: "document", content: "", tags: "", metadata: "", webUrl: "" });
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

  const extractWebContentMutation = useMutation({
    mutationFn: async (url: string) => {
      setExtractionProgress(25);
      const response = await apiRequest("/api/presentation-studio/extract-web-content", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      setExtractionProgress(75);
      const result = await response.json();
      setExtractionProgress(100);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-materials"] });
      setWebContentDialogOpen(false);
      setWebUrl("");
      setExtractionProgress(0);
      toast({
        title: "Success",
        description: `Extracted content from ${data.title}. Generated ${data.insights || 0} insights.`,
      });
    },
    onError: (error) => {
      setExtractionProgress(0);
      toast({
        title: "Error",
        description: "Failed to extract web content. Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  const generateModernPresentationMutation = useMutation({
    mutationFn: async () => {
      const currentProject = projects.find((p: PresentationProject) => p.id === activeProject);
      if (!currentProject) throw new Error("No active project");

      return apiRequest("/api/presentation-studio/generate-modern-presentation", {
        method: "POST",
        body: JSON.stringify({
          projectId: activeProject,
          presentationType: currentProject.type,
          targetAudience: currentProject.targetAudience,
          objectives: currentProject.objectives,
          keyMessage: currentProject.keyMessage,
          brandGuidelines: currentProject.brandGuidelines,
          materials: materials.map((m: PresentationMaterial) => ({ 
            title: m.title, 
            type: m.type, 
            content: m.content 
          })),
          customPrompt: customAiPrompt // Include custom prompt if provided
        }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      toast({
        title: "Success",
        description: `Generated modern presentation: "${data.designData.title}" with ${data.designData.slides.length} engaging slides`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate modern presentation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to generate the default AI prompt
  const generateDefaultPrompt = () => {
    const currentProject = projects.find((p: PresentationProject) => p.id === activeProject);
    if (!currentProject) return "";

    return `You are an expert in creating EXCITING, VISUAL, WEBSITE-LIKE presentations that drive software adoption. Create a modern presentation that looks like an engaging website, NOT traditional PowerPoint slides.

CRITICAL REQUIREMENTS:
- Create presentations that EXCITE users and make them want to use the software
- Use BOLD VISUALS, diverse imagery, and minimal text
- Design like a modern website with interactive elements
- Focus on user engagement and persuasion for software adoption
- Avoid boring, text-heavy, traditional slide formats

Project Details:
Presentation Type: ${currentProject.type}
Target Audience: ${currentProject.targetAudience || 'Manufacturing professionals'}
Objectives: ${currentProject.objectives || 'Drive software adoption'}
Key Message: ${currentProject.keyMessage || 'Transform your manufacturing operations'}
Brand Guidelines: ${currentProject.brandGuidelines || 'Professional, modern, technology-focused'}
Available Materials: ${materials ? JSON.stringify(materials.map(m => ({ title: m.title, type: m.type }))) : 'Standard manufacturing content'}

Generate a complete modern presentation structure that tells a compelling story and drives software adoption. Focus on:
- Hero visuals that immediately grab attention
- Customer success stories with real transformations
- Interactive demos and product showcases
- Before/after comparisons showing value
- Social proof and testimonials
- Clear, exciting call-to-action

Create ${Math.max(5, Math.min(12, Math.floor(Math.random() * 8) + 5))} slides that build excitement and persuade users to adopt the software.`;
  };

  // Initialize custom prompt with default when dialog opens
  const openAiPromptDialog = () => {
    setCustomAiPrompt(generateDefaultPrompt());
    setAiPromptDialogOpen(true);
  };

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
            <Dialog open={bestPracticesOpen} onOpenChange={setBestPracticesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Best Practices
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Dialog open={webContentDialogOpen} onOpenChange={setWebContentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Globe className="w-4 h-4 mr-2" />
                  Extract Web Content
                </Button>
              </DialogTrigger>
            </Dialog>

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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-purple-600" />
                      Create New Project
                    </DialogTitle>
                    <DialogDescription>Provide detailed context to create the most effective presentation</DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="audience">Audience & Context</TabsTrigger>
                      <TabsTrigger value="requirements">Requirements</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="title">Project Title *</Label>
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
                          placeholder="Brief project description and purpose"
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Presentation Type *</Label>
                        <Select value={newProject.type} onValueChange={(value) => setNewProject(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sales">Sales Presentation</SelectItem>
                            <SelectItem value="Training">Training & Education</SelectItem>
                            <SelectItem value="Executive">Executive Briefing</SelectItem>
                            <SelectItem value="Technical">Technical Deep Dive</SelectItem>
                            <SelectItem value="Marketing">Marketing & Promotion</SelectItem>
                            <SelectItem value="Operations">Operations Review</SelectItem>
                            <SelectItem value="Customer">Customer Success Story</SelectItem>
                            <SelectItem value="Product">Product Demonstration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="audience" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="audience">Target Audience *</Label>
                        <Input
                          id="audience"
                          value={newProject.targetAudience}
                          onChange={(e) => setNewProject(prev => ({ ...prev, targetAudience: e.target.value }))}
                          placeholder="e.g., Manufacturing Executives, Technical Teams, C-Level Decision Makers"
                        />
                      </div>
                      <div>
                        <Label htmlFor="audienceRole">Primary Audience Role</Label>
                        <Select value={newProject.audienceRole} onValueChange={(value) => setNewProject(prev => ({ ...prev, audienceRole: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select primary audience role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="executives">C-Level Executives</SelectItem>
                            <SelectItem value="directors">Directors & VPs</SelectItem>
                            <SelectItem value="managers">Managers</SelectItem>
                            <SelectItem value="engineers">Engineers & Technical Staff</SelectItem>
                            <SelectItem value="operators">Plant Operators</SelectItem>
                            <SelectItem value="procurement">Procurement Team</SelectItem>
                            <SelectItem value="consultants">Consultants & Partners</SelectItem>
                            <SelectItem value="customers">Customers & Prospects</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="audienceSize">Expected Audience Size</Label>
                        <Select value={newProject.audienceSize} onValueChange={(value) => setNewProject(prev => ({ ...prev, audienceSize: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select audience size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-5">1-5 people (Small meeting)</SelectItem>
                            <SelectItem value="6-15">6-15 people (Team meeting)</SelectItem>
                            <SelectItem value="16-50">16-50 people (Department meeting)</SelectItem>
                            <SelectItem value="51-100">51-100 people (Large meeting)</SelectItem>
                            <SelectItem value="100+">100+ people (Conference/Event)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="keyMessage">Key Message/Value Proposition</Label>
                        <Textarea
                          id="keyMessage"
                          value={newProject.keyMessage}
                          onChange={(e) => setNewProject(prev => ({ ...prev, keyMessage: e.target.value }))}
                          placeholder="What's the main message you want to communicate?"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="requirements" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="presentationLength">Presentation Length</Label>
                        <Select value={newProject.presentationLength} onValueChange={(value) => setNewProject(prev => ({ ...prev, presentationLength: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select presentation length" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5-10">5-10 minutes</SelectItem>
                            <SelectItem value="15-20">15-20 minutes</SelectItem>
                            <SelectItem value="30-45">30-45 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90+">90+ minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="objectives">Primary Objectives (comma-separated) *</Label>
                        <Textarea
                          id="objectives"
                          value={newProject.objectives}
                          onChange={(e) => setNewProject(prev => ({ ...prev, objectives: e.target.value }))}
                          placeholder="e.g., Increase product awareness, Drive sales conversion, Educate on new features"
                        />
                      </div>
                      <div>
                        <Label htmlFor="successMetrics">Success Metrics</Label>
                        <Textarea
                          id="successMetrics"
                          value={newProject.successMetrics}
                          onChange={(e) => setNewProject(prev => ({ ...prev, successMetrics: e.target.value }))}
                          placeholder="How will you measure success? e.g., Lead generation, Meeting bookings, Approval rates"
                        />
                      </div>
                      <div>
                        <Label htmlFor="competitorInfo">Competitive Context</Label>
                        <Textarea
                          id="competitorInfo"
                          value={newProject.competitorInfo}
                          onChange={(e) => setNewProject(prev => ({ ...prev, competitorInfo: e.target.value }))}
                          placeholder="Who are your main competitors? What should we differentiate against?"
                        />
                      </div>
                      <div>
                        <Label htmlFor="brandGuidelines">Brand Guidelines & Requirements</Label>
                        <Textarea
                          id="brandGuidelines"
                          value={newProject.brandGuidelines}
                          onChange={(e) => setNewProject(prev => ({ ...prev, brandGuidelines: e.target.value }))}
                          placeholder="Any specific brand colors, fonts, messaging guidelines, or compliance requirements?"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
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

          {/* Best Practices Dialog */}
          <Dialog open={bestPracticesOpen} onOpenChange={setBestPracticesOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  Presentation Best Practices & Tips
                </DialogTitle>
                <DialogDescription>
                  Professional guidance for creating high-impact presentations
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-sm">
                        <Target className="w-4 h-4 mr-2" />
                        Content Strategy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p>• Start with a compelling story or problem statement</p>
                      <p>• Follow the "Rule of 3" - group information in threes</p>
                      <p>• Use data to support claims, not overwhelm</p>
                      <p>• Include customer success stories and testimonials</p>
                      <p>• End with clear next steps or call-to-action</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-sm">
                        <Users className="w-4 h-4 mr-2" />
                        Audience Engagement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p>• Know your audience's pain points and priorities</p>
                      <p>• Use industry-specific language and examples</p>
                      <p>• Include interactive elements and Q&A breaks</p>
                      <p>• Address common objections proactively</p>
                      <p>• Personalize content for specific stakeholders</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Visual Design
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p>• Use consistent branding and color scheme</p>
                      <p>• Limit text to 6-8 words per bullet point</p>
                      <p>• Include high-quality images and graphics</p>
                      <p>• Use white space effectively for readability</p>
                      <p>• Choose readable fonts (minimum 24pt for presentations)</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Data & Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p>• Use specific numbers and percentages</p>
                      <p>• Include before/after comparisons</p>
                      <p>• Show ROI and business impact clearly</p>
                      <p>• Use charts and graphs for complex data</p>
                      <p>• Highlight key metrics with visual emphasis</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-blue-500" />
                    Quick Content Checklist
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p>✓ Clear value proposition in first 3 slides</p>
                      <p>✓ Problem statement with audience relevance</p>
                      <p>✓ Solution overview with key benefits</p>
                      <p>✓ Proof points (case studies, testimonials)</p>
                      <p>✓ Competitive differentiation</p>
                    </div>
                    <div className="space-y-1">
                      <p>✓ Implementation timeline or process</p>
                      <p>✓ Pricing or investment information</p>
                      <p>✓ Risk mitigation strategies</p>
                      <p>✓ Next steps and timeline</p>
                      <p>✓ Contact information and resources</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">💡 Pro Tips</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Practice your presentation out loud at least 3 times</li>
                    <li>• Prepare for common questions and objections</li>
                    <li>• Have backup slides for technical deep-dives</li>
                    <li>• Test all technology and have offline backups</li>
                    <li>• Arrive early to set up and test equipment</li>
                  </ul>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setBestPracticesOpen(false)}>Got it</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Web Content Extraction Dialog */}
          <Dialog open={webContentDialogOpen} onOpenChange={setWebContentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Link className="w-5 h-5 mr-2 text-blue-500" />
                  Extract Web Content
                </DialogTitle>
                <DialogDescription>
                  Extract content and insights from customer websites or planetogether.com
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webUrl">Website URL</Label>
                  <Input
                    id="webUrl"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    placeholder="https://example.com or https://planetogether.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Extract key content, headings, and insights for your presentation
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 text-sm mb-2">💡 Recommended URLs</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p>• Customer company websites and about pages</p>
                    <p>• planetogether.com product pages and case studies</p>
                    <p>• Industry reports and whitepapers</p>
                    <p>• Competitor websites for competitive analysis</p>
                  </div>
                </div>
                
                {extractionProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Extracting content...</span>
                      <span>{extractionProgress}%</span>
                    </div>
                    <Progress value={extractionProgress} className="h-2" />
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setWebContentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => extractWebContentMutation.mutate(webUrl)}
                  disabled={extractWebContentMutation.isPending || !webUrl.trim()}
                >
                  {extractWebContentMutation.isPending ? "Extracting..." : "Extract Content"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                {/* Modern Presentation Generation Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">AI Presentation Generation</h3>
                    <p className="text-sm text-gray-600">Create exciting, website-like presentations that engage users and drive software adoption</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => generateSuggestionsMutation.mutate()}
                      disabled={generateSuggestionsMutation.isPending}
                      variant="outline"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {generateSuggestionsMutation.isPending ? "Generating..." : "Material Ideas"}
                    </Button>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={openAiPromptDialog}
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Customize AI Prompt
                      </Button>
                      <Button 
                        onClick={() => generateModernPresentationMutation.mutate()}
                        disabled={generateModernPresentationMutation.isPending}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {generateModernPresentationMutation.isPending ? "Creating..." : "Generate Modern Presentation"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Design Philosophy Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-sm text-purple-700">
                        <Eye className="w-4 h-4 mr-2" />
                        Visual-First Design
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-purple-600 space-y-1">
                      <p>• Bold, diverse imagery</p>
                      <p>• Minimal text, maximum impact</p>
                      <p>• Website-style layouts</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-sm text-blue-700">
                        <Zap className="w-4 h-4 mr-2" />
                        User Engagement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-blue-600 space-y-1">
                      <p>• Interactive elements</p>
                      <p>• Excitement-driven content</p>
                      <p>• Persuasive storytelling</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-sm text-green-700">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Software Adoption
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-green-600 space-y-1">
                      <p>• Conversion-focused flow</p>
                      <p>• Modern, professional look</p>
                      <p>• Clear value proposition</p>
                    </CardContent>
                  </Card>
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

      {/* AI Prompt Customization Dialog */}
      <Dialog open={aiPromptDialogOpen} onOpenChange={setAiPromptDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2 text-purple-600" />
              Customize AI Presentation Generation Prompt
            </DialogTitle>
            <DialogDescription>
              Edit the full AI prompt to control exactly how your presentation is generated. This includes all the visual design requirements and presentation philosophy.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Info className="w-4 h-4 mr-2 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Presenter Control</span>
              </div>
              <p className="text-sm text-blue-700">
                You have complete control over the AI generation process. This prompt includes the critical requirements 
                for creating exciting, website-like presentations that avoid boring PowerPoint formats.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                AI Generation Prompt
              </label>
              <textarea
                value={customAiPrompt}
                onChange={(e) => setCustomAiPrompt(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your custom AI prompt here..."
              />
              <p className="text-xs text-gray-500">
                This prompt controls all aspects of presentation generation including visual design, content structure, and engagement strategy.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Target className="w-4 h-4 mr-2 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Key Design Requirements</span>
              </div>
              <div className="text-xs text-purple-700 space-y-1">
                <p>• <strong>Visual-First:</strong> Bold visuals, diverse imagery, minimal text</p>
                <p>• <strong>Website-Style:</strong> Modern layouts, interactive elements, engaging design</p>
                <p>• <strong>User Excitement:</strong> Content that excites users and drives software adoption</p>
                <p>• <strong>No PowerPoint:</strong> Avoid boring, text-heavy, traditional slide formats</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCustomAiPrompt(generateDefaultPrompt())}
            >
              Reset to Default
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setAiPromptDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => setAiPromptDialogOpen(false)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              >
                Save & Use Prompt
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}