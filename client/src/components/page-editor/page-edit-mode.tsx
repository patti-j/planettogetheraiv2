import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Settings, 
  Layout, 
  Grid, 
  Smartphone, 
  Monitor,
  Eye,
  EyeOff,
  Move,
  Copy,
  TabletSmartphone as TabsIcon,
  MoreVertical
} from 'lucide-react';
import { useDeviceType } from '@/hooks/useDeviceType';

interface PageEditModeProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  pageTitle: string;
  onPageTitleChange: (title: string) => void;
  pageDescription?: string;
  onPageDescriptionChange?: (description: string) => void;
  layout: PageLayout;
  onLayoutChange: (layout: PageLayout) => void;
  availableWidgets: WidgetDefinition[];
  onSave: () => void;
  className?: string;
}

interface PageLayout {
  id: string;
  title: string;
  description?: string;
  type: 'grid' | 'tabs' | 'dashboard' | 'custom';
  columns: number;
  rows: number;
  tabs?: TabDefinition[];
  widgets: WidgetInstance[];
  settings: {
    responsive: boolean;
    mobileOptimized: boolean;
    showHeader: boolean;
    showFilters: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
}

interface TabDefinition {
  id: string;
  title: string;
  icon?: string;
  widgets: WidgetInstance[];
  visible: boolean;
}

interface WidgetInstance {
  id: string;
  widgetId: string;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  configuration: Record<string, any>;
  visible: boolean;
  tabId?: string;
}

interface WidgetDefinition {
  id: string;
  title: string;
  type: string;
  description: string;
  category: string;
  defaultSize: { w: number; h: number };
  configSchema: any;
}

const DraggableWidget: React.FC<{
  widget: WidgetInstance;
  onUpdate: (widget: WidgetInstance) => void;
  onDelete: (widgetId: string) => void;
  isEditMode: boolean;
}> = ({ widget, onUpdate, onDelete, isEditMode }) => {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: { id: widget.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isEditMode && !isMobile, // Disable drag on mobile for better touch experience
  });

  const [, drop] = useDrop({
    accept: 'widget',
    hover: (item: { id: string }) => {
      // Handle reordering logic here
    },
  });

  const toggleVisibility = () => {
    onUpdate({ ...widget, visible: !widget.visible });
  };

  return (
    <div
      ref={isEditMode && !isMobile ? (node) => drag(drop(node)) : undefined}
      className={`relative border-2 rounded-lg overflow-hidden bg-white ${
        isEditMode 
          ? 'border-dashed border-blue-300 hover:border-blue-500' 
          : 'border-gray-200'
      } ${isDragging ? 'opacity-50' : ''} ${
        !widget.visible ? 'opacity-60' : ''
      } transition-all duration-200 shadow-sm`}
      style={{
        gridColumn: isMobile ? 'span 1' : `span ${widget.position.w}`,
        gridRow: `span ${widget.position.h}`,
      }}
    >
      {isEditMode && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 bg-white/90"
            onClick={() => onUpdate({ ...widget, visible: !widget.visible })}
          >
            {widget.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 bg-white/90"
            onClick={() => onDelete(widget.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
      
      {isEditMode && (
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="text-xs">
            {widget.title}
          </Badge>
        </div>
      )}
      
      <div className={`h-full ${!widget.visible ? 'opacity-50' : ''}`}>
        {/* Widget content would be rendered here */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{widget.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Widget content placeholder
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function PageEditMode({
  isEditMode,
  onToggleEditMode,
  pageTitle,
  onPageTitleChange,
  pageDescription,
  onPageDescriptionChange,
  layout,
  onLayoutChange,
  availableWidgets,
  onSave,
  className = ''
}: PageEditModeProps) {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState(layout.tabs?.[0]?.id || 'main');
  const [draggedWidget, setDraggedWidget] = useState<WidgetDefinition | null>(null);

  const dndBackend = isMobile ? TouchBackend : HTML5Backend;
  const dndOptions = isMobile ? { enableMouseEvents: false } : {};

  const handleAddWidget = (widgetDef: WidgetDefinition, tabId?: string) => {
    const newWidget: WidgetInstance = {
      id: `widget_${Date.now()}`,
      widgetId: widgetDef.id,
      title: widgetDef.title,
      position: {
        x: 0,
        y: 0,
        w: widgetDef.defaultSize.w,
        h: widgetDef.defaultSize.h
      },
      configuration: {},
      visible: true,
      tabId
    };

    onLayoutChange({
      ...layout,
      widgets: [...layout.widgets, newWidget]
    });
  };

  const handleUpdateWidget = (updatedWidget: WidgetInstance) => {
    onLayoutChange({
      ...layout,
      widgets: layout.widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w)
    });
  };

  const handleDeleteWidget = (widgetId: string) => {
    onLayoutChange({
      ...layout,
      widgets: layout.widgets.filter(w => w.id !== widgetId)
    });
  };

  const handleAddTab = () => {
    const newTab: TabDefinition = {
      id: `tab_${Date.now()}`,
      title: `Tab ${(layout.tabs?.length || 0) + 1}`,
      widgets: [],
      visible: true
    };

    onLayoutChange({
      ...layout,
      tabs: [...(layout.tabs || []), newTab]
    });
  };

  const handleUpdateTab = (tabId: string, updates: Partial<TabDefinition>) => {
    onLayoutChange({
      ...layout,
      tabs: layout.tabs?.map(tab => tab.id === tabId ? { ...tab, ...updates } : tab)
    });
  };

  const handleDeleteTab = (tabId: string) => {
    onLayoutChange({
      ...layout,
      tabs: layout.tabs?.filter(tab => tab.id !== tabId),
      widgets: layout.widgets.filter(w => w.tabId !== tabId)
    });
  };

  const currentTabWidgets = layout.type === 'tabs' 
    ? layout.widgets.filter(w => w.tabId === activeTab)
    : layout.widgets;

  return (
    <DndProvider backend={dndBackend} options={dndOptions}>
      <div className={`relative ${className}`}>
        {/* Edit Mode Controls Bar - Only show when in edit mode */}
        {isEditMode && (
          <div className={`
            fixed ${isMobile ? 'bottom-4 left-4' : 'top-4 left-4'} 
            z-30 bg-white/95 backdrop-blur-sm border rounded-lg shadow-lg ring-2 ring-blue-500
            ${isMobile ? 'p-2' : 'p-2'}
          `}>
            <div className={`flex items-center gap-2 ${isMobile ? 'justify-center' : 'justify-between'}`}>
              <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap justify-center w-full' : ''}`}>
                <Button
                  onClick={onToggleEditMode}
                  variant="default"
                  size={isMobile ? "sm" : "sm"}
                  className={`${isMobile ? 'w-10 h-10 p-0' : 'gap-2'} ${isMobile ? 'flex-shrink-0' : ''}`}
                >
                  <X className="w-4 h-4" />
                  {!isMobile && 'Exit Edit'}
                </Button>
                
                <Button 
                  onClick={onSave} 
                  variant="outline" 
                  size={isMobile ? "sm" : "sm"}
                  className={`${isMobile ? 'w-10 h-10 p-0' : 'gap-2'} ${isMobile ? 'flex-shrink-0' : ''}`}
                >
                  <Save className="w-4 h-4" />
                  {!isMobile && 'Save'}
                </Button>
                
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size={isMobile ? "sm" : "sm"}
                      className={`${isMobile ? 'w-10 h-10 p-0' : ''} ${isMobile ? 'flex-shrink-0' : ''}`}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh] overflow-y-auto' : 'max-w-md'}`}>
                    <DialogHeader>
                      <DialogTitle>Page Settings</DialogTitle>
                    </DialogHeader>
                    <PageSettingsPanel 
                      layout={layout}
                      onLayoutChange={onLayoutChange}
                      pageTitle={pageTitle}
                      onPageTitleChange={onPageTitleChange}
                      pageDescription={pageDescription}
                      onPageDescriptionChange={onPageDescriptionChange}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              
              {!isMobile && (
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    <Monitor className="w-3 h-3" />
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Widget Palette */}
        {isEditMode && (
          <div className={`
            fixed z-40 bg-white/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden
            ${isMobile 
              ? 'bottom-20 left-2 right-2 max-h-48' 
              : 'left-4 top-20 w-64 max-h-80'
            }
          `}>
            <div className="p-3 border-b bg-gray-50/80">
              <div className="text-sm font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Widgets
              </div>
            </div>
            
            <div className="p-2 overflow-y-auto max-h-full">
              <div className={`grid gap-1 ${isMobile ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {availableWidgets.map((widget) => (
                  <Button
                    key={widget.id}
                    variant="ghost"
                    size="sm"
                    className={`justify-start h-auto p-2 hover:bg-blue-50 ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}
                    onClick={() => handleAddWidget(widget, layout.type === 'tabs' ? activeTab : undefined)}
                  >
                    <div className="text-left w-full">
                      <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {widget.title}
                      </div>
                      <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        {widget.category}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`${isEditMode ? (isMobile ? 'pb-64' : 'pb-32') : ''}`}>
          {/* Page Header */}
          <div className={`p-4 border-b ${isMobile ? 'px-2' : ''}`}>
            {isEditMode ? (
              <div className="space-y-2">
                <Input
                  value={pageTitle}
                  onChange={(e) => onPageTitleChange(e.target.value)}
                  className={`font-bold border-dashed ${isMobile ? 'text-lg' : 'text-2xl'}`}
                  placeholder="Page Title"
                />
                {onPageDescriptionChange && (
                  <Textarea
                    value={pageDescription || ''}
                    onChange={(e) => onPageDescriptionChange(e.target.value)}
                    className="border-dashed text-sm"
                    placeholder="Page Description"
                    rows={isMobile ? 1 : 2}
                  />
                )}
              </div>
            ) : (
              <div>
                <h1 className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{pageTitle}</h1>
                {pageDescription && (
                  <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>{pageDescription}</p>
                )}
              </div>
            )}
          </div>

          {/* Layout Content */}
          {layout.type === 'tabs' ? (
            <div className={`p-4 ${isMobile ? 'px-2' : ''}`}>
              <div className={`${isMobile ? 'space-y-3' : 'flex items-center justify-between'} mb-4`}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                  <TabsList className={`${isMobile ? 'w-full flex-wrap h-auto p-1 gap-1' : ''}`}>
                    {layout.tabs?.map((tab) => (
                      <TabsTrigger 
                        key={tab.id} 
                        value={tab.id}
                        className={`${isMobile ? 'flex-1 min-w-0 text-xs px-2 py-1.5' : ''}`}
                      >
                        {isEditMode ? (
                          <Input
                            value={tab.title}
                            onChange={(e) => handleUpdateTab(tab.id, { title: e.target.value })}
                            className={`border-none p-0 h-auto bg-transparent text-center ${
                              isMobile ? 'text-xs' : 'text-sm'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate">{tab.title}</span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                
                {isEditMode && (
                  <div className={`flex items-center gap-2 ${isMobile ? 'justify-center' : ''}`}>
                    <Button onClick={handleAddTab} variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                      {!isMobile && 'Tab'}
                    </Button>
                    {layout.tabs && layout.tabs.length > 1 && (
                      <Button 
                        onClick={() => handleDeleteTab(activeTab)} 
                        variant="outline" 
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        {!isMobile && 'Delete'}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <WidgetGrid
                widgets={currentTabWidgets}
                columns={layout.columns}
                isEditMode={isEditMode}
                onUpdateWidget={handleUpdateWidget}
                onDeleteWidget={handleDeleteWidget}
              />
            </div>
          ) : (
            <div className={`p-4 ${isMobile ? 'px-2' : ''}`}>
              <WidgetGrid
                widgets={currentTabWidgets}
                columns={layout.columns}
                isEditMode={isEditMode}
                onUpdateWidget={handleUpdateWidget}
                onDeleteWidget={handleDeleteWidget}
              />
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}

const WidgetGrid: React.FC<{
  widgets: WidgetInstance[];
  columns: number;
  isEditMode: boolean;
  onUpdateWidget: (widget: WidgetInstance) => void;
  onDeleteWidget: (widgetId: string) => void;
}> = ({ widgets, columns, isEditMode, onUpdateWidget, onDeleteWidget }) => {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  
  // Force single column on mobile for better usability
  const effectiveColumns = isMobile ? 1 : columns;
  
  return (
    <div 
      className={`grid gap-4 ${isMobile ? 'px-2' : ''}`}
      style={{ 
        gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`,
        gridAutoRows: isMobile ? 'minmax(150px, auto)' : 'minmax(200px, auto)'
      }}
    >
      {widgets.map((widget) => (
        <DraggableWidget
          key={widget.id}
          widget={widget}
          onUpdate={onUpdateWidget}
          onDelete={onDeleteWidget}
          isEditMode={isEditMode}
        />
      ))}
      
      {isEditMode && widgets.length === 0 && (
        <div className={`col-span-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg ${
          isMobile ? 'h-48' : 'h-64'
        }`}>
          <div className="text-center text-muted-foreground">
            <Layout className={`mx-auto mb-2 ${isMobile ? 'w-8 h-8' : 'w-12 h-12'}`} />
            <p className={`${isMobile ? 'text-sm px-4' : ''}`}>
              {isMobile ? 'Tap widgets below to add them' : 'Drag widgets here to start building your page'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const PageSettingsPanel: React.FC<{
  layout: PageLayout;
  onLayoutChange: (layout: PageLayout) => void;
  pageTitle: string;
  onPageTitleChange: (title: string) => void;
  pageDescription?: string;
  onPageDescriptionChange?: (description: string) => void;
}> = ({ layout, onLayoutChange, pageTitle, onPageTitleChange, pageDescription, onPageDescriptionChange }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Page Title</Label>
        <Input
          value={pageTitle}
          onChange={(e) => onPageTitleChange(e.target.value)}
          placeholder="Enter page title"
        />
      </div>

      {onPageDescriptionChange && (
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={pageDescription || ''}
            onChange={(e) => onPageDescriptionChange(e.target.value)}
            placeholder="Enter page description"
            rows={3}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Layout Type</Label>
        <Select
          value={layout.type}
          onValueChange={(value: any) => onLayoutChange({ ...layout, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid Layout</SelectItem>
            <SelectItem value="tabs">Tabs Layout</SelectItem>
            <SelectItem value="dashboard">Dashboard Layout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Columns</Label>
        <Select
          value={layout.columns.toString()}
          onValueChange={(value) => onLayoutChange({ ...layout, columns: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Column</SelectItem>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Settings</Label>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="responsive" className="text-sm">Responsive</Label>
          <Switch
            id="responsive"
            checked={layout.settings.responsive}
            onCheckedChange={(checked) => 
              onLayoutChange({ 
                ...layout, 
                settings: { ...layout.settings, responsive: checked }
              })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="mobile-optimized" className="text-sm">Mobile Optimized</Label>
          <Switch
            id="mobile-optimized"
            checked={layout.settings.mobileOptimized}
            onCheckedChange={(checked) => 
              onLayoutChange({ 
                ...layout, 
                settings: { ...layout.settings, mobileOptimized: checked }
              })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-header" className="text-sm">Show Header</Label>
          <Switch
            id="show-header"
            checked={layout.settings.showHeader}
            onCheckedChange={(checked) => 
              onLayoutChange({ 
                ...layout, 
                settings: { ...layout.settings, showHeader: checked }
              })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-filters" className="text-sm">Show Filters</Label>
          <Switch
            id="show-filters"
            checked={layout.settings.showFilters}
            onCheckedChange={(checked) => 
              onLayoutChange({ 
                ...layout, 
                settings: { ...layout.settings, showFilters: checked }
              })
            }
          />
        </div>
      </div>
    </div>
  );
};