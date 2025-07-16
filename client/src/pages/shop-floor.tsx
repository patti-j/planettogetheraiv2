import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Users, 
  Settings, 
  Wrench, 
  Building2, 
  Play, 
  Pause, 
  AlertTriangle, 
  PauseCircle, 
  PlayCircle,
  Activity,
  Zap,
  Thermometer,
  Gauge,
  WrenchIcon,
  MoveIcon,
  InfoIcon,
  RefreshCw,
  HelpCircle,
  X,
  Upload,
  Camera,
  Edit,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useDrag, useDrop } from "react-dnd";
import type { Operation, Job, Resource } from "@shared/schema";

interface ShopFloorLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  resourceId: number;
  rotation: number;
}

interface ResourceStatus {
  id: number;
  status: 'operational' | 'warning' | 'error' | 'maintenance' | 'offline';
  utilization: number;
  temperature?: number;
  pressure?: number;
  vibration?: number;
  currentOperation?: Operation;
  issues: string[];
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

interface DraggableResourceProps {
  resource: Resource;
  layout: ShopFloorLayout;
  status: ResourceStatus;
  onMove: (id: string, x: number, y: number) => void;
  onDetails: (resource: Resource, status: ResourceStatus) => void;
  photo?: string;
}

const DraggableResource = ({ resource, layout, status, onMove, onDetails, photo }: DraggableResourceProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: "resource",
    item: { id: layout.id, x: layout.x, y: layout.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Get resource icon based on type
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "machine":
        return <Wrench className="w-8 h-8" />;
      case "operator":
        return <Users className="w-8 h-8" />;
      case "facility":
        return <Building2 className="w-8 h-8" />;
      default:
        return <Settings className="w-8 h-8" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-500 border-green-600";
      case "warning":
        return "bg-yellow-500 border-yellow-600";
      case "error":
        return "bg-red-500 border-red-600";
      case "maintenance":
        return "bg-blue-500 border-blue-600";
      case "offline":
        return "bg-gray-500 border-gray-600";
      default:
        return "bg-gray-500 border-gray-600";
    }
  };

  // Get status indicator
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-4 h-4 text-white" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-white" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-white" />;
      case "maintenance":
        return <WrenchIcon className="w-4 h-4 text-white" />;
      case "offline":
        return <Pause className="w-4 h-4 text-white" />;
      default:
        return <Activity className="w-4 h-4 text-white" />;
    }
  };

  return (
    <div
      ref={drag}
      className={`absolute cursor-move select-none transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-105' : 'opacity-100 scale-100'
      }`}
      style={{
        left: layout.x,
        top: layout.y,
        width: layout.width,
        height: layout.height,
        transform: `rotate(${layout.rotation}deg)`,
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`relative w-full h-full ${getStatusColor(status.status)} rounded-lg border-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer`}
              onClick={() => onDetails(resource, status)}
            >
              {/* Resource Icon/Photo */}
              <div className="absolute inset-0 flex items-center justify-center text-white">
                {photo ? (
                  <img 
                    src={photo} 
                    alt={resource.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  getResourceIcon(resource.type)
                )}
              </div>
              
              {/* Status Indicator */}
              <div className="absolute top-1 right-1 bg-black bg-opacity-30 rounded-full p-1">
                {getStatusIndicator(status.status)}
              </div>
              
              {/* Utilization Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-black bg-opacity-30 rounded-b-lg">
                <div 
                  className="h-full bg-green-500 rounded-b-lg transition-all duration-300"
                  style={{ width: `${status.utilization}%` }}
                />
              </div>
              
              {/* Issue Count */}
              {status.issues.length > 0 && (
                <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {status.issues.length}
                </div>
              )}
              
              {/* Resource Name */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap">
                {resource.name}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{resource.name}</p>
              <p className="text-sm">Status: {status.status}</p>
              <p className="text-sm">Utilization: {status.utilization}%</p>
              {status.issues.length > 0 && (
                <p className="text-sm text-red-400">{status.issues.length} issues</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

const ResourceDetailsDialog = ({ 
  resource, 
  status, 
  isOpen, 
  onClose,
  photo,
  onPhotoUpload
}: { 
  resource: Resource | null; 
  status: ResourceStatus | null; 
  isOpen: boolean; 
  onClose: () => void; 
  photo?: string;
  onPhotoUpload: (resourceId: number, photoUrl: string) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResource, setEditedResource] = useState<Resource | null>(null);
  const { toast } = useToast();
  
  if (!resource || !status) return null;

  // Initialize edit form when entering edit mode
  const startEdit = () => {
    setEditedResource({ ...resource });
    setIsEditing(true);
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setIsEditing(false);
    setEditedResource(null);
  };

  // Save changes
  const saveChanges = async () => {
    if (!editedResource) return;
    
    try {
      // Update resource via API
      const response = await apiRequest("PUT", `/api/resources/${resource.id}`, editedResource);
      
      toast({
        title: "Resource Updated",
        description: "Resource details have been updated successfully.",
      });
      
      setIsEditing(false);
      setEditedResource(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/operations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      
      // Close the dialog
      onClose();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update resource. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onPhotoUpload(resource.id, result);
        setUploading(false);
        toast({
          title: "Photo Updated",
          description: "Resource photo has been updated successfully.",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploading(false);
      toast({
        title: "Upload Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {resource.type === "machine" && <Wrench className="w-5 h-5" />}
                {resource.type === "operator" && <Users className="w-5 h-5" />}
                {resource.type === "facility" && <Building2 className="w-5 h-5" />}
                {resource.name}
              </div>
              <Badge variant={status.status === "operational" ? "default" : "destructive"}>
                {status.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button 
                    onClick={saveChanges} 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button 
                    onClick={cancelEdit} 
                    variant="outline" 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={startEdit} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Photo Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Resource Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {photo && (
                  <div className="flex justify-center">
                    <img 
                      src={photo} 
                      alt={resource.name}
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="photo-upload">Upload Resource Photo</Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Uploading photo...
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form Section */}
          {isEditing && editedResource && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Edit Resource Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Resource Name</Label>
                    <Input
                      id="edit-name"
                      value={editedResource.name}
                      onChange={(e) => setEditedResource({...editedResource, name: e.target.value})}
                      placeholder="Enter resource name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Resource Type</Label>
                    <Select 
                      value={editedResource.type} 
                      onValueChange={(value) => setEditedResource({...editedResource, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Machine">Machine</SelectItem>
                        <SelectItem value="Operator">Operator</SelectItem>
                        <SelectItem value="Facility">Facility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select 
                      value={editedResource.status} 
                      onValueChange={(value) => setEditedResource({...editedResource, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-capacity">Capacity</Label>
                    <Input
                      id="edit-capacity"
                      type="number"
                      value={editedResource.capacity}
                      onChange={(e) => setEditedResource({...editedResource, capacity: parseInt(e.target.value)})}
                      placeholder="Enter capacity"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editedResource.description || ''}
                      onChange={(e) => setEditedResource({...editedResource, description: e.target.value})}
                      placeholder="Enter resource description"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Utilization</p>
                    <p className="text-2xl font-bold">{status.utilization}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {status.temperature && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Temperature</p>
                      <p className="text-2xl font-bold">{status.temperature}°C</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {status.pressure && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Pressure</p>
                      <p className="text-2xl font-bold">{status.pressure} PSI</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {status.vibration && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Vibration</p>
                      <p className="text-2xl font-bold">{status.vibration} Hz</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Current Operation */}
          {status.currentOperation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Operation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{status.currentOperation.name}</p>
                  <p className="text-sm text-gray-600">{status.currentOperation.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Duration: {status.currentOperation.duration}h</span>
                    <span>Status: {status.currentOperation.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Issues */}
          {status.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Issues ({status.issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {status.issues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                      <span className="text-sm">{issue}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {status.lastMaintenance && (
                  <p className="text-sm">
                    Last Maintenance: {status.lastMaintenance.toLocaleDateString()}
                  </p>
                )}
                {status.nextMaintenance && (
                  <p className="text-sm">
                    Next Maintenance: {status.nextMaintenance.toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resource Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resource Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm"><strong>Type:</strong> {resource.type}</p>
                <p className="text-sm"><strong>Capabilities:</strong> {resource.capabilities}</p>
                <p className="text-sm"><strong>Status:</strong> {resource.status}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function ShopFloor() {
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ResourceStatus | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [shopFloorLayout, setShopFloorLayout] = useState<ShopFloorLayout[]>([]);
  const [showHelp, setShowHelp] = useState(true);
  const [resourcePhotos, setResourcePhotos] = useState<{ [key: number]: string }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch data
  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
    refetchInterval: isLivePaused ? false : 30000,
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
    refetchInterval: isLivePaused ? false : 30000,
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: isLivePaused ? false : 30000,
  });

  // Generate mock resource status data (in real app, this would come from sensors/API)
  const generateResourceStatus = (resource: Resource): ResourceStatus => {
    const currentOp = operations.find(op => op.resourceId === resource.id && op.status === "In-Progress");
    const issues = [];
    
    // Generate mock issues based on resource type and status
    if (resource.type === "machine") {
      if (Math.random() > 0.7) issues.push("High vibration detected");
      if (Math.random() > 0.8) issues.push("Temperature above normal range");
      if (Math.random() > 0.9) issues.push("Low coolant level");
    }
    
    const baseStatus: ResourceStatus = {
      id: resource.id,
      status: issues.length > 0 ? "warning" : (currentOp ? "operational" : "offline"),
      utilization: currentOp ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 20),
      currentOperation: currentOp,
      issues,
      lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    };

    // Add sensor data for machines
    if (resource.type === "machine") {
      baseStatus.temperature = Math.floor(Math.random() * 50) + 70;
      baseStatus.pressure = Math.floor(Math.random() * 100) + 150;
      baseStatus.vibration = Math.floor(Math.random() * 20) + 10;
    }

    return baseStatus;
  };

  // Initialize shop floor layout
  useEffect(() => {
    if (resources.length > 0 && shopFloorLayout.length === 0) {
      const newLayout = resources.map((resource, index) => ({
        id: `resource-${resource.id}`,
        x: 100 + (index % 4) * 150,
        y: 100 + Math.floor(index / 4) * 150,
        width: 100,
        height: 100,
        resourceId: resource.id,
        rotation: 0,
      }));
      setShopFloorLayout(newLayout);
    }
  }, [resources, shopFloorLayout.length]);

  // Handle resource movement
  const handleResourceMove = (id: string, x: number, y: number) => {
    setShopFloorLayout(prev => 
      prev.map(layout => 
        layout.id === id ? { ...layout, x, y } : layout
      )
    );
  };

  // Drop zone for the shop floor container
  const [, drop] = useDrop({
    accept: "resource",
    drop: (item: { id: string; x: number; y: number }, monitor) => {
      const offset = monitor.getDifferenceFromInitialOffset();
      if (offset) {
        const newX = item.x + offset.x;
        const newY = item.y + offset.y;
        handleResourceMove(item.id, Math.max(0, newX), Math.max(0, newY));
      }
    },
  });

  // Handle resource details
  const handleResourceDetails = (resource: Resource, status: ResourceStatus) => {
    setSelectedResource(resource);
    setSelectedStatus(status);
    setDetailsOpen(true);
  };

  // Handle photo upload
  const handlePhotoUpload = (resourceId: number, photoUrl: string) => {
    setResourcePhotos(prev => ({
      ...prev,
      [resourceId]: photoUrl
    }));
    
    // Save to localStorage for persistence
    const savedPhotos = JSON.parse(localStorage.getItem('resourcePhotos') || '{}');
    savedPhotos[resourceId] = photoUrl;
    localStorage.setItem('resourcePhotos', JSON.stringify(savedPhotos));
  };

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: ShopFloorLayout[]) => {
      // In real app, save to database
      localStorage.setItem('shopFloorLayout', JSON.stringify(layout));
      return layout;
    },
    onSuccess: () => {
      toast({
        title: "Layout Saved",
        description: "Shop floor layout has been saved successfully.",
      });
    },
  });

  // Load layout and photos from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('shopFloorLayout');
    if (savedLayout) {
      try {
        setShopFloorLayout(JSON.parse(savedLayout));
      } catch (error) {
        console.error('Failed to load shop floor layout:', error);
      }
    }
    
    const savedPhotos = localStorage.getItem('resourcePhotos');
    if (savedPhotos) {
      try {
        setResourcePhotos(JSON.parse(savedPhotos));
      } catch (error) {
        console.error('Failed to load resource photos:', error);
      }
    }
  }, []);

  // Auto-save layout changes
  useEffect(() => {
    if (shopFloorLayout.length > 0) {
      const timeoutId = setTimeout(() => {
        saveLayoutMutation.mutate(shopFloorLayout);
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [shopFloorLayout, saveLayoutMutation]);

  if (resourcesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop floor...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-4 py-3 sm:px-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="ml-12 md:ml-0">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Shop Floor</h1>
              <p className="text-sm md:text-base text-gray-600">Production oversight and equipment monitoring</p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Help toggle button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHelp(!showHelp)}
                    className="flex items-center gap-2 hover:bg-gray-100 text-sm"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span className="text-sm">Help</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle help instructions</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Live button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLivePaused(!isLivePaused)}
                    className="flex items-center gap-2 hover:bg-gray-100 text-sm"
                  >
                    {isLivePaused ? (
                      <>
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600 font-medium">Paused</span>
                        <PlayCircle className="w-4 h-4 text-gray-600" />
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600 font-medium">Live</span>
                        <PauseCircle className="w-4 h-4 text-green-600" />
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle live data updates</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Shop Floor View */}
        <div className="flex-1 overflow-hidden relative">
          <div 
            ref={drop}
            id="shop-floor-container"
            className="absolute inset-0 bg-gray-100 overflow-auto"
            style={{
              backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {/* Instructions */}
            {showHelp && (
              <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-md z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">Shop Floor Controls</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHelp(false)}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Drag equipment icons to rearrange the shop floor</li>
                  <li>• Click any equipment to view detailed status and issues</li>
                  <li>• Color indicates status: Green (operational), Yellow (warning), Red (error)</li>
                  <li>• White bar shows current utilization percentage</li>
                  <li>• Red badge shows number of active issues</li>
                </ul>
              </div>
            )}

            {/* Status Legend */}
            <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-10">
              <h3 className="font-semibold text-gray-800 mb-2">Status Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">Operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm">Warning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm">Error</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm">Maintenance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  <span className="text-sm">Offline</span>
                </div>
              </div>
            </div>

            {/* Resources */}
            {shopFloorLayout.map((layout) => {
              const resource = resources.find(r => r.id === layout.resourceId);
              if (!resource) return null;
              
              const status = generateResourceStatus(resource);
              
              return (
                <DraggableResource
                  key={layout.id}
                  resource={resource}
                  layout={layout}
                  status={status}
                  onMove={handleResourceMove}
                  onDetails={handleResourceDetails}
                  photo={resourcePhotos[resource.id]}
                />
              );
            })}
          </div>
        </div>

        {/* Resource Details Dialog */}
        <ResourceDetailsDialog
          resource={selectedResource}
          status={selectedStatus}
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          photo={selectedResource ? resourcePhotos[selectedResource.id] : undefined}
          onPhotoUpload={handlePhotoUpload}
        />
      </div>
    </TooltipProvider>
  );
}