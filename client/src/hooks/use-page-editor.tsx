import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export interface PageLayout {
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
  createdAt?: string;
  updatedAt?: string;
}

export interface TabDefinition {
  id: string;
  title: string;
  icon?: string;
  widgets: WidgetInstance[];
  visible: boolean;
}

export interface WidgetInstance {
  id: string;
  widgetId: string;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  configuration: Record<string, any>;
  visible: boolean;
  tabId?: string;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  type: string;
  description: string;
  category: string;
  defaultSize: { w: number; h: number };
  configSchema: any;
}

export function usePageEditor(pageId?: string) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Default layout structure
  const defaultLayout: PageLayout = {
    id: pageId || `page_${Date.now()}`,
    title: 'New Page',
    description: '',
    type: 'grid',
    columns: 2,
    rows: 3,
    widgets: [],
    settings: {
      responsive: true,
      mobileOptimized: true,
      showHeader: true,
      showFilters: true,
      theme: 'auto'
    }
  };

  const [layout, setLayout] = useState<PageLayout>(defaultLayout);

  // Fetch page layout
  const { data: pageData, isLoading: isLoadingPage } = useQuery({
    queryKey: ['/api/pages', pageId],
    enabled: !!pageId
  });

  useEffect(() => {
    if (pageData) {
      setLayout(pageData);
    }
  }, [pageData]);

  // Fetch available widgets - use default definitions for now
  const availableWidgets = DEFAULT_WIDGET_DEFINITIONS;
  const isLoadingWidgets = false;

  // Save page mutation
  const savePageMutation = useMutation({
    mutationFn: async (pageLayout: PageLayout) => {
      const method = pageId ? 'PUT' : 'POST';
      const url = pageId ? `/api/pages/${pageId}` : '/api/pages';
      
      const response = await apiRequest(method, url, {
        ...pageLayout,
        updated_at: new Date().toISOString()
      });
      
      return response.json();
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      if (pageId) {
        queryClient.invalidateQueries({ queryKey: ['/api/pages', pageId] });
      }
    }
  });

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && isEditMode) {
      const autoSaveTimer = setTimeout(() => {
        handleSave();
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [layout, hasUnsavedChanges, isEditMode]);

  const handleLayoutChange = (newLayout: PageLayout) => {
    setLayout(newLayout);
    setHasUnsavedChanges(true);
  };

  // Rename to avoid conflict with production schedule's handleLayoutChange
  const handlePageLayoutChange = handleLayoutChange;

  const handleTitleChange = (title: string) => {
    setLayout(prev => ({ ...prev, title }));
    setHasUnsavedChanges(true);
  };

  const handleDescriptionChange = (description: string) => {
    setLayout(prev => ({ ...prev, description }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      await savePageMutation.mutateAsync(layout);
    } catch (error) {
      console.error('Failed to save page:', error);
    }
  };

  const toggleEditMode = () => {
    if (isEditMode && hasUnsavedChanges) {
      const shouldSave = window.confirm('You have unsaved changes. Would you like to save them?');
      if (shouldSave) {
        handleSave();
      }
    }
    setIsEditMode(!isEditMode);
  };

  const addWidget = (widgetDef: WidgetDefinition, tabId?: string) => {
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

    setLayout(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }));
    setHasUnsavedChanges(true);
  };

  const updateWidget = (updatedWidget: WidgetInstance) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w)
    }));
    setHasUnsavedChanges(true);
  };

  const removeWidget = (widgetId: string) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId)
    }));
    setHasUnsavedChanges(true);
  };

  const addTab = () => {
    const newTab: TabDefinition = {
      id: `tab_${Date.now()}`,
      title: `Tab ${(layout.tabs?.length || 0) + 1}`,
      widgets: [],
      visible: true
    };

    setLayout(prev => ({
      ...prev,
      tabs: [...(prev.tabs || []), newTab]
    }));
    setHasUnsavedChanges(true);
  };

  const updateTab = (tabId: string, updates: Partial<TabDefinition>) => {
    setLayout(prev => ({
      ...prev,
      tabs: prev.tabs?.map(tab => tab.id === tabId ? { ...tab, ...updates } : tab)
    }));
    setHasUnsavedChanges(true);
  };

  const removeTab = (tabId: string) => {
    setLayout(prev => ({
      ...prev,
      tabs: prev.tabs?.filter(tab => tab.id !== tabId),
      widgets: prev.widgets.filter(w => w.tabId !== tabId)
    }));
    setHasUnsavedChanges(true);
  };

  const duplicatePage = async () => {
    const duplicatedLayout = {
      ...layout,
      id: `page_${Date.now()}`,
      title: `${layout.title} (Copy)`,
      widgets: layout.widgets.map(widget => ({
        ...widget,
        id: `widget_${Date.now()}_${Math.random()}`
      }))
    };

    try {
      await savePageMutation.mutateAsync(duplicatedLayout);
      return duplicatedLayout;
    } catch (error) {
      console.error('Failed to duplicate page:', error);
      throw error;
    }
  };

  return {
    // State
    isEditMode,
    layout,
    hasUnsavedChanges,
    availableWidgets,
    isLoading: isLoadingPage || isLoadingWidgets,
    isSaving: savePageMutation.isPending,

    // Actions
    toggleEditMode,
    handleLayoutChange: handlePageLayoutChange,
    handleTitleChange,
    handleDescriptionChange,
    handleSave,
    addWidget,
    updateWidget,
    removeWidget,
    addTab,
    updateTab,
    removeTab,
    duplicatePage
  };
}

// Default widget definitions for common use cases
export const DEFAULT_WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: 'gantt-chart',
    title: 'Gantt Chart',
    type: 'gantt',
    description: 'Visual timeline for production orders',
    category: 'Scheduling',
    defaultSize: { w: 4, h: 3 },
    configSchema: {}
  },
  {
    id: 'operation-sequencer',
    title: 'Operation Sequencer',
    type: 'sequencer',
    description: 'Drag and drop operation ordering',
    category: 'Operations',
    defaultSize: { w: 2, h: 4 },
    configSchema: {}
  },
  {
    id: 'production-metrics',
    title: 'Production Metrics',
    type: 'metrics',
    description: 'Key performance indicators',
    category: 'Analytics',
    defaultSize: { w: 3, h: 2 },
    configSchema: {}
  },
  {
    id: 'resource-assignment',
    title: 'Resource Assignment',
    type: 'resources',
    description: 'Resource allocation and utilization',
    category: 'Resources',
    defaultSize: { w: 2, h: 3 },
    configSchema: {}
  },
  {
    id: 'inventory-levels',
    title: 'Inventory Levels',
    type: 'inventory',
    description: 'Stock levels and material tracking',
    category: 'Inventory',
    defaultSize: { w: 2, h: 2 },
    configSchema: {}
  },
  {
    id: 'quality-dashboard',
    title: 'Quality Dashboard',
    type: 'quality',
    description: 'Quality metrics and control charts',
    category: 'Quality',
    defaultSize: { w: 3, h: 2 },
    configSchema: {}
  },
  {
    id: 'equipment-status',
    title: 'Equipment Status',
    type: 'equipment',
    description: 'Equipment health and maintenance',
    category: 'Maintenance',
    defaultSize: { w: 2, h: 2 },
    configSchema: {}
  }
];