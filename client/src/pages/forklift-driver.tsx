import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMaxDock } from '@/contexts/MaxDockContext';
import { 
  Truck, 
  Package, 
  ArrowRight, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Navigation
} from "lucide-react";

interface MaterialMovement {
  id: string;
  jobId: number;
  jobName: string;
  operationId: number;
  operationName: string;
  materialType: string;
  quantity: number;
  unit: string;
  fromLocation: string;
  toLocation: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed" | "blocked";
  estimatedTime: number; // minutes
  distance: number; // meters
  completedAt?: string;
  nextOperation?: string;
  specialInstructions?: string;
  isCompleted: boolean;
  customer: string;
  dueDate: string;
}

export default function ForkliftDriver() {
  const { isMaxOpen } = useMaxDock();
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();
  const isMobile = useMobile();

  // Fetch operations and jobs to determine material movements
  const { data: operations = [] } = useQuery({
    queryKey: ["/api/operations"],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["/api/resources"],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: dependencies = [] } = useQuery({
    queryKey: ["/api/dependencies"],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Generate material movements based on completed operations
  const generateMovements = (): MaterialMovement[] => {
    const movements: MaterialMovement[] = [];
    
    operations.forEach(operation => {
      const job = jobs.find(j => j.id === operation.jobId);
      const resource = resources.find(r => r.id === operation.assignedResourceId);
      
      if (!job || !resource) return;

      // Find next operation in sequence
      const nextDependency = dependencies.find(d => d.dependsOnOperationId === operation.id);
      const nextOperation = nextDependency ? operations.find(o => o.id === nextDependency.operationId) : null;
      const nextResource = nextOperation ? resources.find(r => r.id === nextOperation.assignedResourceId) : null;

      // Create movement if operation is completed and needs to move
      if (operation.status === "completed" || operation.status === "active") {
        // Generate multiple movements per operation for testing
        const movementCount = Math.floor(Math.random() * 3) + 1; // 1-3 movements per operation
        
        for (let i = 0; i < movementCount; i++) {
          const movementId = `${operation.id}-${Date.now()}-${i}`;
          
          // Determine destination
          let toLocation = "Storage";
          let nextOperationName = "Complete - Send to Storage";
          
          if (nextOperation && nextResource) {
            toLocation = nextResource.name;
            nextOperationName = nextOperation.name;
          } else if (!nextOperation) {
            // Check if this is the last operation
            const isLastOperation = !dependencies.some(d => d.dependsOnOperationId === operation.id);
            if (isLastOperation) {
              toLocation = "Shipping";
              nextOperationName = "Complete - Send to Shipping";
            }
          }

          // Generate realistic material data
          const materialTypes = ["Sheet Metal", "Machined Parts", "Welded Assembly", "Painted Components", "Packaged Goods"];
          const materialType = materialTypes[Math.floor(Math.random() * materialTypes.length)];
          
          // Vary the status for testing
          const statuses = ["pending", "in-progress", "completed", "blocked"];
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          
          const movement: MaterialMovement = {
            id: movementId,
            jobId: job.id,
            jobName: job.name,
            operationId: operation.id,
            operationName: operation.name,
            materialType,
            quantity: Math.floor(Math.random() * 50) + 1,
            unit: "pcs",
            fromLocation: resource.name,
            toLocation,
            priority: job.priority as "high" | "medium" | "low",
            status: randomStatus as "pending" | "in-progress" | "completed" | "blocked",
            estimatedTime: Math.floor(Math.random() * 15) + 5,
            distance: Math.floor(Math.random() * 200) + 50,
            nextOperation: nextOperationName,
            specialInstructions: toLocation === "Shipping" ? "Handle with care - final product" : undefined,
            isCompleted: operation.status === "completed",
            customer: job.customer,
            dueDate: job.dueDate,
          };

          movements.push(movement);
        }
      }
    });

    return movements;
  };

  const materialMovements = generateMovements();

  // Filter movements
  const filteredMovements = materialMovements.filter(movement => {
    const matchesPriority = selectedPriority === "all" || movement.priority === selectedPriority;
    const matchesStatus = selectedStatus === "all" || movement.status === selectedStatus;
    const matchesSearch = searchTerm === "" || 
      movement.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.operationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.materialType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.toLocation.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesPriority && matchesStatus && matchesSearch;
  });

  // Update movement status mutation
  const updateMovementMutation = useMutation({
    mutationFn: async ({ movementId, status }: { movementId: string; status: string }) => {
      // This would update the movement status in a real system
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      toast({
        title: "Movement Updated",
        description: "Material movement status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update movement status",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (movementId: string, newStatus: string) => {
    updateMovementMutation.mutate({ movementId, status: newStatus });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-blue-100 text-blue-800";
      case "in-progress": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      case "blocked": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "in-progress": return <Truck className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "blocked": return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const MovementCard = ({ movement }: { movement: MaterialMovement }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              {movement.jobName}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{movement.operationName}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getPriorityColor(movement.priority)}>
              {movement.priority.toUpperCase()}
            </Badge>
            <Badge className={getStatusColor(movement.status)}>
              {getStatusIcon(movement.status)}
              <span className="ml-1">{movement.status}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Material Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Material</Label>
              <p className="text-sm">{movement.materialType}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Quantity</Label>
              <p className="text-sm">{movement.quantity} {movement.unit}</p>
            </div>
          </div>

          {/* Movement Path */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="font-medium">{movement.fromLocation}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-medium">{movement.toLocation}</span>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>Next: {movement.nextOperation}</p>
              <p>Est. Time: {movement.estimatedTime} min • Distance: {movement.distance}m</p>
            </div>
          </div>

          {/* Special Instructions */}
          {movement.specialInstructions && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Special Instructions</p>
                  <p className="text-sm text-yellow-700">{movement.specialInstructions}</p>
                </div>
              </div>
            </div>
          )}

          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <Label className="text-sm font-medium text-gray-700">Customer</Label>
              <p className="text-sm">{movement.customer}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Due Date</Label>
              <p className="text-sm">{new Date(movement.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {movement.status === "pending" && (
              <Button 
                onClick={() => handleStatusUpdate(movement.id, "in-progress")}
                className="flex-1"
              >
                <Truck className="w-4 h-4 mr-2" />
                Start Movement
              </Button>
            )}
            {movement.status === "in-progress" && (
              <Button 
                onClick={() => handleStatusUpdate(movement.id, "completed")}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
            {movement.status === "blocked" && (
              <Button 
                onClick={() => handleStatusUpdate(movement.id, "pending")}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PageContent = () => (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="relative">
        <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <Truck className="w-6 h-6 mr-2" />
            Forklift Operations
          </h1>
          <p className="text-sm md:text-base text-gray-600">Material movement tracking for production floor</p>
        </div>
        

        
        {/* Live indicator positioned below maximize button */}
        <div className="absolute top-0 right-0 mt-12">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-50 border-green-200" : ""}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${autoRefresh ? "bg-green-500" : "bg-gray-400"}`} />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search jobs, materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Priority</Label>
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger>
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredMovements.filter(m => m.status === "pending").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredMovements.filter(m => m.status === "in-progress").length}
                </p>
              </div>
              <Truck className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredMovements.filter(m => m.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredMovements.filter(m => m.priority === "high").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movement List */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800">Material Movements</h2>
        {filteredMovements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No material movements found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMovements.map((movement) => (
              <MovementCard key={movement.id} movement={movement} />
            ))}
          </div>
        )}
      </div>
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
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 max-h-screen">
            <PageContent />
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6">
              <PageContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}