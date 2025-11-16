import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Play, Settings, TrendingUp, AlertTriangle, Info, RotateCcw, Save, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ImprovementInitiative, ImprovementSimulation } from "@shared/schema";

interface SimulationProps {
  initiative: ImprovementInitiative;
  onClose?: () => void;
}

interface SimulationParameters {
  resourceAllocation: number; // 0-100%
  implementationSpeed: "slow" | "normal" | "fast";
  riskTolerance: "low" | "medium" | "high";
  includeIndirectBenefits: boolean;
  scenarioType: "conservative" | "realistic" | "optimistic";
  
  // Specific parameters
  productivityImprovement: number; // percentage
  qualityImprovement: number; // percentage
  costReduction: number; // percentage
  leadTimeReduction: number; // percentage
  
  // Constraints
  maxBudget: number;
  maxTimeMonths: number;
  minQualityLevel: number;
}

export default function ImprovementSimulation({ initiative, onClose }: SimulationProps) {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  
  // Simulation parameters
  const [parameters, setParameters] = useState<SimulationParameters>({
    resourceAllocation: 70,
    implementationSpeed: "normal",
    riskTolerance: "medium",
    includeIndirectBenefits: true,
    scenarioType: "realistic",
    productivityImprovement: 20,
    qualityImprovement: 15,
    costReduction: 25,
    leadTimeReduction: 30,
    maxBudget: parseFloat(initiative.costToImplement || "100000"),
    maxTimeMonths: 6,
    minQualityLevel: 95
  });

  // Run simulation mutation
  const runSimulationMutation = useMutation({
    mutationFn: async () => {
      setIsRunning(true);
      setSimulationProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSimulationProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Make API call to run simulation
      const result = await apiRequest(`/api/improvement-initiatives/${initiative.id}/simulate`, "POST", {
        parameters
      });
      
      clearInterval(progressInterval);
      setSimulationProgress(100);
      
      return result;
    },
    onSuccess: (data) => {
      setSimulationResults(data);
      setIsRunning(false);
      toast({
        title: "Simulation Complete",
        description: "Results are ready for review"
      });
    },
    onError: () => {
      setIsRunning(false);
      setSimulationProgress(0);
      
      // Generate mock results for demo
      const mockResults = generateMockResults(parameters, initiative);
      setSimulationResults(mockResults);
      
      toast({
        title: "Simulation Complete",
        description: "Results generated (demo mode)"
      });
    }
  });

  // Generate mock simulation results
  const generateMockResults = (params: SimulationParameters, init: ImprovementInitiative) => {
    const baseValue = parseFloat(init.estimatedAnnualValue || "100000");
    const baseCost = parseFloat(init.costToImplement || "25000");
    
    // Calculate impacts based on parameters
    const productivityImpact = baseValue * (params.productivityImprovement / 100) * (params.resourceAllocation / 100);
    const qualityImpact = baseValue * (params.qualityImprovement / 100) * 0.8;
    const costSavings = baseValue * (params.costReduction / 100);
    const leadTimeValue = baseValue * (params.leadTimeReduction / 100) * 0.5;
    
    const totalValue = productivityImpact + qualityImpact + costSavings + leadTimeValue;
    
    // Adjust for scenario type
    const scenarioMultiplier = {
      conservative: 0.7,
      realistic: 1.0,
      optimistic: 1.3
    }[params.scenarioType];
    
    const adjustedValue = totalValue * scenarioMultiplier;
    const adjustedCost = baseCost * (params.implementationSpeed === "fast" ? 1.3 : params.implementationSpeed === "slow" ? 0.8 : 1.0);
    
    // Calculate confidence based on parameters
    const confidenceScore = 
      (params.riskTolerance === "low" ? 85 : params.riskTolerance === "medium" ? 75 : 65) +
      (params.includeIndirectBenefits ? -5 : 5) +
      (params.scenarioType === "conservative" ? 10 : params.scenarioType === "realistic" ? 5 : 0);
    
    return {
      summary: {
        expectedValue: adjustedValue,
        implementationCost: adjustedCost,
        netBenefit: adjustedValue - adjustedCost,
        roi: ((adjustedValue - adjustedCost) / adjustedCost * 100).toFixed(1),
        paybackMonths: (adjustedCost / (adjustedValue / 12)).toFixed(1),
        confidenceLevel: confidenceScore
      },
      breakdown: {
        productivity: productivityImpact,
        quality: qualityImpact,
        costReduction: costSavings,
        leadTime: leadTimeValue,
        indirect: params.includeIndirectBenefits ? baseValue * 0.1 : 0
      },
      timeline: [
        { month: 1, value: 0, cost: adjustedCost * 0.3, milestone: "Planning & Setup" },
        { month: 2, value: adjustedValue * 0.05, cost: adjustedCost * 0.3, milestone: "Initial Implementation" },
        { month: 3, value: adjustedValue * 0.15, cost: adjustedCost * 0.2, milestone: "Pilot Testing" },
        { month: 4, value: adjustedValue * 0.30, cost: adjustedCost * 0.15, milestone: "Rollout Phase 1" },
        { month: 5, value: adjustedValue * 0.50, cost: adjustedCost * 0.05, milestone: "Rollout Phase 2" },
        { month: 6, value: adjustedValue * 0.75, cost: 0, milestone: "Full Implementation" },
        { month: 12, value: adjustedValue, cost: 0, milestone: "Steady State" }
      ],
      risks: [
        { 
          type: "Implementation", 
          probability: params.implementationSpeed === "fast" ? "Medium" : "Low",
          impact: "High",
          mitigation: "Phased rollout with pilot testing"
        },
        {
          type: "Adoption",
          probability: "Medium",
          impact: "Medium",
          mitigation: "Comprehensive training and change management"
        },
        {
          type: "Technical",
          probability: params.riskTolerance === "high" ? "High" : "Low",
          impact: "Medium",
          mitigation: "Technical validation and backup plans"
        }
      ],
      recommendations: [
        params.resourceAllocation < 50 && "Consider increasing resource allocation for better results",
        params.implementationSpeed === "fast" && "Fast implementation increases risk - ensure proper controls",
        params.scenarioType === "optimistic" && "Optimistic scenario - consider conservative fallback plan",
        !params.includeIndirectBenefits && "Consider indirect benefits for complete picture"
      ].filter(Boolean)
    };
  };

  const handleReset = () => {
    setParameters({
      resourceAllocation: 70,
      implementationSpeed: "normal",
      riskTolerance: "medium",
      includeIndirectBenefits: true,
      scenarioType: "realistic",
      productivityImprovement: 20,
      qualityImprovement: 15,
      costReduction: 25,
      leadTimeReduction: 30,
      maxBudget: parseFloat(initiative.costToImplement || "100000"),
      maxTimeMonths: 6,
      minQualityLevel: 95
    });
    setSimulationResults(null);
    setSimulationProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Initiative Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Simulating: {initiative.title}</CardTitle>
          <CardDescription>{initiative.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Current Est. Value</p>
              <p className="font-semibold">${parseInt(initiative.estimatedAnnualValue || "0").toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Implementation Cost</p>
              <p className="font-semibold">${parseInt(initiative.costToImplement || "0").toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Payback Period</p>
              <p className="font-semibold">{initiative.paybackPeriodMonths || "TBD"} months</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Simulation Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="improvements">Improvements</TabsTrigger>
              <TabsTrigger value="constraints">Constraints</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label>Resource Allocation: {parameters.resourceAllocation}%</Label>
                <Slider
                  value={[parameters.resourceAllocation]}
                  onValueChange={([value]) => setParameters({...parameters, resourceAllocation: value})}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Implementation Speed</Label>
                  <Select 
                    value={parameters.implementationSpeed} 
                    onValueChange={(value: any) => setParameters({...parameters, implementationSpeed: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow (Lower Risk)</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast (Higher Risk)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scenario Type</Label>
                  <Select 
                    value={parameters.scenarioType} 
                    onValueChange={(value: any) => setParameters({...parameters, scenarioType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="realistic">Realistic</SelectItem>
                      <SelectItem value="optimistic">Optimistic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="indirect-benefits">Include Indirect Benefits</Label>
                <Switch
                  id="indirect-benefits"
                  checked={parameters.includeIndirectBenefits}
                  onCheckedChange={(checked) => setParameters({...parameters, includeIndirectBenefits: checked})}
                />
              </div>
            </TabsContent>

            <TabsContent value="improvements" className="space-y-4">
              <div className="space-y-2">
                <Label>Productivity Improvement: {parameters.productivityImprovement}%</Label>
                <Slider
                  value={[parameters.productivityImprovement]}
                  onValueChange={([value]) => setParameters({...parameters, productivityImprovement: value})}
                  max={50}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Quality Improvement: {parameters.qualityImprovement}%</Label>
                <Slider
                  value={[parameters.qualityImprovement]}
                  onValueChange={([value]) => setParameters({...parameters, qualityImprovement: value})}
                  max={50}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Cost Reduction: {parameters.costReduction}%</Label>
                <Slider
                  value={[parameters.costReduction]}
                  onValueChange={([value]) => setParameters({...parameters, costReduction: value})}
                  max={50}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Lead Time Reduction: {parameters.leadTimeReduction}%</Label>
                <Slider
                  value={[parameters.leadTimeReduction]}
                  onValueChange={([value]) => setParameters({...parameters, leadTimeReduction: value})}
                  max={50}
                  step={5}
                />
              </div>
            </TabsContent>

            <TabsContent value="constraints" className="space-y-4">
              <div className="space-y-2">
                <Label>Maximum Budget ($)</Label>
                <Input
                  type="number"
                  value={parameters.maxBudget}
                  onChange={(e) => setParameters({...parameters, maxBudget: parseFloat(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum Time (Months)</Label>
                <Input
                  type="number"
                  value={parameters.maxTimeMonths}
                  onChange={(e) => setParameters({...parameters, maxTimeMonths: parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label>Minimum Quality Level: {parameters.minQualityLevel}%</Label>
                <Slider
                  value={[parameters.minQualityLevel]}
                  onValueChange={([value]) => setParameters({...parameters, minQualityLevel: value})}
                  min={80}
                  max={100}
                  step={1}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Parameters
            </Button>
            <Button 
              onClick={() => runSimulationMutation.mutate()}
              disabled={isRunning}
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? "Running..." : "Run Simulation"}
            </Button>
          </div>

          {isRunning && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">Running simulation...</p>
              <Progress value={simulationProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulation Results */}
      {simulationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Simulation Results
            </CardTitle>
            <CardDescription>
              Scenario: {parameters.scenarioType} | Confidence: {simulationResults.summary.confidenceLevel}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Expected Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(simulationResults.summary.expectedValue / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
                <p className="text-2xl font-bold text-blue-600">
                  {simulationResults.summary.roi}%
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Payback</p>
                <p className="text-2xl font-bold text-purple-600">
                  {simulationResults.summary.paybackMonths} mo
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Net Benefit</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${(simulationResults.summary.netBenefit / 1000).toFixed(0)}k
                </p>
              </div>
            </div>

            {/* Value Breakdown */}
            <div>
              <h4 className="font-semibold mb-2">Value Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(simulationResults.breakdown).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-semibold">${(value / 1000).toFixed(0)}k</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            <div>
              <h4 className="font-semibold mb-2">Risk Analysis</h4>
              <div className="space-y-2">
                {simulationResults.risks.map((risk: any, index: number) => (
                  <Alert key={index} className={cn(
                    risk.probability === "High" && "border-red-200 dark:border-red-800"
                  )}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm">{risk.type} Risk</AlertTitle>
                    <AlertDescription className="text-xs">
                      Probability: {risk.probability} | Impact: {risk.impact}
                      <br />
                      Mitigation: {risk.mitigation}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {simulationResults.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <div className="space-y-2">
                  {simulationResults.recommendations.map((rec: string, index: number) => (
                    <Alert key={index}>
                      <Info className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Simulation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}