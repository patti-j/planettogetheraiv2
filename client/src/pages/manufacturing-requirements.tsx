import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ChevronDown, ChevronUp, CheckCircle, Package, Settings, Factory, 
  Sparkles, FileText, AlertCircle, Upload, Download, FileSpreadsheet,
  Play, Pause, Check, Clock, Loader2, MoreVertical, Eye, Trash2, X, RotateCcw, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import mfgUseCasesData from "@/data/manufacturing-requirements.json";

interface Requirement {
  name: string;
  features: string[];
}

interface Segment {
  segment: string;
  useCases: Requirement[];
}

interface CustomerRequirement {
  id: number;
  customerId: number | null;
  customerName: string;
  segment: string;
  requirementName: string;
  description: string | null;
  features: string[];
  priority: string;
  lifecycleStatus: string;
  modelingProgress: number;
  testingProgress: number;
  deploymentProgress: number;
  modelingStartDate: string | null;
  modelingCompleteDate: string | null;
  testingStartDate: string | null;
  testingCompleteDate: string | null;
  deploymentStartDate: string | null;
  deploymentCompleteDate: string | null;
  sourceFile: string | null;
  createdAt: string;
}

const LIFECYCLE_STATUSES = [
  { value: 'uploaded', label: 'Uploaded', color: 'bg-gray-500' },
  { value: 'modeling_pending', label: 'Modeling Pending', color: 'bg-yellow-500' },
  { value: 'modeling_in_progress', label: 'Modeling In Progress', color: 'bg-blue-500' },
  { value: 'modeling_complete', label: 'Modeling Complete', color: 'bg-green-500' },
  { value: 'testing_pending', label: 'Testing Pending', color: 'bg-yellow-500' },
  { value: 'testing_in_progress', label: 'Testing In Progress', color: 'bg-blue-500' },
  { value: 'testing_complete', label: 'Testing Complete', color: 'bg-green-500' },
  { value: 'deployment_pending', label: 'Deployment Pending', color: 'bg-yellow-500' },
  { value: 'deployment_in_progress', label: 'Deployment In Progress', color: 'bg-blue-500' },
  { value: 'deployed', label: 'Deployed', color: 'bg-green-600' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-red-500' }
];

export default function ManufacturingRequirements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [data] = useState<Segment[]>(mfgUseCasesData as Segment[]);
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [selectedRequirements, setSelectedRequirements] = useState<Set<string>>(new Set());
  const [requiredFeatures, setRequiredFeatures] = useState<Map<string, { count: number; requirements: string[] }>>(new Map());
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());
  const [showImplementationPlan, setShowImplementationPlan] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("library");
  const [selectedCustomerReqs, setSelectedCustomerReqs] = useState<Set<number>>(new Set());
  const [excludedFeatures, setExcludedFeatures] = useState<Set<string>>(new Set());

  const { data: customerRequirements = [], isLoading: loadingRequirements } = useQuery<CustomerRequirement[]>({
    queryKey: ['/api/customer-requirements']
  });

  const { data: requirementsStats } = useQuery<{
    total: number;
    byStatus: Array<{ status: string; count: number }>;
    bySegment: Array<{ segment: string; count: number }>;
    summary: {
      uploaded: number;
      inModeling: number;
      inTesting: number;
      inDeployment: number;
      deployed: number;
      completionRate: number;
    };
  }>({
    queryKey: ['/api/customer-requirements/stats']
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/customer-requirements/upload', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Imported ${data.imported} requirements${data.errors?.length ? ` with ${data.errors.length} errors` : ''}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-requirements/stats'] });
      setShowUploadDialog(false);
      setUploadFile(null);
      setCustomerName("");
      setActiveTab("uploaded");
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload requirements. Please check your file format.",
        variant: "destructive"
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reqName }: { id: number; status: string; reqName?: string }) => {
      return apiRequest('PATCH', `/api/customer-requirements/${id}/status`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-requirements/stats'] });
      const statusInfo = LIFECYCLE_STATUSES.find(s => s.value === variables.status);
      toast({ 
        title: "Status Advanced",
        description: `${variables.reqName ? `"${variables.reqName}" ` : ''}moved to ${statusInfo?.label || variables.status}`
      });
    },
    onError: () => {
      toast({ 
        title: "Update Failed",
        description: "Could not advance status. Please try again.",
        variant: "destructive"
      });
    }
  });

  const deleteRequirementMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/customer-requirements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-requirements/stats'] });
      toast({ title: "Requirement Deleted" });
    }
  });

  useEffect(() => {
    const featureData = new Map<string, { count: number; requirements: string[] }>();
    
    data.forEach(segment => {
      segment.useCases.forEach(req => {
        const key = `${segment.segment}:${req.name}`;
        if (selectedRequirements.has(key)) {
          req.features.forEach(feature => {
            const existing = featureData.get(feature) || { count: 0, requirements: [] };
            existing.count++;
            existing.requirements.push(`${segment.segment} - ${req.name}`);
            featureData.set(feature, existing);
          });
        }
      });
    });
    
    setRequiredFeatures(featureData);
  }, [selectedRequirements, data]);

  const handleUpload = async () => {
    if (!uploadFile || !customerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a customer name and select a file",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('customerName', customerName);
    
    try {
      await uploadMutation.mutateAsync(formData);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    window.location.href = '/api/customer-requirements/template';
  };

  const toggleRequirement = (segmentName: string, reqName: string) => {
    const key = `${segmentName}:${reqName}`;
    const newSelected = new Set(selectedRequirements);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedRequirements(newSelected);
  };

  const toggleSegment = (segmentName: string) => {
    const expanded = new Set(expandedSegments);
    if (expanded.has(segmentName)) {
      expanded.delete(segmentName);
    } else {
      expanded.add(segmentName);
    }
    setExpandedSegments(expanded);
  };

  const selectAllInSegment = (segment: Segment) => {
    const newSelected = new Set(selectedRequirements);
    const segmentKeys = segment.useCases.map(req => `${segment.segment}:${req.name}`);
    const allSelected = segmentKeys.every(key => newSelected.has(key));
    
    if (allSelected) {
      segmentKeys.forEach(key => newSelected.delete(key));
    } else {
      segmentKeys.forEach(key => newSelected.add(key));
    }
    
    setSelectedRequirements(newSelected);
  };

  const clearAll = () => {
    setSelectedRequirements(new Set());
    setSelectedSegment("");
    setShowImplementationPlan(false);
    setExcludedFeatures(new Set());
  };

  const toggleExcludeFeature = (feature: string) => {
    const newExcluded = new Set(excludedFeatures);
    if (newExcluded.has(feature)) {
      newExcluded.delete(feature);
    } else {
      newExcluded.add(feature);
    }
    setExcludedFeatures(newExcluded);
  };

  const restoreAllFeatures = () => {
    setExcludedFeatures(new Set());
  };

  const getSegmentIcon = (segmentName: string) => {
    const icons: Record<string, React.ReactNode> = {
      "Life Sciences": <Package className="h-4 w-4" />,
      "Chemicals": <Factory className="h-4 w-4" />,
      "Printing & Packaging": <Package className="h-4 w-4" />,
      "Mobility": <Settings className="h-4 w-4" />,
      "Food Production": <Factory className="h-4 w-4" />,
      "High-Tech and Electronics": <Settings className="h-4 w-4" />,
      "Beverage": <Factory className="h-4 w-4" />,
      "Aerospace and Defense": <Settings className="h-4 w-4" />,
      "Metal Fabrication": <Factory className="h-4 w-4" />,
      "Industrial Machines": <Settings className="h-4 w-4" />
    };
    return icons[segmentName] || <Factory className="h-4 w-4" />;
  };

  const getPriorityColor = (count: number) => {
    if (count > 4) return "bg-red-500";
    if (count > 2) return "bg-orange-500";
    return "bg-blue-500";
  };

  const getPriorityLabel = (count: number) => {
    if (count > 4) return "Critical";
    if (count > 2) return "High";
    return "Medium";
  };

  const getStatusInfo = (status: string) => {
    return LIFECYCLE_STATUSES.find(s => s.value === status) || LIFECYCLE_STATUSES[0];
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusOrder = ['uploaded', 'modeling_pending', 'modeling_in_progress', 'modeling_complete', 
                         'testing_pending', 'testing_in_progress', 'testing_complete',
                         'deployment_pending', 'deployment_in_progress', 'deployed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  const getPhaseProgress = (req: CustomerRequirement) => {
    if (req.lifecycleStatus.includes('deploy') || req.lifecycleStatus === 'deployed') {
      return { phase: 'Deployment', progress: req.deploymentProgress };
    }
    if (req.lifecycleStatus.includes('testing')) {
      return { phase: 'Testing', progress: req.testingProgress };
    }
    return { phase: 'Modeling', progress: req.modelingProgress };
  };

  const sortedFeatures = Array.from(requiredFeatures.entries())
    .sort((a, b) => b[1].count - a[1].count);

  const criticalFeatures = sortedFeatures.filter(([_, data]) => data.count > 4);
  const highFeatures = sortedFeatures.filter(([_, data]) => data.count > 2 && data.count <= 4);
  const mediumFeatures = sortedFeatures.filter(([_, data]) => data.count <= 2);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              Manufacturing Requirements Analyzer
            </h1>
            <p className="text-muted-foreground mt-2">
              Select your manufacturing requirements or upload custom requirements from a spreadsheet
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={downloadTemplate} data-testid="button-download-template">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button onClick={() => setShowUploadDialog(true)} data-testid="button-upload-requirements">
              <Upload className="h-4 w-4 mr-2" />
              Upload Requirements
            </Button>
          </div>
        </div>

        {requirementsStats?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold">{requirementsStats.summary.uploaded}</div>
              <div className="text-sm text-muted-foreground">Uploaded</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">{requirementsStats.summary.inModeling}</div>
              <div className="text-sm text-muted-foreground">In Modeling</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">{requirementsStats.summary.inTesting}</div>
              <div className="text-sm text-muted-foreground">In Testing</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">{requirementsStats.summary.inDeployment}</div>
              <div className="text-sm text-muted-foreground">In Deployment</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">{requirementsStats.summary.deployed}</div>
              <div className="text-sm text-muted-foreground">Deployed</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{requirementsStats.summary.completionRate}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="library" data-testid="tab-library">Requirements Library</TabsTrigger>
            <TabsTrigger value="uploaded" data-testid="tab-uploaded">
              Uploaded Requirements
              {customerRequirements.length > 0 && (
                <Badge variant="secondary" className="ml-2">{customerRequirements.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Select value={selectedSegment} onValueChange={(value) => setSelectedSegment(value)}>
                  <SelectTrigger className="w-[250px]" data-testid="select-segment-filter">
                    <SelectValue placeholder="Filter by Segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="select-item-all">All Segments</SelectItem>
                    {data.map(segment => (
                      <SelectItem key={segment.segment} value={segment.segment} data-testid={`select-item-${segment.segment}`}>
                        {segment.segment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={clearAll} data-testid="button-clear-all">
                  Clear All
                </Button>
                <Badge variant="secondary" className="px-3 py-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {selectedRequirements.size} Selected
                </Badge>
              </div>
              
              {sortedFeatures.length > 0 && (
                <Button 
                  onClick={() => setShowImplementationPlan(!showImplementationPlan)} 
                  data-testid="button-show-plan"
                  variant={showImplementationPlan ? "default" : "outline"}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {showImplementationPlan ? "Hide" : "Show"} Implementation Plan
                </Button>
              )}
            </div>

            {showImplementationPlan && sortedFeatures.length > 0 && (
              <Card className="p-6 border-2 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Implementation Plan</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card className="p-4 bg-background">
                    <div className="text-3xl font-bold text-primary">{selectedRequirements.size}</div>
                    <div className="text-sm text-muted-foreground">Requirements Selected</div>
                  </Card>
                  <Card className="p-4 bg-background">
                    <div className="text-3xl font-bold text-primary">{requiredFeatures.size}</div>
                    <div className="text-sm text-muted-foreground">Features Required</div>
                  </Card>
                  <Card className="p-4 bg-background">
                    <div className="text-3xl font-bold text-red-500">{criticalFeatures.length}</div>
                    <div className="text-sm text-muted-foreground">Critical Priority</div>
                  </Card>
                </div>

                {criticalFeatures.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-red-600 flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4" />
                      Critical Priority Features (Needed for 5+ requirements)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {criticalFeatures.map(([feature, featureData]) => (
                        <Card key={feature} className="p-3 border-red-200 bg-red-50 dark:bg-red-950/20">
                          <div className="font-medium">{feature}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Needed for {featureData.count} requirements
                          </div>
                          <Collapsible>
                            <CollapsibleTrigger className="text-xs text-primary hover:underline mt-2">
                              View requirements →
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {featureData.requirements.map((req, i) => (
                                  <li key={i}>• {req}</li>
                                ))}
                              </ul>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {highFeatures.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-orange-600 flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4" />
                      High Priority Features (Needed for 3-4 requirements)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {highFeatures.map(([feature, featureData]) => (
                        <Card key={feature} className="p-3 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                          <div className="font-medium text-sm">{feature}</div>
                          <div className="text-xs text-muted-foreground">
                            {featureData.count} requirements
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {mediumFeatures.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-blue-600 flex items-center gap-2 mb-3">
                      Medium Priority Features (Needed for 1-2 requirements)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {mediumFeatures.map(([feature, featureData]) => (
                        <Badge key={feature} variant="secondary" className="px-3 py-1">
                          {feature} ({featureData.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Manufacturing Requirements</h2>
                    <span className="text-sm text-muted-foreground">
                      Select requirements that apply to your operations
                    </span>
                  </div>
                  
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {data
                        .filter(segment => !selectedSegment || selectedSegment === "" || selectedSegment === "all" || segment.segment === selectedSegment)
                        .map(segment => (
                          <Card key={segment.segment} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {getSegmentIcon(segment.segment)}
                                <h3 className="font-semibold text-lg">{segment.segment}</h3>
                                <Badge variant="outline" className="ml-2">
                                  {segment.useCases.length} requirements
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => selectAllInSegment(segment)}
                                  data-testid={`button-select-all-${segment.segment}`}
                                >
                                  {segment.useCases.every(req => selectedRequirements.has(`${segment.segment}:${req.name}`)) 
                                    ? "Deselect All" 
                                    : "Select All"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleSegment(segment.segment)}
                                  data-testid={`button-toggle-${segment.segment}`}
                                >
                                  {expandedSegments.has(segment.segment) ? <ChevronUp /> : <ChevronDown />}
                                </Button>
                              </div>
                            </div>
                            
                            {expandedSegments.has(segment.segment) && (
                              <div className="space-y-2 mt-3">
                                {segment.useCases.map(req => (
                                  <div 
                                    key={req.name}
                                    className={cn(
                                      "flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors",
                                      selectedRequirements.has(`${segment.segment}:${req.name}`) && "bg-primary/5"
                                    )}
                                  >
                                    <Checkbox
                                      checked={selectedRequirements.has(`${segment.segment}:${req.name}`)}
                                      onCheckedChange={() => toggleRequirement(segment.segment, req.name)}
                                      data-testid={`checkbox-requirement-${req.name}`}
                                    />
                                    <div className="flex-1">
                                      <label className="font-medium cursor-pointer" 
                                             onClick={() => toggleRequirement(segment.segment, req.name)}>
                                        {req.name}
                                      </label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {req.features.slice(0, 3).map(feature => (
                                          <Badge key={feature} variant="secondary" className="text-xs">
                                            {feature}
                                          </Badge>
                                        ))}
                                        {req.features.length > 3 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{req.features.length - 3} more
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>
                        ))}
                    </div>
                  </ScrollArea>
                </Card>
              </div>

              <div>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Required Features</h2>
                    <div className="flex items-center gap-2">
                      {excludedFeatures.size > 0 && (
                        <Badge variant="outline" className="text-muted-foreground">
                          {excludedFeatures.size} excluded
                        </Badge>
                      )}
                      <Badge variant="default">
                        {requiredFeatures.size - excludedFeatures.size} Features
                      </Badge>
                    </div>
                  </div>
                  {selectedRequirements.size > 0 && (
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground">
                        {selectedRequirements.size} requirement{selectedRequirements.size !== 1 ? 's' : ''} selected → {requiredFeatures.size - excludedFeatures.size} feature{requiredFeatures.size - excludedFeatures.size !== 1 ? 's' : ''} included
                      </p>
                      {excludedFeatures.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={restoreAllFeatures}
                          className="text-xs h-6"
                          data-testid="button-restore-features"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore All
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <ScrollArea className="h-[500px] pr-4">
                    {sortedFeatures.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          Select requirements to see required features
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sortedFeatures.map(([feature, featureData]) => {
                          const isExcluded = excludedFeatures.has(feature);
                          return (
                            <Collapsible key={feature}>
                              <div 
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg transition-all",
                                  isExcluded 
                                    ? "bg-muted/10 opacity-50" 
                                    : "bg-muted/30"
                                )}
                                data-testid={`feature-${feature}`}
                              >
                                <div className="flex-1">
                                  <span className={cn(
                                    "font-medium text-sm",
                                    isExcluded && "line-through text-muted-foreground"
                                  )}>
                                    {feature}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!isExcluded && (
                                    <Badge 
                                      className={cn("text-white", getPriorityColor(featureData.count))}
                                    >
                                      {getPriorityLabel(featureData.count)}
                                    </Badge>
                                  )}
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-2">
                                      <ChevronDown className="h-3 w-3" />
                                    </Button>
                                  </CollapsibleTrigger>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={cn(
                                      "h-6 w-6 p-0",
                                      isExcluded 
                                        ? "text-green-600 hover:text-green-700 hover:bg-green-100" 
                                        : "text-red-500 hover:text-red-600 hover:bg-red-100"
                                    )}
                                    onClick={() => toggleExcludeFeature(feature)}
                                    data-testid={`button-toggle-feature-${feature}`}
                                  >
                                    {isExcluded ? <RotateCcw className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                  </Button>
                                </div>
                              </div>
                              <CollapsibleContent className="px-3 pb-2">
                                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                  <div className="font-medium">Needed for {featureData.count} requirement{featureData.count !== 1 ? 's' : ''}:</div>
                                  {featureData.requirements.map((req, i) => (
                                    <div key={i}>• {req}</div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                  
                  {sortedFeatures.length > 0 && sortedFeatures.length > excludedFeatures.size && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        className="w-full" 
                        data-testid="button-add-to-roadmap"
                        onClick={async () => {
                          const includedFeatures = sortedFeatures
                            .filter(([feature]) => !excludedFeatures.has(feature))
                            .map(([feature, data], index) => ({ 
                              id: `lib-${feature.toLowerCase().replace(/\s+/g, '-')}`,
                              name: feature, 
                              priority: getPriorityLabel(data.count), 
                              requirementCount: data.count,
                              requirements: data.requirements,
                              source: 'library' as const,
                              order: index + 1
                            }));
                          
                          try {
                            const response = await fetch('/api/roadmap-features/bulk', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ features: includedFeatures })
                            });
                            
                            if (!response.ok) {
                              throw new Error('Failed to add features');
                            }
                            
                            const result = await response.json();
                            
                            // Clear selections after successful add
                            setSelectedRequirements(new Set());
                            setExcludedFeatures(new Set());
                            
                            toast({
                              title: "Features Added to Roadmap",
                              description: `${result.inserted} feature${result.inserted !== 1 ? 's' : ''} added${result.skipped > 0 ? `, ${result.skipped} already existed` : ''}. Go to Onboarding Overview → Feature Roadmap to prioritize.`
                            });
                          } catch (error) {
                            console.error('Error adding features to roadmap:', error);
                            toast({
                              title: "Error",
                              description: "Failed to add features to roadmap. Please try again.",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Add to Roadmap ({requiredFeatures.size - excludedFeatures.size} features)
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="uploaded" className="space-y-6">
            {loadingRequirements ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : customerRequirements.length === 0 ? (
              <Card className="p-12 text-center">
                <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Customer Requirements Uploaded</h3>
                <p className="text-muted-foreground mb-6">
                  Upload a spreadsheet with your customer's specific requirements to track their implementation.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Requirements
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {customerRequirements.map((req) => {
                  const statusInfo = getStatusInfo(req.lifecycleStatus);
                  const phaseInfo = getPhaseProgress(req);
                  const nextStatus = getNextStatus(req.lifecycleStatus);
                  
                  return (
                    <Card key={req.id} className="p-4" data-testid={`card-requirement-${req.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{req.requirementName}</h3>
                            <Badge variant="outline">{req.segment}</Badge>
                            <Badge className={cn("text-white", statusInfo.color)}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Customer: {req.customerName}
                            {req.sourceFile && ` • Source: ${req.sourceFile}`}
                          </p>
                          {req.description && (
                            <p className="text-sm mb-3">{req.description}</p>
                          )}
                          {req.features && Array.isArray(req.features) && req.features.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {req.features.map((feature: string) => (
                                <Badge key={feature} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <div className="flex-1 max-w-xs">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>{phaseInfo.phase}</span>
                                <span>{phaseInfo.progress}%</span>
                              </div>
                              <Progress value={phaseInfo.progress} className="h-2" />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Created {new Date(req.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {nextStatus && req.lifecycleStatus !== 'deployed' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateStatusMutation.mutate({ 
                                id: req.id, 
                                status: nextStatus,
                                reqName: req.requirementName 
                              })}
                              disabled={updateStatusMutation.isPending}
                              data-testid={`button-advance-${req.id}`}
                            >
                              {updateStatusMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4 mr-1" />
                              )}
                              Advance
                            </Button>
                          )}
                          {req.lifecycleStatus === 'deployed' && (
                            <Badge className="bg-green-600 text-white">
                              <Check className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => deleteRequirementMutation.mutate(req.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Customer Requirements</DialogTitle>
            <DialogDescription>
              Upload an Excel spreadsheet with customer requirements. Download the template for the correct format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                data-testid="input-customer-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Requirements File</Label>
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors",
                  uploadFile && "border-primary bg-primary/5"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  data-testid="input-file"
                />
                {uploadFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                    <span className="font-medium">{uploadFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to select or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Excel (.xlsx, .xls) or CSV files
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !uploadFile || !customerName.trim()}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
