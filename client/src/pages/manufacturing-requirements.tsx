import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, CheckCircle, Package, Settings, Factory, Sparkles, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import mfgUseCasesData from "@/data/manufacturing-requirements.json";

interface Requirement {
  name: string;
  features: string[];
}

interface Segment {
  segment: string;
  useCases: Requirement[];
}

export default function ManufacturingRequirements() {
  const [data] = useState<Segment[]>(mfgUseCasesData as Segment[]);
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [selectedRequirements, setSelectedRequirements] = useState<Set<string>>(new Set());
  const [requiredFeatures, setRequiredFeatures] = useState<Map<string, { count: number; requirements: string[] }>>(new Map());
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());
  const [showImplementationPlan, setShowImplementationPlan] = useState(false);

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
              Select your manufacturing requirements to identify needed PlanetTogether features
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1">
              <CheckCircle className="h-4 w-4 mr-1" />
              {selectedRequirements.size} Requirements Selected
            </Badge>
            <Badge variant="default" className="px-3 py-1">
              <Sparkles className="h-4 w-4 mr-1" />
              {requiredFeatures.size} Features Required
            </Badge>
          </div>
        </div>

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
                  Critical Priority Features (Required by 5+ requirements)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {criticalFeatures.map(([feature, data]) => (
                    <Card key={feature} className="p-3 border-red-200 bg-red-50 dark:bg-red-950/20">
                      <div className="font-medium">{feature}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Required by {data.count} requirements
                      </div>
                      <Collapsible>
                        <CollapsibleTrigger className="text-xs text-primary hover:underline mt-2">
                          View requirements →
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {data.requirements.map((req, i) => (
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
                  High Priority Features (Required by 3-4 requirements)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {highFeatures.map(([feature, data]) => (
                    <Card key={feature} className="p-3 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                      <div className="font-medium text-sm">{feature}</div>
                      <div className="text-xs text-muted-foreground">
                        {data.count} requirements
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {mediumFeatures.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-600 flex items-center gap-2 mb-3">
                  Medium Priority Features (Required by 1-2 requirements)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mediumFeatures.map(([feature, data]) => (
                    <Badge key={feature} variant="secondary" className="px-3 py-1">
                      {feature} ({data.count})
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
                <Badge variant="default">{requiredFeatures.size} Total</Badge>
              </div>
              
              <ScrollArea className="h-[600px] pr-4">
                {sortedFeatures.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Select requirements to see required features
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedFeatures.map(([feature, data]) => (
                      <Collapsible key={feature}>
                        <div 
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          data-testid={`feature-${feature}`}
                        >
                          <div className="flex-1">
                            <span className="font-medium text-sm">{feature}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={cn("text-white", getPriorityColor(data.count))}
                            >
                              {getPriorityLabel(data.count)}
                            </Badge>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 px-2">
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        <CollapsibleContent className="px-3 pb-2">
                          <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            <div className="font-medium">Required by {data.count} requirement{data.count !== 1 ? 's' : ''}:</div>
                            {data.requirements.map((req, i) => (
                              <div key={i}>• {req}</div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}