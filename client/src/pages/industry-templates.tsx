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
      return apiRequest("/api/generate-industry-template", "POST", data);
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
              
              {/* Maximize button always in top right corner */}
              <div className="absolute top-0 right-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMaximized(!isMaximized)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content goes here - simplified for now */}
            <div className="text-center py-12">
              <p className="text-gray-500">Industry templates content will be displayed here.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content goes here - simplified for now */}
        <div className="text-center py-12">
          <p className="text-gray-500">Industry templates content will be displayed here.</p>
        </div>
      </div>
    </div>
  );
}