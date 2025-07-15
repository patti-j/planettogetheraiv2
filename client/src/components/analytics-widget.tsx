import { useMemo, useRef, useState, useEffect } from "react";
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
              <div className="text-2xl font-bold">{widgetData.value}</div>
              <div className={`text-sm ${widgetData.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {widgetData.change}
              </div>
            </div>
            <div className="text-sm text-gray-600">{widgetData.label}</div>
          </div>
        );
      
      case "chart":
        return (
          <div className="h-32 bg-gray-50 rounded flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Chart visualization</span>
          </div>
        );
      
      case "table":
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500">
              {widgetData.headers?.map((header: string, i: number) => (
                <div key={i}>{header}</div>
              ))}
            </div>
            <div className="space-y-1">
              {widgetData.rows?.map((row: string[], i: number) => (
                <div key={i} className="grid grid-cols-3 gap-2 text-sm">
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
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{widgetData.label}</span>
              <span>{widgetData.value}%</span>
            </div>
            <Progress value={widgetData.value} className="h-2" />
            <div className="text-xs text-gray-500">Target: {widgetData.target}%</div>
          </div>
        );
      
      default:
        return <div className="text-sm text-gray-500">No data available</div>;
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

  return (
    <Card 
      ref={widgetRef}
      className={`${isDragging ? 'shadow-lg' : ''} ${readOnly ? 'cursor-default' : 'cursor-move'} overflow-hidden flex flex-col`}
      style={readOnly ? {
        position: 'relative',
        width: '100%',
        height: 'auto',
        minHeight: '150px'
      } : {
        position: 'absolute',
        left: `${widget.position.x}px`,
        top: `${widget.position.y}px`,
        width: `${widget.size.width}px`,
        height: `${widget.size.height}px`,
        maxHeight: `${widget.size.height}px`,
        maxWidth: `${widget.size.width}px`,
        zIndex: isDragging ? 1000 : 1
      }}
    >
      <CardHeader className="pb-3 min-h-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {!readOnly && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 cursor-move hover:bg-gray-100 flex-shrink-0"
                onMouseDown={handleMouseDown}
                title="Drag to move widget"
              >
                <Move className="w-4 h-4 text-gray-400" />
              </Button>
            )}
            <div className="flex-shrink-0">{getIcon()}</div>
            <CardTitle className="text-sm truncate">{widget.title}</CardTitle>
          </div>
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
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
      <CardContent className="overflow-hidden flex-1 min-h-0">
        <div className="h-full overflow-y-auto">
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
}