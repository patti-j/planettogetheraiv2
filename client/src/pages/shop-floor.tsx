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
import { Checkbox } from "@/components/ui/checkbox";
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
  Save,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Plus,
  Minus
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

interface DraggableAreaBubbleProps {
  areaKey: string;
  area: {name: string, resources: number[]};
  resources: Resource[];
  onMove: (areaKey: string, x: number, y: number) => void;
  onResourceDetails: (resource: Resource, status: ResourceStatus) => void;
  resourcePhotos: { [key: number]: string };
  generateResourceStatus: (resource: Resource) => ResourceStatus;
  isNoArea?: boolean;
}

interface AreaLayout {
  areaKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
        return <Wrench className="w-6 h-6 sm:w-8 sm:h-8" />;
      case "operator":
        return <Users className="w-6 h-6 sm:w-8 sm:h-8" />;
      case "facility":
        return <Building2 className="w-6 h-6 sm:w-8 sm:h-8" />;
      default:
        return <Settings className="w-6 h-6 sm:w-8 sm:h-8" />;
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
              className={`relative w-full h-full ${getStatusColor(status.status)} rounded-lg border-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer touch-manipulation`}
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

const DraggableResourceCard = ({ 
  resource, 
  status, 
  photo, 
  onResourceDetails, 
  currentArea 
}: { 
  resource: Resource; 
  status: ResourceStatus; 
  photo?: string; 
  onResourceDetails: (resource: Resource, status: ResourceStatus) => void; 
  currentArea?: { name: string; id?: number }; 
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: "resource-card",
    item: { resourceId: resource.id, currentArea: currentArea?.name || "No Area" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "machine":
        return <Wrench className="w-4 h-4" />;
      case "operator":
        return <Users className="w-4 h-4" />;
      case "facility":
        return <Building2 className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 border-green-300";
      case "warning":
        return "bg-yellow-100 border-yellow-300";
      case "error":
        return "bg-red-100 border-red-300";
      case "maintenance":
        return "bg-blue-100 border-blue-300";
      case "offline":
        return "bg-gray-100 border-gray-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  return (
    <div
      ref={drag}
      className={`relative ${getStatusColor(status.status)} rounded-lg border-2 p-3 cursor-pointer hover:shadow-md transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      }`}
      onClick={() => onResourceDetails(resource, status)}
    >
      {/* Resource Icon/Photo */}
      <div className="flex items-center justify-center mb-2">
        {photo ? (
          <img 
            src={photo} 
            alt={resource.name}
            className="w-8 h-8 object-cover rounded"
          />
        ) : (
          getResourceIcon(resource.type)
        )}
      </div>
      
      {/* Resource Name */}
      <div className="text-xs font-medium text-center truncate">
        {resource.name}
      </div>
      
      {/* Status Indicator */}
      <div className="absolute top-1 right-1 w-2 h-2 rounded-full" 
           style={{ backgroundColor: status.status === 'operational' ? '#10b981' : 
                                    status.status === 'warning' ? '#f59e0b' : 
                                    status.status === 'error' ? '#ef4444' : 
                                    status.status === 'maintenance' ? '#3b82f6' : '#6b7280' }}
      />
      
      {/* Issue Count */}
      {status.issues.length > 0 && (
        <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {status.issues.length}
        </div>
      )}
    </div>
  );
};

const DraggableAreaBubble = ({ 
  areaKey, 
  area, 
  resources, 
  onMove, 
  onResourceDetails, 
  resourcePhotos, 
  generateResourceStatus, 
  isNoArea = false,
  onResourceMove 
}: DraggableAreaBubbleProps & { onResourceMove: (resourceId: number, newArea: string) => void }) => {
  const [areaLayout, setAreaLayout] = useState<AreaLayout>(() => {
    const savedLayout = localStorage.getItem(`area-layout-${areaKey}`);
    if (savedLayout) {
      return JSON.parse(savedLayout);
    }
    
    // Smart initial positioning to prevent overlaps
    const existingAreas = Object.keys(localStorage)
      .filter(key => key.startsWith('area-layout-'))
      .map(key => JSON.parse(localStorage.getItem(key)!));
    
    const areaWidth = Math.max(300, resources.length * 80 + 100);
    const areaHeight = Math.max(200, Math.ceil(resources.length / 4) * 80 + 100);
    
    // Find a non-overlapping position
    let x = 50;
    let y = 50;
    let placed = false;
    
    for (let row = 0; row < 10 && !placed; row++) {
      for (let col = 0; col < 4 && !placed; col++) {
        const testX = 50 + col * 370;
        const testY = 50 + row * 320;
        
        // Check if this position overlaps with any existing area
        const overlaps = existingAreas.some(area => {
          return !(testX + areaWidth < area.x || 
                   testX > area.x + area.width ||
                   testY + areaHeight < area.y || 
                   testY > area.y + area.height);
        });
        
        if (!overlaps) {
          x = testX;
          y = testY;
          placed = true;
        }
      }
    }
    
    return {
      areaKey,
      x,
      y,
      width: areaWidth,
      height: areaHeight
    };
  });

  const [{ isDragging }, drag] = useDrag({
    type: "area",
    item: { areaKey, x: areaLayout.x, y: areaLayout.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      // Always calculate new position based on the final offset
      const offset = monitor.getDifferenceFromInitialOffset();
      if (offset) {
        const newX = Math.max(0, item.x + offset.x);
        const newY = Math.max(0, item.y + offset.y);
        const newLayout = { ...areaLayout, x: newX, y: newY };
        setAreaLayout(newLayout);
        // Immediately save to localStorage
        localStorage.setItem(`area-layout-${areaKey}`, JSON.stringify(newLayout));
      }
    },
  });

  const [{ isOver }, drop] = useDrop({
    accept: "resource-card",
    drop: (item: { resourceId: number; currentArea: string }) => {
      if (item.currentArea !== area.name) {
        onResourceMove(item.resourceId, area.name);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Save area layout to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`area-layout-${areaKey}`, JSON.stringify(areaLayout));
  }, [areaKey, areaLayout]);

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "machine":
        return <Wrench className="w-4 h-4" />;
      case "operator":
        return <Users className="w-4 h-4" />;
      case "facility":
        return <Building2 className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 border-green-300";
      case "warning":
        return "bg-yellow-100 border-yellow-300";
      case "error":
        return "bg-red-100 border-red-300";
      case "maintenance":
        return "bg-blue-100 border-blue-300";
      case "offline":
        return "bg-gray-100 border-gray-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const combinedRef = (el: HTMLDivElement | null) => {
    drag(el);
    drop(el);
  };

  return (
    <div
      ref={combinedRef}
      className={`absolute cursor-move select-none transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-105' : 'opacity-100 scale-100'
      } ${isOver ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: areaLayout.x,
        top: areaLayout.y,
        width: areaLayout.width,
        minHeight: areaLayout.height,
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`relative w-full min-h-full ${
              isNoArea ? 'bg-gray-50 border-gray-300' : 'bg-white border-blue-300'
            } border-2 border-dashed rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow ${
              isOver ? 'bg-blue-50 border-blue-400' : ''
            }`}>
              {/* Area Header */}
              <div className={`flex items-center justify-between mb-3 pb-2 border-b ${
                isNoArea ? 'border-gray-300' : 'border-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Layers className={`w-5 h-5 ${isNoArea ? 'text-gray-600' : 'text-blue-600'}`} />
                  <h3 className={`font-semibold ${isNoArea ? 'text-gray-800' : 'text-blue-800'}`}>
                    {area.name}
                  </h3>
                </div>
                <Badge variant="outline" className={isNoArea ? 'text-gray-600' : 'text-blue-600'}>
                  {resources.length} resources
                </Badge>
              </div>

              {/* Resources Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {resources.map((resource, index) => {
                  const status = generateResourceStatus(resource);
                  const photo = resourcePhotos[resource.id];
                  
                  return (
                    <DraggableResourceCard
                      key={resource.id}
                      resource={resource}
                      status={status}
                      photo={photo}
                      onResourceDetails={onResourceDetails}
                      currentArea={area}
                    />
                  );
                })}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{area.name}</p>
              <p className="text-sm">{resources.length} resources</p>
              <p className="text-sm">Drag to move area or drop resources here</p>
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
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {resource.type === "machine" && <Wrench className="w-5 h-5" />}
                {resource.type === "operator" && <Users className="w-5 h-5" />}
                {resource.type === "facility" && <Building2 className="w-5 h-5" />}
                <span className="text-lg sm:text-xl font-bold">{resource.name}</span>
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
  const [showLegend, setShowLegend] = useState(true);
  const [resourcePhotos, setResourcePhotos] = useState<{ [key: number]: string }>({});
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentArea, setCurrentArea] = useState<string>('all');
  const [areas, setAreas] = useState<{[key: string]: {name: string, resources: number[]}}>({
    all: { name: 'All Resources', resources: [] }
  });
  const [showAreaManager, setShowAreaManager] = useState(false);
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
  const handleResourcePositionMove = (id: string, x: number, y: number) => {
    setShopFloorLayout(prev => 
      prev.map(layout => 
        layout.id === id ? { ...layout, x, y } : layout
      )
    );
  };

  // Handle area movement
  const handleAreaMove = (areaKey: string, x: number, y: number) => {
    // This function is called by the drop handler, but the actual position
    // update is now handled by the drag end event in the DraggableAreaBubble
    // component to ensure proper state management
  };

  // Handle resource movement between areas
  const updateResourceMutation = useMutation({
    mutationFn: async (data: { resourceId: number; area: string }) => {
      const response = await fetch(`/api/resources/${data.resourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ area: data.area === "No Area" ? null : data.area }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update resource area');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      toast({
        title: "Resource Moved",
        description: "Resource successfully moved to new area",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to move resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleResourceMove = (resourceId: number, newAreaName: string) => {
    updateResourceMutation.mutate({ resourceId, area: newAreaName });
  };

  // Drop zone for the shop floor container
  const [, drop] = useDrop({
    accept: ["resource", "area"],
    drop: (item: { id?: string; areaKey?: string; x: number; y: number }, monitor) => {
      if (item.id) {
        // Handle resource drop
        const offset = monitor.getDifferenceFromInitialOffset();
        if (offset) {
          const newX = item.x + offset.x;
          const newY = item.y + offset.y;
          handleResourcePositionMove(item.id, Math.max(0, newX), Math.max(0, newY));
        }
      }
      // Area drops are handled by the drag end event in DraggableAreaBubble
      return { moved: true };
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

  // Save layout mutation (silent save without toast)
  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: ShopFloorLayout[]) => {
      // In real app, save to database
      localStorage.setItem('shopFloorLayout', JSON.stringify(layout));
      return layout;
    },
    // Remove toast notification for auto-save
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
    
    const savedAreas = localStorage.getItem('shopFloorAreas');
    if (savedAreas) {
      try {
        setAreas(JSON.parse(savedAreas));
      } catch (error) {
        console.error('Failed to load shop floor areas:', error);
      }
    }
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  // Area management
  const saveAreas = (newAreas: typeof areas) => {
    setAreas(newAreas);
    localStorage.setItem('shopFloorAreas', JSON.stringify(newAreas));
  };

  const createArea = (name: string, resourceIds: number[]) => {
    const newAreas = {
      ...areas,
      [name.toLowerCase().replace(/\s+/g, '-')]: {
        name,
        resources: resourceIds
      }
    };
    saveAreas(newAreas);
    toast({
      title: "Area Created",
      description: `Area "${name}" has been created successfully.`,
    });
  };

  const deleteArea = (areaKey: string) => {
    if (areaKey === 'all') return;
    
    const newAreas = { ...areas };
    delete newAreas[areaKey];
    saveAreas(newAreas);
    
    if (currentArea === areaKey) {
      setCurrentArea('all');
    }
    
    toast({
      title: "Area Deleted",
      description: `Area has been deleted successfully.`,
    });
  };

  // Filter resources by current area
  const filteredResources = currentArea === 'all' 
    ? resources 
    : resources.filter(resource => areas[currentArea]?.resources.includes(resource.id));

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
    <>
    <div className="h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-4 py-2 sm:py-3 sm:px-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Left side: Title and controls */}
            <div className="flex-1 min-w-0">
              <div className="ml-12 md:ml-0 flex items-center gap-4">
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">Shop Floor</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Production oversight and equipment monitoring</p>
                </div>
              </div>
              
              {/* Mobile controls row */}
              <div className="flex items-center gap-2 mt-2 sm:mt-1 flex-wrap ml-12 md:ml-0">
                {/* Area selector */}
                <Select value={currentArea} onValueChange={setCurrentArea}>
                  <SelectTrigger className="w-[120px] sm:w-[140px] text-xs sm:text-sm h-8 sm:h-9">
                    <SelectValue placeholder="Area" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(areas).map(([key, area]) => (
                      <SelectItem key={key} value={key}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Area manager button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAreaManager(true)}
                      className="h-8 px-2 sm:px-3"
                    >
                      <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline ml-1">Areas</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manage named areas</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Zoom controls */}
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= 0.5}
                        className="p-1 h-6 w-6"
                      >
                        <ZoomOut className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zoom out</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <span className="text-xs font-medium px-1 min-w-[35px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomIn}
                        disabled={zoomLevel >= 3}
                        className="p-1 h-6 w-6"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zoom in</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetZoom}
                        className="p-1 h-6 w-6"
                      >
                        <Grid className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset zoom</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {/* Help toggle button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHelp(!showHelp)}
                      className="h-8 px-2 hover:bg-gray-100"
                    >
                      <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs hidden sm:inline ml-1">Help</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle help instructions</p>
                  </TooltipContent>
                </Tooltip>

                {/* Legend toggle button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLegend(!showLegend)}
                      className="h-8 px-2 hover:bg-gray-100"
                    >
                      <InfoIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs hidden sm:inline ml-1">Legend</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle status legend</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {/* Right side: Live indicator */}
            <div className="flex items-center gap-2 ml-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLivePaused(!isLivePaused)}
                    className="flex items-center gap-1 px-2 sm:px-3 h-8"
                  >
                    {isLivePaused ? (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm hidden sm:inline">Paused</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <PauseCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm hidden sm:inline">Live</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isLivePaused ? "Resume live updates" : "Pause live updates"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        
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
              <div className="absolute top-4 left-4 right-4 sm:right-auto bg-white p-4 rounded-lg shadow-lg sm:max-w-md z-10">
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
                  <li>• Tap any equipment to view detailed status and issues</li>
                  <li>• Use zoom controls to focus on specific areas</li>
                  <li>• Create areas to group related equipment</li>
                  <li>• Color indicates status: Green (operational), Yellow (warning), Red (error)</li>
                  <li>• White bar shows current utilization percentage</li>
                </ul>
              </div>
            )}

            {/* Status Legend */}
            {showLegend && (
              <div className="absolute top-4 right-4 bg-white p-3 sm:p-4 rounded-lg shadow-lg z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Status Legend</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLegend(false)}
                    className="h-6 w-6 p-0 hover:bg-gray-100 sm:hidden"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
                    <span className="text-xs sm:text-sm">Operational</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded"></div>
                    <span className="text-xs sm:text-sm">Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
                    <span className="text-xs sm:text-sm">Error</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded"></div>
                    <span className="text-xs sm:text-sm">Maintenance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-500 rounded"></div>
                    <span className="text-xs sm:text-sm">Offline</span>
                  </div>
                </div>
              </div>
            )}

            {/* Resources */}
            <div 
              style={{ 
                transform: `scale(${zoomLevel})`, 
                transformOrigin: 'top left',
                width: `${100 / zoomLevel}%`,
                height: `${100 / zoomLevel}%`,
                minWidth: '100%',
                minHeight: '100%'
              }}
            >
              {currentArea === 'all' ? (
                // Show resources grouped by areas when viewing all resources
                <>
                  {Object.entries(areas).filter(([key]) => key !== 'all').map(([areaKey, area]) => (
                    <DraggableAreaBubble
                      key={areaKey}
                      areaKey={areaKey}
                      area={area}
                      resources={filteredResources.filter(r => area.resources.includes(r.id))}
                      onMove={handleAreaMove}
                      onResourceDetails={handleResourceDetails}
                      resourcePhotos={resourcePhotos}
                      generateResourceStatus={generateResourceStatus}
                      onResourceMove={handleResourceMove}
                    />
                  ))}
                  
                  {/* Resources not in any area - "No Area" bubble */}
                  {(() => {
                    const assignedResourceIds = new Set(
                      Object.values(areas)
                        .filter(area => area.resources)
                        .flatMap(area => area.resources)
                    );
                    const unassignedResources = filteredResources.filter(r => !assignedResourceIds.has(r.id));
                    
                    if (unassignedResources.length > 0) {
                      return (
                        <DraggableAreaBubble
                          key="no-area"
                          areaKey="no-area"
                          area={{ name: 'No Area', resources: unassignedResources.map(r => r.id) }}
                          resources={unassignedResources}
                          onMove={handleAreaMove}
                          onResourceDetails={handleResourceDetails}
                          resourcePhotos={resourcePhotos}
                          generateResourceStatus={generateResourceStatus}
                          isNoArea={true}
                          onResourceMove={handleResourceMove}
                        />
                      );
                    }
                    return null;
                  })()}
                </>
              ) : (
                // Show individual resources for specific area selection
                shopFloorLayout.map((layout) => {
                  const resource = filteredResources.find(r => r.id === layout.resourceId);
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
                })
              )}
            </div>
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
        {/* Area Manager Dialog */}
        <Dialog open={showAreaManager} onOpenChange={setShowAreaManager}>
          <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Area Manager</DialogTitle>
            </DialogHeader>
            <AreaManagerDialog 
              areas={areas}
              resources={resources}
              onCreateArea={createArea}
              onDeleteArea={deleteArea}
              onClose={() => setShowAreaManager(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

// Area Manager Dialog Component
interface AreaManagerDialogProps {
  areas: {[key: string]: {name: string, resources: number[]}};
  resources: Resource[];
  onCreateArea: (name: string, resourceIds: number[]) => void;
  onDeleteArea: (areaKey: string) => void;
  onClose: () => void;
}

const AreaManagerDialog: React.FC<AreaManagerDialogProps> = ({ 
  areas, 
  resources, 
  onCreateArea, 
  onDeleteArea, 
  onClose 
}) => {
  const [newAreaName, setNewAreaName] = useState('');
  const [selectedResources, setSelectedResources] = useState<number[]>([]);

  const handleCreateArea = () => {
    if (newAreaName.trim() && selectedResources.length > 0) {
      onCreateArea(newAreaName.trim(), selectedResources);
      setNewAreaName('');
      setSelectedResources([]);
    }
  };

  const handleResourceToggle = (resourceId: number) => {
    setSelectedResources(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Create New Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create New Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="area-name">Area Name</Label>
              <Input
                id="area-name"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Enter area name"
              />
            </div>
            
            <div>
              <Label>Select Resources</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                {resources.map(resource => (
                  <div key={resource.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`resource-${resource.id}`}
                      checked={selectedResources.includes(resource.id)}
                      onCheckedChange={() => handleResourceToggle(resource.id)}
                    />
                    <Label htmlFor={`resource-${resource.id}`} className="text-sm">
                      {resource.name} ({resource.type})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={handleCreateArea}
              disabled={!newAreaName.trim() || selectedResources.length === 0}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Area
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Existing Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(areas).map(([key, area]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{area.name}</h4>
                  <p className="text-sm text-gray-600">
                    {area.resources.length} resources
                  </p>
                </div>
                {key !== 'all' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteArea(key)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

