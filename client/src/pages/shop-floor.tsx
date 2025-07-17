import { useState, useEffect, useRef, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
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
  Minus,
  ImageIcon,
  Image,
  Sparkles,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useDrag, useDrop } from "react-dnd";

// Optimized mobile-friendly drag and drop for smoother performance
const useMobileDrag = (
  item: any,
  onMove: (x: number, y: number) => void,
  disabled = false
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ x: item.x, y: item.y });
  
  // Use refs for values that don't need to trigger re-renders
  const startPosRef = useRef({ x: 0, y: 0 });
  const initialItemPosRef = useRef({ x: item.x, y: item.y });
  const lastUpdateTimeRef = useRef(0);
  const animationFrameRef = useRef<number>();
  
  // Update position when item changes (but not while dragging)
  useEffect(() => {
    if (!isDragging) {
      setCurrentPosition({ x: item.x, y: item.y });
    }
  }, [item.x, item.y, isDragging]);

  // Immediate position update for ultra-smooth performance
  const updatePosition = useCallback((newX: number, newY: number) => {
    setCurrentPosition({ x: newX, y: newY });
  }, []);

  // Set up global event listeners for drag operations
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - startPosRef.current.x;
        const deltaY = e.clientY - startPosRef.current.y;
        const newX = Math.max(0, initialItemPosRef.current.x + deltaX);
        const newY = Math.max(0, initialItemPosRef.current.y + deltaY);
        updatePosition(newX, newY);
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        const touch = e.touches[0];
        const deltaX = touch.clientX - startPosRef.current.x;
        const deltaY = touch.clientY - startPosRef.current.y;
        const newX = Math.max(0, initialItemPosRef.current.x + deltaX);
        const newY = Math.max(0, initialItemPosRef.current.y + deltaY);
        updatePosition(newX, newY);
      });
    };

    const handleEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Save to localStorage immediately for persistence
      onMove(currentPosition.x, currentPosition.y);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, onMove, currentPosition, updatePosition]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (disabled) return;
    setIsDragging(true);
    startPosRef.current = { x: clientX, y: clientY };
    initialItemPosRef.current = { x: currentPosition.x, y: currentPosition.y };
  }, [disabled, currentPosition.x, currentPosition.y]);

  const listeners = {
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    },
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    }
  };

  return { isDragging, position: currentPosition, listeners };
};
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
  globalImageSize: number;
  individualImageSizes: { [key: number]: number };
  onImageSizeChange: (resourceId: number, size: number) => void;
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
  globalImageSize: number;
  individualImageSizes: { [key: number]: number };
  onImageSizeChange: (resourceId: number, size: number) => void;
  setCurrentArea: (area: string) => void;
}

interface AreaLayout {
  areaKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const DraggableResource = ({ resource, layout, status, onMove, onDetails, photo, globalImageSize, individualImageSizes, onImageSizeChange }: DraggableResourceProps) => {
  const [hasDragged, setHasDragged] = useState(false);
  const [clickBlocked, setClickBlocked] = useState(false);
  const [showImageControls, setShowImageControls] = useState(false);
  
  // Calculate effective image size (individual override or global)
  const effectiveResourceSize = individualImageSizes[resource.id] || globalImageSize;
  
  // Mobile-friendly drag implementation with immediate position updates
  const mobileDrag = useMobileDrag(
    { x: layout.x, y: layout.y, id: layout.id },
    (newX: number, newY: number) => {
      setHasDragged(true);
      setClickBlocked(true);
      onMove(layout.id, newX, newY);
      // Clear click blocking after position change
      setTimeout(() => setClickBlocked(false), 500);
    }
  );

  // Disable react-dnd for area view to prevent conflicts with mobile drag
  const [{ isDragging }, drag] = useDrag({
    type: "resource",
    item: () => {
      setHasDragged(true);
      return { id: layout.id, x: layout.x, y: layout.y };
    },
    collect: (monitor) => ({
      isDragging: false, // Disable react-dnd dragging for area view
    }),
    canDrag: false, // Disable react-dnd dragging
    end: () => {
      // Reset drag state after a longer delay to prevent click
      setTimeout(() => setHasDragged(false), 300);
    },
  });

  // Use mobile drag position if dragging, otherwise use layout position
  const currentPosition = mobileDrag.isDragging ? mobileDrag.position : { x: layout.x, y: layout.y };
  const isCurrentlyDragging = isDragging || mobileDrag.isDragging;
  
  // Handle click to prevent opening dialog after drag
  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if we just finished dragging or are currently dragging
    if (hasDragged || mobileDrag.isDragging || isDragging || clickBlocked) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onDetails(resource, status);
  };

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

  const combinedRef = (el: HTMLDivElement | null) => {
    // Only use mobile drag system for area view
    // drag(el); // Disabled react-dnd
  };

  return (
    <div
      ref={combinedRef}
      className={`absolute cursor-move select-none ${
        isCurrentlyDragging ? 'opacity-50 scale-105' : 'opacity-100 scale-100'
      }`}
      style={{
        left: currentPosition.x,
        top: currentPosition.y,
        width: effectiveResourceSize,
        height: effectiveResourceSize,
        transform: `rotate(${layout.rotation}deg)`,
        transition: isCurrentlyDragging ? 'none' : 'all 0.2s ease',
      }}
      {...mobileDrag.listeners}
    >
      <TooltipProvider>
        <Tooltip open={false}>
          <TooltipTrigger asChild>
            <div
              className={`relative w-full h-full ${getStatusColor(status.status)} rounded-lg border-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer touch-manipulation`}
              onClick={handleClick}
            >
              {/* Resource Icon/Photo */}
              <div className="absolute inset-0 flex items-center justify-center text-white">
                {photo ? (
                  <div 
                    className="relative w-full h-full group"
                    onMouseEnter={() => setShowImageControls(true)}
                    onMouseLeave={() => setShowImageControls(false)}
                  >
                    <img 
                      src={photo} 
                      alt={resource.name}
                      className="w-full h-full object-cover rounded-lg"
                      key={`${resource.id}-${Date.now()}`}
                    />
                    {/* Individual image size controls */}
                    <div 
                      className="absolute -top-8 -right-8 bg-white rounded-lg shadow-lg p-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onImageSizeChange(resource.id, Math.max(20, effectiveResourceSize - 10))}
                        className="h-5 w-5 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-xs font-mono min-w-[2.5rem] text-center text-gray-700">
                        {effectiveResourceSize}px
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onImageSizeChange(resource.id, Math.min(200, effectiveResourceSize + 10))}
                        className="h-5 w-5 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onImageSizeChange(resource.id, 0)} // Reset to global
                        className="h-5 w-5 p-0"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
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
          <TooltipContent 
            className="z-[2147483647] bg-black text-white border-none shadow-xl tooltip-content"
            style={{ 
              zIndex: 2147483647, 
              position: 'fixed',
              isolation: 'isolate',
              transform: 'translateZ(0)'
            }}
            sideOffset={5}
          >
            <div className="space-y-1" style={{ zIndex: 2147483647 }}>
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
  const [hasDragged, setHasDragged] = useState(false);
  
  const [{ isDragging }, drag] = useDrag({
    type: "resource-card",
    item: () => {
      setHasDragged(true);
      return { resourceId: resource.id, currentArea: currentArea?.name || "No Area" };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      // Reset drag state after a longer delay to prevent click
      setTimeout(() => setHasDragged(false), 300);
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if we just finished dragging
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onResourceDetails(resource, status);
  };

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
      onClick={handleClick}
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
  globalImageSize,
  individualImageSizes,
  onImageSizeChange,
  onResourceMove,
  shopFloorLayout,
  setCurrentArea
}: DraggableAreaBubbleProps & { 
  onResourceMove: (resourceId: number, newArea: string) => void;
  shopFloorLayout: ShopFloorLayout[];
}) => {
  // Calculate dimensions
  const areaWidth = Math.max(300, resources.length * 80 + 100);
  const areaHeight = Math.max(200, Math.ceil(resources.length / 4) * 80 + 100);
  
  // Get position from localStorage
  const getPosition = () => {
    const savedLayout = localStorage.getItem(`area-layout-${areaKey}`);
    if (savedLayout) {
      const parsed = JSON.parse(savedLayout);
      return { x: parsed.x, y: parsed.y };
    }
    
    // Calculate non-overlapping position for new areas
    const existingAreas = Object.keys(localStorage)
      .filter(key => key.startsWith('area-layout-'))
      .map(key => JSON.parse(localStorage.getItem(key)!));
    
    let x = 50;
    let y = 50;
    let placed = false;
    
    for (let row = 0; row < 10 && !placed; row++) {
      for (let col = 0; col < 4 && !placed; col++) {
        const testX = 50 + col * 370;
        const testY = 50 + row * 320;
        
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
    
    return { x, y };
  };
  
  const initialPosition = getPosition();

  // Debounced localStorage save for better performance
  const debouncedLocalStorageSave = useCallback((newX: number, newY: number) => {
    const layout = { areaKey, x: newX, y: newY, width: areaWidth, height: areaHeight };
    localStorage.setItem(`area-layout-${areaKey}`, JSON.stringify(layout));
  }, [areaKey, areaWidth, areaHeight]);

  // Optimized mobile-friendly drag implementation
  const mobileDrag = useMobileDrag(
    { x: initialPosition.x, y: initialPosition.y, areaKey },
    (newX: number, newY: number) => {
      // Debounced localStorage save to improve performance
      debouncedLocalStorageSave(newX, newY);
      
      // Notify parent to trigger re-render
      onMove(areaKey, newX, newY);
    }
  );

  // Use mobile drag position if dragging, otherwise use stored position
  const position = mobileDrag.isDragging ? mobileDrag.position : initialPosition;

  // Fallback to react-dnd for desktop
  const [{ isDragging }, drag] = useDrag({
    type: "area",
    item: () => ({ areaKey, x: position.x, y: position.y }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const offset = monitor.getDifferenceFromInitialOffset();
      if (offset) {
        const newX = Math.max(0, item.x + offset.x);
        const newY = Math.max(0, item.y + offset.y);
        
        // Save position to localStorage
        const layout = { areaKey, x: newX, y: newY, width: areaWidth, height: areaHeight };
        localStorage.setItem(`area-layout-${areaKey}`, JSON.stringify(layout));
        
        // Notify parent to trigger re-render
        onMove(areaKey, newX, newY);
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

  // Position is saved in drag end handler - no need for additional useEffect

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

  // Combined drag state for visual feedback
  const isCurrentlyDragging = isDragging || mobileDrag.isDragging;

  return (
    <div
      ref={combinedRef}
      className={`absolute cursor-move select-none transition-all duration-200 ${
        isCurrentlyDragging ? 'opacity-50 scale-105' : 'opacity-100 scale-100'
      } ${isOver ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: areaWidth,
        minHeight: areaHeight,
        // Enable hardware acceleration for smooth dragging
        transform: isCurrentlyDragging ? 'translate3d(0, 0, 0)' : 'none',
        willChange: isCurrentlyDragging ? 'transform' : 'auto'
      }}
      {...mobileDrag.listeners}
    >
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
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={isNoArea ? 'text-gray-600' : 'text-blue-600'}>
                    {resources.length} resources
                  </Badge>
                  {/* Clickable area icon to switch to specific area view */}
                  {!isNoArea && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-blue-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Set the current area to the area key
                              setCurrentArea(areaKey);
                            }}
                          >
                            <ZoomIn className="w-4 h-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Switch to {area.name} view</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              {/* Resources positioned based on saved layout */}
              <div className="relative overflow-hidden">
                {(() => {
                  // Use the same calculation as individual area views for consistent sizing
                  const resourcesWithPositions = resources.map((resource, index) => {
                    const layoutPosition = shopFloorLayout.find(
                      layout => layout.resourceId === resource.id
                    );
                    
                    // Use full layout dimensions (same as individual area view)
                    const position = layoutPosition ? {
                      left: layoutPosition.x,
                      top: layoutPosition.y,
                      width: layoutPosition.width,
                      height: layoutPosition.height
                    } : {
                      // For No Area, arrange in orderly grid pattern with default sizing
                      left: 10 + (index % 4) * 120, // Use default spacing
                      top: 10 + Math.floor(index / 4) * 120, // Rows of 4
                      width: 100,
                      height: 100
                    };
                    
                    return { resource, position, index };
                  });
                  
                  // Calculate the bounding box for automatic area sizing (same as individual area view)
                  const positions = resourcesWithPositions.map(r => r.position);
                  const minLeft = positions.length > 0 ? Math.min(...positions.map(p => p.left)) : 0;
                  const minTop = positions.length > 0 ? Math.min(...positions.map(p => p.top)) : 0;
                  const maxRight = positions.length > 0 ? Math.max(...positions.map(p => p.left + p.width)) : 0;
                  const maxBottom = positions.length > 0 ? Math.max(...positions.map(p => p.top + p.height)) : 0;
                  
                  // Calculate container size with generous margins (same as individual area view)
                  const margin = 50;
                  const containerWidth = Math.max(400, maxRight - minLeft + margin * 2);
                  const containerHeight = Math.max(300, maxBottom - minTop + margin * 2);
                  
                  // Calculate offset to center the resources (same as individual area view)
                  const offsetX = margin - minLeft;
                  const offsetY = margin - minTop;
                  
                  // Normalize positions using the same logic as individual area view
                  const normalizedPositions = resourcesWithPositions.map(item => ({
                    ...item,
                    position: {
                      ...item.position,
                      left: item.position.left + offsetX,
                      top: item.position.top + offsetY
                    }
                  }));
                  
                  return (
                    <div 
                      className="relative"
                      style={{ 
                        width: containerWidth,
                        height: containerHeight,
                        minWidth: '400px',
                        minHeight: '300px'
                      }}
                    >
                      {normalizedPositions.map(({ resource, position, index }) => {
                        const status = generateResourceStatus(resource);
                        const photo = resourcePhotos[resource.id];
                        
                        // Get resource icon based on type
                        const getResourceIcon = (type: string) => {
                          switch (type.toLowerCase()) {
                            case "machine":
                              return <Wrench className="w-4 h-4 text-white" />;
                            case "operator":
                              return <Users className="w-4 h-4 text-white" />;
                            case "facility":
                              return <Building2 className="w-4 h-4 text-white" />;
                            default:
                              return <Settings className="w-4 h-4 text-white" />;
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

                        const getStatusIndicator = (status: string) => {
                          switch (status) {
                            case "operational":
                              return <CheckCircle className="w-3 h-3 text-white" />;
                            case "warning":
                              return <AlertTriangle className="w-3 h-3 text-white" />;
                            case "error":
                              return <AlertCircle className="w-3 h-3 text-white" />;
                            case "maintenance":
                              return <WrenchIcon className="w-3 h-3 text-white" />;
                            case "offline":
                              return <Pause className="w-3 h-3 text-white" />;
                            default:
                              return <Activity className="w-3 h-3 text-white" />;
                          }
                        };

                        return (
                          <div
                            key={resource.id}
                            className="absolute cursor-pointer"
                            style={{
                              left: position.left,
                              top: position.top,
                              width: position.width,
                              height: position.height,
                              zIndex: 1
                            }}
                            onClick={() => onResourceDetails(resource, status)}
                          >
                            <TooltipProvider>
                              <Tooltip open={false}>
                                <TooltipTrigger asChild>
                                  <div className={`relative w-full h-full ${getStatusColor(status.status)} rounded-lg border-2 shadow-lg hover:shadow-xl transition-shadow`}>
                                    {/* Resource Icon/Photo */}
                                    <div className="absolute inset-0 flex items-center justify-center group">
                                      {photo ? (
                                        <div className="relative">
                                          <img 
                                            src={photo} 
                                            alt={resource.name}
                                            className="w-full h-full object-cover rounded-lg"
                                          />
                                          {/* Individual resize controls */}
                                          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-75 rounded px-2 py-1 flex items-center space-x-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const currentSize = individualImageSizes[resource.id] || globalImageSize;
                                                if (currentSize > 20) {
                                                  onImageSizeChange(resource.id, currentSize - 10);
                                                }
                                              }}
                                              className="text-white hover:text-gray-300 text-xs"
                                            >
                                              -
                                            </button>
                                            <span className="text-white text-xs">
                                              {individualImageSizes[resource.id] || globalImageSize}px
                                            </span>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const currentSize = individualImageSizes[resource.id] || globalImageSize;
                                                if (currentSize < 200) {
                                                  onImageSizeChange(resource.id, currentSize + 10);
                                                }
                                              }}
                                              className="text-white hover:text-gray-300 text-xs"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        getResourceIcon(resource.type)
                                      )}
                                    </div>
                                    
                                    {/* Status Indicator */}
                                    <div className="absolute top-0.5 right-0.5 bg-black bg-opacity-30 rounded-full p-0.5">
                                      {getStatusIndicator(status.status)}
                                    </div>
                                    
                                    {/* Utilization Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black bg-opacity-30 rounded-b-lg">
                                      <div 
                                        className="h-full bg-green-500 rounded-b-lg transition-all duration-300"
                                        style={{ width: `${status.utilization}%` }}
                                      />
                                    </div>
                                    
                                    {/* Issue Count */}
                                    {status.issues.length > 0 && (
                                      <div className="absolute top-0.5 left-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-3 h-3 flex items-center justify-center">
                                        {status.issues.length}
                                      </div>
                                    )}
                                    
                                    {/* Resource Name */}
                                    <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 bg-white px-1 py-0.5 rounded shadow-sm whitespace-nowrap">
                                      {resource.name}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent 
                                  className="z-[2147483647] bg-black text-white border-none shadow-xl tooltip-content"
                                  style={{ zIndex: 2147483647, position: 'fixed' }}
                                >
                                  <div className="space-y-1">
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
                      })}
                    </div>
                  );
                })()}
              </div>
      </div>
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
          <DialogTitle className="flex flex-col gap-2 pr-8">
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
            <div className="flex items-center gap-2 justify-start">
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
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [globalImageSize, setGlobalImageSize] = useState(100); // Global image size percentage
  const [individualImageSizes, setIndividualImageSizes] = useState<{ [key: number]: number }>({}); // Individual resource image sizes
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

  // Remove duplicate function - this is handled below

  // Handle area movement - optimized for performance
  const handleAreaMove = useCallback((areaKey: string, x: number, y: number) => {
    // Use minimal state update to avoid unnecessary re-renders
    setForceUpdate(prev => prev + 1);
  }, []);

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

  // Handle resource movement between areas
  const handleResourceMove = (resourceId: number, newAreaName: string) => {
    updateResourceMutation.mutate({ resourceId, area: newAreaName });
  };

  // AI Image Generation Mutation - generates all missing resource images
  const aiImageGenerationMutation = useMutation({
    mutationFn: async () => {
      const resourcesWithoutPhotos = resources.filter(resource => !resourcePhotos[resource.id]);
      
      if (resourcesWithoutPhotos.length === 0) {
        throw new Error("All resources already have photos");
      }
      
      const results = [];
      let successCount = 0;
      let quotaExceeded = false;
      
      // Show initial progress toast
      toast({
        title: "AI Image Generation Started",
        description: `Generating ${resourcesWithoutPhotos.length} resource images...`,
      });
      
      // Process images in parallel batches of 2 for better speed
      const batchSize = 2;
      for (let i = 0; i < resourcesWithoutPhotos.length; i += batchSize) {
        // Stop processing if quota has been exceeded
        if (quotaExceeded) {
          break;
        }
        
        const batch = resourcesWithoutPhotos.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (resource) => {
          const prompt = `Professional photograph of a ${resource.type.toLowerCase()} named ${resource.name} in a modern manufacturing facility. The ${resource.type.toLowerCase()} should be industrial, clean, and professionally lit, suitable for ${resource.capabilities} operations. High-quality industrial photography, realistic lighting, modern factory setting, professional equipment photography.`;
          
          try {
            const response = await apiRequest('POST', '/api/ai/generate-image', {
              prompt,
              resourceId: resource.id
            });
            
            // Check for quota exceeded status first
            if (response.status === 429) {
              quotaExceeded = true;
              const data = await response.json();
              throw new Error(`Quota exceeded: ${data.error || 'API quota limit reached'}`);
            }
            
            const data = await response.json();
            console.log('AI API response:', data);
            
            // Check for quota exceeded error in response data
            if (data.error && (data.error.includes('quota') || data.error.includes('limit') || data.error.includes('exceeded'))) {
              quotaExceeded = true;
              throw new Error(`Quota exceeded: ${data.error}`);
            }
            
            // The image is already in base64 format from the server
            const base64Image = data.imageUrl;
            
            // Immediately add the base64 image to the UI
            console.log('About to upload photo for resource', resource.id, 'with URL:', base64Image);
            handlePhotoUpload(resource.id, base64Image);
            successCount++;
            
            // Force immediate UI update
            setForceUpdate(prev => prev + 1);
            
            // Show progress toast
            toast({
              title: "Image Generated",
              description: `Generated realistic image for ${resource.name} (${successCount}/${resourcesWithoutPhotos.length})`,
            });
            
            return { resourceId: resource.id, imageUrl: base64Image };
          } catch (error) {
            console.error(`Failed to generate image for ${resource.name}:`, error);
            
            // Check if this is a quota error
            if (error.message && (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('exceeded'))) {
              quotaExceeded = true;
              
              // Show quota exceeded error
              toast({
                title: "Quota Exceeded",
                description: "AI image generation quota has been exceeded. Stopping generation process.",
                variant: "destructive",
              });
              
              return null;
            }
            
            // Show error toast with more details
            toast({
              title: "Image Generation Error",
              description: `Failed to generate image for ${resource.name}: ${error.message || 'Unknown error'}`,
              variant: "destructive",
            });
            
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(result => result !== null));
        
        // If quota exceeded, stop processing
        if (quotaExceeded) {
          break;
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      if (results.length > 0) {
        toast({
          title: "AI Image Generation Complete",
          description: `Successfully generated ${results.length} resource images`,
        });
        
        // Force a final re-render to ensure all images are visible
        queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      } else {
        toast({
          title: "No Images Generated",
          description: "Failed to generate any images. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI images",
        variant: "destructive",
      });
    },
  });

  // Handle resource position movement within the shop floor layout
  const handleResourcePositionMove = (layoutId: string, x: number, y: number) => {
    setShopFloorLayout(prev => 
      prev.map(layout => 
        layout.id === layoutId ? { ...layout, x, y } : layout
      )
    );
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
    console.log('Setting photo for resource', resourceId, 'URL:', photoUrl);
    setResourcePhotos(prev => {
      const newPhotos = {
        ...prev,
        [resourceId]: photoUrl
      };
      console.log('Updated resourcePhotos state:', newPhotos);
      return newPhotos;
    });
    
    // Save to localStorage for persistence
    const savedPhotos = JSON.parse(localStorage.getItem('resourcePhotos') || '{}');
    savedPhotos[resourceId] = photoUrl;
    localStorage.setItem('resourcePhotos', JSON.stringify(savedPhotos));
    console.log('Saved to localStorage:', savedPhotos);
  };

  // Handle individual image size changes
  const handleImageSizeChange = (resourceId: number, size: number) => {
    if (size === 0) {
      // Remove individual override to use global size
      setIndividualImageSizes(prev => {
        const newSizes = { ...prev };
        delete newSizes[resourceId];
        return newSizes;
      });
    } else {
      // Set individual size
      setIndividualImageSizes(prev => ({
        ...prev,
        [resourceId]: size
      }));
    }
    
    // Force re-render to update area rectangles with new resource sizes
    // This is done by triggering a state update
    setShopFloorLayout(prev => [...prev]);
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
        const photos = JSON.parse(savedPhotos);
        console.log('Loading resource photos from localStorage:', photos);
        setResourcePhotos(photos);
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
        // Also save to localStorage for immediate persistence
        localStorage.setItem('shopFloorLayout', JSON.stringify(shopFloorLayout));
      }, 500); // Reduced delay for faster saving
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
    <div className="h-screen bg-gray-50 flex flex-col shop-floor-container">
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
                
                {/* Layout Manager button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLayoutManager(true)}
                      className="h-8 px-2 sm:px-3"
                    >
                      <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline ml-1">Layout Manager</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manage shop floor layout and controls</p>
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

                {/* Image Size Controls */}
                <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-600">Size:</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setGlobalImageSize(prev => Math.max(50, prev - 10));
                          setShopFloorLayout(prev => [...prev]); // Force re-render for area calculations
                        }}
                        className="h-6 w-6 p-0 hover:bg-gray-200"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Decrease all image sizes</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-xs font-mono min-w-[3rem] text-center">{globalImageSize}%</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setGlobalImageSize(prev => Math.min(200, prev + 10));
                          setShopFloorLayout(prev => [...prev]); // Force re-render for area calculations
                        }}
                        className="h-6 w-6 p-0 hover:bg-gray-200"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Increase all image sizes</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setGlobalImageSize(100);
                          setIndividualImageSizes({});
                          setShopFloorLayout(prev => [...prev]); // Force re-render for area calculations
                        }}
                        className="h-6 w-6 p-0 hover:bg-gray-200 ml-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset all image sizes to default</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Status Legend</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLegend(false)}
                    className="h-6 w-6 p-0 hover:bg-gray-100 -mt-1 ml-3"
                  >
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
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
                  {/* Area bubbles */}
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
                      globalImageSize={globalImageSize}
                      individualImageSizes={individualImageSizes}
                      onImageSizeChange={handleImageSizeChange}
                      onResourceMove={handleResourceMove}
                      shopFloorLayout={shopFloorLayout}
                      setCurrentArea={setCurrentArea}
                    />
                  ))}
                  
                  {/* Unassigned resources displayed directly on background */}
                  {(() => {
                    const assignedResourceIds = new Set(
                      Object.values(areas)
                        .filter(area => area.resources)
                        .flatMap(area => area.resources)
                    );
                    const unassignedResources = filteredResources
                      .filter(r => !assignedResourceIds.has(r.id))
                      .sort((a, b) => a.name.localeCompare(b.name));
                    
                    return unassignedResources.map((resource) => {
                      const layout = shopFloorLayout.find(l => l.resourceId === resource.id) || {
                        id: `resource-${resource.id}`,
                        x: 100 + (unassignedResources.indexOf(resource) % 4) * 150,
                        y: 100 + Math.floor(unassignedResources.indexOf(resource) / 4) * 150,
                        width: 100,
                        height: 100,
                        resourceId: resource.id,
                        rotation: 0,
                      };
                      
                      const status = generateResourceStatus(resource);
                      
                      return (
                        <DraggableResource
                          key={layout.id}
                          resource={resource}
                          layout={layout}
                          status={status}
                          onMove={handleResourcePositionMove}
                          onDetails={handleResourceDetails}
                          photo={resourcePhotos[resource.id]}
                          globalImageSize={globalImageSize}
                          individualImageSizes={individualImageSizes}
                          onImageSizeChange={handleImageSizeChange}
                        />
                      );
                    });
                  })()}
                </>
              ) : (
                // Show individual resources for specific area selection with automatic sizing
                (() => {
                  const currentAreaData = areas[currentArea];
                  if (!currentAreaData) return null;
                  
                  // Get all resources in the current area
                  const areaResources = shopFloorLayout
                    .filter(layout => {
                      const resource = filteredResources.find(r => r.id === layout.resourceId);
                      return resource && currentAreaData.resources.includes(resource.id);
                    })
                    .map(layout => {
                      const resource = filteredResources.find(r => r.id === layout.resourceId);
                      return { resource, layout };
                    });
                  
                  if (areaResources.length === 0) return null;
                  
                  // Calculate the bounding box for automatic area sizing
                  const positions = areaResources.map(({ layout }) => ({
                    left: layout.x,
                    top: layout.y,
                    width: layout.width,
                    height: layout.height
                  }));
                  
                  const minLeft = Math.min(...positions.map(p => p.left));
                  const minTop = Math.min(...positions.map(p => p.top));
                  const maxRight = Math.max(...positions.map(p => p.left + p.width));
                  const maxBottom = Math.max(...positions.map(p => p.top + p.height));
                  
                  // Calculate available screen space (subtract headers, margins, etc.)
                  const availableWidth = window.innerWidth - 40; // Minimal side margins
                  const availableHeight = window.innerHeight - 200; // Account for headers and controls
                  
                  // Calculate resource bounds
                  const resourceWidth = maxRight - minLeft;
                  const resourceHeight = maxBottom - minTop;
                  
                  // Add padding around resources
                  const padding = 40;
                  const paddedWidth = resourceWidth + (padding * 2);
                  const paddedHeight = resourceHeight + (padding * 2);
                  
                  // Calculate scale to fit screen while maintaining aspect ratio
                  const scaleX = availableWidth / paddedWidth;
                  const scaleY = availableHeight / paddedHeight;
                  const scale = Math.min(scaleX, scaleY, 3); // Max 3x scale to prevent overly large images
                  
                  // Apply scale to dimensions
                  const scaledWidth = paddedWidth * scale;
                  const scaledHeight = paddedHeight * scale;
                  const scaledPadding = padding * scale;
                  
                  // Position container in top-left with minimal margin
                  const containerStyle = {
                    width: scaledWidth,
                    height: scaledHeight,
                    margin: '10px',
                    padding: '0px',
                    position: 'relative' as const,
                    left: '0',
                    top: '0'
                  };
                  
                  // Calculate offset to position resources with scaled padding
                  const offsetX = scaledPadding - (minLeft * scale);
                  const offsetY = scaledPadding - (minTop * scale);
                  
                  return (
                    <div
                      className="relative bg-white border-2 border-dashed border-blue-300 rounded-lg shadow-lg"
                      style={containerStyle}
                    >
                      {/* Area title */}
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">{currentAreaData.name}</span>
                        <Badge variant="outline" className="text-blue-600">
                          {areaResources.length} resources
                        </Badge>
                      </div>
                      
                      {/* Resources */}
                      {areaResources.map(({ resource, layout }) => {
                        const status = generateResourceStatus(resource);
                        const adjustedLayout = {
                          ...layout,
                          x: (layout.x * scale) + offsetX,
                          y: (layout.y * scale) + offsetY,
                          width: layout.width * scale,
                          height: layout.height * scale
                        };
                        
                        return (
                          <DraggableResource
                            key={layout.id}
                            resource={resource}
                            layout={adjustedLayout}
                            status={status}
                            onMove={handleResourcePositionMove}
                            onDetails={handleResourceDetails}
                            photo={resourcePhotos[resource.id]}
                            globalImageSize={globalImageSize * scale}
                            individualImageSizes={individualImageSizes}
                            onImageSizeChange={handleImageSizeChange}
                          />
                        );
                      })}
                    </div>
                  );
                })()
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

        {/* Layout Manager Dialog */}
        <Dialog open={showLayoutManager} onOpenChange={setShowLayoutManager}>
          <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Layout Manager</DialogTitle>
            </DialogHeader>
            <LayoutManagerDialog 
              showHelp={showHelp}
              setShowHelp={setShowHelp}
              showLegend={showLegend}
              setShowLegend={setShowLegend}
              globalImageSize={globalImageSize}
              setGlobalImageSize={setGlobalImageSize}
              individualImageSizes={individualImageSizes}
              setIndividualImageSizes={setIndividualImageSizes}
              aiImageGenerationMutation={aiImageGenerationMutation}
              resources={resources}
              resourcePhotos={resourcePhotos}
              setResourcePhotos={setResourcePhotos}
              toast={toast}
              areas={areas}
              onCreateArea={createArea}
              onDeleteArea={deleteArea}
              onClose={() => setShowLayoutManager(false)}
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

// Layout Manager Dialog Component
interface LayoutManagerDialogProps {
  showHelp: boolean;
  setShowHelp: (value: boolean) => void;
  showLegend: boolean;
  setShowLegend: (value: boolean) => void;
  globalImageSize: number;
  setGlobalImageSize: (value: number | ((prev: number) => number)) => void;
  individualImageSizes: { [key: number]: number };
  setIndividualImageSizes: (value: { [key: number]: number } | ((prev: { [key: number]: number }) => { [key: number]: number })) => void;
  aiImageGenerationMutation: any;
  resources: Resource[];
  resourcePhotos: { [key: number]: string };
  setResourcePhotos: (value: { [key: number]: string } | ((prev: { [key: number]: string }) => { [key: number]: string })) => void;
  toast: any;
  areas: {[key: string]: {name: string, resources: number[]}};
  onCreateArea: (name: string, resourceIds: number[]) => void;
  onDeleteArea: (areaKey: string) => void;
  onClose: () => void;
}

const LayoutManagerDialog: React.FC<LayoutManagerDialogProps> = ({ 
  showHelp,
  setShowHelp,
  showLegend,
  setShowLegend,
  globalImageSize,
  setGlobalImageSize,
  individualImageSizes,
  setIndividualImageSizes,
  aiImageGenerationMutation,
  resources,
  resourcePhotos,
  setResourcePhotos,
  toast,
  areas,
  onCreateArea,
  onDeleteArea,
  onClose
}) => {
  const [showAreaManager, setShowAreaManager] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Help & Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Show help instructions</span>
              <Switch checked={showHelp} onCheckedChange={setShowHelp} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Show status legend</span>
              <Switch checked={showLegend} onCheckedChange={setShowLegend} />
            </div>
            {showHelp && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Shop Floor Controls</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Drag & Drop:</strong> Move resources between areas</li>
                  <li>• <strong>Zoom:</strong> Use zoom controls to scale the entire floor</li>
                  <li>• <strong>Area View:</strong> Click area bubbles to switch between views</li>
                  <li>• <strong>Click Icons:</strong> Click on resource icons to see details</li>
                  <li>• <strong>Live Updates:</strong> Real-time status updates every 30 seconds</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="w-5 h-5" />
            Image Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* AI Image Generation */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">AI Image Generation</p>
                <p className="text-xs text-gray-500">Generate cartoon-style images for resources missing photos</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => aiImageGenerationMutation.mutate()}
                    disabled={aiImageGenerationMutation.isPending || resources.filter(r => !resourcePhotos[r.id]).length === 0}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-purple-500 hover:border-purple-600"
                  >
                    {aiImageGenerationMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span className="ml-2">
                      Generate Images ({resources.filter(r => !resourcePhotos[r.id]).length})
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate cartoon-style AI images for resources missing photos</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Clear Cache */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Clear Cached Images</p>
                <p className="text-xs text-gray-500">Remove all stored resource images</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => {
                      localStorage.removeItem('resourcePhotos');
                      setResourcePhotos({});
                      toast({
                        title: "Cache Cleared",
                        description: "All resource images have been cleared from storage.",
                      });
                    }}
                    className="hover:bg-red-50 border-red-300 text-red-700 hover:border-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="ml-2">Clear Images</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear all cached resource images</p>
                </TooltipContent>
              </Tooltip>
            </div>


          </div>
        </CardContent>
      </Card>

      {/* Area Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Area Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Manage Named Areas</p>
              <p className="text-xs text-gray-500">Create and organize resource areas</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAreaManager(true)}
            >
              <Layers className="w-4 h-4" />
              <span className="ml-2">Manage Areas</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Area Manager Dialog */}
      {showAreaManager && (
        <Dialog open={showAreaManager} onOpenChange={setShowAreaManager}>
          <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Area Manager</DialogTitle>
            </DialogHeader>
            <AreaManagerDialog 
              areas={areas}
              resources={resources}
              onCreateArea={onCreateArea}
              onDeleteArea={onDeleteArea}
              onClose={() => setShowAreaManager(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

