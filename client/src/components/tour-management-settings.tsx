import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAITheme } from "@/hooks/use-ai-theme";
import { 
  Settings, Plus, Edit2, Trash2, Copy, Star, TrendingUp, 
  Clock, Users, BookOpen, Sparkles, Save, X, Search,
  Filter, FileText, Zap, Target, Brain, MessageSquare
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { TourPromptTemplate, InsertTourPromptTemplate, TourPromptTemplateUsage } from "@shared/schema";

interface TourManagementSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TemplateVariable {
  name: string;
  description: string;
  type: "text" | "select" | "number" | "boolean";
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

const TEMPLATE_CATEGORIES = [
  { id: "general", label: "General Purpose", icon: FileText },
  { id: "role_specific", label: "Role-Specific", icon: Users },
  { id: "business_focused", label: "Business-Focused", icon: Target },
  { id: "technical", label: "Technical", icon: Zap },
  { id: "sales_demo", label: "Sales Demo", icon: MessageSquare },
];

const BUILT_IN_TEMPLATES = [
  {
    name: "Standard Manufacturing Tour",
    description: "Comprehensive tour focusing on production management and operational efficiency",
    category: "general",
    promptContent: `Create a comprehensive guided tour for {{role}} that demonstrates the key manufacturing management features. Focus on:

1. Production Overview: Show how users can monitor and manage production workflows
2. Real-time Analytics: Highlight data-driven decision making capabilities  
3. Resource Management: Demonstrate efficient resource allocation and scheduling
4. Quality Control: Show quality monitoring and improvement processes
5. Integration Capabilities: Highlight system integrations and data flow

Make the tour engaging and practical, showing specific benefits for {{role}} responsibilities. Include realistic scenarios and measurable outcomes. Use a professional tone that emphasizes efficiency gains and operational improvements.

Tour should be {{duration}} minutes long with {{stepCount}} detailed steps.`,
    variables: [
      { name: "role", description: "Target user role", type: "text", required: true },
      { name: "duration", description: "Tour duration in minutes", type: "number", required: true, defaultValue: 25 },
      { name: "stepCount", description: "Number of tour steps", type: "number", required: true, defaultValue: 6 }
    ],
    tags: ["manufacturing", "production", "overview", "standard"]
  },
  {
    name: "Executive Dashboard Focus",
    description: "Strategic overview tour for C-level executives and directors",
    category: "business_focused", 
    promptContent: `Design an executive-level tour for {{role}} that emphasizes strategic insights and business impact:

1. Strategic Dashboard: High-level KPIs and business metrics overview
2. ROI Analytics: Show cost savings and efficiency improvements
3. Performance Trends: Long-term operational performance analysis
4. Risk Management: Highlight risk monitoring and mitigation capabilities
5. Competitive Advantage: Demonstrate unique value propositions
6. Growth Opportunities: Show scalability and expansion capabilities

Focus on business outcomes, financial impact, and strategic value. Use executive language and emphasize measurable business results. Each step should clearly connect features to business objectives.

Emphasize {{focusArea}} throughout the tour with {{businessMetrics}} key metrics.`,
    variables: [
      { name: "role", description: "Executive role title", type: "text", required: true },
      { name: "focusArea", description: "Primary business focus", type: "select", required: true, options: ["Cost Reduction", "Efficiency Gains", "Quality Improvement", "Growth Strategy"] },
      { name: "businessMetrics", description: "Number of key business metrics to highlight", type: "number", required: true, defaultValue: 5 }
    ],
    tags: ["executive", "strategic", "roi", "business", "kpi"]
  },
  {
    name: "Technical Deep Dive",
    description: "Detailed technical tour for systems administrators and technical staff",
    category: "technical",
    promptContent: `Create a technical tour for {{role}} focusing on system capabilities and technical features:

1. System Architecture: Overview of technical infrastructure and integrations
2. Data Management: Database operations, data flow, and storage systems
3. Security Features: Authentication, permissions, and security protocols  
4. API Capabilities: Integration endpoints and technical specifications
5. Monitoring Tools: System health, performance metrics, and diagnostics
6. Customization Options: Configuration settings and technical customizations

Use technical terminology and focus on implementation details. Show actual system configurations and technical workflows. Emphasize {{technicalFocus}} aspects with {{complexityLevel}} level detail.`,
    variables: [
      { name: "role", description: "Technical role", type: "text", required: true },
      { name: "technicalFocus", description: "Primary technical area", type: "select", required: true, options: ["Integration", "Security", "Performance", "Data Management"] },
      { name: "complexityLevel", description: "Technical detail level", type: "select", required: true, options: ["Basic", "Intermediate", "Advanced"] }
    ],
    tags: ["technical", "systems", "integration", "api", "architecture"]
  }
];

export function TourManagementSettings({ open, onOpenChange }: TourManagementSettingsProps) {
  const { toast } = useToast();
  const { aiTheme } = useAITheme();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<TourPromptTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TourPromptTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  // Template editor state
  const [templateForm, setTemplateForm] = useState<Partial<InsertTourPromptTemplate>>({
    name: "",
    description: "",
    category: "general",
    promptContent: "",
    variables: [],
    tags: []
  });

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/tour-prompt-templates"],
    enabled: open
  });

  const { data: builtInTemplates = [] } = useQuery({
    queryKey: ["/api/tour-prompt-templates/built-in"],
    enabled: open
  });

  const { data: popularTemplates = [] } = useQuery({
    queryKey: ["/api/tour-prompt-templates/popular"],
    enabled: open
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (templateData: InsertTourPromptTemplate) => 
      apiRequest("/api/tour-prompt-templates", { method: "POST", body: templateData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tour-prompt-templates"] });
      setShowTemplateEditor(false);
      setTemplateForm({
        name: "",
        description: "",
        category: "general",
        promptContent: "",
        variables: [],
        tags: []
      });
      toast({
        title: "Template created",
        description: "Your prompt template has been saved successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Create template error:", error);
      toast({
        title: "Failed to create template",
        description: error?.message || "There was an error creating the template. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, ...templateData }: { id: number } & Partial<InsertTourPromptTemplate>) => 
      apiRequest(`/api/tour-prompt-templates/${id}`, { method: "PUT", body: templateData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tour-prompt-templates"] });
      setEditingTemplate(null);
      setShowTemplateEditor(false);
      toast({
        title: "Template updated",
        description: "Your prompt template has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Update template error:", error);
      toast({
        title: "Failed to update template",
        description: error?.message || "There was an error updating the template. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/tour-prompt-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tour-prompt-templates"] });
      toast({
        title: "Template deleted",
        description: "The prompt template has been removed.",
      });
    }
  });

  // Filter templates
  const filteredTemplates = templates.filter((template: TourPromptTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle template form submission
  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.promptContent) {
      toast({
        title: "Missing information",
        description: "Please provide a template name and prompt content.",
        variant: "destructive"
      });
      return;
    }

    console.log("Saving template:", templateForm);

    if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        ...templateForm
      } as { id: number } & Partial<InsertTourPromptTemplate>);
    } else {
      // Ensure we have all required fields and proper defaults
      const templateData = {
        name: templateForm.name,
        description: templateForm.description || "",
        category: templateForm.category || "general",
        promptContent: templateForm.promptContent,
        variables: templateForm.variables || [],
        tags: templateForm.tags || [],
        isBuiltIn: false,
        isActive: true
      } as InsertTourPromptTemplate;
      
      console.log("Creating template with data:", templateData);
      createTemplateMutation.mutate(templateData);
    }
  };

  // Initialize built-in templates if none exist
  useEffect(() => {
    if (open && templates.length === 0 && !templatesLoading) {
      // Auto-create built-in templates if none exist
      BUILT_IN_TEMPLATES.forEach(template => {
        createTemplateMutation.mutate({
          ...template,
          isBuiltIn: true,
          createdBy: 1 // System user
        } as InsertTourPromptTemplate);
      });
    }
  }, [open, templates.length, templatesLoading]);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-w-[95vw] max-h-[90vh] w-full flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Tour Management Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates" className="flex items-center gap-1 sm:gap-2 justify-center">
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Prompt Templates</span>
              <span className="sm:hidden text-xs">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-1 sm:gap-2 justify-center">
              <Star className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Template Library</span>
              <span className="sm:hidden text-xs">Library</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 justify-center">
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Usage Analytics</span>
              <span className="sm:hidden text-xs">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Prompt Templates Tab */}
          <TabsContent value="templates" className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 h-full">
              {/* Search and filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {TEMPLATE_CATEGORIES.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      setEditingTemplate(null);
                      setShowTemplateEditor(true);
                      setTemplateForm({
                        name: "",
                        description: "",
                        category: "general",
                        promptContent: "",
                        variables: [],
                        tags: []
                      });
                    }}
                    className={`${aiTheme.gradient} text-white flex-shrink-0`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">New Template</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </div>
              </div>

              {/* Templates grid */}
              <ScrollArea className="flex-1">
                <div className="grid gap-4 pr-4">
                  {filteredTemplates.map((template: TourPromptTemplate) => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
                            <CardDescription className="mt-1">{template.description}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{TEMPLATE_CATEGORIES.find(c => c.id === template.category)?.label}</Badge>
                            {template.isBuiltIn && <Badge variant="outline">Built-in</Badge>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {template.usageCount} uses
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              {template.rating}/5
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {template.lastUsed ? new Date(template.lastUsed).toLocaleDateString() : 'Never'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTemplate(template);
                                setTemplateForm(template);
                                setShowTemplateEditor(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTemplateForm({
                                  ...template,
                                  name: `${template.name} (Copy)`,
                                  isBuiltIn: false
                                });
                                setEditingTemplate(null);
                                setShowTemplateEditor(true);
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            {!template.isBuiltIn && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTemplateMutation.mutate(template.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {template.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Template Library Tab */}
          <TabsContent value="library" className="flex-1 overflow-y-auto">
            <ScrollArea className="h-full">
              <div className="space-y-6 pr-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Popular Templates</h3>
                  <div className="grid gap-3">
                    {popularTemplates.slice(0, 5).map((template: TourPromptTemplate) => (
                      <Card key={template.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-gray-600">{template.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{template.usageCount} uses</Badge>
                            <Button size="sm" variant="outline">Use Template</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-3">Built-in Templates</h3>
                  <div className="grid gap-3">
                    {builtInTemplates.map((template: TourPromptTemplate) => (
                      <Card key={template.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-gray-600">{template.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Built-in</Badge>
                            <Button size="sm" variant="outline">Use Template</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Usage Analytics Tab */}
          <TabsContent value="analytics" className="flex-1 overflow-y-auto">
            <div className="grid gap-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Total Templates</p>
                      <p className="text-2xl font-bold">{templates.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Total Usage</p>
                      <p className="text-2xl font-bold">
                        {templates.reduce((sum: number, t: TourPromptTemplate) => sum + t.usageCount, 0)}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-600">Avg Rating</p>
                      <p className="text-2xl font-bold">
                        {(templates.reduce((sum: number, t: TourPromptTemplate) => sum + t.rating, 0) / templates.length || 0).toFixed(1)}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">Active Templates</p>
                      <p className="text-2xl font-bold">
                        {templates.filter((t: TourPromptTemplate) => t.usageCount > 0).length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    {/* Template Editor Dialog - Separate from main dialog */}
    <Dialog open={showTemplateEditor} onOpenChange={setShowTemplateEditor}>
      <DialogContent className="max-w-4xl max-w-[95vw] max-h-[90vh] w-full flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${aiTheme.text}`} />
            {editingTemplate ? "Edit Template" : "Create New Template"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateForm.name || ""}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="Enter template name..."
              />
            </div>
            <div>
              <Label htmlFor="template-category">Category</Label>
              <Select 
                value={templateForm.category || "general"} 
                onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="template-description">Description</Label>
            <Input
              id="template-description"
              value={templateForm.description || ""}
              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              placeholder="Brief description of the template..."
            />
          </div>

          <div className="flex-1 overflow-hidden">
            <Label htmlFor="template-content">Prompt Content</Label>
            <Textarea
              id="template-content"
              value={templateForm.promptContent || ""}
              onChange={(e) => setTemplateForm({ ...templateForm, promptContent: e.target.value })}
              placeholder="Enter your prompt template content here. Use {{variableName}} for dynamic content..."
              className="h-48 md:h-64 resize-none font-mono text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setShowTemplateEditor(false)} className="w-full sm:w-auto">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              className={`${aiTheme.gradient} text-white w-full sm:w-auto`}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}