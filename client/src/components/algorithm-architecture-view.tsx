import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  ArrowRight, 
  ArrowDown, 
  Zap, 
  Database, 
  Cpu, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  Circle,
  GitBranch,
  Settings,
  Timer,
  TrendingUp,
  Target,
  Activity
} from 'lucide-react';

interface AlgorithmArchitectureViewProps {
  algorithmName: string;
  onClose?: () => void;
}

export default function AlgorithmArchitectureView({ algorithmName, onClose }: AlgorithmArchitectureViewProps) {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  // Backwards Scheduling Algorithm Architecture
  const algorithmSteps = [
    {
      id: 1,
      title: "Data Collection & Validation",
      description: "Gather all jobs, operations, resources, and constraints from the database",
      status: "completed",
      estimatedTime: { simple: "50-100ms", complex: "200-500ms" },
      complexity: "O(n) where n = total operations",
      details: [
        "Fetch active jobs with due dates",
        "Load operation sequences and dependencies", 
        "Retrieve resource capabilities and availability",
        "Validate data integrity and constraints"
      ],
      inputs: ["Jobs", "Operations", "Resources", "Capabilities"],
      outputs: ["Validated Dataset"],
      performance: {
        simple: "< 10 jobs, < 50 operations",
        medium: "10-100 jobs, 50-500 operations", 
        complex: "> 100 jobs, > 500 operations"
      }
    },
    {
      id: 2,
      title: "Job Prioritization & Sorting",
      description: "Sort jobs by due date and priority to determine scheduling order",
      status: "completed",
      estimatedTime: { simple: "10-20ms", complex: "50-150ms" },
      complexity: "O(n log n) where n = number of jobs",
      details: [
        "Calculate urgency scores based on due dates",
        "Apply priority weights from job configuration",
        "Handle rush orders and special constraints",
        "Create processing queue with sorted jobs"
      ],
      inputs: ["Validated Dataset"],
      outputs: ["Prioritized Job Queue"],
      performance: {
        simple: "< 10 jobs: 10-20ms",
        medium: "10-100 jobs: 20-50ms",
        complex: "> 100 jobs: 50-150ms"
      }
    },
    {
      id: 3,
      title: "Backwards Time Calculation",
      description: "Calculate latest start times working backwards from due dates",
      status: "completed", 
      estimatedTime: { simple: "100-200ms", complex: "500ms-2s" },
      complexity: "O(m × d) where m = operations, d = dependencies",
      details: [
        "Start from job due dates as anchor points",
        "Work backwards through operation sequences",
        "Calculate latest start times for each operation",
        "Account for operation durations and dependencies",
        "Apply buffer times for uncertainty"
      ],
      inputs: ["Prioritized Job Queue"],
      outputs: ["Latest Start Times"],
      performance: {
        simple: "< 50 operations: 100-200ms",
        medium: "50-200 operations: 200-500ms", 
        complex: "> 200 operations: 500ms-2s"
      }
    },
    {
      id: 4,
      title: "Resource Capability Matching",
      description: "Match operations with compatible resources based on required capabilities",
      status: "in-progress",
      estimatedTime: { simple: "50-100ms", complex: "300-800ms" },
      complexity: "O(o × r × c) where o = operations, r = resources, c = capabilities",
      details: [
        "Check operation capability requirements",
        "Find resources with matching capabilities",
        "Score resource compatibility and efficiency",
        "Create resource assignment options matrix"
      ],
      inputs: ["Latest Start Times", "Resource Capabilities"],
      outputs: ["Resource Assignment Matrix"],
      performance: {
        simple: "< 20 resources: 50-100ms",
        medium: "20-50 resources: 100-300ms",
        complex: "> 50 resources: 300-800ms"
      }
    },
    {
      id: 5,
      title: "Conflict Detection & Resolution",
      description: "Identify scheduling conflicts and resolve them through optimization",
      status: "in-progress",
      estimatedTime: { simple: "200-500ms", complex: "1-5s" },
      complexity: "O(o²) for conflict detection + optimization iterations",
      details: [
        "Detect resource double-booking conflicts",
        "Identify dependency violations",
        "Apply conflict resolution strategies",
        "Iteratively optimize schedule quality"
      ],
      inputs: ["Resource Assignment Matrix"],
      outputs: ["Conflict-Free Schedule"],
      performance: {
        simple: "< 50 conflicts: 200-500ms",
        medium: "50-200 conflicts: 500ms-2s",
        complex: "> 200 conflicts: 1-5s"
      }
    },
    {
      id: 6,
      title: "Schedule Optimization",
      description: "Fine-tune the schedule to minimize makespan and maximize efficiency",
      status: "pending",
      estimatedTime: { simple: "300ms-1s", complex: "2-10s" },
      complexity: "O(iterations × operations) for optimization loops",
      details: [
        "Minimize total completion time (makespan)",
        "Maximize resource utilization rates",
        "Reduce setup times and changeovers",
        "Apply advanced optimization heuristics"
      ],
      inputs: ["Conflict-Free Schedule"],
      outputs: ["Optimized Schedule"],
      performance: {
        simple: "< 3 iterations: 300ms-1s",
        medium: "3-10 iterations: 1-3s",
        complex: "> 10 iterations: 2-10s"
      }
    },
    {
      id: 7,
      title: "Validation & Output Generation",
      description: "Validate final schedule and generate results with metrics",
      status: "pending",
      estimatedTime: { simple: "50-100ms", complex: "200-400ms" },
      complexity: "O(n) for final validation pass",
      details: [
        "Validate schedule feasibility and constraints",
        "Calculate performance metrics and KPIs",
        "Generate scheduling reports and summaries",
        "Prepare data for database persistence"
      ],
      inputs: ["Optimized Schedule"],
      outputs: ["Final Schedule", "Performance Metrics", "Reports"],
      performance: {
        simple: "< 100 operations: 50-100ms",
        medium: "100-300 operations: 100-200ms",
        complex: "> 300 operations: 200-400ms"
      }
    }
  ];

  const totalPerformance = {
    simple: "760ms - 1.97s",
    medium: "1.38s - 4.05s", 
    complex: "4.25s - 18.65s"
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress': return <Circle className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'pending': return <Circle className="w-4 h-4 text-gray-400" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'in-progress': return 'bg-blue-50 border-blue-200';
      case 'pending': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Algorithm Architecture</h1>
          <p className="text-muted-foreground">
            Detailed internal architecture for <span className="font-medium">{algorithmName}</span>
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Back to Algorithm List
          </Button>
        )}
      </div>

      <Tabs defaultValue="architecture" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="architecture">Step-by-Step Architecture</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          <TabsTrigger value="complexity">Complexity Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="architecture" className="space-y-6">
          {/* Algorithm Flow Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Backwards Scheduling Algorithm Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {algorithmSteps.map((step, index) => (
                  <div key={step.id}>
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        getStatusColor(step.status)
                      } ${selectedStep === step.id ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(step.status)}
                          <Badge variant="outline" className="text-xs">
                            Step {step.id}
                          </Badge>
                          <h3 className="font-semibold">{step.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Timer className="w-4 h-4" />
                          {step.estimatedTime.simple} - {step.estimatedTime.complex}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          {step.complexity}
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          Inputs: {step.inputs.join(', ')}
                        </span>
                      </div>

                      {/* Expanded Details */}
                      {selectedStep === step.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2">Detailed Process:</h4>
                            <ul className="space-y-1">
                              {step.details.map((detail, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <Circle className="w-2 h-2 mt-2 flex-shrink-0" />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Performance by Complexity:</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-green-600">Simple:</span>
                                  <span>{step.performance.simple}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-orange-600">Medium:</span>
                                  <span>{step.performance.medium}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-red-600">Complex:</span>
                                  <span>{step.performance.complex}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm mb-2">Outputs Generated:</h4>
                              <div className="space-y-1">
                                {step.outputs.map((output, idx) => (
                                  <div key={idx} className="text-sm bg-blue-50 px-2 py-1 rounded text-blue-700">
                                    {output}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {index < algorithmSteps.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ArrowDown className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Simple Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Zap className="h-5 w-5" />
                  Simple Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-green-600">{totalPerformance.simple}</div>
                <div className="text-sm text-muted-foreground">Total execution time</div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div><strong>Jobs:</strong> {'<'} 10</div>
                  <div><strong>Operations:</strong> {'<'} 50</div>
                  <div><strong>Resources:</strong> {'<'} 20</div>
                  <div><strong>Conflicts:</strong> {'<'} 50</div>
                </div>
                <Badge variant="outline" className="w-full justify-center bg-green-50 text-green-700">
                  Optimal Performance
                </Badge>
              </CardContent>
            </Card>

            {/* Medium Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Activity className="h-5 w-5" />
                  Medium Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-orange-600">{totalPerformance.medium}</div>
                <div className="text-sm text-muted-foreground">Total execution time</div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div><strong>Jobs:</strong> 10-100</div>
                  <div><strong>Operations:</strong> 50-500</div>
                  <div><strong>Resources:</strong> 20-50</div>
                  <div><strong>Conflicts:</strong> 50-200</div>
                </div>
                <Badge variant="outline" className="w-full justify-center bg-orange-50 text-orange-700">
                  Good Performance
                </Badge>
              </CardContent>
            </Card>

            {/* Complex Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Complex Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-red-600">{totalPerformance.complex}</div>
                <div className="text-sm text-muted-foreground">Total execution time</div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div><strong>Jobs:</strong> {'>'} 100</div>
                  <div><strong>Operations:</strong> {'>'} 500</div>
                  <div><strong>Resources:</strong> {'>'} 50</div>
                  <div><strong>Conflicts:</strong> {'>'} 200</div>
                </div>
                <Badge variant="outline" className="w-full justify-center bg-red-50 text-red-700">
                  Intensive Processing
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Performance Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Step Performance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {algorithmSteps.map((step) => (
                  <div key={step.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{step.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {step.estimatedTime.simple} - {step.estimatedTime.complex}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(step.id / algorithmSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complexity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Computational Complexity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Computational Complexity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {algorithmSteps.map((step) => (
                  <div key={step.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">Step {step.id}</div>
                      <div className="text-xs text-muted-foreground">{step.title}</div>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {step.complexity}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Scalability Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Scalability Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <div className="font-medium text-green-800">Linear Scale (O(n))</div>
                    <div className="text-sm text-green-600">Steps 1, 7 - Scale linearly with input size</div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="font-medium text-yellow-800">Log-Linear Scale (O(n log n))</div>
                    <div className="text-sm text-yellow-600">Step 2 - Sorting operations</div>
                  </div>
                  
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <div className="font-medium text-orange-800">Polynomial Scale (O(n²))</div>
                    <div className="text-sm text-orange-600">Step 5 - Conflict detection</div>
                  </div>
                  
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="font-medium text-red-800">Multi-dimensional (O(n×m×k))</div>
                    <div className="text-sm text-red-600">Steps 3, 4, 6 - Resource matching & optimization</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">For Large Datasets ({'>'} 500 operations):</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Implement parallel processing for resource matching
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Use incremental conflict detection algorithms
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Apply heuristic optimization with time limits
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Memory Optimization:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Stream processing for large operation sets
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Cache frequently accessed resource data
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Implement efficient data structures for conflict tracking
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}