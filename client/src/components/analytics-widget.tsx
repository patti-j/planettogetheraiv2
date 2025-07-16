import { useMemo, useRef, useState, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle, MoreHorizontal, Eye, EyeOff, X, Settings, Maximize2, Move } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AnalyticsWidget {
  id: string;
  title: string;
  type: "metric" | "chart" | "table" | "progress";
  data: any;
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
}

interface AnalyticsWidgetProps {
  widget: AnalyticsWidget;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
  onMove: (id: string, position: { x: number; y: number }) => void;
  data: {
    jobs: any[];
    operations: any[];
    resources: any[];
    metrics: any;
    overdueJobs: any[];
    resourceUtilization: number;
    jobsByStatus: Record<string, number>;
    operationsByStatus: Record<string, number>;
    resourcesByStatus: Record<string, number>;
  };
  readOnly?: boolean;
}

export default function AnalyticsWidget({ 
  widget, 
  onToggle, 
  onRemove, 
  onEdit, 
  onResize, 
  onMove,
  data,
  readOnly = false
}: AnalyticsWidgetProps) {
  const isMobile = useMobile();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const container = widgetRef.current?.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Ensure the widget stays within bounds
    const maxX = containerRect.width - widget.size.width;
    const maxY = containerRect.height - widget.size.height;
    
    onMove(widget.id, { 
      x: Math.max(0, Math.min(maxX, newX)), 
      y: Math.max(0, Math.min(maxY, newY)) 
    });
  };

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Add mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, widget.id, onMove]);
  
  const widgetData = useMemo(() => {
    // Generate data based on widget type and configuration
    switch (widget.type) {
      case "metric":
        return {
          value: data.jobs?.length || 0,
          label: "Total Jobs",
          change: "+12%",
          trend: "up"
        };
      case "chart":
        return {
          data: [
            { name: "Jan", value: 400 },
            { name: "Feb", value: 300 },
            { name: "Mar", value: 500 },
            { name: "Apr", value: 200 },
            { name: "May", value: 600 }
          ]
        };
      case "table":
        return {
          headers: ["Job", "Status", "Progress"],
          rows: data.jobs?.slice(0, 5).map(job => [
            job.name,
            job.status,
            `${Math.round(Math.random() * 100)}%`
          ]) || []
        };
      case "progress":
        return {
          value: 75,
          label: "Overall Progress",
          target: 100
        };
      default:
        return {};
    }
  }, [widget.type, data]);

  const renderContent = () => {
    switch (widget.type) {
      case "metric":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{widgetData.value}</div>
              <div className={`text-xs ${widgetData.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {widgetData.change}
              </div>
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>{widgetData.label}</div>
          </div>
        );
      
      case "chart":
        return (
          <div className={`bg-gray-50 rounded flex items-center justify-center ${isMobile ? 'h-20' : 'h-32'}`}>
            <TrendingUp className={`text-gray-400 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
            <span className={`ml-2 text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {isMobile ? 'Chart' : 'Chart visualization'}
            </span>
          </div>
        );
      
      case "table":
        return (
          <div className="space-y-2">
            <div className={`grid grid-cols-3 gap-1 font-medium text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              {widgetData.headers?.map((header: string, i: number) => (
                <div key={i} className="truncate">{header}</div>
              ))}
            </div>
            <div className="space-y-1">
              {widgetData.rows?.slice(0, isMobile ? 3 : 5).map((row: string[], i: number) => (
                <div key={i} className={`grid grid-cols-3 gap-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {row.map((cell, j) => (
                    <div key={j} className="truncate">{cell}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      
      case "progress":
        return (
          <div className={`space-y-2 ${isMobile ? 'space-y-1' : 'space-y-3'}`}>
            <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <span className="truncate">{widgetData.label}</span>
              <span>{widgetData.value}%</span>
            </div>
            <Progress value={widgetData.value} className={`${isMobile ? 'h-1' : 'h-2'}`} />
            <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>Target: {widgetData.target}%</div>
          </div>
        );
      
      default:
        return <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>No data available</div>;
    }
  };

  const getIcon = () => {
    switch (widget.type) {
      case "metric":
        return <BarChart3 className="w-4 h-4" />;
      case "chart":
        return <TrendingUp className="w-4 h-4" />;
      case "table":
        return <Clock className="w-4 h-4" />;
      case "progress":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (!widget.visible) return null;

  // Calculate mobile-optimized dimensions
  const mobileOptimizedSize = useMemo(() => {
    if (!isMobile) return widget.size;
    
    // For mobile, use responsive sizing based on widget type
    const mobileWidths = {
      metric: 160,
      chart: 320,
      table: 320,
      progress: 280
    };
    
    const mobileHeights = {
      metric: 120,
      chart: 180,
      table: 200,
      progress: 140
    };
    
    return {
      width: mobileWidths[widget.type] || 160,
      height: mobileHeights[widget.type] || 120
    };
  }, [isMobile, widget.type, widget.size]);

  // Calculate mobile-optimized position
  const mobileOptimizedPosition = useMemo(() => {
    if (!isMobile) return widget.position;
    
    // For mobile, arrange widgets in a responsive grid
    const containerWidth = window.innerWidth - 32; // Account for padding
    const spacing = 8;
    const widgetWidth = mobileOptimizedSize.width;
    
    // Calculate how many widgets can fit per row
    const widgetsPerRow = Math.floor(containerWidth / (widgetWidth + spacing));
    const effectiveWidgetsPerRow = Math.max(1, Math.min(widgetsPerRow, 2)); // Min 1, max 2
    
    const widgetIndex = parseInt(widget.id.split('-')[1] || '0');
    const row = Math.floor(widgetIndex / effectiveWidgetsPerRow);
    const col = widgetIndex % effectiveWidgetsPerRow;
    
    // Center widgets if there's only one per row
    const totalRowWidth = effectiveWidgetsPerRow * widgetWidth + (effectiveWidgetsPerRow - 1) * spacing;
    const leftOffset = Math.max(0, (containerWidth - totalRowWidth) / 2);
    
    return {
      x: leftOffset + col * (widgetWidth + spacing),
      y: row * (mobileOptimizedSize.height + spacing)
    };
  }, [isMobile, widget.position, widget.id, mobileOptimizedSize]);

  return (
    <Card 
      ref={widgetRef}
      className={`${isDragging ? 'shadow-lg' : 'shadow-sm'} ${readOnly ? 'cursor-default' : 'cursor-move'} overflow-hidden flex flex-col border border-gray-200`}
      style={{
        position: 'absolute',
        left: `${Math.max(0, mobileOptimizedPosition.x)}px`,
        top: `${Math.max(0, mobileOptimizedPosition.y)}px`,
        width: `${mobileOptimizedSize.width}px`,
        height: `${mobileOptimizedSize.height}px`,
        maxHeight: `${mobileOptimizedSize.height}px`,
        maxWidth: `${mobileOptimizedSize.width}px`,
        zIndex: isDragging ? 1000 : 1
      }}
    >
      <CardHeader className={`min-h-0 ${isMobile ? 'pb-2 pt-2' : 'pb-3'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {!readOnly && (
              <Button 
                variant="ghost" 
                size="sm" 
                className={`p-0 cursor-move hover:bg-gray-100 flex-shrink-0 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`}
                onMouseDown={handleMouseDown}
                title="Drag to move widget"
              >
                <Move className={`text-gray-400 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              </Button>
            )}
            <div className="flex-shrink-0">{getIcon()}</div>
            <CardTitle className={`truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>{widget.title}</CardTitle>
          </div>
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`p-0 flex-shrink-0 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`}>
                  <MoreHorizontal className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onToggle(widget.id)}>
                  {widget.visible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {widget.visible ? "Hide" : "Show"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(widget.id)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Expand
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRemove(widget.id)} className="text-red-600">
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className={`overflow-hidden flex-1 min-h-0 ${isMobile ? 'p-2' : 'p-6'}`}>
        <div className="h-full overflow-y-auto">
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
}