import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Factory, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Clock, Users, Wrench, DollarSign, BarChart3, Calendar,
  Target, FileText, Settings, Award, Maximize2, Minimize2, Building, MapPin
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Plant, type Job, type Operation, type Resource } from "@shared/schema";

interface PlantMetrics {
  totalProduction: number;
  efficiency: number;
  qualityScore: number;
  onTimeDelivery: number;
  resourceUtilization: number;
  costVariance: number;
  safetyIncidents: number;
  energyUsage: number;
  wasteReduction: number;
  employeeSatisfaction: number;
}

interface ProductionGoal {
  id: number;
  name: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  status: 'on-track' | 'at-risk' | 'behind';
  priority: 'high' | 'medium' | 'low';
}

interface Issue {
  id: number;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  area: string;
  reportedBy: string;
  reportedAt: string;
  status: 'open' | 'in-progress' | 'resolved';
  assignedTo?: string;
}

interface Decision {
  id: number;
  title: string;
  description: string;
  options: string[];
  impact: 'high' | 'medium' | 'low';
  urgency: 'urgent' | 'normal' | 'low';
  deadline: string;
  status: 'pending' | 'decided' | 'implemented';
}

export default function PlantManagerPage() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');
  const [selectedPlantId, setSelectedPlantId] = useState<number | 'all'>(1);
  const [newIssueDialog, setNewIssueDialog] = useState(false);
  const [newDecisionDialog, setNewDecisionDialog] = useState(false);
  const { toast } = useToast();

  // Fetch plants data
  const { data: plants = [] } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  // Fetch jobs for selected plant
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Fetch operations for analysis
  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
  });

  // Fetch resources for plant
  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  // Filter data by selected plant
  const filteredJobs = selectedPlantId === 'all' 
    ? jobs 
    : jobs.filter(job => job.plantId === selectedPlantId);

  const filteredResources = selectedPlantId === 'all'
    ? resources
    : resources.filter(resource => 
        resource.plantId === selectedPlantId || 
        (resource.isShared && resource.sharedPlants?.includes(selectedPlantId as number))
      );

  const selectedPlant = plants.find(p => p.id === selectedPlantId);
  const selectedPlantName = selectedPlant?.name || 'All Plants';

  // Calculate real metrics from filtered data
  const completedJobs = filteredJobs.filter(job => job.status === 'completed').length;
  const activeJobs = filteredJobs.filter(job => job.status === 'active').length;
  const totalJobs = filteredJobs.length;
  const activeResources = filteredResources.filter(resource => resource.status === 'active').length;
  const totalResources = filteredResources.length;
  
  const plantMetrics: PlantMetrics = {
    totalProduction: completedJobs * 100 + activeJobs * 50, // Approximate production units
    efficiency: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100 * 0.87) : 0,
    qualityScore: 94.8 - (Math.random() * 5), // Some variation
    onTimeDelivery: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100 * 0.91) : 0,
    resourceUtilization: totalResources > 0 ? Math.round((activeResources / totalResources) * 100) : 0,
    costVariance: -2.1 - (Math.random() * 2), // Random variance
    safetyIncidents: 0,
    energyUsage: 12450 + (activeResources * 150), // Scale with active resources
    wasteReduction: 15.7 + (Math.random() * 5),
    employeeSatisfaction: 88.9 + (Math.random() * 10)
  };

  const productionGoals: ProductionGoal[] = [
    {
      id: 1,
      name: "Daily Production Target",
      target: 1000,
      current: 847,
      unit: "units",
      deadline: "2025-07-19T23:59:59",
      status: 'at-risk',
      priority: 'high'
    },
    {
      id: 2,
      name: "Weekly Efficiency Goal",
      target: 90,
      current: 87.3,
      unit: "%",
      deadline: "2025-07-25T23:59:59",
      status: 'behind',
      priority: 'high'
    },
    {
      id: 3,
      name: "Quality Score Target",
      target: 95,
      current: 94.8,
      unit: "%",
      deadline: "2025-07-31T23:59:59",
      status: 'on-track',
      priority: 'medium'
    },
    {
      id: 4,
      name: "Cost Reduction Goal",
      target: 5,
      current: 3.2,
      unit: "%",
      deadline: "2025-12-31T23:59:59",
      status: 'behind',
      priority: 'medium'
    }
  ];

  const activeIssues: Issue[] = [
    {
      id: 1,
      title: "CNC Machine Vibration",
      description: "CNC-002 showing unusual vibration patterns affecting precision",
      severity: 'high',
      area: 'Production',
      reportedBy: 'John Smith',
      reportedAt: '2025-07-19T08:30:00',
      status: 'in-progress',
      assignedTo: 'Maintenance Team'
    },
    {
      id: 2,
      title: "Raw Material Shortage",
      description: "Steel inventory below minimum threshold",
      severity: 'medium',
      area: 'Supply Chain',
      reportedBy: 'Sarah Jones',
      reportedAt: '2025-07-19T10:15:00',
      status: 'open'
    },
    {
      id: 3,
      title: "Quality Control Bottleneck",
      description: "Inspection queue backing up in final assembly",
      severity: 'medium',
      area: 'Quality',
      reportedBy: 'Mike Johnson',
      reportedAt: '2025-07-19T11:45:00',
      status: 'open'
    }
  ];

  const pendingDecisions: Decision[] = [
    {
      id: 1,
      title: "Weekend Overtime Authorization",
      description: "Approve overtime shifts to meet production targets",
      options: ["Approve full overtime", "Approve limited overtime", "Deny overtime"],
      impact: 'high',
      urgency: 'urgent',
      deadline: '2025-07-19T16:00:00',
      status: 'pending'
    },
    {
      id: 2,
      title: "Equipment Upgrade Investment",
      description: "Invest $150K in new CNC machine to replace aging equipment",
      options: ["Approve full investment", "Approve phased investment", "Defer to next quarter"],
      impact: 'high',
      urgency: 'normal',
      deadline: '2025-07-25T17:00:00',
      status: 'pending'
    },
    {
      id: 3,
      title: "Supplier Contract Renewal",
      description: "Renew contract with primary steel supplier or switch to competitor",
      options: ["Renew with current terms", "Negotiate better terms", "Switch suppliers"],
      impact: 'medium',
      urgency: 'normal',
      deadline: '2025-07-30T17:00:00',
      status: 'pending'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-green-500';
      case 'at-risk': return 'bg-yellow-500';
      case 'behind': return 'bg-red-500';
      case 'open': return 'bg-red-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'pending': return 'bg-orange-500';
      case 'decided': return 'bg-blue-500';
      case 'implemented': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const handleIssueEscalation = (issueId: number) => {
    toast({
      title: "Issue Escalated",
      description: "Issue has been escalated to senior management."
    });
  };

  const handleDecisionApproval = (decisionId: number, option: string) => {
    toast({
      title: "Decision Approved",
      description: `Selected option: ${option}`
    });
  };

  const PageContent = () => (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="md:ml-0 ml-12">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <Factory className="w-6 h-6 mr-2" />
            Plant Manager Dashboard
            {selectedPlantId !== 'all' && (
              <span className="ml-2 text-lg font-normal text-gray-500">- {selectedPlantName}</span>
            )}
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {selectedPlantId === 'all' 
              ? 'Multi-plant operations oversight and strategic decision-making' 
              : `${selectedPlantName} operations oversight and strategic decision-making`
            }
          </p>
        </div>
        

        
        {/* Controls positioned below header */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
          {/* Plant Selector */}
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-500" />
            <Select value={selectedPlantId.toString()} onValueChange={(value) => setSelectedPlantId(value === 'all' ? 'all' : parseInt(value))}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    All Plants ({plants.length})
                  </div>
                </SelectItem>
                {plants.map((plant) => (
                  <SelectItem key={plant.id} value={plant.id.toString()}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {plant.name}
                      {plant.isActive && <Badge variant="secondary" className="ml-2 text-xs">Active</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Timeframe Selector */}
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Plant Summary */}
      {selectedPlantId !== 'all' && selectedPlant && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {selectedPlant.name} Overview
            </CardTitle>
            <CardDescription>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <span className="text-sm font-medium">Address:</span>
                  <p className="text-sm text-gray-600">{selectedPlant.address || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Timezone:</span>
                  <p className="text-sm text-gray-600">{selectedPlant.timezone}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Jobs:</span>
                  <p className="text-sm text-gray-600">{filteredJobs.length} active</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Resources:</span>
                  <p className="text-sm text-gray-600">{filteredResources.length} total</p>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Multi-Plant Summary */}
      {selectedPlantId === 'all' && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Multi-Plant Operations Overview
            </CardTitle>
            <CardDescription>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <span className="text-sm font-medium">Total Plants:</span>
                  <p className="text-sm text-gray-600">{plants.length} facilities</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Active Plants:</span>
                  <p className="text-sm text-gray-600">{plants.filter(p => p.isActive).length} operational</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Total Jobs:</span>
                  <p className="text-sm text-gray-600">{jobs.length} across all plants</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Total Resources:</span>
                  <p className="text-sm text-gray-600">{resources.length} system-wide</p>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plantMetrics.totalProduction}</div>
            <p className="text-xs text-muted-foreground">units today</p>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+12%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plantMetrics.efficiency}%</div>
            <p className="text-xs text-muted-foreground">overall efficiency</p>
            <div className="flex items-center mt-1">
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-xs text-red-500">-2.7%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plantMetrics.qualityScore}%</div>
            <p className="text-xs text-muted-foreground">quality score</p>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+0.8%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              On-Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plantMetrics.onTimeDelivery}%</div>
            <p className="text-xs text-muted-foreground">delivery rate</p>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+1.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cost Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plantMetrics.costVariance}%</div>
            <p className="text-xs text-muted-foreground">vs budget</p>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">Under budget</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="goals" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className={`grid w-full ${selectedPlantId === 'all' ? 'grid-cols-5' : 'grid-cols-4'} min-w-max`}>
            <TabsTrigger value="goals" className="text-xs sm:text-sm">Goals</TabsTrigger>
            <TabsTrigger value="issues" className="text-xs sm:text-sm">Issues</TabsTrigger>
            <TabsTrigger value="decisions" className="text-xs sm:text-sm">Decisions</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
            {selectedPlantId === 'all' && (
              <TabsTrigger value="comparison" className="text-xs sm:text-sm">Plant Comparison</TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4">
            {productionGoals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      <CardDescription>
                        Target: {goal.target} {goal.unit} by {new Date(goal.deadline).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={goal.priority === 'high' ? 'destructive' : 'secondary'}>
                        {goal.priority}
                      </Badge>
                      <Badge className={getStatusColor(goal.status)}>
                        {goal.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress: {goal.current} / {goal.target} {goal.unit}</span>
                      <span>{Math.round((goal.current / goal.target) * 100)}%</span>
                    </div>
                    <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Active Plant Issues</h3>
            <Dialog open={newIssueDialog} onOpenChange={setNewIssueDialog}>
              <DialogTrigger asChild>
                <Button size="sm">+ Report Issue</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report New Issue</DialogTitle>
                  <DialogDescription>
                    Report a new plant issue for tracking and resolution.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Issue Title</Label>
                    <Input id="title" placeholder="Brief description of the issue" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Detailed description of the issue" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="severity">Severity</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="area">Area</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="production">Production</SelectItem>
                          <SelectItem value="quality">Quality</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="supply-chain">Supply Chain</SelectItem>
                          <SelectItem value="safety">Safety</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setNewIssueDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      toast({
                        title: "Issue Reported",
                        description: "New issue has been logged and assigned for resolution."
                      });
                      setNewIssueDialog(false);
                    }}>
                      Report Issue
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {activeIssues.map((issue) => (
              <Card key={issue.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <CardDescription>{issue.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div>
                      <span className="font-medium">{issue.area}</span> • 
                      Reported by {issue.reportedBy} at {new Date(issue.reportedAt).toLocaleString()}
                      {issue.assignedTo && <span> • Assigned to {issue.assignedTo}</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleIssueEscalation(issue.id)}
                      >
                        Escalate
                      </Button>
                      <Button size="sm">
                        Update Status
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Decisions Requiring Approval</h3>
            <Dialog open={newDecisionDialog} onOpenChange={setNewDecisionDialog}>
              <DialogTrigger asChild>
                <Button size="sm">+ New Decision</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Decision Request</DialogTitle>
                  <DialogDescription>
                    Submit a new decision for management approval.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="decision-title">Decision Title</Label>
                    <Input id="decision-title" placeholder="Brief title for the decision" />
                  </div>
                  <div>
                    <Label htmlFor="decision-description">Description</Label>
                    <Textarea id="decision-description" placeholder="Detailed description and rationale" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="impact">Impact</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select impact" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="urgency">Urgency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setNewDecisionDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      toast({
                        title: "Decision Submitted",
                        description: "Decision request has been submitted for approval."
                      });
                      setNewDecisionDialog(false);
                    }}>
                      Submit Decision
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {pendingDecisions.map((decision) => (
              <Card key={decision.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{decision.title}</CardTitle>
                      <CardDescription>{decision.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={decision.impact === 'high' ? 'destructive' : 'secondary'}>
                        {decision.impact} impact
                      </Badge>
                      <Badge variant={decision.urgency === 'urgent' ? 'destructive' : 'secondary'}>
                        {decision.urgency}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Decision Options:</p>
                      <div className="space-y-2">
                        {decision.options.map((option, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => handleDecisionApproval(decision.id, option)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      Decision deadline: {new Date(decision.deadline).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Resource Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{plantMetrics.resourceUtilization}%</div>
                <Progress value={plantMetrics.resourceUtilization} className="mb-2" />
                <p className="text-sm text-gray-600">Equipment and workforce utilization</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Safety Record
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2 text-green-600">{plantMetrics.safetyIncidents}</div>
                <p className="text-sm text-gray-600">Incidents this month</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">15 days incident-free</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Energy Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{plantMetrics.energyUsage.toLocaleString()}</div>
                <p className="text-sm text-gray-600">kWh consumed today</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">8% reduction vs yesterday</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Waste Reduction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{plantMetrics.wasteReduction}%</div>
                <p className="text-sm text-gray-600">Waste reduction this quarter</p>
                <Progress value={plantMetrics.wasteReduction} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Satisfaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{plantMetrics.employeeSatisfaction}%</div>
                <p className="text-sm text-gray-600">Latest survey results</p>
                <Progress value={plantMetrics.employeeSatisfaction} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Maintenance Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scheduled Today</span>
                    <Badge variant="outline">3 tasks</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Overdue</span>
                    <Badge variant="destructive">1 task</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>This Week</span>
                    <Badge variant="secondary">12 tasks</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plant Comparison Tab - Only visible for "All Plants" view */}
        {selectedPlantId === 'all' && (
          <TabsContent value="comparison" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Plant Performance Comparison
                  </CardTitle>
                  <CardDescription>
                    Comparative performance metrics across all manufacturing facilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {plants.map((plant) => {
                      const plantJobs = jobs.filter(job => job.plantId === plant.id);
                      const plantResources = resources.filter(resource => 
                        resource.plantId === plant.id || 
                        (resource.isShared && resource.sharedPlants?.includes(plant.id))
                      );
                      const completedJobs = plantJobs.filter(job => job.status === 'completed').length;
                      const totalJobs = plantJobs.length;
                      const activeResources = plantResources.filter(resource => resource.status === 'active').length;
                      const efficiency = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100 * 0.87) : 0;
                      const utilization = plantResources.length > 0 ? Math.round((activeResources / plantResources.length) * 100) : 0;

                      return (
                        <div key={plant.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <h4 className="font-semibold">{plant.name}</h4>
                              {plant.isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPlantId(plant.id)}
                            >
                              View Details
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Jobs</p>
                              <div className="text-lg font-bold">{plantJobs.length}</div>
                              <p className="text-xs text-gray-500">{completedJobs} completed</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Resources</p>
                              <div className="text-lg font-bold">{plantResources.length}</div>
                              <p className="text-xs text-gray-500">{activeResources} active</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Efficiency</p>
                              <div className="text-lg font-bold">{efficiency}%</div>
                              <Progress value={efficiency} className="h-2 mt-1" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Utilization</p>
                              <div className="text-lg font-bold">{utilization}%</div>
                              <Progress value={utilization} className="h-2 mt-1" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );

  return (
    <>
      {/* Maximize button in top right corner matching hamburger menu positioning */}
      <div className="fixed top-2 right-2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMaximized(!isMaximized)}
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {isMaximized ? (
        <div className="fixed inset-0 bg-white z-50 p-6 overflow-y-auto">
          <PageContent />
        </div>
      ) : (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          <PageContent />
        </div>
      )}
    </>
  );
}