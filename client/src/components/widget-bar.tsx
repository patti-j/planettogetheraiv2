import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import CustomKPIWidget from './widgets/custom-kpi-widget';
import OperationSequencerWidget from './widgets/operation-sequencer-widget';

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
    component: CustomKPIWidget,
    config: { view: 'compact', showTrends: true, showTargets: true, maxKPIs: 3 },
    size: 'large',
    priority: 1
  },
  {
    id: 'kpi-2',
    type: 'custom-kpi',
    title: 'Quality Metrics',
    component: CustomKPIWidget,
    config: { view: 'compact', showTrends: true, showTargets: false, maxKPIs: 2 },
    size: 'medium',
    priority: 2
  },
  {
    id: 'sequencer-1',
    type: 'operation-sequencer',
    title: 'Quick Sequencer',
    component: OperationSequencerWidget,
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const isHorizontal = position === 'top' || position === 'bottom';
  const isVertical = position === 'left' || position === 'right';

  const handleDragEnd = (result: any) => {
    if (!result.destination || !onWidgetUpdate) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onWidgetUpdate(items);
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

  const getWidgetSizeClass = (size: string, position: string) => {
    if (isCollapsed) return '';
    
    const sizeMap = {
      horizontal: {
        small: 'w-48',
        medium: 'w-72',
        large: 'w-96'
      },
      vertical: {
        small: 'h-32',
        medium: 'h-48',
        large: 'h-64'
      }
    };
    
    return isHorizontal ? sizeMap.horizontal[size] : sizeMap.vertical[size];
  };

  const renderWidget = (widget: Widget, index: number) => {
    const isExpanded = expandedWidget === widget.id;
    const Component = widget.component;
    
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
              getWidgetSizeClass(widget.size, position),
              snapshot.isDragging && "opacity-50 z-50"
            )}
          >
            <Card className={cn(
              "h-full border border-gray-200 shadow-sm transition-all duration-200",
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
                <div className="h-full flex flex-col">
                  <div 
                    {...provided.dragHandleProps}
                    className="flex items-center justify-between p-2 border-b bg-gray-50 cursor-move"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3 w-3 text-gray-400" />
                      <span className="text-xs font-medium truncate">{widget.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedWidget(isExpanded ? null : widget.id)}
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? (
                          <Minimize2 className="h-3 w-3" />
                        ) : (
                          <Maximize2 className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWidget(widget)}
                        className="h-6 w-6 p-0"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className={cn(
                    "flex-1 overflow-auto p-2",
                    isExpanded && "p-4"
                  )}>
                    <Component 
                      {...widget.config}
                      isCompact={!isExpanded}
                    />
                  </div>
                </div>
              )}
            </Card>
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
                orientation={isHorizontal ? 'horizontal' : 'vertical'}
              >
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="widget-bar" direction={isHorizontal ? 'horizontal' : 'vertical'}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
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
              <label className="text-sm font-medium">Active Widgets</label>
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{widget.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWidget(widget)}
                    className="h-6 w-6 p-0"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
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
    </>
  );
};

export default WidgetBar;