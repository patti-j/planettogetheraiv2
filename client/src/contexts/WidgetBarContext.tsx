import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface Widget {
  id: string;
  type: string;
  title: string;
  config: any;
  size: 'small' | 'medium' | 'large';
  priority: number;
  isVisible: boolean;
}

interface WidgetBarSettings {
  position: 'top' | 'bottom' | 'left' | 'right';
  isCollapsed: boolean;
  isVisible: boolean;
  widgets: Widget[];
}

interface WidgetBarContextType {
  settings: WidgetBarSettings;
  updatePosition: (position: 'top' | 'bottom' | 'left' | 'right') => void;
  toggleCollapse: () => void;
  toggleVisibility: () => void;
  updateWidgets: (widgets: Widget[]) => void;
  addWidget: (widget: Widget) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
}

const defaultSettings: WidgetBarSettings = {
  position: 'top',
  isCollapsed: false,
  isVisible: true,
  widgets: [
    {
      id: 'production-kpis',
      type: 'custom-kpi',
      title: 'Production KPIs',
      config: { 
        view: 'compact', 
        showTrends: true, 
        showTargets: true, 
        maxKPIs: 4,
        kpis: ['oee', 'yield', 'throughput', 'downtime'] 
      },
      size: 'large',
      priority: 1,
      isVisible: true
    },
    {
      id: 'quality-metrics',
      type: 'custom-kpi',
      title: 'Quality Metrics',
      config: { 
        view: 'compact', 
        showTrends: true, 
        showTargets: false, 
        maxKPIs: 3,
        kpis: ['first-pass-yield', 'defect-rate', 'customer-complaints'] 
      },
      size: 'medium',
      priority: 2,
      isVisible: true
    },
    {
      id: 'cost-tracking',
      type: 'custom-kpi',
      title: 'Cost Tracking',
      config: { 
        view: 'compact', 
        showTrends: true, 
        showTargets: true, 
        maxKPIs: 2,
        kpis: ['cost-per-unit', 'material-cost-variance'] 
      },
      size: 'medium',
      priority: 3,
      isVisible: true
    }
  ]
};

const WidgetBarContext = createContext<WidgetBarContextType | undefined>(undefined);

export const useWidgetBar = () => {
  const context = useContext(WidgetBarContext);
  if (!context) {
    throw new Error('useWidgetBar must be used within a WidgetBarProvider');
  }
  return context;
};

interface WidgetBarProviderProps {
  children: React.ReactNode;
}

export const WidgetBarProvider: React.FC<WidgetBarProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<WidgetBarSettings>(defaultSettings);

  // Load widget bar settings from user preferences
  const { data: preferences } = useQuery({
    queryKey: [`/api/user-preferences/${user?.id}`],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (preferences?.dashboardLayout?.widgetBarSettings) {
      setSettings(preferences.dashboardLayout.widgetBarSettings);
    }
  }, [preferences]);

  // Save widget bar settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: WidgetBarSettings) => {
      const updatedPreferences = {
        ...preferences,
        dashboardLayout: {
          ...preferences?.dashboardLayout,
          widgetBarSettings: newSettings
        }
      };
      return apiRequest('PUT', '/api/user-preferences', updatedPreferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-preferences/${user?.id}`] });
    }
  });

  const updatePosition = (position: 'top' | 'bottom' | 'left' | 'right') => {
    const newSettings = { ...settings, position };
    setSettings(newSettings);
    saveSettingsMutation.mutate(newSettings);
  };

  const toggleCollapse = () => {
    const newSettings = { ...settings, isCollapsed: !settings.isCollapsed };
    setSettings(newSettings);
    saveSettingsMutation.mutate(newSettings);
  };

  const toggleVisibility = () => {
    const newSettings = { ...settings, isVisible: !settings.isVisible };
    setSettings(newSettings);
    saveSettingsMutation.mutate(newSettings);
  };

  const updateWidgets = (widgets: Widget[]) => {
    const newSettings = { ...settings, widgets };
    setSettings(newSettings);
    saveSettingsMutation.mutate(newSettings);
  };

  const addWidget = (widget: Widget) => {
    const newWidgets = [...settings.widgets, widget];
    updateWidgets(newWidgets);
  };

  const removeWidget = (widgetId: string) => {
    const newWidgets = settings.widgets.filter(w => w.id !== widgetId);
    updateWidgets(newWidgets);
  };

  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const newWidgets = settings.widgets.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    );
    updateWidgets(newWidgets);
  };

  return (
    <WidgetBarContext.Provider value={{
      settings,
      updatePosition,
      toggleCollapse,
      toggleVisibility,
      updateWidgets,
      addWidget,
      removeWidget,
      updateWidget
    }}>
      {children}
    </WidgetBarContext.Provider>
  );
};

export default WidgetBarContext;