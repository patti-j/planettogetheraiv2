import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, CheckCircle, Package, Settings, Factory, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Import the JSON data
import mfgUseCasesData from "@/data/manufacturing-requirements.json";

interface UseCase {
  name: string;
  features: string[];
}

interface Segment {
  segment: string;
  useCases: UseCase[];
}

export default function ManufacturingRequirements() {
  const [data] = useState<Segment[]>(mfgUseCasesData as Segment[]);
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [selectedUseCases, setSelectedUseCases] = useState<Set<string>>(new Set());
  const [requiredFeatures, setRequiredFeatures] = useState<Map<string, { count: number; useCases: string[] }>>(new Map());
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"segment" | "feature">("segment");

  // Calculate required features based on selected use cases
  useEffect(() => {
    const featureData = new Map<string, { count: number; useCases: string[] }>();
    
    data.forEach(segment => {
      segment.useCases.forEach(useCase => {
        const key = `${segment.segment}:${useCase.name}`;
        if (selectedUseCases.has(key)) {
          useCase.features.forEach(feature => {
            const existing = featureData.get(feature) || { count: 0, useCases: [] };
            existing.count++;
            existing.useCases.push(`${segment.segment} - ${useCase.name}`);
            featureData.set(feature, existing);
          });
        }
      });
    });
    
    setRequiredFeatures(featureData);
  }, [selectedUseCases, data]);

  const toggleUseCase = (segmentName: string, useCaseName: string) => {
    const key = `${segmentName}:${useCaseName}`;
    const newSelected = new Set(selectedUseCases);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedUseCases(newSelected);
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
    const newSelected = new Set(selectedUseCases);
    const segmentKeys = segment.useCases.map(uc => `${segment.segment}:${uc.name}`);
    const allSelected = segmentKeys.every(key => newSelected.has(key));
    
    if (allSelected) {
      // Deselect all
      segmentKeys.forEach(key => newSelected.delete(key));
    } else {
      // Select all
      segmentKeys.forEach(key => newSelected.add(key));
    }
    
    setSelectedUseCases(newSelected);
  };

  const clearAll = () => {
    setSelectedUseCases(new Set());
    setSelectedSegment("");
  };

  const exportImplementationPlan = () => {
    // Create implementation plan data
    const plan = {
      timestamp: new Date().toISOString(),
      selectedUseCases: Array.from(selectedUseCases).map(key => {
        const [segment, useCase] = key.split(':');
        return { segment, useCase };
      }),
      requiredFeatures: Array.from(requiredFeatures.entries()).map(([feature, data]) => ({
        feature,
        priority: data.count > 4 ? 'Critical' : data.count > 2 ? 'High' : 'Medium',
        requiredByCount: data.count,
        requiredBy: data.useCases
      })).sort((a, b) => b.requiredByCount - a.requiredByCount),
      totalUseCases: selectedUseCases.size,
      totalFeatures: requiredFeatures.size
    };

    // Convert to JSON and download
    const jsonStr = JSON.stringify(plan, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PlanetTogether_Implementation_Plan_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const sortedFeatures = Array.from(requiredFeatures.entries())
    .sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              Manufacturing Requirements Analyzer
            </h1>
            <p className="text-muted-foreground mt-2">
              Select your manufacturing use cases to identify required PlanetTogether features
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1">
              <CheckCircle className="h-4 w-4 mr-1" />
              {selectedUseCases.size} Use Cases Selected
            </Badge>
            <Badge variant="default" className="px-3 py-1">
              <Sparkles className="h-4 w-4 mr-1" />
              {requiredFeatures.size} Features Required
            </Badge>
          </div>
        </div>

        {/* Controls */}
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
          
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "segment" | "feature")}>
            <TabsList>
              <TabsTrigger value="segment">By Segment</TabsTrigger>
              <TabsTrigger value="feature">By Feature</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Use Cases Selection */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Manufacturing Use Cases</h2>
                <span className="text-sm text-muted-foreground">
                  Select use cases that apply to your operations
                </span>
              </div>
              
              <ScrollArea className="h-[600px] pr-4">
                <Tabs value={viewMode} className="w-full">
                  <TabsContent value="segment" className="space-y-4">
                    {data
                      .filter(segment => !selectedSegment || selectedSegment === "all" || segment.segment === selectedSegment)
                      .map(segment => (
                        <Card key={segment.segment} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getSegmentIcon(segment.segment)}
                              <h3 className="font-semibold text-lg">{segment.segment}</h3>
                              <Badge variant="outline" className="ml-2">
                                {segment.useCases.length} use cases
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => selectAllInSegment(segment)}
                                data-testid={`button-select-all-${segment.segment}`}
                              >
                                {segment.useCases.every(uc => selectedUseCases.has(`${segment.segment}:${uc.name}`)) 
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
                              {segment.useCases.map(useCase => (
                                <div 
                                  key={useCase.name}
                                  className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors",
                                    selectedUseCases.has(`${segment.segment}:${useCase.name}`) && "bg-primary/5"
                                  )}
                                >
                                  <Checkbox
                                    checked={selectedUseCases.has(`${segment.segment}:${useCase.name}`)}
                                    onCheckedChange={() => toggleUseCase(segment.segment, useCase.name)}
                                    data-testid={`checkbox-usecase-${useCase.name}`}
                                  />
                                  <div className="flex-1">
                                    <label className="font-medium cursor-pointer" 
                                           onClick={() => toggleUseCase(segment.segment, useCase.name)}>
                                      {useCase.name}
                                    </label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {useCase.features.slice(0, 3).map(feature => (
                                        <Badge key={feature} variant="secondary" className="text-xs">
                                          {feature}
                                        </Badge>
                                      ))}
                                      {useCase.features.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{useCase.features.length - 3} more
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
                  </TabsContent>
                  
                  <TabsContent value="feature" className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      Select use cases from the "By Segment" tab to see required features here
                    </div>
                    {selectedUseCases.size === 0 ? (
                      <Card className="p-8 text-center">
                        <p className="text-muted-foreground">No use cases selected</p>
                      </Card>
                    ) : (
                      <Card className="p-4">
                        <h3 className="font-semibold mb-3">Selected Use Cases by Segment</h3>
                        {data.map(segment => {
                          const selectedInSegment = segment.useCases.filter(uc => 
                            selectedUseCases.has(`${segment.segment}:${uc.name}`)
                          );
                          
                          if (selectedInSegment.length === 0) return null;
                          
                          return (
                            <div key={segment.segment} className="mb-4">
                              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                {getSegmentIcon(segment.segment)}
                                {segment.segment}
                              </h4>
                              <div className="space-y-1 ml-6">
                                {selectedInSegment.map(uc => (
                                  <div key={uc.name} className="text-sm text-muted-foreground">
                                    • {uc.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </Card>
          </div>

          {/* Required Features */}
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
                      Select use cases to see required features
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedFeatures.map(([feature, data]) => (
                      <div 
                        key={feature}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        data-testid={`feature-${feature}`}
                      >
                        <span className="font-medium text-sm">{feature}</span>
                        <Badge 
                          variant={data.count > 2 ? "default" : "secondary"}
                          className={cn(data.count > 4 && "bg-primary")}
                        >
                          {data.count} {data.count === 1 ? "use case" : "use cases"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {sortedFeatures.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button className="w-full" onClick={exportImplementationPlan} data-testid="button-export">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Implementation Plan
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}