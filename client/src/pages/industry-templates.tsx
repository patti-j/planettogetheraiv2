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
import { PublicSiteSearch } from "@/components/public-site-search";
import { Sparkles, Building2, Settings, Check, Plus, Globe, Palette, BarChart, Factory, Maximize2, Minimize2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAITheme } from "@/hooks/use-ai-theme";
import { useMaxDock } from "@/contexts/MaxDockContext";

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
  const { aiTheme } = useAITheme();
  const { isMaxOpen } = useMaxDock();
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
      const response = await fetch(`/api/industry-templates?category=${selectedCategory}`);
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    }
  });

  // Fetch active template
  const { data: activeTemplate } = useQuery({
    queryKey: ["active-template"],
    queryFn: async () => {
      const response = await fetch("/api/active-template");
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Apply template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: async (data: { templateId: number }) => {
      return apiRequest("/api/apply-template", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Template Applied",
        description: "Industry template has been successfully applied to your system"
      });
      queryClient.invalidateQueries({ queryKey: ["active-template"] });
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

  // Generate template mutation
  const generateTemplateMutation = useMutation({
    mutationFn: async (data: { industry: string; sourceUrl?: string; sourcePrompt?: string }) => {
      return apiRequest("POST", "/api/industry-templates/generate", {
        ...data,
        createdBy: user?.id || 1
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Template Generated",
        description: "Custom industry template has been created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["industry-templates"] });
      setSelectedTemplate(data);
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

  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full overflow-y-auto">
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
              

            </div>

            {/* Active Template Status */}
            {activeTemplate && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Current Template: {activeTemplate.name}</p>
                      <p className="text-sm text-green-600">{activeTemplate.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select industry category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className={aiTheme.gradient}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Custom Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Generate Custom Industry Template</DialogTitle>
                    <DialogDescription>
                      Create a specialized template for your unique industry requirements
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry Type</Label>
                      <Input
                        id="industry"
                        placeholder="e.g., Precision Machining, Medical Devices"
                        value={customIndustry}
                        onChange={(e) => setCustomIndustry(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sourceUrl">Reference URL (Optional)</Label>
                      <Input
                        id="sourceUrl"
                        placeholder="Industry website or documentation"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sourcePrompt">Additional Requirements (Optional)</Label>
                      <Textarea
                        id="sourcePrompt"
                        placeholder="Specific processes, regulations, or requirements..."
                        value={sourcePrompt}
                        onChange={(e) => setSourcePrompt(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button 
                      onClick={handleGenerateTemplate}
                      disabled={generateTemplateMutation.isPending}
                      className="w-full"
                    >
                      {generateTemplateMutation.isPending ? "Generating..." : "Generate Template"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Templates Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template: any) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Factory className="w-5 h-5 text-blue-600" />
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                        <Badge variant={template.category === 'custom' ? 'secondary' : 'default'}>
                          {template.category}
                        </Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-gray-600">
                          <strong>Includes:</strong>
                          <ul className="mt-1 list-disc list-inside text-xs space-y-1">
                            {template.features?.slice(0, 3).map((feature: string, index: number) => (
                              <li key={index}>{feature}</li>
                            ))}
                            {template.features?.length > 3 && (
                              <li className="text-gray-500">+{template.features.length - 3} more features</li>
                            )}
                          </ul>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setSelectedTemplate(template)}
                            variant="outline"
                            className="flex-1"
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApplyTemplate(template)}
                            disabled={applyTemplateMutation.isPending || activeTemplate?.id === template.id}
                            className="flex-1"
                          >
                            {activeTemplate?.id === template.id ? "Active" : "Apply"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
                  <p className="text-gray-600">
                    No templates available for the selected category. Try a different category or use the Generate Custom Template button above.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Top Navigation with Search */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold">PlanetTogether</span>
            </div>
            <div className="flex items-center gap-4">
              <PublicSiteSearch />
              {user && (
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/home'}
                >
                  Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="relative">
          <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
              <Building2 className="w-6 h-6 mr-2" />
              Industry Templates
            </h1>
            <p className="text-sm md:text-base text-gray-600">Configure your manufacturing management system for your specific industry with AI-powered templates</p>
          </div>
          

        </div>

        {/* Active Template Status */}
        {activeTemplate && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Current Template: {activeTemplate.name}</p>
                  <p className="text-sm text-green-600">{activeTemplate.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select industry category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className={aiTheme.gradient}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Custom Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Generate Custom Industry Template</DialogTitle>
                <DialogDescription>
                  Create a specialized template for your unique industry requirements
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry Type</Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Precision Machining, Medical Devices"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">Reference URL (Optional)</Label>
                  <Input
                    id="sourceUrl"
                    placeholder="Industry website or documentation"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourcePrompt">Additional Requirements (Optional)</Label>
                  <Textarea
                    id="sourcePrompt"
                    placeholder="Specific processes, regulations, or requirements..."
                    value={sourcePrompt}
                    onChange={(e) => setSourcePrompt(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleGenerateTemplate}
                  disabled={generateTemplateMutation.isPending}
                  className="w-full"
                >
                  {generateTemplateMutation.isPending ? "Generating..." : "Generate Template"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template: any) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Factory className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <Badge variant={template.category === 'custom' ? 'secondary' : 'default'}>
                      {template.category}
                    </Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <strong>Includes:</strong>
                      <ul className="mt-1 list-disc list-inside text-xs space-y-1">
                        {template.features?.slice(0, 3).map((feature: string, index: number) => (
                          <li key={index}>{feature}</li>
                        ))}
                        {template.features?.length > 3 && (
                          <li className="text-gray-500">+{template.features.length - 3} more features</li>
                        )}
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedTemplate(template)}
                        variant="outline"
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApplyTemplate(template)}
                        disabled={applyTemplateMutation.isPending || activeTemplate?.id === template.id}
                        className="flex-1"
                      >
                        {activeTemplate?.id === template.id ? "Active" : "Apply"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
              <p className="text-gray-600 mb-4">
                No templates available for the selected category. Try a different category or generate a custom template.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className={aiTheme.gradient}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Custom Template
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Template Details Dialog */}
        {selectedTemplate && (
          <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Factory className="w-5 h-5 text-blue-600" />
                  {selectedTemplate.name}
                </DialogTitle>
                <DialogDescription>{selectedTemplate.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Industry Category</h4>
                  <Badge>{selectedTemplate.category}</Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Features & Capabilities</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {selectedTemplate.features?.map((feature: string, index: number) => (
                      <li key={index}>{feature}</li>
                    )) || ['Manufacturing process optimization', 'Resource allocation', 'Quality control workflows']}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Configuration Details</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Workflows:</strong> {selectedTemplate.workflows || 'Standard manufacturing workflows'}</p>
                    <p><strong>Metrics:</strong> {selectedTemplate.metrics || 'OEE, throughput, quality metrics'}</p>
                    <p><strong>Compliance:</strong> {selectedTemplate.compliance || 'Industry standard compliance'}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleApplyTemplate(selectedTemplate)}
                    disabled={applyTemplateMutation.isPending || activeTemplate?.id === selectedTemplate.id}
                    className="flex-1"
                  >
                    {activeTemplate?.id === selectedTemplate.id ? "Currently Active" : "Apply Template"}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}