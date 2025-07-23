import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Building2, Settings, Check, Plus, Globe, Palette, BarChart, Factory, Maximize2, Minimize2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const categories = [
  { value: "all", label: "All Industries" },
  { value: "automotive", label: "Automotive" },
  { value: "electronics", label: "Electronics" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "pharmaceutical", label: "Pharmaceutical" },
  { value: "aerospace", label: "Aerospace" },
  { value: "textiles", label: "Textiles" },
  { value: "chemicals", label: "Chemicals" },
  { value: "metals", label: "Metals" },
  { value: "manufacturing", label: "General Manufacturing" },
  { value: "custom", label: "Custom" }
];

export default function IndustryTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [customIndustry, setCustomIndustry] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourcePrompt, setSourcePrompt] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);

  // Fetch industry templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["industry-templates", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "all" 
        ? "/api/industry-templates"
        : `/api/industry-templates?category=${selectedCategory}`;
      const response = await apiRequest("GET", url);
      return await response.json();
    }
  });

  // Fetch user's active template
  const { data: activeTemplate } = useQuery({
    queryKey: ["user-active-template", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const response = await apiRequest("GET", `/api/users/${user.id}/industry-templates/active`);
        return await response.json();
      } catch (error) {
        return null;
      }
    },
    enabled: !!user
  });

  // Apply template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: async ({ templateId, customizations = {} }: { templateId: number; customizations?: any }) => {
      if (!user) throw new Error("User not authenticated");
      const response = await apiRequest("POST", `/api/users/${user.id}/industry-templates/${templateId}/apply`, {
        customizations
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-active-template"] });
      toast({
        title: "Template Applied",
        description: "Industry template has been successfully applied to your account."
      });
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to apply template",
        variant: "destructive"
      });
    }
  });

  // Generate custom template mutation
  const generateTemplateMutation = useMutation({
    mutationFn: async ({ industry, sourceUrl, sourcePrompt }: { industry: string; sourceUrl?: string; sourcePrompt?: string }) => {
      const response = await apiRequest("POST", "/api/industry-templates/generate", {
        industry,
        sourceUrl,
        sourcePrompt,
        createdBy: user?.username || "Unknown"
      });
      return await response.json();
    },
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["industry-templates"] });
      toast({
        title: "Template Generated",
        description: "Custom industry template has been created successfully."
      });
      // Auto-apply the newly generated template
      applyTemplateMutation.mutate({ templateId: newTemplate.id });
      setCustomIndustry("");
      setSourceUrl("");
      setSourcePrompt("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate template",
        variant: "destructive"
      });
    }
  });

  const handleApplyTemplate = (template: any) => {
    applyTemplateMutation.mutate({ templateId: template.id });
  };

  const handleGenerateTemplate = () => {
    if (!customIndustry.trim()) {
      toast({
        title: "Industry Required",
        description: "Please enter an industry name",
        variant: "destructive"
      });
      return;
    }

    generateTemplateMutation.mutate({
      industry: customIndustry,
      sourceUrl: sourceUrl || undefined,
      sourcePrompt: sourcePrompt || undefined
    });
  };

  const PageContent = () => (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="md:ml-0 ml-12">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <Building2 className="w-6 h-6 mr-2" />
            Industry Templates
          </h1>
          <p className="text-sm md:text-base text-gray-600">Configure your manufacturing management system for your specific industry with AI-powered templates</p>
        </div>
        
        {/* Maximize button always in top right corner */}
        <div className="absolute top-0 right-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Current Active Template */}
        {activeTemplate && (
          <Card className="mb-8 border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Check className="w-5 h-5" />
                Active Template
              </CardTitle>
              <CardDescription className="text-green-700">
                Your current industry configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">{activeTemplate.template?.name}</h3>
                  <p className="text-green-700 text-sm">{activeTemplate.template?.description}</p>
                  <Badge variant="outline" className="mt-2 border-green-300 text-green-700">
                    {categories.find(c => c.value === activeTemplate.template?.category)?.label || activeTemplate.template?.category}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
                  <Settings className="w-4 h-4 mr-2" />
                  Customize
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Category Filter & Create Custom */}
          <div className="lg:col-span-1 space-y-6">
            {/* Category Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filter by Industry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map(category => (
                  <Button
                    key={category.value}
                    variant={selectedCategory === category.value ? "default" : "ghost"}
                    className="w-full justify-start text-sm"
                    size="sm"
                    onClick={() => setSelectedCategory(category.value)}
                  >
                    {category.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Create Custom Template */}
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Sparkles className="w-5 h-5" />
                  Create Custom Template
                </CardTitle>
                <CardDescription>
                  Generate a template using AI for your specific industry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="prompt" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="prompt">Description</TabsTrigger>
                    <TabsTrigger value="url">Website</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="prompt" className="space-y-4">
                    <div>
                      <Label htmlFor="industry">Industry Name</Label>
                      <Input
                        id="industry"
                        placeholder="e.g., Medical Devices"
                        value={customIndustry}
                        onChange={(e) => setCustomIndustry(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="prompt">Industry Description</Label>
                      <Textarea
                        id="prompt"
                        placeholder="Describe your industry, products, processes..."
                        value={sourcePrompt}
                        onChange={(e) => setSourcePrompt(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label htmlFor="industry-url">Industry Name</Label>
                      <Input
                        id="industry-url"
                        placeholder="e.g., Medical Devices"
                        value={customIndustry}
                        onChange={(e) => setCustomIndustry(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">Company Website</Label>
                      <Input
                        id="url"
                        placeholder="https://company.com"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                <Button 
                  onClick={handleGenerateTemplate}
                  disabled={generateTemplateMutation.isPending || !customIndustry.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {generateTemplateMutation.isPending ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Template
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Templates Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
                <p className="text-gray-600 mb-4">
                  No templates available for the selected category. Create a custom template using AI.
                </p>
                <Button 
                  onClick={() => setSelectedCategory("all")}
                  variant="outline"
                >
                  View All Templates
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {templates.map((template: any) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Factory className="w-5 h-5" />
                            {template.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {template.description}
                          </CardDescription>
                        </div>
                        {template.isAiGenerated && (
                          <Badge variant="secondary" className="ml-2 shrink-0">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">
                            {categories.find(c => c.value === template.category)?.label || template.category}
                          </Badge>
                          <span className="text-sm text-gray-500">{template.usageCount} users</span>
                        </div>
                        
                        {template.keywords && template.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.keywords.slice(0, 3).map((keyword: string) => (
                              <Badge key={keyword} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {template.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Color Scheme Preview */}
                        {template.colorScheme && (
                          <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4 text-gray-400" />
                            <div className="flex gap-1">
                              {Object.values(template.colorScheme).slice(0, 4).map((color: any, index) => (
                                <div 
                                  key={index}
                                  className="w-4 h-4 rounded-full border border-gray-200"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyTemplate(template);
                          }}
                          disabled={applyTemplateMutation.isPending}
                          className="w-full"
                          size="sm"
                        >
                          {applyTemplateMutation.isPending ? (
                            "Applying..."
                          ) : activeTemplate?.templateId === template.id ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Active
                            </>
                          ) : (
                            "Apply Template"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Template Details Dialog */}
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedTemplate && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Factory className="w-6 h-6" />
                    {selectedTemplate.name}
                    {selectedTemplate.isAiGenerated && (
                      <Badge variant="secondary">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Generated
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedTemplate.description}
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="factory">Visual Factory</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Industry Category</h4>
                        <Badge variant="outline">
                          {categories.find(c => c.value === selectedTemplate.category)?.label || selectedTemplate.category}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Usage Count</h4>
                        <span className="text-2xl font-bold text-blue-600">{selectedTemplate.usageCount}</span>
                        <span className="text-gray-500 ml-2">users</span>
                      </div>
                    </div>

                    {selectedTemplate.keywords && (
                      <div>
                        <h4 className="font-semibold mb-2">Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.keywords.map((keyword: string) => (
                            <Badge key={keyword} variant="outline">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTemplate.colorScheme && (
                      <div>
                        <h4 className="font-semibold mb-2">Color Scheme</h4>
                        <div className="grid grid-cols-5 gap-2">
                          {Object.entries(selectedTemplate.colorScheme).map(([name, color]: [string, any]) => (
                            <div key={name} className="text-center">
                              <div 
                                className="w-12 h-12 rounded-lg border border-gray-200 mx-auto mb-1"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-xs text-gray-600 capitalize">{name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-4">
                    {selectedTemplate.configurations?.analytics?.kpis && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <BarChart className="w-4 h-4" />
                          Key Performance Indicators
                        </h4>
                        <div className="grid gap-3">
                          {selectedTemplate.configurations.analytics.kpis.map((kpi: any, index: number) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-medium">{kpi.name}</h5>
                                  <p className="text-sm text-gray-600 mt-1">{kpi.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">Formula: {kpi.formula}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-600">{kpi.target}</div>
                                  <div className="text-xs text-gray-500">{kpi.unit}</div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="reports" className="space-y-4">
                    {selectedTemplate.configurations?.reports && (
                      <div>
                        <h4 className="font-semibold mb-3">Report Templates</h4>
                        <div className="grid gap-3">
                          {selectedTemplate.configurations.reports.map((report: any, index: number) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-medium">{report.name}</h5>
                                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">{report.type}</Badge>
                                    <Badge variant="outline" className="text-xs">{report.schedule}</Badge>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="factory" className="space-y-4">
                    {selectedTemplate.configurations?.visualFactory?.displays && (
                      <div>
                        <h4 className="font-semibold mb-3">Visual Factory Displays</h4>
                        <div className="grid gap-3">
                          {selectedTemplate.configurations.visualFactory.displays.map((display: any, index: number) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-medium">{display.name}</h5>
                                  <p className="text-sm text-gray-600 mt-1">Type: {display.type}</p>
                                  <p className="text-sm text-gray-600">Position: {display.position}</p>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                    Close
                  </Button>
                  <Button 
                    onClick={() => handleApplyTemplate(selectedTemplate)}
                    disabled={applyTemplateMutation.isPending}
                  >
                    {applyTemplateMutation.isPending ? (
                      "Applying Template..."
                    ) : activeTemplate?.templateId === selectedTemplate.id ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Currently Active
                      </>
                    ) : (
                      "Apply This Template"
                    )}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full overflow-y-auto">
          <PageContent />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PageContent />
    </div>
  );
}