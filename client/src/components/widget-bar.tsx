import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Settings, 
  Maximize2, 
  Minimize2, 
  X, 
  GripVertical,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getWidgetComponent, WIDGET_REGISTRY, getAvailableWidgets, WidgetSizeCategory, WidgetBarCompatibility } from '@/lib/widget-registry';

interface Widget {
  id: string;
  type: string;
  title: string;
  component: React.ComponentType<any>;
  config: any;
  size: 'small' | 'medium' | 'large';
  priority: number;
}

interface WidgetBarProps {
  position: 'top' | 'bottom' | 'left' | 'right';
  isCollapsed?: boolean;
  onPositionChange?: (position: 'top' | 'bottom' | 'left' | 'right') => void;
  onToggleCollapse?: () => void;
  widgets?: Widget[];
  onWidgetUpdate?: (widgets: Widget[]) => void;
  className?: string;
}

const defaultWidgets: Widget[] = [
  {
    id: 'kpi-1',
    type: 'custom-kpi',
    title: 'Production KPIs',
    component: null as any, // Will be resolved dynamically
    config: { view: 'compact', showTrends: true, showTargets: true, maxKPIs: 3 },
    size: 'large',
    priority: 1
  },
  {
    id: 'kpi-2',
    type: 'custom-kpi',
    title: 'Quality Metrics',
    component: null as any, // Will be resolved dynamically
    config: { view: 'compact', showTrends: true, showTargets: false, maxKPIs: 2 },
    size: 'medium',
    priority: 2
  },
  {
    id: 'sequencer-1',
    type: 'operation-sequencer',
    title: 'Quick Sequencer',
    component: null as any, // Will be resolved dynamically
    config: { view: 'compact', allowReorder: false, showResourceFilter: false },
    size: 'medium',
    priority: 3
  }
];

const WidgetBar: React.FC<WidgetBarProps> = ({
  position = 'top',
  isCollapsed = false,
  onPositionChange,
  onToggleCollapse,
  widgets = defaultWidgets,
  onWidgetUpdate,
  className
}) => {
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Removed dynamic sizing - widgets use standard sizes

  const isHorizontal = position === 'top' || position === 'bottom';
  const isVertical = position === 'left' || position === 'right';

  // Removed container monitoring for dynamic sizing

  // Removed dynamic sizing calculation

  const handleDragEnd = (result: any) => {
    if (!result.destination || !onWidgetUpdate) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onWidgetUpdate(items);
  };

  // Filter widgets compatible with widget bar - only allow compact widgets
  const getWidgetBarCompatibleWidgets = () => {
    return getAvailableWidgets().filter(widget => {
      const compatibility = widget.metadata.widgetBarCompatibility;
      const sizeCategory = widget.metadata.sizeCategory;
      return compatibility && 
             compatibility.supported === true && 
             sizeCategory === 'compact';
    });
  };

  const handleAddWidget = (widgetType: string) => {
    if (!onWidgetUpdate) return;
    
    const availableWidgets = getAvailableWidgets();
    const widgetInfo = availableWidgets.find(w => w.type === widgetType);
    if (!widgetInfo) return;

    // Map size category to widget size
    const mapSizeCategory = (category: WidgetSizeCategory): 'small' | 'medium' | 'large' => {
      switch (category) {
        case 'compact': return 'small';
        case 'medium': return 'medium';
        case 'large': 
        case 'extra-large': 
        default: return 'large';
      }
    };

    const newWidget: Widget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: widgetInfo.metadata.displayName,
      component: null as any,
      config: widgetInfo.metadata.defaultConfig || {},
      size: mapSizeCategory(widgetInfo.metadata.sizeCategory),
      priority: widgets.length + 1
    };

    onWidgetUpdate([...widgets, newWidget]);
    setAddWidgetOpen(false);
  };

  const handleRemoveWidget = (widgetId: string) => {
    if (!onWidgetUpdate) return;
    onWidgetUpdate(widgets.filter(w => w.id !== widgetId));
  };

  const scroll = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = 200;
    if (isHorizontal) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    } else {
      scrollRef.current.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getWidgetSizeClass = (widget: Widget) => {
    if (isCollapsed) return '';
    
    // Use standard static sizes for all widgets
    const sizeMap = {
      horizontal: {
        small: 'w-64 h-full',  // 256px standard width for compact widgets
        medium: 'w-80 h-full', // 320px width  
        large: 'w-96 h-full'   // 384px width
      },
      vertical: {
        small: 'w-full h-40',  // 160px standard height for compact widgets
        medium: 'w-full h-56', // 224px height
        large: 'w-full h-72'   // 288px height
      }
    };
    
    return isHorizontal ? sizeMap.horizontal[widget.size] : sizeMap.vertical[widget.size];
  };

  const renderWidget = (widget: Widget, index: number) => {
    const isExpanded = expandedWidget === widget.id;
    const Component = getWidgetComponent(widget.type);
    
    // Safety check to ensure component exists
    if (!Component) {
      console.warn(`Component not found for widget type: ${widget.type}`);
      return null;
    }

    return (
      <Draggable key={widget.id} draggableId={widget.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
              "flex-shrink-0",
              getWidgetSizeClass(widget),
              snapshot.isDragging && "opacity-50 z-50"
            )}
          >
            <div className={cn(
              "h-full border border-border/50 rounded-lg bg-card shadow-sm transition-all duration-200",
              isExpanded && "shadow-lg border-blue-300",
              isCollapsed && "w-12 h-12"
            )}>
              {isCollapsed ? (
                <div className="p-2 flex items-center justify-center">
                  <Badge variant="outline" className="text-xs">
                    {widget.title.charAt(0)}
                  </Badge>
                </div>
              ) : (
                <div className="h-full flex flex-col relative">
                  {/* Minimal Widget Label */}
                  <div className="absolute top-1 left-2 right-6 z-10">
                    <span className="text-[10px] font-medium text-foreground/60 truncate block bg-background/80 rounded px-1 backdrop-blur-sm">
                      {widget.title}
                    </span>
                  </div>

                  {/* Close Button Only */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveWidget(widget.id)}
                    className="absolute top-0.5 right-0.5 h-4 w-4 p-0 z-10 hover:bg-destructive/20 hover:text-destructive opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </Button>

                  {/* Drag Handle - Invisible but functional */}
                  <div 
                    {...provided.dragHandleProps}
                    className="absolute top-0 left-0 right-0 h-6 z-5 cursor-move"
                  />

                  {/* Widget Content - Full Area */}
                  <div className="flex-1 overflow-auto pt-4 p-1">
                    <Component 
                      {...widget.config}
                      isCompact={true}
                      configuration={{
                        ...widget.config,
                        view: 'minimal', // New minimal view for widget bar
                        isCompact: true,
                        showLabels: false,
                        showTitles: false,
                        maxItems: 2, // Even fewer items for widget bar
                        showTrends: true,
                        showTargets: true,
                        dynamicResize: true,
                        containerWidth: 256, // Fixed width for widget bar
                        containerHeight: 128, // Fixed height for widget bar
                        minimal: true
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const renderScrollButton = (direction: 'left' | 'right' | 'up' | 'down') => {
    const Icon = direction === 'left' ? ChevronLeft :
                direction === 'right' ? ChevronRight :
                direction === 'up' ? ChevronUp : ChevronDown;
    
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => scroll(direction)}
        className={cn(
          "flex-shrink-0 shadow-sm",
          isHorizontal ? "h-full w-8" : "w-full h-8"
        )}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  };

  return (
    <>
      <div className={cn(
        "bg-white border shadow-sm transition-all duration-300",
        isHorizontal && "w-full",
        isVertical && "h-full",
        position === 'top' && "border-b",
        position === 'bottom' && "border-t",
        position === 'left' && "border-r",
        position === 'right' && "border-l",
        isCollapsed && (isHorizontal ? "h-12" : "w-12"),
        !isCollapsed && (isHorizontal ? "h-32" : "w-80"),
        className
      )}>
        <div className={cn(
          "h-full flex",
          isHorizontal ? "flex-row" : "flex-col"
        )}>
          {/* Control Panel */}
          <div className={cn(
            "flex-shrink-0 bg-gray-50 border-gray-200 flex items-center justify-center",
            isHorizontal ? "w-12 border-r" : "h-12 border-b"
          )}>
            <div className={cn(
              "flex gap-1",
              isHorizontal ? "flex-col" : "flex-row"
            )}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-6 w-6 p-0"
              >
                {isCollapsed ? (
                  isHorizontal ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                ) : (
                  isHorizontal ? <ChevronUp className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />
                )}
              </Button>
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfigOpen(true)}
                  className="h-6 w-6 p-0"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Widget Container */}
          {!isCollapsed && (
            <div className="flex-1 flex">
              {/* Scroll Button */}
              {isHorizontal ? renderScrollButton('left') : renderScrollButton('up')}
              
              {/* Scrollable Widget Area */}
              <ScrollArea 
                ref={scrollRef}
                className="flex-1"
              >
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="widget-bar" direction={isHorizontal ? 'horizontal' : 'vertical'}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={(el) => {
                          provided.innerRef(el);
                          containerRef.current = el;
                        }}
                        className={cn(
                          "p-2 gap-2",
                          isHorizontal ? "flex flex-row h-full" : "flex flex-col w-full"
                        )}
                      >
                        {widgets.map((widget, index) => renderWidget(widget, index))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </ScrollArea>

              {/* Scroll Button */}
              {isHorizontal ? renderScrollButton('right') : renderScrollButton('down')}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Widget Bar Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Position</label>
              <Select 
                value={position} 
                onValueChange={(value: 'top' | 'bottom' | 'left' | 'right') => 
                  onPositionChange?.(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="left">Left Sidebar</SelectItem>
                  <SelectItem value="right">Right Sidebar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Active Widgets</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddWidgetOpen(true)}
                  className="h-7 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Widget
                </Button>
              </div>
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{widget.title}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedWidget(widget)}
                      className="h-6 w-6 p-0"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveWidget(widget.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <Button className="w-full" onClick={() => setConfigOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Widget Configuration Dialog */}
      <Dialog open={!!selectedWidget} onOpenChange={() => setSelectedWidget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {selectedWidget?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Widget Size</label>
              <Select value={selectedWidget?.size}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="w-full" onClick={() => setSelectedWidget(null)}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
            <DialogDescription>
              Choose a widget to add to your widget bar
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 min-h-0">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Only compact widgets are shown. These widgets are designed to fit in the limited widget bar space.
            </div>
            <ScrollArea className="flex-1 max-h-[60vh]">
              <div className="space-y-2 pr-4">
                {getWidgetBarCompatibleWidgets().map((widgetInfo) => (
                  <Button
                    key={widgetInfo.type}
                    variant="outline"
                    className="w-full justify-start p-4 h-auto"
                    onClick={() => handleAddWidget(widgetInfo.type)}
                  >
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{widgetInfo.metadata.displayName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {widgetInfo.metadata.description}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {widgetInfo.metadata.sizeCategory}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
            <div className="pt-2 border-t">
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setAddWidgetOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WidgetBar;