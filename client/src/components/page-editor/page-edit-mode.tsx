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
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: { id: widget.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isEditMode,
  });

  const [, drop] = useDrop({
    accept: 'widget',
    hover: (item: { id: string }) => {
      // Handle reordering logic here
    },
  });

  return (
    <div
      ref={isEditMode ? (node) => drag(drop(node)) : undefined}
      className={`relative border-2 ${
        isEditMode ? 'border-dashed border-blue-300 hover:border-blue-500' : 'border-transparent'
      } ${isDragging ? 'opacity-50' : ''} transition-all duration-200`}
      style={{
        gridColumn: `span ${widget.position.w}`,
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
        {/* Edit Mode Toggle Bar */}
        <div className={`
          fixed ${isMobile ? 'bottom-4 left-4 right-4' : 'top-4 right-4'} 
          z-50 bg-white/95 backdrop-blur-sm border rounded-lg p-2 shadow-lg
          ${isEditMode ? 'ring-2 ring-blue-500' : ''}
        `}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={onToggleEditMode}
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                {isEditMode ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isEditMode ? 'Exit Edit' : 'Edit Page'}
              </Button>
              
              {isEditMode && (
                <>
                  <Button onClick={onSave} variant="outline" size="sm" className="gap-2">
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  
                  <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
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
                </>
              )}
            </div>
            
            {isEditMode && (
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  {isMobile ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Widget Palette */}
        {isEditMode && (
          <div className={`
            fixed ${isMobile ? 'bottom-20 left-4 right-4' : 'left-4 top-20'} 
            z-40 bg-white/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg
            ${isMobile ? 'max-h-40' : 'max-h-80'} overflow-y-auto
          `}>
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Widgets
            </div>
            
            <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {availableWidgets.map((widget) => (
                <Button
                  key={widget.id}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-auto p-2"
                  onClick={() => handleAddWidget(widget, layout.type === 'tabs' ? activeTab : undefined)}
                >
                  <div>
                    <div className="font-medium">{widget.title}</div>
                    <div className="text-muted-foreground">{widget.category}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`${isEditMode ? 'pb-32' : ''}`}>
          {/* Page Header */}
          <div className="p-4 border-b">
            {isEditMode ? (
              <div className="space-y-2">
                <Input
                  value={pageTitle}
                  onChange={(e) => onPageTitleChange(e.target.value)}
                  className="text-2xl font-bold border-dashed"
                  placeholder="Page Title"
                />
                {onPageDescriptionChange && (
                  <Textarea
                    value={pageDescription || ''}
                    onChange={(e) => onPageDescriptionChange(e.target.value)}
                    className="border-dashed"
                    placeholder="Page Description"
                    rows={2}
                  />
                )}
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold">{pageTitle}</h1>
                {pageDescription && (
                  <p className="text-muted-foreground">{pageDescription}</p>
                )}
              </div>
            )}
          </div>

          {/* Layout Content */}
          {layout.type === 'tabs' ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    {layout.tabs?.map((tab) => (
                      <TabsTrigger key={tab.id} value={tab.id}>
                        {isEditMode ? (
                          <Input
                            value={tab.title}
                            onChange={(e) => handleUpdateTab(tab.id, { title: e.target.value })}
                            className="border-none p-0 h-auto text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          tab.title
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                
                {isEditMode && (
                  <div className="flex items-center gap-2">
                    <Button onClick={handleAddTab} variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                    {layout.tabs && layout.tabs.length > 1 && (
                      <Button 
                        onClick={() => handleDeleteTab(activeTab)} 
                        variant="outline" 
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
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
            <div className="p-4">
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
  return (
    <div 
      className={`grid gap-4`}
      style={{ 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridAutoRows: 'minmax(200px, auto)'
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
        <div className="col-span-full flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center text-muted-foreground">
            <Layout className="w-12 h-12 mx-auto mb-2" />
            <p>Drag widgets here to start building your page</p>
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