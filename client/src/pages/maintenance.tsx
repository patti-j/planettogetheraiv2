import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Wrench, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Settings, 
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Bell,
  AlertCircle,
  Info,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Camera,
  Clipboard,
  Target,
  BarChart3,
  PieChart,
  Timer,
  Gauge,
  Building2,
  Cog,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  PlayCircle,
  PauseCircle,
  StopCircle
} from "lucide-react";
import { Resource } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MaintenanceSchedule {
  id: number;
  resourceId: number;
  resourceName: string;
  resourceType: string;
  maintenanceType: "preventive" | "predictive" | "corrective" | "emergency";
  title: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "hours" | "cycles";
  frequencyValue: number;
  lastPerformed?: string;
  nextDue: string;
  estimatedDuration: number;
  assignedTechnician: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "scheduled" | "in_progress" | "completed" | "overdue" | "cancelled";
  parts: MaintenancePart[];
  procedures: string[];
  safetyNotes: string;
  cost: number;
  downtime: number;
}

interface MaintenancePart {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  inStock: boolean;
  leadTime: number;
}

interface MaintenanceWorkOrder {
  id: number;
  scheduleId?: number;
  resourceId: number;
  resourceName: string;
  type: "scheduled" | "breakdown" | "request" | "inspection";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  title: string;
  description: string;
  reportedBy: string;
  assignedTo: string;
  createdAt: string;
  scheduledDate: string;
  completedDate?: string;
  estimatedHours: number;
  actualHours?: number;
  cost: number;
  downtime: number;
  parts: MaintenancePart[];
  notes: string;
  images: string[];
}

interface ResourceHealth {
  resourceId: number;
  resourceName: string;
  overallHealth: number;
  vibration: number;
  temperature: number;
  efficiency: number;
  lastMaintenance: string;
  nextMaintenance: string;
  alerts: {
    type: "warning" | "error" | "info";
    message: string;
    timestamp: string;
  }[];
  metrics: {
    uptime: number;
    mtbf: number; // Mean Time Between Failures
    mttr: number; // Mean Time To Repair
    availability: number;
  };
}

export default function Maintenance() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<MaintenanceWorkOrder | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [workOrderDialogOpen, setWorkOrderDialogOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch resources
  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
    }, 60000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Mock maintenance data
  const mockMaintenanceSchedules: MaintenanceSchedule[] = [
    {
      id: 1,
      resourceId: 1,
      resourceName: "CNC-001",
      resourceType: "Machine",
      maintenanceType: "preventive",
      title: "Monthly Lubrication Service",
      description: "Lubricate all moving parts and check fluid levels",
      frequency: "monthly",
      frequencyValue: 1,
      lastPerformed: "2025-06-15",
      nextDue: "2025-07-15",
      estimatedDuration: 2,
      assignedTechnician: "Mike Johnson",
      priority: "medium",
      status: "scheduled",
      parts: [
        { id: "1", name: "Hydraulic Oil", partNumber: "HO-32", quantity: 5, unitCost: 25, supplier: "Industrial Supply Co", inStock: true, leadTime: 2 },
        { id: "2", name: "Grease", partNumber: "GR-200", quantity: 2, unitCost: 15, supplier: "Maintenance Pro", inStock: true, leadTime: 1 }
      ],
      procedures: [
        "Shut down machine and lock out power",
        "Clean all grease fittings",
        "Apply fresh grease to all fittings",
        "Check hydraulic fluid levels",
        "Inspect belts and replace if worn",
        "Test all safety systems"
      ],
      safetyNotes: "Ensure proper lockout/tagout procedures. Wear safety glasses and gloves.",
      cost: 180,
      downtime: 2
    },
    {
      id: 2,
      resourceId: 2,
      resourceName: "CNC-002",
      resourceType: "Machine",
      maintenanceType: "predictive",
      title: "Vibration Analysis",
      description: "Analyze machine vibration patterns to predict potential failures",
      frequency: "monthly",
      frequencyValue: 1,
      lastPerformed: "2025-06-20",
      nextDue: "2025-07-20",
      estimatedDuration: 1,
      assignedTechnician: "Sarah Chen",
      priority: "high",
      status: "overdue",
      parts: [],
      procedures: [
        "Attach vibration sensors to critical points",
        "Record baseline measurements",
        "Compare with historical data",
        "Identify trending issues",
        "Generate analysis report"
      ],
      safetyNotes: "Machine can remain operational during testing.",
      cost: 120,
      downtime: 0
    }
  ];

  const mockWorkOrders: MaintenanceWorkOrder[] = [
    {
      id: 1,
      scheduleId: 1,
      resourceId: 1,
      resourceName: "CNC-001",
      type: "scheduled",
      priority: "medium",
      status: "assigned",
      title: "Monthly Lubrication Service",
      description: "Perform scheduled lubrication maintenance",
      reportedBy: "System",
      assignedTo: "Mike Johnson",
      createdAt: "2025-07-10",
      scheduledDate: "2025-07-15",
      estimatedHours: 2,
      cost: 180,
      downtime: 2,
      parts: [
        { id: "1", name: "Hydraulic Oil", partNumber: "HO-32", quantity: 5, unitCost: 25, supplier: "Industrial Supply Co", inStock: true, leadTime: 2 }
      ],
      notes: "",
      images: []
    },
    {
      id: 2,
      resourceId: 3,
      resourceName: "Welding Station A",
      type: "breakdown",
      priority: "critical",
      status: "in_progress",
      title: "Power Supply Failure",
      description: "Welding unit not producing arc, suspected power supply issue",
      reportedBy: "John Operator",
      assignedTo: "Tom Rodriguez",
      createdAt: "2025-07-13",
      scheduledDate: "2025-07-13",
      estimatedHours: 4,
      actualHours: 2,
      cost: 450,
      downtime: 4,
      parts: [
        { id: "1", name: "Power Supply Module", partNumber: "PS-WS-001", quantity: 1, unitCost: 350, supplier: "Welding Parts Inc", inStock: false, leadTime: 3 }
      ],
      notes: "Confirmed power supply failure. Ordered replacement part. ETA 3 days.",
      images: []
    }
  ];

  const mockResourceHealth: ResourceHealth[] = [
    {
      resourceId: 1,
      resourceName: "CNC-001",
      overallHealth: 85,
      vibration: 2.3,
      temperature: 68,
      efficiency: 92,
      lastMaintenance: "2025-06-15",
      nextMaintenance: "2025-07-15",
      alerts: [
        { type: "warning", message: "Coolant level low", timestamp: "2025-07-13 10:30" },
        { type: "info", message: "Maintenance due in 2 days", timestamp: "2025-07-13 08:00" }
      ],
      metrics: {
        uptime: 94.5,
        mtbf: 168,
        mttr: 4.2,
        availability: 90.8
      }
    },
    {
      resourceId: 2,
      resourceName: "CNC-002",
      overallHealth: 72,
      vibration: 3.8,
      temperature: 75,
      efficiency: 88,
      lastMaintenance: "2025-06-20",
      nextMaintenance: "2025-07-20",
      alerts: [
        { type: "error", message: "Vibration levels elevated", timestamp: "2025-07-13 14:15" },
        { type: "warning", message: "Temperature rising", timestamp: "2025-07-13 13:45" }
      ],
      metrics: {
        uptime: 88.2,
        mtbf: 145,
        mttr: 6.1,
        availability: 85.7
      }
    }
  ];

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      case "open": return "bg-orange-100 text-orange-800";
      case "assigned": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  // Get health color
  const getHealthColor = (health: number) => {
    if (health >= 80) return "text-green-600";
    if (health >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Filter schedules
  const filteredSchedules = mockMaintenanceSchedules.filter(schedule => {
    const matchesSearch = searchTerm === "" || 
      schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.resourceName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || schedule.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || schedule.priority === priorityFilter;
    const matchesResource = resourceFilter === "all" || schedule.resourceId.toString() === resourceFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesResource;
  });

  // Filter work orders
  const filteredWorkOrders = mockWorkOrders.filter(workOrder => {
    const matchesSearch = searchTerm === "" || 
      workOrder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.resourceName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || workOrder.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || workOrder.priority === priorityFilter;
    const matchesResource = resourceFilter === "all" || workOrder.resourceId.toString() === resourceFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesResource;
  });

  // Calculate metrics
  const totalScheduled = mockMaintenanceSchedules.length;
  const overdueCount = mockMaintenanceSchedules.filter(s => s.status === "overdue").length;
  const openWorkOrders = mockWorkOrders.filter(w => w.status === "open" || w.status === "assigned").length;
  const avgHealth = mockResourceHealth.reduce((sum, r) => sum + r.overallHealth, 0) / mockResourceHealth.length;

  const PageContent = () => (
    <div className="space-y-6">
      {/* Schedule Tab */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search maintenance schedules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {resources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id.toString()}>
                    {resource.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Schedule
            </Button>
          </div>

          {/* Schedules List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredSchedules.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(schedule.priority)}`}></div>
                        <h3 className="font-semibold text-lg">{schedule.title}</h3>
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-1">{schedule.resourceName}</p>
                      <p className="text-sm text-gray-500">{schedule.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Next Due</p>
                      <p className="font-medium">{new Date(schedule.nextDue).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium capitalize">{schedule.maintenanceType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Frequency</p>
                      <p className="font-medium">{schedule.frequencyValue} {schedule.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Assigned To</p>
                      <p className="font-medium">{schedule.assignedTechnician}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Est. Duration</p>
                      <p className="font-medium">{schedule.estimatedDuration}h</p>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <div className="mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedCard(expandedCard === schedule.id ? null : schedule.id)}
                      className="p-0 h-auto text-blue-600 hover:text-blue-800"
                    >
                      {expandedCard === schedule.id ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                      {expandedCard === schedule.id ? "Hide Details" : "Show Details"}
                    </Button>
                  </div>

                  {expandedCard === schedule.id && (
                    <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      {/* Procedures */}
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Clipboard className="w-4 h-4" />
                          Procedures
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {schedule.procedures.map((procedure, index) => (
                            <li key={index}>{procedure}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Parts */}
                      {schedule.parts.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Parts Required
                          </h4>
                          <div className="space-y-2">
                            {schedule.parts.map((part) => (
                              <div key={part.id} className="flex items-center justify-between bg-white p-2 rounded">
                                <div>
                                  <span className="font-medium">{part.name}</span>
                                  <span className="text-gray-500 ml-2">({part.partNumber})</span>
                                </div>
                                <div className="text-right">
                                  <Badge variant={part.inStock ? "default" : "destructive"}>
                                    {part.inStock ? "In Stock" : "Order Required"}
                                  </Badge>
                                  <p className="text-sm text-gray-500">{part.quantity} × ${part.unitCost}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safety Notes */}
                      {schedule.safetyNotes && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Safety Notes
                          </h4>
                          <p className="text-sm bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                            {schedule.safetyNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" />
                      Create Work Order
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Edit Schedule
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Reschedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Work Orders Tab */}
      {activeTab === "workorders" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search work orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Work Order
            </Button>
          </div>

          {/* Work Orders List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredWorkOrders.map((workOrder) => (
              <Card key={workOrder.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(workOrder.priority)}`}></div>
                        <h3 className="font-semibold text-lg">{workOrder.title}</h3>
                        <Badge className={getStatusColor(workOrder.status)}>
                          {workOrder.status.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {workOrder.type}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-1">{workOrder.resourceName}</p>
                      <p className="text-sm text-gray-500">{workOrder.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Scheduled</p>
                      <p className="font-medium">{new Date(workOrder.scheduledDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Assigned To</p>
                      <p className="font-medium">{workOrder.assignedTo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Est. Hours</p>
                      <p className="font-medium">{workOrder.estimatedHours}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cost</p>
                      <p className="font-medium">${workOrder.cost}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Downtime</p>
                      <p className="font-medium">{workOrder.downtime}h</p>
                    </div>
                  </div>

                  {workOrder.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                      <p className="text-sm text-gray-600">{workOrder.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {workOrder.status === "open" && (
                      <Button size="sm" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Assign Technician
                      </Button>
                    )}
                    {workOrder.status === "assigned" && (
                      <Button size="sm" className="flex items-center gap-2">
                        <PlayCircle className="w-4 h-4" />
                        Start Work
                      </Button>
                    )}
                    {workOrder.status === "in_progress" && (
                      <Button size="sm" className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Complete Work
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Health Tab */}
      {activeTab === "health" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockResourceHealth.map((health) => (
              <Card key={health.resourceId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{health.resourceName}</h3>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Overall Health</p>
                      <p className={`text-2xl font-bold ${getHealthColor(health.overallHealth)}`}>
                        {health.overallHealth}%
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Health Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Vibration</p>
                      <p className="font-medium">{health.vibration} mm/s</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Temperature</p>
                      <p className="font-medium">{health.temperature}°F</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Efficiency</p>
                      <p className="font-medium">{health.efficiency}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Uptime</p>
                      <p className="font-medium">{health.metrics.uptime}%</p>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">MTBF</p>
                      <p className="font-medium">{health.metrics.mtbf}h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">MTTR</p>
                      <p className="font-medium">{health.metrics.mttr}h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Availability</p>
                      <p className="font-medium">{health.metrics.availability}%</p>
                    </div>
                  </div>

                  {/* Alerts */}
                  {health.alerts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Recent Alerts</p>
                      {health.alerts.map((alert, index) => (
                        <Alert key={index} className={`border-l-4 ${
                          alert.type === "error" ? "border-red-500 bg-red-50" :
                          alert.type === "warning" ? "border-yellow-500 bg-yellow-50" :
                          "border-blue-500 bg-blue-50"
                        }`}>
                          <AlertDescription className="text-sm">
                            <div className="flex items-center justify-between">
                              <span>{alert.message}</span>
                              <span className="text-xs text-gray-500">{alert.timestamp}</span>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-gray-50 ${isMaximized ? 'fixed inset-0 z-50' : 'h-screen'} flex flex-col`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 sm:px-6 flex-shrink-0">
        <div className="relative">
          <div className="ml-3 md:ml-0">
            <h1 className="text-2xl font-semibold text-gray-800">Maintenance Planning</h1>
            <p className="text-gray-600">Manage resource maintenance schedules and work orders</p>
          </div>
          
          {/* Maximize button always in top right corner */}
          <div className="absolute top-0 right-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white border-b px-4 py-3 sm:px-6 flex-shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalScheduled}</div>
            <div className="text-sm text-gray-500">Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <div className="text-sm text-gray-500">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{openWorkOrders}</div>
            <div className="text-sm text-gray-500">Open Work Orders</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getHealthColor(avgHealth)}`}>{avgHealth.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Avg Health</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="workorders">Work Orders</TabsTrigger>
            <TabsTrigger value="health">Resource Health</TabsTrigger>
          </TabsList>
          
          <TabsContent value="schedule" className="mt-6">
            <PageContent />
          </TabsContent>
          
          <TabsContent value="workorders" className="mt-6">
            <PageContent />
          </TabsContent>
          
          <TabsContent value="health" className="mt-6">
            <PageContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}