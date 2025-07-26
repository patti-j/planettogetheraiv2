import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, Target, Settings, Play, CheckCircle, AlertTriangle, 
  Info, TrendingUp, Calendar, Users, Zap, BarChart3,
  ArrowLeft, ArrowRight, Layers, Brain
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BackwardsSchedulingParams {
  bufferTime: number;
  priorityWeight: number;
  resourceUtilizationTarget: number;
  allowOvertime: boolean;
  workingHoursStart: number;
  workingHoursEnd: number;
  workingDays: number[];
}

interface ScheduleResult {
  operationId: number;
  resourceId: number;
  startTime: string;
  endTime: string;
  duration: number;
}

export default function BackwardsSchedulingAlgorithm() {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [scheduleResults, setScheduleResults] = useState<ScheduleResult[]>([]);
  const [parameters, setParameters] = useState<BackwardsSchedulingParams>({
    bufferTime: 0.5,
    priorityWeight: 1.0,
    resourceUtilizationTarget: 85,
    allowOvertime: false,
    workingHoursStart: 8,
    workingHoursEnd: 17,
    workingDays: [1, 2, 3, 4, 5]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch jobs and resources for scheduling
  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/jobs'],
    refetchOnWindowFocus: false
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources'],
    refetchOnWindowFocus: false
  });

  const { data: operations = [] } = useQuery({
    queryKey: ['/api/operations'],
    refetchOnWindowFocus: false
  });

  // Run backwards scheduling algorithm
  const runSchedulingMutation = useMutation({
    mutationFn: async (params: BackwardsSchedulingParams) => {
      const response = await apiRequest(
        'POST',
        '/api/optimization/algorithms/backwards-scheduling/run',
        {
          parameters: params,
          jobs,
          resources,
          operations
        }
      );
      return response.json();
    },
    onSuccess: (result) => {
      setScheduleResults(result.schedule || []);
      toast({
        title: "Schedule Generated",
        description: `Successfully generated schedule for ${result.schedule?.length || 0} operations`
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate schedule",
        variant: "destructive"
      });
    }
  });

  const handleRunScheduling = () => {
    setIsRunning(true);
    runSchedulingMutation.mutate(parameters);
    setTimeout(() => setIsRunning(false), 3000);
  };

  const updateParameter = (key: keyof BackwardsSchedulingParams, value: any) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeft className="w-6 h-6 text-blue-500" />
            Backwards Scheduling Algorithm
            <Badge variant="secondary">Production Scheduling</Badge>
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced backwards scheduling that starts from due dates and works backwards to optimize start times
          </p>
        </div>
        <Button 
          onClick={handleRunScheduling}
          disabled={isRunning || runSchedulingMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? (
            <>
              <Zap className="w-4 h-4 mr-2 animate-pulse" />
              Generating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Generate Schedule
            </>
          )}
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="algorithm">How it Works</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Algorithm Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Algorithm Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="font-semibold">Backwards Scheduling</p>
                  <p className="text-sm text-gray-600">Starts from due dates</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold">Optimized Timing</p>
                  <p className="text-sm text-gray-600">Minimizes delays</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="font-semibold">Resource Aware</p>
                  <p className="text-sm text-gray-600">Considers availability</p>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This algorithm is ideal for production environments where meeting due dates is critical. 
                  It ensures operations are scheduled as late as possible while still meeting deadlines, 
                  reducing work-in-progress inventory and improving cash flow.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Current Status */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Jobs to Schedule</p>
                    <p className="text-xl font-bold">{jobs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Operations</p>
                    <p className="text-xl font-bold">{operations.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Resources</p>
                    <p className="text-xl font-bold">{resources.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Scheduled Ops</p>
                    <p className="text-xl font-bold">{scheduleResults.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="algorithm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                How the Backwards Scheduling Algorithm Works
              </CardTitle>
              <CardDescription>
                Detailed explanation of the algorithm's methodology and decision-making process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Algorithm Steps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Algorithm Steps</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
                    <div>
                      <h4 className="font-semibold">Job Prioritization</h4>
                      <p className="text-sm text-gray-600">
                        Jobs are sorted by priority (critical → high → medium → low) and then by due date (earliest first). 
                        This ensures critical jobs with tight deadlines get scheduled first.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
                    <div>
                      <h4 className="font-semibold">Dependency Analysis</h4>
                      <p className="text-sm text-gray-600">
                        The algorithm builds a dependency graph to understand operation relationships. 
                        It identifies which operations must complete before others can start.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-purple-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
                    <div>
                      <h4 className="font-semibold">Backwards Time Calculation</h4>
                      <p className="text-sm text-gray-600">
                        Starting from each job's due date, the algorithm works backwards through operations. 
                        The last operation ends at the due date, then earlier operations are scheduled by subtracting duration and buffer time.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-yellow-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-semibold">4</div>
                    <div>
                      <h4 className="font-semibold">Resource Assignment</h4>
                      <p className="text-sm text-gray-600">
                        For each operation, the algorithm finds resources with matching capabilities. 
                        It considers resource availability, utilization targets, and capacity constraints.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-red-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-semibold">5</div>
                    <div>
                      <h4 className="font-semibold">Working Hours Adjustment</h4>
                      <p className="text-sm text-gray-600">
                        Unless overtime is allowed, operations are adjusted to fit within working hours. 
                        The algorithm handles multi-day operations and non-working day shifts automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Benefits */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Key Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-green-600">Reduced WIP Inventory</h4>
                    <p className="text-sm text-gray-600">
                      By starting operations as late as possible while meeting deadlines, 
                      work-in-progress inventory is minimized.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-blue-600">Improved Cash Flow</h4>
                    <p className="text-sm text-gray-600">
                      Later start times mean materials are purchased closer to need, 
                      improving cash flow and reducing carrying costs.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-purple-600">Due Date Reliability</h4>
                    <p className="text-sm text-gray-600">
                      The algorithm prioritizes meeting due dates, providing better 
                      customer service and delivery reliability.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-yellow-600">Resource Optimization</h4>
                    <p className="text-sm text-gray-600">
                      Resource assignments consider capabilities and utilization targets 
                      for balanced workload distribution.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                Algorithm Parameters
              </CardTitle>
              <CardDescription>
                Configure the algorithm's behavior and constraints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Buffer Time */}
              <div className="space-y-2">
                <Label>Buffer Time (hours): {parameters.bufferTime}</Label>
                <Slider
                  value={[parameters.bufferTime]}
                  onValueChange={([value]) => updateParameter('bufferTime', value)}
                  max={8}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-gray-600">
                  Safety buffer time added between operations to account for setup, transit, or unexpected delays
                </p>
              </div>

              {/* Priority Weight */}
              <div className="space-y-2">
                <Label>Priority Weight: {parameters.priorityWeight}</Label>
                <Slider
                  value={[parameters.priorityWeight]}
                  onValueChange={([value]) => updateParameter('priorityWeight', value)}
                  max={10}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-gray-600">
                  How much job priority influences scheduling order (higher = more priority influence)
                </p>
              </div>

              {/* Resource Utilization Target */}
              <div className="space-y-2">
                <Label>Resource Utilization Target (%): {parameters.resourceUtilizationTarget}</Label>
                <Slider
                  value={[parameters.resourceUtilizationTarget]}
                  onValueChange={([value]) => updateParameter('resourceUtilizationTarget', value)}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-gray-600">
                  Target utilization percentage for resources (affects resource selection)
                </p>
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workStart">Work Start Hour</Label>
                  <Input
                    id="workStart"
                    type="number"
                    min={0}
                    max={23}
                    value={parameters.workingHoursStart}
                    onChange={(e) => updateParameter('workingHoursStart', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEnd">Work End Hour</Label>
                  <Input
                    id="workEnd"
                    type="number"
                    min={1}
                    max={24}
                    value={parameters.workingHoursEnd}
                    onChange={(e) => updateParameter('workingHoursEnd', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Allow Overtime */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="overtime"
                  checked={parameters.allowOvertime}
                  onCheckedChange={(checked) => updateParameter('allowOvertime', checked)}
                />
                <Label htmlFor="overtime">Allow scheduling outside working hours</Label>
              </div>

              {/* Working Days */}
              <div className="space-y-2">
                <Label>Working Days</Label>
                <div className="flex gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <Button
                      key={day}
                      variant={parameters.workingDays.includes(index + 1) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const dayNum = index + 1;
                        const newDays = parameters.workingDays.includes(dayNum)
                          ? parameters.workingDays.filter(d => d !== dayNum)
                          : [...parameters.workingDays, dayNum].sort();
                        updateParameter('workingDays', newDays);
                      }}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                Generated Schedule Results
              </CardTitle>
              <CardDescription>
                View the generated schedule and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduleResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">Operation ID</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Resource ID</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Start Time</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">End Time</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Duration (hrs)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleResults.map((result, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2">{result.operationId}</td>
                            <td className="border border-gray-200 px-4 py-2">{result.resourceId}</td>
                            <td className="border border-gray-200 px-4 py-2">
                              {new Date(result.startTime).toLocaleString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {new Date(result.endTime).toLocaleString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">{result.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No schedule generated yet</p>
                  <p className="text-sm text-gray-500">Click "Generate Schedule" to run the algorithm</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}